# Optimove Engagement sdk

### How to use:

1. Get a webhook from optimove
2. Use the webhook values you got to create an instance of the engagement SDK
3. You can use one of the three public methods the SDK has
    * getMetaData() - Returns a json of the campaign's metadata
    * getCustomersBatches() - Returns an array of files objects (file name and file id)
    * getCustomersByBatch(fileName) - Return a customers file stream of a campaign by the fileName, If you have multiple files You will have to call this method for each on the the file batch you got from the method: getCustomersBatches()

```javascript
const EngagerSDK = require('optimove-sdk-engagement-nodejs')

// Use the values you got from the webhook within the json object
const settings = {    
    bucketName: bucketName,
    campaignID: campaignID,
    engagementID: engagementID,
    tenantID: tenantID,
    customersFolderPath: customersFolderPath,
    metadataFilePath: metadataFilePath,
    serviceAccount: serviceAccount
}

const engagerSDK = new EngagerSDK(settings);

async function getMetaData() {
    try {
        const metaData = await engagerSDK.getMetaData();
        return metaData;
    }
    catch (err) {
        console.log(err);
    }
}

async function getCustomersBatches() {
    try {        
        const batches = await EngagerSDK.getCustomersBatches();       
        return batches;
    }
    catch (err) {
        console.log(err);
    }
}

async function getCustomersByBatch(fileName) {
    try {        
        const customersStream = await EngagerSDK.getCustomersByBatch(fileName);       
        
        // Read the file stream
        customersStream.on('data', (chunk) => {
            console.log(chunk);
        })
        
        customersStream.on('end', () => {
            console.log('finished read the file stream');
            return customersStream;
        })   
    }
    catch (err) {
        console.log(err);
    }
}

const campaignMetadata = await getMetaData();
const batches = await getCustomersBatches()
const customersStream = await getCustomersByBatch(batches[0].name);
```