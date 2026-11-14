#!/usr/bin/env node
/**
 * Step 2 — federated login to a sibling API (same Passport, new peer JWT).
 *
 * Prerequisites: same env as native-login.js
 *
 * Run:
 *   cd examples && npm install && node federated-login.js
 */

const { RoditClient } = require("@rodit/rodit-auth-be");

const HOME = process.env.RODIT_HOME_API || "https://api.identyclaw.com";
const PEER = process.env.RODIT_PEER_API || "https://api.lastcradle.io";

(async () => {
  const client = await RoditClient.create("client");
  const fed = await client.login_server({ apiEndpoint: PEER });
  if (fed.error) {
    console.error("federated login failed", fed);
    process.exit(1);
  }
  console.log("federated jwt_token length", fed.jwt_token.length);

  // Peer JWTs are not valid on home without re-login — expect failure:
  const onHome = await fetch(`${HOME}/api/me/identity`, {
    headers: { Authorization: `Bearer ${fed.jwt_token}` },
  });
  console.log("peer JWT on home /api/me/identity", onHome.status);

  const claims = await fetch(`${PEER}/api/token/claims`, {
    headers: { Authorization: `Bearer ${fed.jwt_token}` },
  });
  const body = await claims.json().catch(() => ({}));
  console.log("GET peer /api/token/claims", claims.status, body);

  const payload = JSON.parse(
    Buffer.from(fed.jwt_token.split(".")[1], "base64url").toString()
  );
  console.log(
    "claim rodit_subjectuniqueidentifier_url",
    payload.rodit_subjectuniqueidentifier_url
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
