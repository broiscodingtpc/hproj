import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, Zap, ChevronRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="hero-section" style={{ padding: '8rem 0 4rem 0', position: 'relative' }}>
      <div className="bg-glow"></div>
      
      <div className="app-container">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', background: 'var(--glass-bg)', borderRadius: '20px', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
            <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: 'var(--accent-green)', marginRight: '8px', boxShadow: '0 0 10px var(--accent-green)' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>Solana Hackathon Frontier Submission</span>
          </div>
          
          <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.1 }}>
            Automating Treasury in <br />
            <span className="text-gradient">Emerging Markets.</span>
          </h1>
          
          <p style={{ fontSize: '1.2rem', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
            Treasury Agent is an AI-powered banking platform solving the $50M treasury management gap with 3-second Solana settlement and reinforced learning route optimization.
          </p>
          
          <div className="flex-center" style={{ gap: '1rem', marginBottom: '4rem' }}>
            <button className="primary-btn flex-center">
              View the Source
              <ChevronRight size={18} style={{ marginLeft: '6px' }} />
            </button>
            <button className="secondary-btn">
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Floating Metrics */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { title: 'Settlement Speed', value: '3 Seconds', icon: <Zap color="var(--accent-green)" />, sub: 'vs 3-5 days traditional' },
            { title: 'Optimal Routing', value: '0.15% Cost', icon: <Activity color="var(--accent-purple)" />, sub: 'AI learns best paths' },
            { title: 'Compliance', value: '100% Audit', icon: <ShieldCheck color="#ffffff" />, sub: 'On-chain trails' }
          ].map((metric, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
              className="glass-panel"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', marginBottom: '1rem' }}>
                {metric.icon}
              </div>
              <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{metric.title}</p>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px', color: '#fff' }}>{metric.value}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>{metric.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
