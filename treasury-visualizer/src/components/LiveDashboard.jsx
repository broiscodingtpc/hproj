import React, { useState, useEffect } from 'react';

// Live settlement simulator — the centerpiece of the hackathon demo.
// Walks through: route prediction → multi-sig approval → Solana execution → confirmation.

const ROUTES = [
  { id: 'direct', name: 'Direct USDC Transfer', cost: '$0.42', time: '2.8s', confidence: 0.94, savings: '$847' },
  { id: 'jupiter', name: 'Jupiter Aggregator (USDC → BRZ)', cost: '$1.18', time: '3.4s', confidence: 0.91, savings: '$821' },
  { id: 'swift', name: 'SWIFT Wire (baseline)', cost: '$847.00', time: '3 days', confidence: 1.0, savings: '$0' },
];

const STAGES = [
  { id: 'idle', label: 'Ready' },
  { id: 'predicting', label: 'AI predicting optimal route' },
  { id: 'approving', label: 'Multi-sig approval (2 of 3 required)' },
  { id: 'submitting', label: 'Submitting to Solana' },
  { id: 'confirming', label: 'Awaiting confirmation' },
  { id: 'complete', label: 'Settled' },
];

export default function LiveDashboard() {
  const [stage, setStage] = useState('idle');
  const [amount] = useState(250000);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [approvals, setApprovals] = useState([false, false, false]);
  const [txHash, setTxHash] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState([]);

  const log = (msg) => {
    setLogs((prev) => [...prev, { ts: new Date().toLocaleTimeString(), msg }].slice(-8));
  };

  const reset = () => {
    setStage('idle');
    setSelectedRoute(null);
    setApprovals([false, false, false]);
    setTxHash(null);
    setElapsed(0);
    setLogs([]);
  };

  const runDemo = async () => {
    reset();
    const start = Date.now();
    const tick = () => setElapsed(((Date.now() - start) / 1000).toFixed(1));
    const timer = setInterval(tick, 100);

    try {
      // Stage 1: AI route prediction
      setStage('predicting');
      log('POST /ai/routes/predict — from=USDC, to=BRZ, amount=$250,000');
      await sleep(900);
      log('  → Q-learning model returned 3 candidate routes');
      log('  → Selected: Direct USDC Transfer (confidence 0.94)');
      setSelectedRoute(ROUTES[0]);
      await sleep(400);

      // Stage 2: Multi-sig approvals (2 of 3)
      setStage('approving');
      log('Notifying signers: Treasurer, CFO, COO');
      await sleep(700);
      setApprovals([true, false, false]);
      log('  ✓ Treasurer approved (TOTP verified)');
      await sleep(900);
      setApprovals([true, true, false]);
      log('  ✓ CFO approved — quorum reached (2 of 3)');
      await sleep(500);

      // Stage 3: Submit to Solana
      setStage('submitting');
      log('Building Solana transaction…');
      await sleep(500);
      const hash = generateTxHash();
      setTxHash(hash);
      log(`  → Submitted: ${hash.slice(0, 16)}…`);

      // Stage 4: Confirmation
      setStage('confirming');
      await sleep(1100);
      log('  → Slot 287,341,002 — finalized');
      log(`  → Network fee: 0.000005 SOL ($0.00043)`);

      // Stage 5: Done
      setStage('complete');
      log(`✅ Settlement complete in ${((Date.now() - start) / 1000).toFixed(1)}s vs 3 days SWIFT`);
      log(`💰 Saved $846.58 vs traditional wire`);
    } finally {
      clearInterval(timer);
    }
  };

  const stageIndex = STAGES.findIndex((s) => s.id === stage);

  return (
    <section id="demo" style={{ padding: '6rem 0', background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)' }}>
      <div className="app-container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '999px',
            background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)',
            color: 'var(--accent-green)', fontSize: '0.8rem', fontWeight: 600,
            marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px'
          }}>
            Live Settlement Demo
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.5rem' }}>
            Settle $250,000 in under 5 seconds
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Click run to walk through a full cross-border settlement: AI routing, multi-sig approval, on-chain execution, and confirmation.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: '1.5rem', maxWidth: '1100px', margin: '0 auto'
        }}>
          {/* LEFT — pipeline */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Settlement</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.2rem' }}>Singapore HQ → São Paulo Subsidiary</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>$250,000.00 USDC → BRZ</div>
              </div>
              <button
                onClick={stage === 'idle' || stage === 'complete' ? runDemo : reset}
                style={btnStyle(stage === 'idle' || stage === 'complete')}
              >
                {stage === 'idle' ? '▶ Run Demo' : stage === 'complete' ? '↻ Run Again' : 'Running…'}
              </button>
            </div>

            {/* Stage tracker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {STAGES.slice(1).map((s, i) => {
                const idx = i + 1;
                const active = stageIndex === idx;
                const done = stageIndex > idx;
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                    padding: '0.7rem 0.9rem', borderRadius: '8px',
                    background: active ? 'rgba(74, 222, 128, 0.08)' : done ? 'rgba(255,255,255,0.02)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.04)'}`,
                    transition: 'all 0.2s'
                  }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: done ? 'var(--accent-green)' : active ? 'transparent' : 'rgba(255,255,255,0.05)',
                      border: active ? '2px solid var(--accent-green)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', color: '#000', fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {done ? '✓' : ''}
                    </div>
                    <div style={{ flex: 1, fontSize: '0.92rem', color: active || done ? '#fff' : 'var(--text-secondary)' }}>
                      {s.label}
                    </div>
                    {active && <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} />}
                  </div>
                );
              })}
            </div>

            {/* Approval signers */}
            {(stage === 'approving' || stageIndex >= 2) && (
              <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>
                  Multi-sig signers (2 of 3 required)
                </div>
                {['Treasurer · K. Lim', 'CFO · M. Singh', 'COO · A. Costa'].map((name, i) => (
                  <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', fontSize: '0.9rem' }}>
                    <span>{name}</span>
                    <span style={{ color: approvals[i] ? 'var(--accent-green)' : 'var(--text-secondary)', fontWeight: 600 }}>
                      {approvals[i] ? '✓ Approved' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {txHash && (
              <div style={{ marginTop: '1rem', padding: '0.9rem', background: 'rgba(168, 85, 247, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Solana Transaction</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '0.3rem', wordBreak: 'break-all', color: 'var(--accent-purple)' }}>
                  {txHash}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — log + metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={panelStyle}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.8rem' }}>
                Live Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <Metric label="Elapsed" value={`${elapsed}s`} accent="green" />
                <Metric label="Vs SWIFT" value={stage === 'complete' ? '99.95%' : '—'} accent="purple" sub="faster" />
                <Metric label="Cost" value={selectedRoute ? selectedRoute.cost : '—'} accent="green" />
                <Metric label="Saved" value={stage === 'complete' ? '$846.58' : '—'} accent="purple" />
              </div>
            </div>

            <div style={{ ...panelStyle, flex: 1, minHeight: '260px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem' }}>
                Event Log
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                {logs.length === 0 && <div style={{ opacity: 0.5 }}>Waiting to start…</div>}
                {logs.map((l, i) => (
                  <div key={i}>
                    <span style={{ opacity: 0.5 }}>{l.ts}</span>{' '}
                    <span style={{ color: l.msg.startsWith('✅') || l.msg.startsWith('💰') ? 'var(--accent-green)' : '#e0e0e0' }}>
                      {l.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          .pulse-dot { animation: pulse 1s infinite; }
        `}</style>
      </div>
    </section>
  );
}

const panelStyle = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
  padding: '1.6rem',
  backdropFilter: 'blur(10px)',
};

const btnStyle = (enabled) => ({
  padding: '0.7rem 1.4rem',
  borderRadius: '999px',
  border: 'none',
  background: enabled ? 'linear-gradient(135deg, var(--accent-green), var(--accent-purple))' : 'rgba(255,255,255,0.05)',
  color: enabled ? '#000' : 'var(--text-secondary)',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: enabled ? 'pointer' : 'not-allowed',
  transition: 'transform 0.15s',
});

function Metric({ label, value, accent, sub }) {
  const color = accent === 'green' ? 'var(--accent-green)' : 'var(--accent-purple)';
  return (
    <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color, marginTop: '0.2rem' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function generateTxHash() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < 88; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
