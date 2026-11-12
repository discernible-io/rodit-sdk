# TODO

Open work for this repository. Standards: sibling `~/docs` ([documentation-standard.md](../docs/docs/documentation-standard.md) — per-repository `TODO.md`).

## CC-0001 — Login challenge replay

**Finding:** Login challenge replay without timestamp max-age or mandatory nonce (`CWE-294` / `CWE-307`). Audited 2026-10-20 (CodeCome phases 4–5: CONFIRMED → EXPLOITED). Local audit package under `security-audit/` removed; residual work lives here. Authoritative harness (if needed): `~/CodeCome/itemdb/findings/` and `~/CodeCome/itemdb/evidence/CC-0001/`.

### Done (SDK)

- [x] Restore max-age in `validateTimestamp` via `API_DEFAULT_OPTIONS.TIMESTAMP_MAX_AGE` (default 300s) — `@rodit/rodit-auth-be` ≥ **9.17.2** (`rodit-auth-be/lib/auth/authentication.js`). Stale captured login bodies older than max-age are rejected at the SDK gate.
- [x] Optional nonce path exists: `createLoginTimestampChallenge()`, `buildLoginSigningMessageBytes` (identifier + timestamp_iso + nonce), `tryConsumeLoginNonce` when nonce present (`rodit-auth-be/lib/auth/login-nonce.js`).

### Open

- [ ] **Mandatory login nonce (SDK):** Reject legacy `POST /api/login` without a server-issued nonce on main (and preferably development). Today `normalizeOptionalLoginNonce` still treats missing nonce as legacy; `tryConsumeLoginNonce` is a no-op when nonce is absent — within the max-age window a captured legacy body can still mint JWTs.
- [ ] **Wire challenge endpoint (app):** `GET /api/login/timestamp` in consuming APIs (e.g. `~/idclawserver-idc/src/routes/agent.public.routes.js`) must call `createLoginTimestampChallenge()` (or equivalent) and return `nonce` with `timestamp` / `timestamp_iso`. SDK helper exists; public route still omits nonce.
- [ ] **Shared nonce store:** Replace process-local `loginNonceReplayCache` `Map` with a store every instance reads when horizontally scaled (host `data/` / Redis — see coding-standard shared-state decision). Same caveat as HOLA nonce cache.
- [ ] **Close finding:** After mandatory nonce + app wiring land, re-validate that Phase 5-style replay (stale and fresh-within-window legacy bodies) fails; update CodeCome finding status and host `TODO` rollup.

### Notes

- IdentyClaw already documents the residual (max-age enforced; legacy no-nonce replay still possible inside the window) in `session.privileged.routes.js`.
- Full HTTP re-validation against live NEAR was optional evidence; not required to finish the remaining code fixes above.
