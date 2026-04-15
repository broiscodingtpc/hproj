// Treasury Vault — multi-sig vault with timelocked withdrawals.
//
// Approval model: 2-of-3 signers required for any withdrawal. Large withdrawals
// (above `large_amount_threshold`) are gated by a configurable timelock so that
// the treasury team has a window to cancel before execution.
//
// This is the MVP scaffold. Production version adds: signer rotation events,
// per-token risk limits, AML hooks, and ZK-proof attestations on settlements.

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("TVau1tProgramID11111111111111111111111111");

#[program]
pub mod treasury_vault {
    use super::*;

    /// Initialize a new treasury vault. The vault is owned by an organization
    /// (typically a multi-sig PDA) and configured with 3 signer pubkeys.
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        signers: [Pubkey; 3],
        approval_threshold: u8,
        timelock_seconds: i64,
        large_amount_threshold: u64,
    ) -> Result<()> {
        require!(approval_threshold >= 2 && approval_threshold <= 3, VaultError::InvalidThreshold);
        require!(timelock_seconds >= 0, VaultError::InvalidTimelock);

        let vault = &mut ctx.accounts.vault;
        vault.owner = ctx.accounts.owner.key();
        vault.token_mint = ctx.accounts.token_mint.key();
        vault.signers = signers;
        vault.approval_threshold = approval_threshold;
        vault.timelock_seconds = timelock_seconds;
        vault.large_amount_threshold = large_amount_threshold;
        vault.proposal_count = 0;
        vault.bump = ctx.bumps.vault;

        emit!(VaultInitialized {
            vault: vault.key(),
            owner: vault.owner,
            token_mint: vault.token_mint,
        });
        Ok(())
    }

    /// Propose a withdrawal. Creates a MultiSigApproval account that signers
    /// can approve. Once the threshold is reached and the timelock (if any)
    /// has elapsed, the proposal can be executed.
    pub fn propose_withdrawal(
        ctx: Context<ProposeWithdrawal>,
        amount: u64,
        destination: Pubkey,
        memo: String,
    ) -> Result<()> {
        require!(amount > 0, VaultError::InvalidAmount);
        require!(memo.len() <= 200, VaultError::MemoTooLong);

        let vault = &mut ctx.accounts.vault;
        let proposal = &mut ctx.accounts.proposal;
        let proposer = ctx.accounts.proposer.key();

        require!(vault.signers.contains(&proposer), VaultError::NotASigner);

        let now = Clock::get()?.unix_timestamp;
        let unlocks_at = if amount >= vault.large_amount_threshold {
            now + vault.timelock_seconds
        } else {
            now
        };

        proposal.vault = vault.key();
        proposal.proposer = proposer;
        proposal.amount = amount;
        proposal.destination = destination;
        proposal.memo = memo;
        proposal.approvals = [false; 3];
        proposal.approval_count = 0;
        proposal.created_at = now;
        proposal.unlocks_at = unlocks_at;
        proposal.executed = false;
        proposal.cancelled = false;
        proposal.bump = ctx.bumps.proposal;

        // Auto-record proposer's approval
        let proposer_idx = vault.signers.iter().position(|s| *s == proposer).unwrap();
        proposal.approvals[proposer_idx] = true;
        proposal.approval_count = 1;

        vault.proposal_count = vault.proposal_count.checked_add(1).unwrap();

        emit!(WithdrawalProposed {
            vault: vault.key(),
            proposal: proposal.key(),
            amount,
            destination,
            unlocks_at,
        });
        Ok(())
    }

    /// Approve a pending withdrawal. Each signer can only approve once.
    pub fn approve_withdrawal(ctx: Context<ApproveWithdrawal>) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let proposal = &mut ctx.accounts.proposal;
        let signer = ctx.accounts.signer.key();

        require!(!proposal.executed, VaultError::AlreadyExecuted);
        require!(!proposal.cancelled, VaultError::Cancelled);

        let signer_idx = vault.signers.iter().position(|s| *s == signer)
            .ok_or(VaultError::NotASigner)?;
        require!(!proposal.approvals[signer_idx], VaultError::AlreadyApproved);

        proposal.approvals[signer_idx] = true;
        proposal.approval_count = proposal.approval_count.checked_add(1).unwrap();

        emit!(WithdrawalApproved {
            proposal: proposal.key(),
            signer,
            approval_count: proposal.approval_count,
        });
        Ok(())
    }

    /// Execute an approved, unlocked withdrawal. Transfers SPL tokens from the
    /// vault's token account to the destination.
    pub fn execute_withdrawal(ctx: Context<ExecuteWithdrawal>) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let proposal = &mut ctx.accounts.proposal;

        require!(!proposal.executed, VaultError::AlreadyExecuted);
        require!(!proposal.cancelled, VaultError::Cancelled);
        require!(
            proposal.approval_count >= vault.approval_threshold,
            VaultError::InsufficientApprovals
        );

        let now = Clock::get()?.unix_timestamp;
        require!(now >= proposal.unlocks_at, VaultError::TimelockNotElapsed);

        // CPI: SPL token transfer from vault → destination
        let vault_key = vault.key();
        let seeds: &[&[u8]] = &[b"vault", vault_key.as_ref(), &[vault.bump]];
        let signer_seeds = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.destination_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, proposal.amount)?;

        proposal.executed = true;

        emit!(WithdrawalExecuted {
            proposal: proposal.key(),
            amount: proposal.amount,
            destination: proposal.destination,
            executed_at: now,
        });
        Ok(())
    }

    /// Cancel a pending withdrawal. Any signer can cancel before execution.
    pub fn cancel_withdrawal(ctx: Context<CancelWithdrawal>) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let proposal = &mut ctx.accounts.proposal;
        let signer = ctx.accounts.signer.key();

        require!(!proposal.executed, VaultError::AlreadyExecuted);
        require!(!proposal.cancelled, VaultError::Cancelled);
        require!(vault.signers.contains(&signer), VaultError::NotASigner);

        proposal.cancelled = true;

        emit!(WithdrawalCancelled {
            proposal: proposal.key(),
            cancelled_by: signer,
        });
        Ok(())
    }
}

// ---------- Accounts ----------

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + TreasuryVault::SIZE,
        seeds = [b"vault", owner.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TreasuryVault>,
    pub token_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProposeWithdrawal<'info> {
    #[account(mut)]
    pub vault: Account<'info, TreasuryVault>,
    #[account(
        init,
        payer = proposer,
        space = 8 + MultiSigApproval::SIZE,
        seeds = [b"proposal", vault.key().as_ref(), &vault.proposal_count.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, MultiSigApproval>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveWithdrawal<'info> {
    pub vault: Account<'info, TreasuryVault>,
    #[account(mut, has_one = vault)]
    pub proposal: Account<'info, MultiSigApproval>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteWithdrawal<'info> {
    #[account(seeds = [b"vault", vault.owner.as_ref(), vault.token_mint.as_ref()], bump = vault.bump)]
    pub vault: Account<'info, TreasuryVault>,
    #[account(mut, has_one = vault)]
    pub proposal: Account<'info, MultiSigApproval>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub destination_token_account: Account<'info, TokenAccount>,
    pub executor: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelWithdrawal<'info> {
    pub vault: Account<'info, TreasuryVault>,
    #[account(mut, has_one = vault)]
    pub proposal: Account<'info, MultiSigApproval>,
    pub signer: Signer<'info>,
}

// ---------- State ----------

#[account]
pub struct TreasuryVault {
    pub owner: Pubkey,
    pub token_mint: Pubkey,
    pub signers: [Pubkey; 3],
    pub approval_threshold: u8,
    pub timelock_seconds: i64,
    pub large_amount_threshold: u64,
    pub proposal_count: u64,
    pub bump: u8,
}
impl TreasuryVault {
    pub const SIZE: usize = 32 + 32 + (32 * 3) + 1 + 8 + 8 + 8 + 1;
}

#[account]
pub struct MultiSigApproval {
    pub vault: Pubkey,
    pub proposer: Pubkey,
    pub amount: u64,
    pub destination: Pubkey,
    pub memo: String,
    pub approvals: [bool; 3],
    pub approval_count: u8,
    pub created_at: i64,
    pub unlocks_at: i64,
    pub executed: bool,
    pub cancelled: bool,
    pub bump: u8,
}
impl MultiSigApproval {
    pub const SIZE: usize = 32 + 32 + 8 + 32 + (4 + 200) + 3 + 1 + 8 + 8 + 1 + 1 + 1;
}

// ---------- Events ----------

#[event]
pub struct VaultInitialized { pub vault: Pubkey, pub owner: Pubkey, pub token_mint: Pubkey }

#[event]
pub struct WithdrawalProposed {
    pub vault: Pubkey, pub proposal: Pubkey,
    pub amount: u64, pub destination: Pubkey, pub unlocks_at: i64,
}

#[event]
pub struct WithdrawalApproved { pub proposal: Pubkey, pub signer: Pubkey, pub approval_count: u8 }

#[event]
pub struct WithdrawalExecuted {
    pub proposal: Pubkey, pub amount: u64,
    pub destination: Pubkey, pub executed_at: i64,
}

#[event]
pub struct WithdrawalCancelled { pub proposal: Pubkey, pub cancelled_by: Pubkey }

// ---------- Errors ----------

#[error_code]
pub enum VaultError {
    #[msg("Approval threshold must be 2 or 3")]
    InvalidThreshold,
    #[msg("Timelock must be non-negative")]
    InvalidTimelock,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Memo exceeds 200 characters")]
    MemoTooLong,
    #[msg("Caller is not a registered signer")]
    NotASigner,
    #[msg("Proposal already executed")]
    AlreadyExecuted,
    #[msg("Proposal cancelled")]
    Cancelled,
    #[msg("Signer has already approved")]
    AlreadyApproved,
    #[msg("Insufficient approvals to execute")]
    InsufficientApprovals,
    #[msg("Timelock has not yet elapsed")]
    TimelockNotElapsed,
}
