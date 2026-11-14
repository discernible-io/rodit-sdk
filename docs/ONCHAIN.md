# On-chain evidence trail (NEAR mainnet)

Judges can open every hash below on [nearblocks.io](https://nearblocks.io). Contract: [`genaaaa-identyclaw-com.near`](https://nearblocks.io/address/genaaaa-identyclaw-com.near). Source: [mintcontract-idc](https://github.com/discernible-io/mintcontract-idc).

Login does **not** write a transaction. The API proves possession with a **view call** (`rodit_token` / ownership check over NEAR RPC) before minting a JWT. The trail below is therefore: **mint tx → recorded login (RPC ownership check) → transfer tx** (and the post-transfer `owner_id`).

## 1. Mint

| Item | Value |
|------|--------|
| Method | `rodit_mint` |
| Token | `lnchzksqcnzv` (short-lived / low deposit example) |
| Attached deposit | **~0.082 NEAR** (`8.21917808219178e+22` yocto) |
| Tx | [`B38u9unSqXPep3V7ATqJKjfEUdEPhSKCE5KZpdjbXvq8`](https://nearblocks.io/txns/B38u9unSqXPep3V7ATqJKjfEUdEPhSKCE5KZpdjbXvq8) |

Another recent mint at **0.4 NEAR** (typical mid-tier longevity): [`9iRVUCFGVA2cmqcPxzruEuKkVeoJ24zGWNH3Fxi7Tkvw`](https://nearblocks.io/txns/9iRVUCFGVA2cmqcPxzruEuKkVeoJ24zGWNH3Fxi7Tkvw) (`bhcqsjlfcksx`). Purchase UI at [purchase.identyclaw.com](https://purchase.identyclaw.com) quotes the exact deposit before you confirm; **1 month** is the cheapest longevity.

Contract fee floor (`get_fees.initialize_fee`) is only `1e20` yocto (~0.0001 NEAR); the buyer-facing mint deposit is dominated by longevity pricing and storage, not that floor.

## 2. Login whose server-side ownership check hit NEAR RPC

| Item | Value |
|------|--------|
| When | 2026-11-14 ~18:12 UTC |
| Client Passport | `bjsmlhbnchsw` on account `886496db00b9342b960809e59359a98a1e506b96c89b1586867f59bc9b2b4ba5` |
| API | `https://api.identyclaw.com` (`POST /api/login` → JWT; `GET /api/me/identity` → **200**) |
| On-chain check | Server and client load RODiT state via NEAR RPC (`rodit_token` / `rodit_tokens_for_owner`). Client logs from this run show `nearorg_rpc_tokenfromroditid` succeeding and `verify_rodit_ownership` → **success** before the JWT is accepted. |
| Reproduce | [examples/native-login.js](../examples/native-login.js) with that account’s key file (do not commit keys). |

There is no explorer tx for the login itself: the ownership check is a **view**, not a state-changing call. The JWT + **200** on `/api/me/identity` is the off-chain receipt that the check passed against live mainnet state.

## 3. Transfer (rights follow the new owner)

### 3a. Passport moved to a new account (login path used in §2)

| Item | Value |
|------|--------|
| Method | `rodit_transfer` |
| Token | `bjsmlhbnchsw` |
| New owner | `886496db00b9342b960809e59359a98a1e506b96c89b1586867f59bc9b2b4ba5` |
| Deposit | **0.01 NEAR** |
| Tx | [`8EVhcSufsvC9WdiUPG1k4v12BtVwzpxE3hryMBGXzkYF`](https://nearblocks.io/txns/8EVhcSufsvC9WdiUPG1k4v12BtVwzpxE3hryMBGXzkYF) |

After this tx, only the new account’s keys can complete [examples/native-login.js](../examples/native-login.js) for that token — which is the login recorded in §2.

### 3b. Ownership left a previous holder (Satchel-style “old owner refused”)

| Item | Value |
|------|--------|
| Token | `bdbqcdzdsnlr` |
| Transfer to intermediate account | [`AAfwDNWZbqxNGUSBtyqzYvFCFoyF42pR7byGP5GQV1y9`](https://nearblocks.io/txns/AAfwDNWZbqxNGUSBtyqzYvFCFoyF42pR7byGP5GQV1y9) — `rodit_transfer` from `29f6d83321d982cb…` → `30321d287c19b448…` |
| Later transfer | [`81MwGmciN4AcjCS2wKHSRaSpqPJnkhmoQUdg2PJsim6R`](https://nearblocks.io/txns/81MwGmciN4AcjCS2wKHSRaSpqPJnkhmoQUdg2PJsim6R) → `elephant-cemetery.near` |
| Current `owner_id` | `elephant-cemetery.near` (view `rodit_token`) |

The previous owner’s account is no longer `owner_id`. Any login signed with that previous account’s key is refused: the API binds the possession proof to the **current** on-chain owner. Judges can re-run the same pattern themselves with [examples/transfer-proof.sh](../examples/transfer-proof.sh) and Step 3 in the root README.

## Quick verify (no secrets)

```bash
near contract call-function as-read-only genaaaa-identyclaw-com.near rodit_token \
  json-args '{"token_id":"bdbqcdzdsnlr"}' \
  network-config mainnet-fastnear now
# → owner_id: elephant-cemetery.near

near contract call-function as-read-only genaaaa-identyclaw-com.near rodit_token \
  json-args '{"token_id":"bjsmlhbnchsw"}' \
  network-config mainnet-fastnear now
# → owner_id: 886496db00b9342b960809e59359a98a1e506b96c89b1586867f59bc9b2b4ba5
```
