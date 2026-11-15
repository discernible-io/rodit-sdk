# TODO — `@rodit/rodit-auth-be`

Open work for this package. Standards: sibling `~/docs` ([documentation-standard.md](../../docs/docs/documentation-standard.md)).

## CC-0001 — Login challenge replay (residual)

**Finding:** Login challenge replay (`CWE-294` / `CWE-307`). Audited 2026-10-20. Max-age and optional nonce path shipped (≥ **9.17.2** / `lib/auth/login-nonce.js`); mandatory nonce is still open.

Authoritative harness (if needed): `~/CodeCome/itemdb/findings/` and `~/CodeCome/itemdb/evidence/CC-0001/`.

### Open (this package)

- [ ] **Mandatory login nonce:** Reject legacy `POST /api/login` without a server-issued nonce on main (and preferably development). Today `normalizeOptionalLoginNonce` still treats missing nonce as legacy; `tryConsumeLoginNonce` is a no-op when nonce is absent — within the max-age window a captured legacy body can still mint JWTs.
- [ ] **Shared nonce store:** Replace process-local `loginNonceReplayCache` `Map` with a store every instance reads when horizontally scaled (host `data/` / Redis — see coding-standard shared-state decision). Same caveat as HOLA nonce cache.
- [ ] **Close finding:** After mandatory nonce + host wiring land, re-validate that Phase 5-style replay (stale and fresh-within-window legacy bodies) fails; update CodeCome finding status.

### Host apps (not this package)

- [ ] **Wire challenge endpoint:** Consuming APIs (e.g. `~/idclawserver-idc/src/routes/agent.public.routes.js`) must call `createLoginTimestampChallenge()` (or equivalent) on `GET /api/login/timestamp` and return `nonce` with `timestamp` / `timestamp_iso`. SDK helper exists; public routes that omit nonce keep the residual open.

### Notes

- IdentyClaw already documents the residual (max-age enforced; legacy no-nonce replay still possible inside the window) in `session.privileged.routes.js`.
- Full HTTP re-validation against live NEAR was optional evidence; not required to finish the remaining code fixes above.

## npm packaging and discoverability (monorepo)

Cross-package work for all four `@rodit/*` packages. Highest trust-per-minute first.

### Provenance

- [ ] **npm provenance attestation:** Publish from GitHub Actions with OIDC (`npm publish --provenance`) so each tarball carries a signed, verifiable build-provenance badge linked to the exact repo commit. For a product pitched on signed provenance for agents, unsigned tarballs are a credibility gap. Effort: one workflow + `--provenance`. Also timely: npm already warns that 2FA-bypass tokens die in Jan 2027 — migrate to trusted publishing now.

### Discoverability

- [x] **Keywords and descriptions:** NEAR / agent / Express / passport keywords and descriptions updated on all four packages (2026-11-15).

### Dependency hygiene

- [x] **`verify-hola` pin:** `@rodit/rodit-auth-be` is `^10.0.5` in `verify-hola@0.1.8`.
- [x] **`ulid` range:** Auth packages use `^3.0.2`.
- [x] **`engines.node`:** All four packages use `>=20`.

### TypeScript

- [x] **Ship `.d.ts` for entry surfaces:** Hand-written entry types for login / authorize / webhooks (`rodit-auth-be`), NEP-413 client (`rodit-auth-fe`), `createHola` (`hola-client`), and verify/report (`verify-hola`).

### Tarball polish

- [x] **`files` whitelist:** Entry `.d.ts` files included; packages keep explicit `files` lists.
- [x] **`bugs` field:** All four packages point at the monorepo issues URL.
- [x] **npx / install quickstart:** Install or `npx` line at the top of each package README.
