#!/usr/bin/env node
/**
 * Step 1 — native login to the Passport's home API.
 *
 * Prerequisites (from repo root README):
 *   export RODIT_NEAR_CREDENTIALS_SOURCE=file
 *   export NEAR_CREDENTIALS_FILE_PATH=./credentials/rodit-credentials.json
 *   export NEAR_CONTRACT_ID=genaaaa-identyclaw-com.near
 *   export NEAR_RPC_URL=https://rpc.mainnet.fastnear.com
 *
 * Run:
 *   cd examples && npm install && node native-login.js
 */

const { RoditClient } = require("@rodit/rodit-auth-be");

const HOME = process.env.RODIT_HOME_API || "https://api.identyclaw.com";

(async () => {
  const client = await RoditClient.create("client");
  // omit apiEndpoint → login to this Passport's home subjectuniqueidentifier_url
  const home = await client.login_server();
  if (home.error) {
    console.error("native login failed", home);
    process.exit(1);
  }
  console.log("native jwt_token length", home.jwt_token.length);

  const me = await fetch(`${HOME}/api/me/identity`, {
    headers: { Authorization: `Bearer ${home.jwt_token}` },
  });
  const body = await me.json().catch(() => ({}));
  console.log("GET /api/me/identity", me.status, body);

  const payload = JSON.parse(
    Buffer.from(home.jwt_token.split(".")[1], "base64url").toString()
  );
  console.log(
    "claim rodit_subjectuniqueidentifier_url",
    payload.rodit_subjectuniqueidentifier_url
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
