# Evidence for CC-0001

Date: 2026-10-20

# Summary

Runtime tests in the Node sandbox show `validateTimestamp()` accepts login challenges hundreds of days old and that login replay protection (`tryConsumeLoginNonce`) is skipped when clients omit `nonce`. Static review confirms `GET /api/login/timestamp` does not issue a nonce while the SDK already supports nonce-bearing challenges. Together this confirms the login path lacks both max-age and mandatory single-use challenge binding on the default legacy wire format.

# Validation method

- `static_proof`
- `unit_test` (SDK property harness in sandbox)

# Environment

- Sandbox: `codecome-sandbox` (`node:20-bookworm`, Podman/Docker compose)
- Target: `src/rodit-sdk/rodit-auth-be` (file-linked into `idclawserver-idc`)
- Date: 2026-10-20

# Threat-model assumptions (if applicable)

- Attacker capability "send arbitrary HTTP to public login" applies; validation focused on server-side gates that should bound replay.
- Attacker obtaining a historical login body is assumed per threat model (logs, shared machine); not re-simulated here.
- NEAR passport validity at replay time was not exercised (no test credentials in sandbox).

# Commands executed

See `commands.txt`.

Primary harness:

    node itemdb/evidence/CC-0001/validate-login-replay-properties.mjs

# Inputs

No crafted HTTP bodies. Harness uses synthetic Unix timestamps and optional nonce strings.

# Observed result

- `validateTimestamp` returned `true` for timestamp ~400 days in the past (with `maxAgeSeconds=300`).
- `validateTimestamp` returned `false` for timestamp 1 hour in the future (future-skew check still active).
- `tryConsumeLoginNonce(identifier, null)` returned `true` on consecutive calls (no replay blocking without nonce).
- With a valid nonce string, second `tryConsumeLoginNonce` returned `false` (replay blocked only on nonce path).

Full JSON: `output.txt`.

# Expected vulnerable behavior

Old challenges accepted; legacy logins without nonce never hit nonce replay cache; same signed payload remains valid at SDK gates indefinitely (subject to Ed25519 + chain checks).

# Expected safe behavior

`validateTimestamp` rejects timestamps older than `API_DEFAULT_OPTIONS.TIMESTAMP_MAX_AGE`, or every login requires a fresh server nonce consumed on success.

# Conclusion

**CONFIRMED** — SDK login validation lacks max-age enforcement and does not require nonce binding on the default path. End-to-end JWT re-mint via HTTP was not run (see `limitations.md`).

# Files

- `README.md`
- `commands.txt`
- `output.txt`
- `static-proof.md`
- `limitations.md`
- `validate-login-replay-properties.mjs`

# Limitations

See `limitations.md`. No live `POST /api/login` replay or protected-route JWT check without NEAR test credentials.
