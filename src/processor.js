import { Worker } from 'bullmq';
import { getDb } from './models/purchases.js';
import config from './config.js';
import logger from './logger.js';

export function startWorker() {
  const worker = new Worker('events', async job => {
    const db = getDb();
    const data = job.data;

    // Normalize values that are BigNumber-like to strings
    const tokensBought = data.args.tokensBought?.toString ? data.args.tokensBought.toString() : data.args.tokensBought;
    const ethAmount = data.args.ethAmount?.toString ? data.args.ethAmount.toString() : data.args.ethAmount;

    const doc = {
      txHash: data.txHash,
      logIndex: data.logIndex,
      blockNumber: data.blockNumber,
      blockHash: data.blockHash,
      eventName: data.eventName,
      buyer: data.args.buyer,
      tokensBought: tokensBought,
      amountWei: ethAmount,
      confirmed: false,
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