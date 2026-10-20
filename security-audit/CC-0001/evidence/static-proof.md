# Static proof — CC-0001 login challenge replay

## Entrypoint

- `POST /api/login` (`src/idclawserver-idc/src/routes/auth.public.routes.js`) → `RoditClient.login_client` → `verify_peer_rodit`.

## Attacker-controlled source

Replay of prior `POST /api/login` JSON: `timestamp` / `timestamp_iso`, `roditid` or `accountid`, `base64url_signature`, optional `nonce` (typically omitted on default client path).

## Propagation

1. `verify_peer_rodit` calls `validateTimestamp(peertimestamp)` before signature verification (`authentication.js` ~836).
2. `validateTimestamp` returns `true` for any non-future timestamp; `maxAgeSeconds` parameter is unused (~739–760).
3. `tryConsumeLoginNonce` runs only when `peerNonce` is truthy (~941); without nonce, replay cache is bypassed (`login-nonce.js` ~117–119).
4. `GET /api/login/timestamp` in `agent.public.routes.js` returns only `timestamp` and `timestamp_iso` (no `nonce`), while SDK exposes `createLoginTimestampChallenge()` with nonce (`login-nonce.js` ~141–148) — not wired to the public route.

## Missing protection

- No maximum challenge age at SDK timestamp gate used by login.
- No mandatory server-issued nonce on default challenge endpoint.

## Reachability

Default documented login flow uses `GET /api/login/timestamp` + sign `identifier + timestamp_iso` without nonce (swagger, enrollment docs, `identyclaw-login.mjs`).

## Impact (when signature verifies)

Session JWT issuance for the passport in the replayed body — same as legitimate login.

## Code references

- `src/rodit-sdk/rodit-auth-be/lib/auth/authentication.js` — `validateTimestamp`, `verify_peer_rodit`
- `src/rodit-sdk/rodit-auth-be/lib/auth/login-nonce.js` — optional nonce, `tryConsumeLoginNonce`
- `src/idclawserver-idc/src/routes/agent.public.routes.js` — challenge without nonce
