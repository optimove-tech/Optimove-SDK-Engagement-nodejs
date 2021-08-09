const expect = require('chai').expect;
const settings = require('../testConfiguration.json');
const Engagement = require('../services/engagementService');

describe('getCustomerBatches', function() {
    describe('getJson', function() {
      it('should return array of customers files batches', async function() {        
        this.timeout(10000);
        let batches;

        try {
          const engagement = new Engagement(settings);
          batches = await engagement.getCustomersBatches();        
        }
        catch (err) {
          batches = err;
        }

        expect(batches).be.an('array');
      });
    });
  });