import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, DollarSign } from 'lucide-react';

const Financials = () => {
  return (
    <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
      <div className="app-container">
        
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
          
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', background: 'rgba(153,69,255,0.1)', borderRadius: '20px', border: '1px solid rgba(153,69,255,0.2)', marginBottom: '1.5rem', color: 'var(--accent-purple)' }}>
              <Award size={16} style={{ marginRight: '8px' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Hackathon Winner Traits</span>
            </div>
            
            <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Investor-Grade <br/><span className="text-gradient">Unit Economics</span></h2>
            <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>We aren't just building a technical marvel; we're building a highly profitable, scalable B2B SaaS for the $50M+ emerging market gap.</p>
            
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { title: 'Massive Market Gap (40%)', desc: '$50M+ addressable market with 0 direct competitors.' },
                { title: 'Technical Excellence (35%)', desc: 'Solana 3-second finalizing + ML auto-routing.' },
                { title: 'Business Model (25%)', desc: 'SaaS subscription + 0.15% settlement spread.' }
              ].map((item, i) => (
                <li key={i} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: '2px', marginRight: '12px', color: 'var(--accent-green)' }}>
                    <CheckCircle />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '4px', color: '#fff' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.9rem' }}>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <MetricCard title="LTV / CAC Ratio" value="4.8x" desc="VC target is >3x" color="var(--accent-green)" delay={0.1} />
            <MetricCard title="Gross Margin" value="78%" desc="Highly scalable" color="var(--accent-purple)" delay={0.2} />
            <MetricCard title="Payback Period" value="3.5 Mo" desc="Capital efficient" color="#ffffff" delay={0.3} />
            <MetricCard title="Year 1 ARR" value="$1.8M" desc="From 14 customers" color="var(--accent-green)" delay={0.4} />
          </div>

        </div>
      </div>
    </section>
  );
};

const CheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const MetricCard = ({ title, value, desc, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay }}
    className="glass-panel"
    style={{ padding: '1.5rem', borderTop: `2px solid ${color}` }}
  >
    <h3 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem', color: color }}>{value}</h3>
    <p style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{title}</p>
    <p style={{ fontSize: '0.8rem' }}>{desc}</p>
  </motion.div>
);

export default Financials;
