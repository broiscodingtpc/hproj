import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Hero from './components/Hero';
import LiveDashboard from './components/LiveDashboard';
import Dashboard from './components/Dashboard';
import RoutingComparison from './components/RoutingComparison';
import Architecture from './components/Architecture';
import Financials from './components/Financials';
import WalletConnect from './components/WalletConnect';

const NAV_LINKS = [
  { label: 'Demo',         href: '#demo' },
  { label: 'Dashboard',    href: '#dashboard' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Economics',    href: '#economics' },
  { label: 'GitHub',       href: 'https://github.com/broiscodingtpc/hproj', external: true },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: 'var(--nav-h)',
        background: 'rgba(2,2,7,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <div className="container flex-between" style={{ height: '100%' }}>
          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--r-sm)',
              background: 'linear-gradient(135deg, var(--brand-green), var(--brand-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 15, color: '#000', letterSpacing: '-0.5px',
            }}>TA</div>
            <span style={{ fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--text-1)', letterSpacing: '-0.5px' }}>
              Treasury Agent
            </span>
            <span className="badge badge-green" style={{ marginLeft: 4 }}>
              <span className="dot dot-pulse" />
              Frontier 2026
            </span>
          </a>

          {/* Desktop links */}
          <div className="flex-start gap-6" style={{ display: 'flex' }}>
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener noreferrer' : undefined}
                style={{
                  color: 'var(--text-2)', textDecoration: 'none',
                  fontSize: 'var(--text-sm)', fontWeight: 500,
                  transition: 'color var(--dur-fast)',
                }}
                onMouseEnter={e => e.target.style.color = 'var(--text-1)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-2)'}
              >
                {l.external ? '↗ ' : ''}{l.label}
              </a>
            ))}
          </div>

          <WalletConnect />
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────── */}
      <main>
        <Hero />

        {/* Stats bar */}
        <StatsBar />

        <div id="demo">
          <LiveDashboard />
        </div>

        <HowItWorks />

        <div id="dashboard">
          <Dashboard />
        </div>

        <div id="architecture">
          <Architecture />
        </div>

        <div id="economics">
          <Financials />
        </div>

        <CTASection />
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border-1)',
        padding: 'var(--sp-10) 0',
        background: 'var(--bg-1)',
      }}>
        <div className="container flex-between">
          <div className="flex-start gap-3">
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--r-xs)',
              background: 'linear-gradient(135deg, var(--brand-green), var(--brand-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 12, color: '#000',
            }}>TA</div>
            <span style={{ color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
              Treasury Agent · Solana Hackathon Frontier 2026
            </span>
          </div>
          <div className="flex-start gap-6">
            <a href="https://github.com/broiscodingtpc/hproj" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
              GitHub
            </a>
            <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>
              Solana Explorer
            </a>
            <span style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>ro.petreamihai@gmail.com</span>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ── Stats bar ──────────────────────────────────────────────── */
function StatsBar() {
  const stats = [
    { value: '$0.42',   label: 'per $250k transfer',    sub: 'vs $847 SWIFT',  color: 'var(--brand-green)' },
    { value: '2.8s',    label: 'settlement time',        sub: 'vs 3–5 days',   color: 'var(--brand-green)' },
    { value: '2-of-3',  label: 'multi-sig approval',     sub: 'no single point of failure', color: 'var(--brand-purple)' },
    { value: '$125k',   label: 'ARR per enterprise',     sub: 'at $50M/yr volume', color: 'var(--brand-purple)' },
  ];
  return (
    <div style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)' }}>
      <div className="container grid-4" style={{ padding: 'var(--sp-8) var(--sp-8)' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }}>
            <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ color: 'var(--text-1)', fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: 6 }}>{s.label}</div>
            <div style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── How it works ───────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Connect treasury accounts',
      body: 'Link your existing wallets or create new Solana vault PDAs. Each account gets 2-of-3 multi-sig signers and configurable timelocks for large withdrawals.',
      color: 'var(--brand-green)',
      tags: ['Solana Wallet Adapter', 'Anchor PDA', 'Multi-sig'],
    },
    {
      n: '02',
      title: 'AI picks the optimal route',
      body: 'Our Q-learning model compares Direct USDC, Jupiter Aggregator, Orca Whirlpool, and cross-chain bridges — then selects the cheapest path based on real-time liquidity, fees, and confidence.',
      color: 'var(--brand-purple)',
      tags: ['Q-Learning', 'Jupiter API', 'Orca', 'Wormhole'],
    },
    {
      n: '03',
      title: 'Two signers approve, Solana executes',
      body: 'Signers approve via TOTP-secured API calls. Once quorum is reached the smart contract releases funds — execution is atomic, the audit trail is permanent and verifiable on Explorer.',
      color: 'var(--brand-green)',
      tags: ['Anchor execute_withdrawal', 'TOTP', 'On-chain audit'],
    },
  ];

  return (
    <section className="section" style={{ background: 'var(--bg-1)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp-16)' }}>
          <div className="section-label">How it works</div>
          <h2 className="h2">From request to settlement<br /><span className="gradient-text">in under 3 seconds</span></h2>
        </div>
        <div className="grid-3">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="card card-lg"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{ borderColor: s.color + '22', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{
                position: 'absolute', top: -20, right: -10,
                fontSize: 100, fontWeight: 900, lineHeight: 1,
                color: s.color, opacity: 0.04, fontFamily: 'var(--font-mono)',
              }}>{s.n}</div>
              <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: s.color, fontWeight: 700, marginBottom: 'var(--sp-3)' }}>
                STEP {s.n}
              </div>
              <h3 className="h4" style={{ marginBottom: 'var(--sp-3)', color: 'var(--text-1)' }}>{s.title}</h3>
              <p className="body" style={{ marginBottom: 'var(--sp-5)' }}>{s.body}</p>
              <div className="flex-start gap-2" style={{ flexWrap: 'wrap' }}>
                {s.tags.map(t => (
                  <span key={t} className="badge badge-neutral">{t}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section className="section" style={{ background: 'var(--bg-0)', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-glow-hero" style={{ opacity: 0.6 }} />
      <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="section-label" style={{ justifyContent: 'center' }}>Design partners</div>
        <h2 className="h2" style={{ marginBottom: 'var(--sp-5)' }}>
          3 free pilots.<br />
          <span className="gradient-text">One quarter to prove it works.</span>
        </h2>
        <p className="body-lg" style={{ maxWidth: 560, margin: '0 auto var(--sp-10) auto' }}>
          We're looking for multinationals with cross-border treasury pain — India, Philippines, Mexico, Brazil corridors. Free pilot, then a paid contract if we save you money.
        </p>
        <div className="flex-center gap-4" style={{ flexWrap: 'wrap' }}>
          <a href="https://github.com/broiscodingtpc/hproj" target="_blank" rel="noopener noreferrer"
            className="btn btn-secondary btn-lg">
            ↗ View Source on GitHub
          </a>
          <a href="mailto:ro.petreamihai@gmail.com?subject=Treasury Agent Pilot"
            className="btn btn-primary btn-lg">
            Apply for Free Pilot →
          </a>
        </div>
        <div style={{ marginTop: 'var(--sp-12)', display: 'flex', justifyContent: 'center', gap: 'var(--sp-8)', flexWrap: 'wrap' }}>
          {[
            ['Anchor / Rust', 'Smart contracts'],
            ['TypeScript', 'Backend API'],
            ['Python', 'ML routing'],
            ['React', 'Frontend'],
            ['PostgreSQL', 'Database'],
          ].map(([tech, role]) => (
            <div key={tech} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 'var(--text-sm)' }}>{tech}</div>
              <div style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)', marginTop: 2 }}>{role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
