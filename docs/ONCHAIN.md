# On-chain evidence trail (NEAR mainnet)

Judges can open every hash below on [nearblocks.io](https://nearblocks.io). Contract: [`genaaaa-identyclaw-com.near`](https://nearblocks.io/address/genaaaa-identyclaw-com.near). Source: [mintcontract-idc](https://github.com/discernible-io/mintcontract-idc).

Login does **not** write a transaction. The API proves possession with a **view call** (`rodit_token` / ownership check over NEAR RPC) before minting a JWT.

**Paired login outcomes for ownership transfer** (old FAIL + new PASS from one round-trip): **[`TRANSFER-TEST-REPORT.md`](TRANSFER-TEST-REPORT.md)** — that is the C4 custody proof for this entry.

## Contest transfer run (2026-11-14 UTC) — C4 pairing

| Action | Token | From → To | Explorer |
|--------|-------|-----------|----------|
| `rodit_transfer` (outbound) | `cdcqsfbrsncj` | `24c0ecfe…90c4c3c3` → `2e936b69…d53ee552` | [nearblocks](https://nearblocks.io/txns/4RYaXma5qTUk5PgvfdKJBdDuEMGrEeQquBHez8dQ5G6n) |
| `rodit_transfer` (return) | `cdcqsfbrsncj` | `2e936b69…d53ee552` → `24c0ecfe…90c4c3c3` | [nearblocks](https://nearblocks.io/txns/3Dg6cGCPs3Q8MMLGMJ5ENSBf7bnrhN8Hk4SRtzKatuRz) |

Login probes used [examples/native-login-probe.js](../examples/native-login-probe.js) against `https://api.identyclaw.com` (JWT `jti` / HTTP statuses in the transfer report). **No keys committed.**

## 1. Mint (background)

| Item | Value |
|------|--------|
| Method | `rodit_mint` |
| Token | `lnchzksqcnzv` (short-lived / low deposit example) |
| Attached deposit | **~0.082 NEAR** (`8.21917808219178e+22` yocto) |
| Tx | [`B38u9unSqXPep3V7ATqJKjfEUdEPhSKCE5KZpdjbXvq8`](https://nearblocks.io/txns/B38u9unSqXPep3V7ATqJKjfEUdEPhSKCE5KZpdjbXvq8) |

Another recent mint at **0.4 NEAR**: [`9iRVUCFGVA2cmqcPxzruEuKkVeoJ24zGWNH3Fxi7Tkvw`](https://nearblocks.io/txns/9iRVUCFGVA2cmqcPxzruEuKkVeoJ24zGWNH3Fxi7Tkvw) (`bhcqsjlfcksx`). Purchase UI at [purchase.identyclaw.com](https://purchase.identyclaw.com) quotes the exact deposit; **1 month** is cheapest.

## 2. Login whose server-side ownership check hit NEAR RPC

| Item | Value |
|------|--------|
| When | 2026-11-14 ~18:12 UTC |
| Client Passport | `bjsmlhbnchsw` on account `886496db00b9342b960809e59359a98a1e506b96c89b1586867f59bc9b2b4ba5` |
| API | `https://api.identyclaw.com` (`POST /api/login` → JWT; `GET /api/me/identity` → **200**) |
| On-chain check | Server and client load RODiT state via NEAR RPC (`rodit_token` / `rodit_tokens_for_owner`). |
| Reproduce | [examples/native-login.js](../examples/native-login.js) or [examples/native-login-probe.js](../examples/native-login-probe.js) (do not commit keys). |

There is no explorer tx for the login itself: the ownership check is a **view**. The JWT + **200** on `/api/me/identity` is the off-chain receipt.

## 3. Other recorded transfers

| Token | Notes | Explorer |
|-------|-------|----------|
| `bjsmlhbnchsw` | Moved to current holder used in §2 | [`8EVhcSuf…`](https://nearblocks.io/txns/8EVhcSufsvC9WdiUPG1k4v12BtVwzpxE3hryMBGXzkYF) |
| `bdbqcdzdsnlr` | Left previous holder → later `elephant-cemetery.near` | [`AAfwDNWZ…`](https://nearblocks.io/txns/AAfwDNWZbqxNGUSBtyqzYvFCFoyF42pR7byGP5GQV1y9) · [`81MwGmci…`](https://nearblocks.io/txns/81MwGmciN4AcjCS2wKHSRaSpqPJnkhmoQUdg2PJsim6R) |

## Quick verify (no secrets)

```bash
near contract call-function as-read-only genaaaa-identyclaw-com.near rodit_token \
  json-args '{"token_id":"cdcqsfbrsncj"}' \
  network-config mainnet-fastnear now
# after return transfer: owner restored to original account (see TRANSFER-TEST-REPORT.md)
```
