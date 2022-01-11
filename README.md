# Optimove Engagement sdk

### How to use:

1. Get a webhook from optimove
2. Use the webhook values you got and create an instance of the engagement SDK
3. You can use one of the three public methods the SDK has
    * getMetaData() - Returns a json of the campaign's metadata
    * getCustomersBatchesNumber() - Returns the amount of batches (files) for the campaign
    * getCustomersByBatchID(batchID) - Return a stream of customers for the batchID file number

```javascript
const EngagerSDK = require('optimove-sdk-engagement-nodejs')

// Use the values you got from the webhook within the json object
const settings = {    
    bucketName: webhook.BucketName,
    campaignID: webhook.CampaignID,
    engagementID: webhook.EngagementID,
    tenantID: webhook.TenantID,
    customersFolderPath: webhook.CustomersFolderPath,
    metadataFilePath: webhook.MetadataFilePath,
    serviceAccount: webhook.ServiceAccount
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

async function getCustomersBatchesNumber() {
    try {        
        const batches = await engagerSDK.getCustomersBatchesNumber();       
        return batches;
    }
    catch (err) {
        console.log(err);
    }
}

async function getCustomersByBatchID(batchID) {
    try {        
        const customersStream = await engagerSDK.getCustomersByBatchID(batchID);
        return customersStream;
    }
    catch (err) {
        console.log(err);
    }
}

async function run() {
    const campaignMetadata = await getMetaData();
    const batchesNumber = await getCustomersBatchesNumber();
    const customersStream = await getCustomersByBatchID(1); // get the first file stream

    //Read the file stream
    customersStream.on('data', (chunk) => {
        console.log(chunk);
    })

    customersStream.on('end', () => {
        console.log('finished read the file stream');
    })  
}

run();
```