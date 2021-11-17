const avro = require('avro-js');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

class Engagement {
    constructor(settings) {
        this.serviceAccount = settings.serviceAccount;
        this.decryptionKey = settings.decryptionKey;
        this.projectID = this.decryptionKey ? '' : settings.projectID;
        this.metadataFileNamePrefix = 'metadata';
        this.customersSubFolder = 'customers';
        this.avroFileExtenssion = '.avro';
        this.serviceAccountFilePath;
        this.tenantID = settings.tenantID;
        this.bucketName = settings.bucketName;
        this.customersFolderPath = settings.customersFolderPath;
        this.metadataFilePath = settings.metadataFilePath;
        this.envExt = process.env.NODE_ENV == 'production' ? 'us' : 'dev';
        this.uploadBucketName = `optihub-campaigns-files-${this.envExt}`;
    }    

    // Public methods
    async getMetaData() {
        try {
            const filesInfo = await this._getFiles(this.metadataFilePath, false);

            if (!filesInfo || !filesInfo.length)
                throw `Metadata for folder ${this.metadataFilePath} does not exist`;

            let fileStream = filesInfo.find(file => file.name.includes(this.metadataFileNamePrefix));
            let json = await this._downloadFile(fileStream.name, false);

            if (!json)
                throw new Error('metadata is emprty or doesnt exist');

            json = {
                actionID: json.ActionID,
                actionName: json.ActionName,
                campaignID: json.CampaignID,
                campaignPlanID: json.CampaignPlanID,
                channelID: json.ChannelID,
                channelName: json.ChannelName,
                engagementID: json.EngagementID,
                numberOfCustomers: json.NumberOfCustomers,
                numberOfFiles: json.NumberOfFiles,
                planDetailChannelID: json.PlanDetailChannelID,
                promotions: json.Promotions,                
                scheduledTime: json.ScheduledTime,
                targetGroupName: json.TargetGroupName,
                templateID: parseInt(json.TemplateID),
                templateName: json.TemplateName,
                tenantID: parseInt(this.tenantID),
                bucketName: this.bucketName,
                customersFolderPath: this.customersFolderPath,
                metadataFilePath: this.metadataFilePath,
                duration: json.Duration
            }

            console.log('Metadata successfully received - new');

            return json;
        }
        catch (err) {
            console.error('Couldn\'t receive a metadata', err);
            throw err;
        }
    }

    async getCustomersBatches() {       
        try {
            const files = await this._getFiles(this.customersFolderPath);

            const batches = files.map((file) => {
                // for testing file.id = 'customers%2abcd%2F123.json'
                const index = file.id.lastIndexOf('%2F');
    
                return {
                    name: file.name,
                    id: file.id.substring(index + 1).split('2F')[1]
                }
            })
    
            return batches;
        } 
        catch (err) {
            throw err.toString();
        }
    }

    async getCustomersByBatch(batch) {
        try {                
            let fileStream = await this._downloadFile(batch, true);
            return fileStream;    
        }
        catch (err) {
            throw err.toString();
        }
    }

    async getCampaignFileStream(fileName) {
        try {            
            const _storage = await this._getStorage();
            const stream = await _storage.bucket(this.uploadBucketName).file(fileName).createReadStream();
            return stream;
        }
        catch (err) {
            throw err.message;
        }
    }

    async uploadFile(stream, path) {
       return new Promise(async (resolve, reject) => {
            const _storage = await this._getStorage();
            const blobStream = _storage.bucket(this.uploadBucketName).file(path).createWriteStream();

            stream.pipe(blobStream)
            .on('error', function(err) {
                console.log(err);
                reject(err);
            })
            .on('finish', function() {
                resolve();
            });
        })
    }

    // Private methods
    _getStorage() {
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.storage) {
                    const rand = Date.now() + '-' + Math.random().toString(36).substring(7);
                    const serviceAccountString = Buffer.from(this.serviceAccount, 'base64').toString('ascii');
                    const fileLocation = path.join(__dirname, '..', 'accounts');                    
                    const filePath = path.join(fileLocation, `googleAccount.json`);
    
                    if (!fs.existsSync(fileLocation)){
                        fs.mkdirSync(fileLocation);
                    }                   

                    fs.writeFile(filePath, serviceAccountString, async() => {
                        this.serviceAccountFilePath = filePath;
        
                        this.storage = await this._initStorage();
                        resolve(this.storage);
                    })
                }
                else {
                    resolve(this.storage);
                }
            }
            catch (err) {
                reject(`_getStorage error - ${err}`);
            }
        })
    }

    _initStorage() {
        return new Promise((resolve, reject) => {
            const storage = new Storage({
                projectId: this.projectID,
                keyFilename: this.serviceAccountFilePath
            });

            resolve(storage);
        })
    }
    
    async _getCustomersBatchFile(batchName) {
        try {
            const file = await this._getFiles(batchName);
            return file[0];
        }
        catch (err) {
            throw err;
        }
    }

    _downloadFile(srcFileName, isAvro) {   
        return new Promise(async (resolve, reject) => {
            let stream;
            let jsonString = '';
            
            const options = {
                // destination: destFileName
            };
            
            try {
                const _storage = await this._getStorage();

                if (this.decryptionKey) {
                    console.log(`Downloading secured file, bucket name: ${this.bucketName}, fileName: ${srcFileName}`);
                    stream = await _storage.bucket(this.bucketName).file(srcFileName).setEncryptionKey(Buffer.from(this.decryptionKey, 'base64')).createReadStream();
                    console.log(`Done downloading secured file, bucket name: ${this.bucketName}, fileName: ${srcFileName}`);
                }
                else {
                    console.log(`Downloading not secured file, bucket name: ${this.bucketName}, fileName: ${srcFileName}`);
                    stream = await _storage.bucket(this.bucketName).file(srcFileName).createReadStream();
                    console.log(`Done downloading not secured file, bucket name: ${this.bucketName}, fileName: ${srcFileName}`);
                }
            }
            catch (err) {
                console.error('Error downloading file', err);
                reject(err);
            }
    
            try {
                if (isAvro) {
                    resolve(stream.pipe(new avro.streams.BlockDecoder()))
                }
                else {
                    stream
                    .on('error', (err) => {
                        reject(err);
                    })
                    .on('data', (item) => {                   
                        jsonString += item.toString();
                    })
                    .on('end', () => {
                        resolve(JSON.parse(jsonString));
                    })
                }
            }
            catch(err) {
                reject(err);
            }
        })    
    }

    async _getFiles(prefix, avroOnly = true) {
        // Get file should get the list of a content folder with all files streams, just need to take (filter) the avros files

        try {
            const _storage = await this._getStorage();

            const options = {
                prefix
            };
    
            const [files] = await _storage.bucket(`${this.bucketName}`).getFiles(options);
    
            const fileInfo = avroOnly? files.filter(file => file.name.includes(this.avroFileExtenssion)): files;
            return fileInfo;
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = Engagement;