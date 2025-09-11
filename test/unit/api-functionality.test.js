import { expect } from 'chai';
import express from 'express';
import request from 'supertest';

describe('API Functionality Tests', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    // Create a test Express app
    app = express();
    
    // Mock database responses
    const mockPurchases = [
      {
        txHash: '0xapi123',
        logIndex: 1,
        blockNumber: 12345,
        buyer: '0xapibuyer',
        eventName: 'TokensPurchased',
        nairaTokenWei: '1000000000000000000',
        mchTokenWei: '500000000000000000'
      },
      {
        txHash: '0xapi456',
        logIndex: 2,
        blockNumber: 12346,
        buyer: '0xapibuyer2',
        eventName: 'TokensPurchased',
        nairaTokenWei: '2000000000000000000',
        mchTokenWei: '1000000000000000000'
      }
    ];

    // Create a mock API endpoint similar to the real one
    app.get('/purchases', async (req, res) => {
      try {
        const query = {};
        if (req.query.buyer) query.buyer = req.query.buyer.toLowerCase();
        if (req.query.eventName) query.eventName = req.query.eventName;
        if (req.query.blockNumber) {
          const blockNum = Number(req.query.blockNumber);
          if (!isNaN(blockNum)) {
            query.blockNumber = blockNum;
          }
        }

        // Filter mock data based on query
        let filteredPurchases = mockPurchases;
        
        if (query.buyer) {
          filteredPurchases = filteredPurchases.filter(p => 
            p.buyer.toLowerCase() === query.buyer
          );
        }
        
        if (query.eventName) {
          filteredPurchases = filteredPurchases.filter(p => 
            p.eventName === query.eventName
          );
        }
        
        if (query.blockNumber) {
          filteredPurchases = filteredPurchases.filter(p => 
            p.blockNumber === query.blockNumber
          );
        }

        // Sort by blockNumber and logIndex descending
        filteredPurchases.sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) {
            return b.blockNumber - a.blockNumber;
          }
          return b.logIndex - a.logIndex;
        });

        // Limit to 50 results
        const results = filteredPurchases.slice(0, 50);
        res.json(results);
      } catch (err) {
        res.status(500).json({ error: 'internal server error' });
      }
    });
  });

  describe('GET /purchases', () => {
    it('should return all purchases when no filters provided', async () => {
      const response = await request(app)
        .get('/purchases')
        .expect(200);

      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(2);
      expect(response.body[0].txHash).to.exist;
    });

    it('should filter purchases by buyer address', async () => {
      const response = await request(app)
        .get('/purchases')
        .query({ buyer: '0xAPIBUYER' }) // Test case insensitive
        .expect(200);

      expect(response.body).to.have.length(1);
      expect(response.body[0].buyer).to.equal('0xapibuyer');
    });

    it('should filter purchases by event name', async () => {
      const response = await request(app)
        .get('/purchases')
        .query({ eventName: 'TokensPurchased' })
        .expect(200);

      expect(response.body).to.have.length(2);
      response.body.forEach(purchase => {
        expect(purchase.eventName).to.equal('TokensPurchased');
      });
    });

    it('should filter purchases by block number', async () => {
      const response = await request(app)
        .get('/purchases')
        .query({ blockNumber: '12345' })
        .expect(200);

      expect(response.body).to.have.length(1);
      expect(response.body[0].blockNumber).to.equal(12345);
    });

    it('should apply multiple filters', async () => {
      const response = await request(app)
        .get('/purchases')
        .query({ 
          buyer: '0xapibuyer',
          eventName: 'TokensPurchased',
          blockNumber: '12345'
        })
        .expect(200);

      expect(response.body).to.have.length(1);
      expect(response.body[0].buyer).to.equal('0xapibuyer');
      expect(response.body[0].blockNumber).to.equal(12345);
    });

    it('should return empty array when no matches found', async () => {
      const response = await request(app)
        .get('/purchases')
        .query({ buyer: '0xnonexistent' })
        .expect(200);

      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(0);
    });

    it('should sort results by blockNumber and logIndex descending', async () => {
      const response = await request(app)
        .get('/purchases')
        .expect(200);

      expect(response.body[0].blockNumber).to.equal(12346); // Higher block number first
      expect(response.body[1].blockNumber).to.equal(12345);
    });

    it('should handle invalid block number gracefully', async () => {
      const response = await request(app)
        .get('/purchases')
        .query({ blockNumber: 'invalid' })
        .expect(200);

      // Should return all results since invalid block number is ignored
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(2);
    });
  });

  describe('Query Parameter Processing', () => {
    it('should convert buyer address to lowercase', () => {
      const buyer = '0xTESTBUYER';
      const normalizedBuyer = buyer.toLowerCase();
      
      expect(normalizedBuyer).to.equal('0xtestbuyer');
    });

    it('should convert block number string to number', () => {
      const blockNumberStr = '12345';
      const blockNumber = Number(blockNumberStr);
      
      expect(blockNumber).to.be.a('number');
      expect(blockNumber).to.equal(12345);
    });

    it('should handle empty query parameters', () => {
      const query = {};
      const filters = {};
      
      if (query.buyer) filters.buyer = query.buyer.toLowerCase();
      if (query.eventName) filters.eventName = query.eventName;
      if (query.blockNumber) filters.blockNumber = Number(query.blockNumber);
      
      expect(Object.keys(filters)).to.have.length(0);
    });
  });
});
