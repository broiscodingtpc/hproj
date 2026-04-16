/**
 * Treasury Agent — interactive dashboard mock.
 * Shows accounts, live settlement list, and the approval flow.
 * All state is local — no backend needed for the demo.
 */

import React, { useState, useEffect } from 'react';

// ── Seed data ────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { id: 'acct-sg', name: 'Singapore HQ',        currency: 'USDC', balance: 4_287_500, flag: '🇸🇬', change: +2.3 },
  { id: 'acct-br', name: 'São Paulo Subsidiary', currency: 'BRZ',  balance: 1_843_200, flag: '🇧🇷', change: -0.8 },
  { id: 'acct-mx', name: 'Mexico City Office',   currency: 'MXNe', balance:   672_400, flag: '🇲🇽', change: +1.1 },
  { id: 'acct-ph', name: 'Manila Operations',    currency: 'PHPC', balance:   329_100, flag: '🇵🇭', change: +0.4 },
];

const SETTLEMENTS_SEED = [
  { id: 'stl-1', from: 'Singapore HQ', to: 'São Paulo Subsidiary', amount: 250_000, currency: 'USDC→BRZ', status: 'completed', cost: 0.42, saved: 846.58, duration: '2.8s', time: '14:32', route: 'Direct USDC', approvals: 2 },
  { id: 'stl-2', from: 'Singapore HQ', to: 'Mexico City Office',   amount: 120_000, currency: 'USDC→MXNe', status: 'completed', cost: 0.38, saved: 406.22, duration: '3.1s', time: '11:15', route: 'Jupiter Swap', approvals: 2 },
  { id: 'stl-3', from: 'São Paulo Subsidiary', to: 'Manila Operations', amount: 80_000, currency: 'BRZ→PHPC', status: 'awaiting', cost: 0.29, saved: 271.71, duration: '—', time: '09:44', route: 'Orca Whirlpool', approvals: 1 },
  { id: 'stl-4', from: 'Singapore HQ', to: 'Manila Operations',   amount: 45_000, currency: 'USDC→PHPC', status: 'pending', cost: 0.18, saved: 152.82, duration: '—', time: '08:00', route: 'Direct USDC', approvals: 0 },
];

const STATUS_COLOR = {
  completed: '#4ade80',
  awaiting:  '#facc15',
  pending:   '#94a3b8',
  failed:    '#f87171',
};

const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

// ── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [settlements, setSettlements] = useState(SETTLEMENTS_SEED);
  const [selected, setSelected]       = useState(null);
  const [approving, setApproving]     = useState(false);

  const totalSaved = settlements.reduce((s, x) => s + x.saved, 0);
  const totalVol   = settlements.reduce((s, x) => s + x.amount, 0);
  const completed  = settlements.filter(s => s.status === 'completed').length;

  const approve = (id) => {
    setApproving(true);
    setTimeout(() => {
      setSettlements(prev => prev.map(s =>
        s.id === id
          ? { ...s, approvals: s.approvals + 1,
              status: s.approvals + 1 >= 2 ? 'completed' : 'awaiting',
              duration: s.approvals + 1 >= 2 ? '2.9s' : '—' }
          : s
      ));
      setApproving(false);
      setSelected(null);
    }, 1200);
  };

  return (
    <section id="dashboard" style={{ padding: '6rem 0', background: '#050505' }}>
      <div className="app-container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={chipStyle}>Treasury Dashboard</div>
          <h2 style={h2Style}>Real-time settlement control center</h2>
          <p style={subStyle}>Multi-currency accounts, live settlement tracking, and one-click multi-sig approval.</p>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Volume', value: `$${fmt(totalVol)}`, color: '#4ade80' },
            { label: 'Saved vs SWIFT', value: `$${fmt(totalSaved)}`, color: '#a78bfa' },
            { label: 'Completed', value: `${completed} / ${settlements.length}`, color: '#4ade80' },
            { label: 'Avg Cost', value: `$0.32`, color: '#4ade80' },
          ].map(k => (
            <div key={k.label} style={kpiCardStyle}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{k.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: k.color, marginTop: '0.3rem' }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem' }}>
          {/* Accounts panel */}
          <div style={panelStyle}>
            <div style={panelHeader}>Treasury Accounts</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {ACCOUNTS.map(a => (
                <div key={a.id} style={accountRow}>
                  <span style={{ fontSize: '1.4rem' }}>{a.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{a.currency}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>${fmt(a.balance)}</div>
                    <div style={{ fontSize: '0.75rem', color: a.change >= 0 ? '#4ade80' : '#f87171' }}>
                      {a.change >= 0 ? '+' : ''}{a.change}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settlements panel */}
          <div style={panelStyle}>
            <div style={panelHeader}>Live Settlements</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {['Route', 'Amount', 'Pair', 'Cost', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settlements.map(s => (
                  <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{s.from.split(' ')[0]}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>→ {s.to.split(' ')[0]}</div>
                    </td>
                    <td style={td}>${fmt(s.amount)}</td>
                    <td style={{ ...td, color: '#94a3b8', fontSize: '0.78rem' }}>{s.currency}</td>
                    <td style={{ ...td, color: '#4ade80' }}>${s.cost.toFixed(2)}</td>
                    <td style={td}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem',
                        fontWeight: 600, background: STATUS_COLOR[s.status] + '1a',
                        color: STATUS_COLOR[s.status],
                      }}>
                        {s.status === 'awaiting' ? `⏳ ${s.approvals}/2` : s.status}
                      </span>
                    </td>
                    <td style={td}>
                      {(s.status === 'awaiting' || s.status === 'pending') && (
                        <button onClick={() => setSelected(s)} style={approveBtnStyle}>
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approval modal */}
        {selected && (
          <div style={modalOverlay} onClick={() => !approving && setSelected(null)}>
            <div style={modalBox} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Approve Settlement
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                {selected.from} → {selected.to}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.4rem' }}>
                <Stat label="Amount" value={`$${fmt(selected.amount)}`} />
                <Stat label="Cost"   value={`$${selected.cost.toFixed(2)}`} />
                <Stat label="Route"  value={selected.route} />
                <Stat label="Approvals" value={`${selected.approvals} / 2`} />
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button onClick={() => approve(selected.id)} style={confirmBtnStyle} disabled={approving}>
                  {approving ? 'Signing…' : '✓ Approve & Execute'}
                </button>
                <button onClick={() => setSelected(null)} style={cancelBtnStyle}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Micro-components ─────────────────────────────────────────────────────────

function Stat({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.7rem' }}>
      <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
      <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{value}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const chipStyle = {
  display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '999px',
  background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
  color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600,
  marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px',
};
const h2Style = { fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.5rem' };
const subStyle = { color: '#64748b', fontSize: '1rem', maxWidth: '560px', margin: '0 auto' };
const kpiCardStyle = {
  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '12px', padding: '1.2rem 1.4rem',
};
const panelStyle = {
  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px', padding: '1.4rem',
};
const panelHeader = {
  fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '1px', marginBottom: '1rem', fontWeight: 600,
};
const accountRow = {
  display: 'flex', alignItems: 'center', gap: '0.8rem',
  padding: '0.7rem 0.8rem', borderRadius: '8px',
  background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)',
};
const td = { padding: '0.6rem 0.5rem', verticalAlign: 'middle' };
const approveBtnStyle = {
  padding: '0.3rem 0.7rem', borderRadius: '6px',
  background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)',
  color: '#facc15', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
};
const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
};
const modalBox = {
  background: '#0f1623', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px', padding: '2rem', width: '380px', maxWidth: '90vw',
};
const confirmBtnStyle = {
  flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none',
  background: 'linear-gradient(135deg, #4ade80, #a78bfa)',
  color: '#000', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
};
const cancelBtnStyle = {
  padding: '0.8rem 1.2rem', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent', color: '#94a3b8', cursor: 'pointer',
};
