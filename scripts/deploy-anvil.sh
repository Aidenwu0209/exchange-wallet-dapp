#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -z "${DEPLOYER_PRIVATE_KEY:-}" ]]; then
  echo "DEPLOYER_PRIVATE_KEY is required. Use an Anvil test private key only." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/contracts/deployments"
cd "$ROOT_DIR/contracts"

DEPLOY_NETWORK="${DEPLOY_NETWORK:-anvil}" \
DEPLOYMENT_FILE="${DEPLOYMENT_FILE:-./deployments/anvil.json}" \
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url "${RPC_URL:-http://127.0.0.1:8545}" \
  --broadcast
