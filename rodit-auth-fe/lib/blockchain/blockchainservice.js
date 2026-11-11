/**
 * Service for interacting with the blockchain network
 * Copyright (c) 2026 Discernible IO. All rights reserved.
 */

const { ulid } = require("ulid");
const { logger } = require("../../services/logger");
// Use process.env directly instead of config module.
// Do not import utils.js here — it pulls Node `crypto` (debug-only) and breaks Metro/RN for /chain.

/**
 * Constants and Configuration
 * Note: Environment-dependent values should be passed via function parameters
 * for npm packaging compatibility
 */
const CONSTANTS = {
  NEAR_CONTRACT_ID: null, // Should be passed as parameter
  SMART_CONTRACT_REVOKED: null, // Should be passed as parameter
  BLOCKCHAIN_NETWORK: null, // Should be passed as parameter
  RODIT_ID_SZ: 128,
  RODIT_ID_PK_SZ: 32,
  RODIT_ID_SIGNATURE_SZ: 64,
  ED25519_KEY_SZ: 64,
  NEAR_RPC_URL: null, // Should be passed as parameter
};

/**
 * Data models for RODiT authentication
 * Copyright (c) 2026 Discernible IO. All rights reserved.
 */

/**
 * RODiT token class that represents a Resource Ownership and Digital Identity Token
 */
class RODiT {
  constructor() {
    this.token_id = "";
    this.owner_id = "";
    this.metadata = {
      openapijson_url: "",
      not_after: "",
      not_before: "",
      max_requests: "",
      maxrq_window: "",
      webhook_url: "",
      webhook_cidr: "",
      userselected_dn: "",
      allowed_cidr: "",
      allowed_iso3166list: "",
      jwt_duration: "",
      permissioned_routes: "",
      subjectuniqueidentifier_url: "",
      serviceprovider_id: "",
      serviceprovider_signature: "",
    };
  }
}

/**
 * Fetches RODiT tokens for an account
 *
 * @param {string} account_id - Account ID to fetch tokens for
 * @returns {Promise<RODiT>} First RODiT token for the account
 */
async function nearorg_rpc_tokensfromaccountid(account_id, rpcUrl = null, contractId = null) {
  const requestId = ulid();
  const startTime = Date.now();

  if (!rpcUrl) {
    throw new Error("RPC URL is required but not provided");
  }
  if (!contractId) {
    throw new Error("Contract ID is required but not provided");
  }

  logger.debug("Fetching RODiT tokens for account", {
    component: "BlockchainService",
    method: "nearorg_rpc_tokensfromaccountid",
    requestId,
    accountId: account_id,
    contractId,
  });

  try {
    const args = JSON.stringify({
      account_id: account_id,
      from_index: null,
      limit: null,
    });

    const jsonData = {
      jsonrpc: "2.0",
      id: contractId,
      method: "query",
      params: {
        request_type: "call_function",
        finality: "final",
        account_id: contractId,
        method_name: "rodit_tokens_for_owner",
        args_base64: Buffer.from(args).toString("base64"),
      },
    };

    logger.debug("RPC request details", {
      component: "BlockchainService",
      method: "nearorg_rpc_tokensfromaccountid",
      requestId,
      rpcUrl,
      contractId,
      methodName: "rodit_tokens_for_owner",
      args: args,
      argsBase64: Buffer.from(args).toString("base64"),
      fullRequest: JSON.stringify(jsonData),
    });

    logger.debug("Sending RPC request for account tokens", {
      component: "BlockchainService",
      method: "nearorg_rpc_tokensfromaccountid",
      requestId,
      rpcMethod: "rodit_tokens_for_owner",
    });

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonData),
    });

    const responseText = await response.text();
    const parsedJson = JSON.parse(responseText);

    if (parsedJson.result && parsedJson.result.error) {
      const duration = Date.now() - startTime;

      logger.error("WASM execution error", {
        component: "BlockchainService",
        method: "nearorg_rpc_tokensfromaccountid",
        requestId,
        duration,
        accountId: account_id,
        wasmError: parsedJson.result.error,
      });

      // Emit metrics for Grafana dashboards
      logger.metric("account_tokens_fetch_duration_ms", duration, {
        component: "BlockchainService",
        success: false,
        error: "WASM_ERROR",
      });
      logger.metric("blockchain_rpc_errors_total", 1, {
        component: "BlockchainService",
        method: "tokens_from_account",
        error: "WASM_ERROR",
      });

      throw new Error(
        `Smart contract execution failed: ${parsedJson.result.error}`
      );
    }

    const resultArray = parsedJson.result.result;
    if (!Array.isArray(resultArray)) {
      const duration = Date.now() - startTime;

      logger.error("Invalid result format from blockchain", {
        component: "BlockchainService",
        method: "nearorg_rpc_tokensfromaccountid",
        requestId,
        duration,
        accountId: account_id,
        resultType: typeof resultArray,
      });

      // Emit metrics for Grafana dashboards
      logger.metric("account_tokens_fetch_duration_ms", duration, {
        component: "BlockchainService",
        success: false,
        error: "INVALID_RESULT_FORMAT",
      });
      logger.metric("blockchain_rpc_errors_total", 1, {
        component: "BlockchainService",
        method: "tokens_from_account",
        error: "INVALID_RESULT_FORMAT",
      });

      throw new Error("Result is not an array");
    }

    const resultString = new TextDecoder().decode(new Uint8Array(resultArray));
    const resultStruct = JSON.parse(resultString);

    if (!Array.isArray(resultStruct) || resultStruct.length === 0) {
      const duration = Date.now() - startTime;

      logger.warn("No RODiT instances found for account", {
        component: "BlockchainService",
        method: "nearorg_rpc_tokensfromaccountid",
        requestId,
        duration,
        accountId: account_id,
        tokenCount: 0,
      });

      // Emit metrics for Grafana dashboards
      logger.metric("account_tokens_fetch_duration_ms", duration, {
        component: "BlockchainService",
        success: true,
        tokenCount: 0,
      });
      logger.metric("empty_account_tokens_total", 1, {
        component: "BlockchainService",
        accountId: account_id,
      });

      const emptyRodit = new RODiT();
      return emptyRodit;
    }

    const rodit = new RODiT();
    Object.assign(rodit, resultStruct[0]);

    const duration = Date.now() - startTime;
    logger.debug("Successfully retrieved RODiT tokens", {
      component: "BlockchainService",
      method: "nearorg_rpc_tokensfromaccountid",
      requestId,
      duration,
      accountId: account_id,
      tokenCount: resultStruct.length,
      firstTokenId: rodit.token_id,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("account_tokens_fetch_duration_ms", duration, {
      component: "BlockchainService",
      success: true,
      tokenCount: resultStruct.length,
    });

    return rodit;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Failed to fetch RODiT tokens", {
      component: "BlockchainService",
      method: "nearorg_rpc_tokensfromaccountid",
      requestId,
      duration,
      accountId: account_id,
      errorMessage: error.message,
      stack: error.stack,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("account_tokens_fetch_duration_ms", duration, {
      component: "BlockchainService",
      success: false,
      error: error.constructor.name,
    });
    logger.metric("blockchain_rpc_errors_total", 1, {
      component: "BlockchainService",
      method: "tokens_from_account",
      error: error.constructor.name,
    });

    throw error;
  }
}

/**
 * Fetches a public key in bytes format for an account
 *
 * @param {string} accountId - Account ID
 * @returns {Promise<Uint8Array>} Public key bytes
 */
async function nearorg_rpc_fetchpublickeybytes(accountId, rpcUrl = null, contractId = null) {
  const requestId = ulid();
  const startTime = Date.now();

  logger.debug("Fetching public key bytes", {
    component: "BlockchainService",
    method: "nearorg_rpc_fetchpublickeybytes",
    requestId,
    accountId,
  });

  try {
    const isImplicitAccount = /^[0-9a-f]{64}$/.test(accountId);

    if (isImplicitAccount) {
      logger.debug("Account is implicit, using direct hex encoding", {
        component: "BlockchainService",
        method: "nearorg_rpc_fetchpublickeybytes",
        requestId,
        accountId,
      });

      const result = new Uint8Array(Buffer.from(accountId, "hex"));

      const duration = Date.now() - startTime;
      logger.debug(
        "Successfully retrieved public key bytes from implicit account",
        {
          component: "BlockchainService",
          method: "nearorg_rpc_fetchpublickeybytes",
          requestId,
          accountId,
          duration,
          keyLength: result.length,
        }
      );

      // Emit metrics for Grafana dashboards
      logger.metric("public_key_fetch_duration_ms", duration, {
        method: "direct_hex",
        component: "BlockchainService",
        success: true,
      });

      return result;
    }

    if (!rpcUrl) {
      throw new Error("RPC URL is required for named accounts but not provided");
    }
    if (!contractId) {
      throw new Error("Contract ID is required for named accounts but not provided");
    }

    logger.debug("Account is named, fetching RODiT token", {
      component: "BlockchainService",
      method: "nearorg_rpc_fetchpublickeybytes",
      requestId,
      accountId,
    });

    const rodit = await nearorg_rpc_tokensfromaccountid(
      accountId,
      rpcUrl,
      contractId
    );

    if (!rodit || !rodit.owner_id) {
      const duration = Date.now() - startTime;
      logger.error("No valid RODiT found for account", {
        component: "BlockchainService",
        method: "nearorg_rpc_fetchpublickeybytes",
        requestId,
        accountId,
        duration,
        error: "NO_VALID_RODIT",
      });

      // Emit metrics for Grafana dashboards
      logger.metric("public_key_fetch_duration_ms", duration, {
        method: "rodit_lookup",
        component: "BlockchainService",
        success: false,
        error: "NO_VALID_RODIT",
      });
      logger.metric("public_key_fetch_errors_total", 1, {
        method: "rodit_lookup",
        component: "BlockchainService",
        error: "NO_VALID_RODIT",
      });

      throw new Error(`No valid RODiT found for account: ${accountId}`);
    }

    const result = new Uint8Array(Buffer.from(rodit.owner_id, "hex"));

    const duration = Date.now() - startTime;
    logger.debug("Successfully retrieved public key bytes from RODiT", {
      component: "BlockchainService",
      method: "nearorg_rpc_fetchpublickeybytes",
      requestId,
      accountId,
      duration,
      keyLength: result.length,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("public_key_fetch_duration_ms", duration, {
      method: "rodit_lookup",
      component: "BlockchainService",
      success: true,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Failed to fetch public key bytes", {
      component: "BlockchainService",
      method: "nearorg_rpc_fetchpublickeybytes",
      requestId,
      accountId,
      duration,
      errorMessage: error.message,
      stack: error.stack,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("public_key_fetch_duration_ms", duration, {
      component: "BlockchainService",
      success: false,
      error: error.constructor.name,
    });
    logger.metric("public_key_fetch_errors_total", 1, {
      component: "BlockchainService",
      error: error.constructor.name,
    });

    throw new Error(`Error retrieving public key: ${error.message}`);
  }
}

module.exports = {
  RODiT,
  CONSTANTS,
  nearorg_rpc_tokensfromaccountid,
  nearorg_rpc_fetchpublickeybytes,
};
