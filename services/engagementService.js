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
        this.metadataEncoding = 'utf8';
    }    

    // Public methods
    async getMetaData() {
        try {
            let json = await this._getMetadataStream(this.metadataFilePath);

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
                accountName: json.AccountName,
                identifier: json.Identifier,
                tags: json.Tags
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
        if (!batchID || isNaN(batchID) || batchID < 0)
            throw `batchID: ${batchID} is not valid.`;

        if (batchID < 10) {
            batchID = `00${batchID}`;
        }
        else if (batchID >= 10 && batchID < 100) {
            batchID = `0${batchID}`;
        }
        try {
            const fileName = `${this.customersFolderPath}/customers_file${batchID}.deflate.avro`;
            let fileStream = await this._getCustomersFileStream(fileName);
            return fileStream;    
        }
        catch (err) {
            throw err.toString();
        }
    }

    // Private methods
    _validateSettings(settings) {
        if (!settings || Object.keys(settings).length === 0) throw 'sdk settings are manadatory';
        if (!settings.tenantID) throw 'tenantID is manadatory';
        if (!settings.bucketName) throw 'bucketName is mandatory';
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

    _getCustomersFileStream(srcFileName) {   
        return new Promise((resolve, reject) => {
            const stream = this._downloadFileStream(srcFileName);
    
            try {
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
            catch(err) {
                console.error(`pipe error`);
                console.error(err);
                reject(err);
            }
        })    
    }

    _getMetadataStream(srcFileName) {
        return new Promise((resolve, reject) => {
            let jsonString = '';
            const stream = this._downloadFileStream(srcFileName);

            stream
            .on('error', (err) => {
                reject(err);
            })
            .on('data', (item) => {
                jsonString += item.toString(this.metadataEncoding);
            })
            .on('end', () => {
                try {
                    resolve(JSON.parse(jsonString));
                } 
                catch (error) {
                    reject(error);
                }
            })
        })
    }

    _downloadFileStream(srcFileName) {
        let stream;
        
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
            reject(err);
        }

        return stream;
    }
}

module.exports = Engagement;