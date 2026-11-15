/**
 * Entry types for @rodit/verify-hola — verify HOLA lines and Passport reports.
 */

export declare const DEFAULT_BASE: string;

export interface VerifyHolaOptions {
  baseUrl?: string;
  jwt?: string;
  expectedRecipient?: string;
  includeProfile?: boolean;
  timeoutMs?: number;
}

export declare function verifyHola(
  hola: string,
  options?: VerifyHolaOptions
): Promise<Record<string, unknown>>;

export declare function resolveDid(
  tokenId: string,
  options?: { baseUrl?: string; timeoutMs?: number }
): Promise<Record<string, unknown>>;

export declare function extractProfileFromDid(
  didDocument: Record<string, unknown>
): Record<string, unknown>;

export interface BuildHolaReportOptions extends VerifyHolaOptions {
  canonicalPeer?: string;
  [key: string]: unknown;
}

export declare function buildHolaReport(
  hola: string,
  options?: BuildHolaReportOptions
): Promise<Record<string, unknown>>;
