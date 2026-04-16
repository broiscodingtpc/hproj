// Thin client for the Python AI routing service.

import { logger } from './logger';

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const TIMEOUT = parseInt(process.env.AI_REQUEST_TIMEOUT || '10000', 10);

export interface RoutePrediction {
  id: string;
  name: string;
  cost: number;
  timeSeconds: number;
  confidence: number;
  hops: string[];
}

export const aiClient = {
  async predictRoute(input: { from: string; to: string; amount: number }): Promise<RoutePrediction> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const res = await fetch(`${AI_URL}/predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`AI service ${res.status}`);
      return res.json() as Promise<RoutePrediction>;
    } catch (e) {
      logger.warn('AI predictRoute failed, falling back to direct route', { error: (e as Error).message });
      // Fallback: direct USDC transfer (always available)
      return {
        id: 'fallback-direct',
        name: 'Direct USDC',
        cost: input.amount * 0.0001,
        timeSeconds: 3,
        confidence: 0.7,
        hops: [input.from, input.to],
      };
    } finally {
      clearTimeout(timer);
    }
  },
};
