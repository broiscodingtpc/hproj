# Treasury Agent — Plan to Make This Actually Work

Honest assessment of current state and exactly what needs to happen to go from
polished demo → real product that judges can verify on-chain and enterprises can use.

---

## Current State (Honest)

| Layer | Status | What's Real | What's Simulated |
|---|---|---|---|
| **Frontend** | ✅ Good | Design system, interactive demo, approval modal | Settlement amounts, tx hashes |
| **ML router** | ✅ Real | Q-learning model, 7/7 tests, Flask API | Trained on synthetic data, not live fees |
| **Smart contract** | ⚠️ Scaffold | Full Anchor program written, reviewed | **Not deployed to devnet** |
| **Backend** | ⚠️ Scaffold | Express routes, JWT auth, service layer | In-memory store (no real DB), Solana calls stubbed |
| **Wallet** | ⚠️ Wired | window.solana connect button added | No live tx submitted |
| **Database** | ❌ Missing | Schema documented | PostgreSQL not running anywhere public |
| **On-chain tx** | ❌ Missing | Explorer link in UI | No real transaction exists |

---

## Priority 1 — Deploy the Smart Contract to Devnet (2–4 hours)

This is the single most important step. Judges and judges' technical advisors
will type the program ID into Solana Explorer. If nothing is there, it's a mockup.

```bash
# 1. Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# 2. Fund a devnet keypair
solana config set --url devnet
solana-keygen new --outfile ~/.config/solana/id.json
solana airdrop 2

# 3. Build and deploy
cd contracts
anchor build
anchor deploy

# Copy the program ID that gets printed — update Anchor.toml and SOLANA_PROGRAM_ID env var
```

After deploy, update `contracts/Anchor.toml` with the real program ID, push to GitHub.
The Explorer link will be: `https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet`

---

## Priority 2 — Wire One Real Devnet Transaction (3–5 hours)

Once the contract is deployed, make the LiveDashboard's "Run Demo" actually:
1. Call `window.phantom.solana.connect()`
2. Build a `propose_withdrawal` instruction using `@coral-xyz/anchor` + the deployed IDL
3. Sign and send it
4. Display the real signature + Explorer link

```bash
cd treasury-visualizer
npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token
```

Then update `LiveDashboard.jsx` stage "submitting":
```javascript
const { PublicKey, Connection } = await import('@solana/web3.js');
const { Program, AnchorProvider } = await import('@coral-xyz/anchor');
const idl = await import('../idl/treasury_vault.json');

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const provider = new AnchorProvider(connection, window.phantom.solana, {});
const program = new Program(idl, provider);

const tx = await program.methods
  .proposeWithdrawal(new BN(amount * 1e6), destinationKey, memo)
  .accounts({ vault: vaultPda, proposal: proposalPda, proposer: provider.wallet.publicKey })
  .rpc();

setTxHash(tx); // real Solana signature
```

---

## Priority 3 — Real Database (2–3 hours)

The backend currently uses an in-memory Map — restarting loses all state.
Swap it out for the PostgreSQL schema already defined in `DATABASE_SCHEMA.md`.

Quickest path for hackathon: **Supabase free tier**
```bash
# 1. Create project at supabase.com
# 2. Copy the connection string
# 3. Run DATABASE_SCHEMA.md SQL in Supabase SQL editor
# 4. Set DATABASE_URL env var and replace SettlementService in-memory store
#    with pg queries — the schema is already production-ready
```

---

## Priority 4 — Live Deployment (1–2 hours)

Currently there's no public URL. CI/CD to GitHub Pages covers the frontend.
Backend + ML need a server.

**Quickest option: Railway.app (free tier)**
```bash
# Connect your GitHub repo
# Add services: backend (Node) + ml (Python)
# Set all env vars from CONFIGURATION_GUIDE.md
# Railway auto-deploys on every push to main
```

Cost: $0 on free tier, $5/mo on hobby.

**Frontend (already wired):**
1. Go to https://github.com/broiscodingtpc/hproj/settings/pages
2. Source → **GitHub Actions**
3. Save → GitHub Actions auto-deploys to https://broiscodingtpc.github.io/hproj/

---

## Priority 5 — Real ML Training Data (ongoing)

The Q-learning model pre-trains on synthetic settlements. Once real settlements flow:

1. Backend calls `POST /outcome` after each settlement with actual cost
2. Model updates Q-table in real-time (online learning already wired)
3. After 1,000+ settlements, retrain from DB: `POST /model/retrain`

Performance improves automatically. First 100 settlements are the bootstrapping phase.

---

## Week-by-Week Execution (Post-Hackathon)

### Week 1: Make It Real On-Chain
- [ ] Deploy contracts to devnet → **get real program ID**
- [ ] Wire Phantom wallet in LiveDashboard → **submit real tx**
- [ ] Enable GitHub Pages → **get live URL**
- [ ] Deploy backend to Railway → **real API**

### Week 2: Harden the Backend
- [ ] Swap in-memory store → Supabase PostgreSQL
- [ ] Add real Solana balance fetching in accounts endpoint
- [ ] Wire AI service endpoint into settlement flow (not just stubbed)
- [ ] Add email notification on approval request

### Week 3: Enterprise-Ready Features
- [ ] Add Phantom wallet login (replace JWT with wallet signature auth)
- [ ] Implement real timelock enforcement in smart contract
- [ ] Add transaction history synced from on-chain events
- [ ] Export audit log as PDF/CSV

### Week 4: First Design Partner
- [ ] Deploy to mainnet with $1 test transfer
- [ ] Onboard one company with real treasury pain
- [ ] Record: amount saved, time saved, vs SWIFT baseline
- [ ] Use that number in every pitch deck from this point forward

---

## What Winning Looks Like at the Hackathon

**Bare minimum to be competitive:**
- Smart contract deployed to devnet (verifiable on Explorer) ← **do this first**
- GitHub Pages live URL ← **one click in settings**
- Wallet connect working ← **already wired, just needs deployed contract**

**What wins:**
- Judge opens Explorer → sees real program at address → can call it
- Demo runs → emits real tx signature → links to Explorer → judge can see it
- ML model returns predictions with confidence scores → shows it's not hardcoded
- Dashboard shows real Solana balance from devnet RPC

**The one sentence that wins:**
> "Here is the Solana Explorer link for the withdrawal we just submitted.
> It was proposed by wallet A, approved by wallet B, executed in 2.9 seconds,
> and cost $0.00042. The equivalent SWIFT wire would have taken 4 days and cost $847."

That sentence, with a real link, wins the technical prize.

---

## Known Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Anchor deploy fails (IDL mismatch) | Medium | Run `anchor test` locally first, fix errors before demo day |
| Phantom not installed on demo laptop | Medium | Install Phantom before leaving, have mobile backup |
| Devnet RPC slow during demo | Low | Use Helius/QuickNode free tier for reliable RPC |
| Wi-Fi down at venue | Low | Demo is client-side, works offline; deploy to GitHub Pages as backup |
| Judge asks for mainnet tx | Low | "Mainnet in 2 weeks" is acceptable at hackathon stage |

---

## Files That Need Updating After Deploy

1. `contracts/Anchor.toml` — real program ID
2. `treasury-visualizer/src/components/LiveDashboard.jsx` — real program ID + IDL import
3. `backend/.env` — `SOLANA_PROGRAM_ID=<real_id>`
4. `HACKATHON_SUBMISSION.md` — Solana Explorer link
5. `README.md` — live URL + Explorer link

---

**Bottom line:** The architecture is right, the code is real, the design is polished.
The one missing piece is 4 hours of deployment work.
Do Priority 1 first. Everything else follows from having a live contract.
