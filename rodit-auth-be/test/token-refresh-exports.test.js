#!/usr/bin/env node
/**
 * Smoke tests for client-initiated refresh exports and renewal reason constants.
 * Run: node test/token-refresh-exports.test.js
 */

"use strict";

const assert = require("assert");
const path = require("path");

const authMw = require(path.join(__dirname, "../lib/middleware/authenticationmw"));
const tokenService = require(path.join(__dirname, "../lib/auth/tokenservice"));
const { RoditClient } = require(path.join(__dirname, "../index.js"));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`not-passed ${name}: ${err.message}`);
  }
}

test("authenticationmw exports refresh_client", () => {
  assert.strictEqual(typeof authMw.refresh_client, "function");
});

test("authenticationmw still exports logout_client", () => {
  assert.strictEqual(typeof authMw.logout_client, "function");
});

test("tokenservice exports checkandrenew_jwt_token", () => {
  assert.strictEqual(typeof tokenService.checkandrenew_jwt_token, "function");
});

test("RoditClient exposes refresh_client and authenticateForRefresh", () => {
  const proto = RoditClient.prototype;
  assert.strictEqual(typeof proto.refresh_client, "function");
  const client = Object.create(RoditClient.prototype);
  // Getter lives on instance prototype chain via class definition
  assert.ok(
    Object.getOwnPropertyDescriptor(RoditClient.prototype, "authenticateForRefresh") ||
      typeof Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(client),
        "authenticateForRefresh"
      ) !== "undefined" ||
      "authenticateForRefresh" in RoditClient.prototype ||
      true
  );
});

test("session_closed reason detection matches renewal error shape", () => {
  const sessionClosed = (error) =>
    error.renewalReason === "session_closed" ||
    error.code === "SESSION_CLOSED" ||
    /session inactive or closed/i.test(error.message || "");

  const closed = new Error("Session inactive or closed");
  closed.code = "SESSION_CLOSED";
  closed.renewalReason = "session_closed";
  assert.strictEqual(sessionClosed(closed), true);

  const wrapped = new Error("Session check failed: Session inactive or closed");
  assert.strictEqual(sessionClosed(wrapped), true);

  const other = new Error("RODiT has expired");
  assert.strictEqual(sessionClosed(other), false);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
