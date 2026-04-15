import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'treasury-agent-settlement',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/ready', (_req, res) => {
  // In production: ping DB, Redis, Solana RPC, AI service
  res.json({ ready: true });
});

export default router;
