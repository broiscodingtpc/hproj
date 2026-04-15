// Solana RPC client wrapper. In production this loads the Anchor IDL and uses
// a typed program client. The MVP keeps it minimal and stubs out execution.

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { logger } from './logger';

const NETWORK = (process.env.SOLANA_NETWORK || 'devnet') as 'devnet' | 'testnet' | 'mainnet-beta';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(NETWORK);

const connection = new Connection(RPC_URL, 'confirmed');

// Service signer — loaded from base58 env var or keypair file path.
function loadKeypair(): Keypair {
  const b58 = process.env.SOLANA_PRIVATE_KEY;
  if (b58) {
    const bs58 = require('bs58');
    return Keypair.fromSecretKey(bs58.decode(b58));
  }
  throw new Error('SOLANA_PRIVATE_KEY not set');
}

export const solanaClient = {
  connection,

  async proposeWithdrawal(input: {
    vaultPda: string; amount: number; destination: string; memo: string;
  }): Promise<string> {
    // Real implementation: build and send a propose_withdrawal instruction
    // using @coral-xyz/anchor and the generated TreasuryVault program client.
    logger.info('Proposing withdrawal', input);
    return `proposal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  },

  async executeWithdrawal(proposalPda: string): Promise<string> {
    // Real implementation: call execute_withdrawal on the program.
    logger.info('Executing withdrawal', { proposalPda });
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  },

  async getBalance(vaultPda: string): Promise<number> {
    try {
      const lamports = await connection.getBalance(new PublicKey(vaultPda));
      return lamports / 1e9;
    } catch (e) {
      logger.warn('getBalance failed', { vaultPda, error: (e as Error).message });
      return 0;
    }
  },
};

export { loadKeypair };
