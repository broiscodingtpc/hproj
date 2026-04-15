#!/usr/bin/env bash
# ============================================================
# Treasury Agent — one-command devnet deploy
# Run this on your machine (requires Anchor CLI + funded keypair)
# ============================================================
set -e

echo "━━━ Treasury Agent — Devnet Deploy ━━━"

# 1. Check prerequisites
command -v anchor >/dev/null 2>&1 || { echo "Install Anchor CLI: cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked"; exit 1; }
command -v solana >/dev/null 2>&1 || { echo "Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools"; exit 1; }

# 2. Set devnet
solana config set --url devnet
echo "Network: $(solana config get | grep 'RPC URL')"

# 3. Check/fund wallet
WALLET=$(solana address)
BALANCE=$(solana balance --lamports | awk '{print $1}')
echo "Wallet: $WALLET"
echo "Balance: $(solana balance) SOL"

if [ "$BALANCE" -lt 2000000000 ]; then
  echo "Requesting devnet airdrop..."
  solana airdrop 2
  sleep 3
fi

# 4. Build
echo ""
echo "Building Anchor program..."
anchor build

# 5. Get program ID
PROGRAM_ID=$(solana address -k target/deploy/treasury_vault-keypair.json)
echo "Program ID: $PROGRAM_ID"

# 6. Update Anchor.toml with real ID
sed -i.bak "s|TVau1tProgramID11111111111111111111111111|$PROGRAM_ID|g" Anchor.toml
echo "Updated Anchor.toml with program ID"

# 7. Deploy
echo ""
echo "Deploying to devnet..."
anchor deploy

# 8. Update frontend
FRONTEND="../treasury-visualizer/src/components/LiveDashboard.jsx"
if [ -f "$FRONTEND" ]; then
  sed -i.bak "s|// PROGRAM_ID_PLACEHOLDER|const PROGRAM_ID = '$PROGRAM_ID';|" "$FRONTEND"
  echo "Updated LiveDashboard.jsx with program ID"
fi

# 9. Print results
echo ""
echo "━━━ Deploy Complete ━━━"
echo "Program ID:    $PROGRAM_ID"
echo "Explorer URL:  https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "Next steps:"
echo "  1. Update SOLANA_PROGRAM_ID=$PROGRAM_ID in backend/.env"
echo "  2. Rebuild frontend: cd ../treasury-visualizer && npm run build"
echo "  3. Push to GitHub: git add -A && git commit -m 'deploy: contract live on devnet' && git push"
echo "  4. Add Explorer link to HACKATHON_SUBMISSION.md"
