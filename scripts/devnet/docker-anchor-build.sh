#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"
export NO_DNA=1
export RUSTUP_HOME="/usr/local/rustup"
export CARGO_REGISTRIES_CRATES_IO_PROTOCOL="sparse"

rustc --version
cargo --version
solana --version
anchor --version

rm -rf /tmp/noc-anchor-build
mkdir -p /tmp/noc-anchor-build/programs
cp -R /workspace/programs/noc_registry /tmp/noc-anchor-build/programs/noc_registry

cd /tmp/noc-anchor-build/programs/noc_registry
cargo fetch
anchor build
mkdir -p /workspace/idl
cp target/idl/noc_registry.json /workspace/idl/noc_registry.json
rm -rf /workspace/programs/noc_registry/target
cp -R target /workspace/programs/noc_registry/target
