# Treasury Agent - Devnet Deploy
# Usage: .\deploy.ps1 [-SkipBuild] [-SkipAirdrop]
param([switch]$SkipBuild, [switch]$SkipAirdrop)
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Treasury Agent: Devnet Deploy ===" -ForegroundColor Cyan
Write-Host ""

foreach ($cmd in @("anchor","solana","cargo")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: $cmd not found." -ForegroundColor Red
        exit 1
    }
}

solana config set --url devnet | Out-Null
$wallet  = (solana address).Trim()
$balance = (solana balance).Trim()
Write-Host "Wallet:  $wallet"
Write-Host "Balance: $balance"

if (-not $SkipAirdrop) {
    $lamStr = (solana balance --lamports 2>$null).Trim() -replace "[^0-9]",""
    $lam = 0
    if ($lamStr -ne "") { $lam = [long]$lamStr }
    if ($lam -lt 2000000000) {
        Write-Host "Low balance, requesting airdrop..." -ForegroundColor Yellow
        try {
            solana airdrop 2
            Start-Sleep -Seconds 5
            Write-Host "New balance: $(solana balance)"
        } catch {
            Write-Host "Airdrop failed. Get SOL from:" -ForegroundColor Yellow
            Write-Host "  https://faucet.solana.com" -ForegroundColor Cyan
            Write-Host "  Wallet: $wallet" -ForegroundColor Green
            Read-Host "Press Enter when funded"
        }
    }
}

if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "Building..." -ForegroundColor Cyan
    anchor build
}

$kp = "target\deploy\treasury_vault-keypair.json"
if (-not (Test-Path $kp)) {
    Write-Host "ERROR: keypair not found. Run anchor build first." -ForegroundColor Red
    exit 1
}
$programId = (solana address -k $kp).Trim()
Write-Host "Program ID: $programId" -ForegroundColor Green

$toml = Get-Content "Anchor.toml" -Raw
$toml = $toml -replace "7d722pJ46zJJN1GdzY8E44QQosmZUvkBFdnhhKUreTJ3", $programId
Set-Content "Anchor.toml" $toml

Write-Host ""
Write-Host "Deploying..." -ForegroundColor Cyan
anchor deploy

$explorer = "https://explorer.solana.com/address/" + $programId + "?cluster=devnet"

Write-Host ""
Write-Host "=== Deploy Complete ===" -ForegroundColor Green
Write-Host "Program ID : $programId" -ForegroundColor Green
Write-Host "Explorer   : $explorer" -ForegroundColor Cyan

$fe = "..\treasury-visualizer\src\components\LiveDashboard.jsx"
if (Test-Path $fe) {
    $src = Get-Content $fe -Raw
    if ($src -match "const PROGRAM_ID") {
        $src = $src -replace "const PROGRAM_ID = '.*?'", ("const PROGRAM_ID = '" + $programId + "'")
    } else {
        $src = $src -replace "(const DEVNET_RPC.*)`r?`n", ('$1' + "`r`n" + "const PROGRAM_ID = '" + $programId + "';`r`n")
    }
    Set-Content $fe $src
    Write-Host "Updated LiveDashboard.jsx" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. cd ..\treasury-visualizer"
Write-Host "     npm run build"
Write-Host "  2. Copy dist\ to gh-pages and push"
Write-Host "  3. Add Explorer URL to HACKATHON_SUBMISSION.md"
Write-Host ""

$yn = Read-Host "Open Explorer in browser? (y/n)"
if ($yn -eq "y") { Start-Process $explorer }
