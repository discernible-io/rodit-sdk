# @rodit/verify-hola

**Version:** 0.1.7 · Depends on `@rodit/rodit-auth-be` **10.0.3** for `--rpc` chain reads. · **License:** AGPL-3.0-only

Part of the [Discernible IO SDK monorepo](../README.md).

Verify-before-execute tooling for IdentyClaw HOLA lines.

For NEAR account enrollment, see [gennearaccount](https://github.com/discernible-io/gennearaccount). For in-gateway HOLA tools, see [openclaw-identyclaw-plugin](https://github.com/discernible-io/openclaw-identyclaw-plugin).

## Recommended: direct NEAR RPC (`--rpc`)

No IdentyClaw API in the verify path — your machine reads chain state via FastNear (or any NEAR RPC). RPC POSTs use rodit-auth-be deadlines (`NEAR_RPC_TIMEOUT`, default 5000 ms) and at most one logged alternate when the primary fails.

```bash
export NEAR_RPC_URL="https://rpc.mainnet.fastnear.com"
export NEAR_CONTRACT_ID="genaaaa-identyclaw-com.near"
# optional: export NEAR_RPC_TIMEOUT=5000

npx @rodit/verify-hola report "HOLA/MUNDO/..." --rpc \
  --canonical-peer <lemuel-gulliver-lobby-tokenId>
```

From this monorepo (no npm publish required):

```bash
export NEAR_RPC_URL="https://rpc.mainnet.fastnear.com"
export NEAR_CONTRACT_ID="genaaaa-identyclaw-com.near"
node bin/verify-hola.js report "HOLA/..." --rpc \
  --canonical-peer <lemuel-gulliver-lobby-tokenId>
```

Stdin (HOLA on `-`):

```bash
echo "HOLA/..." | npx @rodit/verify-hola report - --rpc
```

## Alternative: IdentyClaw API path

JWT is optional — `POST /api/identity/verify` is public. Outbound HTTP uses a deadline (`IDENTYCLAW_HTTP_TIMEOUT` or `NEAR_RPC_TIMEOUT`, default **15000** ms).

```bash
npx @rodit/verify-hola report "HOLA/MUNDO/..."
```

## Commands

| Command | Description |
| --- | --- |
| `verify-hola verify "HOLA/..." [--rpc]` | Cryptographic verify only (JSON). Exit `0` if `verified`. |
| `verify-hola report "HOLA/..." [--rpc]` | Verify + passport profile (`includeProfile` on API; on-chain DN on `--rpc`) |
| `verify-hola report - [--rpc]` | Same as `report`, HOLA read from stdin |

### Flags

| Flag | Applies to | Notes |
| --- | --- | --- |
| `--rpc` | `verify`, `report` | Direct NEAR RPC via `@rodit/rodit-auth-be` (no IdentyClaw API) |
| `--canonical-peer <tokenId>` | **`report` only** | Impersonation guard (also `IDENTYCLAW_CANONICAL_PEER_ID`). Ignored by bare `verify`. |
| `--expected-recipient <tokenId>` | `verify` / `report` (API path) | Also `IDENTYCLAW_EXPECTED_RECIPIENT`. Not applied on the RPC verify path. |
| `--base-url <url>` | API path | Overrides `IDENTYCLAW_BASE_URL` |
| `--near-rpc-url <url>` | `--rpc` | Overrides `NEAR_RPC_URL` for this run |
| `--near-contract-id <id>` | `--rpc` | Overrides `NEAR_CONTRACT_ID` for this run |

## Environment

| Variable | `--rpc` | API (default) |
| --- | --- | --- |
| `NEAR_RPC_URL` | **Required** (unless `--near-rpc-url`) | — |
| `NEAR_CONTRACT_ID` | **Required** (unless `--near-contract-id`) | — |
| `NEAR_RPC_TIMEOUT` | optional (ms; auth-be default 5000) | also used as HTTP deadline fallback |
| `IDENTYCLAW_HTTP_TIMEOUT` | — | optional HTTP deadline (ms; default 15000) |
| `IDENTYCLAW_BASE_URL` | — | default `https://api.identyclaw.com` |
| `IDENTYCLAW_JWT` | — | optional |
| `IDENTYCLAW_CANONICAL_PEER_ID` | **`report` only** (impersonation guard) | **`report` only** |
| `IDENTYCLAW_EXPECTED_RECIPIENT` | — (not used on RPC verify) | optional |

## Concierge demo (Lemuel Gulliver)

1. Message **Lemuel Gulliver** via A2A at [identyclaw-concierge.identyclaw.com:7443](https://identyclaw-concierge.identyclaw.com:7443) (or email / Discord / Telegram) and ask for a HOLA.
2. Verify with RPC (recommended) using **`report`** so the canonical-peer guard applies:

```bash
export NEAR_RPC_URL="https://rpc.mainnet.fastnear.com"
export NEAR_CONTRACT_ID="genaaaa-identyclaw-com.near"
export IDENTYCLAW_CANONICAL_PEER_ID="<lobby-tokenId-from-agent-card>"
npx @rodit/verify-hola report "HOLA/..." --rpc
```

Registry: [com.identyclaw.lemuel_gulliver](https://www.a2a-registry.org/agent/com.identyclaw.lemuel_gulliver)

Web UI (API path): https://verify.identyclaw.com

## API

Package `main` is `lib/report.js` (`buildHolaReport`, `verifyHola`). Deep import for RPC (package ships `lib/`; not a formal `exports` map entry):

```javascript
const { buildHolaReportViaRpc } = require("@rodit/verify-hola/lib/verify-rpc");

const report = await buildHolaReportViaRpc(hola, {
  nearRpcUrl: process.env.NEAR_RPC_URL,
  nearContractId: process.env.NEAR_CONTRACT_ID,
  canonicalPeerId: "abcdefghijkl"
});
```

## Related

- IdentyClaw API verify: `POST /api/identity/verify` on [api.identyclaw.com](https://api.identyclaw.com)
- MCP discovery: [api.identyclaw.com/.well-known/mcp](https://api.identyclaw.com/.well-known/mcp)

---

[discernible.io](https://www.discernible.io) · [identyclaw-agents](https://github.com/discernible-io/identyclaw-agents) · [discernible-io](https://github.com/discernible-io)
