import React from 'react';
import Hero from './components/Hero';
import LiveDashboard from './components/LiveDashboard';
import Dashboard from './components/Dashboard';
import RoutingComparison from './components/RoutingComparison';
import Architecture from './components/Architecture';
import Financials from './components/Financials';

function App() {
  return (
    <>
      {/* Top Navbar */}
      <nav style={{ padding: '1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(10px)' }}>
        <div className="app-container flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--accent-green), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#000' }}>
              TA
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Treasury Agent</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="#demo" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Demo</a>
            <a href="#dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Dashboard</a>
            <a href="#architecture" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Architecture</a>
            <a href="#economics" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Economics</a>
          </div>
        </div>
      </nav>

      <main>
        <Hero />
        <LiveDashboard />
        <Dashboard />
        <RoutingComparison />
        <div id="architecture">
          <Architecture />
        </div>
        <div id="economics">
          <Financials />
        </div>
      </main>
      
      {/* Footer */}
      <footer style={{ padding: '3rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Built for the Solana Hackathon Frontier &middot; 2026</p>
      </footer>
    </>
  );
}

export default App;
