// SettlementService — persistence layer for settlements and approvals.
// Backed by PostgreSQL (see DATABASE_SCHEMA.md). The MVP scaffold uses an
// in-memory store so the API can be exercised end-to-end before the DB is wired.

import { randomUUID } from 'crypto';

interface Settlement {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromVaultPda: string;
  toVaultPda: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  routeId: string;
  predictedCost: number;
  predictedTime: number;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
  approvalCount: number;
  approvalThreshold: number;
  approvers: string[];
  createdAt: string;
  executedAt?: string;
  solanaSignature?: string;
  userId: string;
}

const store = new Map<string, Settlement>();

export class SettlementService {
  async create(input: {
    fromAccountId: string; toAccountId: string; amount: number;
    fromCurrency: string; toCurrency: string; routeId: string;
    predictedCost: number; predictedTime: number; userId: string;
  }): Promise<Settlement> {
    const settlement: Settlement = {
      id: randomUUID(),
      ...input,
      // In production these PDAs come from the account records
      fromVaultPda: `vault_${input.fromAccountId.slice(0, 8)}`,
      toVaultPda: `vault_${input.toAccountId.slice(0, 8)}`,
      status: 'pending',
      approvalCount: 0,
      approvalThreshold: 2,
      approvers: [],
      createdAt: new Date().toISOString(),
    };
    store.set(settlement.id, settlement);
    return settlement;
  }

  async findById(id: string): Promise<Settlement | null> {
    return store.get(id) || null;
  }

  async list(filters: { status?: string; limit: number; userId: string }): Promise<Settlement[]> {
    return [...store.values()]
      .filter((s) => s.userId === filters.userId)
      .filter((s) => !filters.status || s.status === filters.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, filters.limit);
  }

  async recordApproval(settlementId: string, signerId: string): Promise<{
    executed: boolean; proposalPda: string; approvalCount: number;
  }> {
    const s = store.get(settlementId);
    if (!s) throw new Error('Settlement not found');
    if (s.approvers.includes(signerId)) throw new Error('Signer already approved');

    s.approvers.push(signerId);
    s.approvalCount++;
    if (s.approvalCount >= s.approvalThreshold) {
      s.status = 'approved';
      return { executed: true, proposalPda: `prop_${s.id}`, approvalCount: s.approvalCount };
    }
    return { executed: false, proposalPda: `prop_${s.id}`, approvalCount: s.approvalCount };
  }

  async markExecuted(settlementId: string, signature: string): Promise<void> {
    const s = store.get(settlementId);
    if (!s) return;
    s.status = 'completed';
    s.solanaSignature = signature;
    s.executedAt = new Date().toISOString();
  }
}
