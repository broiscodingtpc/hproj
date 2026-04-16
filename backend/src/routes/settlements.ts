// Settlement routes — create, list, approve, execute.
// All routes assume `req.user` is populated by the authenticate middleware.

import { Router } from 'express';
import { z } from 'zod';
import { SettlementService } from '../services/settlement';
import { aiClient } from '../services/ai-client';
import { solanaClient } from '../services/solana-client';

const router = Router();
const settlements = new SettlementService();

const CreateSettlementSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  memo: z.string().max(200).optional(),
});

// POST /settlements — create + route + propose multi-sig approval
router.post('/', async (req, res, next) => {
  try {
    const body = CreateSettlementSchema.parse(req.body);

    // 1. Ask the AI service for the optimal route
    const route = await aiClient.predictRoute({
      from: body.fromCurrency, to: body.toCurrency, amount: body.amount,
    });

    // 2. Persist settlement record
    const settlement = await settlements.create({
      ...body, routeId: route.id, predictedCost: route.cost,
      predictedTime: route.timeSeconds, userId: req.user!.id,
    });

    // 3. Propose multi-sig withdrawal on Solana
    const proposalSig = await solanaClient.proposeWithdrawal({
      vaultPda: settlement.fromVaultPda, amount: body.amount,
      destination: settlement.toVaultPda, memo: body.memo || '',
    });

    res.status(201).json({
      ...settlement, route, solanaProposalSignature: proposalSig,
    });
  } catch (e) { next(e); }
});

// GET /settlements/:id
router.get('/:id', async (req, res, next) => {
  try {
    const settlement = await settlements.findById(req.params.id);
    if (!settlement) return res.status(404).json({ error: 'Not found' });
    res.json(settlement);
  } catch (e) { next(e); }
});

// GET /settlements?status=pending&limit=50
router.get('/', async (req, res, next) => {
  try {
    const list = await settlements.list({
      status: req.query.status as string | undefined,
      limit: parseInt((req.query.limit as string) || '50', 10),
      userId: req.user!.id,
    });
    res.json({ settlements: list });
  } catch (e) { next(e); }
});

// POST /settlements/:id/approve — record signer approval, execute if quorum reached
router.post('/:id/approve', async (req, res, next) => {
  try {
    const result = await settlements.recordApproval(req.params.id, req.user!.id);
    if (result.executed) {
      // Quorum reached — fire the on-chain execution
      const txSig = await solanaClient.executeWithdrawal(result.proposalPda);
      await settlements.markExecuted(req.params.id, txSig);
      return res.json({ status: 'executed', signature: txSig });
    }
    res.json({ status: 'awaiting-quorum', approvals: result.approvalCount });
  } catch (e) { next(e); }
});

export default router;
