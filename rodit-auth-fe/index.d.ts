/**
 * Entry types for @rodit/rodit-auth-fe (browser / NEP-413 client).
 */

export declare const logger: unknown;
export declare function createLogContext(...args: unknown[]): unknown;
export declare function sanitizeLogContext(...args: unknown[]): unknown;
export declare function formatLogMessage(...args: unknown[]): unknown;

export interface RoditAuthServiceOptions {
  apiEndpoint?: string;
  [key: string]: unknown;
}

export declare class RoditAuthService {
  constructor(options?: RoditAuthServiceOptions);
  login_server_withnep413(options?: Record<string, unknown>): Promise<unknown>;
  [key: string]: unknown;
}

export declare function verify_rodit_ownership(...args: unknown[]): Promise<unknown>;
export declare function verify_rodit_islive(...args: unknown[]): Promise<unknown>;
export declare function verify_rodit_isamatch(...args: unknown[]): Promise<unknown>;
export declare function verify_rodit_isactive_fe(...args: unknown[]): Promise<unknown>;
export declare function verify_rodit_istrusted_issuingsmartcontract_fe(
  ...args: unknown[]
): Promise<unknown>;
export declare function verify_peerrodit_getrodit_fe(...args: unknown[]): Promise<unknown>;
export declare const stateManager: unknown;
export declare function logBufferState(...args: unknown[]): unknown;
export declare function validateMetadata(...args: unknown[]): unknown;
export declare function verifyRoditBeforeMinting(...args: unknown[]): Promise<unknown>;
export declare function verifyRoditPairBeforeMinting(...args: unknown[]): Promise<unknown>;

export declare function calculateCanonicalHash(...args: unknown[]): unknown;
export declare function canonicalizeObject(...args: unknown[]): unknown;
export declare function debugWithType(...args: unknown[]): unknown;
export declare function verifyFeeSignatureBeforeMinting(...args: unknown[]): Promise<unknown>;
export declare function base64ToBase64Url(...args: unknown[]): string;
export declare function base64url2jwk_public_key(...args: unknown[]): unknown;
export declare function jwtVerify_fe(...args: unknown[]): Promise<unknown>;
export declare function verifyRoditSignature(...args: unknown[]): Promise<unknown>;
export declare function validateBufferIntegrity(...args: unknown[]): unknown;
export declare function verifyHashInputs(...args: unknown[]): unknown;
export declare const bufferUtils: unknown;
export declare function validateAndSetUrl(...args: unknown[]): unknown;
export declare function validateAndSetDate(...args: unknown[]): unknown;
export declare function validateAndSetJson(...args: unknown[]): unknown;
export declare function validateAndSetSignature(...args: unknown[]): unknown;
export declare function validateSignatureFormat(...args: unknown[]): unknown;
export declare function validatePublicKeyFormat(...args: unknown[]): unknown;

export declare const CONSTANTS: unknown;
export declare const RODiT: unknown;
export declare function nearorg_rpc_tokensfromaccountid(...args: unknown[]): Promise<unknown>;
