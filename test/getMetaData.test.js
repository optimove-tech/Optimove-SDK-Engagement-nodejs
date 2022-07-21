const expect = require('chai').expect;
const settings = require('../testConfiguration.json');
const Engagement = require('../services/engagementService');

describe('getMetaData', function() {
  it('should return json of campaign metaData', async function() {
    const engagement = new Engagement(settings);
    const json = await engagement.getMetaData();      

    expect(json).be.an('object');
  });
});