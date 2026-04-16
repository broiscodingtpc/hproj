# Treasury Agent: Database Schema

**PostgreSQL schema for corporate accounts, settlements, compliance, and analytics.**

---

## 📋 Tables Overview

```
Accounts
├── AccountSigners
├── Settlements
│   ├── SettlementApprovals
│   └── SettlementAudit
├── Routes
├── Users
│   ├── UserRoles
│   └── UserSessions
├── AuditLog
├── Anomalies
└── Analytics
```

---

## 🔑 Core Tables

### **1. Accounts**

Stores corporate treasury accounts (companies with Solana vaults).

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,  -- Foreign key to company/tenant
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL,  -- INR, PHP, MXN, VND, USD
    description TEXT,
    
    -- Solana Integration
    solana_vault_pubkey VARCHAR(44) UNIQUE NOT NULL,  -- Vault public key
    token_mint_address VARCHAR(44) NOT NULL,  -- USDC, USDT, etc.
    
    -- Balance & Status
    balance_raw BIGINT NOT NULL DEFAULT 0,  -- In token minor units (1 USDC = 1,000,000)
    balance_decimal NUMERIC(20, 6) GENERATED ALWAYS AS (balance_raw::NUMERIC / 1000000) STORED,
    holds BIGINT NOT NULL DEFAULT 0,  -- Amount locked in pending settlements
    available_balance BIGINT GENERATED ALWAYS AS (balance_raw - holds) STORED,
    
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, suspended, closed
    
    -- Compliance
    kyc_status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, verified, rejected, expired
    kyc_verified_date TIMESTAMP,
    kyc_expiry_date TIMESTAMP,
    aml_status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, clear, flagged
    aml_last_checked TIMESTAMP,
    
    -- Limits
    daily_limit BIGINT NOT NULL DEFAULT 10000000,
    daily_limit_used BIGINT NOT NULL DEFAULT 0,
    monthly_limit BIGINT NOT NULL DEFAULT 50000000,
    monthly_limit_used BIGINT NOT NULL DEFAULT 0,
    
    metadata JSONB,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT accounts_balance_nonnegative CHECK (balance_raw >= 0),
    CONSTRAINT accounts_holds_nonnegative CHECK (holds >= 0),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_accounts_company ON accounts(company_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_currency ON accounts(currency);
CREATE INDEX idx_accounts_solana_vault ON accounts(solana_vault_pubkey);
```

---

### **2. AccountSigners**

Multi-sig signers for each account (2-of-3 required for withdrawals).

```sql
CREATE TABLE account_signers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    signer_pubkey VARCHAR(44) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- treasurer, approver, backup
    order_index INT NOT NULL,  -- 1, 2, or 3
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, revoked
    added_by_user_id UUID NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    
    UNIQUE(account_id, order_index),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_account_signers_account ON account_signers(account_id);
```

---

### **3. Settlements**

Stores all settlement transactions (core business logic).

```sql
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    
    -- Accounts & Amount
    from_account_id UUID NOT NULL,
    to_account_id UUID NOT NULL,
    amount_raw BIGINT NOT NULL,  -- In minor units
    amount_decimal NUMERIC(20, 6) GENERATED ALWAYS AS (amount_raw::NUMERIC / 1000000) STORED,
    currency VARCHAR(3) NOT NULL,
    
    -- Reference & Metadata
    reference VARCHAR(255),
    metadata JSONB,  -- Invoice ID, department, etc.
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'initiated',
    -- Values: initiated, routing, approved, executing, completed, failed, cancelled
    
    -- Multi-sig Approvals
    approvals_required INT NOT NULL DEFAULT 2,
    approvals_received INT NOT NULL DEFAULT 0,
    approvals_completed_at TIMESTAMP,
    
    -- Route & Cost
    route_id UUID,  -- Foreign key to routes table
    estimated_cost_raw BIGINT,
    actual_cost_raw BIGINT,
    
    -- Blockchain
    solana_transaction VARCHAR(88),  -- Transaction signature
    solana_block INT,
    solana_confirmations INT DEFAULT 0,
    blockchain_status VARCHAR(50),  -- pending, confirming, confirmed, failed
    
    -- Timing
    timelock_release_at TIMESTAMP,
    initiated_by_user_id UUID NOT NULL,
    initiated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    executed_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    completion_time_ms INT,  -- How long settlement took
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT settlements_positive_amount CHECK (amount_raw > 0),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (from_account_id) REFERENCES accounts(id),
    FOREIGN KEY (to_account_id) REFERENCES accounts(id),
    FOREIGN KEY (route_id) REFERENCES routes(id),
    FOREIGN KEY (initiated_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_settlements_company ON settlements(company_id);
CREATE INDEX idx_settlements_from_account ON settlements(from_account_id);
CREATE INDEX idx_settlements_to_account ON settlements(to_account_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_created ON settlements(created_at DESC);
CREATE INDEX idx_settlements_solana_tx ON settlements(solana_transaction);
CREATE INDEX idx_settlements_date_range ON settlements(created_at, status);
```

---

### **4. SettlementApprovals**

Tracks individual signer approvals for multi-sig.

```sql
CREATE TABLE settlement_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL,
    account_signer_id UUID NOT NULL,
    signer_pubkey VARCHAR(44) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    notes TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(settlement_id, signer_pubkey),
    FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE,
    FOREIGN KEY (account_signer_id) REFERENCES account_signers(id)
);

CREATE INDEX idx_settlement_approvals_settlement ON settlement_approvals(settlement_id);
CREATE INDEX idx_settlement_approvals_status ON settlement_approvals(status);
```

---

### **5. SettlementAudit**

Immutable audit trail for each settlement (for compliance).

```sql
CREATE TABLE settlement_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    -- Values: created, routing_selected, approval_required, approved_by_signer, 
    --         timelock_released, executed, confirmed, failed
    action_by_user_id UUID,
    action_by_signer_pubkey VARCHAR(44),
    details JSONB,  -- Full context of the action
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE,
    FOREIGN KEY (action_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_settlement_audit_settlement ON settlement_audit(settlement_id);
CREATE INDEX idx_settlement_audit_action ON settlement_audit(action);
CREATE INDEX idx_settlement_audit_created ON settlement_audit(created_at DESC);
```

---

### **6. Routes**

AI-optimized settlement routes and their performance metrics.

```sql
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Route Definition
    from_token VARCHAR(44),  -- Token mint address (e.g., USDC)
    to_token VARCHAR(44),    -- Token mint address (e.g., USDT)
    route_type VARCHAR(50) NOT NULL,
    -- Values: direct_pair, via_bridge, via_liquidity_pool, cross_chain
    
    -- Characteristics
    hops INT NOT NULL,  -- Number of hops (1 = direct, 2+ = multi-hop)
    cost_estimate_raw BIGINT NOT NULL,  -- Estimated cost in minor units
    cost_percentage NUMERIC(6, 4),  -- As percentage (0.0075 = 0.75%)
    speed_estimate_ms INT NOT NULL,  -- Expected completion time
    liquidity_score INT,  -- 0-100, higher = better
    
    -- AI Model Metadata
    model_version VARCHAR(50),
    model_confidence NUMERIC(3, 2),  -- 0.00-1.00
    created_by_model_version VARCHAR(50),
    
    -- Validation
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, testing, deprecated
    valid_until TIMESTAMP,  -- Route expires after 24 hours
    
    -- Performance Tracking
    usage_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    avg_actual_cost_raw BIGINT,
    
    metadata JSONB,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT routes_positive_cost CHECK (cost_estimate_raw > 0)
);

CREATE INDEX idx_routes_tokens ON routes(from_token, to_token);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_routes_valid_until ON routes(valid_until);
```

---

### **7. Users**

Treasury operators and admins with role-based access.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Authentication
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP,
    login_attempts INT DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, inactive, suspended
    
    -- Roles
    is_admin BOOLEAN DEFAULT FALSE,
    
    metadata JSONB,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
```

---

### **8. UserRoles**

Fine-grained access control per account.

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    -- Values: viewer (read-only), analyst (read + reports), 
    --         treasurer (initiate settlements), approver (approve settlements), admin
    
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by_user_id UUID NOT NULL,
    revoked_at TIMESTAMP,
    
    UNIQUE(user_id, account_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by_user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_account ON user_roles(account_id);
```

---

### **9. AuditLog**

Immutable compliance audit trail (all user actions).

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    -- Values: login, settlement_initiate, settlement_approve, account_create, 
    --         user_create, settings_change, etc.
    resource_type VARCHAR(50),  -- settlement, account, user, etc.
    resource_id UUID,
    
    details JSONB,  -- Full context
    
    ip_address INET,
    user_agent TEXT,
    mfa_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_log_company ON audit_log(company_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
```

---

### **10. Anomalies**

AI-detected unusual settlement patterns for compliance review.

```sql
CREATE TABLE anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    settlement_id UUID,
    account_id UUID,
    
    anomaly_type VARCHAR(50) NOT NULL,
    -- Values: unusual_amount, unusual_frequency, unusual_recipient,
    --         velocity_check_fail, pattern_deviation
    
    risk_score INT NOT NULL,  -- 0-100
    details JSONB,
    
    status VARCHAR(50) NOT NULL DEFAULT 'reported',
    -- Values: reported, under_review, cleared, action_taken
    
    assigned_to_user_id UUID,
    notes TEXT,
    
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    resolved_at TIMESTAMP,
    
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (settlement_id) REFERENCES settlements(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
);

CREATE INDEX idx_anomalies_company ON anomalies(company_id);
CREATE INDEX idx_anomalies_status ON anomalies(status);
CREATE INDEX idx_anomalies_risk_score ON anomalies(risk_score DESC);
```

---

## 📊 Analytics & Reporting Tables

### **11. DailySettlementMetrics** (Materialized View)

Pre-computed daily metrics for analytics dashboards.

```sql
CREATE MATERIALIZED VIEW daily_settlement_metrics AS
SELECT
    DATE(s.created_at) as date,
    s.company_id,
    COUNT(*) as num_settlements,
    SUM(s.amount_raw) as total_volume,
    AVG(s.amount_raw) as avg_settlement_size,
    SUM(s.actual_cost_raw) as total_fees,
    AVG(s.completion_time_ms) as avg_completion_time_ms,
    MIN(s.completion_time_ms) as min_completion_time_ms,
    MAX(s.completion_time_ms) as max_completion_time_ms,
    SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) as successful_count,
    SUM(CASE WHEN s.status = 'failed' THEN 1 ELSE 0 END) as failed_count
FROM settlements s
WHERE s.status IN ('completed', 'failed')
GROUP BY DATE(s.created_at), s.company_id;

CREATE INDEX idx_daily_metrics_company_date ON daily_settlement_metrics(company_id, date DESC);
```

### **12. CompanyMetrics** (View)

Real-time company-level metrics.

```sql
CREATE VIEW company_metrics AS
SELECT
    c.id as company_id,
    c.name,
    COUNT(DISTINCT s.id) as total_settlements,
    SUM(s.amount_raw) as total_volume,
    SUM(s.actual_cost_raw) as total_fees_paid,
    COUNT(DISTINCT a.id) as num_accounts,
    MAX(s.created_at) as last_settlement_date,
    AVG(s.completion_time_ms) as avg_settlement_time_ms
FROM companies c
LEFT JOIN settlements s ON c.id = s.company_id AND s.status = 'completed'
LEFT JOIN accounts a ON c.id = a.company_id AND a.status = 'active'
GROUP BY c.id, c.name;
```

---

## 🔄 Key Relationships

```
companies
├── accounts (1:N)
│   ├── account_signers (1:N, max 3)
│   ├── user_roles (N:M via user_roles)
│   ├── settlements.from_account_id (1:N)
│   └── settlements.to_account_id (1:N)
├── users (1:N)
│   ├── user_roles (1:N)
│   ├── audit_log (1:N)
│   ├── settlements.initiated_by (1:N)
│   └── account_signers.added_by (1:N)
└── settlements (1:N)
    ├── settlement_approvals (1:N)
    ├── settlement_audit (1:N)
    ├── routes (N:1)
    └── anomalies (1:N)
```

---

## 🚀 Setup Instructions

### Create Database

```bash
createdb treasury_agent

# Or with Docker
docker run --name postgres-treasury \
  -e POSTGRES_DB=treasury_agent \
  -e POSTGRES_PASSWORD=secure_password \
  -p 5432:5432 \
  -d postgres:15
```

### Initialize Schema

```bash
# Using migration tool (Flyway, Liquibase, or TypeORM)
npm run migrate:latest

# Or run SQL directly
psql -U postgres -d treasury_agent -f schema.sql
```

### Create Indexes for Performance

```sql
-- Composite indexes for common queries
CREATE INDEX idx_settlements_account_date ON settlements(from_account_id, created_at DESC);
CREATE INDEX idx_settlements_company_status_date ON settlements(company_id, status, created_at DESC);
CREATE INDEX idx_audit_log_user_action ON audit_log(user_id, action, created_at DESC);

-- Partial indexes for active records
CREATE INDEX idx_accounts_active ON accounts(company_id) WHERE status = 'active';
CREATE INDEX idx_settlements_active ON settlements(company_id) WHERE status != 'completed';
```

### Backup Strategy

```bash
# Daily backup
pg_dump treasury_agent | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup_20250115.sql.gz | psql treasury_agent
```

---

## 🔒 Data Privacy & Compliance

- **Encryption**: Sensitive fields (private keys, passwords) encrypted at rest using pgcrypto
- **Audit Trail**: All changes logged in `audit_log` and `settlement_audit` tables
- **Data Retention**: Settlement records kept for 7 years (regulatory requirement)
- **PII Handling**: User emails and personal data encrypted, masked in logs
- **Regional Compliance**: Separate PostgreSQL instances per region (India, APAC, LatAm)

---

## 📈 Performance Optimization

**Connection Pooling** (PgBouncer):
```
listen_port = 5432
databases = treasury_agent=host=localhost port=5433 dbname=treasury_agent
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

**Query Optimization**:
- Indexes on frequently filtered columns (status, date, company_id)
- Materialized views for analytics (refresh nightly)
- Query result caching in Redis (5-minute TTL)

**Monitoring**:
```sql
-- Slow query detection
SET log_min_duration_statement = 1000;  -- Log queries > 1 second

-- Connection monitoring
SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;

-- Index effectiveness
SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

---

**Migration Tool Recommendation**: Use TypeORM or Knex.js for version control of schema changes.

**ER Diagram**: Available in `/docs/database-erd.png`
