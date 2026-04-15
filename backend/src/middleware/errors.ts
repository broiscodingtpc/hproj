import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../services/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', issues: err.errors });
  }
  logger.error('Request failed', { path: req.path, error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
}
