import { WebSocketProvider } from 'ethers';
import logger from './logger.js';
import config from './config.js';

let provider = null;

export function createProvider() {
  if (provider) return provider;

  const url = config.RPC_WS;
  if (!url) throw new Error('RPC_WS not configured');

  provider = new WebSocketProvider(url);

  // Set up proper error handling for the provider
  provider._wsReconnect = async () => {
    // basic placeholder: consumers can re-create provider if desired
    try {
      await provider.ready;
    } catch (e) {
      logger.warn('Provider errored during ready:', e.message);
    }
  };

  // Handle provider ready state and errors
  // provider.ready.catch((error) => {
  //   logger.error('Provider failed to initialize:', error.message);
  // });

  return provider;
}