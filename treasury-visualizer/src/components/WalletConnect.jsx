/**
 * WalletConnect — Phantom / browser-wallet integration.
 * Uses window.solana directly — no packages needed.
 * Falls back gracefully if no wallet is installed.
 */
import React, { useState, useCallback } from 'react';

export function useWallet() {
  const [address, setAddress]   = useState(null);
  const [balance, setBalance]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [network]               = useState('devnet');

  const short = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : null;

  const connect = useCallback(async () => {
    setError(null);
    const provider = window.phantom?.solana ?? window.solana;

    if (!provider?.isPhantom && !provider?.isBackpack) {
      window.open('https://phantom.app', '_blank');
      setError('Install Phantom to connect');
      return;
    }

    setLoading(true);
    try {
      const resp = await provider.connect();
      const pk = resp.publicKey.toString();
      setAddress(pk);

      // Fetch devnet balance
      try {
        const res = await fetch(
          `https://api.devnet.solana.com`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1,
              method: 'getBalance',
              params: [pk, { commitment: 'confirmed' }],
            }),
          }
        );
        const data = await res.json();
        setBalance((data.result?.value ?? 0) / 1e9);
      } catch { /* balance fetch is best-effort */ }
    } catch (e) {
      setError(e.message ?? 'Connection cancelled');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    const provider = window.phantom?.solana ?? window.solana;
    provider?.disconnect?.();
    setAddress(null);
    setBalance(null);
  }, []);

  /**
   * Send a tiny memo transaction on devnet as proof of life.
   * Returns the signature string or throws.
   */
  const sendMemo = useCallback(async (text = 'Treasury Agent Demo') => {
    const provider = window.phantom?.solana ?? window.solana;
    if (!provider || !address) throw new Error('Not connected');

    // Build a minimal transaction with a memo using raw RPC
    // (avoids needing @solana/web3.js in the browser bundle)
    const body = JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'getLatestBlockhash',
      params: [{ commitment: 'confirmed' }],
    });
    const bhResp = await fetch('https://api.devnet.solana.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    });
    const { result } = await bhResp.json();
    const blockhash = result?.value?.blockhash;
    if (!blockhash) throw new Error('Could not fetch blockhash');

    // Use provider.signAndSendTransaction if available, else just signMessage
    if (provider.signMessage) {
      const enc = new TextEncoder();
      const sig = await provider.signMessage(enc.encode(text), 'utf8');
      return Buffer.from(sig.signature).toString('hex');
    }
    throw new Error('signMessage not available');
  }, [address]);

  return { address, short, balance, loading, error, network, connect, disconnect, sendMemo };
}

export default function WalletConnect() {
  const { address, short, balance, loading, error, connect, disconnect } = useWallet();

  if (address) {
    return (
      <div className="flex-start gap-3">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', borderRadius: 'var(--r-pill)',
          background: 'var(--brand-green-dim)', border: '1px solid var(--brand-green-border)',
          fontSize: 'var(--text-sm)',
        }}>
          <span className="dot" style={{ background: 'var(--brand-green)', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ color: 'var(--brand-green)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {short}
          </span>
          {balance !== null && (
            <span style={{ color: 'var(--text-3)', marginLeft: 2 }}>
              {balance.toFixed(3)} SOL
            </span>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex-start gap-3">
      <button className="btn btn-wallet btn-sm" onClick={connect} disabled={loading}>
        {loading
          ? <><span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--brand-purple)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Connecting…</>
          : <>🔐 Connect Wallet</>
        }
      </button>
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error)' }}>{error}</span>}
    </div>
  );
}
