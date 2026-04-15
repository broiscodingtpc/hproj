# Treasury Agent: Smart Contract Specification

**Solana Rust/Anchor programs for multi-currency vaults and settlement execution.**

---

## 📋 Contract Overview

Two core programs:

### 1. **Treasury Vault** (`treasury_vault`)
Multi-currency account with multi-sig approval and timelocked withdrawals.

### 2. **Settlement Router** (`settlement_router`)
Executes settlements between accounts with route optimization and cost tracking.

---

## 🏗️ Program 1: Treasury Vault

### Purpose
Holds funds in multiple stablecoin denominations (USDC, USDT, emerging market stablecoins). Implements 2-of-3 multi-sig approval and timelocked withdrawals for security.

### Data Structures

```rust
// Main vault account
#[account]
pub struct TreasuryVault {
    pub id: Pubkey,                    // Unique identifier
    pub owner: Pubkey,                 // Corporate treasury owner
    pub signers: [Pubkey; 3],          // Signers for multi-sig (2-of-3 required)
    pub approval_threshold: u8,        // Required approvals (2)
    pub deposit_token_mint: Pubkey,    // Token mint (USDC, USDT, etc)
    pub vault_token_account: Pubkey,   // Token account holding funds
    pub timelock_duration: i64,        // Seconds before withdrawal executes (3600 = 1 hour)
    pub total_balance: u64,            // Total funds in vault (lamports/minor units)
    pub pending_withdrawals: u32,      // Count of pending timelock withdrawals
    pub created_at: i64,
    pub bump: u8,                      // PDA bump for signing
}

// Multi-sig approval tracker
#[account]
pub struct MultiSigApproval {
    pub id: Pubkey,
    pub vault: Pubkey,
    pub action_type: ActionType,       // Withdrawal, Transfer, UpdateSigner
    pub proposed_by: Pubkey,
    pub approvals: [Option<Pubkey>; 3], // Which signers approved
    pub approval_count: u8,
    pub threshold: u8,
    pub created_at: i64,
    pub expires_at: i64,               // 24-hour expiration
    pub status: ApprovalStatus,        // Pending, Approved, Rejected, Executed
}

// Timelocked withdrawal
#[account]
pub struct TimelockWithdrawal {
    pub id: Pubkey,
    pub vault: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub initiated_at: i64,
    pub can_execute_at: i64,           // Current time + timelock_duration
    pub executed_at: Option<i64>,
    pub status: WithdrawalStatus,      // Pending, Executed, Cancelled
}

// Enum for action types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ActionType {
    Withdrawal,
    Transfer,
    UpdateSigner,
    UpdateTimelock,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
    Executed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum WithdrawalStatus {
    Pending,
    Executed,
    Cancelled,
}
```

### Instructions (Program Functions)

#### **1. Initialize Vault**
```rust
pub fn initialize_vault(
    ctx: Context<InitializeVault>,
    id: Pubkey,
    signers: [Pubkey; 3],
    approval_threshold: u8,
    timelock_duration: i64,
    deposit_token_mint: Pubkey,
) -> Result<()>
```

**What it does**: Creates a new treasury vault for a corporate account.

**Parameters**:
- `id`: Unique vault identifier
- `signers`: 3 addresses authorized to approve withdrawals
- `approval_threshold`: Number of signers required (typically 2)
- `timelock_duration`: Seconds before withdrawal can execute (3600 = 1 hour)
- `deposit_token_mint`: Token to deposit (USDC = EPjFWaobg...cX, USDT = Es9vt...)

**Accounts required**:
```rust
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 96 + 1 + 32 + 32 + 8 + 8 + 4 + 8 + 1
    )]
    pub vault: Account<'info, TreasuryVault>,
    
    #[account(
        init,
        payer = owner,
        token::mint = deposit_token_mint,
        token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    pub deposit_token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
```

---

#### **2. Propose Withdrawal**
```rust
pub fn propose_withdrawal(
    ctx: Context<ProposeWithdrawal>,
    amount: u64,
    recipient: Pubkey,
) -> Result<()>
```

**What it does**: Initiates a withdrawal request that requires multi-sig approval.

**Parameters**:
- `amount`: Lamports/token minor units to withdraw
- `recipient`: Address to send funds to

**Logic**:
1. Validate amount doesn't exceed vault balance
2. Create `MultiSigApproval` account (status: Pending)
3. Emit event for signers to see approval request
4. Approval must happen within 24 hours or expires

---

#### **3. Approve Withdrawal**
```rust
pub fn approve_withdrawal(
    ctx: Context<ApproveWithdrawal>,
    approval_id: Pubkey,
) -> Result<()>
```

**What it does**: One signer approves a pending withdrawal.

**Logic**:
1. Verify signer is in vault's signer list
2. Check approval hasn't expired (24-hour window)
3. Mark signer as approved
4. If approval count >= threshold, change status to `Approved`
5. No execution yet (wait for timelock)

---

#### **4. Execute Withdrawal**
```rust
pub fn execute_withdrawal(
    ctx: Context<ExecuteWithdrawal>,
    approval_id: Pubkey,
) -> Result<()>
```

**What it does**: Executes an approved withdrawal (after timelock expires).

**Requirements**:
- Approval must have >= threshold approvals
- Timelock period must have passed
- Vault must have sufficient balance

**Logic**:
1. Check timelock has expired: `current_time > initiated_at + timelock_duration`
2. Transfer funds from vault to recipient
3. Mark approval as `Executed`
4. Update vault balance
5. Create on-chain audit log entry

---

#### **5. Update Signer**
```rust
pub fn update_signer(
    ctx: Context<UpdateSigner>,
    old_signer: Pubkey,
    new_signer: Pubkey,
) -> Result<()>
```

**What it does**: Change one of the 3 multi-sig signers (requires approval from existing signers).

**Logic**:
1. Find `old_signer` in signers array
2. Replace with `new_signer`
3. Emit event (for frontend audit log)

---

#### **6. Deposit Funds**
```rust
pub fn deposit_funds(
    ctx: Context<DepositFunds>,
    amount: u64,
) -> Result<()>
```

**What it does**: Corporate treasury deposits stablecoins into the vault.

**Parameters**:
- `amount`: Tokens to deposit (in minor units: 1 USDC = 1,000,000)

**Logic**:
1. Transfer tokens from corporate account to vault
2. Update vault balance
3. Emit deposit event

---

### Events (Audit Trail)

```rust
#[event]
pub struct VaultInitialized {
    pub vault: Pubkey,
    pub owner: Pubkey,
    pub signers: [Pubkey; 3],
}

#[event]
pub struct WithdrawalProposed {
    pub approval_id: Pubkey,
    pub vault: Pubkey,
    pub amount: u64,
    pub recipient: Pubkey,
    pub proposed_at: i64,
}

#[event]
pub struct WithdrawalApproved {
    pub approval_id: Pubkey,
    pub signer: Pubkey,
    pub approval_count: u8,
}

#[event]
pub struct WithdrawalExecuted {
    pub approval_id: Pubkey,
    pub vault: Pubkey,
    pub amount: u64,
    pub recipient: Pubkey,
    pub executed_at: i64,
}

#[event]
pub struct FundsDeposited {
    pub vault: Pubkey,
    pub amount: u64,
    pub depositor: Pubkey,
}
```

---

## 🏗️ Program 2: Settlement Router

### Purpose
Routes settlements between corporate accounts, leveraging the AI agent's cost predictions to minimize fees.

### Data Structures

```rust
#[account]
pub struct Settlement {
    pub id: Pubkey,
    pub from_vault: Pubkey,
    pub to_vault: Pubkey,
    pub amount: u64,
    pub route_id: Pubkey,                  // References AI-predicted optimal route
    pub estimated_cost: u64,               // Cost in basis points (75 bps = 75)
    pub actual_cost: u64,                  // Actual cost after execution
    pub status: SettlementStatus,
    pub initiated_at: i64,
    pub executed_at: Option<i64>,
    pub settlement_time_ms: Option<u32>,   // How long settlement took (for analytics)
}

#[account]
pub struct Route {
    pub id: Pubkey,
    pub from_token: Pubkey,                // USDC mint
    pub to_token: Pubkey,                  // USDT or other stablecoin
    pub cost_estimate: u64,                // Cost in minor units
    pub liquidity_score: u8,               // 0-100, higher = better
    pub speed_score: u8,                   // 0-100, higher = faster
    pub created_at: i64,
    pub valid_until: i64,                  // Route expires after 24 hours
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum SettlementStatus {
    Initiated,
    RouteSelected,
    Approved,
    Executing,
    Completed,
    Failed,
}
```

### Instructions

#### **1. Initiate Settlement**
```rust
pub fn initiate_settlement(
    ctx: Context<InitiateSettlement>,
    from_vault: Pubkey,
    to_vault: Pubkey,
    amount: u64,
) -> Result<()>
```

**What it does**: Creates a settlement transaction that will be routed by the AI agent.

**Logic**:
1. Create Settlement account (status: Initiated)
2. Validate from_vault has sufficient balance
3. Emit event so AI service can predict best route
4. Wait for backend to call `select_route` with AI recommendation

---

#### **2. Select Route** (Called by AI Agent Backend)
```rust
pub fn select_route(
    ctx: Context<SelectRoute>,
    settlement_id: Pubkey,
    route_id: Pubkey,
) -> Result<()>
```

**What it does**: Backend AI service submits the optimal route for this settlement.

**Logic**:
1. Verify route hasn't expired
2. Update settlement with selected route
3. Change status to RouteSelected
4. Ready for approval/execution

---

#### **3. Execute Settlement**
```rust
pub fn execute_settlement(
    ctx: Context<ExecuteSettlement>,
    settlement_id: Pubkey,
) -> Result<()>
```

**What it does**: Executes the settlement (transfers funds via selected route).

**Logic**:
1. Verify route is selected and valid
2. Transfer amount from from_vault to intermediate account (if needed) or directly to to_vault
3. Charge settlement fee (cost_estimate)
4. Update settlement status to Completed
5. Record actual execution time
6. Emit SettlementCompleted event with all details

---

### Events

```rust
#[event]
pub struct SettlementInitiated {
    pub settlement_id: Pubkey,
    pub from_vault: Pubkey,
    pub to_vault: Pubkey,
    pub amount: u64,
    pub initiated_at: i64,
}

#[event]
pub struct RouteSelected {
    pub settlement_id: Pubkey,
    pub route_id: Pubkey,
    pub cost_estimate: u64,
}

#[event]
pub struct SettlementExecuted {
    pub settlement_id: Pubkey,
    pub from_vault: Pubkey,
    pub to_vault: Pubkey,
    pub amount: u64,
    pub actual_cost: u64,
    pub execution_time_ms: u32,
    pub executed_at: i64,
}
```

---

## 🔐 Security Considerations

### Multi-Sig Requirement
- All withdrawals and account changes require 2-of-3 signer approval
- Prevents single-signer compromise
- Signers should be key management infrastructure (AWS KMS, Ledger Hardware Wallet)

### Timelocks
- Withdrawals have 1-hour timelock minimum
- Gives time to detect unauthorized withdrawals and cancel
- Configured per vault (can be 1 hour to 30 days)

### Limits
- Maximum withdrawal per transaction: 10M (configurable)
- Enforce rate limiting on backend (10,000 settlements/hour max)
- MFA required for operations >$50k equivalent

### Audit Trail
- Every operation (deposit, withdrawal, settlement) emits event
- Events logged to on-chain program logs (queryable via RPC)
- Backend stores events in PostgreSQL for real-time dashboards

---

## 📊 Deployment Checklist

- [ ] Write Rust code for both programs (treasury_vault.rs, settlement_router.rs)
- [ ] Define all IDL (Interface Description Language) in Anchor
- [ ] Write unit tests (50+ tests per program)
- [ ] Test on solana-test-validator locally
- [ ] Deploy to devnet
- [ ] Test multi-sig approval flow (2 signers approving)
- [ ] Test timelock (wait for timeout, verify can execute)
- [ ] Test settlement execution (verify funds transfer)
- [ ] Generate TypeScript clients (via IDL)
- [ ] Third-party security audit (pre-mainnet)

---

## 🔗 Integration with Backend

### Backend calls contracts via:
1. **@solana/web3.js** (TypeScript SDK)
2. **Generated client** from Anchor IDL
3. **RPC calls** to Solana devnet/mainnet

### Example Backend Call (Node.js):
```typescript
// Backend service calls contract
import { web3 } from '@solana/web3.js';
import { TreasuryVaultProgram } from './generated/treasury_vault';

async function initiateSettlement(fromVault, toVault, amount) {
  const program = new TreasuryVaultProgram(provider);
  
  const tx = await program.methods
    .initiateSettlement(fromVault, toVault, new BN(amount))
    .accounts({ settlement: settlementPDA })
    .rpc();
  
  return tx; // Transaction signature
}
```

---

## 📝 Testing Template

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_initialize_vault() {
        // Setup
        // Execute: initialize_vault
        // Assert: vault account created with correct signers
    }

    #[test]
    fn test_multi_sig_approval_flow() {
        // Initialize vault with 3 signers, threshold 2
        // Propose withdrawal
        // Signer 1 approves -> status should be Pending
        // Signer 2 approves -> status should be Approved
        // Assert: approval count is 2
    }

    #[test]
    fn test_timelock_enforcement() {
        // Propose withdrawal at time T
        // Try to execute immediately -> should fail
        // Move time forward by timelock_duration
        // Execute -> should succeed
    }

    #[test]
    fn test_settlement_execution() {
        // Create 2 vaults with balances
        // Initiate settlement from vault A to vault B
        // Select route (via AI backend)
        // Execute settlement
        // Assert: Vault A balance decreased, Vault B balance increased
    }
}
```

---

## 🚀 Next Steps

1. **Implement both programs** in Rust/Anchor (2-3 weeks)
2. **Write comprehensive tests** (1 week)
3. **Deploy to devnet** and test end-to-end
4. **Integrate with backend** (settlement-service calls contracts)
5. **Third-party audit** (pre-mainnet launch)
6. **Deploy to mainnet** with $500k pilot volume

---

**File Structure**:
```
contracts/
├── Cargo.toml
├── Cargo.lock
├── programs/
│   ├── treasury-vault/
│   │   ├── src/lib.rs
│   │   ├── src/instructions/mod.rs
│   │   ├── src/state/mod.rs
│   │   └── Cargo.toml
│   ├── settlement-router/
│   │   ├── src/lib.rs
│   │   ├── src/instructions/mod.rs
│   │   └── Cargo.toml
├── tests/
│   ├── treasury_vault.ts
│   └── settlement_router.ts
└── Anchor.toml
```
