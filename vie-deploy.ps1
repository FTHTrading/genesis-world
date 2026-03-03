#!/usr/bin/env pwsh
<#
.SYNOPSIS
  GSP Visual Identity Engine — Full Deployment Pipeline
  Run this from the repo root: .\vie-deploy.ps1

.DESCRIPTION
  Automates the complete VIE launch sequence:
    1. Compiles all 48 Solidity contracts
    2. Generates OpenSea-format metadata for all 15 agents
    3. Pins metadata to IPFS via Pinata
    4. Deploys AgentIdentityNFT.sol to Polygon mainnet
    5. Mints all 15 soul-bound Genesis Agent NFTs

  Prerequisites:
    - contracts-evm/.env must exist with all 5 values filled in
    - ~3 MATIC in deployer wallet for gas
    - Valid PINATA_JWT in .env

.EXAMPLE
  .\vie-deploy.ps1              # Full pipeline
  .\vie-deploy.ps1 -SkipIPFS   # Skip IPFS upload (use existing _ipfs_cids.json)
  .\vie-deploy.ps1 -Only mint  # Only run the mint step
#>

param(
    [switch]$SkipIPFS,
    [ValidateSet("all","compile","generate","upload","mint")]
    [string]$Only = "all"
)

$ErrorActionPreference = "Stop"
$contractsDir = Join-Path $PSScriptRoot "contracts-evm"

# ── Banner ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   GSP VISUAL IDENTITY ENGINE — DEPLOY PIPELINE  ║" -ForegroundColor Cyan
Write-Host "║          Genesis Sentience Protocol v0.1         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Validate .env ─────────────────────────────────────────────────────────────
$envPath = Join-Path $contractsDir ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "  ERROR: .env not found at $envPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Run:" -ForegroundColor Yellow
    Write-Host "    Copy-Item contracts-evm\.env.example contracts-evm\.env" -ForegroundColor Yellow
    Write-Host "  Then fill in DEPLOYER_PRIVATE_KEY, POLYGON_RPC_URL," -ForegroundColor Yellow
    Write-Host "  POLYGONSCAN_API_KEY, OWNER_ADDRESS, PINATA_JWT" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check required keys
$required = @("DEPLOYER_PRIVATE_KEY", "POLYGON_RPC_URL", "POLYGONSCAN_API_KEY", "OWNER_ADDRESS", "PINATA_JWT")
$envContent = Get-Content $envPath -Raw
$missing = @()
foreach ($key in $required) {
    if ($envContent -notmatch "$key=.+") { $missing += $key }
}
if ($missing.Count -gt 0) {
    Write-Host "  ERROR: Missing .env values: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ .env validated" -ForegroundColor Green

# ── Helper ────────────────────────────────────────────────────────────────────
function Step {
    param([string]$label, [string]$cmd)
    Write-Host ""
    Write-Host "  ┌─ $label" -ForegroundColor Cyan
    Push-Location $contractsDir
    try {
        Invoke-Expression $cmd
        if ($LASTEXITCODE -ne 0) { throw "Command failed: $cmd" }
    } finally {
        Pop-Location
    }
    Write-Host "  └─ Done." -ForegroundColor Green
}

# ── Pipeline ──────────────────────────────────────────────────────────────────
if ($Only -eq "all" -or $Only -eq "compile") {
    Step "COMPILE — verifying 48 contracts" "npx hardhat compile"
}

if ($Only -eq "all" -or $Only -eq "generate") {
    Step "GENERATE — producing 15 OpenSea metadata files" "npx ts-node scripts/vie/generate_metadata.ts"
}

if ((-not $SkipIPFS) -and ($Only -eq "all" -or $Only -eq "upload")) {
    Step "UPLOAD — pinning metadata to IPFS via Pinata" "npx ts-node scripts/vie/upload_to_ipfs.ts"
} elseif ($SkipIPFS) {
    $cidPath = Join-Path $contractsDir "metadata\_ipfs_cids.json"
    if (-not (Test-Path $cidPath)) {
        Write-Host "  ERROR: -SkipIPFS set but metadata\_ipfs_cids.json not found." -ForegroundColor Red
        exit 1
    }
    Write-Host "  ⏭  Skipping IPFS upload (using existing _ipfs_cids.json)" -ForegroundColor Yellow
}

if ($Only -eq "all" -or $Only -eq "mint") {
    Step "DEPLOY + MINT — AgentIdentityNFT.sol → Polygon mainnet" `
         "npx hardhat run scripts/deploy/04_deploy_nft.ts --network polygon"
}

# ── Summary ───────────────────────────────────────────────────────────────────
$nftDeployment = Join-Path $contractsDir "deployments\polygon\nft.json"
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           VIE PIPELINE COMPLETE                  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════╝" -ForegroundColor Green

if (Test-Path $nftDeployment) {
    $dep = Get-Content $nftDeployment | ConvertFrom-Json
    $addr = $dep.contracts.AgentIdentityNFT
    Write-Host ""
    Write-Host "  Contract : $addr" -ForegroundColor White
    Write-Host "  OpenSea  : https://opensea.io/collection/gsp-agent-identity" -ForegroundColor Cyan
    Write-Host "  Polygon  : https://polygonscan.com/address/$addr" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Update NFT gallery contract address:" -ForegroundColor Yellow
    Write-Host "  drunks-app/src/app/nft-gallery/page.tsx" -ForegroundColor Yellow
    Write-Host "  Replace: 0x0000000000000000000000000000000000000000" -ForegroundColor Yellow
    Write-Host "  With   : $addr" -ForegroundColor Yellow
}

Write-Host ""
