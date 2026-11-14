# Live agent — IdentyClaw Concierge

**Bot:** [@identyclawconcierge_bot](https://t.me/identyclawconcierge_bot) on Telegram

This is a production autonomous agent operating on a RODiT Passport. It authenticates the same way `@rodit/rodit-auth-be` implements in this monorepo:

1. **Native login** — challenge → Ed25519 possession proof → JWT on its home API (`api.identyclaw.com`)
2. **Federated login** — remint a peer JWT on a sibling API in the same token family (`api.lastcradle.io`)

Judges can open the bot on mobile (Telegram app) or desktop (free Telegram account) and ask about IdentyClaw Passports, HOLA verification, or federated peers. The Try-it steps in the [README](../README.md) hit the same production APIs.

## Session transcript

Paste a dated real session below (user turns + agent replies). Until then, open the bot for a live session.

<!--
### YYYY-MM-DD

**User:** …

**Agent:** …
-->
