const expect = require('chai').expect;
const settings = require('../settings.json');
const Engagement = require('../services/engagementService');

describe('getMetaData', function() {
    describe('getJson', function() {
      it('should return json of campaign metaData', async function() {        
        this.timeout(10000);
        let json;

        try {
          const engagement = new Engagement(settings);
          json = await engagement.getMetaData();      
        }
        catch (err) {
            json = err;
        }

        expect(json).be.an('object');
      });
    });
  });