import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ServerCrash, CheckCircle2 } from 'lucide-react';

const RoutingComparison = () => {
  return (
    <section style={{ padding: '6rem 0', position: 'relative' }}>
      <div className="app-container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>The <span className="text-gradient">Problem</span> vs Our <span className="text-gradient-green">Solution</span></h2>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>Traditional cross-border routing wastes time and obscures fees. We cut out the middleman entirely.</p>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* TRADITIONAL WAY */}
          <div className="glass-panel" style={{ border: '1px solid rgba(255,50,50,0.2)' }}>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#ff5555', display: 'flex', alignItems: 'center' }}>
                <ServerCrash size={20} style={{ marginRight: '8px' }} />
                Traditional Banking
              </h3>
              <span style={{ fontSize: '0.8rem', background: 'rgba(255,50,50,0.1)', padding: '4px 10px', borderRadius: '12px', color: '#ffaaaa' }}>3-5 Days</span>
            </div>
            
            <div style={{ position: 'relative', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* Fake bank nodes */}
              <div className="flex-between">
                <div style={bankNodeStyle}>Initiator Bank</div>
                <ArrowRight color="#ff5555" />
                <div style={bankNodeStyle}>Correspondent</div>
              </div>
              <div className="flex-center">
                <ArrowRight color="#ff5555" style={{ transform: 'rotate(90deg)' }} />
              </div>
              <div className="flex-between">
                <div style={bankNodeStyle}>Clearing House</div>
                <ArrowRight color="#ff5555" />
                <div style={bankNodeStyle}>Receiver Bank</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '2rem', textAlign: 'center' }}>5-10% hidden fees, zero visibility, manual approvals.</p>
          </div>

          {/* TREASURY AGENT WAY */}
          <div className="glass-panel" style={{ border: '1px solid rgba(20,241,149,0.3)', position: 'relative', overflow: 'hidden' }}>
            <div className="bg-glow" style={{ top: '-100px', left: '-100px', opacity: 0.5 }}></div>
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center' }}>
                <CheckCircle2 size={20} style={{ marginRight: '8px' }} />
                Treasury Agent (Solana)
              </h3>
              <span style={{ fontSize: '0.8rem', background: 'rgba(20,241,149,0.1)', padding: '4px 10px', borderRadius: '12px', color: 'var(--accent-green)' }}>3 Seconds</span>
            </div>
            
            <div style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={taNodeStyle}>Treasury<br/>Vault (USDC)</div>
              
              <div style={{ flex: 1, position: 'relative', height: '4px', background: 'rgba(255,255,255,0.1)', margin: '0 20px', borderRadius: '2px' }}>
                <motion.div 
                  initial={{ left: 0 }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', top: '-4px', width: '20px', height: '12px', background: 'var(--accent-green)', borderRadius: '10px', boxShadow: '0 0 15px var(--accent-green)' }}
                />
                <div style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>AI Optimized Route</div>
              </div>
              
              <div style={taNodeStyle}>Receiver<br/>Vault (PHP)</div>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '2rem', textAlign: 'center', color: 'var(--text-primary)' }}>0.15% fee, instant settlement, permanent audit trail.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const bankNodeStyle = {
  background: '#1a1a1a',
  border: '1px solid #333',
  padding: '10px 15px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  color: '#888'
};

const taNodeStyle = {
  background: 'rgba(20,241,149,0.05)',
  border: '1px solid var(--accent-green)',
  padding: '15px 20px',
  borderRadius: '12px',
  fontSize: '0.9rem',
  fontWeight: 'bold',
  color: '#fff',
  textAlign: 'center'
};

export default RoutingComparison;
