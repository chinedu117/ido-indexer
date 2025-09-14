import dotenv from 'dotenv';
dotenv.config();

export default {
  RPC_WS: process.env.RPC_WS,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ido',
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  CONTRACT_ADDRESS: process.env.IDO_CONTRACT_ADDRESS,
  ABI_PATH: new URL('./abi/abi-MedChainIDO.json', import.meta.url).pathname,
  START_BLOCK: Number(process.env.START_BLOCK || 0),
  CONFIRMATIONS: Number(process.env.CONFIRMATIONS || 6),
  BATCH_SIZE: Number(process.env.BATCH_SIZE || 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};