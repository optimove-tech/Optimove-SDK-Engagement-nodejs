# Optimove Engagement sdk

### How to use:

1. Get a webhook from optimove
2. Use the webhook values you got and create an instance of the engagement SDK
3. You can use one of the three public methods the SDK has
    * getMetaData() - Returns a json of the campaign's metadata
    * getCustomersBatchesNumber() - Returns the amount of batches (files) for the campaign
    * getCustomersByBatchID(batchID) - Returns a stream of customers for the batchID file number you passed

```javascript
to install run: npm i @devops-optimove/optigration-sdk-js

const EngagerSDK = require('https://www.npmjs.com/package/@devops-optimove/optigration-sdk-js')

// Example of a webhook payload:
{
  EventTypeID: 14,
  TimeStamp: "2022-07-19 08:54",
  CampaignID: 38085,
  EngagementID: 144523,
  TenantID: 28209,
  BucketName: "optigration-internal-dev",
  CustomersFolderPath: "2022-07-17 09 00 company-name 400 144523/customers",
  MetadataFilePath: "2022-07-17 09 00 company-name 400 144523/metadata_144523"
}

// Use the values you got from the webhook in your settings object
const settings = {    
    campaignID: webhook.CampaignID,
    engagementID: webhook.EngagementID,
    tenantID: webhook.TenantID,
    bucketName: webhook.BucketName,            
    customersFolderPath: webhook.CustomersFolderPath,
    metadataFilePath: webhook.MetadataFilePath
}

const engagerSDK = new EngagerSDK(settings);

const getMetaData = async () => {
     try {
        const metaData = await engagerSDK.getMetaData();
        return metaData;
    }
    catch (err) {
        console.log(err);
    }
}

const getCustomersBatchesNumber = async () => {
  try {        
        const batchesNumber = await engagerSDK.getCustomersBatchesNumber();       
        return batchesNumber;
    }
    catch (err) {
        console.log(err);
    }
}

const getCustomersByBatchID = async (batchID) => {
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
    console.log(`Campaign metadata ${JSON.stringify(campaignMetadata)}`)

    const batchesNumber = await getCustomersBatchesNumber();
    console.log(`Total customers files found in google cloud: ${batchesNumber}`);
    
    console.log('Getting all customers files content in paralel');

    for (let index = 1; index < batchesNumber; index++) {
        const customersStream = await getCustomersByBatchID(index);
        readFile(customersStream, index);
    }
}

const readFile = (customersStream, index) => {
    console.log(`Reading file #${index}`);

    customersStream.on('data', (customerObject) => {
        console.log(`Record for file #${index}`)
        console.log(customerObject);
    })

    customersStream.on('end', () => {
        console.log(`Finished reading customers file stream #${index}`);        
    }) 

    customersStream.on('error', (err) => {
        console.error(err);        
    }) 
}

run();
```