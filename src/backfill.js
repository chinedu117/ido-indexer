import fs from 'fs';
import { Interface } from 'ethers';
import { createProvider } from './provider.js';
import config from './config.js';
import logger from './logger.js';
import { connectDb } from './models/purchases.js';

const abi = JSON.parse(fs.readFileSync(config.ABI_PATH, 'utf8'));
const iface = new Interface(abi);
const topics = null; // can set to [iface.getEventTopic("Purchased")] to filter only that event

async function runBackfill() {
  const provider = createProvider();
  const db = await connectDb();

  const latest = await provider.getBlockNumber();
  const progress = await db.collection('blocks_index').findOne({ _id: 'progress' });
  let from = Math.max(
    config.START_BLOCK,
    progress?.lastIndexedBlock + 1 || config.START_BLOCK
  );
  const to = latest - config.CONFIRMATIONS;

  logger.info('Backfill starting', { from, to });

  for (let start = from; start <= to; start += config.BATCH_SIZE) {
    const end = Math.min(start + config.BATCH_SIZE - 1, to);
    logger.info('Fetching logs', { from: start, to: end });

    const logs = await provider.getLogs({
      fromBlock: start,
      toBlock: end,
      address: config.CONTRACT_ADDRESS,
      topics
    });

    for (const log of logs) {
      try {
        const parsed = iface.parseLog(log);
        const tokensBought = parsed.args.tokensBought?.toString();
        const ethAmount = parsed.args.ethAmount?.toString();

        const doc = {
          txHash: log.transactionHash,
          logIndex: Number(log.logIndex),
          blockNumber: Number(log.blockNumber),
          blockHash: log.blockHash,
          eventName: parsed.name,
          buyer: parsed.args.buyer,
          tokensBought,
          amountWei: ethAmount,
          confirmed: false,
          insertedAt: new Date()
        };

        await db.collection('purchases').insertOne(doc);
        logger.info('Inserted purchase', { tx: doc.txHash, idx: doc.logIndex });
      } catch (e) {
        if (e.code === 11000) {
          logger.warn('Duplicate log ignored', { tx: log.transactionHash, idx: log.logIndex });
        } else {
          logger.error('Failed processing log', { err: e.message });
        }
      }
    }

    // update progress after each batch
    await db.collection('blocks_index').updateOne(
      { _id: 'progress' },
      { $set: { lastIndexedBlock: end } },
      { upsert: true }
    );
    logger.info('Progress updated', { lastIndexedBlock: end });
  }

  logger.info('Backfill complete');
  process.exit(0);
}

runBackfill().catch(err => {
  logger.error('Backfill failed', { err: err.message });
  process.exit(1);
});
