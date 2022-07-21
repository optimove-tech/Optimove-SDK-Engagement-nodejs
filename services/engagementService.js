const avro = require('avro-js');
const { Storage } = require('@google-cloud/storage');
class Engagement {
    constructor(settings) {
        this._validateSettings(settings);        
        this.serviceAccount = settings.serviceAccount;
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

    // old 1
    async getCustomersBatches() {       
        try {
            console.log(`getCustomersBatches started - for path: ${this.customersFolderPath}`)
            const files = await this._getFiles(this.customersFolderPath);
            console.log(`getCustomersBatches ended - for path: ${this.customersFolderPath}`)

            console.log(`Fetched files: ${JSON.stringify(files)}`);

            const batches = files.map((file) => {
                // for testing file.id = 'customers%2abcd%2F123.json'
                const index = file.id.lastIndexOf('%2F');
    
                return {
                    name: file.name,
                    id: file.id.substring(index + 1).split('2F')[1]
                }
            })

            console.log(`Mapped files result: ${JSON.stringify(batches)}`);
            return batches;
        } 
        catch (err) {
            throw err.toString();
        }
    }

    // new 1
    async getCustomersBatchesNumber() {
        try {
            if (this.customersBatches && this.customersBatches.length)
                return this.customersBatches.length;

            const files = await this._getFiles(this.customersFolderPath);

            const batches = files.map((file) => {
                // for testing file.id = 'customers%2abcd%2F123.json'
                const index = file.id.lastIndexOf('%2F');
    
                return {
                    name: file.name,
                    id: file.id.substring(index + 1).split('2F')[1]
                }
            })

            this.customersBatches = batches;
            return batches.length;
        } 
        catch (err) {
            throw err.toString();
        }
    }

    async getFileMetadata(fileName) {
        try {
            const uploadBucketName = this._getUploadBucketName();
            const _storage = this._getStorage();
            const [metadata] = await _storage.bucket(uploadBucketName).file(fileName).getMetadata();
            return metadata;
        }
        catch (err) {
            throw err.message;
        }
    }

    // old 2
    async getCustomersByBatch(batch) {
        try {                
            let fileStream = await this._getFileStream(batch, true);
            return fileStream;    
        }
        catch (err) {
            throw err.toString();
        }
    }

    // new 2
    async getCustomersByBatchID(batchID) {
        try {
            const batchIndex = batchID-1;
            if (typeof batchIndex == "undefined") throw 'BatchIndex is mandatory';
            if (!this.customersBatches || !this.customersBatches.length) throw 'Call the method getCustomersBatchesNumber before calling this method';

            const batchObj = this.customersBatches[batchIndex];
            if (!batchObj) throw `Customers file with index number ${batchIndex} does not exist`;

            let fileStream = await this._getFileStream(batchObj.name, true);
            return fileStream;    
        }
        catch (err) {
            throw err.toString();
        }
    }

    // For uploaded files
    async getCampaignFileStream(fileName) {
        try {            
            const uploadBucketName = this._getUploadBucketName();
            const _storage = this._getStorage();
            const stream = _storage.bucket(uploadBucketName).file(fileName).createReadStream();
            return stream;
        }
        catch (err) {
            throw err.message;
        }
    }

    async _getGoogleWriteableStream(bucketName, filePath) {
        try {                       
            const _storage = this._getStorage();
            return _storage.bucket(bucketName).file(filePath).createWriteStream();
        }
        catch (err) {
            throw err.message;
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

    // Private methods
    _getUploadBucketName() {
        let uploadBucketName;

        if (process.env.NODE_ENV == 'production') {
            if (this.bucketName == 'optigration-internal-eu') {
                uploadBucketName = 'optihub-campaigns-files-eu';
            }
            if (this.bucketName == 'optigration-internal-us') {
                uploadBucketName = 'optihub-campaigns-files-us';
            }
            else {
                throw `Bucket is not EU/US envirement, Bucket: ${this.bucketName}`;
            }
        }
        else {
            uploadBucketName = 'optihub-campaigns-files-dev';
        }

        return uploadBucketName;
    }

    _validateSettings(settings) {
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
            let options = { timeout: 0 };

            if (!this.storage) {
                this.storage = new Storage(options);
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
                    const streamDecoded = stream.pipe(decoder);

                    streamDecoded.on('error', (err) => {
                        console.error(`streamDecoded error! ${JSON.stringify(err)}`);
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