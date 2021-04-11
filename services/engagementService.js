var avro = require('avro-js');
const config = require('config');
const { Storage } = require('@google-cloud/storage');
const googleCloudConfig = require('config').get('googleCloud');
const path = require('path');

class Engagement {
    constructor(settings) {
        this.serviceAccount = settings.serviceAccount;
        this.decryptionKey = settings.decryptionKey;
        this.bucketName = settings.folderPath;
    }    

    // Public methods
    async getMetaData() {
        try {
            const filesInfo = await this._getFiles();
            let fileStream = filesInfo.find(file => file.name.includes(config.metadataFileNamePrefix));
            let json = await this._downloadFile(fileStream.name);
    
            return json;
        }
        catch (err) {
            throw err.message;
        }
    }

    async getCustomersBatches() {       
        try {
            const files = await this._getFiles(config.customersSubFolder);

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
    get _storage() {
        const keyFileName = path.join(__dirname, this.serviceAccount);

        const storage = new Storage({
            projectId: googleCloudConfig.projectId,
            keyFilename: keyFileName
        });

        return storage;
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
                if (this.decryptionKey) {
                    console.log('Downloading secured file');
                    console.log('decryptionKey:', this.decryptionKey);
                    stream = await this._storage.bucket(this.bucketName).file(srcFileName).setEncryptionKey(Buffer.from(this.decryptionKey, 'base64')).createReadStream();
                }
                else {
                    console.log('Downloading not secured file');
                    stream = await this._storage.bucket(this.bucketName).file(srcFileName).createReadStream();
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
            const options = {
                prefix: prefix || '',
            };
    
            const [files] = await this._storage.bucket(`${this.bucketName}`).getFiles(options);
    
            const fileInfo = files.filter(file => file.name.includes(config.avroFileExtenssion));
            return fileInfo;
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = Engagement;