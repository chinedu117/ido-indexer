import { MongoClient } from 'mongodb';
import config from '../config.js';
import logger from '../logger.js';

let client;
let db;

export async function connectDb() {
  logger.info('Connecting to MongoDB...');
  if (db) return db;
  client = new MongoClient(config.MONGO_URI);
  await client.connect();
  logger.info('MongoDB connected');
  db = client.db();
  logger.info('Setting up indexes...');
  // ensure unique index for idempotency
  await db.collection('purchases').createIndex({ txHash: 1, logIndex: 1 }, { unique: true });

  logger.info('MongoDB indexes set up');
  return db;
}

export function getDb() {
  if (!db) throw new Error('DB not connected');
  return db;
}