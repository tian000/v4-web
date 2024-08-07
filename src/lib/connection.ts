import { Connection as SolanaConnection } from '@solana/web3.js';

// The URL of the Solana Mainnet
const SOLANA_MAINNET_URL =
  'https://falling-crimson-violet.solana-mainnet.quiknode.pro/33d146e02bb33f996515f57faa3e7e1c3b8dd429/';

// Create and export a single instance of Connection
export const Connection = new SolanaConnection(SOLANA_MAINNET_URL);
