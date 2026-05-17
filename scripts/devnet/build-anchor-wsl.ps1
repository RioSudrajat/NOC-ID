$ErrorActionPreference = "Stop"

$repo = (Resolve-Path "$PSScriptRoot\..\..").Path
$repoWsl = $repo -replace "\\", "/"
$repoWsl = $repoWsl -replace "^([A-Za-z]):", { "/mnt/" + $args[0].Groups[1].Value.ToLower() }

Write-Host "Checking WSL distros..."
wsl.exe -l -v

Write-Host "Building Anchor program from WSL path: $repoWsl"
wsl.exe -- bash -lc "set -euo pipefail; cd '$repoWsl/programs/noc_registry'; export NO_DNA=1; which rustc; rustc --version; which cargo; cargo --version; which anchor; anchor --version; anchor build"
