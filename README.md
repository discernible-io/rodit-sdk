# RODiT SDK monorepo

Source for the npm packages that power [**RODiT**](https://www.discernible.io)-based APIs: blockchain-verified identity, mutual authentication, JWT sessions, route permissions, webhooks, and federated login across sibling APIs in the same token family.

| Package | Directory | Version | Role |
|---------|-----------|---------|------|
| [@rodit/rodit-auth-be](https://www.npmjs.com/package/@rodit/rodit-auth-be) | [rodit-auth-be/](rodit-auth-be/) | **10.0.2** | Node.js / Express server SDK — login, JWT, permissions, webhooks |
| [@rodit/rodit-auth-fe](https://www.npmjs.com/package/@rodit/rodit-auth-fe) | [rodit-auth-fe/](rodit-auth-fe/) | **4.10.14** | Browser / NEP-413 client SDK |
| [@rodit/hola-client](https://www.npmjs.com/package/@rodit/hola-client) | [hola-client/](hola-client/) | **0.1.0** | Create / sign HOLA lines (nonce + Ed25519 + checksum) |
| [@rodit/verify-hola](https://www.npmjs.com/package/@rodit/verify-hola) | [verify-hola/](verify-hola/) | **0.1.6** | Verify-before-execute HOLA CLI & library |

## What is RODiT?

**RODiT** (RRich Online Digital Token) is a NEAR on-chain credential format. Each token carries metadata — API URL, permissioned routes, rate limits, webhook targets, JWT lifetime, geographic and CIDR constraints — signed by a service provider. APIs built on this SDK use that metadata to authenticate peers, mint JWTs, enforce permissions, and send signed webhooks.

Typical stack:

- **Server** — [`@rodit/rodit-auth-be`](https://www.npmjs.com/package/@rodit/rodit-auth-be): Express middleware, `POST /api/login`, session manager, outbound webhooks.
- **Browser / wallet client** — [`@rodit/rodit-auth-fe`](https://www.npmjs.com/package/@rodit/rodit-auth-fe): NEP-413 wallet login, JWT refresh, authenticated `fetch`.
- **Agents & integrations** — OpenClaw plugins, HOLA verify tooling, MCP discovery on live APIs.

## Production APIs powered by this SDK

These public APIs (and their open-source deploy templates where published) run on `@rodit/rodit-auth-be` and/or `@rodit/rodit-auth-fe`:

| API | Notes | Source / contract |
|-----|-------|-------------------|
| [api.identyclaw.com](https://api.identyclaw.com) | IdentyClaw agent platform — MCP discovery, HOLA, federation | [discernible-io/api-idc](https://github.com/discernible-io/api-idc) · [MCP discovery](https://api.identyclaw.com/.well-known/mcp) |
| [api.lastcradle.io](https://api.lastcradle.io) | RODiT-authenticated API in the Last Cradle family | — |
| *Many others* | Same SR/CR token family; federated login across sibling `subjectuniqueidentifier_url` endpoints | Deploy with [rodit-auth-be](rodit-auth-be/README.md) |

To build a new RODiT-powered API: install [`@rodit/rodit-auth-be`](https://www.npmjs.com/package/@rodit/rodit-auth-be), wire `RoditClient.create('server')`, expose `/api/login`, and protect routes with `authenticate` + `authorize`. For web clients, add [`@rodit/rodit-auth-fe`](https://www.npmjs.com/package/@rodit/rodit-auth-fe). See [rodit-auth-be/README.md](rodit-auth-be/README.md) for the full server guide.

## IdentyClaw stack

| Layer | Repo |
|-------|------|
| **This SDK** | [rodit-sdk](https://github.com/discernible-io/rodit-sdk) · [`@rodit/rodit-auth-be`](https://www.npmjs.com/package/@rodit/rodit-auth-be) · [`@rodit/rodit-auth-fe`](https://www.npmjs.com/package/@rodit/rodit-auth-fe) |
| IdentyClaw API | [api-idc](https://github.com/discernible-io/api-idc) → [api.identyclaw.com](https://api.identyclaw.com) |
| Deploy template | [identyclaw-agents](https://github.com/discernible-io/identyclaw-agents) |
| OpenClaw plugins | [tools](https://github.com/discernible-io/openclaw-identyclaw-plugin), [A2A](https://github.com/discernible-io/openclaw-a2a-idc-plugin), [webhooks](https://github.com/discernible-io/openclaw-identyclaw-webhooks-plugin) |
| NEAR account CLI | [gennearaccount](https://github.com/discernible-io/gennearaccount) |
| API contract | [api.identyclaw.com/.well-known/mcp](https://api.identyclaw.com/.well-known/mcp) |
| Product | [discernible.io](https://www.discernible.io) |

## Quick start — create HOLA

Requires an IdentyClaw API JWT (`POST /api/login`) and the Passport NEAR private key.

```bash
cd hola-client && npm install
```

```javascript
const { createHola } = require("@rodit/hola-client");

const { hola } = await createHola({
  baseUrl: "https://api.identyclaw.com",
  jwt: process.env.IDENTYCLAW_JWT,
  nearPrivateKey: process.env.IDENTYCLAW_NEAR_PRIVATE_KEY,
  tokenId: "yourpassportid",
  recipient: "MUNDO"
});
```

See [hola-client/README.md](hola-client/README.md).

## Quick start — verify HOLA (recommended)

No IdentyClaw API in the verify path — your machine reads chain state via FastNear (or any NEAR RPC).

```bash
export NEAR_RPC_URL="https://rpc.mainnet.fastnear.com"
export NEAR_CONTRACT_ID="genaaaa-identyclaw-com.near"
# optional: NEAR_RPC_TIMEOUT (ms; default 5000 via rodit-auth-be)

npx @rodit/verify-hola report "HOLA/MUNDO/..." --rpc \
  --canonical-peer <lemuel-gulliver-lobby-tokenId>
```

From this monorepo (no npm publish required):

```bash
export NEAR_RPC_URL="https://rpc.mainnet.fastnear.com"
export NEAR_CONTRACT_ID="genaaaa-identyclaw-com.near"
node verify-hola/bin/verify-hola.js report "HOLA/..." --rpc \
  --canonical-peer <lemuel-gulliver-lobby-tokenId>
```

### Alternative: IdentyClaw API path

JWT is optional — `POST /api/identity/verify` is public. Optional `IDENTYCLAW_HTTP_TIMEOUT` (ms; default 15000).

```bash
npx @rodit/verify-hola report "HOLA/MUNDO/..."
```

See [verify-hola/README.md](verify-hola/README.md) for the full env table.

## Package docs

- [rodit-auth-be/README.md](rodit-auth-be/README.md) — Node/Express mutual auth
- [rodit-auth-fe/README.md](rodit-auth-fe/README.md) — browser SDK
- [hola-client/README.md](hola-client/README.md) — HOLA create / sign library
- [verify-hola/README.md](verify-hola/README.md) — HOLA verification CLI

## Open work

- [TODO.md](TODO.md) — backlog for this repository (includes CC-0001 login-challenge residual)

---

[discernible.io](https://www.discernible.io) · [identyclaw-agents](https://github.com/discernible-io/identyclaw-agents) · [discernible-io](https://github.com/discernible-io)

<!-- discernible-io:product-links -->
## Links

Maintained by [Discernible](https://www.discernible.io/).

- **Product:** [discernible.io](https://www.discernible.io/)
- **Get a Passport:** [purchase.identyclaw.com](https://purchase.identyclaw.com) (buy once — no subscription)
- **Verify HOLA:** [verify.identyclaw.com](https://verify.identyclaw.com)
<!-- /discernible-io:product-links -->
