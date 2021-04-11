# Optimove Engagement sdk

### How to use:

```javascript
const Engager = require('optimove-sdk-engagement-nodejs')

const settings = {
    serviceAccount: webhookServiceAccount,
    decryptionKey: webhookKey, // or null
    folderPath: webHookPath
}

async function getMetaData() {
    try {
        const engager = new Engager(settings);
        const metaData = await engager.getMetaData();
        
        console.log(metaData);
    }
    catch (err) {
        console.log(err);
    }
}

getMetaData();
```

### How to test it:
First create a settings.json in the root folder with the format:
serviceAccount: The path to your own service account json file.
decryptionKey: the hash key your used to upload the hashed files (metadata and cutomers).
folderPath: Your bucker name.
#### Example:
```
{
    "serviceAccount": yourServiceAccount",
    "decryptionKey": yourHashKey,
    "folderPath": "optihub-dev-metrics"
}
```
### More thes into:
To test it you first need to upload the metadata and customers files to your bucket, the metadata will have to be in the root bucker path and the customers in the customers folder, all of them must be avro files.