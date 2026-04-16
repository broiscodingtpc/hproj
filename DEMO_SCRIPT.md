# Treasury Agent — 3-Minute Demo Script

Every second is allocated. Practice this until it runs in 2:55 with one breath of buffer.

---

## 0:00 – 0:25 · Hook (25 sec)

> "Right now, a São Paulo subsidiary waiting on $250,000 from its Singapore parent waits **three days** and pays **$847** in wire fees. We just settled that same transfer in **2.8 seconds for forty-two cents** — and a 2-of-3 multi-sig signed off on it before it touched the chain."

**On screen:** Hero section of `treasury-visualizer` with the savings counter.

**Key beat:** Lead with the cost and time. Numbers do the persuading.

---

## 0:25 – 1:25 · Live Demo (60 sec)

Click **Run Demo** in the LiveDashboard. Talk over each stage as it lights up.

| Stage | What you say |
|---|---|
| **AI predicting route** (0:30) | "Our reinforcement-learning agent compared three routes — direct USDC, Jupiter aggregator, SWIFT — and picked direct because of confidence and cost." |
| **Multi-sig approval** (0:45) | "Two of three signers approve via TOTP. No single person can move treasury funds." |
| **Submitting to Solana** (1:00) | "We propose the withdrawal on-chain. Large amounts hit a configurable timelock — for this demo, zero." |
| **Confirmed** (1:15) | "Finalized at slot 287 million. Total elapsed: 2.8 seconds. Network fee: less than half a cent." |

**Don't forget:** Read the Saved metric out loud — "$846.58 saved on a single $250k transfer."

---

## 1:25 – 2:05 · Why Solana, Why Now (40 sec)

> "Three things have to be true at once for this product to exist, and 2026 is the first year all three are: stablecoin liquidity in emerging-market corridors crossed $80 billion, Solana finality is sub-second with sub-cent fees, and emerging-market CFOs have an explicit mandate to cut treasury cost. Treasury Agent is the application layer on top of that infrastructure stack."

**On screen:** Scroll to the Architecture section of the visualizer.

---

## 2:05 – 2:35 · Defensibility (30 sec)

> "Two moats. First, the AI router improves with every settlement — every customer's traffic makes the next customer's routes cheaper. Second, the multi-sig + timelock + audit-log combination is exactly what enterprise compliance requires. Wallet apps don't have it. Banks have it but can't move at sub-second. We sit in the gap."

**On screen:** Highlight the 2-of-3 signers and the timelock indicator in the dashboard.

---

## 2:35 – 3:00 · Ask + Close (25 sec)

> "We've shipped: Anchor program with multi-sig and timelocks, settlement service in TypeScript, a Q-learning route optimizer, and a working frontend you just saw. We're looking for design partners with cross-border treasury pain — three companies, one quarter, free pilots. If that's you, talk to us after the panel."

**On screen:** README/contact page or the deck's final slide.

**Final beat:** Pause. Eye contact with the panel. Don't fill the silence.

---

## Pre-Demo Checklist

- [ ] `npm run dev` in `treasury-visualizer/` — confirm port 5173 loads
- [ ] Browser zoom to 110% so judges in the back can read the metrics
- [ ] Run the demo once to verify the savings line lands
- [ ] Mute laptop notifications, close inbox tabs
- [ ] Have `Treasury-Agent-Pitch-Deck.pptx` open in a second window as backup
- [ ] Charger plugged in, brightness max
- [ ] Confirm Wi-Fi at the venue, but the demo is pure client-side so it works offline

## Q&A Cheat Sheet

**"What if Solana goes down?"** — We fall back to a Jupiter aggregator route across multiple stablecoin networks. The vault state is on-chain, so a reorg or RPC outage doesn't lose funds.

**"How is this different from a Fireblocks?"** — Fireblocks is custody. We're settlement orchestration on top of self-custodied vaults. Customers keep their keys; we provide the AI routing and approval workflow.

**"Why not Ethereum?"** — Ethereum L1 fees would consume the savings. L2s like Base are viable, and we plan to add them in v2 — but Solana's sub-second finality is the only place a 3-second settlement story holds today.

**"What about regulation?"** — We support permissioned stablecoin issuers (Circle, Brale) and ship audit-log exports formatted for SOC 2 + ISO 27001. We're not a money transmitter; the customer is.

**"Revenue model?"** — 25 bps on volume settled, capped at $5k per transfer. Median enterprise customer at $50M annual treasury volume = $125k ARR. Top-of-funnel is multinationals with EM subsidiaries — there are 12,000 in our ICP.

**"Team?"** — Mihai Petrea, founder — full-stack engineer with experience across fintech infrastructure, Solana smart contracts, and AI/ML systems. Built the entire stack solo for this hackathon: Anchor program, TypeScript settlement service, Python routing model, and React dashboard.
