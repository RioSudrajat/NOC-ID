param(
  [string]$Cluster = "devnet",
  [string]$Keypair = $env:DEVNET_KEYPAIR_PATH,
  [int]$MaxSignAttempts = 20,
  [int]$ComputeUnitPrice = 1000
)

$ErrorActionPreference = "Stop"
$env:NO_DNA = "1"

$repo = (Resolve-Path "$PSScriptRoot\..\..").Path

if (-not $Keypair) {
  $envFile = "$repo\backend\.env"
  if (Test-Path $envFile) {
    $keypairLine = Get-Content $envFile | Where-Object { $_ -match '^DEVNET_KEYPAIR_PATH=' } | Select-Object -First 1
    if ($keypairLine) {
      $Keypair = ($keypairLine -replace '^DEVNET_KEYPAIR_PATH=', '').Trim('"')
    }
  }
}

if (-not $Keypair) {
  throw "Missing DEVNET_KEYPAIR_PATH or -Keypair. Example: npm run devnet:deploy-program -- -Keypair C:\tmp\noc-keys\noc-devnet-deployer.json"
}

$keypairPath = (Resolve-Path $Keypair).Path
$keypairDir = Split-Path $keypairPath -Parent
$keypairFile = Split-Path $keypairPath -Leaf
$image = "noc-id-anchor:0.31.1"
$cargoRegistryVolume = "noc-id-cargo-registry"
$cargoGitVolume = "noc-id-cargo-git"
$solanaCacheVolume = "noc-id-solana-cache"

function Invoke-Docker {
  $DockerArgs = $args
  & docker @DockerArgs
  if ($LASTEXITCODE -ne 0) {
    throw "docker $($DockerArgs -join ' ') failed with exit code $LASTEXITCODE"
  }
}

$imageExists = $null
try {
  $imageExists = docker image inspect $image --format "{{.Id}}"
  if ($LASTEXITCODE -ne 0) { $imageExists = $null }
} catch {
  $imageExists = $null
}

if (-not $imageExists -or $env:FORCE_ANCHOR_DOCKER_BUILD -eq "1") {
  Write-Host "Building Anchor Docker image: $image"
  Invoke-Docker build `
    -f "$repo\infra\anchor.Dockerfile" `
    -t $image `
    "$repo"
} else {
  Write-Host "Using existing Anchor Docker image: $image"
}

Invoke-Docker volume create $cargoRegistryVolume | Out-Null
Invoke-Docker volume create $cargoGitVolume | Out-Null
Invoke-Docker volume create $solanaCacheVolume | Out-Null

Write-Host "Deploying NOC Registry program to $Cluster with wallet $keypairPath"
Invoke-Docker run --rm `
  -e NO_DNA=1 `
  -e DEPLOY_MAX_SIGN_ATTEMPTS=$MaxSignAttempts `
  -e DEPLOY_COMPUTE_UNIT_PRICE=$ComputeUnitPrice `
  -v "${repo}:/workspace" `
  -v "${keypairDir}:/keys:ro" `
  -v "${cargoRegistryVolume}:/usr/local/cargo/registry" `
  -v "${cargoGitVolume}:/usr/local/cargo/git" `
  -v "${solanaCacheVolume}:/root/.cache/solana" `
  -w /workspace/programs/noc_registry `
  $image `
  bash /workspace/scripts/devnet/docker-anchor-deploy.sh $Cluster "/keys/$keypairFile"
