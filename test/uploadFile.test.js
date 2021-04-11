const expect = require('chai').expect;
const { Storage } = require('@google-cloud/storage');
const settings = require('../settings.json');
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
            options.destination = `METADATA_file_${secure}.avro`;
        
            const storage = new Storage({
                projectId: settings.projectID,
                keyFilename: './gcs/serviceAcount.json',
            });    
        
            const filePath = `./files/metadata/METADATA_file.avro`;
        
            await storage.bucket(bucketName).upload(filePath, options);  
            res = true;
        }
        catch (err) {
            res = err;
        }

        expect(res).to.be.true;
      });
    });
  });