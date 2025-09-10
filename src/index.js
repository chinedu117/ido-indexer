import { createProvider } from './provider.js';
import { connectDb } from './models/purchases.js';
import { startListener } from './listener.js';
import { startWorker } from './processor.js';
import { startApi } from './api.js';
import logger from './logger.js';

async function main() {
  try {
    await connectDb();
    const provider = createProvider();

    startWorker();
    await startListener(provider);

    startApi(); 

    logger.info('Indexer + API running 🚀');
  } catch (err) {

    logger.error('Fatal error starting indexer', { err: err.message });
    process.exit(1);
  }
}

main();
