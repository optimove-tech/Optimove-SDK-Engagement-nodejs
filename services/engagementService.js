const avro = require('avro-js');
const { Storage } = require('@google-cloud/storage');
class Engagement {
    constructor(settings) {
        this._validateSettings(settings);        
        this.decryptionKey = settings.decryptionKey;        
        this.metadataFileNamePrefix = 'metadata';        
        this.avroFileExtenssion = '.avro';
        this.tenantID = settings.tenantID;
        this.bucketName = settings.bucketName;
        this.customersFolderPath = settings.customersFolderPath;
        this.metadataFilePath = settings.metadataFilePath;        
        this.customersBatches;
    }    

    // Public methods
    async getMetaData() {
        try {
            const filesInfo = await this._getFiles(this.metadataFilePath, false);

            if (!filesInfo || !filesInfo.length)
                throw `Metadata for folder ${this.metadataFilePath} does not exist`;

            let fileStream = filesInfo.find(file => file.name.includes(this.metadataFileNamePrefix));
            let json = await this._getFileStream(fileStream.name, false);

            if (!json)
                throw new Error('metadata is empty or does not exist');

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
                duration: json.Duration,
                internalAccountID: json.InternalAccountID,
                accountName: json.AccountName
            }

            console.log('Metadata successfully received');
            return json;
        }
        catch (err) {
            console.error('Couldn\'t receive a metadata', err);
            throw err;
        }
    }   

    async getCustomersByBatchID(batchID) {     
        if (batchID < 10) {
            batchID = `00${batchID}`;
        } else if (batchID >= 10 && batchID < 100) {
            batchID = `0${batchID}`;
        }
        
        try {
            const fileName = `${this.customersFolderPath}/customers_file${batchID}.deflate.avro`;
            let fileStream = await this._getFileStream(fileName, true);
            return fileStream;    
        }
        catch (err) {
            throw err.toString();
        }
    }

    async uploadFile(stream, path) {
       return new Promise(async (resolve, reject) => {
            const _storage = this._getStorage();
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

    _validateSettings(settings) {
        if (!settings || Object.keys(settings).length === 0) throw 'sdk settings are manadatory';
        if (!settings.tenantID) throw 'tenantID is manadatory';
        if (!settings.bucketName) throw 'buckerName is mandatory';
        if (!settings.customersFolderPath) throw 'customersFolderPath is mandatory';
        if (!settings.metadataFilePath) throw 'metadataFilePath is mandatory';

        this.mode = settings.bucketName.includes('external') ? 'external' : 'internal';

        if (this.mode == 'external') {
            if (!settings.decryptionKey) throw 'decryptionKey is mandatory';
        }
    }

    _getStorage() {
        try {            
            if (!this.storage) {
                this.storage = new Storage();
            }
            
            return this.storage;
        }
        catch (err) {
            throw `_getStorage error - ${err}`;
        }
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

    _getFileStream(srcFileName, isAvro) {   
        return new Promise((resolve, reject) => {
            let stream;
            let jsonString = '';
            
            const options = {
                // destination: destFileName
            };
            
            try {
                const _storage = this._getStorage();
                const secured = this.decryptionKey ? "secured" : "not secured";
                const msg = `Downloading ${secured} file, bucket name: ${this.bucketName}, fileName: ${srcFileName}`;

                console.log(`Started ${msg}`);

                if (this.decryptionKey) {    
                    stream = _storage.bucket(this.bucketName).file(srcFileName).setEncryptionKey(Buffer.from(this.decryptionKey, 'base64')).createReadStream();
                }
                else {
                    stream = _storage.bucket(this.bucketName).file(srcFileName).createReadStream();  
                                 
                }
                console.log(`Done ${msg}`);
            }
            catch (err) {
                console.error('Error downloading file', err);
                reject(err);
            }
    
            try {
                // only customers files               
                if (isAvro) {
                    const decoder = new avro.streams.BlockDecoder();

                    decoder.on('error', (err) => {
                        console.error(`stream error!`);
                        console.error(err);
                    })    

                    stream.on('error', (err) => {
                        console.error(`stream error!`);
                        console.error(err);
                    })                    

                    const streamDecoded = stream.pipe(decoder);

                    streamDecoded.on('error', (err) => {
                        console.error(`streamDecoded error!`);
                        console.error(err);
                    })
                    
                    resolve(streamDecoded);
                }
                //only metadata file
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
        try {
            const _storage = this._getStorage();
            const options = { prefix };

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