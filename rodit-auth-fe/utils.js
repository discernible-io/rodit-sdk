/**
 * Utility functions for RODiT authentication
 * Copyright (c) 2026 Discernible IO. All rights reserved.
 */

const { ulid } = require("ulid");
const { logger, createLogContext } = require("./services/logger");
const nacl = require("tweetnacl");
nacl.util = require("tweetnacl-util");
const { decodeUTF8, encodeBase64 } = require("tweetnacl-util");

// Import config if available, otherwise create a fallback
let config;
try {
  config = require("../config");
} catch (error) {
  // Create a fallback config object
  config = {
    get: (key) => process.env[key] || null
  };
}

/**
 * Debug utility that logs the type and value of a variable (SDK compat helper).
 *
 * @param {string} name - Name of the variable
 * @param {any} value - Value to log
 */
function debugWithType(name, value) {
  const type = typeof value;
  const isNull = value === null;
  const isUndefined = value === undefined;
  const isArray = Array.isArray(value);

  let detailedType = type;
  if (isNull) detailedType = "null";
  if (isUndefined) detailedType = "undefined";
  if (isArray) detailedType = "array";

  const valueDisplay = isNull || isUndefined ? String(value) : value;

  logger.debug(`${name}: Type: ${detailedType}, Value: ${valueDisplay}`);
}

/**
 * Converts base64 to base64url format
 *
 * @param {string} base64 - Base64 string
 * @returns {string} Base64url string
 */
function base64ToBase64Url(base64) {
  const result = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  logger.debug("Converting base64 to base64url", {
    component: "Transformer",
    method: "base64ToBase64Url",
    inputLength: base64.length,
    outputLength: result.length,
  });

  return result;
}

/**
 * Canonicalizes an object for consistent hash generation
 *
 * @param {Object|Array|any} obj - Object to canonicalize
 * @returns {Object|Array|any} Canonicalized object
 */
function canonicalizeObject(obj) {
  const startTime = Date.now();
  const requestId = ulid();

  logger.debug("Starting object canonicalization", {
    component: "Transformer",
    method: "canonicalizeObject",
    requestId,
    objectType:
      obj === null ? "null" : Array.isArray(obj) ? "array" : typeof obj,
  });

  if (typeof obj !== "object" || obj === null) {
    logger.debug("Skipping canonicalization for non-object", {
      component: "Transformer",
      method: "canonicalizeObject",
      requestId,
      valueType: typeof obj,
    });
    return obj;
  }

  let result;
  if (Array.isArray(obj)) {
    logger.debug("Canonicalizing array", {
      component: "Transformer",
      method: "canonicalizeObject",
      requestId,
      arrayLength: obj.length,
    });
    result = obj.map(canonicalizeObject);
  } else {
    logger.debug("Canonicalizing object", {
      component: "Transformer",
      method: "canonicalizeObject",
      requestId,
      keyCount: Object.keys(obj).length,
    });
    result = Object.fromEntries(
      Object.entries(obj)
        .sort()
        .map(([key, value]) => [key, canonicalizeObject(value)])
    );
  }

  const duration = Date.now() - startTime;
  logger.debug("Object canonicalization complete", {
    component: "Transformer",
    method: "canonicalizeObject",
    requestId,
    duration,
  });

  // Emit metrics for Grafana dashboards if operation took significant time
  if (duration > 50) {
    logger.metric("canonicalization_duration_ms", duration, {
      component: "Transformer",
      objectType: Array.isArray(obj) ? "array" : "object",
      size: Array.isArray(obj) ? obj.length : Object.keys(obj).length,
    });
  }

  return result;
}

/**
 * Calculates a canonical hash for an object
 *
 * @param {Object|Array|any} variable - Variable to hash
 * @returns {string} Hex hash string
 */
function calculateCanonicalHash(variable) {
  const startTime = Date.now();
  const requestId = ulid();

  logger.debug("Calculating canonical hash", {
    component: "Transformer",
    method: "calculateCanonicalHash",
    requestId,
    variableType: typeof variable,
  });

  try {
    const canonicalObj = canonicalizeObject(variable);
    const canonicalJson = JSON.stringify(canonicalObj);

    logger.debug("Canonicalized JSON created", {
      component: "Transformer",
      method: "calculateCanonicalHash",
      requestId,
      jsonLength: canonicalJson.length,
    });

    const messageUint8 = decodeUTF8(canonicalJson);

    logger.debug("Decoded to Uint8Array for hashing", {
      component: "Transformer",
      method: "calculateCanonicalHash",
      requestId,
      bytesLength: messageUint8.length,
    });

    const hashUint8 = nacl.hash(messageUint8);

    logger.debug("Hash calculated", {
      component: "Transformer",
      method: "calculateCanonicalHash",
      requestId,
      hashLength: hashUint8.length,
    });

    const hexResult = Array.from(hashUint8)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const duration = Date.now() - startTime;
    logger.debug("Canonical hash calculation complete", {
      component: "Transformer",
      method: "calculateCanonicalHash",
      requestId,
      duration,
      hashLength: hexResult.length,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("hash_calculation_duration_ms", duration, {
      component: "Transformer",
      jsonLength: canonicalJson.length,
    });

    return hexResult;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Hash calculation failed", {
      component: "Transformer",
      method: "calculateCanonicalHash",
      requestId,
      duration,
      errorMessage: error.message,
      stack: error.stack,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("hash_calculation_duration_ms", duration, {
      component: "Transformer",
      success: false,
      error: error.constructor.name,
    });
    logger.metric("hash_calculation_errors_total", 1, {
      component: "Transformer",
      errorType: error.constructor.name,
    });

    throw error;
  }
}



/**
 * Validates and sets a URL value
 * 
 * @param {string} value - URL to validate
 * @param {string} field - Field name for error messages
 * @param {Object} obj - Object to set the value on
 * @returns {string|null} Validated URL or null if invalid
 */
const validateAndSetUrl = (value, field, obj = null) => {
  const requestId = ulid();
  const startTime = Date.now();

  logger.debug("Validating URL", {
    component: "Validator",
    method: "validateAndSetUrl",
    requestId,
    field,
  });

  if (value == null) {
    logger.debug("URL validation skipped, value is null", {
      component: "Validator",
      method: "validateAndSetUrl",
      requestId,
      field,
    });
    return null;
  }

  // First remove any existing protocol
  let normalizedUrl = value.replace(/^(https?:\/\/)/, "");

  // Remove whitespace for testing
  const testUrl = normalizedUrl.replace(/\s+/g, "");

  // Updated regex to properly handle ports and domain names
  const urlRegex =
    /^(localhost(:[0-9]{1,5})?|([\da-z][\da-z-]*[\da-z]\.)*[\da-z][\da-z-]*[\da-z]\.[a-z\.]{2,6}(:[0-9]{1,5})?|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]{1,5})?)(\/[\w\.-]*)*\/?$/i;

  if (urlRegex.test(testUrl)) {
    const result = `https://${normalizedUrl}`;

    const duration = Date.now() - startTime;
    logger.debug("URL validation successful", {
      component: "Validator",
      method: "validateAndSetUrl",
      requestId,
      field,
      duration,
      isValid: true,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("validation_duration_ms", duration, {
      validationType: "url",
      field,
      success: true,
      component: "Validator",
    });

    if (obj && typeof obj === "object") {
      obj[field] = result;
    }
    return result;
  }

  const duration = Date.now() - startTime;
  logger.warn("URL validation failed", {
    component: "Validator",
    method: "validateAndSetUrl",
    requestId,
    field,
    duration,
    isValid: false,
    value,
  });

  // Emit metrics for Grafana dashboards
  logger.metric("validation_duration_ms", duration, {
    validationType: "url",
    field,
    success: false,
    component: "Validator",
  });
  logger.metric("validation_errors_total", 1, {
    validationType: "url",
    field,
    component: "Validator",
  });

  throw new Error(`Invalid URL for ${field}: ${value}`);
};

/**
 * Validates and sets a date value
 * 
 * @param {string} value - Date to validate
 * @param {string} field - Field name for error messages
 * @param {Object} obj - Object to set the value on
 * @returns {string} Validated date string
 */
const validateAndSetDate = (value, field, obj = null) => {
  const requestId = ulid();
  const startTime = Date.now();

  logger.debug("Validating date", {
    component: "Validator",
    method: "validateAndSetDate",
    requestId,
    field,
    value,
  });

  if (value == null || value === "0" || value === "") {
    logger.debug("Date validation defaulted to 1970-01-01", {
      component: "Validator",
      method: "validateAndSetDate",
      requestId,
      field,
      reason: "Empty or null value",
    });
    const defaultDate = "1970-01-01";
    
    if (obj && typeof obj === "object") {
      obj[field] = defaultDate;
    }
    return defaultDate;
  }

  const date = new Date(value);
  if (isNaN(date.getTime()) || date < new Date("1970-01-01")) {
    const duration = Date.now() - startTime;
    logger.warn("Date validation failed", {
      component: "Validator",
      method: "validateAndSetDate",
      requestId,
      field,
      duration,
      isValid: false,
      value,
      reason: isNaN(date.getTime())
        ? "Invalid date format"
        : "Date before 1970-01-01",
    });

    // Emit metrics for Grafana dashboards
    logger.metric("validation_duration_ms", duration, {
      validationType: "date",
      field,
      success: false,
      component: "Validator",
    });
    logger.metric("validation_errors_total", 1, {
      validationType: "date",
      field,
      component: "Validator",
      reason: isNaN(date.getTime()) ? "invalid_format" : "before_epoch",
    });

    throw new Error(
      `Invalid date for ${field}: ${value}. Must be YYYY-MM-DD and no earlier than 1970-01-01`
    );
  }

  const duration = Date.now() - startTime;
  logger.debug("Date validation successful", {
    component: "Validator",
    method: "validateAndSetDate",
    requestId,
    field,
    duration,
    isValid: true,
  });

  // Emit metrics for Grafana dashboards
  logger.metric("validation_duration_ms", duration, {
    validationType: "date",
    field,
    success: true,
    component: "Validator",
  });

  if (obj && typeof obj === "object") {
    obj[field] = value;
  }
  return value;
};

/**
 * Validates and sets a JSON value
 * 
 * @param {string|Object} value - JSON string or object to validate
 * @param {string} field - Field name for error messages
 * @param {Object} obj - Object to set the value on
 * @returns {string|null} Validated JSON string or null
 */
const validateAndSetJson = (value, field, obj = null) => {
  const requestId = ulid();
  const startTime = Date.now();

  logger.debug("Validating JSON", {
    component: "Validator",
    method: "validateAndSetJson",
    requestId,
    field,
  });

  if (value == null) {
    logger.debug("JSON validation skipped, value is null", {
      component: "Validator",
      method: "validateAndSetJson",
      requestId,
      field,
    });
    return null;
  }

  let jsonString;
  try {
    if (typeof value === "object") {
      jsonString = JSON.stringify(value);
      logger.debug("Converted object to JSON string", {
        component: "Validator",
        method: "validateAndSetJson",
        requestId,
        field,
        objectType: value.constructor.name,
      });
    } else if (typeof value === "string") {
      JSON.parse(value); // Just to validate, we don't use the result
      jsonString = value;
      logger.debug("Validated JSON string", {
        component: "Validator",
        method: "validateAndSetJson",
        requestId,
        field,
      });
    } else {
      const duration = Date.now() - startTime;
      logger.warn("JSON validation failed - invalid type", {
        component: "Validator",
        method: "validateAndSetJson",
        requestId,
        field,
        duration,
        actualType: typeof value,
        isValid: false,
      });

      // Emit metrics for Grafana dashboards
      logger.metric("validation_duration_ms", duration, {
        validationType: "json",
        field,
        success: false,
        component: "Validator",
        reason: "invalid_type",
      });
      logger.metric("validation_errors_total", 1, {
        validationType: "json",
        field,
        component: "Validator",
        reason: "invalid_type",
      });

      throw new Error(`Invalid type for ${field}: ${typeof value}`);
    }
  } catch (e) {
    const duration = Date.now() - startTime;
    logger.warn("JSON validation failed - parsing error", {
      component: "Validator",
      method: "validateAndSetJson",
      requestId,
      field,
      duration,
      errorMessage: e.message,
      isValid: false,
      valuePreview: typeof value === "string" ? value.substring(0, 100) : null,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("validation_duration_ms", duration, {
      validationType: "json",
      field,
      success: false,
      component: "Validator",
      reason: "parse_error",
    });
    logger.metric("validation_errors_total", 1, {
      validationType: "json",
      field,
      component: "Validator",
      reason: "parse_error",
    });

    throw new Error(`Invalid JSON for ${field}: ${e.message}`);
  }

  const duration = Date.now() - startTime;
  logger.debug("JSON validation successful", {
    component: "Validator",
    method: "validateAndSetJson",
    requestId,
    field,
    duration,
    isValid: true,
    jsonLength: jsonString.length,
  });

  // Emit metrics for Grafana dashboards
  logger.metric("validation_duration_ms", duration, {
    validationType: "json",
    field,
    success: true,
    component: "Validator",
  });

  if (obj && typeof obj === "object") {
    obj[field] = jsonString;
  }
  return jsonString;
};

/**
 * Validates and sets a signature value
 * 
 * @param {string} value - Signature to validate
 * @param {string} field - Field name for error messages
 * @param {Object} obj - Object to set the value on
 * @returns {string|null} Validated signature or null
 */
const validateAndSetSignature = (value, field, obj = null) => {
  const requestId = ulid();
  const startTime = Date.now();

  logger.debug("Validating signature", {
    component: "Validator",
    method: "validateAndSetSignature",
    requestId,
    field,
  });

  if (value == null) {
    logger.debug("Signature validation skipped, value is null", {
      component: "Validator",
      method: "validateAndSetSignature",
      requestId,
      field,
    });
    return null;
  }

  const base64urlPattern = /^[A-Za-z0-9_-]+$/;

  if (!base64urlPattern.test(value)) {
    const duration = Date.now() - startTime;
    logger.warn("Signature validation failed - invalid encoding", {
      component: "Validator",
      method: "validateAndSetSignature",
      requestId,
      field,
      duration,
      isValid: false,
      valueLength: value.length,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("validation_duration_ms", duration, {
      validationType: "signature",
      field,
      success: false,
      component: "Validator",
      reason: "invalid_encoding",
    });
    logger.metric("validation_errors_total", 1, {
      validationType: "signature",
      field,
      component: "Validator",
      reason: "invalid_encoding",
    });

    throw new Error(`Invalid base64url encoding for ${field}: ${value}`);
  }

  if (value.length !== 86) {
    const duration = Date.now() - startTime;
    logger.warn("Signature validation failed - invalid length", {
      component: "Validator",
      method: "validateAndSetSignature",
      requestId,
      field,
      duration,
      isValid: false,
      actualLength: value.length,
      expectedLength: 86,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("validation_duration_ms", duration, {
      validationType: "signature",
      field,
      success: false,
      component: "Validator",
      reason: "invalid_length",
    });
    logger.metric("validation_errors_total", 1, {
      validationType: "signature",
      field,
      component: "Validator",
      reason: "invalid_length",
    });

    throw new Error(
      `Invalid signature length for ${field}: ${value}. Expected 86 characters for base64url encoded Ed25519 signature.`
    );
  }

  const duration = Date.now() - startTime;
  logger.debug("Signature validation successful", {
    component: "Validator",
    method: "validateAndSetSignature",
    requestId,
    field,
    duration,
    isValid: true,
  });

  // Emit metrics for Grafana dashboards
  logger.metric("validation_duration_ms", duration, {
    validationType: "signature",
    field,
    success: true,
    component: "Validator",
  });

  if (obj && typeof obj === "object") {
    obj[field] = value;
  }
  return value;
};

/**
 * Validates signature format
 * 
 * @param {string} signature - Signature to validate
 * @param {string} requestId - Request ID for tracking
 * @returns {Object} Validation result
 */
function validateSignatureFormat(signature, requestId) {
  const startTime = Date.now();

  logger.debug("Validating signature format", {
    component: "Validator",
    method: "validateSignatureFormat",
    requestId,
    signatureLength: signature.length,
  });

  const result = {
    isValid: false,
    length: signature.length,
    format: null,
    error: null,
  };

  try {
    const base64urlPattern = /^[A-Za-z0-9_-]+$/;
    result.isValid = base64urlPattern.test(signature);
    result.format = result.isValid ? "valid base64url" : "invalid format";

    const duration = Date.now() - startTime;
    logger.debug("Signature format validation complete", {
      component: "Validator",
      method: "validateSignatureFormat",
      requestId,
      duration,
      isValid: result.isValid,
      format: result.format,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("signature_validation_duration_ms", duration, {
      success: result.isValid,
      component: "Validator",
      signatureLength: signature.length,
    });

    if (!result.isValid) {
      logger.metric("signature_validation_errors_total", 1, {
        reason: "invalid_format",
        component: "Validator",
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    result.error = error.message;

    logger.error("Signature validation error", {
      component: "Validator",
      method: "validateSignatureFormat",
      requestId,
      duration,
      errorMessage: error.message,
      stack: error.stack,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("signature_validation_duration_ms", duration, {
      success: false,
      component: "Validator",
      signatureLength: signature.length,
    });
    logger.metric("signature_validation_errors_total", 1, {
      reason: "exception",
      component: "Validator",
      errorType: error.constructor.name,
    });

    return result;
  }
}

/**
 * Validates public key format
 * 
 * @param {string} publicKey - Public key to validate
 * @param {string} requestId - Request ID for tracking
 * @returns {Object} Validation result
 */
function validatePublicKeyFormat(publicKey, requestId) {
  const result = {
    isValid: false,
    reason: null,
    publicKey: null,
  };

  if (!publicKey) {
    result.reason = "Public key is null or undefined";
    return result;
  }

  if (typeof publicKey !== "string") {
    result.reason = `Public key is not a string, got ${typeof publicKey}`;
    return result;
  }

  // Minimum length for a valid public key in any format
  if (publicKey.length < 32) {
    result.reason = `Public key too short: ${publicKey.length} chars`;
    return result;
  }

  try {
    // Normalize the public key format
    let normalizedPublicKey = publicKey;

    // Remove ed25519: prefix if present
    if (normalizedPublicKey.startsWith("ed25519:")) {
      normalizedPublicKey = normalizedPublicKey.substring(8);
    }

    // Try to decode the public key to validate it
    let publicKeyBytes;

    // Try base64 decoding
    try {
      publicKeyBytes = Buffer.from(normalizedPublicKey, "base64");
      if (publicKeyBytes.length === 32) {
        result.isValid = true;
        result.publicKey = normalizedPublicKey;
        return result;
      }
    } catch (e) {
      // Not base64, continue to other formats
    }

    // Try hex decoding
    try {
      if (/^[0-9a-fA-F]{64}$/.test(normalizedPublicKey)) {
        publicKeyBytes = Buffer.from(normalizedPublicKey, "hex");
        if (publicKeyBytes.length === 32) {
          result.isValid = true;
          result.publicKey = normalizedPublicKey;
          return result;
        }
      }
    } catch (e) {
      // Not hex, continue to other formats
    }

    // Try base58 decoding (common for blockchain keys)
    try {
      const bs58 = require("bs58");
      publicKeyBytes = bs58.decode(normalizedPublicKey);
      if (publicKeyBytes.length === 32) {
        result.isValid = true;
        result.publicKey = normalizedPublicKey;
        return result;
      }
    } catch (e) {
      // Not base58
    }

    result.reason = "Public key format not recognized";
    return result;
  } catch (error) {
    logger.error("Error validating public key format", {
      component: "Validator",
      method: "validatePublicKeyFormat",
      requestId,
      error: error.message,
      stack: error.stack,
    });

    result.reason = `Error validating: ${error.message}`;
    
    logger.metric("public_key_validation_errors_total", 1, {
      reason: "exception",
      component: "Validator",
      errorType: error.constructor.name,
    });

    return result;
  }
}


/**
 * Converts a base64url encoded public key to a JWK (JSON Web Key) format
 * 
 * @param {string} base64url_public_key - Base64url encoded public key
 * @returns {Object} JWK formatted public key with tweetnacl verification capability
 */
function base64url2jwk_public_key(base64url_public_key) {
  // Create the JWK object
  const jwk_public_key = {
    kty: "OKP",
    crv: "Ed25519",
    x: base64url_public_key,
    use: "sig",
  };

  // Convert base64url to raw bytes that tweetnacl can use
  const publicKeyBytes = bufferUtils.base64urlToUint8Array(base64url_public_key);

  // Return an object that mimics the jose KeyLike interface
  // but internally uses tweetnacl-js for verification
  return {
    type: "public",
    algorithm: "EdDSA",
    asymmetricKeyType: "ed25519",
    _publicKeyBytes: publicKeyBytes, // Store raw bytes for internal use

    // Implement verify method to match jose's interface
    async verify(signature, message) {
      const signatureBytes = new Uint8Array(signature);
      const messageBytes = new Uint8Array(message);
      return nacl.sign.detached.verify(messageBytes, signatureBytes, this._publicKeyBytes);
    },
  };
}

/**
 * Verifies a JWT jwt_token using tweetnacl
 * 
 * @param {string} jwt_token - JWT jwt_token to verify
 * @param {Object} publicKey - Public key object with _publicKeyBytes property
 * @param {Object} options - Verification options
 * @returns {Object} Verification result with payload, header, and signature
 */
async function jwtVerify_fe(jwt_token, publicKey, options = {}) {
  // Split the JWT into its components
  const [headerB64, payloadB64, signatureB64] = jwt_token.split(".");

  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error("Invalid JWT format");
  }

  // Decode and parse header
  let headerStr = headerB64.replace(/-/g, "+").replace(/_/g, "/");
  while (headerStr.length % 4) headerStr += "=";
  const header = JSON.parse(atob(headerStr));

  if (header.alg !== "EdDSA") {
    throw new Error("Invalid algorithm. Expected EdDSA");
  }

  if (options.algorithms && !options.algorithms.includes("EdDSA")) {
    throw new Error("Algorithm not allowed");
  }

  // Create the message that was signed (header.payload)
  const messageToVerify = `${headerB64}.${payloadB64}`;
  const messageBytes = new TextEncoder().encode(messageToVerify);

  // Convert base64url signature to Uint8Array
  let signatureStr = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
  while (signatureStr.length % 4) signatureStr += "=";
  const signatureBinary = atob(signatureStr);
  const signatureBytes = new Uint8Array(signatureBinary.length);
  for (let i = 0; i < signatureBinary.length; i++) {
    signatureBytes[i] = signatureBinary.charCodeAt(i);
  }

  // Verify the signature using tweetnacl
  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKey._publicKeyBytes
  );

  if (!isValid) {
    throw new Error("Invalid signature");
  }

  // Decode and parse payload
  let payloadStr = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
  while (payloadStr.length % 4) payloadStr += "=";
  const payload = JSON.parse(atob(payloadStr));

  return {
    payload,
    header,
    signature: signatureBytes,
  };
}

/**
 * Verifies a RODiT signature
 * 
 * @param {Object} rodit - RODiT object with token_id and metadata
 * @param {Uint8Array} signerPublicKey - Public key of the signer
 * @returns {boolean} True if signature is valid
 */
async function verifyRoditSignature(rodit, signerPublicKey) {
  logger.debug("Starting RODiT signature verification", {
    component: "utils",
    method: "verifyRoditSignature",
    roditId: rodit.token_id,
    signerPubKeyLength: signerPublicKey?.length,
  });

  const hashInput = {
    token_id: rodit.token_id,
    openapijson_url: rodit.metadata.openapijson_url,
    not_after: rodit.metadata.not_after,
    not_before: rodit.metadata.not_before,
    max_requests: String(rodit.metadata.max_requests),
    maxrq_window: String(rodit.metadata.maxrq_window),
    webhook_cidr: rodit.metadata.webhook_cidr,
    allowed_cidr: rodit.metadata.allowed_cidr,
    allowed_iso3166list: rodit.metadata.allowed_iso3166list,
    jwt_duration: rodit.metadata.jwt_duration,
    permissioned_routes: rodit.metadata.permissioned_routes,
    serviceprovider_id: rodit.metadata.serviceprovider_id,
    subjectuniqueidentifier_url: rodit.metadata.subjectuniqueidentifier_url,
  };

  const hashHex = calculateCanonicalHash(hashInput);
  const hashBytes = bufferUtils.hexToUint8Array(hashHex);

  const signature = bufferUtils.base64urlToUint8Array(
    rodit.metadata.serviceprovider_signature
  );

  return nacl.sign.detached.verify(hashBytes, signature, signerPublicKey);
}

/**
 * Validates buffer integrity
 * 
 * @param {Uint8Array} buffer - Buffer to validate
 * @param {number} expectedLength - Expected buffer length
 * @param {string} type - Type of buffer for error messages
 * @returns {boolean} True if buffer is valid
 * @throws {Error} If buffer validation fails
 */
function validateBufferIntegrity(buffer, expectedLength, type) {
  const requestId = ulid();
  
  // Validate type parameter
  if (!type || typeof type !== 'string') {
    logger.warn('Missing or invalid type parameter in validateBufferIntegrity', {
      component: 'Utils',
      method: 'validateBufferIntegrity',
      requestId,
      providedType: typeof type
    });
    type = 'buffer'; // Default type name for error messages
  }

  // Validate buffer
  if (!buffer) {
    logger.warn(`Missing ${type} in validateBufferIntegrity`, {
      component: 'Utils',
      method: 'validateBufferIntegrity',
      requestId
    });
    throw new Error(`${type} cannot be null or undefined`);
  }
  
  if (!(buffer instanceof Uint8Array)) {
    logger.warn(`Invalid ${type} type in validateBufferIntegrity`, {
      component: 'Utils',
      method: 'validateBufferIntegrity',
      requestId,
      actualType: typeof buffer
    });
    throw new Error(`${type} must be Uint8Array`);
  }
  
  if (buffer.length !== expectedLength) {
    logger.warn(`Invalid ${type} length in validateBufferIntegrity`, {
      component: 'Utils',
      method: 'validateBufferIntegrity',
      requestId,
      expectedLength,
      actualLength: buffer.length
    });
    throw new Error(`Invalid ${type} length: ${buffer.length}, expected: ${expectedLength}`);
  }
  
  logger.debug(`${type} validation successful`, {
    component: 'Utils',
    method: 'validateBufferIntegrity',
    requestId,
    length: buffer.length
  });
  
  return true;
}

/**
 * Verifies that two RODiT hash inputs have matching required fields
 * 
 * @param {Object} portalData - First RODiT metadata
 * @param {Object} sanctumData - Second RODiT metadata
 * @returns {boolean} True if hash inputs match
 */
function verifyHashInputs(portalData, sanctumData) {
  const requiredFields = [
    "token_id",
    "openapijson_url",
    "not_after",
    "not_before",
    "max_requests",
    "maxrq_window",
    "webhook_cidr",
    "allowed_cidr",
    "allowed_iso3166list",
    "jwt_duration",
    "permissioned_routes",
    "serviceprovider_id",
    "subjectuniqueidentifier_url",
  ];

  const portalMissing = requiredFields.filter(
    (field) => !portalData.hasOwnProperty(field)
  );
  const sanctumMissing = requiredFields.filter(
    (field) => !sanctumData.hasOwnProperty(field)
  );

  if (portalMissing.length > 0 || sanctumMissing.length > 0) {
    throw new Error("Missing required fields");
  }

  // Verify matching fields except token_id and serviceprovider_id
  const mismatchedFields = requiredFields
    .filter((field) => !["token_id", "serviceprovider_id"].includes(field))
    .filter((field) => portalData[field] !== sanctumData[field]);

  if (mismatchedFields.length > 0) {
    throw new Error(`Mismatched fields: ${mismatchedFields.join(", ")}`);
  }

  return true;
}


/**
 * Verify fee signature before minting
 * This function validates a fee signature using the same approach as the contract
 * 
 * @param {string} feeDataJson - Fee data as a JSON string (already canonicalized)
 * @param {string} feeSignatureBase64url - Fee signature in base64url format
 * @param {Uint8Array} authorizedSignerPublicKey - Public key of the authorized signer
 * @returns {Object} - Result object with success flag and error message if applicable
 */
function verifyFeeSignatureBeforeMinting(feeDataJson, feeSignatureBase64url, authorizedSignerPublicKey) {
  const requestId = ulid();
  const startTime = Date.now();

  try {
    logger.debug("Starting fee signature verification", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
      feeDataJson: feeDataJson?.substring(0, 50) + "...",
      feeSignatureBase64url: feeSignatureBase64url?.substring(0, 20) + "...",
      publicKeyLength: authorizedSignerPublicKey?.length,
    });

    // Validate inputs
    if (!feeDataJson) {
      logger.error("Missing fee data JSON", {
        component: "verifyFeeSignatureBeforeMinting",
        requestId,
      });
      return { success: false, error: "Missing fee data JSON" };
    }

    if (!feeSignatureBase64url) {
      logger.error("Missing fee signature", {
        component: "verifyFeeSignatureBeforeMinting",
        requestId,
      });
      return { success: false, error: "Missing fee signature" };
    }

    if (!authorizedSignerPublicKey) {
      logger.error("Missing authorized signer public key", {
        component: "verifyFeeSignatureBeforeMinting",
        requestId,
      });
      return { success: false, error: "Missing authorized signer public key" };
    }

    // Parse the JSON string to validate it
    let feeData;
    try {
      feeData = JSON.parse(feeDataJson);
    } catch (e) {
      logger.error("Failed to parse fee data JSON", {
        component: "verifyFeeSignatureBeforeMinting",
        requestId,
        error: e.message,
      });
      return { success: false, error: `Invalid fee data JSON: ${e.message}` };
    }

    logger.debug("Parsed fee data", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
      feeData,
    });

    // Step 1: Use the JSON string directly (it's already canonicalized)
    logger.debug("Using canonicalized JSON string", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
    });

    // Step 2: Calculate hash using SHA-512 (nacl.hash uses SHA-512, same as contract)
    const nacl = require("tweetnacl");
    const { decodeUTF8 } = require("tweetnacl-util");

    logger.debug("Calculating SHA-512 hash", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
    });

    const canonicalMessageBytes = decodeUTF8(feeDataJson);
    const hashUint8 = nacl.hash(canonicalMessageBytes);

    // Convert hash to hex for logging
    const hashHex = Array.from(hashUint8)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    logger.debug("Hash calculation complete", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
      hashLength: hashUint8.length,
      hashHex: hashHex.substring(0, 20) + "...",
    });

    // Step 3: Convert base64url signature to bytes
    logger.debug("Converting signature from base64url", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
    });

    const signatureBytes = bufferUtils.base64urlToUint8Array(feeSignatureBase64url);

    logger.debug("Signature conversion complete", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
      signatureBytesLength: signatureBytes.length,
    });

    // Validate signature length (Ed25519 signatures are 64 bytes)
    if (signatureBytes.length !== 64) {
      logger.error("Invalid signature length", {
        component: "verifyFeeSignatureBeforeMinting",
        requestId,
        expectedLength: 64,
        actualLength: signatureBytes.length,
      });
      return { success: false, error: `Invalid signature length: expected 64 bytes, got ${signatureBytes.length}` };
    }

    // Step 4: Verify signature
    logger.debug("Verifying signature with authorized signer public key", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
      publicKeyFingerprint: Array.from(authorizedSignerPublicKey.slice(0, 8))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" "),
    });

    const isValid = nacl.sign.detached.verify(
      hashUint8,
      signatureBytes,
      authorizedSignerPublicKey
    );

    const duration = Date.now() - startTime;

    if (isValid) {
      logger.info("Fee signature verified successfully", {
        component: "verifyFeeSignatureBeforeMinting",
        requestId,
        duration,
      });

      // Emit metrics for Grafana dashboards
      logger.metric("fee_signature_verification_duration_ms", duration, {
        component: "verifyFeeSignatureBeforeMinting",
        success: true,
      });

      return { success: true };
    } else {
      logger.error("Fee signature verification failed", {
        component: "verifyFeeSignatureBeforeMinting",
        requestId,
        duration,
      });

      // Emit metrics for Grafana dashboards
      logger.metric("fee_signature_verification_duration_ms", duration, {
        component: "verifyFeeSignatureBeforeMinting",
        success: false,
      });
      logger.metric("fee_signature_verification_errors_total", 1, {
        component: "verifyFeeSignatureBeforeMinting",
        reason: "verification_failed",
      });

      return { success: false, error: "Fee signature verification failed" };
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Fee signature verification error", {
      component: "verifyFeeSignatureBeforeMinting",
      requestId,
      duration,
      error: error.message,
      stack: error.stack,
    });

    // Emit metrics for Grafana dashboards
    logger.metric("fee_signature_verification_duration_ms", duration, {
      component: "verifyFeeSignatureBeforeMinting",
      success: false,
    });
    logger.metric("fee_signature_verification_errors_total", 1, {
      component: "verifyFeeSignatureBeforeMinting",
      errorType: error.constructor.name,
    });

    return { success: false, error: error.message };
  }
}


/**
 * Buffer utility functions for data conversion
 */
const bufferUtils = {
  /**
   * Converts a hex string to Uint8Array
   * 
   * @param {string} hexString - Hex string to convert
   * @returns {Uint8Array} Converted bytes
   */
  hexToUint8Array: (hexString) => {
    const matches = hexString.match(/.{1,2}/g) || [];
    return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
  },

  /**
   * Converts a base64url string to Uint8Array
   * 
   * @param {string} base64url - Base64url string to convert
   * @returns {Uint8Array} Converted bytes
   */
  base64urlToUint8Array: (base64url) => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  },

  /**
   * Converts a Uint8Array to base64url string
   * 
   * @param {Uint8Array} uint8Array - Bytes to convert
   * @returns {string} Base64url string
   */
  uint8ArrayToBase64url: (uint8Array) => {
    const binary = String.fromCharCode(...uint8Array);
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  },

  /**
   * Converts a hex string directly to base64url string
   * 
   * @param {string} hexString - Hex string to convert
   * @returns {string} Base64url string
   */
  hexToBase64Url: (hexString) => {
    logger.debug("Converting hex to base64url", {
      component: "utils",
      method: "hexToBase64Url",
      inputLength: hexString ? hexString.length : 0,
      hasInput: !!hexString,
    });
    
    // Ensure hexString is properly formatted
    if (!hexString || hexString.length % 2 !== 0) {
      logger.warn("Invalid hex string length detected", {
        component: "utils",
        method: "hexToBase64Url",
        length: hexString ? hexString.length : 0,
      });
      // If odd length, pad with a leading zero
      if (hexString && hexString.length % 2 !== 0) {
        hexString = '0' + hexString;
        logger.debug("Padded hex string for even length", {
          component: "utils",
          method: "hexToBase64Url",
          paddedLength: hexString.length,
        });
      }
    }
    
    const uint8Array = bufferUtils.hexToUint8Array(hexString);
    logger.debug("Converted to Uint8Array", {
      component: "utils",
      method: "hexToBase64Url",
      uint8ArrayLength: uint8Array.length,
    });
    
    const base64 = encodeBase64(uint8Array); // Using tweetnacl-util
    const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    
    logger.debug("Base64url conversion completed", {
      component: "utils",
      method: "hexToBase64Url",
      outputLength: base64url.length,
    });
    return base64url;
  },
};


module.exports = {
  debugWithType,
  base64ToBase64Url,
  canonicalizeObject,
  calculateCanonicalHash,
  base64url2jwk_public_key,
  jwtVerify_fe,
  verifyRoditSignature,
  validateBufferIntegrity,
  verifyHashInputs,
  verifyFeeSignatureBeforeMinting,
  bufferUtils,
  validateAndSetUrl,
  validateAndSetDate,
  validateAndSetJson,
  validateAndSetSignature,
  validateSignatureFormat,
  validatePublicKeyFormat,
};
