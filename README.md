# Optimove Engagement sdk

### How to use:

1. Get a webhook from optimove
2. Use the webhook values you got and create an instance of the engagement SDK
3. You can use one of the three public methods the SDK has
    * getMetaData() - Returns a json of the campaign's metadata
    * getCustomersByBatchID(batchID) - Returns a stream of customers for the batchID file number you passed


| Error Message | Explanation |
| --- | --- |
| metadata is empty or does not exist. | Metadata issues. Please, check your settings object and "metadataFilePath" field, especially. |
| Couldn't receive a metadata.| Something wrong with creating metadata object. |
| batchID: ${batchID} is not valid. | Wrong BatchIDNumber was provided for getCustomersByBatchID function. |
| sdk settings are manadatory.| No SDK settings object or it has no keys. |
| tenantID is manadatory.| No tenantID field in the setting object |
| bucketName is mandatory.| No bucketName field in the setting object |
| customersFolderPath is mandatory.| No customersFolderPath field in the setting object |
| metadataFilePath is mandatory.| No metadataFilePath field in the setting object |
| decryptionKey is mandatory.| No decryptionKey field in the setting object |
| _getStorage error - error details. | Google Cloud issue. Contact Optimove if the issue repeats. |


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
  BucketName: "optigration-external-eu",
  DecryptionKey: "your-decryption-key",
  CustomersFolderPath: "2022-07-19 09 00 webhhook-name channel-id engagement-id/customers",
  MetadataFilePath: "2022-07-19 09 00 webhhook-name channel-id  engagement-id/metadata_engagement-id",
  ServiceAccount: ""
}

// Use the values you got from the webhook in your settings object
const settings = {    
    campaignID: webhook.CampaignID,
    engagementID: webhook.EngagementID,
    tenantID: webhook.TenantID,
    bucketName: webhook.BucketName,            
    customersFolderPath: webhook.CustomersFolderPath,
    metadataFilePath: webhook.MetadataFilePath,
    decryptionKey: webhook.DecryptionKey
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

const getCustomersByBatchID = (batchID) => {
    try {        
        const customersStream = engagerSDK.getCustomersByBatchID(batchID);
        return customersStream;
    }
    catch (err) {
        console.log(err);
    }
}

async function run() {
    const campaignMetadata = await getMetaData();
    console.log(`Campaign metadata ${JSON.stringify(campaignMetadata)}`)

    for (let index = 1; index < campaignMetadata.numberOfFiles; index++) {
        const customersStream = getCustomersByBatchID(index);
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
