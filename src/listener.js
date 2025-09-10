import { Interface } from 'ethers';
import { Queue } from 'bullmq';
import config from './config.js';
import logger from './logger.js';
import fs from 'fs';

export function createQueue() {
  const queue = new Queue('events', {
    connection: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT
    }
  });
  return queue;
}

export async function startListener(provider) {
  const abi = JSON.parse(fs.readFileSync(config.ABI_PATH, 'utf8'));
  const iface = new Interface(abi.abi);
  const queue = createQueue();

  provider.on({ address: config.CONTRACT_ADDRESS }, async (log) => {
    try {
      const parsed = iface.parseLog(log);
      
      // Convert BigInt values to strings for serialization
      const serializedArgs = {};
      for (const [key, value] of Object.entries(parsed.args)) {
        if (typeof value === 'bigint') {
          serializedArgs[key] = value.toString();
        } else {
          serializedArgs[key] = value;
        }
      }
      
      const job = {
        txHash: log.transactionHash,
        logIndex: Number(log.index),
        blockNumber: Number(log.blockNumber),
        blockHash: log.blockHash,
        eventName: parsed.name,
        args: serializedArgs
      };
      logger.info('Received log', { tx: job.txHash, idx: job.logIndex, event: job.eventName });
      await queue.add('processLog', job, { removeOnComplete: true, attempts: 3 });
      logger.info('Enqueued log', { tx: job.txHash, idx: job.logIndex });
    } catch (e) {
      logger.error('Failed to parse log', e.message);
      throw e;
    }
  });

  logger.info('Listener started for', config.CONTRACT_ADDRESS);
}