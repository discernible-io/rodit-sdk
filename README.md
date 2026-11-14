# RODiT SDK monorepo

npm packages for [**RODiT**](https://www.discernible.io) / IdentyClaw: NEAR NFT credentials that **log into APIs** (native + federated).

| Package | Directory | Version | Docs |
|---------|-----------|---------|------|
| [@rodit/rodit-auth-be](https://www.npmjs.com/package/@rodit/rodit-auth-be) | [rodit-auth-be/](rodit-auth-be/) | **10.0.3** | [README](rodit-auth-be/README.md) — server login, JWT, permissions, webhooks |
| [@rodit/rodit-auth-fe](https://www.npmjs.com/package/@rodit/rodit-auth-fe) | [rodit-auth-fe/](rodit-auth-fe/) | **4.10.15** | [README](rodit-auth-fe/README.md) — browser / NEP-413 client |
| [@rodit/hola-client](https://www.npmjs.com/package/@rodit/hola-client) | [hola-client/](hola-client/) | **0.1.1** | [README](hola-client/README.md) — create / sign HOLA lines |
| [@rodit/verify-hola](https://www.npmjs.com/package/@rodit/verify-hola) | [verify-hola/](verify-hola/) | **0.1.7** | [README](verify-hola/README.md) — verify HOLA CLI |

**License:** [AGPL-3.0-only](LICENSE) · **Backlog:** [rodit-auth-be/TODO.md](rodit-auth-be/TODO.md) · **Contest tasks:** [CONTEST.md](CONTEST.md)

---

## NEAR Hackathon — problem, product, NEAR

Contest entry for [NEAR HACKATHON](https://nearhackathon.com) track **NFTs That Do Something** (`nfts`).

| | |
|---|---|
| **Problem** | APIs still gate access with API keys and pairwise secrets. Those credentials are not the identity: they do not move with an on-chain asset, do not prove current possession, and do not scale when every agent must talk to every peer. |
| **Product** | **RODiT / IdentyClaw Passport** — a NEAR NFT credential. Holding the NFT lets you **log into APIs**: challenge → Ed25519 proof → JWT → protected routes. This monorepo ships the npm packages that implement **native** login (home API) and **federated** login (remint a peer JWT on a sibling API in the same token family). |
| **How NEAR fits** | The Passport is minted and owned on NEAR (`genaaaa-identyclaw-com.near`). At login, servers check **on-chain** RODiT ownership and metadata over NEAR RPC before minting a session JWT. Transfer the NFT and login rights follow the new owner — ownership with behavior, not a JPEG. |
| **Try it** | Judges / AI screeners: follow [Try it — NFT login](#try-it--nft-login-native--federated) (**Do** → **See**). Mint at [purchase.identyclaw.com](https://purchase.identyclaw.com) with **1 month** longevity for minimum cost. |
| **Submission repo** | **This repository only** (`projectUrl`). Links below are supporting code — not separate contest entries. |

Also selecting related tracks is reasonable: `security` (possession-gated access), `agents` (agent Passport login).

### Ecosystem map (supporting repos — not separate submissions)

| Layer | Repository | Role in the NFT→API login story |
|-------|------------|----------------------------------|
| **Contest entry / npm SDK** | **[rodit-sdk](https://github.com/discernible-io/rodit-sdk)** (this repo) | `@rodit/rodit-auth-be` / `-fe`, HOLA packages — native + federated login |
| On-chain NFT | [mintcontract-idc](https://github.com/discernible-io/mintcontract-idc) | RODiT mint/transfer contract on NEAR (`genaaaa-identyclaw-com.near`) |
| Federated peer template | [api-scaffold-federated-rodit-auth](https://github.com/discernible-io/api-scaffold-federated-rodit-auth) | Accept Passport holders; remint peer JWT |
| Dual-login proof harness | [api-test-scaffold](https://github.com/discernible-io/api-test-scaffold) | `authenticationComprehensive`: home then federated peer |
| Live federated peer / demo API | [lastcradle-be](https://github.com/discernible-io/lastcradle-be) · [lastcradle-fe](https://github.com/discernible-io/lastcradle-fe) | Product API + spectator UI (`api.lastcradle.io` / `lastcradle.io`) |
| Agent hosts | [openclaw-identyclaw-plugin](https://github.com/discernible-io/openclaw-identyclaw-plugin) · [openclaw-identyclaw-a2a-plugin](https://github.com/discernible-io/openclaw-identyclaw-a2a-plugin) · [openclaw-identyclaw-webhooks-plugin](https://github.com/discernible-io/openclaw-identyclaw-webhooks-plugin) | OpenClaw tools / A2A / webhooks with Passport login |
| Agent hosts | [hermes-identyclaw-auth](https://github.com/discernible-io/hermes-identyclaw-auth) · [hermes-identyclaw-webhook](https://github.com/discernible-io/hermes-identyclaw-webhook) · [hermes-identyclaw-a2a](https://github.com/discernible-io/hermes-identyclaw-a2a) | Hermes Passport auth / webhook / A2A |

### For AI screeners (Claude / Codex)

Reproduce from this README alone (HACKATHON.md Q-017):

1. Run **Step 0** (no secrets) — expect challenge JSON and `401 MISSING_TOKEN` on `/api/me/identity`.
2. With a Passport from [purchase.identyclaw.com](https://purchase.identyclaw.com) (**1 month**), run **Step 1** — expect home `jwt_token` and **200** on `/api/me/identity`; claim `rodit_subjectuniqueidentifier_url` is `null`.
3. Run **Step 2** — expect peer `jwt_token`, peer JWT rejected on home, **200** on peer `/api/token/claims`; claim `rodit_subjectuniqueidentifier_url` is the peer URL.
4. Confirm NEAR role: ownership checked on-chain at login. Baseline vs window: section below.

## NEAR Hackathon — baseline vs window work

This repository is an existing product. Per [NEAR HACKATHON](https://nearhackathon.com/HACKATHON.md) Q-001–Q-005, only work in the announcement→deadline window is judged; earlier commits are **baseline**.

| Marker | Value |
|--------|--------|
| **Baseline** (last commit before the window) | [`6105026`](https://github.com/discernible-io/rodit-sdk/commit/6105026fe8151422df543345a7d887e3299d6ffb) — 2026-10-13 |
| **Window** | 2026-10-19 (announcement) → 2026-11-14 23:59 UTC |
| **Diff (baseline → window tip on `main`)** | [compare `6105026…bcf6fac`](https://github.com/discernible-io/rodit-sdk/compare/6105026fe8151422df543345a7d887e3299d6ffb...bcf6face586172c36dd628264e3c92b6c83463da) |
| **Window tip cited here** | [`bcf6fac`](https://github.com/discernible-io/rodit-sdk/commit/bcf6face586172c36dd628264e3c92b6c83463da) — 2026-11-12 (`@rodit/rodit-auth-be` **10.0.2**; later local bumps include **10.0.3** AGPL) |

**In-window work judged for this entry** (login / NEAR reliability on the NFT→API path), also detailed in [rodit-auth-be/CHANGELOG.md](rodit-auth-be/CHANGELOG.md):

- **9.17.2 / 9.17.4** — login challenge max-age; `POST /api/login` accepts exactly one of `timestamp` or `timestamp_iso`
- **10.0.0** — Bearer JWT peer re-verification no longer re-applies login-challenge max-age to JWT `iat`
- **10.0.1** — dead-code scrub
- **10.0.2** — NEAR RPC deadlines + one logged alternate endpoint
- **10.0.3** — AGPL-3.0-only license on published packages
- Supporting: Gitleaks config; `@rodit/verify-hola` / `@rodit/hola-client` releases in the same window

Pre-window libraries and APIs (RODiT mint, native/federated login spine, HOLA packages) remain baseline.

## Try it — NFT login (native + federated)

Primary path for human judges and AI screeners. Each step is **Do** (commands) → **See** (expected result).

**Product:** a RODiT / IdentyClaw Passport is a NEAR NFT credential. Possession unlocks API login. Native login mints a JWT on the Passport’s home API; federated login **remints** a new JWT on a sibling API in the same token family (home JWTs are not portable).

**NEAR:** at login the server checks on-chain RODiT ownership / metadata (via NEAR RPC) before issuing a session JWT.

### Prerequisites

| Need | How |
|------|-----|
| Node.js 20+ | Local machine |
| An IdentyClaw Passport (NEAR NFT) + its key | Buy/mint at [purchase.identyclaw.com](https://purchase.identyclaw.com) · contract `genaaaa-identyclaw-com.near` |
| SDK packages | From this repo or npm `@rodit/rodit-auth-be@10.0.3` |

**Judges — cheapest mint for Steps 1–2:** open [purchase.identyclaw.com](https://purchase.identyclaw.com), complete the Passport form, and set longevity to **1 month** (not immortal / multi-year) so the on-chain mint fee is the **minimum**. Pay in NEAR, receive the Passport on the NEAR account you paste as recipient, then put that account’s key material in `NEAR_CREDENTIALS_FILE_PATH` below. One Passport is enough for both native (Step 1) and federated (Step 2) login.

Credential file for the client (path is yours; do not commit secrets):

```bash
export RODIT_NEAR_CREDENTIALS_SOURCE=file
export NEAR_CREDENTIALS_FILE_PATH=./credentials/rodit-credentials.json
export NEAR_CONTRACT_ID=genaaaa-identyclaw-com.near
export NEAR_RPC_URL=https://rpc.mainnet.fastnear.com
```

Package layout for `NEAR_CREDENTIALS_FILE_PATH`: [rodit-auth-be/README.md](rodit-auth-be/README.md) (file-based credentials). Dual-login harness: [api-test-scaffold](https://github.com/discernible-io/api-test-scaffold). Peer template: [api-scaffold-federated-rodit-auth](https://github.com/discernible-io/api-scaffold-federated-rodit-auth).

### Step 0 — no secrets (challenge only)

**Do:**

```bash
curl -sS https://api.identyclaw.com/api/login/timestamp
curl -sS https://api.lastcradle.io/api/login/timestamp
```

**See:** JSON with `timestamp` / `timestamp_iso` (and usually `requestId` on home). Confirms both APIs expose the same login-challenge contract.

**Do:**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://api.identyclaw.com/api/me/identity
```

**See:** `401` with `MISSING_TOKEN` (protected route exists; JWT required).

### Step 1 — native login (home API)

Home API: `https://api.identyclaw.com` (Passport `subjectuniqueidentifier_url`). Requires a Passport from [purchase.identyclaw.com](https://purchase.identyclaw.com) (**1 month** longevity = minimum mint cost).

**Do:**

```bash
cd rodit-auth-be && npm install
```

```javascript
// native-login.js — run from rodit-auth-be after setting NEAR_CREDENTIALS_FILE_PATH
const { RoditClient } = require("@rodit/rodit-auth-be");

(async () => {
  const client = await RoditClient.create("client");
  // omit apiEndpoint → login to this Passport's home subjectuniqueidentifier_url
  const home = await client.login_server();
  if (home.error) {
    console.error("native login failed", home);
    process.exit(1);
  }
  console.log("native jwt_token length", home.jwt_token.length);

  const me = await fetch("https://api.identyclaw.com/api/me/identity", {
    headers: { Authorization: `Bearer ${home.jwt_token}` },
  });
  console.log("GET /api/me/identity", me.status, await me.json());
})();
```

```bash
node native-login.js
```

**See:**

- `login_server()` returns `{ jwt_token: "…" }` (not an error object).
- `GET /api/me/identity` → **200** with identity claims for the Passport holder.
- Decode the JWT payload (middle segment, base64url): `rodit_subjectuniqueidentifier_url` is **`null`** (same-API / native login).

### Step 2 — federated login (sibling API, same NFT)

Federated peer example (same SR/CR family): `https://api.lastcradle.io`. Reuse the **same** Passport purchased for Step 1 (no second mint); same keys, **new** JWT minted by the peer. Pattern: `@rodit/rodit-auth-be` + [federated scaffold](https://github.com/discernible-io/api-scaffold-federated-rodit-auth).

**Do:**

```javascript
// federated-login.js
const { RoditClient } = require("@rodit/rodit-auth-be");

const PEER = "https://api.lastcradle.io";

(async () => {
  const client = await RoditClient.create("client");
  const fed = await client.login_server({ apiEndpoint: PEER });
  if (fed.error) {
    console.error("federated login failed", fed);
    process.exit(1);
  }
  console.log("federated jwt_token length", fed.jwt_token.length);

  // Peer JWTs are not valid on home without re-login — expect failure:
  const onHome = await fetch("https://api.identyclaw.com/api/me/identity", {
    headers: { Authorization: `Bearer ${fed.jwt_token}` },
  });
  console.log("peer JWT on home /api/me/identity", onHome.status);

  const claims = await fetch(`${PEER}/api/token/claims`, {
    headers: { Authorization: `Bearer ${fed.jwt_token}` },
  });
  console.log("GET peer /api/token/claims", claims.status, await claims.json());
})();
```

```bash
node federated-login.js
```

**See:**

- `login_server({ apiEndpoint: PEER })` returns a **new** `jwt_token`.
- That peer JWT on home `/api/me/identity` → **401** (not portable).
- `GET https://api.lastcradle.io/api/token/claims` with the peer JWT → **200**.
- JWT claim `rodit_subjectuniqueidentifier_url` is the **peer URL** (non-null). MITM mismatches: `FEDERATED_ISSUER_MISSING` / `FEDERATED_ISSUER_MISMATCH` — see [rodit-auth-be README](rodit-auth-be/README.md).

### Step 3 — optional: dual-login test harness

**Do:** clone and run [api-test-scaffold](https://github.com/discernible-io/api-test-scaffold) on branch `main` or `development` (suite `authenticationComprehensive`).

**See:** home + federated login assertions pass in the deployment test report.

---

<!-- discernible-io:product-links -->
## Links

Maintained by [Discernible](https://www.discernible.io/).

- **Product:** [discernible.io](https://www.discernible.io/)
- **Get a Passport:** [purchase.identyclaw.com](https://purchase.identyclaw.com) (buy once — no subscription)
- **Verify HOLA:** [verify.identyclaw.com](https://verify.identyclaw.com)
<!-- /discernible-io:product-links -->
