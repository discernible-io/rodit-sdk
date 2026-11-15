/**
 * Entry types for @rodit/hola-client — create / sign HOLA lines.
 */

export declare const HOLA_CHECKSUM_ALPHABET: string;
export declare const PROTOCOL_SUFFIX: string;
export declare const COLLABORATION_SCHEMA: string;
export declare const DEFAULT_MAX_AGE_MS: number;
export declare const IDENTYCLAW_FENCE: string;

export declare function computeHolaChecksum(input: string): string;
export declare function buildCanonicalPrefix(parts: {
  recipient: string;
  tokenId: string;
  timestamp: string | number;
  noncetsHex: string;
}): string;
export declare function encodeSignatureBase32(signature: Uint8Array): string;
export declare function normalizeRecipient(recipient?: string): string;
export declare function normalizeTokenId(tokenId: string): string;

export interface BuildAndSignParams {
  recipient?: string;
  tokenId: string;
  timestamp: string | number;
  noncetsHex: string;
  privateKey: Uint8Array;
}

export interface BuildAndSignResult {
  hola: string;
  signatureB32: string;
  checksum: string;
  [key: string]: unknown;
}

export declare function buildAndSign(params: BuildAndSignParams): BuildAndSignResult;

export interface GetNonceParams {
  baseUrl?: string;
  jwt: string;
}

export interface NonceResult {
  timestamp: string | number;
  noncetsHex: string;
  requestId?: string;
  [key: string]: unknown;
}

export declare function getNonce(params: GetNonceParams): Promise<NonceResult>;

export declare function nearPrivateKeyToSigningSecretKey(nearPrivateKey: string): Uint8Array;
export declare function generateNearImplicitAccount(...args: unknown[]): unknown;
export declare function validateNearCredentialsOutputDir(...args: unknown[]): unknown;
export declare function writeNearCredentialsFile(...args: unknown[]): unknown;
export declare function hasNearCredentialsDirSuffix(...args: unknown[]): boolean;

export interface CreateHolaParams {
  nearPrivateKey: string;
  jwt: string;
  tokenId: string;
  baseUrl?: string;
  recipient?: string;
}

export interface CreateHolaResult {
  hola: string;
  noncetsHex: string;
  timestamp: string | number;
  tokenId: string;
  recipient: string;
  signatureB32: string;
  checksum: string;
  requestId?: string;
}

export declare function createHola(params: CreateHolaParams): Promise<CreateHolaResult>;

export interface ParsedHola {
  recipient: string;
  tokenId: string;
  timestamp: string;
  noncetsHex: string;
  signatureB32: string;
  checksum: string;
  [key: string]: unknown;
}

export declare function parseHola(hola: string): ParsedHola;
/** @deprecated use parseHola */
export declare const verify: typeof parseHola;

export declare function buildCollaborationEnvelope(...args: unknown[]): unknown;
export declare function parseCollaborationEnvelope(...args: unknown[]): unknown;
export declare function extractIdentyclawFence(...args: unknown[]): unknown;
export declare function validateCollaborationEnvelope(...args: unknown[]): unknown;
export declare function assertCollaborationTrust(...args: unknown[]): unknown;
export declare function formatSessionsSendMessage(...args: unknown[]): unknown;
