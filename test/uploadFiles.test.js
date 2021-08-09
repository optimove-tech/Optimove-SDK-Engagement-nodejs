const expect = require('chai').expect;
const { Storage } = require('@google-cloud/storage');
const settings = require('../testConfiguration.json');
const key = settings.key;

describe('uploadFile', function() {
    describe('upload', function() {
      it('should return true', async function() {        
        this.timeout(10000);
        let res;

        try {
            const bucketName = settings.folderPath;
            const secure = key ? 'SECURE' : 'NOT_SECURE';
            let options = key ? { encryptionKey: Buffer.from(key, 'base64') } : {};
            
        
            const storage = new Storage({
                projectId: settings.projectID,
                keyFilename: './gcs/serviceAcount.json',
            });    
        
            options.destination = `METADATA_file_${secure}.avro`;
            const metadataFilePath = `./files/metadata/METADATA_file.avro`;
            await storage.bucket(bucketName).upload(metadataFilePath, options); 
            
            options.destination = `customers/customers1_${secure}.avro`;
            const customers1FilePath = `./files/customers/customers1.avro`;
            await storage.bucket(bucketName).upload(customers1FilePath, options); 

            options.destination = `customers/customers2_${secure}.avro`;
            const customers2FilePath = `./files/customers/customers2.avro`;
            await storage.bucket(bucketName).upload(customers2FilePath, options); 
            
            res = true;
        }
        catch (err) {
            res = err;
        }

        expect(res).to.be.true;
      });
    });
  });