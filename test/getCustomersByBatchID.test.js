const expect = require('chai').expect;
const settings = require('../testConfiguration.json');
const Engagement = require('../services/engagementService');
const stream = require('stream');

describe('getCustomersByBatchID', function() {
  it('should get a readable stream and return true', async function() {
    const engagement = new Engagement(settings);

    await engagement.getCustomersBatchesNumber();
    const customers = await engagement.getCustomersByBatchID(1);

    const returnType = customers instanceof stream.Readable;
    expect(returnType).be.true;
  });
});