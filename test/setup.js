import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';

// Configure Chai to use sinon-chai
chai.use(sinonChai);

let mongoServer;
let mongoClient;
let testDb;

export const setupTestDb = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  testDb = mongoClient.db('test-db');
  
  return { mongoUri, testDb };
};

export const teardownTestDb = async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export const getTestDb = () => testDb;

export const createMockLogger = () => ({
  info: sinon.stub(),
  warn: sinon.stub(),
  error: sinon.stub(),
  debug: sinon.stub()
});

export const createMockConfig = () => ({
  RPC_WS: 'wss://test-rpc.example.com',
  CONTRACT_ADDRESS: '0x1234567890123456789012345678901234567890',
  ABI_PATH: './test/fixtures/test-abi.json',
  MONGO_URI: 'mongodb://localhost:27017/test',
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  PORT: 3000,
  START_BLOCK: 1000,
  CONFIRMATIONS: 10,
  BATCH_SIZE: 100
});

// Global test hooks
let sandbox;

export const beforeEachTest = () => {
  sandbox = sinon.createSandbox();
  return sandbox;
};

export const afterEachTest = () => {
  if (sandbox) {
    sandbox.restore();
  }
};