#!/usr/bin/env bash
set -euo pipefail

CLUSTER="${1:-devnet}"
WALLET="${2:?wallet keypair path is required}"

export PATH="/usr/local/cargo/bin:/root/.local/share/solana/install/active_release/bin:${PATH}"
export NO_DNA=1

rustc --version
cargo --version
solana --version
anchor --version

cd /workspace/programs/noc_registry

if [[ ! -f target/deploy/noc_registry.so ]]; then
  echo "Missing target/deploy/noc_registry.so. Run npm run anchor:build before deploy." >&2
  exit 1
fi

if [[ ! -f target/deploy/noc_registry-keypair.json ]]; then
  echo "Missing target/deploy/noc_registry-keypair.json. Run npm run anchor:build before deploy." >&2
  exit 1
fi

PROGRAM_ID="$(solana-keygen pubkey target/deploy/noc_registry-keypair.json)"
DECLARED_ID="$(grep -E 'declare_id!\("' programs/noc_registry/src/lib.rs | sed -E 's/.*declare_id!\("([^"]+)".*/\1/')"
BUFFER_KEYPAIR="target/deploy/noc_registry-buffer-keypair.json"
MAX_SIGN_ATTEMPTS="${DEPLOY_MAX_SIGN_ATTEMPTS:-20}"
COMPUTE_UNIT_PRICE="${DEPLOY_COMPUTE_UNIT_PRICE:-1000}"

if [[ "$PROGRAM_ID" != "$DECLARED_ID" ]]; then
  echo "Program keypair pubkey ($PROGRAM_ID) does not match declare_id! ($DECLARED_ID)." >&2
  echo "Run anchor keys sync or update declare_id!/Anchor.toml, then rebuild." >&2
  exit 1
fi

solana config set --url "$CLUSTER" --keypair "$WALLET"
echo "Program ID: $PROGRAM_ID"
echo "Deploy wallet: $(solana-keygen pubkey "$WALLET")"
solana balance "$WALLET" --url "$CLUSTER"

if [[ ! -f "$BUFFER_KEYPAIR" ]]; then
  solana-keygen new --no-bip39-passphrase --silent --force -o "$BUFFER_KEYPAIR"
fi

echo "Buffer account: $(solana-keygen pubkey "$BUFFER_KEYPAIR")"
solana program deploy \
  target/deploy/noc_registry.so \
  --program-id target/deploy/noc_registry-keypair.json \
  --buffer "$BUFFER_KEYPAIR" \
  --upgrade-authority "$WALLET" \
  --keypair "$WALLET" \
  --fee-payer "$WALLET" \
  --url "$CLUSTER" \
  --use-rpc \
  --max-sign-attempts "$MAX_SIGN_ATTEMPTS" \
  --with-compute-unit-price "$COMPUTE_UNIT_PRICE" \
  --verbose

solana program show "$PROGRAM_ID" --url "$CLUSTER"
