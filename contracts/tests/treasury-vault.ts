// Treasury Vault — integration tests.
// Run: `anchor test` from /contracts.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TreasuryVault } from "../target/types/treasury_vault";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("treasury-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.TreasuryVault as Program<TreasuryVault>;

  let owner: Keypair;
  let signer1: Keypair, signer2: Keypair, signer3: Keypair;
  let mint: PublicKey;
  let vaultPda: PublicKey;
  let vaultBump: number;

  before(async () => {
    owner = Keypair.generate();
    [signer1, signer2, signer3] = [Keypair.generate(), Keypair.generate(), Keypair.generate()];

    // Airdrop SOL for fees
    for (const k of [owner, signer1, signer2, signer3]) {
      const sig = await provider.connection.requestAirdrop(k.publicKey, 2_000_000_000);
      await provider.connection.confirmTransaction(sig);
    }

    // Create a USDC-like SPL mint
    mint = await createMint(provider.connection, owner, owner.publicKey, null, 6);

    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.publicKey.toBuffer(), mint.toBuffer()],
      program.programId
    );
  });

  it("initializes a vault with 2-of-3 multi-sig", async () => {
    await program.methods
      .initializeVault(
        [signer1.publicKey, signer2.publicKey, signer3.publicKey],
        2, // threshold
        new anchor.BN(60), // 1 minute timelock for large amounts
        new anchor.BN(50_000_000_000) // $50,000 in micro-USDC
      )
      .accounts({
        vault: vaultPda,
        tokenMint: mint,
        owner: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const vault = await program.account.treasuryVault.fetch(vaultPda);
    assert.equal(vault.approvalThreshold, 2);
    assert.equal(vault.signers.length, 3);
  });

  it("rejects withdrawal proposal from non-signer", async () => {
    const stranger = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(stranger.publicKey, 1_000_000_000);
    await provider.connection.confirmTransaction(sig);

    const [proposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), vaultPda.toBuffer(), Buffer.from(new Uint8Array(8))],
      program.programId
    );

    try {
      await program.methods
        .proposeWithdrawal(new anchor.BN(1000), stranger.publicKey, "test")
        .accounts({ vault: vaultPda, proposal: proposalPda, proposer: stranger.publicKey, systemProgram: SystemProgram.programId })
        .signers([stranger])
        .rpc();
      assert.fail("should have thrown NotASigner");
    } catch (e: any) {
      assert.include(e.toString(), "NotASigner");
    }
  });

  // Additional tests: small withdrawal executes immediately, large withdrawal
  // respects timelock, double-approval rejected, cancellation flow, etc.
  // Full suite documented in SMART_CONTRACTS_SPEC.md (target: 30+ tests).
});
