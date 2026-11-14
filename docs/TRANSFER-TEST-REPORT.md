# Transfer ownership test report (C4)

Dated results from **one real mainnet round-trip** of `rodit_transfer`, with the paired API login outcomes screeners need: **old owner login FAIL** + **new owner login PASS** from the same transfer.

This closes the app proof-sheet **C4** deferral for submission without wiring `transferOwnership` into the scaffold CI matrix, and without pulling QR/HOLA into the story.

Source run also recorded in [api-test-scaffold `development`](https://github.com/discernible-io/api-test-scaffold) (`docs/TRANSFER-TEST-REPORT.md`); this copy lives in the contest `projectUrl` so judges need only this repo.

## Run metadata

| Field | Value |
|-------|--------|
| **Date (UTC)** | 2026-11-14T18:27:46Z → 2026-11-14T18:29:10Z |
| **Contract** | `genaaaa-identyclaw-com.near` |
| **Token id** | `cdcqsfbrsncj` |
| **API host** | `https://api.identyclaw.com` |
| **From (old owner)** | `24c0ecfe…90c4c3c3` |
| **To (new owner)** | `2e936b69…d53ee552` (disposable implicit account created for this run) |
| **Tools** | `examples/native-login-probe.js`, `scripts/idcp-wallet.sh` / `near-cli-rs`, public RPC `mainnet-fastnear` |
| **Secrets** | **No keys committed.** Credentials stayed under `~/.near-credentials/mainnet/` only. Report lists truncated account ids, JWT `jti`, HTTP statuses, and explorer hashes — never JWTs or private keys. |

Round-trip: Passport returned to the original owner after the login pairing (step 6).

## Results

| Step | What was tested | Result | Evidence |
|------|-----------------|--------|----------|
| 1 | Login as current owner | **PASS** — JWT + `GET /api/me/identity` 200 | UTC `2026-11-14T18:27:46.994Z`; API `api.identyclaw.com`; `tokenId=cdcqsfbrsncj`; JWT `jti=jti01M7DN1JE2NRT058X5PE6QE03H` |
| 2 | `rodit_transfer` to second account | **PASS** | [nearblocks `4RYaXma5qTUk5PgvfdKJBdDuEMGrEeQquBHez8dQ5G6n`](https://nearblocks.io/txns/4RYaXma5qTUk5PgvfdKJBdDuEMGrEeQquBHez8dQ5G6n) · [explorer](https://explorer.near.org/transactions/4RYaXma5qTUk5PgvfdKJBdDuEMGrEeQquBHez8dQ5G6n) |
| 3 | `rodit_token.owner_id` is new account | **PASS** | view: `owner_id=2e936b69405afff04cf2e12c513805678310056045c2f5f1a513bdbbd53ee552` |
| 4 | Login with **old** credentials | **FAIL** (expected) — refused / no JWT | HTTP **401**, `error_code=RODIT_NOT_FOUND` (“RODiT not found on blockchain”); UTC `2026-11-14T18:28:38.551Z` |
| 5 | Login with **new** credentials | **PASS** — JWT + 200 | UTC `2026-11-14T18:28:38.735Z`; `tokenId=cdcqsfbrsncj`; JWT `jti=jti01M7DN34WDDS7VNTFY4T7AVDA9`; `/api/me/identity` 200 |
| 6 | Transfer back | **PASS** | [nearblocks `3Dg6cGCPs3Q8MMLGMJ5ENSBf7bnrhN8Hk4SRtzKatuRz`](https://nearblocks.io/txns/3Dg6cGCPs3Q8MMLGMJ5ENSBf7bnrhN8Hk4SRtzKatuRz) · owner restored to `24c0ecfe…90c4c3c3`; post-return login JWT `jti=jti01M7DN43855ZGVR5W819SRWR2D` |

## How to re-run (judges)

1. Create/fund a disposable destination implicit account (`./scripts/idcp-wallet.sh gennearaccount`, then fund ≥ ~0.025 NEAR).
2. Ensure the current owner can cover `rodit_transfer` (0.01 NEAR deposit + gas; ~0.025–0.035 NEAR balance recommended with 10–15 Tgas).
3. `NEAR_CREDENTIALS_FILE_PATH=… node examples/native-login-probe.js` as current owner (expect PASS).
4. `rodit_transfer` via `./scripts/idcp-wallet.sh <from> <to> <token_id>` (or `near contract call-function … rodit_transfer` on `genaaaa-identyclaw-com.near`).
5. Re-login as **old** (expect FAIL) and **new** (expect PASS).
6. Transfer back when done.

See also README [Step 3](../README.md#step-3--transfer-proof-rights-follow-the-new-owner) and [examples/transfer-proof.sh](../examples/transfer-proof.sh).

Automated C4 inside [api-test-scaffold](https://github.com/discernible-io/api-test-scaffold) CI remains useful later; it is **not** required for this contest entry when this dated report stands.

## Explorer index (this run)

| Event | Tx |
|-------|-----|
| Outbound `rodit_transfer` | [`4RYaXma5qTUk5PgvfdKJBdDuEMGrEeQquBHez8dQ5G6n`](https://nearblocks.io/txns/4RYaXma5qTUk5PgvfdKJBdDuEMGrEeQquBHez8dQ5G6n) |
| Return `rodit_transfer` | [`3Dg6cGCPs3Q8MMLGMJ5ENSBf7bnrhN8Hk4SRtzKatuRz`](https://nearblocks.io/txns/3Dg6cGCPs3Q8MMLGMJ5ENSBf7bnrhN8Hk4SRtzKatuRz) |

## Scaffold suite maturity (historical deploy run)

Evidence that the IdentyClaw home API implementation is exercised continuously by `api-test-scaffold`, not only by the manual transfer pairing above. Full suite inventory: same file on [api-test-scaffold development](https://github.com/discernible-io/api-test-scaffold/blob/development/docs/TRANSFER-TEST-REPORT.md) (203 passed / 0 failed on 2026-11-14, including `authenticationComprehensive` and `testProofSheetC2C3C4N10`).

| Field | Value |
|-------|--------|
| **Window (UTC)** | 2026-11-14T11:14:42Z → 2026-11-14T11:23:54Z |
| **API under test** | `https://api.identyclaw.com` |
| **Contract / RODiT** | `genaaaa-identyclaw-com.near` / `bjsmlhbnchsw` |
| **Harness summary** | **203 passed**, 0 not-passed, 2 skipped (excluded federated peer cases) |
| **`allTestsSuccess`** | `True` |
| **Branch profile** | **development** matrix (includes `stressTests` + `performanceSlo`) |

### Notes

- **Excluded by config (development):** `testFederatedLoginServerPositive`, `testFederatedLoginMitmRejection` — judges can still run README Steps 1–2 federated login manually.
- **Manual C4 transfer (this document):** complements automated `testProofSheetC2C3C4N10` with explorer + old/new **login** pairing; that is the NFT→API custody proof for this entry.
