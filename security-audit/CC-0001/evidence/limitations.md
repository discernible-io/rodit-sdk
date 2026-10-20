# Limitations — CC-0001 validation

## Full HTTP end-to-end replay not executed

`POST /api/login` replay with JWT acceptance on `GET /api/me/identity` was not demonstrated in this sandbox run because:

- No NEAR RPC credentials / test passport were available in the workspace (`sandbox-plan.md` documents this gap).
- `RoditClient.create('server')` and live chain reads are required for successful login past cryptographic verification.

## What was demonstrated instead

Runtime tests against the exact SDK gates on the login path:

- `validateTimestamp` accepts challenges ~400 days old (far beyond default `TIMESTAMP_MAX_AGE` 300s).
- Legacy login without `nonce` does not engage single-use nonce replay protection.
- Optional `nonce` path correctly rejects immediate replay of the same nonce.

Together with static source-to-sink analysis, this confirms the **authentication oracle** property: a captured legacy login body remains cryptographically valid at the server’s timestamp and nonce checks until chain/key revocation, not until challenge expiry.

## Recommended follow-up

With operator-provided sandbox NEAR test credentials, re-run Phase 4 to capture `request.http` / `response.txt` showing two successful logins from one captured body after >300s elapsed.
