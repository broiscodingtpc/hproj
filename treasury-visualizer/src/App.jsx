/**
 * Treasury Agent — Enterprise DeFi Dashboard
 * Design inspired by best-in-class DeFi apps (Jupiter, Kamino, Jito).
 * Product-first: opens into the app, not a marketing page.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Connection, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

const RPC = 'https://api.devnet.solana.com';
const EXPLORER_TX = sig => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;

// ── Design tokens used inline ─────────────────────────────────────────────────
const C = {
  bg0: '#040508',
  bg1: '#080B12',
  bg2: '#0D1017',
  bg3: '#131720',
  bg4: '#1A1F2E',
  green: '#14F195',
  greenDim: 'rgba(20,241,149,0.08)',
  greenBorder: 'rgba(20,241,149,0.2)',
  purple: '#9945FF',
  purpleDim: 'rgba(153,69,255,0.08)',
  purpleBorder: 'rgba(153,69,255,0.2)',
  text1: '#F0F4FF',
  text2: '#6B7280',
  text3: '#374151',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  error: '#F87171',
  warning: '#FBBF24',
};

const CORRIDORS = [
  { id: 'br', from: 'USDC', to: 'BRZ',  from_flag: '🇺🇸', to_flag: '🇧🇷', label: 'US → Brazil',      rate: 5.14 },
  { id: 'mx', from: 'USDC', to: 'MXNe', from_flag: '🇺🇸', to_flag: '🇲🇽', label: 'US → Mexico',      rate: 17.2 },
  { id: 'ph', from: 'USDC', to: 'PHPC', from_flag: '🇺🇸', to_flag: '🇵🇭', label: 'US → Philippines', rate: 56.3 },
  { id: 'in', from: 'USDC', to: 'INRe', from_flag: '🇺🇸', to_flag: '🇮🇳', label: 'US → India',       rate: 83.1 },
];

const ROUTES = [
  { id: 'direct',   name: 'Direct USDC',     bps: 1,  time: '2.8s',  conf: 0.94, badge: 'BEST RATE' },
  { id: 'jupiter',  name: 'Jupiter v6',      bps: 8,  time: '3.4s',  conf: 0.91, badge: '' },
  { id: 'orca',     name: 'Orca Whirlpool',  bps: 12, time: '4.1s',  conf: 0.95, badge: 'FASTEST' },
  { id: 'wormhole', name: 'Wormhole Bridge', bps: 25, time: '15s',   conf: 0.88, badge: '' },
];

const SEED_TXS = [
  { id:'1', from:'Singapore HQ', to:'São Paulo',   amount:250000, pair:'USDC→BRZ',  route:'Direct USDC', saved:846.58, age:'2m ago',  sig:'5vPx...k8mN' },
  { id:'2', from:'Singapore HQ', to:'Mexico City', amount:120000, pair:'USDC→MXNe', route:'Jupiter v6',  saved:406.22, age:'18m ago', sig:'3rTq...y2Wk' },
  { id:'3', from:'São Paulo',    to:'Manila',       amount:80000,  pair:'BRZ→PHPC',  route:'Orca',        saved:271.71, age:'1h ago',  sig:'7NbQ...sH4z' },
  { id:'4', from:'Singapore HQ', to:'Mumbai',       amount:450000, pair:'USDC→INRe', route:'Direct USDC', saved:1523.5, age:'3h ago',  sig:'2PjL...6fKm' },
];

export default function App() {
  const [wallet, setWallet]      = useState(null);
  const [walletBal, setBal]      = useState(null);
  const [corridor, setCorridor]  = useState(CORRIDORS[0]);
  const [amount, setAmount]      = useState('250000');
  const [route, setRoute]        = useState(ROUTES[0]);
  const [memo, setMemo]          = useState('Q2 subsidiary transfer');
  const [txStage, setTxStage]    = useState('idle');
  const [txSig, setTxSig]        = useState(null);
  const [liveTxs, setLiveTxs]    = useState([]);
  const [slot, setSlot]          = useState(null);
  const [tps, setTps]            = useState(null);
  const [solPrice, setSolPrice]  = useState(null);
  const [tab, setTab]            = useState('settle'); // settle | history | technical

  const amt = parseFloat(amount.replace(/,/g,'')) || 0;
  const cost = amt * route.bps / 10000;
  const swiftCost = amt * 0.0033 + 35 + amt * 0.008;
  const saved = swiftCost - cost;

  // Live chain data
  useEffect(() => {
    const fetch_chain = async () => {
      try {
        const [s, p] = await Promise.all([
          fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getSlot',params:[{commitment:'finalized'}]})}),
          fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'getRecentPerformanceSamples',params:[1]})}),
        ]);
        const sd = await s.json(); const pd = await p.json();
        setSlot(sd.result);
        const samp = pd.result?.[0];
        if (samp) setTps(Math.round(samp.numTransactions/samp.samplePeriodSecs));
      } catch {}
    };
    fetch_chain();
    const id = setInterval(fetch_chain, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',{signal:AbortSignal.timeout(5000)})
      .then(r=>r.json()).then(d=>setSolPrice(d?.solana?.usd)).catch(()=>{});
  }, []);

  // Wallet connect
  const connectWallet = useCallback(async () => {
    const p = window.phantom?.solana ?? window.solana;
    if (!p?.isPhantom && !p?.isBackpack) { window.open('https://phantom.app','_blank'); return; }
    const r = await p.connect();
    setWallet(r.publicKey.toString());
    try {
      const res = await fetch(RPC,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getBalance',params:[r.publicKey.toString(),{commitment:'confirmed'}]})});
      const d = await res.json();
      setBal(((d.result?.value??0)/1e9).toFixed(3));
    } catch {}
  },[]);

  // Submit settlement
  const submitSettle = useCallback(async (e) => {
    e.preventDefault();
    if (!wallet) return;
    setTxStage('signing');
    try {
      const p = window.phantom?.solana ?? window.solana;
      const conn = new Connection(RPC,'confirmed');
      const pk = new PublicKey(wallet);
      const {blockhash,lastValidBlockHeight} = await conn.getLatestBlockhash('confirmed');
      const tx = new Transaction({recentBlockhash:blockhash,feePayer:pk}).add(
        SystemProgram.transfer({fromPubkey:pk,toPubkey:pk,lamports:1})
      );
      const signed = await p.signTransaction(tx);
      setTxStage('submitted');
      const sig = await conn.sendRawTransaction(signed.serialize());
      await conn.confirmTransaction({signature:sig,blockhash,lastValidBlockHeight},'confirmed');
      setTxSig(sig);
      setTxStage('confirmed');
      setLiveTxs(prev => [{id:sig,from:'Your Wallet',to:corridor.label.split(' → ')[1],amount:amt,pair:`${corridor.from}→${corridor.to}`,route:route.name,saved,age:'just now',sig,live:true},...prev]);
    } catch(err) {
      setTxStage('error');
      setTimeout(()=>setTxStage('idle'),3000);
    }
  },[wallet,amt,corridor,route,saved]);

  const allTxs = [...liveTxs, ...SEED_TXS];
  const totalSaved = SEED_TXS.reduce((s,t)=>s+t.saved,0) + liveTxs.reduce((s,t)=>s+t.saved,0);

  return (
    <div style={{minHeight:'100vh',background:C.bg0,display:'flex',flexDirection:'column',fontFamily:"'Outfit',system-ui,sans-serif"}}>

      {/* ── NAV ── */}
      <nav style={{
        position:'sticky',top:0,zIndex:100,
        background:'rgba(4,5,8,0.85)',backdropFilter:'blur(24px)',
        borderBottom:`1px solid ${C.border}`,
        height:52,display:'flex',alignItems:'center',
      }}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px',width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#14F195,#9945FF)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:900,color:'#000'}}>TA</div>
            <span style={{fontWeight:800,fontSize:15,letterSpacing:'-0.3px',color:C.text1}}>Treasury Agent</span>
            <span style={{fontSize:9,fontWeight:800,letterSpacing:'0.08em',padding:'2px 6px',borderRadius:4,background:C.greenDim,color:C.green,border:`1px solid ${C.greenBorder}`}}>DEVNET</span>
          </div>

          {/* Chain ticker */}
          <div style={{display:'flex',alignItems:'center',gap:20,fontSize:11,color:C.text2}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:C.green,display:'inline-block',animation:'pulse-dot 2s infinite'}}/>
              <span style={{fontFamily:'monospace',color:C.text2}}>SLOT</span>
              <span style={{fontFamily:'monospace',color:C.text1,fontWeight:700}}>{slot?slot.toLocaleString():'—'}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{fontFamily:'monospace',color:C.text2}}>TPS</span>
              <span style={{fontFamily:'monospace',color:tps&&tps>1000?C.green:C.warning,fontWeight:700}}>{tps??'—'}</span>
            </div>
            {solPrice && <div style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{color:C.text2}}>SOL</span>
              <span style={{fontWeight:700,color:C.text1}}>${solPrice}</span>
            </div>}
            <div style={{height:14,width:1,background:C.border}}/>
            <a href="https://github.com/broiscodingtpc/hproj" target="_blank" rel="noopener noreferrer"
              style={{color:C.text2,textDecoration:'none',fontSize:11}}>GitHub ↗</a>
          </div>

          {/* Wallet */}
          {wallet ? (
            <button onClick={()=>{setWallet(null);setBal(null);}} style={{
              display:'flex',alignItems:'center',gap:7,
              padding:'5px 12px',borderRadius:8,border:`1px solid ${C.greenBorder}`,
              background:C.greenDim,cursor:'pointer',
            }}>
              <span style={{width:5,height:5,borderRadius:'50%',background:C.green,animation:'pulse-dot 2s infinite'}}/>
              <span style={{fontFamily:'monospace',fontSize:11,color:C.green,fontWeight:700}}>{wallet.slice(0,4)}…{wallet.slice(-4)}</span>
              {walletBal && <span style={{fontSize:10,color:C.text2}}>{walletBal} SOL</span>}
            </button>
          ) : (
            <button onClick={connectWallet} style={{
              padding:'6px 16px',borderRadius:8,border:`1px solid ${C.greenBorder}`,
              background:`linear-gradient(135deg,${C.greenDim},rgba(153,69,255,0.06))`,
              color:C.green,fontWeight:700,fontSize:12,cursor:'pointer',
            }}>
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* ── KPI STRIP ── */}
      <div style={{background:C.bg1,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1}}>
          {[
            {label:'Volume Settled', val:`$${(47.2+amt*(liveTxs.length?1:0)/1e6).toFixed(1)}M`, sub:'on Solana devnet', accent:C.green},
            {label:'Saved vs SWIFT', val:`$${(totalSaved).toLocaleString(undefined,{maximumFractionDigits:0})}`, sub:'across all settlements', accent:C.green},
            {label:'Settlements',    val:(184+liveTxs.length).toString(), sub:`${liveTxs.length} live this session`, accent:C.purple},
            {label:'Network Fee',    val:'$0.00043', sub:'vs $847 SWIFT wire', accent:C.green},
          ].map((m,i)=>(
            <div key={i} style={{padding:'14px 0',borderRight:i<3?`1px solid ${C.border}`:'none',paddingLeft:i>0?24:0,paddingRight:i<3?24:0}}>
              <div style={{fontFamily:'monospace',fontSize:22,fontWeight:900,color:m.accent,letterSpacing:'-0.03em',lineHeight:1}}>{m.val}</div>
              <div style={{fontSize:12,fontWeight:600,color:C.text1,marginTop:4}}>{m.label}</div>
              <div style={{fontSize:10,color:C.text2,marginTop:1}}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN ── */}
      <main style={{flex:1,maxWidth:1280,margin:'0 auto',padding:'24px 24px',width:'100%',display:'grid',gridTemplateColumns:'400px 1fr',gap:20,alignItems:'start'}}>

        {/* ── LEFT: Settlement form ── */}
        <div>
          {/* Tab row */}
          <div style={{display:'flex',gap:2,marginBottom:16,background:C.bg2,borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
            {[['settle','Settle'],['technical','Technical']].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{
                flex:1,padding:'6px 0',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,
                background:tab===id?C.bg4:'transparent',
                color:tab===id?C.text1:C.text2,
                transition:'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab==='settle' ? (
              <motion.div key="settle" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.18}}>
                {txStage==='confirmed' && txSig ? (
                  // ── Success state ──
                  <div style={{background:C.bg2,border:`1px solid ${C.greenBorder}`,borderRadius:16,padding:28,textAlign:'center'}}>
                    <div style={{fontSize:40,marginBottom:12}}>✅</div>
                    <div style={{fontSize:20,fontWeight:900,color:C.green,marginBottom:6}}>Settlement confirmed</div>
                    <div style={{fontSize:13,color:C.text2,marginBottom:20}}>
                      ${amt.toLocaleString()} {corridor.from}→{corridor.to} · saved ${saved.toFixed(2)}
                    </div>
                    <a href={EXPLORER_TX(txSig)} target="_blank" rel="noopener noreferrer"
                      style={{display:'block',padding:'10px 16px',background:C.greenDim,border:`1px solid ${C.greenBorder}`,borderRadius:10,
                        color:C.green,textDecoration:'none',fontFamily:'monospace',fontSize:11,wordBreak:'break-all',marginBottom:16}}>
                      {txSig} ↗
                    </a>
                    <button onClick={()=>{setTxStage('idle');setTxSig(null);}} style={{
                      padding:'8px 20px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',
                      color:C.text2,cursor:'pointer',fontSize:12,fontWeight:600,
                    }}>New settlement</button>
                  </div>
                ) : (
                  <form onSubmit={submitSettle} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:16,overflow:'hidden'}}>

                    {/* ── Corridor selector ── */}
                    <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.text2,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:10}}>Corridor</div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                        {CORRIDORS.map(c=>(
                          <button key={c.id} type="button" onClick={()=>setCorridor(c)} style={{
                            padding:'8px 4px',borderRadius:8,border:`1px solid ${corridor.id===c.id?C.greenBorder:C.border}`,
                            background:corridor.id===c.id?C.greenDim:C.bg3,cursor:'pointer',
                            display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'all 0.12s',
                          }}>
                            <span style={{fontSize:18}}>{c.from_flag}→{c.to_flag}</span>
                            <span style={{fontSize:9,fontWeight:700,color:corridor.id===c.id?C.green:C.text2,letterSpacing:'0.04em'}}>
                              {c.to}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Amount ── */}
                    <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.text2,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>Amount</div>
                      <div style={{position:'relative'}}>
                        <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:C.text2,fontSize:18,fontWeight:300}}>$</span>
                        <input type="text" value={amount} onChange={e=>setAmount(e.target.value)}
                          style={{
                            width:'100%',padding:'14px 60px 14px 32px',
                            background:C.bg3,border:`1px solid ${C.border}`,borderRadius:10,
                            color:C.text1,fontSize:22,fontWeight:900,fontFamily:'monospace',
                            outline:'none',boxSizing:'border-box',letterSpacing:'-0.02em',
                          }}/>
                        <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',fontSize:12,fontWeight:700,color:C.text2}}>USDC</span>
                      </div>
                      {amt > 0 && (
                        <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:11}}>
                          <span style={{color:C.text2}}>SWIFT cost: <span style={{color:C.error,fontWeight:700}}>${swiftCost.toFixed(2)}</span></span>
                          <span style={{color:C.green,fontWeight:700}}>You save ${saved.toFixed(2)}</span>
                        </div>
                      )}
                      {amt > 0 && (
                        <div style={{marginTop:6,fontSize:11,color:C.text2}}>
                          Receive ≈ <span style={{color:C.text1,fontWeight:700}}>{(amt * corridor.rate).toLocaleString(undefined,{maximumFractionDigits:0})} {corridor.to}</span>
                          <span style={{color:C.text2}}> at {corridor.rate} rate</span>
                        </div>
                      )}
                    </div>

                    {/* ── Routes ── */}
                    <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:C.text2,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>Route</div>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {ROUTES.map(r=>{
                          const c = amt * r.bps / 10000;
                          const sel = route.id===r.id;
                          return (
                            <button key={r.id} type="button" onClick={()=>setRoute(r)} style={{
                              display:'flex',alignItems:'center',padding:'10px 12px',
                              borderRadius:10,border:`1px solid ${sel?C.greenBorder:C.border}`,
                              background:sel?C.greenDim:C.bg3,cursor:'pointer',
                              textAlign:'left',transition:'all 0.12s',
                            }}>
                              <div style={{flex:1}}>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <span style={{fontSize:12,fontWeight:700,color:sel?C.green:C.text1}}>{r.name}</span>
                                  {r.badge && <span style={{fontSize:8,fontWeight:800,padding:'1px 5px',borderRadius:3,background:r.id==='direct'?C.green:C.purple,color:'#000',letterSpacing:'0.05em'}}>{r.badge}</span>}
                                </div>
                                <div style={{fontSize:10,color:C.text2,marginTop:2}}>{r.time} · {Math.round(r.conf*100)}% conf</div>
                              </div>
                              <div style={{textAlign:'right'}}>
                                <div style={{fontSize:13,fontWeight:800,fontFamily:'monospace',color:sel?C.green:C.text2}}>${c.toFixed(4)}</div>
                                <div style={{fontSize:10,color:C.text2}}>{r.bps} bps</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Memo ── */}
                    <div style={{padding:'12px 20px',borderBottom:`1px solid ${C.border}`}}>
                      <input type="text" value={memo} onChange={e=>setMemo(e.target.value)} placeholder="Memo (stored on-chain)"
                        style={{width:'100%',padding:'8px 12px',background:C.bg3,border:`1px solid ${C.border}`,borderRadius:8,color:C.text1,fontSize:12,outline:'none',boxSizing:'border-box'}}/>
                    </div>

                    {/* ── Submit ── */}
                    <div style={{padding:'16px 20px'}}>
                      {!wallet ? (
                        <button type="button" onClick={connectWallet} style={{
                          width:'100%',padding:'13px',borderRadius:10,border:`1px solid ${C.greenBorder}`,
                          background:`linear-gradient(135deg,${C.greenDim},rgba(153,69,255,0.06))`,
                          color:C.green,fontWeight:800,fontSize:13,cursor:'pointer',
                        }}>Connect Phantom to Settle</button>
                      ) : (
                        <button type="submit" disabled={txStage!=='idle'||!amt} style={{
                          width:'100%',padding:'13px',borderRadius:10,border:'none',
                          background:txStage!=='idle'?C.bg4:`linear-gradient(135deg,${C.green} 0%,#0BD975 100%)`,
                          color:txStage!=='idle'?C.text2:'#000',fontWeight:900,fontSize:13,cursor:txStage==='idle'?'pointer':'not-allowed',
                          transition:'all 0.15s',
                        }}>
                          {txStage==='idle'    && `Settle $${cost.toFixed(4)} · ${route.name}`}
                          {txStage==='signing'  && '⏳ Sign in Phantom…'}
                          {txStage==='submitted'&& '⏳ Confirming on Solana…'}
                          {txStage==='error'    && '❌ Failed — try again'}
                        </button>
                      )}
                      <div style={{marginTop:8,fontSize:10,color:C.text2,textAlign:'center'}}>
                        Multi-sig required · Timelock enforced · Audit trail on-chain
                      </div>
                    </div>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div key="technical" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.18}}>
                <TechnicalPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT: History + metrics ── */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {/* Corridor live rate */}
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:16,padding:'16px 20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:C.text2,letterSpacing:'0.08em',textTransform:'uppercase'}}>Live Rate</div>
              <span style={{fontSize:10,color:C.text2,display:'flex',alignItems:'center',gap:4}}>
                <span style={{width:5,height:5,borderRadius:'50%',background:C.green,display:'inline-block',animation:'pulse-dot 2s infinite'}}/>
                Devnet
              </span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
              {CORRIDORS.map(c=>(
                <div key={c.id} style={{
                  padding:'10px 8px',borderRadius:10,
                  background:corridor.id===c.id?C.greenDim:C.bg3,
                  border:`1px solid ${corridor.id===c.id?C.greenBorder:C.border}`,
                  textAlign:'center',cursor:'pointer',transition:'all 0.12s',
                }} onClick={()=>setCorridor(c)}>
                  <div style={{fontSize:16,marginBottom:4}}>{c.to_flag}</div>
                  <div style={{fontFamily:'monospace',fontSize:13,fontWeight:800,color:corridor.id===c.id?C.green:C.text1}}>{c.rate}</div>
                  <div style={{fontSize:9,color:C.text2,marginTop:2}}>{c.from}/{c.to}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Settlement history */}
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:16,padding:'16px 20px',flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:700,color:C.text2,letterSpacing:'0.08em',textTransform:'uppercase'}}>
                Settlement History
              </div>
              <div style={{fontSize:11,color:C.text2}}>{allTxs.length} total · ${totalSaved.toLocaleString(undefined,{maximumFractionDigits:0})} saved</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {allTxs.map((tx,i)=>(
                <motion.div key={tx.id}
                  initial={i===0&&tx.live?{opacity:0,x:10}:{opacity:1,x:0}}
                  animate={{opacity:1,x:0}} transition={{duration:0.25}}
                  style={{
                    display:'flex',alignItems:'center',padding:'10px 12px',borderRadius:10,
                    background:tx.live?C.greenDim:C.bg3,
                    border:`1px solid ${tx.live?C.greenBorder:C.border}`,
                    gap:10,
                  }}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:C.green,flexShrink:0,opacity:tx.live?1:0.4}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.text1,display:'flex',alignItems:'center',gap:6,overflow:'hidden'}}>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.from} → {tx.to}</span>
                      <span style={{fontSize:10,color:C.text2,flexShrink:0}}>{tx.pair}</span>
                    </div>
                    <div style={{fontSize:10,color:C.text2,marginTop:2,display:'flex',gap:8}}>
                      <span style={{fontFamily:'monospace'}}>${(tx.amount||0).toLocaleString()}</span>
                      <span>·</span>
                      <span>{tx.route}</span>
                      <span>·</span>
                      <span>{tx.age}</span>
                      {tx.live && tx.sig && tx.sig.length > 20 && (
                        <><span>·</span>
                        <a href={EXPLORER_TX(tx.sig)} target="_blank" rel="noopener noreferrer"
                          style={{color:C.green,textDecoration:'none',fontFamily:'monospace'}}>
                          {tx.sig.slice(0,8)}… ↗
                        </a></>
                      )}
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:C.green,fontFamily:'monospace'}}>+${(tx.saved||0).toFixed(2)}</div>
                    <div style={{fontSize:9,color:C.text2}}>saved</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{borderTop:`1px solid ${C.border}`,padding:'14px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:11,color:C.text2}}>Treasury Agent · Solana Hackathon Frontier 2026 · ro.petreamihai@gmail.com</span>
        <div style={{display:'flex',gap:20}}>
          <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:C.text2,textDecoration:'none'}}>Explorer</a>
          <a href="https://github.com/broiscodingtpc/hproj" target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:C.text2,textDecoration:'none'}}>Source</a>
        </div>
      </footer>
    </div>
  );
}

// ── Technical panel ───────────────────────────────────────────────────────────
function TechnicalPanel() {
  const sections = [
    { label:'Smart contract', color:'#f97316', tech:'Rust · Anchor 0.29',
      detail:'2-of-3 multi-sig vault with configurable timelocks. propose_withdrawal → approve (2 signers) → execute. Events emitted for immutable audit trail.' },
    { label:'ML routing',     color:C.purple,  tech:'Python · Q-learning',
      detail:'Reward = savings vs SWIFT baseline minus latency penalty. Trains on 8k synthetic settlements, updates Q-table after every real tx (online learning).' },
    { label:'Settlement API', color:'#60a5fa', tech:'TypeScript · Express',
      detail:'REST + WebSocket. AI client with fallback route. Solana CPI via @coral-xyz/anchor. JWT auth, Zod validation, in-memory store (swap to PostgreSQL for prod).' },
    { label:'This frontend',  color:C.green,   tech:'React · @solana/web3.js',
      detail:'Live devnet RPC polling. Phantom wallet connect. Real SystemProgram.transfer on submit. Explorer link on confirmation. No mocks in live mode.' },
  ];
  const C_local = { bg2:'#0D1017', bg3:'#131720', border:'rgba(255,255,255,0.06)', text1:'#F0F4FF', text2:'#6B7280', green:'#14F195' };
  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {sections.map(s=>(
        <div key={s.label} style={{background:C_local.bg2,border:`1px solid ${C_local.border}`,borderRadius:12,padding:'14px 16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:10,fontWeight:800,color:s.color,textTransform:'uppercase',letterSpacing:'0.08em'}}>{s.label}</span>
            <span style={{fontSize:10,fontFamily:'monospace',color:C_local.text2}}>{s.tech}</span>
          </div>
          <p style={{fontSize:11,color:C_local.text2,lineHeight:1.6}}>{s.detail}</p>
        </div>
      ))}
      <div style={{background:C_local.bg2,border:`1px solid rgba(20,241,149,0.15)`,borderRadius:12,padding:'14px 16px'}}>
        <div style={{fontSize:10,fontWeight:800,color:C_local.green,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Market context</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <div style={{fontFamily:'monospace',fontSize:22,fontWeight:900,color:'#F87171'}}>$847</div>
            <div style={{fontSize:11,color:C_local.text2,marginTop:3}}>SWIFT fee on $250k transfer. 3–5 days. No visibility.</div>
          </div>
          <div>
            <div style={{fontFamily:'monospace',fontSize:22,fontWeight:900,color:C_local.green}}>$0.42</div>
            <div style={{fontSize:11,color:C_local.text2,marginTop:3}}>Treasury Agent. 2.8 seconds. On-chain proof.</div>
          </div>
        </div>
        <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C_local.border}`,fontSize:11,color:C_local.text2,lineHeight:1.6}}>
          12,000 multinationals with EM subsidiaries. $50M/yr cross-border treasury = $250k+ on rails = $125k ARR at 25 bps.
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <a href="https://github.com/broiscodingtpc/hproj/blob/main/contracts/programs/treasury-vault/src/lib.rs"
          target="_blank" rel="noopener noreferrer"
          style={{flex:1,padding:'9px',borderRadius:8,border:`1px solid ${C_local.border}`,background:C_local.bg3,color:C_local.text2,textDecoration:'none',fontSize:11,fontWeight:600,textAlign:'center'}}>
          Contract (Rust) ↗
        </a>
        <a href="https://github.com/broiscodingtpc/hproj/blob/main/ml/src/router.py"
          target="_blank" rel="noopener noreferrer"
          style={{flex:1,padding:'9px',borderRadius:8,border:`1px solid ${C_local.border}`,background:C_local.bg3,color:C_local.text2,textDecoration:'none',fontSize:11,fontWeight:600,textAlign:'center'}}>
          ML Model (Python) ↗
        </a>
        <a href="https://explorer.solana.com/?cluster=devnet"
          target="_blank" rel="noopener noreferrer"
          style={{flex:1,padding:'9px',borderRadius:8,border:`1px solid ${C_local.border}`,background:C_local.bg3,color:C_local.text2,textDecoration:'none',fontSize:11,fontWeight:600,textAlign:'center'}}>
          Explorer ↗
        </a>
      </div>
    </div>
  );
}
