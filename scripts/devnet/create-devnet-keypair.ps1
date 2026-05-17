param(
  [string]$Outfile = "C:\tmp\noc-keys\noc-devnet-deployer.json"
)

$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $Outfile
$leaf = Split-Path -Leaf $Outfile
New-Item -ItemType Directory -Force $dir | Out-Null

docker run --rm `
  -v "${dir}:/keys" `
  noc-id-anchor:0.31.1 `
  solana-keygen new --no-bip39-passphrase --outfile "/keys/$leaf"

docker run --rm `
  -v "${dir}:/keys" `
  noc-id-anchor:0.31.1 `
  solana address -k "/keys/$leaf"

Write-Host ""
Write-Host "Set this in backend/.env or PowerShell before devnet operator scripts:"
Write-Host "DEVNET_KEYPAIR_PATH=$Outfile"
