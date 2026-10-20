---
id: "CC-0001"
title: "Login challenge replay without timestamp max-age or mandatory nonce"
status: "EXPLOITED"
severity: "HIGH"
cvss_v4:
  vector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N"
  score: 8.2
  justification: "Network attacker replays a captured legacy login body without fresh credentials; high impact on session confidentiality and integrity when passport remains valid on-chain."
confidence: "CONFIRMED"
category: "Authentication Bypass"
cwe:
  - "CWE-294"
  - "CWE-307"
language: "javascript"
target_area: "Login and session issuance"
files:
  - "src/rodit-sdk/rodit-auth-be/lib/auth/authentication.js"
  - "src/rodit-sdk/rodit-auth-be/lib/auth/login-nonce.js"
  - "src/idclawserver-idc/src/routes/agent.public.routes.js"
  - "src/idclawserver-idc/src/routes/auth.public.routes.js"
symbols:
  - "validateTimestamp"
  - "verify_peer_rodit"
  - "login_client"
  - "normalizeOptionalLoginNonce"
  - "buildLoginSigningMessageBytes"
entry_points:
  - "POST /api/login"
  - "GET /api/login/timestamp"
sources:
  - "req.body.timestamp"
  - "req.body.timestamp_iso"
  - "req.body.base64url_signature"
  - "req.body.roditid"
  - "req.body.accountid"
  - "optional req.body.nonce"
sinks:
  - "verify_peer_rodit"
  - "RoditClient.login_client session JWT issuance"
trust_boundary: "anonymous Internet -> authenticated host-scoped JWT"
assets_at_risk:
  - "Session JWTs"
  - "NEAR-linked passport API access"
validation:
  status: "CONFIRMED"
  methods:
    - "static_proof"
    - "unit_test"
  evidence_dir: "itemdb/evidence/CC-0001"
  summary: "SDK validateTimestamp accepts arbitrarily old challenges; nonce replay cache skipped without nonce; public timestamp route omits nonce."
exploitation:
  status: "DEMONSTRATED"
  impact_demonstrated: "Replay of captured legacy POST /api/login body (>300s old) mints fresh victim-bound session JWTs with distinct session_id per request without NEAR key at replay time"
  exploit_type: "authentication capture-replay to session JWT issuance"
  severity_before: "HIGH"
  severity_after: "HIGH"
  artifacts_dir: "itemdb/evidence/CC-0001/exploits"
  summary: "Black-box exploit.py replays stale captured login JSON against sandbox API; proves TIMESTAMP_MAX_AGE bypass and repeatable JWT minting"
created_at: "2026-10-20"
updated_at: "2026-10-20"
---

# Summary

The public login flow accepts legacy payloads signed over `identifier + timestamp_iso` without a server-issued nonce, and `validateTimestamp()` no longer enforces a maximum challenge age. A captured `POST /api/login` request can be replayed indefinitely to mint fresh session JWTs for the victim passport, as long as the on-chain token remains valid and the signature still verifies.

# Target context

IdentyClaw API (`idclawserver-idc`) exposes `GET /api/login/timestamp` and `POST /api/login`, delegating cryptographic verification to `@rodit/rodit-auth-be` (`login_client` → `verify_peer_rodit` → `validateTimestamp`). This is the trust boundary between anonymous callers and host-scoped JWTs used on protected routes.

# Affected code

- `src/idclawserver-idc/src/routes/agent.public.routes.js` — `GET /api/login/timestamp` returns only `timestamp` and `timestamp_iso` (no `nonce`).
- `src/rodit-sdk/rodit-auth-be/lib/auth/login-nonce.js` — `normalizeOptionalLoginNonce` treats missing nonce as legacy login; `buildLoginSigningMessageBytes` signs `identifier + timestamp_iso` when nonce absent.
- `src/rodit-sdk/rodit-auth-be/lib/auth/authentication.js` — `validateTimestamp()` rejects only future timestamps; comment explicitly states max-age check was removed.
- `src/rodit-sdk/rodit-auth-be/lib/middleware/authenticationmw.js` — `login_client` passes optional `peer_nonce` into `verify_peer_rodit`.

# Vulnerability hypothesis

Login challenges are not bound to single-use server state unless clients opt into the optional nonce field. Combined with removal of timestamp max-age validation, any previously valid login HTTP request remains a perpetual authentication oracle. An attacker who observes or exfiltrates one successful login body can re-post it to obtain new JWTs without possessing the NEAR private key at replay time.

# Source-to-sink reasoning

1. **Source:** Attacker replays captured JSON from `POST /api/login` (`timestamp`, `roditid`/`accountid`, `base64url_signature`) or reconstructs the same tuple.
2. **Propagation:** `auth.public.routes.js` resolves timestamp → `login_client` → `verify_peer_rodit`.
3. **Validation gap:** `validateTimestamp` accepts arbitrarily old timestamps (only future skew rejected). Without `nonce`, `tryConsumeLoginNonce` is a no-op success.
4. **Sink:** Successful verification leads to session/JWT issuance for the passport identified in the login body.
5. **Boundary crossed:** Anonymous Internet → authenticated session for victim `roditid`.

# Attackability / trigger conditions

- Attacker can read a past login request (proxy logs, client malware, TLS termination visibility, browser devtools on shared machine).
- Victim passport remains active on-chain; login signature algorithm and key unchanged.
- No dependency on guessing secrets; replay uses the original signature bytes.
- Optional nonce hardening is not used by default challenge endpoint.

# Impact

Unauthorized issuance of API session JWTs bound to the victim passport, enabling access to JWT-protected identity routes, HOLA drop, and any permissions embedded in the session until server-side revocation or token expiry policies apply. This is authentication integrity failure at the foundation of the API trust model.

# Validation plan

1. In sandbox, start `idclawserver-idc` with test NEAR credentials and a known passport.
2. Perform legitimate `GET /api/login/timestamp` and `POST /api/login` without `nonce`; save request/response.
3. Wait beyond configured `API_DEFAULT_OPTIONS.TIMESTAMP_MAX_AGE` (300s default in config) or artificially set system clock forward on replay only.
4. Replay the identical `POST /api/login` body; expect **200** and a new JWT if hypothesis holds.
5. Use the replayed JWT on a protected route (e.g. `GET /api/me/identity`) to confirm session acceptance.
6. **Safe behavior:** Replay rejected with `LOGIN_TIMESTAMP_STALE` or equivalent after max age, or challenge requires fresh server nonce on every login.

# Counter-analysis

Reviewer conclusion:

Keep in `PENDING` at **HIGH** severity. Static review confirms indefinite replay of captured legacy login bodies absent optional nonce binding.

Evidence reviewed:

- `validateTimestamp()` in `authentication.js` rejects only future timestamps; comment states max-age check was removed (`maxAgeSeconds` unused).
- `GET /api/login/timestamp` in `agent.public.routes.js` returns `timestamp` and `timestamp_iso` only (no server nonce), while `login-nonce.js` already implements `createLoginTimestampChallenge()` with nonce—not wired to this route.
- `normalizeOptionalLoginNonce` / `tryConsumeLoginNonce` provide single-use binding only when clients send `nonce`; missing nonce keeps legacy `identifier + timestamp_iso` message.
- Threat-model theme "Login / session weakness" and asset "Session JWTs" align; attacker capability "send arbitrary HTTP to public login" applies.

Disproof attempts:

- Searched for alternate max-age enforcement in login routes or middleware—none found on `POST /api/login` beyond SDK `validateTimestamp`.
- Nonce path would mitigate replay but is optional and not issued by the public challenge endpoint in `idclawserver-idc`.
- Login nonce replay cache is process-local (like HOLA cache) but CC-0001 root cause is missing max-age + optional nonce on default path, not cross-replica replay of consumed nonces.

Semantic deduplication:

Not duplicate of CC-0002 (HOLA verify nonce Map) or CC-0003 (subagent delegation). Same horizontal-scaling caveat as login nonce cache if nonce were enabled without shared store.

Remaining assumptions:

- Replay yields fresh session JWTs on each `POST /api/login` (expected from session issuance path; Phase 4 should confirm).
- Attacker can obtain one historical login body (logs, shared machine, MITM on TLS path—within threat model).
- On-chain passport remains valid at replay time.

Confidence adjustment:

Unchanged **HIGH** (strong static source-to-sink); runtime replay still required for `CONFIRMED`.

Recommended next action:

Phase 4: replay saved login body after >300s; confirm JWT works on `GET /api/me/identity`. Compare with login using challenge `nonce` from SDK helper if wired in test harness.

# Validation result

Status: CONFIRMED

Method: static_proof, unit_test (SDK harness in sandbox)

Date: 2026-10-20

Summary: Runtime execution against `@rodit/rodit-auth-be` proves login timestamp validation does not enforce max age (`validateTimestamp` returned true for a challenge ~400 days old while `maxAgeSeconds=300` was passed but ignored). Login nonce replay protection is not applied when `nonce` is omitted (`tryConsumeLoginNonce` returns true on repeated calls with `null` nonce). Static review confirms `GET /api/login/timestamp` in `agent.public.routes.js` does not return a server nonce, so default clients remain on the legacy `identifier + timestamp_iso` message with no single-use binding at the SDK gates reviewed.

Commands: See `itemdb/evidence/CC-0001/commands.txt` and harness `itemdb/evidence/CC-0001/validate-login-replay-properties.mjs`.

Observed behavior: All harness checks passed (`output.txt`); future timestamps still rejected; optional nonce path blocks immediate nonce replay.

Expected vulnerable behavior: Indefinite reuse of captured legacy login bodies at timestamp/nonce validation layers.

Expected safe behavior: Stale timestamps rejected after `TIMESTAMP_MAX_AGE`; mandatory fresh nonce per login attempt.

Conclusion: Finding confirmed at authentication validation layer. Full HTTP replay minting a new JWT was not demonstrated in sandbox due to missing NEAR test credentials (documented in evidence limitations).

Limitations: No end-to-end `POST /api/login` → JWT → `GET /api/me/identity` capture in this run.

# Evidence

- `itemdb/evidence/CC-0001/README.md`
- `itemdb/evidence/CC-0001/static-proof.md`
- `itemdb/evidence/CC-0001/commands.txt`
- `itemdb/evidence/CC-0001/output.txt`
- `itemdb/evidence/CC-0001/limitations.md`
- `itemdb/evidence/CC-0001/validate-login-replay-properties.mjs`

# Exploitation Result

Status: DEMONSTRATED (2026-10-20)

Method: black-box HTTP replay via `itemdb/evidence/CC-0001/exploits/exploit.py` against NEAR-stubbed `idclawserver-idc` on `http://127.0.0.1:18080`.

Summary: A synthetic captured legacy login body aged 400 seconds (> `TIMESTAMP_MAX_AGE` 300) was replayed twice on `POST /api/login`. Both requests returned HTTP 200 with new `jwt_token` values, distinct `session_id` claims, and `sub` identifying victim passport `cc0001exploit01`. No NEAR private key was used at replay time.

Severity: unchanged HIGH (`severity_before` / `severity_after` both HIGH). Demonstration confirms repeatable unauthorized session issuance; escalation to CRITICAL not applied because prior capture of a valid login body remains a prerequisite.

Artifacts: `itemdb/evidence/CC-0001/exploits/README.md`, `exploit.py`, `captured-output.txt`, `login-replay-wire.log`, `recordings/exploit.cast`.

# Demonstrated Impact

An attacker who obtains one historical `POST /api/login` request (for example from proxy logs or malware on a shared machine) can re-submit the same JSON body days or months later and receive a newly minted, server-signed session JWT for the victim passport, as long as the on-chain passport and signature remain valid.

In the sandbox demonstration, the replayed challenge was 400 seconds old—past the configured 300-second max age—yet the API still issued JWTs. Two back-to-back replays created two different server sessions for the same victim, showing the attack is repeatable without refreshing the NEAR signature.

Business impact: any API permission embedded in the victim session (identity routes, HOLA drop, webhook-authenticated flows) becomes reachable using replay-minted tokens until sessions are revoked. This undermines the foundation of passport-bound API trust.

# Root cause analysis

`validateTimestamp()` in `authentication.js` rejects only future timestamps and intentionally omits the `maxAgeSeconds` check, so stale challenges remain cryptographically acceptable. The default login wire format signs `identifier + timestamp_iso` without a mandatory server-issued nonce; `normalizeOptionalLoginNonce` and `tryConsumeLoginNonce` skip single-use enforcement when `nonce` is absent. The public `GET /api/login/timestamp` route does not expose a nonce, so typical clients stay on the legacy path. Together, any previously valid login HTTP body becomes a perpetual authentication oracle at the validation layer.

# Data flow

1. Attacker → `POST /api/login` replay body (`roditid`, `timestamp`, `base64url_signature`) — `auth.public.routes.js` / Express public router.
2. `login_client` → `verify_peer_rodit` — `authenticationmw.js`.
3. `validateTimestamp(peer_timestamp)` accepts aged timestamp — `authentication.js`.
4. Without `nonce`, `tryConsumeLoginNonce` returns success — `login-nonce.js`.
5. Ed25519 signature over legacy message still verifies → `generate_jwt_token` issues session JWT — `tokenservice.js` / `authenticationmw.js`.

# Inputs and preconditions

- Attacker-controlled input: full JSON body of a prior successful `POST /api/login` (legacy fields; no `nonce` required).
- Preconditions: network access to public login endpoint; victim passport still valid on-chain; captured signature still verifies; attacker does not need NEAR private key at replay time.
- Lab preconditions: `cc0001` NEAR stub + API (`sandbox/exploit-support/cc0001-restart-lab.sh`); synthetic capture via `cc0001-create-stale-capture.mjs`.

# Recording

- `itemdb/evidence/CC-0001/exploits/recordings/exploit.cast` — asciinema demo of `reproduce.sh`
- `itemdb/evidence/CC-0001/exploits/recordings/exploit.gif` — GIF preview
- `itemdb/evidence/CC-0001/exploits/recordings/reproduce.sh` — idempotent lab + PoC driver
- `itemdb/evidence/CC-0001/exploits/recordings/env.txt` — recording environment metadata
- `itemdb/evidence/CC-0001/exploits/recordings/README.md` — play and re-run instructions

# Remediation idea

- Reinstate max-age validation in `validateTimestamp` using `API_DEFAULT_OPTIONS.TIMESTAMP_MAX_AGE`.
- Issue a server-generated nonce on `GET /api/login/timestamp` and require it on `POST /api/login` (reject legacy unsigned-nonce logins in production).
- Bind consumed nonces in a shared store (Redis) when horizontally scaled.

```diff
--- a/lib/auth/authentication.js
+++ b/lib/auth/authentication.js
@@ -754,8 +754,15 @@
       return false;
     }
     
-    // We've removed the timestamp age check as it's not needed with our comprehensive validation system
-    // The system already validates tokens through other means
+    const maxAge =
+      Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0 ? maxAgeSeconds : 300;
+    if (timeDifference > maxAge) {
+      logger.warn("Authentication rejected: timestamp too old", {
+        component: "RoditAuth",
+        method: "validateTimestamp",
+        requestId,
+        timestamp,
+        currentTime,
+        maxAgeSeconds: maxAge,
+        ageSeconds: timeDifference,
+      });
+      return false;
+    }
     
     return true;
   }
```

# Notes

Threat-model theme "Login / session weakness" assumed login signature age is enforced in SDK; static review shows age check removed while nonce remains optional. Login nonce replay cache is also process-local (separate from CC-0002 HOLA cache).
