# CC-0001 — CodeCome audit package (local)

**Date:** 2026-10-20  
**Harness:** `/home/dedalo47/CodeCome`  
**Local repo:** `/home/dedalo47/rodit-sdk`  
**Status:** EXPLOITED · HIGH  

Login challenge replay (missing timestamp max-age / mandatory nonce). Affects SDK auth + IdentyClaw login routes.

## Reports in this directory

| Artifact | Path |
|---|---|
| Finding (full write-up) | [finding.md](./finding.md) |
| Evidence README | [evidence/README.md](./evidence/README.md) |
| Static proof | [evidence/static-proof.md](./evidence/static-proof.md) |
| Limitations | [evidence/limitations.md](./evidence/limitations.md) |
| Phase 4 summary | [runs/](./runs/) |
| Phase 5 summary | [runs/](./runs/) |

## Linked exploit artifacts (CodeCome; do not commit)

Symlink (absolute) to harness evidence:

- **Exploits:** [`exploits/`](./exploits/) → `/home/dedalo47/CodeCome/itemdb/evidence/CC-0001/exploits`
- **Full evidence tree:** [`evidence-codecome/`](./evidence-codecome/) → `/home/dedalo47/CodeCome/itemdb/evidence/CC-0001`

Harness originals:

- Finding: `/home/dedalo47/CodeCome/itemdb/findings/EXPLOITED/` (`CC-0001-*.md`)
- Evidence: `/home/dedalo47/CodeCome/itemdb/evidence/CC-0001/`

## Path map (CodeCome `src/` → this machine)

| CodeCome audit path | Local checkout |
|---|---|
| `src/rodit-sdk/...` | `~/rodit-sdk/...` |
| `src/idclawserver-idc/...` | `~/idclawserver-idc/...` |

Primary code:

- `~/rodit-sdk/rodit-auth-be/lib/auth/authentication.js`
- `~/rodit-sdk/rodit-auth-be/lib/auth/login-nonce.js`
- `~/idclawserver-idc/src/routes/agent.public.routes.js`
- `~/idclawserver-idc/src/routes/auth.public.routes.js`

## Git hygiene

`security-audit/` is listed in `.gitignore` so exploit PoCs, captures, and logs are not committed. Keep remediation patches in normal source; treat this folder as a local working copy of the audit package.
