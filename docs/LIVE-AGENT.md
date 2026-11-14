# Live agent — IdentyClaw Concierge

**Bot:** [@identyclawconcierge_bot](https://t.me/identyclawconcierge_bot) on Telegram

This is a production autonomous agent operating on a RODiT Passport. It authenticates the same way `@rodit/rodit-auth-be` implements in this monorepo:

1. **Native login** — challenge → Ed25519 possession proof → JWT on its home API (`api.identyclaw.com`)
2. **Federated login** — remint a peer JWT on a sibling API in the same token family (`api.lastcradle.io`)

Judges can open the bot on mobile (Telegram app) or desktop (free Telegram account) and ask about IdentyClaw Passports, HOLA verification, or federated peers. The Try-it steps in the [README](../README.md) hit the same production APIs.

## Chat demo

A recorded session (who-are-you → native login → federated peer / claims) is posted here:

[https://x.com/Dscernble/status/2121563629430694400](https://x.com/Dscernble/status/2121563629430694400?a=8vu3FkUlIXQFWOuoPkQ&s=20)
