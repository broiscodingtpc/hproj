import React from 'react';
import { motion } from 'framer-motion';
import { Database, Layout, BrainCircuit, Blocks } from 'lucide-react';

const StackLayer = ({ title, icon, items, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="glass-panel"
    style={{ marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}
  >
    <div className="flex-center" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
      {icon}
      <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{title}</h3>
    </div>
    <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '1rem' }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.name}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
        </div>
      ))}
    </div>
  </motion.div>
);

const Architecture = () => {
  return (
    <section style={{ padding: '6rem 0' }}>
      <div className="app-container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>Enterprise-Grade <span className="text-gradient">Architecture</span></h2>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>Designed for 10,000 req/hr at scale with 2-of-3 multi-sig security and real-time AI optimization.</p>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          <div className="bg-glow-purple" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.4 }}></div>
          
          <StackLayer 
            title="Presentation Layer (Vercel)" 
            icon={<Layout color="var(--accent-green)" />}
            delay={0.1}
            items={[
              { name: 'React SPA', desc: 'Treasury Dashboard' },
              { name: 'WebSocket', desc: 'Real-time Updates' }
            ]}
          />

          <div className="flex-center" style={{ height: '30px', margin: '-10px 0' }}>
            <div style={{ width: '2px', height: '100%', background: 'var(--glass-border)' }}></div>
          </div>

          <StackLayer 
            title="Microservices Core (AWS ECS)" 
            icon={<BrainCircuit color="var(--accent-purple)" />}
            delay={0.3}
            items={[
              { name: 'Node.js Settlement', desc: 'Routing logic' },
              { name: 'Python AI Agent', desc: 'Reinforcement Learning' },
              { name: 'Compliance Engine', desc: 'KYC/AML Rules' }
            ]}
          />

          <div className="flex-center" style={{ height: '30px', margin: '-10px 0' }}>
            <div style={{ width: '2px', height: '100%', background: 'var(--glass-border)' }}></div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <StackLayer 
              title="State / Ledger" 
              icon={<Blocks color="var(--accent-green)" />}
              delay={0.5}
              items={[
                { name: 'Solana Smart Contracts', desc: 'Rust, 2-of-3 Multi-sig, Timelocks' }
              ]}
            />
             <StackLayer 
              title="Data & Vaults" 
              icon={<Database color="#ffffff" />}
              delay={0.6}
              items={[
                { name: 'PostgreSQL + Redis', desc: 'Config & Off-chain Vaults' }
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Architecture;
