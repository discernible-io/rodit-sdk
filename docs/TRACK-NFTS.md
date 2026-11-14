# Track mapping — NFTs That Do Something (`nfts`)

Source brief: [tracks/10-nfts.md](https://github.com/nearai/near-hackathon-prompt-examples/blob/main/tracks/10-nfts.md) · [NEAR HACKATHON](https://nearhackathon.com/HACKATHON.md) (hints are wishes, not hard gates — Q-011).

This entry is a **credential NFT**: possession unlocks API login, signed webhooks without HMAC, and mutual A2A without API keys. It does **not** implement NEP-171 or a per-token sub-account treasury; ownership and transfer use [mintcontract-idc](https://github.com/discernible-io/mintcontract-idc) methods (`rodit_transfer`, `rodit_token`, …). Hints name NEP-171 / sub-accounts; we lean on **on-chain ownership + possession proofs** instead, and say so explicitly in the README.

## Point-by-point vs the example prompt

| Track ask | This entry |
|-----------|------------|
| NFT that **does something** (not a JPEG) | RODiT / IdentyClaw Passport: possession → API JWT, Ed25519 webhooks, mutual A2A |
| Contract + how control passes on transfer | [mintcontract-idc](https://github.com/discernible-io/mintcontract-idc) `rodit_transfer`; README [Ownership and transfer](../README.md#ownership-and-transfer-not-nep-171); explorer txs in [ONCHAIN.md](./ONCHAIN.md) |
| What stops the **old owner** from keeping access | After `rodit_transfer`, `owner_id` is the receiver. Login binds the signature to the **current** owner via NEAR RPC. Old account’s proof fails. Demo: README Step 3 + [examples/transfer-proof.sh](../examples/transfer-proof.sh) |
| **Gated** surface only current holders can open | `GET /api/me/identity` (and peer claims) require a JWT minted after on-chain ownership check — [Try it](../README.md#try-it--nft-login-native--federated) Steps 0–2 |
| History per NFT (earned / paid / holders) | On-chain: mint + `rodit_transfer` events (NEP-297-style) and explorer history for the token id. Off-chain earnings ledgers / payout history are **out of scope** for this SDK entry (credential, not treasury NFT) |
| Tests for the transfer path | Step 3 Do→See; [ONCHAIN.md](./ONCHAIN.md) recorded transfers; wallet script `idcp-wallet.sh` |
| NEP-171 specifically | **Not used.** Equivalent surface: `rodit_*` methods. Wallet dApps may use **NEP-413** only as an alternate API login (`@rodit/rodit-auth-fe`) |
| Sub-account / wallet-in-NFT | Not this design. The Passport is the credential; the holder’s NEAR account owns it. Transfer moves the credential, not an embedded treasury account |

## Threat model (transfer) — seller tries to keep access

| Attack | What stops it |
|--------|----------------|
| Seller transfers NFT but keeps using the old JWT | JWT expires (`jwt_duration`); renewal / protected routes still assume a live session. New logins require current on-chain ownership. Rotate/revoke sessions on the API if needed. |
| Seller signs a login challenge with the old key after transfer | Server loads `rodit_token` and verifies the signature against the **current** `owner_id`. Old key no longer matches → login rejected. |
| Seller front-runs: uses access before the buyer’s transfer confirms | Buyer should not treat possession as final until the `rodit_transfer` tx is final and `rodit_token.owner_id` is their account (same as any NFT sale). |
| Seller lists a different token id than the one transferred | Buyer verifies `token_id` on-chain (`rodit_token`) before paying off-platform. |
| Seller transfers then social-engineers the buyer’s keys | Out of band; not a contract bug. Buyer must protect their NEAR key / Passport key material. |
| Contract paused / upgrading during sale | `rodit_transfer` requires contract active; upgrade delay is owner-controlled on mintcontract-idc — see contract README. |

## Related tracks (same submission)

| Track | Fit |
|-------|-----|
| `security` | Possession-gated access; no shared webhook HMAC secrets |
| `agents` | Mutual A2A without API keys (OpenClaw / Hermes plugins) |
