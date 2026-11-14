#!/usr/bin/env bash
# Step 3 — transfer the Passport, then prove old owner login fails and new owner login works.
#
# Uses scripts/idcp-wallet.sh (or IDCP_WALLET) for the on-chain rodit_transfer.
# Does not move any token unless you pass --execute with real account ids.
#
# Usage (dry-run docs only):
#   ./examples/transfer-proof.sh
#
# Usage (you supply two funded accounts + a token you own):
#   export BLOCKCHAIN_ENV=mainnet
#   export NEAR_NETWORK_CONFIG=mainnet-fastnear
#   ./examples/transfer-proof.sh --execute \
#     --from <current-owner-implicit-or-named> \
#     --to <new-owner-implicit-or-named> \
#     --token <token_id>
#
# After --execute, point NEAR_CREDENTIALS_FILE_PATH at each account's key file and run:
#   node examples/native-login-probe.js
# Expect: --from fails (no longer owner); --to succeeds.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WALLET="${IDCP_WALLET:-$ROOT/scripts/idcp-wallet.sh}"
CONTRACT="${RODITCONTRACTID:-genaaaa-identyclaw-com.near}"

FROM=""
TO=""
TOKEN=""
EXECUTE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) EXECUTE=1; shift ;;
    --from) FROM="${2:-}"; shift 2 ;;
    --to) TO="${2:-}"; shift 2 ;;
    --token) TOKEN="${2:-}"; shift 2 ;;
    -h|--help)
      sed -n '2,25p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

echo "Contract: $CONTRACT"
echo "Wallet:   $WALLET"
echo

if [[ ! -x "$WALLET" && ! -f "$WALLET" ]]; then
  echo "idcp-wallet.sh not found at $WALLET"
  echo "Expected scripts/idcp-wallet.sh in this repo, or set IDCP_WALLET."
  exit 1
fi

cat <<EOF
Do → See (transfer proof)
-------------------------
Contract: $CONTRACT (scripts/idcp-wallet.sh default)

1. Login as current owner (examples/native-login-probe.js) → JWT + 200 on /api/me/identity.
2. Transfer with wallet script (0.01 NEAR deposit):
     ./scripts/idcp-wallet.sh <from> <to> <token_id>
   or:
     near call $CONTRACT rodit_transfer \\
       '{"receiver_id":"<to>","token_id":"<token_id>","memo":null}' \\
       --accountId <from> --amount 0.01
3. near view … rodit_token → owner_id is <to>.
4. Login again with <from> credentials → rejected (no longer on-chain owner).
5. Login with <to> credentials → JWT accepted (rights followed the NFT).

Recorded run: docs/TRANSFER-TEST-REPORT.md · hashes: docs/ONCHAIN.md
EOF

if [[ "$EXECUTE" -ne 1 ]]; then
  echo
  echo "Dry-run only. Pass --execute --from … --to … --token … to call rodit_transfer."
  exit 0
fi

if [[ -z "$FROM" || -z "$TO" || -z "$TOKEN" ]]; then
  echo "--execute requires --from, --to, and --token" >&2
  exit 1
fi

export BLOCKCHAIN_ENV="${BLOCKCHAIN_ENV:-mainnet}"
export RODITCONTRACTID="$CONTRACT"
export NEAR_NETWORK_CONFIG="${NEAR_NETWORK_CONFIG:-mainnet-fastnear}"

echo "Executing: $WALLET $FROM $TO $TOKEN"
bash "$WALLET" "$FROM" "$TO" "$TOKEN"

echo
echo "Verify owner:"
near contract call-function as-read-only "$CONTRACT" rodit_token \
  json-args "{\"token_id\":\"$TOKEN\"}" \
  network-config "$NEAR_NETWORK_CONFIG" now
