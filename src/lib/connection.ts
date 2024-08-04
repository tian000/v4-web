import { Connection as SolanaConnection } from '@solana/web3.js';

// The URL of the Solana Mainnet
const SOLANA_MAINNET_URL = '<REPLACE_ME>';

// Create and export a single instance of Connection
export const Connection = new SolanaConnection(SOLANA_MAINNET_URL);
