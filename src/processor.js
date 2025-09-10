import { Worker } from 'bullmq';
import { getDb } from './models/purchases.js';
import config from './config.js';
import logger from './logger.js';

export function startWorker() {
  const worker = new Worker('events', async job => {
    const db = getDb();
    const data = job.data;

    // Normalize values that are BigNumber-like to strings
    const buyer = data.args[0]?.toString ? data.args[0].toString() : data.args[0];
    const nairaAmount = data.args[1]?.toString ? data.args[1].toString() : data.args[1];
    const mchAmount = data.args[2]?.toString ? data.args[2].toString() : data.args[2];
    const doc = {
      txHash: data.txHash,
      logIndex: data.logIndex,
      blockNumber: data.blockNumber,
      blockHash: data.blockHash,
      eventName: data.eventName,
      buyer: buyer,
      nairaTokenWei: nairaAmount,
      mchTokenWei: mchAmount,
      insertedAt: new Date()
    };

    try {
      await db.collection('purchases').insertOne(doc);
      logger.info('Inserted purchase', { tx: doc.txHash, idx: doc.logIndex });
    } catch (e) {
      if (e.code === 11000) {
        // duplicate
        logger.warn('Duplicate event ignored', { tx: doc.txHash, idx: doc.logIndex });
      } else {
        logger.error('DB insert failed', e.message);
        throw e;
      }
    }
  }, 
  {
    connection: { host: config.REDIS_HOST, port: config.REDIS_PORT }
  });

  worker.on('failed', (job, err) => {
    logger.error('Job failed', { id: job.id, err: err.message });
  });

  logger.info('Worker started');
}