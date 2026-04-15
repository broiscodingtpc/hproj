# ============================================================
# Treasury Agent — one-command devnet deploy (PowerShell)
# Run: .\deploy.ps1  from the contracts\ folder
# Requires: Anchor CLI, Solana CLI, Rust (see prereqs below)
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "━━━ Treasury Agent — Devnet Deploy ━━━" -ForegroundColor Cyan
Write-Host ""

# ── Check prerequisites ───────────────────────────────────────
foreach ($cmd in @("anchor", "solana", "cargo")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: '$cmd' not found." -ForegroundColor Red
        switch ($cmd) {
            "solana" { Write-Host "Install: https://docs.solana.com/cli/install-solana-cli-tools" }
            "anchor"  { Write-Host "Install: cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked" }
            "cargo"   { Write-Host "Install Rust: https://rustup.rs" }
        }
        exit 1
    }
}
Write-Host "Prerequisites OK" -ForegroundColor Green

# ── Set devnet ────────────────────────────────────────────────
Write-Host ""
Write-Host "Setting network to devnet..."
solana config set --url devnet | Out-Null

$wallet = (solana address).Trim()
$balance = (solana balance).Trim()
Write-Host "Wallet:  $wallet"
Write-Host "Balance: $balance"

# ── Airdrop if low ────────────────────────────────────────────
$lamports = solana balance --lamports 2>$null
if ($lamports -match "(\d+)") {
    $l = [long]$Matches[1]
    if ($l -lt 2000000000) {
        Write-Host "Balance low — requesting airdrop..." -ForegroundColor Yellow
        solana airdrop 2
        Start-Sleep -Seconds 5
        Write-Host "New balance: $(solana balance)"
    }
}

# ── Build ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "Building Anchor program..." -ForegroundColor Cyan
anchor build
Write-Host "Build complete." -ForegroundColor Green

# ── Get program ID ────────────────────────────────────────────
$keypairPath = "target\deploy\treasury_vault-keypair.json"
if (-not (Test-Path $keypairPath)) {
    Write-Host "ERROR: keypair not found at $keypairPath" -ForegroundColor Red
    exit 1
}
$programId = (solana address -k $keypairPath).Trim()
Write-Host "Program ID: $programId" -ForegroundColor Green

# ── Update Anchor.toml ────────────────────────────────────────
Write-Host ""
Write-Host "Updating Anchor.toml..."
$anchorToml = Get-Content "Anchor.toml" -Raw
$anchorToml = $anchorToml -replace "TVau1tProgramID11111111111111111111111111", $programId
Set-Content "Anchor.toml" $anchorToml
Write-Host "Anchor.toml updated." -ForegroundColor Green

# ── Deploy ────────────────────────────────────────────────────
Write-Host ""
Write-Host "Deploying to devnet..." -ForegroundColor Cyan
anchor deploy
Write-Host "Deploy complete!" -ForegroundColor Green

# ── Update frontend ───────────────────────────────────────────
$frontendPath = "..\treasury-visualizer\src\components\LiveDashboard.jsx"
if (Test-Path $frontendPath) {
    Write-Host ""
    Write-Host "Updating LiveDashboard.jsx with program ID..."
    $content = Get-Content $frontendPath -Raw
    # Insert program ID constant after the imports
    if ($content -notmatch "const PROGRAM_ID") {
        $content = $content -replace "(const DEVNET_RPC.*)", "`$1`nconst PROGRAM_ID = '$programId';"
        Set-Content $frontendPath $content
        Write-Host "LiveDashboard.jsx updated." -ForegroundColor Green
    }
}

# ── Update backend .env ───────────────────────────────────────
$backendEnv = "..\backend\.env"
if (Test-Path $backendEnv) {
    $envContent = Get-Content $backendEnv -Raw
    $envContent = $envContent -replace "SOLANA_PROGRAM_ID=.*", "SOLANA_PROGRAM_ID=$programId"
    Set-Content $backendEnv $envContent
    Write-Host "backend/.env updated." -ForegroundColor Green
}

# ── Print results ─────────────────────────────────────────────
Write-Host ""
Write-Host "━━━ Deploy Complete ━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Program ID:   $programId" -ForegroundColor Green
Write-Host "Explorer URL: https://explorer.solana.com/address/$programId`?cluster=devnet" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Rebuild frontend:"
Write-Host "       cd ..\treasury-visualizer"
Write-Host "       npm run build"
Write-Host ""
Write-Host "  2. Push to GitHub:"
Write-Host "       cd ..\.."
Write-Host "       git add -A"
Write-Host "       git commit -m 'deploy: contract live on devnet'"
Write-Host "       git push"
Write-Host ""
Write-Host "  3. Add Explorer URL to HACKATHON_SUBMISSION.md"
Write-Host ""
Write-Host "  4. Add Explorer URL to README.md"
Write-Host ""

# ── Open Explorer in browser ──────────────────────────────────
$explorerUrl = "https://explorer.solana.com/address/$programId`?cluster=devnet"
$open = Read-Host "Open Explorer in browser? (y/n)"
if ($open -eq "y" -or $open -eq "Y") {
    Start-Process $explorerUrl
}
