import { Router } from 'express';
import { solanaClient } from '../services/solana-client';

const router = Router();

// POST /accounts — register a new treasury account (creates Solana vault PDA).
router.post('/', async (req, res, next) => {
  try {
    const { name, currency, signers } = req.body;
    if (!name || !currency || !Array.isArray(signers) || signers.length !== 3) {
      return res.status(400).json({ error: 'name, currency, and 3 signers required' });
    }
    // Real impl: call initialize_vault on the Solana program, persist account row.
    res.status(201).json({
      id: `acct_${Date.now()}`, name, currency, signers,
      vaultPda: `vault_${Math.random().toString(36).slice(2, 10)}`,
      balance: 0, createdAt: new Date().toISOString(),
    });
  } catch (e) { next(e); }
});

// GET /accounts/:id
router.get('/:id', async (req, res, next) => {
  try {
    // Real impl: query DB, then fetch on-chain balance via solanaClient.getBalance
    res.json({
      id: req.params.id, name: 'Singapore HQ Treasury', currency: 'USDC',
      vaultPda: `vault_${req.params.id.slice(0, 8)}`,
      balance: 4_287_500, dailyLimit: 1_000_000, monthlyLimit: 25_000_000,
    });
  } catch (e) { next(e); }
});

export default router;
