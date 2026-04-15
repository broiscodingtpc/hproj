# Treasury Agent: Development Setup Guide

**Complete walkthrough for local development, testing, and deployment.**

---

## 📋 Prerequisites

Ensure you have these installed:
- **Node.js 18+** (with npm 9+)
- **Rust 1.70+** (with Solana CLI)
- **Python 3.10+** (with pip)
- **Docker** (for PostgreSQL and Redis)
- **Git**

### Verify Installations
```bash
node --version      # v18.0.0 or higher
npm --version       # 9.0.0 or higher
rustc --version     # 1.70.0 or higher
cargo --version     # Latest
solana --version    # Latest
python --version    # 3.10 or higher
docker --version    # Latest
```

---

## 🏗️ Repository Structure

```
treasury-agent/
├── frontend/                      # React.js SPA (Vercel)
│   ├── src/
│   │   ├── components/           # Dashboard, settlement forms, analytics
│   │   ├── pages/                # /dashboard, /settlement, /analytics
│   │   └── hooks/                # useAuth, useWallet, useTreasury
│   └── package.json
│
├── backend/                       # Node.js microservices (AWS ECS)
│   ├── services/
│   │   ├── settlement-service/   # Solana settlement orchestration
│   │   ├── ai-agent-service/     # ML-based routing optimization
│   │   └── compliance-service/   # Regulatory rules, audit logging
│   ├── middleware/               # Auth, logging, error handling
│   ├── database/                 # Migrations, seed scripts
│   └── package.json
│
├── contracts/                     # Solana smart contracts (Rust/Anchor)
│   ├── programs/
│   │   ├── treasury-vault/       # Multi-currency vault with multi-sig
│   │   └── settlement-router/    # Settlement execution and routing
│   └── tests/
│
├── ml/                            # AI routing optimization (Python)
│   ├── models/
│   │   ├── route_optimizer.py    # RL model for settlement routing
│   │   └── cost_predictor.py     # Cost prediction for different routes
│   ├── data/                     # Training data, historical flows
│   └── requirements.txt
│
├── docker-compose.yml            # PostgreSQL, Redis, RabbitMQ
├── .env.example                  # Environment template
└── docs/                         # Architecture, API specs

```

---

## 🚀 Phase 1: Local Environment Setup (2 hours)

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/treasury-agent/treasury-agent.git
cd treasury-agent

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install Anchor and Solana tools
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest

# Install Python ML dependencies
cd ml && pip install -r requirements.txt && cd ..
```

### Step 2: Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
# CRITICAL: Never commit .env to git
# Use AWS Secrets Manager in production
nano .env
```

**Key environment variables** (see `.env.example`):
```
# Solana
SOLANA_NETWORK=devnet
SOLANA_PRIVATE_KEY=...
SOLANA_PROGRAM_ID=...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/treasury_agent
REDIS_URL=redis://localhost:6379

# Stripe (payment processing)
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# AWS (production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Step 3: Start Infrastructure (Docker)

```bash
# Start PostgreSQL, Redis, RabbitMQ
docker-compose up -d

# Verify services are running
docker ps

# Create database and run migrations
cd backend
npm run migrate:latest
cd ..

# Seed test data (optional)
cd backend
npm run seed:test-data
cd ..
```

### Step 4: Build Solana Contracts

```bash
cd contracts

# Build the contracts
anchor build

# Verify build output
ls target/deploy/

# Test contracts (unit tests)
anchor test
```

**Expected output**:
```
✓ Builds without errors
✓ IDL generated at target/idl/
✓ Program ID registered in Anchor.toml
```

### Step 5: Deploy to Solana Devnet

```bash
# Get devnet SOL (for gas)
solana airdrop 5 $(solana address) --url devnet

# Verify you have SOL
solana balance --url devnet

# Deploy contracts to devnet
anchor deploy --provider.cluster devnet

# Save the deployed program ID
# Update SOLANA_PROGRAM_ID in .env with this value
```

**Expected output**:
```
Deploying cluster: https://api.devnet.solana.com
Default signer: /home/user/.config/solana/id.json
...
Deploy successful. Signature: ...
```

---

## 🔧 Phase 2: Running Services Locally (1 hour)

### Step 1: Start Backend Services

```bash
# Terminal 1: Settlement Service
cd backend/services/settlement-service
npm run dev

# Terminal 2: AI Agent Service
cd backend/services/ai-agent-service
npm run dev

# Terminal 3: Compliance Service
cd backend/services/compliance-service
npm run dev
```

**Expected output**:
```
✓ Settlement Service listening on port 3001
✓ AI Agent Service listening on port 3002
✓ Compliance Service listening on port 3003
```

### Step 2: Start Frontend

```bash
# Terminal 4: Frontend
cd frontend
npm run dev

# Open http://localhost:3000 in your browser
```

**Expected output**:
```
✓ Frontend running at http://localhost:3000
✓ Connected to backend at http://localhost:3001
```

### Step 3: Verify Connectivity

```bash
# Test backend health check
curl http://localhost:3001/health

# Expected response
{"status": "healthy", "service": "settlement", "uptime": 45}

# Test database connection
curl http://localhost:3001/api/accounts

# Should return: {"accounts": [...], "total": 0}
```

---

## 🧪 Phase 3: Testing

### Unit Tests (Backend & Contracts)

```bash
# Backend unit tests
cd backend
npm run test

# Expected: 150+ tests passing

# Solana contract tests
cd contracts
anchor test

# Expected: 50+ tests passing
```

### Integration Tests (End-to-end flows)

```bash
# Settlement flow: Create account → Authorize → Execute settlement
cd backend
npm run test:integration

# Expected output:
# ✓ Settlement flow completes in <3 seconds on devnet
# ✓ Multi-sig vault executes correctly
# ✓ Audit log records transaction
```

### E2E Tests (Frontend)

```bash
cd frontend
npm run test:e2e

# Cypress opens browser for visual testing
# Tests: Login → Create settlement → Verify confirmation
```

---

## 💾 Data & Database

### Database Schema

**Key tables** (auto-created via migrations):
```
accounts           # Corporate treasury accounts (id, name, admin_id, balance)
settlements        # Settlement transactions (id, from_id, to_id, amount, status)
ai_routes          # ML-predicted settlement routes (id, from, to, cost_estimate)
audit_log          # Compliance trail (id, action, user, timestamp)
notifications      # Real-time alerts (id, account_id, message, read)
```

### Initialize Development Data

```bash
# Create test companies and accounts
cd backend
npm run seed:test-data

# Results:
# - 5 test companies (with mock enterprise details)
# - 15 treasury accounts (₹, PHP, MXN, VND)
# - 30 historical settlements (for ML training)
```

### Access PostgreSQL Directly

```bash
# Connect to database
psql postgresql://user:pass@localhost:5432/treasury_agent

# View accounts
SELECT * FROM accounts LIMIT 5;

# View settlements
SELECT id, from_account, to_account, amount, status, created_at 
FROM settlements 
ORDER BY created_at DESC LIMIT 10;
```

---

## 🧠 AI Agent Setup

### Training the Route Optimizer

```bash
cd ml

# Generate training data from historical settlements
python generate_training_data.py

# Train the RL model
python train_route_optimizer.py

# Expected output:
# Epoch 1/100: loss = 0.45, reward = 2.3
# ...
# Epoch 100/100: loss = 0.08, reward = 8.7

# Model saved to: models/route_optimizer_v1.pkl
```

### Real-time Route Predictions

```bash
# Start the prediction server
python ml_server.py

# The backend can now call the ML service
# POST http://localhost:5000/predict
# Input: {"from_account": "SWIFT_A", "to_account": "SWIFT_B", "amount": 100000}
# Output: {"recommended_route": "direct", "estimated_cost": 75, "confidence": 0.94}
```

---

## 🔐 Security Setup

### Local SSL Certificates (Optional but Recommended)

```bash
# Generate self-signed cert for HTTPS testing
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes

# Update backend to use HTTPS
# In backend/.env
HTTPS_KEY_PATH=./server.key
HTTPS_CERT_PATH=./server.crt
```

### Wallet & Private Key Management

```bash
# Create a test wallet for devnet
solana-keygen new --outfile test-wallet.json

# Fund it with devnet SOL (once per wallet)
solana airdrop 10 $(solana address -k test-wallet.json) --url devnet

# Export the private key (ONLY for testing, never in production)
cat test-wallet.json | jq '.[0:32]' | base64
```

---

## 📱 Testing the Full Flow (Devnet)

### Manual Settlement Test

```bash
# 1. Open frontend at http://localhost:3000
# 2. Create test account A (₹ - Indian Rupees) with balance ₹100,000
# 3. Create test account B (USD - Virtual stablecoin) with balance 0
# 4. Initiate settlement: ₹50,000 from A to B
# 5. Verify:
#    - Backend calls AI agent for optimal route
#    - Solana contract executes multi-sig vault transfer
#    - Compliance logs transaction
#    - Frontend shows real-time confirmation
#    - Audit log has entry with timestamp + user
```

### Monitor Logs

```bash
# Terminal with backend logs
cd backend && npm run dev

# You'll see:
# [Settlement] Received settlement request: A -> B, ₹50,000
# [AI Agent] Predicted route: USD pair, cost: ₹75
# [Solana] Multi-sig approval #1/2 received
# [Solana] Settlement executed: TX https://solscan.io/tx/...
# [Compliance] Audit log recorded
# [Frontend] Real-time update sent via WebSocket
```

---

## 🚢 Production Deployment

### Prerequisites
- AWS account with ECS cluster
- Solana mainnet program deployment
- PostgreSQL RDS instance
- Redis ElastiCache cluster

### Deployment Steps

```bash
# Build Docker images
docker build -t treasury-agent-backend:latest backend/
docker build -t treasury-agent-frontend:latest frontend/

# Push to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker tag treasury-agent-backend:latest $ECR_REGISTRY/treasury-agent:backend-latest
docker push $ECR_REGISTRY/treasury-agent:backend-latest

# Deploy to ECS (via Terraform or AWS CLI)
# Update task definition with new image tags
# Roll out with blue-green deployment

# Migrate database
# Use RDS proxy to ensure connection pooling
npm run migrate:production

# Deploy Solana contracts to mainnet
anchor deploy --provider.cluster mainnet
```

---

## 🐛 Troubleshooting

### Docker Issues
```bash
# Containers won't start?
docker-compose logs postgres    # Check PostgreSQL
docker-compose logs redis       # Check Redis

# Port conflicts?
lsof -i :5432                   # Find process on 5432
kill -9 <PID>                   # Kill it
```

### Solana Issues
```bash
# Can't connect to devnet?
solana config set --url https://api.devnet.solana.com
solana ping --url devnet

# Program deployment failed?
# Check balance: solana balance --url devnet
# Check program size: du -h target/deploy/*.so
```

### Database Issues
```bash
# Migrations failed?
cd backend && npm run migrate:rollback
npm run migrate:latest

# Reset database (WARNING: deletes all data)
dropdb treasury_agent
createdb treasury_agent
npm run migrate:latest
npm run seed:test-data
```

---

## 📊 Development Checklist

- [ ] Node.js, Rust, Python installed and verified
- [ ] Repository cloned and dependencies installed
- [ ] Docker containers running (Postgres, Redis)
- [ ] Database initialized with migrations
- [ ] Solana contracts built and tested
- [ ] Contracts deployed to devnet
- [ ] Backend services starting on ports 3001-3003
- [ ] Frontend running on port 3000
- [ ] Backend health check responding (curl http://localhost:3001/health)
- [ ] ML agent trained and prediction server running
- [ ] Manual settlement test completes successfully
- [ ] Logs show proper service communication

---

## 🎯 Next Steps

1. **Implement MVP features** (2-3 weeks):
   - Dashboard with account creation
   - Basic settlement flow (no multi-sig yet)
   - Simple routing (always fastest route)

2. **Add multi-sig security** (1 week):
   - 2-of-3 approval workflow
   - Timelocked withdrawals

3. **Integrate AI routing** (1 week):
   - Train model on historical data
   - Call ML service for route prediction

4. **Security audit** (1 week):
   - Third-party code review
   - Smart contract audit
   - Penetration testing

5. **Pilot launch** (1 week):
   - Deploy to mainnet
   - Onboard first 3-5 beta customers
   - Monitor for 30 days

---

## 📚 Documentation References

- **Solana Docs**: https://docs.solana.com
- **Anchor Framework**: https://docs.rs/anchor-lang/latest/anchor_lang/
- **Plaid Integration**: https://plaid.com/docs
- **AWS ECS**: https://docs.aws.amazon.com/ecs/
- **Node.js Best Practices**: https://nodejs.org/en/docs/

---

**Setup Time Estimate**: 3-4 hours (first time) | 30 minutes (subsequent runs)  
**Support**: Check GitHub Issues or contact dev@treasury-agent.io
