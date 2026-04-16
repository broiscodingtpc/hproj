# Treasury Agent: API Specification

**Complete OpenAPI specification for backend microservices.**

---

## 📋 Service Architecture

```
Frontend (React) 
    ↓
API Gateway (http://localhost:3001)
    ├── Settlement Service (port 3001)
    ├── AI Agent Service (port 3002)
    └── Compliance Service (port 3003)
    ↓
Solana Programs
PostgreSQL + Redis
```

---

## 🔐 Authentication

**All endpoints require JWT Bearer token in Authorization header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Obtain token via:**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "treasurer@company.com",
  "password": "secure_password",
  "mfa_code": "123456"  // 6-digit code from authenticator app
}

Response:
{
  "access_token": "eyJ...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

---

## 📌 Settlement Service (Port 3001)

### Base URL: `http://localhost:3001/api/v1`

---

### **1. Create Settlement**

**Endpoint**: `POST /settlements`

**Description**: Initiate a new settlement between two treasury accounts.

**Request**:
```json
{
  "from_account_id": "uuid-from",
  "to_account_id": "uuid-to",
  "amount": 50000,
  "currency": "INR",
  "reference": "Invoice-123",
  "metadata": {
    "invoice_id": "INV-2025-001",
    "department": "Operations"
  }
}
```

**Response** (201 Created):
```json
{
  "settlement_id": "sett-uuid-123",
  "from_account": {
    "id": "uuid-from",
    "name": "Mumbai Office",
    "currency": "INR"
  },
  "to_account": {
    "id": "uuid-to",
    "name": "Bank Account B",
    "currency": "INR"
  },
  "amount": 50000,
  "status": "initiated",
  "created_at": "2025-01-15T10:30:00Z",
  "estimated_completion_time": "3 seconds",
  "fees": {
    "settlement_fee": 75,
    "currency": "INR"
  },
  "blockchain": {
    "status": "pending",
    "transaction": null
  }
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "INSUFFICIENT_BALANCE",
  "message": "From account has insufficient balance",
  "required": 50000,
  "available": 45000
}

// 403 Forbidden
{
  "error": "DAILY_LIMIT_EXCEEDED",
  "message": "Daily settlement limit exceeded",
  "limit": 1000000,
  "used_today": 950000
}

// 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Maximum 100 settlements per hour",
  "reset_at": "2025-01-15T11:30:00Z"
}
```

---

### **2. Get Settlement Details**

**Endpoint**: `GET /settlements/{settlement_id}`

**Description**: Retrieve full details of a settlement including blockchain status.

**Response** (200 OK):
```json
{
  "settlement_id": "sett-uuid-123",
  "from_account": { ... },
  "to_account": { ... },
  "amount": 50000,
  "status": "executing",
  "created_at": "2025-01-15T10:30:00Z",
  "approvals": {
    "status": "complete",
    "required": 2,
    "approved_by": [
      { "signer": "treasury-key-1", "approved_at": "2025-01-15T10:31:00Z" },
      { "signer": "treasury-key-2", "approved_at": "2025-01-15T10:31:30Z" }
    ]
  },
  "blockchain": {
    "status": "confirming",
    "transaction": "5dZWq... (40-char signature)",
    "confirmations": 15,
    "required_confirmations": 32,
    "block": 198765432,
    "solana_explorer": "https://solscan.io/tx/5dZWq...?cluster=mainnet"
  },
  "route": {
    "route_id": "route-uuid-456",
    "type": "direct_pair",
    "tokens": ["USDC", "USDT"],
    "liquidity_score": 94,
    "speed_score": 99,
    "cost_estimate": 75,
    "currency": "INR"
  },
  "ai_analysis": {
    "confidence": 0.94,
    "rationale": "Direct USD pair has best liquidity and minimal slippage",
    "alternatives": [
      { "route": "via_USDC", "cost": 120, "speed": 4 },
      { "route": "via_bridge", "cost": 200, "speed": 2 }
    ]
  },
  "fees": {
    "settlement_fee": 75,
    "actual_cost": 72,
    "savings": 3,
    "currency": "INR"
  },
  "completion_time_ms": 2847,
  "updated_at": "2025-01-15T10:30:03Z"
}
```

---

### **3. List Settlements (Paginated)**

**Endpoint**: `GET /settlements?limit=20&offset=0&status=completed&from_date=2025-01-01`

**Query Parameters**:
- `limit`: Results per page (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status (initiated, executing, completed, failed)
- `from_date`: ISO 8601 date filter
- `to_date`: ISO 8601 date filter
- `account_id`: Filter by from/to account
- `sort_by`: created_at (default), amount, status

**Response** (200 OK):
```json
{
  "settlements": [
    { ... },
    { ... }
  ],
  "total": 847,
  "limit": 20,
  "offset": 0,
  "has_next": true
}
```

---

### **4. Create Account**

**Endpoint**: `POST /accounts`

**Description**: Create a new corporate treasury account.

**Request**:
```json
{
  "name": "India Operations",
  "currency": "INR",
  "description": "Mumbai office operating account",
  "token_mint": "EPjFWaob...",  // USDC mint address
  "initial_balance": 1000000,
  "metadata": {
    "office_location": "Mumbai",
    "cost_center": "APAC-001"
  }
}
```

**Response** (201 Created):
```json
{
  "account_id": "acc-uuid-001",
  "name": "India Operations",
  "currency": "INR",
  "balance": 1000000,
  "solana_vault": "9B5X...",  // Vault public key on Solana
  "status": "active",
  "created_at": "2025-01-15T09:00:00Z",
  "compliance": {
    "kyc_status": "verified",
    "aml_status": "clear",
    "limits": {
      "daily": 10000000,
      "transaction": 5000000,
      "monthly": 50000000
    }
  }
}
```

---

### **5. Get Account Details**

**Endpoint**: `GET /accounts/{account_id}`

**Response** (200 OK):
```json
{
  "account_id": "acc-uuid-001",
  "name": "India Operations",
  "currency": "INR",
  "balance": 950000,
  "available_balance": 950000,  // Balance minus pending withdrawals
  "holds": 0,
  "solana_vault": "9B5X...",
  "signers": [
    { "signer": "key-1", "role": "treasurer" },
    { "signer": "key-2", "role": "approver" },
    { "signer": "key-3", "role": "backup" }
  ],
  "status": "active",
  "created_at": "2025-01-15T09:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "analytics": {
    "total_settled": 5000000,
    "num_settlements": 47,
    "avg_settlement_size": 106383,
    "avg_completion_time_ms": 2915,
    "total_fees_paid": 3750
  },
  "compliance": {
    "kyc_status": "verified",
    "aml_status": "clear",
    "daily_limit_remaining": 9000000,
    "monthly_limit_remaining": 45000000
  }
}
```

---

### **6. Get Settlement History (Chart Data)**

**Endpoint**: `GET /accounts/{account_id}/settlement-history?period=7d`

**Query Parameters**:
- `period`: 7d (default), 30d, 90d, 365d

**Response** (200 OK):
```json
{
  "account_id": "acc-uuid-001",
  "period": "7d",
  "timeline": [
    {
      "date": "2025-01-09",
      "settlements": 12,
      "volume": 500000,
      "fees": 375,
      "avg_completion_time_ms": 2847
    },
    {
      "date": "2025-01-10",
      "settlements": 8,
      "volume": 400000,
      "fees": 300,
      "avg_completion_time_ms": 2921
    }
  ],
  "summary": {
    "total_settlements": 67,
    "total_volume": 3500000,
    "total_fees": 2625,
    "avg_completion_time_ms": 2884,
    "cost_savings_vs_banks": 245000  // Estimated savings
  }
}
```

---

### **7. Approve Settlement (Multi-Sig)**

**Endpoint**: `POST /settlements/{settlement_id}/approve`

**Description**: Multi-sig signer approves a pending settlement.

**Request**:
```json
{
  "signer_key": "treasury-key-1"
}
```

**Response** (200 OK):
```json
{
  "settlement_id": "sett-uuid-123",
  "approvals": {
    "status": "approved",
    "required": 2,
    "received": 2,
    "approved_by": [
      { "signer": "treasury-key-1", "approved_at": "2025-01-15T10:31:00Z" },
      { "signer": "treasury-key-2", "approved_at": "2025-01-15T10:31:30Z" }
    ]
  },
  "next_step": "Executing on blockchain",
  "blockchain": {
    "status": "queued_for_execution",
    "estimated_execution_time": "5 seconds"
  }
}
```

---

## 🤖 AI Agent Service (Port 3002)

### Base URL: `http://localhost:3002/api/v1`

---

### **1. Predict Settlement Route**

**Endpoint**: `POST /routes/predict`

**Description**: AI agent predicts optimal settlement route and cost.

**Request**:
```json
{
  "from_token": "USDC",
  "to_token": "USDT",
  "amount": 50000,
  "from_region": "India",
  "to_region": "Philippines",
  "priority": "cost",  // "cost", "speed", or "balanced"
  "historical_data": true  // Include historical performance
}
```

**Response** (200 OK):
```json
{
  "settlement_id": "sett-uuid-123",
  "recommended_route": {
    "route_id": "route-uuid-456",
    "type": "direct_pair",
    "tokens": ["USDC", "USDT"],
    "hops": 1,
    "cost_estimate": 75,
    "cost_percentage": 0.15,
    "speed_estimate_ms": 2850,
    "liquidity_score": 94,
    "confidence": 0.94
  },
  "alternatives": [
    {
      "route_id": "route-uuid-789",
      "type": "via_usdc_bridge",
      "tokens": ["USDC", "USDC-Bridge", "USDT"],
      "hops": 2,
      "cost_estimate": 120,
      "speed_estimate_ms": 4200,
      "liquidity_score": 78,
      "confidence": 0.87
    }
  ],
  "rationale": "Direct USDC-USDT pair offers best liquidity on Solana with minimal slippage",
  "market_data": {
    "usdc_price_usd": 0.9998,
    "usdt_price_usd": 1.0001,
    "exchange_rate_inr_to_usd": 0.01205,
    "solana_network_load": 45,  // 0-100 scale
    "estimated_network_fee": 0.00001
  },
  "historical_performance": {
    "past_30_days": {
      "avg_cost": 72,
      "min_cost": 65,
      "max_cost": 95,
      "success_rate": 0.998,
      "avg_completion_time_ms": 2847
    }
  }
}
```

---

### **2. Train Route Optimizer**

**Endpoint**: `POST /models/train`

**Description**: Trigger retraining of route optimization model (admin only).

**Request**:
```json
{
  "dataset_days": 30,
  "model_version": "v2",
  "hyperparameters": {
    "learning_rate": 0.001,
    "episodes": 10000,
    "epsilon_decay": 0.995
  }
}
```

**Response** (202 Accepted):
```json
{
  "training_id": "train-uuid-123",
  "status": "in_progress",
  "model_version": "v2",
  "start_time": "2025-01-15T11:00:00Z",
  "estimated_completion": "2025-01-15T14:00:00Z",
  "progress": {
    "current_epoch": 3456,
    "total_epochs": 10000,
    "loss": 0.0845,
    "reward": 8.234
  }
}
```

---

### **3. Get Model Performance**

**Endpoint**: `GET /models/performance?days=30`

**Response** (200 OK):
```json
{
  "model_version": "v2",
  "evaluation_period": "30d",
  "metrics": {
    "cost_prediction_accuracy": 0.956,
    "route_recommendation_success": 0.987,
    "avg_cost_savings": 0.25,  // 25% savings vs. baseline
    "cost_savings_total_30d": 245000
  },
  "performance_by_route_type": {
    "direct_pair": {
      "usage": 0.68,
      "accuracy": 0.968,
      "savings": 0.28
    },
    "via_bridge": {
      "usage": 0.22,
      "accuracy": 0.941,
      "savings": 0.18
    }
  },
  "model_drift": {
    "status": "healthy",
    "drift_score": 0.12,  // 0-1 scale, 0 = no drift
    "recommendation": "No retraining needed. Next scheduled: 2025-01-30"
  }
}
```

---

## ✅ Compliance Service (Port 3003)

### Base URL: `http://localhost:3003/api/v1`

---

### **1. Get Audit Log**

**Endpoint**: `GET /audit-log?limit=50&action=settlement&from_date=2025-01-01`

**Query Parameters**:
- `limit`: Results per page (default: 50, max: 500)
- `offset`: Pagination offset
- `action`: settlement, withdrawal, approval, account_creation
- `user_id`: Filter by user
- `from_date`: ISO 8601
- `to_date`: ISO 8601

**Response** (200 OK):
```json
{
  "audit_logs": [
    {
      "log_id": "audit-uuid-001",
      "timestamp": "2025-01-15T10:30:00Z",
      "action": "settlement_executed",
      "user": {
        "id": "user-uuid-001",
        "email": "treasurer@company.com",
        "role": "treasurer"
      },
      "settlement": {
        "settlement_id": "sett-uuid-123",
        "from_account": "India Operations",
        "to_account": "Bank Account B",
        "amount": 50000,
        "currency": "INR"
      },
      "blockchain": {
        "transaction": "5dZWq...",
        "block": 198765432,
        "confirmed": true
      },
      "metadata": {
        "ip_address": "203.0.113.42",
        "user_agent": "Mozilla/5.0...",
        "mfa_verified": true
      }
    }
  ],
  "total": 347,
  "limit": 50,
  "offset": 0
}
```

---

### **2. Check Compliance Status**

**Endpoint**: `GET /compliance/status/{account_id}`

**Response** (200 OK):
```json
{
  "account_id": "acc-uuid-001",
  "account_name": "India Operations",
  "compliance": {
    "kyc_status": "verified",
    "kyc_verified_date": "2025-01-01",
    "kyc_expiry": "2026-01-01",
    "aml_status": "clear",
    "aml_last_check": "2025-01-15T08:00:00Z",
    "sanctions_screening": "clear"
  },
  "limits": {
    "daily": {
      "limit": 10000000,
      "used_today": 3500000,
      "remaining": 6500000
    },
    "monthly": {
      "limit": 50000000,
      "used_this_month": 15000000,
      "remaining": 35000000
    }
  },
  "risk_score": 12,  // 0-100 scale, 0 = lowest risk
  "risk_level": "low",
  "alerts": [],
  "last_review": "2025-01-15T08:00:00Z"
}
```

---

### **3. Report Anomaly (Admin)**

**Endpoint**: `POST /anomalies/report`

**Description**: Flag an unusual settlement pattern for investigation.

**Request**:
```json
{
  "settlement_id": "sett-uuid-123",
  "reason": "Unusually large amount for this account",
  "priority": "high",
  "notes": "Amount 50M INR, typical is 5M"
}
```

**Response** (201 Created):
```json
{
  "anomaly_id": "anom-uuid-001",
  "status": "reported",
  "created_at": "2025-01-15T10:30:00Z",
  "assigned_to": "compliance-team",
  "next_review": "2025-01-15T11:00:00Z"
}
```

---

## 🏥 Health Check

**Endpoint**: `GET /health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "settlement-service",
  "version": "1.0.0",
  "uptime_seconds": 45600,
  "dependencies": {
    "database": "connected",
    "redis": "connected",
    "solana_rpc": "connected",
    "ai_service": "connected"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## 📊 Rate Limiting

All endpoints rate-limited by IP and API key:
- **Default**: 1,000 requests per hour
- **Authenticated users**: 10,000 requests per hour
- **Premium tier**: 100,000 requests per hour

**Rate limit headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1642270200
```

---

## 🔄 WebSocket (Real-time Updates)

**Endpoint**: `ws://localhost:3001/ws`

**Authentication**:
```json
{
  "type": "auth",
  "token": "eyJ..."
}
```

**Subscribe to Settlement Updates**:
```json
{
  "type": "subscribe",
  "channel": "settlement:sett-uuid-123"
}
```

**Receive Real-time Events**:
```json
{
  "type": "settlement_update",
  "settlement_id": "sett-uuid-123",
  "status": "executing",
  "blockchain": {
    "confirmations": 15
  },
  "timestamp": "2025-01-15T10:30:01Z"
}
```

---

## 📚 Code Examples

### cURL
```bash
# Create settlement
curl -X POST http://localhost:3001/api/v1/settlements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from_account_id": "acc-uuid-001",
    "to_account_id": "acc-uuid-002",
    "amount": 50000,
    "currency": "INR"
  }'
```

### TypeScript/Node.js
```typescript
import fetch from 'node-fetch';

async function createSettlement(token: string) {
  const response = await fetch('http://localhost:3001/api/v1/settlements', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from_account_id: 'acc-uuid-001',
      to_account_id: 'acc-uuid-002',
      amount: 50000,
      currency: 'INR'
    })
  });

  return response.json();
}
```

### Python
```python
import requests

headers = {'Authorization': f'Bearer {token}'}
data = {
    'from_account_id': 'acc-uuid-001',
    'to_account_id': 'acc-uuid-002',
    'amount': 50000,
    'currency': 'INR'
}

response = requests.post(
    'http://localhost:3001/api/v1/settlements',
    headers=headers,
    json=data
)
```

---

**OpenAPI spec available at**: `/api/v1/docs` (Swagger UI)

**Postman Collection**: Download from `/api/v1/postman-collection.json`
