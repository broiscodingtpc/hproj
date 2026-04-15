# Treasury Agent: Configuration Guide

**Complete reference for all environment variables and configuration options.**

---

## 📋 Environment Files

```
.env                    ← Created locally (never commit)
.env.example            ← Template (checked in, reference only)
.env.development        ← Development-specific overrides
.env.staging            ← Staging environment
.env.production         ← Production environment (AWS Secrets Manager)
```

---

## 🔐 Backend Configuration

### `.env.example` Template

```bash
# ========================================
# SERVER
# ========================================
NODE_ENV=development                          # development, staging, production
PORT=3001                                     # Express server port
LOG_LEVEL=debug                               # debug, info, warn, error

# ========================================
# DATABASE
# ========================================
DATABASE_URL=postgresql://user:pass@localhost:5432/treasury_agent
DATABASE_POOL_MIN=5                           # Min connections
DATABASE_POOL_MAX=20                          # Max connections (10 per service)
DATABASE_TIMEOUT=30000                        # Query timeout (ms)
DATABASE_SSL=false                            # true for RDS

REDIS_URL=redis://localhost:6379              # Redis connection
REDIS_CLUSTER_MODE=false                      # true if using cluster mode
REDIS_TTL=300                                 # Cache TTL (seconds)

# ========================================
# AUTHENTICATION
# ========================================
JWT_SECRET=your-secret-key-min-32-chars       # MUST be 32+ chars and random
JWT_EXPIRATION=3600                           # 1 hour
JWT_REFRESH_EXPIRATION=604800                 # 7 days
MFA_SECRET_LENGTH=20                          # TOTP secret length
MFA_WINDOW=1                                  # Allow 1 time window drift (30 sec)

# OAuth 2.0 (future integrations)
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...

# ========================================
# SOLANA
# ========================================
SOLANA_NETWORK=devnet                         # devnet, testnet, mainnet
SOLANA_RPC_URL=https://api.devnet.solana.com  # RPC endpoint
SOLANA_PROGRAM_ID=...                         # Deployed program ID
SOLANA_PRIVATE_KEY=...                        # Base58-encoded private key
SOLANA_KEYPAIR_PATH=~/.config/solana/id.json # Alternative: load from file

# Solana Cluster settings
SOLANA_COMMITMENT=confirmed                   # processed, confirmed, finalized
SOLANA_TIMEOUT_MS=30000                       # RPC timeout
SOLANA_RETRY_ATTEMPTS=3                       # Number of retries

# ========================================
# MESSAGING & ASYNC
# ========================================
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_PREFETCH=10                          # Consumer prefetch count
RABBITMQ_RECONNECT_DELAY=5000                 # Reconnect delay (ms)

# ========================================
# EXTERNAL SERVICES
# ========================================
# AI Agent Service (Python)
AI_SERVICE_URL=http://localhost:5000          # ML service URL
AI_SERVICE_TIMEOUT=30000                      # Timeout (ms)
AI_REQUEST_TIMEOUT=10000                      # Individual request timeout

# Compliance Service
COMPLIANCE_SERVICE_URL=http://localhost:3003

# Settlement Service
SETTLEMENT_SERVICE_URL=http://localhost:3001

# ========================================
# SECURITY & COMPLIANCE
# ========================================
# Rate limiting
RATE_LIMIT_WINDOW=3600                        # Time window (seconds)
RATE_LIMIT_MAX_REQUESTS=1000                  # Per user per window
RATE_LIMIT_MAX_REQUESTS_PREMIUM=10000         # For premium users

# CORS
CORS_ORIGIN=http://localhost:3000             # Frontend URL (dev)
CORS_CREDENTIALS=true

# Security headers
HELMET_ENABLED=true
HSTS_MAX_AGE=31536000                         # 1 year

# Password policy
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true

# Session
SESSION_TIMEOUT=3600                          # Auto-logout (seconds)
SESSION_ABSOLUTE_TIMEOUT=86400                # Max session lifetime (24h)

# ========================================
# DATA ENCRYPTION
# ========================================
ENCRYPTION_KEY=...                            # 32-byte hex string for AES-256
ENCRYPTION_ALGORITHM=aes-256-cbc

# ========================================
# LOGGING
# ========================================
LOG_FORMAT=json                               # json, pretty (for dev)
LOG_OUTPUT=console,file                       # Where to send logs
LOG_FILE_PATH=./logs/app.log
LOG_FILE_MAX_SIZE=10m                         # Max file size before rotation
LOG_FILE_MAX_FILES=7                          # Keep last 7 files

# ========================================
# MONITORING
# ========================================
DATADOG_ENABLED=false                         # Enable Datadog APM
DATADOG_API_KEY=...
DATADOG_SITE=datadoghq.com                    # or datadoghq.eu

SENTRY_ENABLED=false                          # Enable Sentry error tracking
SENTRY_DSN=...

# Health check
HEALTH_CHECK_INTERVAL=30000                   # Interval (ms)
HEALTH_CHECK_TIMEOUT=10000                    # Timeout (ms)

# ========================================
# FEATURES (Feature flags)
# ========================================
FEATURE_MULTI_SIG=true                        # Enable 2-of-3 approval
FEATURE_TIMELOCKS=true                        # Enable withdrawal timelocks
FEATURE_AI_ROUTING=true                       # Enable AI route selection
FEATURE_ANOMALY_DETECTION=false               # Still in beta
FEATURE_API_V2=false                          # New API version (beta)

# ========================================
# TESTING
# ========================================
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/treasury_agent_test
TEST_REDIS_URL=redis://localhost:6380
TEST_MODE=false                               # Use mock services
SEED_TEST_DATA=false                          # Auto-seed test data on startup
```

---

## 🎨 Frontend Configuration

### `.env.example` (Frontend)

```bash
# ========================================
# API
# ========================================
VITE_API_URL=http://localhost:3001            # Backend API URL
VITE_API_TIMEOUT=30000                        # Request timeout (ms)

# ========================================
# AUTHENTICATION
# ========================================
VITE_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
VITE_MFA_TIMEOUT=300                          # MFA code timeout (seconds)

# ========================================
# SOLANA
# ========================================
VITE_SOLANA_NETWORK=devnet                    # devnet, testnet, mainnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# ========================================
# ANALYTICS
# ========================================
VITE_ANALYTICS_ENABLED=false                  # Google Analytics
VITE_ANALYTICS_ID=UA-XXXXXXXXX-X
VITE_SENTRY_ENABLED=false
VITE_SENTRY_DSN=...

# ========================================
# FEATURES
# ========================================
VITE_FEATURE_DEMO_MODE=false                  # Hide real data in demo
VITE_FEATURE_DARK_MODE=true                   # Enable dark mode toggle
VITE_FEATURE_EXPORT_REPORTS=true              # PDF export capability
VITE_FEATURE_API_DOCS=true                    # Show API docs link

# ========================================
# UI
# ========================================
VITE_APP_NAME=Treasury Agent
VITE_APP_VERSION=0.1.0
VITE_THEME_PRIMARY_COLOR=#1E2761              # Dark blue
VITE_LOCALE=en                                # en, es, hi, fil
```

---

## 🤖 ML Service Configuration

### `config.py` (Python)

```python
import os

class Config:
    # Server
    PORT = int(os.getenv('ML_PORT', 5000))
    DEBUG = os.getenv('ENV', 'development') == 'development'
    
    # Model
    MODEL_VERSION = os.getenv('MODEL_VERSION', 'v1')
    MODEL_PATH = os.getenv('MODEL_PATH', './models')
    CONFIDENCE_THRESHOLD = 0.85
    
    # Training
    TRAINING_DATA_DAYS = int(os.getenv('TRAINING_DATA_DAYS', 30))
    BATCH_SIZE = 32
    LEARNING_RATE = 0.001
    EPISODES = 10000
    EPSILON_DECAY = 0.995
    
    # Retraining
    AUTO_RETRAIN_ENABLED = os.getenv('AUTO_RETRAIN', 'true') == 'true'
    AUTO_RETRAIN_SCHEDULE = '0 2 * * *'  # 2 AM daily
    RETRAIN_MIN_SAMPLES = 1000
    
    # Backend
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3001')
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://...')
    
    # Monitoring
    PROMETHEUS_ENABLED = os.getenv('PROMETHEUS_ENABLED', 'false') == 'true'
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'info')
```

### Environment Variables
```bash
export ML_PORT=5000
export MODEL_VERSION=v2
export TRAINING_DATA_DAYS=30
export AUTO_RETRAIN=true
export PROMETHEUS_ENABLED=true
```

---

## 🐳 Docker Configuration

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-treasury_agent}
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-user}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

---

## 🚀 Production Configuration (AWS)

### Systems Manager Parameter Store

```bash
# Using AWS CLI
aws ssm put-parameter --name /treasury-agent/prod/database-url \
  --value "postgresql://..." \
  --type SecureString

aws ssm put-parameter --name /treasury-agent/prod/jwt-secret \
  --value "random-secret-32-chars" \
  --type SecureString

aws ssm put-parameter --name /treasury-agent/prod/solana-private-key \
  --value "[base58-encoded-key]" \
  --type SecureString
```

### ECS Task Definition Template

```json
{
  "name": "treasury-agent-backend",
  "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/treasury-agent:latest",
  "environment": [
    { "name": "NODE_ENV", "value": "production" },
    { "name": "PORT", "value": "3001" },
    { "name": "LOG_LEVEL", "value": "info" }
  ],
  "secrets": [
    { "name": "DATABASE_URL", "valueFrom": "/treasury-agent/prod/database-url" },
    { "name": "JWT_SECRET", "valueFrom": "/treasury-agent/prod/jwt-secret" },
    { "name": "SOLANA_PRIVATE_KEY", "valueFrom": "/treasury-agent/prod/solana-private-key" }
  ],
  "portMappings": [
    { "containerPort": 3001, "hostPort": 3001, "protocol": "tcp" }
  ],
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/treasury-agent",
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

---

## 🔑 Key Secrets Management

### Development (Local)
```bash
# Generate random JWT secret (32+ chars)
openssl rand -base64 32

# Store in .env (never commit)
JWT_SECRET=$(openssl rand -base64 32)

# Generate Solana keypair
solana-keygen new --outfile ~/.config/solana/id.json

# Export private key
cat ~/.config/solana/id.json | jq '.[0:32]' | base64
```

### Staging/Production (AWS)
```bash
# Use AWS Secrets Manager instead of .env
aws secretsmanager create-secret --name treasury-agent/prod/secrets \
  --secret-string '{
    "database_url": "...",
    "jwt_secret": "...",
    "solana_private_key": "..."
  }'

# Fetch in application
import json
import boto3
secret_client = boto3.client('secretsmanager')
secret = secret_client.get_secret_value(SecretId='treasury-agent/prod/secrets')
config = json.loads(secret['SecretString'])
```

---

## 🧪 Testing Configuration

### Test Environment Variables

```bash
# Use separate test database
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/treasury_agent_test

# Use in-memory Redis
TEST_REDIS_MODE=memory

# Mock external services
TEST_MODE=true
AI_SERVICE_MOCK=true
SOLANA_MOCK=true

# Reduce timeouts for faster tests
TEST_TIMEOUT=5000
```

### Test .env File

```bash
# Create test/.env.test
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost:5432/treasury_agent_test
REDIS_URL=redis://localhost:6380
TEST_MODE=true
AI_SERVICE_URL=http://localhost:5001  # Mock server
SOLANA_NETWORK=localnet              # Use local validator
```

---

## 📊 Monitoring Configuration

### Datadog Integration

```bash
# Environment variables
DATADOG_ENABLED=true
DATADOG_API_KEY=...
DATADOG_SITE=datadoghq.com
DATADOG_ENV=production
DATADOG_SERVICE=treasury-agent
DATADOG_VERSION=0.1.0

# Docker tag
DD_TAGS="env:production,service:treasury-agent"
```

### Prometheus Metrics

```bash
# Enable metrics endpoint
PROMETHEUS_ENABLED=true
METRICS_PORT=9090

# Access metrics at:
# http://localhost:9090/metrics
```

### Sentry Error Tracking

```bash
SENTRY_ENABLED=true
SENTRY_DSN=https://key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions
SENTRY_ERROR_SAMPLE_RATE=1.0   # 100% of errors
```

---

## 🔄 Configuration Hierarchy

```
1. Environment Variables (highest priority)
2. .env file (checked in values)
3. .env.{NODE_ENV} file (environment-specific)
4. Default values in code (lowest priority)
```

### Loading Order
```typescript
// Load .env.production if NODE_ENV=production
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });
dotenv.config({ path: '.env' });

// Environment variables from system take precedence
const config = {
  port: process.env.PORT || 3001,
  jwt_secret: process.env.JWT_SECRET,  // Required
  // ...
};
```

---

## ✅ Configuration Validation

### Startup Checks

```typescript
function validateConfig() {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'SOLANA_PROGRAM_ID',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  
  // Validate secret length
  if ((process.env.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  // Validate URLs are valid
  try {
    new URL(process.env.DATABASE_URL || '');
    new URL(process.env.REDIS_URL || '');
  } catch (e) {
    throw new Error(`Invalid URL format: ${e.message}`);
  }
  
  logger.info('Configuration validated successfully');
}

validateConfig();
```

---

## 📝 Configuration Checklist

- [ ] `.env.example` has all required variables with descriptions
- [ ] `.env` is in `.gitignore` (never commit secrets)
- [ ] All secrets stored in AWS Secrets Manager (production)
- [ ] Configuration validated on startup
- [ ] Logging level set appropriately per environment
- [ ] CORS origins configured correctly
- [ ] Database connection pooling set up
- [ ] Rate limiting configured
- [ ] Monitoring enabled (Datadog/Sentry)
- [ ] Health check endpoints working

---

**File Locations**:
- Backend: `/backend/.env.example`
- Frontend: `/frontend/.env.example`
- ML: `/ml/.env.example` or `config.py`
- Docker: `/docker-compose.yml`

**Secrets Management**:
- Dev/Local: `.env` files (never commit)
- Staging: AWS Systems Manager Parameter Store
- Production: AWS Secrets Manager

