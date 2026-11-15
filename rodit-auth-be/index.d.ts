/**
 * Entry types for @rodit/rodit-auth-be.
 * Covers login, authorize, and webhook middleware surfaces used by integrators.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

export type ExpressRequest = IncomingMessage & {
  body?: unknown;
  headers: IncomingMessage["headers"] & Record<string, string | string[] | undefined>;
  method?: string;
  path?: string;
  url?: string;
  user?: unknown;
  jwt_token?: string;
  rateLimit?: unknown;
  requestId?: string;
  [key: string]: unknown;
};

export type ExpressResponse = ServerResponse & {
  status: (code: number) => ExpressResponse;
  json: (body: unknown) => ExpressResponse;
  [key: string]: unknown;
};

export type NextFunction = (err?: unknown) => void;
export type RequestHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => void | Promise<void>;

export interface RoditClientOptions {
  credentialsFilePath?: string;
  testMode?: boolean;
  apiVersion?: string;
}

export interface LoginTimestampChallenge {
  timestamp: number;
  timestamp_iso: string;
  nonce?: string;
  [key: string]: unknown;
}

export interface JwtValidationResult {
  valid: boolean;
  payload?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown;
}

export declare class RoditClient {
  constructor(options?: RoditClientOptions);
  static create(role: "server" | "client" | "portal", options?: RoditClientOptions): Promise<RoditClient>;

  readonly authenticate: RequestHandler;
  readonly authenticateForLogout: RequestHandler;
  readonly authenticateForRefresh: RequestHandler;
  readonly authorize: RequestHandler;

  init(): Promise<void>;
  request(method: string, path: string, data?: unknown, options?: Record<string, unknown>): Promise<unknown>;
  isOperationPermitted(method: string, path: string): boolean;
  isTokenValid(): boolean;
  isAuthenticated(): Promise<boolean>;
  getSessionToken(): Promise<string | null | undefined>;
  validateToken(token: string, options?: Record<string, unknown>): Promise<JwtValidationResult>;
  generateToken(payload: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
  loginClientWithNEP413(credentials: Record<string, unknown>): Promise<unknown>;
  getClaimRateLimitMiddleware(): RequestHandler;
  getConfig(): unknown;
  getStateManager(): unknown;
  getRoditManager(): unknown;
  getSessionManager(): unknown;
  getLogger(): unknown;
}

export declare function createLoginTimestampChallenge(
  options?: Record<string, unknown>
): Promise<LoginTimestampChallenge> | LoginTimestampChallenge;

export declare function login_client(
  credentials: Record<string, unknown>,
  options?: Record<string, unknown>
): Promise<unknown>;

export declare function login_server(
  credentials: Record<string, unknown>,
  options?: Record<string, unknown>
): Promise<unknown>;

export declare function login_client_withnep413(
  credentials: Record<string, unknown>
): Promise<unknown>;

export declare function validate_jwt_token_be(
  token: string,
  options?: Record<string, unknown>
): Promise<JwtValidationResult>;

export declare function generate_jwt_token(
  payload: Record<string, unknown>,
  options?: Record<string, unknown>
): Promise<string>;

export declare const authenticate_apicall: RequestHandler;
export declare const authenticate_logout: RequestHandler;
export declare const validatepermissions: RequestHandler;
export declare const enforceRateLimitFromClaims: RequestHandler;

export interface WebhookHandlerModule {
  createRawBodyParser: (...args: unknown[]) => RequestHandler;
  createWebhookProcessingMiddleware: (...args: unknown[]) => RequestHandler;
  createPublicKeyMiddleware: (...args: unknown[]) => RequestHandler;
  createWebhookAuthenticationMiddleware: (...args: unknown[]) => RequestHandler;
  createWebhookHandler: (...args: unknown[]) => unknown;
  processWebhookEvent: (...args: unknown[]) => Promise<unknown>;
  send_webhook: (...args: unknown[]) => Promise<unknown>;
  extractWebhookSignerKey: (...args: unknown[]) => string | null | undefined;
  extractWebhookSessionId: (...args: unknown[]) => string | null | undefined;
  [key: string]: unknown;
}

export declare const webhookHandler: WebhookHandlerModule;
export declare const extractWebhookSignerKey: WebhookHandlerModule["extractWebhookSignerKey"];
export declare const extractWebhookSessionId: WebhookHandlerModule["extractWebhookSessionId"];

export declare const logger: unknown;
export declare const stateManager: unknown;
export declare const sessionManager: unknown;
export declare const config: unknown;
export declare const utils: unknown;
export declare const blockchainService: unknown;
export declare const versionManager: unknown;
export declare const VersionManager: unknown;
export declare const performanceService: unknown;
export declare const errorResponse: unknown;
export declare const loggingmw: unknown;
export declare const ratelimitmw: unknown;
export declare const versioningMiddleware: unknown;

export declare function sendError(...args: unknown[]): unknown;
export declare function buildErrorResponse(...args: unknown[]): unknown;
export declare function setExpressSessionStore(...args: unknown[]): unknown;
export declare function configureStorageFromConfig(...args: unknown[]): unknown;
export declare function validateConfig(...args: unknown[]): unknown;
export declare function healthCheckRPC(...args: unknown[]): Promise<unknown>;
export declare function resolveHealthyNearRpcUrl(...args: unknown[]): Promise<string>;
export declare function fetchWithRetry(...args: unknown[]): Promise<unknown>;
export declare function nearorg_rpc_timestamp(...args: unknown[]): Promise<unknown>;
export declare const NearRpcError: unknown;

export declare const services: {
  logger: unknown;
  sendError: typeof sendError;
  buildErrorResponse: typeof buildErrorResponse;
  errorResponse: unknown;
  utils: unknown;
  config: unknown;
  performanceService: unknown;
};
