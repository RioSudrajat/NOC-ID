#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-/mnt/d/Projekan/Web3/NOC-ID}"

cd "$REPO_DIR/programs/noc_registry"
export NO_DNA=1

echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"
echo "Anchor: $(anchor --version)"

anchor build
