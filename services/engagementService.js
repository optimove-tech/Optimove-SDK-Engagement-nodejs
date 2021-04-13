const avro = require('avro-js');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const { resolve } = require('path');
const settings = require('../settings.json');

class Engagement {
    constructor(settings) {
        this.serviceAccount = settings.serviceAccount || settings.serviceAccount;
        this.decryptionKey = settings.decryptionKey;
        this.bucketName = settings.folderPath;
        this.projectID = this.decryptionKey ? '' : settings.projectID;
        this.metadataFileNamePrefix = 'METADATA';
        this.customersSubFolder = 'customers';
        this.avroFileExtenssion = '.avro';
        this.serviceAccountFilePath;
    }    

    // Public methods
    async getMetaData() {
        try {
            const filesInfo = await this._getFiles();
            let fileStream = filesInfo.find(file => file.name.includes(this.metadataFileNamePrefix));
            let json = await this._downloadFile(fileStream.name);
            json = json[0];

            json = {
                channelID: json.ChannelID,
                channelName: json.ChannelName,
                engagementID: json.EngagementID,
                numberOfCustomers: json.NumberOfCustomers,
                numberOfFiles: json.NumberOfFiles,
                planDetailID: json.PlanDetailID,
                planID: json.PlanID,
                promotions: json.Promotions,
                scheduledTime: json.ScheduledTime,
                targetGroupName: json.TargetGroupName,
                templateID: json.TemplateID,
                templateName: json.TemplateName
            }

            return json
        }
        catch (err) {
            throw err.message;
        }
    }

    async getCustomersBatches() {       
        try {
            const files = await this._getFiles(this.customersSubFolder);

            const batches = files.map((file) => {
                // for testing file.id = 'customers%2Fasdas%2F123.json'
                const index = file.id.lastIndexOf('%2F');
    
                return {
                    name: file.name,
                    id: file.id.substring(index + 1).split('2F')[1]
                }
            })
    
            return batches;
        } 
        catch (err) {
            throw err.message;
        }
    }

    async getCustomersByBatch(batchName) {
        try {
            const customersBatchFile = await this._getCustomersBatchFile(batchName);
    
            let json = await this._downloadFile(customersBatchFile.name);
            return json;    
        }
        catch (err) {
            throw err.message;
        }
    }    

    // Private methods
    _getStorage() {
        return new Promise(async (resolve, reject) => {
            // const keyFileName = path.join(__dirname, '../../../', this.serviceAccount);

            if (!this.storage) {
                const rand = Date.now() + '-' + Math.random().toString(36).substring(7);
                const serviceAccountString = Buffer.from(this.serviceAccount, 'base64').toString('ascii');
                const filePath = `./accounts/${rand}.json`;
    
                fs.writeFile(filePath, serviceAccountString, async() => {
                    this.serviceAccountFilePath = filePath;
    
                    this.storage = await this._initStorage();
                    resolve(this.storage);
                })
            }
            else {
                resolve(this.storage);
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

    _downloadFile(srcFileName) {   
        return new Promise(async (resolve, reject) => {
            let stream;
            let jsonString = '';
            
            const options = {
                // destination: destFileName
            };
            
            try {
                const _storage = await this._getStorage();

                if (this.decryptionKey) {
                    console.log('Downloading secured file');
                    console.log('decryptionKey:', this.decryptionKey);
                    
                    stream = await _storage.bucket(this.bucketName).file(srcFileName).setEncryptionKey(Buffer.from(this.decryptionKey, 'base64')).createReadStream();
                }
                else {
                    console.log('Downloading not secured file');
                    stream = await _storage.bucket(this.bucketName).file(srcFileName).createReadStream();
                }
            }
            catch (err) {
                reject(err);
            }
    
            try {
                stream
                .on('error', (err) => {
                    reject(err);
                })
                .pipe(new avro.streams.BlockDecoder())
                .on('data', function (item) {                    
                    jsonString += JSON.stringify(item) + ',';
                })
                .on('end', () => {
                    //remove the last ',' adn add [] for creating an array
                    jsonString = "[" + jsonString.slice(0, -1) + "]";
                    resolve(JSON.parse(jsonString));
                })
                .on('error', (err) => {
                    reject(err);
                })
            }
            catch(err) {
                reject(err);
            }
        })    
    }

    async _getFiles(prefix) {
        // Get file should get the list of a content folder with all files streams, just need to take (filter) the avros files

        try {
            const _storage = await this._getStorage();

            const options = {
                prefix: prefix || '',
            };
    
            const [files] = await _storage.bucket(`${this.bucketName}`).getFiles(options);
    
            const fileInfo = files.filter(file => file.name.includes(this.avroFileExtenssion));
            return fileInfo;
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = Engagement;