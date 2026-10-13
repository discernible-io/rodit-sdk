/**
 * Mobile / Node-safe chain entry for @rodit/rodit-auth-fe.
 * Copyright (c) 2026 Discernible IO. All rights reserved.
 *
 * RPC ownership helpers + verify_rodit_islive without loading frontend/rodit_fe.js
 * (avoids tweetnacl-util named ESM / wallet FE dependency graph).
 *
 * Hermes/Expo: polyfill Buffer before calling RPC helpers that use Buffer.from.
 */

export {
  CONSTANTS,
  RODiT,
  nearorg_rpc_tokensfromaccountid,
  nearorg_rpc_fetchpublickeybytes,
} from './lib/blockchain/blockchainservice.js';

export { verify_rodit_islive } from './lib/verify/verify_rodit_islive.js';
