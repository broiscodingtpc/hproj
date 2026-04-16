# Treasury Agent: GitHub Repository Setup

**Complete guide for initializing the Treasury Agent monorepo on GitHub.**

---

## 📋 Repository Structure

```
treasury-agent/
├── frontend/                          # React SPA (Vercel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   ├── Settlement/
│   │   │   ├── Analytics/
│   │   │   └── Auth/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.ts                 # Calls backend (http://localhost:3001)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.example
│
├── backend/                           # Node.js/TypeScript Microservices (AWS ECS)
│   ├── services/
│   │   ├── settlement-service/        # Port 3001
│   │   │   ├── src/
│   │   │   │   ├── controllers/       # Request handlers
│   │   │   │   ├── services/          # Business logic
│   │   │   │   ├── routes/            # Express routes
│   │   │   │   ├── middleware/
│   │   │   │   ├── models/            # TypeORM entities
│   │   │   │   └── index.ts           # Express server
│   │   │   ├── tests/
│   │   │   ├── package.json
│   │   │   └── Dockerfile
│   │   │
│   │   ├── ai-agent-service/          # Port 3002
│   │   │   ├── src/
│   │   │   │   ├── controllers/
│   │   │   │   ├── routes/
│   │   │   │   └── index.ts
│   │   │   ├── tests/
│   │   │   └── package.json
│   │   │
│   │   └── compliance-service/        # Port 3003
│   │       ├── src/
│   │       ├── tests/
│   │       └── package.json
│   │
│   ├── shared/
│   │   ├── types/                     # Shared TypeScript types
│   │   ├── middleware/                # Auth, logging, error handling
│   │   ├── utils/                     # Helper functions
│   │   └── database/                  # TypeORM config, migrations
│   │       ├── migrations/
│   │       ├── seeds/
│   │       └── entities/              # TypeORM entity definitions
│   │
│   ├── docker-compose.yml             # PostgreSQL, Redis, RabbitMQ
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── contracts/                         # Solana Smart Contracts (Rust/Anchor)
│   ├── programs/
│   │   ├── treasury-vault/
│   │   │   ├── src/
│   │   │   │   ├── lib.rs             # Program entry point
│   │   │   │   ├── instructions/      # All instructions (init, deposit, withdraw)
│   │   │   │   ├── state/             # Account data structures
│   │   │   │   └── events.rs          # Event definitions
│   │   │   ├── tests/
│   │   │   └── Cargo.toml
│   │   │
│   │   └── settlement-router/
│   │       ├── src/
│   │       ├── tests/
│   │       └── Cargo.toml
│   │
│   ├── tests/                         # Integration tests (TypeScript)
│   │   ├── treasury_vault.test.ts
│   │   └── settlement_router.test.ts
│   │
│   ├── Anchor.toml                    # Anchor config
│   ├── Cargo.toml                     # Workspace Cargo
│   └── README.md
│
├── ml/                                # AI Routing Optimization (Python)
│   ├── models/
│   │   ├── route_optimizer.py         # RL model for route selection
│   │   ├── cost_predictor.py          # Cost prediction
│   │   └── anomaly_detector.py        # Fraud detection
│   ├── data/
│   │   ├── training/                  # Historical settlement data
│   │   └── test/
│   ├── ml_server.py                   # Flask server (http://localhost:5000)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── docs/
│   ├── architecture.md                # System design diagrams
│   ├── api-flow.md                    # Example API flows
│   ├── deployment.md                  # Kubernetes/ECS deployment
│   └── monitoring.md                  # Datadog, PagerDuty setup
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # Run tests on push
│   │   ├── build.yml                  # Build Docker images
│   │   ├── deploy-staging.yml         # Deploy to staging
│   │   └── deploy-production.yml      # Deploy to production
│   └── ISSUE_TEMPLATE/
│       └── bug_report.md
│
├── docker-compose.yml                 # Root-level orchestration
├── .env.example
├── .gitignore
├── README.md
├── CONTRIBUTING.md
└── LICENSE

```

---

## 🚀 Initial Setup

### Step 1: Create GitHub Repository

```bash
# Create on GitHub (https://github.com/new)
# Repository: treasury-agent
# Description: AI-powered emerging market treasury management on Solana
# License: MIT
# .gitignore: Node, Python, Rust

git clone https://github.com/YOUR_ORG/treasury-agent.git
cd treasury-agent
```

### Step 2: Create Local Monorepo Structure

```bash
# Create directories
mkdir -p frontend backend/services backend/shared contracts/programs contracts/tests ml docs .github/workflows

# Create root files
cat > package.json << 'EOF'
{
  "name": "treasury-agent",
  "version": "0.1.0",
  "description": "AI-powered emerging market treasury management",
  "workspaces": [
    "frontend",
    "backend",
    "backend/services/*"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build --workspaces --if-present"
  }
}
EOF

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.venv/
target/

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*.wasm

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Test coverage
coverage/
.nyc_output/

# Local development
.solana-config
test-wallet.json
EOF

cat > README.md << 'EOF'
# Treasury Agent

AI-powered emerging market corporate treasury management using Solana blockchain.

## Quick Start

```bash
# Install dependencies
npm install

# Start development environment
docker-compose up -d
npm run dev

# Run tests
npm run test
```

See [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md) for detailed setup instructions.

## Project Structure

- `frontend/` - React SPA (TypeScript)
- `backend/` - Node.js microservices (TypeScript)
- `contracts/` - Solana smart contracts (Rust/Anchor)
- `ml/` - AI routing optimization (Python)

## Documentation

- [Business Plan](../Treasury-Agent-Business-Plan.docx)
- [Technical Spec](../Treasury-Agent-Technical-Spec.docx)
- [API Specification](../API_SPECIFICATION.md)
- [Database Schema](../DATABASE_SCHEMA.md)

## Development

### Backend Services

```bash
cd backend
npm install
npm run dev
```

Services:
- Settlement Service: http://localhost:3001
- AI Agent Service: http://localhost:3002
- Compliance Service: http://localhost:3003

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Smart Contracts

```bash
cd contracts
anchor build
anchor test
```

## Testing

```bash
npm run test                    # All tests
npm run test:unit             # Unit tests only
npm run test:integration      # Integration tests
npm run test:e2e              # End-to-end tests
```

## Deployment

See [docs/deployment.md](docs/deployment.md) for:
- AWS ECS deployment
- Solana mainnet deployment
- GitHub Actions CI/CD

## License

MIT
EOF
```

### Step 3: Initialize Frontend

```bash
cd frontend

cat > package.json << 'EOF'
{
  "name": "treasury-agent-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "cypress open",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.2",
    "zustand": "^4.4.1",
    "react-router-dom": "^6.18.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "eslint": "^8.54.0",
    "vitest": "^0.34.6",
    "cypress": "^13.6.0"
  }
}
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > .env.example << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Treasury Agent
EOF
```

### Step 4: Initialize Backend

```bash
cd backend

cat > package.json << 'EOF'
{
  "name": "treasury-agent-backend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm:watch:*\"",
    "watch:settlement": "cd services/settlement-service && npm run dev",
    "watch:ai": "cd services/ai-agent-service && npm run dev",
    "watch:compliance": "cd services/compliance-service && npm run dev",
    "test": "jest --coverage",
    "build": "npm run build --workspaces",
    "migrate:latest": "typeorm migration:run",
    "migrate:rollback": "typeorm migration:revert",
    "seed:test-data": "ts-node src/database/seeds/test-data.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "pg": "^8.11.0",
    "redis": "^4.6.12",
    "amqplib": "^0.10.3",
    "jsonwebtoken": "^9.1.2",
    "@solana/web3.js": "^1.87.0",
    "bs58": "^5.0.0",
    "tweetnacl": "^1.0.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "ts-jest": "^29.1.1",
    "concurrently": "^8.2.1",
    "typeorm": "^0.3.17"
  }
}
EOF

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > .env.example << 'EOF'
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/treasury_agent
REDIS_URL=redis://localhost:6379

# Solana
SOLANA_NETWORK=devnet
SOLANA_PROGRAM_ID=...
SOLANA_PRIVATE_KEY=...

# Auth
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=3600

# Services
AI_AGENT_URL=http://localhost:3002
COMPLIANCE_SERVICE_URL=http://localhost:3003
EOF
```

### Step 5: Initialize Smart Contracts

```bash
cd contracts

cat > Anchor.toml << 'EOF'
[toolchain]

[programs.devnet]
treasury_vault = "..."
settlement_router = "..."

[registry]
url = "https://api.github.com"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha --require ts-node/register 'tests/**/*.test.ts'"
EOF

cat > Cargo.toml << 'EOF'
[workspace]
members = [
    "programs/treasury-vault",
    "programs/settlement-router"
]
resolver = "2"
EOF
```

---

## 📋 GitHub Actions CI/CD

### Step 6: Create GitHub Actions Workflows

```bash
mkdir -p .github/workflows

# Continuous Integration
cat > .github/workflows/ci.yml << 'EOF'
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          profile: minimal
      
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint --workspaces --if-present
      
      - name: Run tests
        run: npm run test --workspaces --if-present
      
      - name: Type check
        run: npm run type-check --workspaces --if-present
      
      - name: Build smart contracts
        run: |
          cd contracts
          anchor build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
EOF
```

---

## 🔐 Branch Protection & Code Review

```bash
# Settings -> Branches -> Add rule for "main"
# - Require pull request reviews (1 approving review)
# - Require status checks to pass (CI tests)
# - Require branches to be up to date
# - Include administrators in restrictions
```

### Step 7: Commit Initial Structure

```bash
cd treasury-agent

# Stage and commit
git add .
git commit -m "Initial repository structure

- Create monorepo with frontend, backend, contracts, ml services
- Add package.json, tsconfig, .env.example for all services
- Create GitHub Actions CI/CD workflow
- Add .gitignore and README

Co-Authored-By: Treasury Agent Team"

git push -u origin main
```

---

## 📦 NPM Workspaces Setup

All services use shared types and utilities:

```bash
# Root workspace
npm install
npm run test            # Runs all tests
npm run build           # Builds all services
npm run dev             # Runs all dev servers

# Individual service
cd frontend && npm install
npm run dev
```

---

## 🔗 Integration Between Services

**Frontend → Backend**:
```typescript
// frontend/src/services/api.ts
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

**Backend → Solana**:
```typescript
// backend/shared/services/solana.ts
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'
);
```

**Backend → ML Service**:
```typescript
// backend/services/settlement-service/src/services/routing.ts
const mlResponse = await fetch('http://localhost:5000/predict', {
  method: 'POST',
  body: JSON.stringify({ from, to, amount })
});
```

---

## 📋 Development Checklist

- [ ] Create GitHub repository
- [ ] Initialize monorepo structure
- [ ] Set up npm workspaces
- [ ] Create GitHub Actions CI/CD
- [ ] Set branch protection rules
- [ ] Add CONTRIBUTING.md guidelines
- [ ] Create issue and PR templates
- [ ] Add code owners file (.github/CODEOWNERS)
- [ ] Set up Dependabot for dependency updates
- [ ] Create security policy (SECURITY.md)

---

## 🚀 Next Steps

1. **Clone the repo**: `git clone https://github.com/YOUR_ORG/treasury-agent.git`
2. **Install dependencies**: `npm install`
3. **Set up environment**: `cp .env.example .env` and configure
4. **Start development**: `npm run dev`
5. **Run tests**: `npm run test`
6. **Create feature branches**: `git checkout -b feature/description`
7. **Submit PRs** for code review

---

**Repository**: https://github.com/[ORG]/treasury-agent  
**Main Branch**: protected, requires PR review + CI pass  
**Development Branch**: develop (for integration testing)
