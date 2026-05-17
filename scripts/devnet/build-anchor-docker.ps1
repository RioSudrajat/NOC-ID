$ErrorActionPreference = "Stop"

$repo = (Resolve-Path "$PSScriptRoot\..\..").Path
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

Write-Host "Running Anchor build in Docker..."
Invoke-Docker run --rm `
  -e NO_DNA=1 `
  -v "${repo}:/workspace" `
  -v "${cargoRegistryVolume}:/usr/local/cargo/registry" `
  -v "${cargoGitVolume}:/usr/local/cargo/git" `
  -v "${solanaCacheVolume}:/root/.cache/solana" `
  -w /workspace/programs/noc_registry `
  $image `
  bash /workspace/scripts/devnet/docker-anchor-build.sh
