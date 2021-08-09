const expect = require('chai').expect;
const settings = require('../testConfiguration.json');
const Engagement = require('../services/engagementService');

describe('getCustomersByBatch', function() {
    describe('getJson', function() {
      it('should return json of customers list', async function() {        
        this.timeout(10000);
        let customers;

        try {
            const engagement = new Engagement(settings);
            const batches = await engagement.getCustomersBatches(); 
            
            customers = await engagement.getCustomersByBatch(batches[0].name);          
        }
        catch (err) {
          customers = err;
        }

        expect(customers).be.an('array');
      });
    });
  });