# ============================================================
# Treasury Agent — Install prerequisites on Windows
# Run as Administrator in PowerShell
# ============================================================

Write-Host "━━━ Installing Solana/Anchor Prerequisites ━━━" -ForegroundColor Cyan
Write-Host ""

# ── 1. Rust ───────────────────────────────────────────────────
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Rust..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "$env:TEMP\rustup-init.exe"
    Start-Process "$env:TEMP\rustup-init.exe" -ArgumentList "-y" -Wait
    # Reload PATH
    $env:PATH += ";$env:USERPROFILE\.cargo\bin"
    Write-Host "Rust installed." -ForegroundColor Green
} else {
    Write-Host "Rust already installed: $(cargo --version)" -ForegroundColor Green
}

# ── 2. Solana CLI ─────────────────────────────────────────────
if (-not (Get-Command solana -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Solana CLI..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-install.exe"
    Start-Process "$env:TEMP\solana-install.exe" -ArgumentList "v1.18.26" -Wait
    $env:PATH += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
    Write-Host "Solana CLI installed." -ForegroundColor Green
} else {
    Write-Host "Solana CLI already installed: $(solana --version)" -ForegroundColor Green
}

# ── 3. Anchor CLI ─────────────────────────────────────────────
if (-not (Get-Command anchor -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Anchor CLI (this takes 5-10 mins)..." -ForegroundColor Yellow
    cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
    Write-Host "Anchor installed." -ForegroundColor Green
} else {
    Write-Host "Anchor already installed: $(anchor --version)" -ForegroundColor Green
}

# ── 4. Create & fund devnet keypair ──────────────────────────
Write-Host ""
Write-Host "Setting up devnet keypair..." -ForegroundColor Cyan
solana config set --url devnet | Out-Null

if (-not (Test-Path "$env:USERPROFILE\.config\solana\id.json")) {
    solana-keygen new --outfile "$env:USERPROFILE\.config\solana\id.json" --no-bip39-passphrase
}

$wallet = (solana address).Trim()
Write-Host "Wallet: $wallet"
Write-Host "Requesting devnet SOL airdrop..."
solana airdrop 2
Start-Sleep -Seconds 3
Write-Host "Balance: $(solana balance)"

Write-Host ""
Write-Host "━━━ All prerequisites installed! ━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: .\deploy.ps1" -ForegroundColor Cyan
