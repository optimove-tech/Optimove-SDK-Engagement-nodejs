const expect = require('chai').expect;
const settings = require('../testConfiguration.json');
const Engagement = require('../services/engagementService');

describe('getCustomersBatchesNumber', function() {
  it('should return the number of files', async function() {    
    const engagement = new Engagement(settings);
    const amount = await engagement.getCustomersBatchesNumber();    
    
    expect(amount).be.an('number');
    expect(amount).be.greaterThan(0);
  });
});