# RODiT SDK monorepo

npm packages for [**RODiT**](https://www.discernible.io) / IdentyClaw: NEAR NFT credentials that **do something** — login to APIs, sign webhooks without HMAC secrets, and run mutual agent-to-agent (A2A) sessions without API keys.

| Package | Directory | Version | Docs |
|---------|-----------|---------|------|
| [@rodit/rodit-auth-be](https://www.npmjs.com/package/@rodit/rodit-auth-be) | [rodit-auth-be/](rodit-auth-be/) | **10.0.5** | [README](rodit-auth-be/README.md) — server login, JWT, permissions, signed webhooks |
| [@rodit/rodit-auth-fe](https://www.npmjs.com/package/@rodit/rodit-auth-fe) | [rodit-auth-fe/](rodit-auth-fe/) | **4.10.16** | [README](rodit-auth-fe/README.md) — browser / NEP-413 client |
| [@rodit/hola-client](https://www.npmjs.com/package/@rodit/hola-client) | [hola-client/](hola-client/) | **0.1.2** | [README](hola-client/README.md) — create / sign HOLA lines |
| [@rodit/verify-hola](https://www.npmjs.com/package/@rodit/verify-hola) | [verify-hola/](verify-hola/) | **0.1.8** | [README](verify-hola/README.md) — verify HOLA CLI |

**License:** [AGPL-3.0-only](LICENSE) · **Backlog:** [rodit-auth-be/TODO.md](rodit-auth-be/TODO.md)

---

## NEAR Hackathon — problem, product, NEAR

Contest entry for [NEAR HACKATHON](https://nearhackathon.com) track **NFTs That Do Something** (`nfts`).

| | |
|---|---|
| **Problem** | APIs and agents still gate trust with **API keys** and **pairwise secrets** (HMAC webhook secrets, shared keys per peer). Those credentials are not the identity: they do not move with an on-chain asset, do not prove current possession, and do not scale when every user/agent must talk to every peer. |
| **Product** | **RODiT / IdentyClaw Passport** — a NEAR NFT credential. Possession unlocks three behaviors this SDK implements: **API login** (challenge → Ed25519 proof → JWT), **signed webhooks without HMAC**, and **mutual A2A between users without API keys**. Native login hits the Passport’s home API; federated login remints a peer JWT on a sibling API in the same token family. |
| **How NEAR fits** | The Passport is minted and owned on NEAR (`genaaaa-identyclaw-com.near`). It is **not** a NEP-171 token. At login, servers check **on-chain** ownership over NEAR RPC before minting a session JWT. API login uses the Passport key (`@rodit/rodit-auth-be`). **NEP-413** is only the dApp alternative (`@rodit/rodit-auth-fe`). Moving the RODiT to another account moves login, webhook, and A2A rights with it. See [Ownership and transfer](#ownership-and-transfer-not-nep-171). |
| **Try it** | Judges / AI screeners: follow [Try it](#try-it--nft-login-native--federated) (**Do** → **See**), including **Step 3 transfer**. Mint at [purchase.identyclaw.com](https://purchase.identyclaw.com) with **1 month** longevity (~**0.08 NEAR** recent mainnet minimum; UI quotes exact). |
| **Evidence** | [TRANSFER-TEST-REPORT.md](docs/TRANSFER-TEST-REPORT.md) (C4: old login FAIL / new PASS) · [ONCHAIN.md](docs/ONCHAIN.md) (explorer hashes) · [TRACK-NFTS.md](docs/TRACK-NFTS.md) (vs [tracks/10-nfts.md](https://github.com/nearai/near-hackathon-prompt-examples/blob/main/tracks/10-nfts.md)) · [Baseline vs window](#baseline-vs-in-window-q-003) |
| **Submission repo** | **This repository only** (`projectUrl`). Links below are supporting code — not separate contest entries. |

Also selecting related tracks is reasonable: `security` (possession-gated access, no shared webhook secrets), `agents` (mutual A2A without API keys), `swarms` (spawn agents without provisioning pairwise API keys or HMAC secrets).

### Baseline vs in-window (Q-003)

This is an existing product (SDK since May 2026; Passport contract on NEAR since 2024). Per [HACKATHON.md](https://nearhackathon.com/HACKATHON.md) Q-001–Q-005, only work in the announcement→deadline window is judged; earlier commits are **baseline**.

| Marker | Value |
|--------|--------|
| **Window** | 2026-10-19 (announcement) → 2026-11-14 23:59 UTC |
| **`pre-hackathon` tag** | Last commit before the window — [`6105026`](https://github.com/discernible-io/rodit-sdk/commit/6105026fe8151422df543345a7d887e3299d6ffb) (2026-10-13) |
| **`hackathon-submission` tag** | Tip of this entry on `main` |
| **Diff** | [compare `pre-hackathon…hackathon-submission`](https://github.com/discernible-io/rodit-sdk/compare/pre-hackathon...hackathon-submission) |

**What was built in-window** (judge this, not the pre-window login spine):

- Login hardening and NEAR reliability on the NFT→API path (`@rodit/rodit-auth-be` **9.17.1 → 10.0.3**): challenge max-age; `timestamp` / `timestamp_iso`; JWT peer re-verification without re-applying login max-age; NEAR RPC deadlines + logged alternate endpoint; AGPL-3.0-only on published packages — see [rodit-auth-be/CHANGELOG.md](rodit-auth-be/CHANGELOG.md)
- Contest proof pack: ownership/`rodit_transfer` (not NEP-171) documented for judges; [Try it](#try-it--nft-login-native--federated) Steps 0–3; [TRANSFER-TEST-REPORT.md](docs/TRANSFER-TEST-REPORT.md) (C4); [ONCHAIN.md](docs/ONCHAIN.md); [TRACK-NFTS.md](docs/TRACK-NFTS.md); runnable `examples/`; [LIVE-AGENT.md](docs/LIVE-AGENT.md) / live surfaces

Pre-window libraries and APIs (RODiT mint, native/federated login spine, HOLA packages) remain baseline.

### Ownership and transfer (not NEP-171)

The Passport contract is [mintcontract-idc](https://github.com/discernible-io/mintcontract-idc) at `genaaaa-identyclaw-com.near`. It does **not** implement NEP-171. There is no `nft_transfer` / `nft_token`. Ownership and transfer use the contract’s own methods: `rodit_token`, `rodit_tokens_for_owner`, and `rodit_transfer`. After mint, the only mutable on-chain facts are **owner** and **existence**; login and other possession proofs check the owner recorded **now**, not at issuance.

**API login.** The usual path, including [Try it](#try-it--nft-login-native--federated), signs the login challenge with the Passport key through `@rodit/rodit-auth-be`. The server loads the token (`rodit_token`) and checks that signature against the current owner before it mints a JWT. Wire detail (challenge → sign → `POST /api/login` → JWT / federated remint): live guide [`doc:reference:login-authentication`](https://api.identyclaw.com/api/mcp/resource/doc:reference:login-authentication).

**NEP-413 is a dApp-only alternative for that same API login.** It is not how agents, servers, or the Try it steps authenticate. A dApp using [`@rodit/rodit-auth-fe`](rodit-auth-fe/README.md) calls `login_server_withnep413`: the page reads tokens for the connected account (`rodit_tokens_for_owner`), the wallet signs the token id under NEP-413 (message, nonce, recipient, callback URL), and the API checks that signature against the current owner. Success mints the same kind of session JWT.

**Moving a RODiT to another account.** The current owner calls `rodit_transfer` and names the new NEAR account as `receiver_id`. The contract accepts the call only from the current `owner_id`, requires exactly **0.01 NEAR** attached, then sets `owner_id` to that receiver. After the call, `rodit_tokens_for_owner` lists the Passport under the new account, and the next login — Passport key or dApp NEP-413 — has to come from that account. The previous account no longer owns the token, so its proof fails. No second mint: the same token id moves. Same procedure as **key rotation** (transfer custody, keep the 12-letter Passport id): [`doc:reference:key-rotation`](https://api.identyclaw.com/api/mcp/resource/doc:reference:key-rotation) · FAQ in [`doc:reference:pricing-philosophy`](https://api.identyclaw.com/api/mcp/resource/doc:reference:pricing-philosophy).

```bash
near call genaaaa-identyclaw-com.near rodit_transfer \
  '{"receiver_id":"<new-account>.near","token_id":"<token_id>","memo":null}' \
  --accountId <current-owner> \
  --amount 0.01

near view genaaaa-identyclaw-com.near rodit_token \
  '{"token_id":"<token_id>"}'
```

`rodit_token` then shows `owner_id` as `<new-account>.near`.

### What the NFT unlocks (capabilities judges should see)

Holding a RODiT Passport is the credential. No shared API key, no per-peer HMAC secret.

| Capability | Without RODiT | With a RODiT NFT (this SDK) |
|------------|---------------|-----------------------------|
| **API access** | Distribute and rotate API keys; keys do not prove current NFT possession | Challenge → Ed25519 possession proof → JWT; server checks on-chain ownership at login ([Try it](#try-it--nft-login-native--federated)). Agents: [openclaw-identyclaw-plugin](https://github.com/discernible-io/openclaw-identyclaw-plugin), [hermes-identyclaw-auth](https://github.com/discernible-io/hermes-identyclaw-auth) |
| **Signed webhooks without HMAC** | Outbound webhooks signed with a shared HMAC secret you must provision and rotate per destination | Outbound webhooks are **Ed25519-signed**; the signer’s public key / implicit account travels on the request (`X-Rodit-Public-Key`, `X-Rodit-Implicit-Account`, `X-Signature`). Receiver verifies the signature and binds it to a live login session — **no shared webhook secret**. SDK: [Webhooks](rodit-auth-be/README.md#webhooks). Agents: [openclaw-identyclaw-webhooks-plugin](https://github.com/discernible-io/openclaw-identyclaw-webhooks-plugin), [hermes-identyclaw-webhook](https://github.com/discernible-io/hermes-identyclaw-webhook) |
| **Mutual A2A without API keys** | Agent A and agent B each need the other’s API key (or a broker) before they can talk | Two Passport holders log into each other’s APIs (native or federated) with the same possession proof. Mutual auth is **RODiT ↔ RODiT**, not key exchange. Agents: [openclaw-identyclaw-a2a-plugin](https://github.com/discernible-io/openclaw-identyclaw-a2a-plugin), [hermes-identyclaw-a2a](https://github.com/discernible-io/hermes-identyclaw-a2a). Demo: [lastcradle.io](https://lastcradle.io) |

**Dynamic agent swarms.** Because webhooks need no HMAC secret and A2A needs no per-peer API key, new agents can be spun up with only a Passport (or a transferred one): they log in, emit signed webhooks, and join mutual A2A sessions without a provisioning step that scales as *N×N* secrets. That is how this credential NFT supports short-lived or dynamically created AI agent swarms — the reproducible demo below is still the possession gate those sessions reuse.

**Why login + transfer are the reproducible demo:** Steps 0–2 are the possession gate; Step 3 shows that gate **moves** with the NFT. Webhooks and A2A reuse that same session (JWT + Ed25519 identity); they are not separate credential systems.

**Agent hosts that use this SDK** (supporting repos — not separate submissions):

| Host | Login | Signed webhooks (no HMAC) | Mutual A2A (no API keys) |
|------|-------|---------------------------|--------------------------|
| **OpenClaw** | [openclaw-identyclaw-plugin](https://github.com/discernible-io/openclaw-identyclaw-plugin) | [openclaw-identyclaw-webhooks-plugin](https://github.com/discernible-io/openclaw-identyclaw-webhooks-plugin) | [openclaw-identyclaw-a2a-plugin](https://github.com/discernible-io/openclaw-identyclaw-a2a-plugin) |
| **Hermes** | [hermes-identyclaw-auth](https://github.com/discernible-io/hermes-identyclaw-auth) | [hermes-identyclaw-webhook](https://github.com/discernible-io/hermes-identyclaw-webhook) | [hermes-identyclaw-a2a](https://github.com/discernible-io/hermes-identyclaw-a2a) |

### Ecosystem map (supporting repos — not separate submissions)

| Layer | Repository | Role |
|-------|------------|------|
| **Contest entry / npm SDK** | **[rodit-sdk](https://github.com/discernible-io/rodit-sdk)** (this repo) | `@rodit/rodit-auth-be` / `-fe`, HOLA — login, signed webhooks, mutual A2A building blocks |
| On-chain NFT | [mintcontract-idc](https://github.com/discernible-io/mintcontract-idc) | RODiT mint/transfer contract on NEAR (`genaaaa-identyclaw-com.near`) |
| Federated peer template | [api-scaffold-federated-rodit-auth](https://github.com/discernible-io/api-scaffold-federated-rodit-auth) | Accept Passport holders; remint peer JWT |
| Dual-login proof harness | [api-test-scaffold](https://github.com/discernible-io/api-test-scaffold) | `authenticationComprehensive`: home then federated peer |
| Live federated peer / demo API | [lastcradle-be](https://github.com/discernible-io/lastcradle-be) · [lastcradle-fe](https://github.com/discernible-io/lastcradle-fe) | Product API + spectator UI (`api.lastcradle.io` / `lastcradle.io`) |
| OpenClaw / Hermes plugins | See [Agent hosts that use this SDK](#agent-hosts-that-use-this-sdk-supporting-repos--not-separate-submissions) | Login, signed webhooks, mutual A2A on both agent hosts |

### For AI screeners (Claude / Codex)

Reproduce from this README alone (HACKATHON.md Q-017):

1. Run **Step 0** (no secrets) — expect challenge JSON and `401 MISSING_TOKEN` on `/api/me/identity`.
2. With a Passport from [purchase.identyclaw.com](https://purchase.identyclaw.com) (**1 month**), run **Step 1** — expect home `jwt_token` and **200** on `/api/me/identity`; claim `rodit_subjectuniqueidentifier_url` is `null`.
3. Run **Step 2** — expect peer `jwt_token`, peer JWT rejected on home, **200** on peer `/api/token/claims`; claim `rodit_subjectuniqueidentifier_url` is the peer URL.
4. Run **Step 3** (transfer) — after `rodit_transfer`, old owner login rejected, new owner login accepted. Dated results: [docs/TRANSFER-TEST-REPORT.md](docs/TRANSFER-TEST-REPORT.md).
5. Confirm NEAR role: ownership checked on-chain at login. The contract is not NEP-171. API login uses the Passport key; NEP-413 is only the dApp alternative. Baseline vs window: [Q-003](#baseline-vs-in-window-q-003).

## Try it — NFT login (native + federated)

Primary path for human judges and AI screeners. Each step is **Do** (commands) → **See** (expected result). This proves the possession gate; signed webhooks and mutual A2A reuse the same RODiT identity (see [What the NFT unlocks](#what-the-nft-unlocks-capabilities-judges-should-see)).

**Product:** a RODiT / IdentyClaw Passport is a NEAR NFT credential. Possession unlocks API login (and, with that session, Ed25519 webhooks without HMAC and mutual A2A without API keys). Native login mints a JWT on the Passport’s home API; federated login **remints** a new JWT on a sibling API in the same token family (home JWTs are not portable).

**NEAR:** at login the server checks on-chain RODiT ownership / metadata (via NEAR RPC) before issuing a session JWT. These steps use the Passport key. The contract is not NEP-171. NEP-413 is only an alternative API login from a dApp, and giving the Passport to someone else is a `rodit_transfer` to their account ([Ownership and transfer](#ownership-and-transfer-not-nep-171)).

### Prerequisites

| Need | How |
|------|-----|
| Node.js 20+ | Local machine |
| An IdentyClaw Passport (NEAR NFT) + its key | Buy/mint at [purchase.identyclaw.com](https://purchase.identyclaw.com) · contract `genaaaa-identyclaw-com.near` |
| Expected **minimum mint cost** | Longevity **1 month** → recent mainnet mints from ~**0.08 NEAR** attached deposit (example: [B38u9un…](https://nearblocks.io/txns/B38u9unSqXPep3V7ATqJKjfEUdEPhSKCE5KZpdjbXvq8)); the purchase UI shows the exact quote before you pay. Immortal / multi-year is much more. |
| Transfer deposit (Step 3) | Exactly **0.01 NEAR** attached to `rodit_transfer` |
| SDK packages | `cd examples && npm install` (local `@rodit/rodit-auth-be@10.0.5`) or npm |

**Judges — cheapest path for Steps 1–3:** open [purchase.identyclaw.com](https://purchase.identyclaw.com), set longevity to **1 month**, pay the quoted NEAR, receive the Passport on the recipient account, put that account’s key material in `NEAR_CREDENTIALS_FILE_PATH` below. One Passport covers native, federated, and transfer. There is no shared public demo Passport (keys would be burned immediately); Step 0 needs none.

Credential file for the client (path is yours; do not commit secrets). Shape: `{ "implicit_account_id", "private_key", "public_key" }` — same fields as a `~/.near-credentials/mainnet/<account>.json` key file:

```bash
export RODIT_NEAR_CREDENTIALS_SOURCE=file
export NEAR_CREDENTIALS_FILE_PATH=./credentials/rodit-credentials.json
export NEAR_CONTRACT_ID=genaaaa-identyclaw-com.near
export NEAR_RPC_URL=https://rpc.mainnet.fastnear.com
```

More on file credentials: [rodit-auth-be/README.md](rodit-auth-be/README.md). Dual-login harness: [api-test-scaffold](https://github.com/discernible-io/api-test-scaffold). Peer template: [api-scaffold-federated-rodit-auth](https://github.com/discernible-io/api-scaffold-federated-rodit-auth). Wallet helper for transfers: [scripts/idcp-wallet.sh](scripts/idcp-wallet.sh) (contract `genaaaa-identyclaw-com.near`) — see [examples/transfer-proof.sh](examples/transfer-proof.sh).

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
cd examples && npm install
node native-login.js
```

**See:**

- `login_server()` returns `{ jwt_token: "…" }` (not an error object).
- `GET /api/me/identity` → **200** with identity claims for the Passport holder.
- Claim `rodit_subjectuniqueidentifier_url` is **`null`** (same-API / native login).

### Step 2 — federated login (sibling API, same NFT)

Federated peer example (same SR/CR family): `https://api.lastcradle.io`. Reuse the **same** Passport purchased for Step 1 (no second mint); same keys, **new** JWT minted by the peer. Pattern: `@rodit/rodit-auth-be` + [federated scaffold](https://github.com/discernible-io/api-scaffold-federated-rodit-auth).

**Do:**

```bash
cd examples && node federated-login.js
```

**See:**

- `login_server({ apiEndpoint: PEER })` returns a **new** `jwt_token`.
- That peer JWT on home `/api/me/identity` → **401** (not portable).
- `GET https://api.lastcradle.io/api/token/claims` with the peer JWT → **200**.
- JWT claim `rodit_subjectuniqueidentifier_url` is the **peer URL** (non-null). MITM mismatches: `FEDERATED_ISSUER_MISSING` / `FEDERATED_ISSUER_MISMATCH` — see [rodit-auth-be README](rodit-auth-be/README.md).

### Step 3 — transfer proof (rights follow the new owner)

Recorded run → [TRANSFER-TEST-REPORT.md](docs/TRANSFER-TEST-REPORT.md); hashes → [ONCHAIN.md](docs/ONCHAIN.md).

This is the NFT behavior the track cares about: move the Passport, and login (and therefore webhook / A2A rights) follow. Same on-chain procedure as [key rotation](https://api.identyclaw.com/api/mcp/resource/doc:reference:key-rotation) (transfer custody; Passport id unchanged). Helpers: [scripts/idcp-wallet.sh](scripts/idcp-wallet.sh) (`genaaaa-identyclaw-com.near`), [examples/transfer-proof.sh](examples/transfer-proof.sh), [examples/native-login-probe.js](examples/native-login-probe.js) (prints `jti` / statuses only; no secrets).

**Do:**

1. Confirm current ownership and that **Step 1** login still works with the current owner’s credentials.
2. Create or fund a second NEAR account (receiver). With [scripts/idcp-wallet.sh](scripts/idcp-wallet.sh): `./scripts/idcp-wallet.sh gennearaccount`, then `./scripts/idcp-wallet.sh <funding> <new> init` (0.01 NEAR).
3. Transfer (exactly **0.01 NEAR** deposit) — either:

```bash
export BLOCKCHAIN_ENV=mainnet
./scripts/idcp-wallet.sh <current-owner> <new-owner> <token_id>
```

```bash
near call genaaaa-identyclaw-com.near rodit_transfer \
  '{"receiver_id":"<new-owner>","token_id":"<token_id>","memo":null}' \
  --accountId <current-owner> \
  --amount 0.01
```

4. View the token, then retry login with **old** credentials, then with **new** credentials:

```bash
near view genaaaa-identyclaw-com.near rodit_token '{"token_id":"<token_id>"}'
# point NEAR_CREDENTIALS_FILE_PATH at the OLD owner key → node examples/native-login.js
# point NEAR_CREDENTIALS_FILE_PATH at the NEW owner key → node examples/native-login.js
```

**See:**

- `rodit_token.owner_id` is **`<new-owner>`** (explorer: open the transfer tx, e.g. [8EVhcSuf…](https://nearblocks.io/txns/8EVhcSufsvC9WdiUPG1k4v12BtVwzpxE3hryMBGXzkYF) / [AAfwDNWZ…](https://nearblocks.io/txns/AAfwDNWZbqxNGUSBtyqzYvFCFoyF42pR7byGP5GQV1y9) in [ONCHAIN.md](docs/ONCHAIN.md)).
- Old owner `native-login.js` → **rejected** (previous owner’s request refused — no longer on-chain owner).
- New owner `native-login.js` → **JWT** and **200** on `/api/me/identity` (rights followed the NFT).

Optional: transfer back the same way so you keep the Passport.

### Step 4 — optional: dual-login test harness

**Do:** clone and run [api-test-scaffold](https://github.com/discernible-io/api-test-scaffold) on branch `main` or `development` (suite `authenticationComprehensive`).

**See:** home + federated login assertions pass in the deployment test report.

### Live surfaces — this is a production system, not a prototype

| Surface | What you get |
|---|---|
| [api.identyclaw.com](https://api.identyclaw.com) · [purchase.identyclaw.com](https://purchase.identyclaw.com) · [verify.identyclaw.com](https://verify.identyclaw.com) | The production APIs the Try-it steps above run against — live now |
| [@identyclawconcierge_bot](https://t.me/identyclawconcierge_bot) on Telegram | **Interactive:** talk to a live autonomous agent operating on a RODiT Passport. Opens directly in the Telegram app on mobile (free account needed on desktop). Chat demo: [docs/LIVE-AGENT.md](docs/LIVE-AGENT.md) · [X post](https://x.com/Dscernble/status/2121563629430694400?a=8vu3FkUlIXQFWOuoPkQ&s=20) |

The agent behind the bot authenticates exactly as this SDK implements: native login
(challenge → Ed25519 proof → JWT on its home API) and federated login to a sibling
API in the same token family (`api.lastcradle.io`). Ask it about IdentyClaw Passports,
HOLA verification, or federated peers.

---

<!-- discernible-io:product-links -->
## Links

Maintained by [Discernible](https://www.discernible.io/).

- **Product:** [discernible.io](https://www.discernible.io/)
- **Get a Passport:** [purchase.identyclaw.com](https://purchase.identyclaw.com) (buy once — no subscription)
- **Verify HOLA:** [verify.identyclaw.com](https://verify.identyclaw.com)
<!-- /discernible-io:product-links -->
