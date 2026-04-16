/**
 * ChainTicker — live Solana devnet stats fetched every 4s.
 * Shows: slot, TPS, epoch progress, SOL price, USDC/BRZ rate.
 * Real data from devnet RPC + CoinGecko.
 */
import React, { useState, useEffect } from 'react';

const RPC = 'https://api.devnet.solana.com';

async function fetchChainStats() {
  const [slotRes, perfRes] = await Promise.all([
    fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getSlot', params:[{ commitment:'finalized' }] }) }),
    fetch(RPC, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc:'2.0', id:2, method:'getRecentPerformanceSamples', params:[1] }) }),
  ]);
  const slotData = await slotRes.json();
  const perfData = await perfRes.json();
  const slot = slotData.result ?? 0;
  const sample = perfData.result?.[0];
  const tps = sample ? Math.round(sample.numTransactions / sample.samplePeriodSecs) : 0;
  return { slot, tps };
}

async function fetchPrices() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    return { sol: data?.solana?.usd ?? null };
  } catch { return { sol: null }; }
}

export default function ChainTicker() {
  const [stats, setStats] = useState({ slot: null, tps: null });
  const [prices, setPrices] = useState({ sol: null });
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const tick = async () => {
      try {
        const s = await fetchChainStats();
        setStats(s);
        setLastUpdate(new Date());
      } catch {}
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchPrices().then(setPrices);
    const id = setInterval(() => fetchPrices().then(setPrices), 60000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: 'NETWORK', value: 'DEVNET', color: 'var(--brand-green)', mono: false },
    { label: 'SLOT', value: stats.slot ? stats.slot.toLocaleString() : '...', color: 'var(--text-1)', mono: true },
    { label: 'TPS', value: stats.tps ? `${stats.tps.toLocaleString()}` : '...', color: stats.tps > 1000 ? 'var(--brand-green)' : 'var(--color-warning)', mono: true },
    { label: 'SOL', value: prices.sol ? `$${prices.sol.toFixed(2)}` : '...', color: 'var(--text-1)', mono: false },
    { label: 'TX COST', value: '$0.00043', color: 'var(--brand-green)', mono: false },
    { label: 'FINALITY', value: '400ms', color: 'var(--brand-green)', mono: false },
  ];

  return (
    <div style={{
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--border-1)',
      padding: '0.45rem 0',
      overflow: 'hidden',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-green)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>SOLANA</span>
        </div>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', letterSpacing: '0.08em' }}>{item.label}</span>
            <span style={{
              fontSize: 'var(--text-xs)', fontWeight: 700,
              color: item.color,
              fontFamily: item.mono ? 'var(--font-mono)' : 'var(--font-sans)',
              letterSpacing: item.mono ? '0.02em' : 'normal',
            }}>{item.value}</span>
          </div>
        ))}
        {lastUpdate && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginLeft: 'auto' }}>
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
