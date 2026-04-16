# Treasury Agent — devnet deploy (PowerShell)
# Run: .\deploy.ps1  from the contracts\ folder
param(
    [switch]$SkipBuild,
    [switch]$SkipAirdrop
)
$ErrorActionPreference = "Stop"

Write-Host "`n=== Treasury Agent: Devnet Deploy ===" -ForegroundColor Cyan

foreach ($cmd in @("anchor","solana","cargo")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: '$cmd' not found. Run .\install-prereqs.ps1 first." -ForegroundColor Red; exit 1
    }
}

solana config set --url devnet | Out-Null
$wallet  = (solana address).Trim()
$balance = (solana balance).Trim()
Write-Host "Wallet:  $wallet"
Write-Host "Balance: $balance"

if (-not $SkipAirdrop) {
    $lamStr = (solana balance --lamports 2>$null).Trim() -replace "[^0-9]",""
    $lam = if ($lamStr) { [long]$lamStr } else { 0 }
    if ($lam -lt 2000000000) {
        Write-Host "Low balance — trying airdrop (may be rate-limited)..." -ForegroundColor Yellow
        try {
            solana airdrop 2
            Start-Sleep -Seconds 5
            Write-Host "New balance: $(solana balance)"
        } catch {
            Write-Host "Airdrop failed. Use a faucet instead:" -ForegroundColor Yellow
            Write-Host "  https://faucet.solana.com  or  https://solfaucet.com" -ForegroundColor Cyan
            Write-Host "Paste your wallet: $wallet" -ForegroundColor Green
            $cont = Read-Host "Press Enter when you have SOL, or type 'skip' to continue anyway"
        }
    }
}

if (-not $SkipBuild) {
    Write-Host "`nBuilding..." -ForegroundColor Cyan
    anchor build
}

$keypairPath = "target\deploy\treasury_vault-keypair.json"
if (-not (Test-Path $keypairPath)) {
    Write-Host "ERROR: $keypairPath not found. Run 'anchor build' first." -ForegroundColor Red; exit 1
}
$programId = (solana address -k $keypairPath).Trim()
Write-Host "Program ID: $programId" -ForegroundColor Green

(Get-Content "Anchor.toml" -Raw) -replace "TVau1tProgramID11111111111111111111111111", $programId |
    Set-Content "Anchor.toml"

Write-Host "`nDeploying..." -ForegroundColor Cyan
anchor deploy

$explorerUrl = "https://explorer.solana.com/address/$programId`?cluster=devnet"
Write-Host "`n=== Deploy Complete ===" -ForegroundColor Green
Write-Host "Program ID:   $programId" -ForegroundColor Green
Write-Host "Explorer:     $explorerUrl" -ForegroundColor Cyan

# Update frontend
$fe = "..\treasury-visualizer\src\components\LiveDashboard.jsx"
if (Test-Path $fe) {
    (Get-Content $fe -Raw) -replace "const PROGRAM_ID = '.*?'", "const PROGRAM_ID = '$programId'" |
        Set-Content $fe
    # If placeholder not there yet, insert after DEVNET_RPC line
    $content = Get-Content $fe -Raw
    if ($content -notmatch "const PROGRAM_ID") {
        $content = $content -replace "(const DEVNET_RPC.*\n)", "`$1const PROGRAM_ID = '$programId';`n"
        Set-Content $fe $content
    }
    Write-Host "LiveDashboard.jsx updated." -ForegroundColor Green
}

Write-Host "`nNext steps:"
Write-Host "  cd ..\treasury-visualizer && npm run build"
Write-Host "  cd ..\..\hproj_clone && git add -A && git commit -m 'deploy: contract live on devnet' && git push"
Write-Host "  Add Explorer URL to HACKATHON_SUBMISSION.md"

$open = Read-Host "`nOpen Explorer in browser? (y/n)"
if ($open -eq "y" -or $open -eq "Y") { Start-Process $explorerUrl }
