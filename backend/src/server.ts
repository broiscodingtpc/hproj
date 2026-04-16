// Treasury Agent — settlement service entrypoint.
//
// Mounts REST routes for accounts, settlements, and approvals plus a WebSocket
// channel for real-time settlement status. This is the MVP scaffold; production
// adds graceful shutdown, circuit breakers around AI/Solana calls, and
// per-tenant rate limiting.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errors';
import { logger } from './services/logger';

import accountsRouter from './routes/accounts';
import settlementsRouter from './routes/settlements';
import healthRouter from './routes/health';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Public health endpoint
app.use('/health', healthRouter);

// Authenticated routes
app.use('/accounts', authenticate, accountsRouter);
app.use('/settlements', authenticate, settlementsRouter);

app.use(errorHandler);

const server = createServer(app);

// WebSocket — clients subscribe to settlement.{id} channels for live updates
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (socket) => {
  logger.info('WebSocket client connected');
  socket.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'subscribe') {
        // In production: validate JWT, register subscription in Redis pub/sub
        socket.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
      }
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'invalid message' }));
    }
  });
});

server.listen(PORT, () => {
  logger.info(`Settlement service listening on :${PORT}`);
});

export { app, server, wss };
