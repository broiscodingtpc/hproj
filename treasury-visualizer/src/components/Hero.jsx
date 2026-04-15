import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, BrainCircuit } from 'lucide-react';

const FEATURES = [
  { icon: '⚡', label: '2.8s finality on Solana' },
  { icon: '🔐', label: '2-of-3 multi-sig vaults' },
  { icon: '🤖', label: 'AI-routed every settlement' },
];

export default function Hero() {
  return (
    <section style={{ padding: 'var(--sp-24) 0 var(--sp-16) 0', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-glow-hero" />
      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 'var(--sp-8)' }}>
          <span className="badge badge-green"><span className="dot dot-pulse" />Solana Hackathon Frontier 2026</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
          style={{ fontSize: 'var(--text-6xl)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', maxWidth: 820, margin: '0 auto var(--sp-6) auto' }}>
          Cross-border treasury<br />
          <span className="gradient-text">from $847 → $0.42</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.16 }}
          className="body-lg" style={{ maxWidth: 620, margin: '0 auto var(--sp-10) auto' }}>
          AI-powered settlement for emerging-market multinationals. 2-of-3 multi-sig vaults on Solana.
          ML route optimizer. Full compliance audit trail. Live on devnet today.
        </motion.p>

        <motion.div className="flex-center gap-4" style={{ flexWrap: 'wrap', marginBottom: 'var(--sp-12)' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}>
          <a href="#demo" className="btn btn-primary btn-lg">▶ Run Live Demo</a>
          <a href="https://github.com/broiscodingtpc/hproj" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg">↗ View on GitHub</a>
        </motion.div>

        <motion.div className="flex-center gap-4" style={{ flexWrap: 'wrap', marginBottom: 'var(--sp-16)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.35 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.4rem 1rem', background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-pill)', color: 'var(--text-2)', fontSize: 'var(--text-sm)' }}>
              <span>{f.icon}</span>{f.label}
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
          style={{ display: 'inline-grid', gridTemplateColumns: '1fr auto 1fr', gap: 'var(--sp-8)', alignItems: 'center', background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', padding: 'var(--sp-6) var(--sp-10)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginBottom: 4 }}>SWIFT wire today</div>
            <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--color-error)', letterSpacing: '-0.03em' }}>$847</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: 4 }}>3–5 days · no visibility</div>
          </div>
          <div style={{ fontSize: 60, color: 'var(--text-3)', lineHeight: 1 }}>→</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginBottom: 4 }}>Treasury Agent</div>
            <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 900, color: 'var(--brand-green)', letterSpacing: '-0.03em' }}>$0.42</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: 4 }}>2.8 seconds · on-chain proof</div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
