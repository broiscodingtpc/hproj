/**
 * TxHistory — live settlement history.
 * Seeded with realistic data, appended with real txs when user submits.
 */
import React from 'react';

const SEED = [
  { id: 'stl-1', sig: '5KQx9mY2nFz', from: 'Singapore HQ',  to: 'São Paulo',     amount: 250000, pair: 'USDC→BRZ',  route: 'Direct USDC',  saved: 846.58, status: 'confirmed', age: '2m ago' },
  { id: 'stl-2', sig: '3RmK8pW7vXc', from: 'Singapore HQ',  to: 'Mexico City',   amount: 120000, pair: 'USDC→MXNe', route: 'Jupiter Agg.',  saved: 406.22, status: 'confirmed', age: '18m ago' },
  { id: 'stl-3', sig: '7NbQ4sT1yHz', from: 'São Paulo',     to: 'Manila',        amount: 80000,  pair: 'BRZ→PHPC',  route: 'Orca',          saved: 271.71, status: 'confirmed', age: '1h ago' },
  { id: 'stl-4', sig: '2PjL6wR9mKf', from: 'Singapore HQ',  to: 'Mumbai',        amount: 450000, pair: 'USDC→INRe', route: 'Direct USDC',   saved: 1523.5, status: 'confirmed', age: '3h ago' },
];

const STATUS = { confirmed: '#4ade80', pending: '#facc15', failed: '#f87171' };

export default function TxHistory({ liveTxs = [] }) {
  const all = [...liveTxs.map(tx => ({
    id: tx.sig, sig: tx.sig, from: 'Your Wallet', to: tx.pair?.to ?? 'Recipient',
    amount: tx.amount, pair: `${tx.pair?.from}→${tx.pair?.to}`,
    route: tx.route?.label, saved: tx.saved, status: 'confirmed', age: 'just now', live: true,
  })), ...SEED];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
        <div className="caption">Recent Settlements</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{all.length} total</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
        {all.map(tx => (
          <div key={tx.id} style={{
            padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--r-md)',
            background: tx.live ? 'var(--brand-green-dim)' : 'var(--bg-3)',
            border: `1px solid ${tx.live ? 'var(--brand-green-border)' : 'var(--border-1)'}`,
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--sp-3)', alignItems: 'center',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS[tx.status], flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-1)' }}>
                  {tx.from} → {tx.to}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{tx.pair}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>
                <span className="mono">${(tx.amount || 0).toLocaleString()} USDC</span>
                <span>·</span>
                <span>{tx.route}</span>
                <span>·</span>
                <span>{tx.age}</span>
                {tx.sig && tx.live && (
                  <>
                    <span>·</span>
                    <a href={`https://explorer.solana.com/tx/${tx.sig}?cluster=devnet`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--brand-green)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                      {tx.sig.slice(0, 12)}… ↗
                    </a>
                  </>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--brand-green)' }}>
                +${(tx.saved || 0).toFixed(2)}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>saved</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
