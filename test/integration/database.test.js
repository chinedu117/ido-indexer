import { expect } from 'chai';
import { setupTestDb, teardownTestDb } from '../setup.js';
import { connectDb, getDb } from '../../src/models/purchases.js';

describe('Database Integration Tests', () => {
  let testDb;
  let mongoUri;

  before(async function() {
    this.timeout(10000);
    const setup = await setupTestDb();
    testDb = setup.testDb;
    mongoUri = setup.mongoUri;
  });

  after(async () => {
    await teardownTestDb();
  });

  describe('MongoDB Connection and Operations', () => {
    it('should insert a purchase document successfully', async () => {
      const purchase = {
        txHash: '0xtest123',
        logIndex: 1,
        blockNumber: 12345,
        blockHash: '0xblock123',
        eventName: 'TokensPurchased',
        buyer: '0xbuyer123',
        nairaTokenWei: '1000000000000000000',
        mchTokenWei: '500000000000000000',
        insertedAt: new Date()
      };

      const result = await testDb.collection('purchases').insertOne(purchase);
      expect(result.insertedId).to.exist;

      // Verify the document was inserted
      const found = await testDb.collection('purchases').findOne({ txHash: '0xtest123' });
      expect(found).to.exist;
      expect(found.buyer).to.equal('0xbuyer123');
    });

    it('should enforce unique constraint on txHash and logIndex', async () => {
      const purchase = {
        txHash: '0xunique456',
        logIndex: 2,
        blockNumber: 12346,
        eventName: 'TokensPurchased'
      };

      // Create unique index
      await testDb.collection('purchases').createIndex(
        { txHash: 1, logIndex: 1 }, 
        { unique: true }
      );

      // First insertion should succeed
      await testDb.collection('purchases').insertOne(purchase);

      // Second insertion should fail
      try {
        await testDb.collection('purchases').insertOne(purchase);
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000);
      }
    });

    it('should query purchases by buyer address', async () => {
      const buyer = '0xquerytestbuyer';
      
      await testDb.collection('purchases').insertOne({
        txHash: '0xquery123',
        logIndex: 0,
        buyer: buyer,
        eventName: 'TokensPurchased'
      });

      const purchases = await testDb.collection('purchases')
        .find({ buyer: buyer })
        .toArray();
      
      expect(purchases).to.have.length(1);
      expect(purchases[0].buyer).to.equal(buyer);
    });

    it('should sort purchases by blockNumber and logIndex', async () => {
      // Clear the collection first
      await testDb.collection('purchases').deleteMany({});
      
      // Insert purchases in random order
      await testDb.collection('purchases').insertMany([
        { txHash: '0xa1', logIndex: 1, blockNumber: 100, eventName: 'TokensPurchased' },
        { txHash: '0xb1', logIndex: 0, blockNumber: 101, eventName: 'TokensPurchased' },
        { txHash: '0xc1', logIndex: 2, blockNumber: 100, eventName: 'TokensPurchased' }
      ]);

      const purchases = await testDb.collection('purchases')
        .find({})
        .sort({ blockNumber: -1, logIndex: -1 })
        .toArray();
      
      expect(purchases[0].blockNumber).to.equal(101);
      expect(purchases[1].blockNumber).to.equal(100);
      expect(purchases[1].logIndex).to.equal(2);
      expect(purchases[2].logIndex).to.equal(1);
    });
  });
});
