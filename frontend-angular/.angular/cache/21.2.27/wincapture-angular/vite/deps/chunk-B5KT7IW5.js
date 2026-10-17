import {
  AADServerParamKeys_exports,
  ACCOUNT_SCHEMA_VERSION,
  AccountEntityUtils_exports,
  AcquireTokenByCodeAsync,
  AcquireTokenByRefreshToken,
  AcquireTokenBySilentIframe,
  AcquireTokenFromCache,
  AcquireTokenSilentAsync,
  ApiId,
  AuthClientAcquireToken,
  AuthError,
  AuthErrorCodes_exports,
  AuthToken_exports,
  Authority,
  AuthorityFactoryCreateDiscoveredInstance,
  AuthorityFactory_exports,
  AuthorityType,
  AuthorizationCodeClient,
  Authorize_exports,
  AwaitConcurrentIframe,
  BROWSER_PERF_ENABLED_KEY,
  Base64Decode,
  BrowserAuthError,
  BrowserCacheLocation,
  BrowserConstants,
  CACHE_KEY_SEPARATOR,
  CREDENTIAL_SCHEMA_VERSION,
  CacheError,
  CacheErrorCodes_exports,
  CacheHelpers_exports,
  CacheLookupPolicy,
  CacheManager,
  CcsCredentialType,
  ClientAuthError,
  ClientAuthErrorCodes_exports,
  ClientConfigurationErrorCodes_exports,
  Constants_exports,
  CryptoOptsGetPublicKeyThumbprint,
  CryptoOptsSignJwt,
  DB_NAME,
  DB_TABLE_NAME,
  DB_VERSION,
  DEFAULT_CRYPTO_IMPLEMENTATION,
  DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS,
  DEFAULT_REQUEST,
  DEFAULT_TOKEN_BINDING_KEY_MANAGER,
  Decrypt,
  DecryptEarResponse,
  DeserializeResponse,
  ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS,
  ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS,
  Encrypt,
  GenerateBaseKey,
  GenerateCodeChallengeFromVerifier,
  GenerateCodeVerifier,
  GenerateEarKey,
  GenerateHKDF,
  GeneratePkceCodes,
  GetRandomValues,
  GetStandardParams,
  HandleCodeResponse,
  HandleNativeRedirectPromiseMeasurement,
  HandleRedirectPromiseMeasurement,
  HandleResponseCode,
  HandleResponseEar,
  HandleResponsePlatformBroker,
  INTERACTION_TYPE,
  ImportExistingCache,
  InMemoryCacheKeys,
  InitializeBaseRequest,
  InitializeCache,
  InitializeSilentRequest,
  InteractionRequiredAuthError,
  InteractionRequiredAuthErrorCodes_exports,
  InteractionStatus,
  InteractionType,
  JsonWebTokenAlgorithms,
  LOG_LEVEL_CACHE_KEY,
  LOG_PII_CACHE_KEY,
  LoadAccessToken,
  LoadAccount,
  LoadIdToken,
  LoadRefreshToken,
  LogLevel,
  Logger,
  NativeExtensionMethod,
  NativeGenerateAuthResult,
  NativeInteractionClientAcquireToken,
  NativeInteractionClientAcquireTokenRedirect,
  NativeMessageHandlerHandshake,
  PREFIX,
  PerformanceClient,
  PerformanceEvents_exports,
  PlatformAuthCacheAccount,
  PlatformAuthCacheNativeTokens,
  PlatformAuthConstants,
  PlatformAuthDOMCreateProvider,
  PlatformAuthDOMGetSupportedContracts,
  PlatformAuthDOMGetToken,
  PlatformAuthDOMInitializeRequest,
  PlatformAuthDOMValidateResponse,
  PlatformAuthExtensionCreateProvider,
  PlatformAuthExtensionGetToken,
  PlatformAuthExtensionValidateResponse,
  PlatformAuthHandleNativeResponse,
  PlatformAuthInteractionClientInitializeRequest,
  PlatformAuthProviderDiscovery,
  PopTokenGenerator,
  ProtocolMode,
  ProtocolUtils_exports,
  RSA_KEYGEN_ALGORITHM_OPTIONS,
  RSA_SIGN_ALGORITHM_OPTIONS,
  RefreshTokenClient,
  RefreshTokenClientAcquireTokenByRefreshToken,
  RemoveHiddenIframe,
  RequestParameterBuilder_exports,
  ResponseHandler,
  SSO_CAPABLE,
  ScopeSet,
  ServerError,
  ServerTelemetryManager,
  Sha256Digest,
  SilentCacheClientAcquireToken,
  SilentFlowClient,
  SilentFlowClientAcquireCachedToken,
  SilentHandlerInitiateAuthRequest,
  SilentHandlerMonitorIframeForHash,
  SilentIframeClientAcquireToken,
  SilentIframeClientTokenHelper,
  SilentRefreshClientAcquireToken,
  StandardInteractionClientCreateAuthCodeClient,
  StandardInteractionClientGetClientConfiguration,
  StandardInteractionClientGetDiscoveredAuthority,
  StandardInteractionClientInitializeAuthorizationRequest,
  StringUtils,
  StubPerformanceClient,
  StubServerTelemetryManager,
  TemporaryCacheKeys,
  ThrottlingUtils,
  TimeUtils_exports,
  UrlEncodeArr,
  UrlString,
  UrlUtils_exports,
  VERSION_CACHE_KEY,
  apiIdToName,
  authCodeOrNativeAccountIdRequired,
  authCodeRequired,
  base64DecToArr,
  base64Decode,
  base64Encode,
  blockAPICallsBeforeInitialize,
  blockNonBrowserEnvironment,
  buildAccountToCache,
  buildConfiguration,
  buildStaticAuthorityOptions,
  buildTenantProfile,
  cancelPendingBridgeResponse,
  clearHash,
  computeJwkThumbprint,
  createAuthError,
  createBrowserAuthError,
  createBrowserConfigurationAuthError,
  createCacheError,
  createClientAuthError,
  createClientConfigurationError,
  createGuid,
  createInteractionRequiredAuthError,
  createNewGuid,
  cryptoKeyNotFound,
  databaseNotOpen,
  databaseUnavailable,
  decrypt,
  decryptEarResponse,
  earJweEmpty,
  earJwkEmpty,
  emptyNavigateUri,
  emptyWindowError,
  encrypt,
  enforceResourceParameter,
  exportJwk,
  generateBaseKey,
  generateEarKey,
  generateHKDF,
  generateKeyPair,
  getAccountKeysCacheKey,
  getCurrentUri,
  getDefaultErrorMessage,
  getHomepage,
  getRandomValues,
  getRequestThumbprint,
  getTenantIdFromIdTokenClaims,
  getTokenKeysCacheKey,
  hashDoesNotContainKnownProperties,
  hashEmptyError,
  hashString,
  iFrameRenewalPolicies,
  interactionInProgress,
  invalidPopTokenRequest,
  invalidPublicJwk,
  invoke,
  invokeAsync,
  isInIframe,
  name,
  nativeConnectionNotEstablished,
  nativeExtensionNotInstalled,
  nativeHandshakeTimeout,
  nativePromptNotSupported,
  noAccountError,
  noNetworkConnectivity,
  noStateInHash,
  noTokenRequestCacheError,
  pkceNotCreated,
  popupRelayUnsupportedFlow,
  popupWindowError,
  preconnect,
  preflightCheck,
  redirectBridgeEmptyResponse,
  redirectPreflightCheck,
  replaceHash,
  sha256Digest,
  sign,
  silentLogoutUnsupported,
  spaCodeAndNativeAccountIdPresent,
  stateInteractionTypeMismatch,
  storageNotSupported,
  stubbedPublicClientApplicationCalled,
  timedOut,
  tokenBindingKeyAlgorithmMismatch,
  tokenBindingKeyJwkThumbprintMismatch,
  unableToAcquireTokenFromNativePlatform,
  unableToLoadToken,
  unableToParseState,
  unableToParseTokenRequestCacheError,
  uninitializedPublicClientApplication,
  unsupportedTokenBindingAlgorithm,
  updateAccountTenantProfileData,
  urlEncode,
  urlEncodeArr,
  userCancelled,
  validateCryptoAvailable,
  version,
  waitForBridgeResponse
} from "./chunk-25LGWSWQ.js";
import {
  __async,
  __export,
  __objRest,
  __restKey,
  __spreadProps,
  __spreadValues,
  __superGet
} from "./chunk-PSGY5PZF.js";

// node_modules/@azure/msal-browser/dist/cache/DatabaseStorage.mjs
var DatabaseStorage = class {
  constructor() {
    this.dbName = DB_NAME;
    this.version = DB_VERSION;
    this.tableName = DB_TABLE_NAME;
    this.dbOpen = false;
  }
  /**
   * Opens IndexedDB instance.
   */
  open() {
    return __async(this, null, function* () {
      return new Promise((resolve, reject) => {
        const openDB = window.indexedDB.open(this.dbName, this.version);
        openDB.addEventListener("upgradeneeded", (e) => {
          const event = e;
          event.target.result.createObjectStore(this.tableName);
        });
        openDB.addEventListener("success", (e) => {
          const event = e;
          this.db = event.target.result;
          this.dbOpen = true;
          resolve();
        });
        openDB.addEventListener("error", () => reject(createBrowserAuthError(databaseUnavailable, "")));
      });
    });
  }
  /**
   * Closes the connection to IndexedDB database when all pending transactions
   * complete.
   */
  closeConnection() {
    const db = this.db;
    if (db && this.dbOpen) {
      db.close();
      this.dbOpen = false;
    }
  }
  /**
   * Opens database if it's not already open
   */
  validateDbIsOpen() {
    return __async(this, null, function* () {
      if (!this.dbOpen) {
        return this.open();
      }
    });
  }
  /**
   * Retrieves item from IndexedDB instance.
   * @param key
   */
  getItem(key) {
    return __async(this, null, function* () {
      yield this.validateDbIsOpen();
      return new Promise((resolve, reject) => {
        if (!this.db) {
          return reject(createBrowserAuthError(databaseNotOpen, ""));
        }
        const transaction = this.db.transaction([this.tableName], "readonly");
        const objectStore = transaction.objectStore(this.tableName);
        const dbGet = objectStore.get(key);
        dbGet.addEventListener("success", (e) => {
          const event = e;
          this.closeConnection();
          resolve(event.target.result);
        });
        dbGet.addEventListener("error", (e) => {
          this.closeConnection();
          reject(e);
        });
      });
    });
  }
  /**
   * Adds item to IndexedDB under given key
   * @param key
   * @param payload
   */
  setItem(key, payload) {
    return __async(this, null, function* () {
      yield this.validateDbIsOpen();
      return new Promise((resolve, reject) => {
        if (!this.db) {
          return reject(createBrowserAuthError(databaseNotOpen, ""));
        }
        const transaction = this.db.transaction([this.tableName], "readwrite");
        const objectStore = transaction.objectStore(this.tableName);
        const dbPut = objectStore.put(payload, key);
        dbPut.addEventListener("success", () => {
          this.closeConnection();
          resolve();
        });
        dbPut.addEventListener("error", (e) => {
          this.closeConnection();
          reject(e);
        });
      });
    });
  }
  /**
   * Removes item from IndexedDB under given key
   * @param key
   */
  removeItem(key) {
    return __async(this, null, function* () {
      yield this.validateDbIsOpen();
      return new Promise((resolve, reject) => {
        if (!this.db) {
          return reject(createBrowserAuthError(databaseNotOpen, ""));
        }
        const transaction = this.db.transaction([this.tableName], "readwrite");
        const objectStore = transaction.objectStore(this.tableName);
        const dbDelete = objectStore.delete(key);
        dbDelete.addEventListener("success", () => {
          this.closeConnection();
          resolve();
        });
        dbDelete.addEventListener("error", (e) => {
          this.closeConnection();
          reject(e);
        });
      });
    });
  }
  /**
   * Get all the keys from the storage object as an iterable array of strings.
   */
  getKeys() {
    return __async(this, null, function* () {
      yield this.validateDbIsOpen();
      return new Promise((resolve, reject) => {
        if (!this.db) {
          return reject(createBrowserAuthError(databaseNotOpen, ""));
        }
        const transaction = this.db.transaction([this.tableName], "readonly");
        const objectStore = transaction.objectStore(this.tableName);
        const dbGetKeys = objectStore.getAllKeys();
        dbGetKeys.addEventListener("success", (e) => {
          const event = e;
          this.closeConnection();
          resolve(event.target.result);
        });
        dbGetKeys.addEventListener("error", (e) => {
          this.closeConnection();
          reject(e);
        });
      });
    });
  }
  /**
   *
   * Checks whether there is an object under the search key in the object store
   */
  containsKey(key) {
    return __async(this, null, function* () {
      yield this.validateDbIsOpen();
      return new Promise((resolve, reject) => {
        if (!this.db) {
          return reject(createBrowserAuthError(databaseNotOpen, ""));
        }
        const transaction = this.db.transaction([this.tableName], "readonly");
        const objectStore = transaction.objectStore(this.tableName);
        const dbContainsKey = objectStore.count(key);
        dbContainsKey.addEventListener("success", (e) => {
          const event = e;
          this.closeConnection();
          resolve(event.target.result === 1);
        });
        dbContainsKey.addEventListener("error", (e) => {
          this.closeConnection();
          reject(e);
        });
      });
    });
  }
  /**
   * Deletes the MSAL database. The database is deleted rather than cleared to make it possible
   * for client applications to downgrade to a previous MSAL version without worrying about forward compatibility issues
   * with IndexedDB database versions.
   */
  deleteDatabase() {
    return __async(this, null, function* () {
      if (this.db && this.dbOpen) {
        this.closeConnection();
      }
      return new Promise((resolve, reject) => {
        const deleteDbRequest = window.indexedDB.deleteDatabase(DB_NAME);
        const id = setTimeout(() => reject(false), 200);
        deleteDbRequest.addEventListener("success", () => {
          clearTimeout(id);
          return resolve(true);
        });
        deleteDbRequest.addEventListener("blocked", () => {
          clearTimeout(id);
          return resolve(true);
        });
        deleteDbRequest.addEventListener("error", () => {
          clearTimeout(id);
          return reject(false);
        });
      });
    });
  }
};

// node_modules/@azure/msal-browser/dist/cache/MemoryStorage.mjs
var MemoryStorage = class {
  constructor() {
    this.cache = /* @__PURE__ */ new Map();
  }
  initialize() {
    return __async(this, null, function* () {
    });
  }
  getItem(key) {
    return this.cache.get(key) || null;
  }
  getUserData(key) {
    return this.getItem(key);
  }
  setItem(key, value) {
    this.cache.set(key, value);
  }
  setUserData(key, value) {
    return __async(this, null, function* () {
      this.setItem(key, value);
    });
  }
  removeItem(key) {
    this.cache.delete(key);
  }
  getKeys() {
    const cacheKeys = [];
    this.cache.forEach((value, key) => {
      cacheKeys.push(key);
    });
    return cacheKeys;
  }
  containsKey(key) {
    return this.cache.has(key);
  }
  clear() {
    this.cache.clear();
  }
  decryptData() {
    return Promise.resolve(null);
  }
};

// node_modules/@azure/msal-browser/dist/cache/AsyncMemoryStorage.mjs
var AsyncMemoryStorage = class {
  constructor(logger) {
    this.inMemoryCache = new MemoryStorage();
    this.indexedDBCache = new DatabaseStorage();
    this.logger = logger;
  }
  handleDatabaseAccessError(error, correlationId) {
    if (error instanceof BrowserAuthError && error.errorCode === databaseUnavailable) {
      this.logger.error("1wx7zz", correlationId);
    } else {
      throw error;
    }
  }
  /**
   * Get the item matching the given key. Tries in-memory cache first, then in the asynchronous
   * storage object if item isn't found in-memory.
   * @param key
   * @param correlationId
   */
  getItem(key, correlationId) {
    return __async(this, null, function* () {
      const item = this.inMemoryCache.getItem(key);
      if (!item) {
        try {
          this.logger.verbose("0naxpl", correlationId);
          return yield this.indexedDBCache.getItem(key);
        } catch (e) {
          this.handleDatabaseAccessError(e, correlationId);
        }
      }
      return item;
    });
  }
  /**
   * Sets the item in the in-memory cache and then tries to set it in the asynchronous
   * storage object with the given key.
   * @param key
   * @param value
   * @param correlationId
   */
  setItem(key, value, correlationId) {
    return __async(this, null, function* () {
      this.inMemoryCache.setItem(key, value);
      try {
        yield this.indexedDBCache.setItem(key, value);
      } catch (e) {
        this.handleDatabaseAccessError(e, correlationId);
      }
    });
  }
  /**
   * Removes the item matching the key from the in-memory cache, then tries to remove it from the asynchronous storage object.
   * @param key
   * @param correlationId
   */
  removeItem(key, correlationId) {
    return __async(this, null, function* () {
      this.inMemoryCache.removeItem(key);
      try {
        yield this.indexedDBCache.removeItem(key);
      } catch (e) {
        this.handleDatabaseAccessError(e, correlationId);
      }
    });
  }
  /**
   * Get all keys from both in-memory and persistent storage.
   * @param correlationId
   */
  getKeys(correlationId) {
    return __async(this, null, function* () {
      const cacheKeys = this.inMemoryCache.getKeys();
      try {
        const persistentCacheKeys = yield this.indexedDBCache.getKeys();
        return Array.from(/* @__PURE__ */ new Set([...cacheKeys, ...persistentCacheKeys]));
      } catch (e) {
        this.handleDatabaseAccessError(e, correlationId);
        return cacheKeys;
      }
    });
  }
  /**
   * Returns true or false if the given key is present in the cache.
   * @param key
   * @param correlationId
   */
  containsKey(key, correlationId) {
    return __async(this, null, function* () {
      const containsKey = this.inMemoryCache.containsKey(key);
      if (!containsKey) {
        try {
          this.logger.verbose("03zl2j", correlationId);
          return yield this.indexedDBCache.containsKey(key);
        } catch (e) {
          this.handleDatabaseAccessError(e, correlationId);
        }
      }
      return containsKey;
    });
  }
  /**
   * Clears in-memory Map
   * @param correlationId
   */
  clearInMemory(correlationId) {
    this.logger.verbose("03r21p", correlationId);
    this.inMemoryCache.clear();
    this.logger.verbose("0uksk1", correlationId);
  }
  /**
   * Tries to delete the IndexedDB database
   * @param correlationId
   * @returns
   */
  clearPersistent(correlationId) {
    return __async(this, null, function* () {
      try {
        this.logger.verbose("0rdqut", correlationId);
        const dbDeleted = yield this.indexedDBCache.deleteDatabase();
        if (dbDeleted) {
          this.logger.verbose("149ouc", correlationId);
        }
        return dbDeleted;
      } catch (e) {
        this.handleDatabaseAccessError(e, correlationId);
        return false;
      }
    });
  }
};

// node_modules/@azure/msal-browser/dist/crypto/TokenBindingKeyManager.mjs
var TokenBindingKeyManager = class _TokenBindingKeyManager {
  constructor(logger, performanceClient) {
    this.logger = logger;
    this.cache = _TokenBindingKeyManager.getTokenBindingKeyStorage(this.logger);
    this.performanceClient = performanceClient;
  }
  static getTokenBindingKeyStorage(logger) {
    if (!_TokenBindingKeyManager.tokenBindingKeyStorage) {
      _TokenBindingKeyManager.tokenBindingKeyStorage = new AsyncMemoryStorage(logger);
    }
    return _TokenBindingKeyManager.tokenBindingKeyStorage;
  }
  /**
   * Provisions a browser token-binding key and returns its key identifier.
   * @param request - Key provisioning policy.
   */
  provisionTokenBindingKey(request) {
    return __async(this, null, function* () {
      const publicKeyThumbMeasurement = this.performanceClient?.startMeasurement(CryptoOptsGetPublicKeyThumbprint, request.correlationId);
      try {
        const activeKeyPair = yield this.createTokenBindingKey(request);
        publicKeyThumbMeasurement?.end(__spreadValues({
          success: true
        }, this.getTokenBindingKeyTelemetry(activeKeyPair)));
        return activeKeyPair.keyId;
      } catch (e) {
        publicKeyThumbMeasurement?.end({
          success: false,
          tokenBindingKeyType: request.tokenBindingKeyType,
          tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm
        });
        throw e;
      }
    });
  }
  /**
   * Removes a browser token-binding key by identifier.
   * @param kid - Token-binding key identifier.
   * @param correlationId - Request correlation identifier.
   */
  removeTokenBindingKey(kid, correlationId) {
    return __async(this, null, function* () {
      yield this.cache.removeItem(kid, correlationId);
      const keyFound = yield this.cache.containsKey(kid, correlationId);
      if (keyFound) {
        throw createClientAuthError(ClientAuthErrorCodes_exports.bindingKeyNotRemoved, correlationId);
      }
    });
  }
  /**
   * Clears browser token-binding keys from memory and persistent storage.
   * @param correlationId - Request correlation identifier.
   */
  clearKeystore(correlationId) {
    return __async(this, null, function* () {
      this.cache.clearInMemory(correlationId);
      try {
        yield this.cache.clearPersistent(correlationId);
        return true;
      } catch (e) {
        if (e instanceof Error) {
          this.logger.error(`1owpn8 ${e.message}`, correlationId);
        } else {
          this.logger.error("0yrmwo", correlationId);
        }
        return false;
      }
    });
  }
  /**
   * Gets a token-binding public key as a JWK by identifier.
   * @param keyId - Token-binding key identifier.
   * @param correlationId - Request correlation identifier.
   */
  getTokenBindingPublicKeyJwk(keyId, correlationId) {
    return __async(this, null, function* () {
      const cachedKeyPair = yield this.getTokenBindingKeyPair(keyId, correlationId);
      return exportJwk(cachedKeyPair.publicKey);
    });
  }
  createTokenBindingKey(request) {
    return __async(this, null, function* () {
      const keyGenAlgorithm = this.getTokenBindingKeyGenAlgorithmOptions(request.tokenBindingKeyAlgorithm, request.correlationId);
      const generatedKeyPair = yield this.generateKeyPairAndThumbprint(_TokenBindingKeyManager.TOKEN_BINDING_KEY_USAGES, keyGenAlgorithm, request.correlationId);
      yield this.cache.setItem(generatedKeyPair.keyId, __spreadProps(__spreadValues({}, generatedKeyPair), {
        tokenBindingKeyType: request.tokenBindingKeyType,
        tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm
      }), request.correlationId);
      return __spreadProps(__spreadValues({}, generatedKeyPair), {
        tokenBindingKeyType: request.tokenBindingKeyType,
        tokenBindingKeyAlgorithm: request.tokenBindingKeyAlgorithm
      });
    });
  }
  generateKeyPairAndThumbprint(usages, keyGenAlgorithm, correlationId) {
    return __async(this, null, function* () {
      const keyPair = yield generateKeyPair(false, usages, keyGenAlgorithm);
      const publicJwk = yield exportJwk(keyPair.publicKey);
      const keyId = yield computeJwkThumbprint(publicJwk, correlationId);
      return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        keyId
      };
    });
  }
  /** @internal */
  getTokenBindingKeyPair(keyId, correlationId) {
    return __async(this, null, function* () {
      const cachedKeyPair = yield this.cache.getItem(keyId, correlationId);
      if (!cachedKeyPair) {
        throw createBrowserAuthError(cryptoKeyNotFound, correlationId);
      }
      return cachedKeyPair;
    });
  }
  /** @internal */
  getTokenBindingKeyTelemetry(cachedKeyPair, fallbackAlgorithm) {
    return __spreadValues(__spreadValues({}, cachedKeyPair.tokenBindingKeyType && {
      tokenBindingKeyType: cachedKeyPair.tokenBindingKeyType
    }), cachedKeyPair.tokenBindingKeyAlgorithm || fallbackAlgorithm ? {
      tokenBindingKeyAlgorithm: cachedKeyPair.tokenBindingKeyAlgorithm || fallbackAlgorithm
    } : {});
  }
  getTokenBindingKeyGenAlgorithmOptions(tokenBindingKeyAlgorithm, correlationId) {
    if (tokenBindingKeyAlgorithm === JsonWebTokenAlgorithms.RS256) {
      return RSA_KEYGEN_ALGORITHM_OPTIONS;
    }
    if (tokenBindingKeyAlgorithm === JsonWebTokenAlgorithms.ES256) {
      return ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS;
    }
    throw createBrowserAuthError(unsupportedTokenBindingAlgorithm, correlationId);
  }
};
TokenBindingKeyManager.TOKEN_BINDING_KEY_USAGES = [
  "sign",
  "verify"
];

// node_modules/@azure/msal-browser/dist/crypto/CryptoOps.mjs
var CryptoOps = class {
  constructor(logger, performanceClient, skipValidateSubtleCrypto) {
    this.logger = logger;
    validateCryptoAvailable(skipValidateSubtleCrypto ?? false);
    this.performanceClient = performanceClient;
    this.tokenBindingKeyManager = new TokenBindingKeyManager(this.logger, this.performanceClient);
  }
  /**
   * Creates a new random GUID - used to populate state and nonce.
   * @returns string (GUID)
   */
  createNewGuid() {
    return createNewGuid();
  }
  /**
   * Encodes input string to base64.
   * @param input
   */
  base64Encode(input) {
    return base64Encode(input);
  }
  /**
   * Decodes input string from base64.
   * @param input
   */
  base64Decode(input) {
    return base64Decode(input);
  }
  /**
   * Encodes input string to base64 URL safe string.
   * @param input
   */
  base64UrlEncode(input) {
    return urlEncode(input);
  }
  /**
   * Stringifies and base64Url encodes input public key
   * @param inputKid
   * @returns Base64Url encoded public key
   */
  encodeKid(inputKid) {
    return this.base64UrlEncode(JSON.stringify({ kid: inputKid }));
  }
  /**
   * Removes cryptographic keypair from key store matching the keyId passed in
   * @param kid
   * @param correlationId
   */
  removeTokenBindingKey(kid, correlationId) {
    return __async(this, null, function* () {
      yield this.tokenBindingKeyManager.removeTokenBindingKey(kid, correlationId);
    });
  }
  /**
   * Removes all cryptographic keys from IndexedDB storage
   * @param correlationId
   */
  clearKeystore(correlationId) {
    return __async(this, null, function* () {
      return this.tokenBindingKeyManager.clearKeystore(correlationId);
    });
  }
  /** @internal */
  signTokenBindingJwt(header, payload, kid, correlationId) {
    return __async(this, null, function* () {
      let telemetry = {};
      const signTokenBindingJwtMeasurement = this.performanceClient?.startMeasurement(CryptoOptsSignJwt, correlationId);
      try {
        const cachedKeyPair = yield this.tokenBindingKeyManager.getTokenBindingKeyPair(kid, correlationId);
        yield this.validateTokenBindingJwtHeaderKey(header, kid, correlationId);
        telemetry = this.tokenBindingKeyManager.getTokenBindingKeyTelemetry(cachedKeyPair, header.alg);
        const signingAlgorithm = this.getTokenBindingKeySigningAlgorithm(cachedKeyPair, header.alg, correlationId);
        const tokenString = `${urlEncode(JSON.stringify(header))}.${urlEncode(JSON.stringify(payload))}`;
        const encodedSignature = yield this.signInput(cachedKeyPair, tokenString, signingAlgorithm);
        signTokenBindingJwtMeasurement?.end(__spreadValues({
          success: true
        }, telemetry));
        return `${tokenString}.${encodedSignature}`;
      } catch (e) {
        signTokenBindingJwtMeasurement?.end(__spreadValues({
          success: false
        }, telemetry));
        throw e;
      }
    });
  }
  /**
   * Returns the SHA-256 hash of an input string
   * @param plainText
   */
  hashString(plainText) {
    return __async(this, null, function* () {
      return hashString(plainText);
    });
  }
  signInput(cachedKeyPair, signingInput, algorithm) {
    return __async(this, null, function* () {
      const encoder = new TextEncoder();
      const signatureBuffer = yield sign(cachedKeyPair.privateKey, encoder.encode(signingInput), algorithm);
      return urlEncodeArr(new Uint8Array(signatureBuffer));
    });
  }
  getTokenBindingKeySigningAlgorithm(cachedKeyPair, requestedAlgorithm, correlationId) {
    const keyAlgorithm = cachedKeyPair.privateKey.algorithm;
    if (requestedAlgorithm === JsonWebTokenAlgorithms.RS256 && keyAlgorithm.name === RSA_SIGN_ALGORITHM_OPTIONS.name) {
      return RSA_SIGN_ALGORITHM_OPTIONS;
    }
    if (requestedAlgorithm === JsonWebTokenAlgorithms.ES256 && keyAlgorithm.name === ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS.name && keyAlgorithm.namedCurve === ECDSA_P256_KEYGEN_ALGORITHM_OPTIONS.namedCurve) {
      return ECDSA_SHA256_SIGN_ALGORITHM_OPTIONS;
    }
    if (requestedAlgorithm === JsonWebTokenAlgorithms.RS256 || requestedAlgorithm === JsonWebTokenAlgorithms.ES256) {
      throw createBrowserAuthError(unsupportedTokenBindingAlgorithm, correlationId, tokenBindingKeyAlgorithmMismatch);
    }
    throw createBrowserAuthError(unsupportedTokenBindingAlgorithm, correlationId);
  }
  validateTokenBindingJwtHeaderKey(header, kid, correlationId) {
    return __async(this, null, function* () {
      if (!header.jwk) {
        return;
      }
      const headerKeyId = yield computeJwkThumbprint(header.jwk, correlationId);
      if (headerKeyId !== kid) {
        throw createBrowserAuthError(invalidPublicJwk, correlationId, tokenBindingKeyJwkThumbprintMismatch);
      }
    });
  }
};

// node_modules/@azure/msal-browser/dist/telemetry/BrowserRootPerformanceEvents.mjs
var BrowserRootPerformanceEvents_exports = {};
__export(BrowserRootPerformanceEvents_exports, {
  AcquireTokenByCode: () => AcquireTokenByCode,
  AcquireTokenPopup: () => AcquireTokenPopup,
  AcquireTokenPreRedirect: () => AcquireTokenPreRedirect,
  AcquireTokenRedirect: () => AcquireTokenRedirect,
  AcquireTokenSilent: () => AcquireTokenSilent,
  InitializeClientApplication: () => InitializeClientApplication,
  LoadExternalTokens: () => LoadExternalTokens,
  LocalStorageUpdated: () => LocalStorageUpdated,
  SsoCapable: () => SsoCapable,
  SsoSilent: () => SsoSilent,
  WaitForBridgeLateResponse: () => WaitForBridgeLateResponse
});
var AcquireTokenSilent = "acquireTokenSilent";
var AcquireTokenByCode = "acquireTokenByCode";
var AcquireTokenPopup = "acquireTokenPopup";
var AcquireTokenPreRedirect = "acquireTokenPreRedirect";
var AcquireTokenRedirect = "acquireTokenRedirect";
var SsoSilent = "ssoSilent";
var InitializeClientApplication = "initializeClientApplication";
var LocalStorageUpdated = "localStorageUpdated";
var LoadExternalTokens = "loadExternalTokens";
var SsoCapable = "ssoCapable";
var WaitForBridgeLateResponse = "waitForBridgeLateResponse";

// node_modules/@azure/msal-browser/dist/cache/CookieStorage.mjs
var COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1e3;
var SameSiteOptions = {
  Lax: "Lax",
  None: "None"
};
var CookieStorage = class {
  initialize() {
    return Promise.resolve();
  }
  getItem(key) {
    const name2 = encodeURIComponent(key);
    const cookieList = document.cookie.split(";");
    for (let i = 0; i < cookieList.length; i++) {
      const cookie = cookieList[i].trim();
      const eqIndex = cookie.indexOf("=");
      const rawKey = eqIndex === -1 ? cookie : cookie.substring(0, eqIndex);
      if (rawKey === name2) {
        const rawValue = eqIndex === -1 ? "" : cookie.substring(eqIndex + 1);
        try {
          return decodeURIComponent(rawValue);
        } catch (e) {
          return rawValue;
        }
      }
    }
    return "";
  }
  getUserData() {
    throw createClientAuthError(ClientAuthErrorCodes_exports.methodNotImplemented, "");
  }
  setItem(key, value, cookieLifeDays, secure = true, sameSite = SameSiteOptions.Lax) {
    let cookieStr = `${encodeURIComponent(key)}=${encodeURIComponent(value)};path=/;SameSite=${sameSite};`;
    if (cookieLifeDays) {
      const expireTime = getCookieExpirationTime(cookieLifeDays);
      cookieStr += `expires=${expireTime};`;
    }
    if (secure || sameSite === SameSiteOptions.None) {
      cookieStr += "Secure;";
    }
    document.cookie = cookieStr;
  }
  setUserData(_key, _value, correlationId) {
    return __async(this, null, function* () {
      return Promise.reject(createClientAuthError(ClientAuthErrorCodes_exports.methodNotImplemented, correlationId));
    });
  }
  removeItem(key) {
    this.setItem(key, "", -1);
  }
  getKeys() {
    const cookieList = document.cookie.split(";");
    const keys = [];
    cookieList.forEach((cookie) => {
      const trimmed = cookie.trim();
      const eqIndex = trimmed.indexOf("=");
      const rawKey = eqIndex === -1 ? trimmed : trimmed.substring(0, eqIndex);
      try {
        keys.push(decodeURIComponent(rawKey));
      } catch (e) {
      }
    });
    return keys;
  }
  containsKey(key) {
    return this.getKeys().includes(key);
  }
  decryptData() {
    return Promise.resolve(null);
  }
};
function getCookieExpirationTime(cookieLifeDays) {
  const today = /* @__PURE__ */ new Date();
  const expr = new Date(today.getTime() + cookieLifeDays * COOKIE_LIFE_MULTIPLIER);
  return expr.toUTCString();
}

// node_modules/@azure/msal-browser/dist/cache/CacheHelpers.mjs
function getAccountKeys(storage, schemaVersion) {
  const accountKeys = storage.getItem(getAccountKeysCacheKey(schemaVersion));
  if (accountKeys) {
    return JSON.parse(accountKeys);
  }
  return [];
}
function getTokenKeys(clientId, storage, schemaVersion) {
  const item = storage.getItem(getTokenKeysCacheKey(clientId, schemaVersion));
  if (item) {
    const tokenKeys = JSON.parse(item);
    if (tokenKeys && tokenKeys.hasOwnProperty("idToken") && tokenKeys.hasOwnProperty("accessToken") && tokenKeys.hasOwnProperty("refreshToken")) {
      return tokenKeys;
    }
  }
  return {
    idToken: [],
    accessToken: [],
    refreshToken: []
  };
}

// node_modules/@azure/msal-browser/dist/cache/EncryptedData.mjs
function isEncrypted(data) {
  return data.hasOwnProperty("id") && data.hasOwnProperty("nonce") && data.hasOwnProperty("data");
}

// node_modules/@azure/msal-browser/dist/cache/LocalStorage.mjs
var ENCRYPTION_KEY = "msal.cache.encryption";
var BROADCAST_CHANNEL_NAME = "msal.broadcast.cache";
var LocalStorage = class {
  constructor(clientId, logger, performanceClient) {
    if (!window.localStorage) {
      throw createBrowserConfigurationAuthError(storageNotSupported, "");
    }
    this.memoryStorage = new MemoryStorage();
    this.initialized = false;
    this.clientId = clientId;
    this.logger = logger;
    this.performanceClient = performanceClient;
    this.broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
  initialize(correlationId) {
    return __async(this, null, function* () {
      const cookies = new CookieStorage();
      const cookieString = cookies.getItem(ENCRYPTION_KEY);
      let parsedCookie = { key: "", id: "" };
      if (cookieString) {
        try {
          parsedCookie = JSON.parse(cookieString);
        } catch (e) {
        }
      }
      if (parsedCookie.key && parsedCookie.id) {
        const baseKey = invoke(base64DecToArr, Base64Decode, this.logger, this.performanceClient, correlationId)(parsedCookie.key);
        this.encryptionCookie = {
          id: parsedCookie.id,
          key: yield invokeAsync(generateHKDF, GenerateHKDF, this.logger, this.performanceClient, correlationId)(baseKey)
        };
      } else {
        const id = createNewGuid();
        const baseKey = yield invokeAsync(generateBaseKey, GenerateBaseKey, this.logger, this.performanceClient, correlationId)();
        const keyStr = invoke(urlEncodeArr, UrlEncodeArr, this.logger, this.performanceClient, correlationId)(new Uint8Array(baseKey));
        this.encryptionCookie = {
          id,
          key: yield invokeAsync(generateHKDF, GenerateHKDF, this.logger, this.performanceClient, correlationId)(baseKey)
        };
        const cookieData = {
          id,
          key: keyStr
        };
        cookies.setItem(
          ENCRYPTION_KEY,
          JSON.stringify(cookieData),
          0,
          // Expiration - 0 means cookie will be cleared at the end of the browser session
          true,
          // Secure flag
          SameSiteOptions.None
          // SameSite must be None to support iframed apps
        );
      }
      yield invokeAsync(this.importExistingCache.bind(this), ImportExistingCache, this.logger, this.performanceClient, correlationId)(correlationId);
      this.broadcast.addEventListener("message", (event) => {
        this.updateCache(event, correlationId).catch(() => {
          this.logger.error("0ufnan", correlationId);
        });
      });
      this.initialized = true;
    });
  }
  getItem(key) {
    return window.localStorage.getItem(key);
  }
  getUserData(key) {
    if (!this.initialized) {
      throw createBrowserAuthError(uninitializedPublicClientApplication, "");
    }
    return this.memoryStorage.getItem(key);
  }
  decryptData(key, data, correlationId) {
    return __async(this, null, function* () {
      if (!this.initialized || !this.encryptionCookie) {
        throw createBrowserAuthError(uninitializedPublicClientApplication, "");
      }
      if (data.id !== this.encryptionCookie.id) {
        this.performanceClient.incrementFields({ encryptedCacheExpiredCount: 1 }, correlationId);
        return null;
      }
      const decryptedData = yield invokeAsync(decrypt, Decrypt, this.logger, this.performanceClient, correlationId)(this.encryptionCookie.key, data.nonce, this.getContext(key), data.data);
      if (!decryptedData) {
        return null;
      }
      try {
        return __spreadProps(__spreadValues({}, JSON.parse(decryptedData)), {
          lastUpdatedAt: data.lastUpdatedAt
        });
      } catch (e) {
        this.performanceClient.incrementFields({ encryptedCacheCorruptionCount: 1 }, correlationId);
        return null;
      }
    });
  }
  setItem(key, value) {
    window.localStorage.setItem(key, value);
  }
  setUserData(key, value, correlationId, timestamp, kmsi) {
    return __async(this, null, function* () {
      if (!this.initialized || !this.encryptionCookie) {
        throw createBrowserAuthError(uninitializedPublicClientApplication, "");
      }
      if (kmsi) {
        this.setItem(key, value);
      } else {
        const { data, nonce } = yield invokeAsync(encrypt, Encrypt, this.logger, this.performanceClient, correlationId)(this.encryptionCookie.key, value, this.getContext(key));
        const encryptedData = {
          id: this.encryptionCookie.id,
          nonce,
          data,
          lastUpdatedAt: timestamp
        };
        this.setItem(key, JSON.stringify(encryptedData));
      }
      this.memoryStorage.setItem(key, value);
      this.broadcast.postMessage({
        key,
        value,
        context: this.getBroadcastContext(key)
      });
    });
  }
  removeItem(key) {
    const itemExists = this.containsKey(key) || this.memoryStorage.containsKey(key);
    window.localStorage.removeItem(key);
    this.memoryStorage.removeItem(key);
    if (itemExists) {
      this.broadcast.postMessage({
        key,
        value: null,
        context: this.getBroadcastContext(key)
      });
    }
  }
  getKeys() {
    return Object.keys(window.localStorage);
  }
  containsKey(key) {
    return window.localStorage.hasOwnProperty(key);
  }
  /**
   * Removes all known MSAL keys from the cache
   */
  clear() {
    this.memoryStorage.clear();
    const accountKeys = getAccountKeys(this);
    accountKeys.forEach((key) => this.removeItem(key));
    const tokenKeys = getTokenKeys(this.clientId, this);
    tokenKeys.idToken.forEach((key) => this.removeItem(key));
    tokenKeys.accessToken.forEach((key) => this.removeItem(key));
    tokenKeys.refreshToken.forEach((key) => this.removeItem(key));
    this.getKeys().forEach((cacheKey) => {
      if (cacheKey.startsWith(PREFIX) || cacheKey.indexOf(this.clientId) !== -1) {
        this.removeItem(cacheKey);
      }
    });
  }
  /**
   * Helper to decrypt all known MSAL keys in localStorage and save them to inMemory storage
   * @returns
   */
  importExistingCache(correlationId) {
    return __async(this, null, function* () {
      if (!this.encryptionCookie) {
        return;
      }
      let accountKeys = getAccountKeys(this);
      accountKeys = yield this.importArray(accountKeys, correlationId);
      if (accountKeys.length) {
        this.setItem(getAccountKeysCacheKey(), JSON.stringify(accountKeys));
      } else {
        this.removeItem(getAccountKeysCacheKey());
      }
      const tokenKeys = getTokenKeys(this.clientId, this);
      tokenKeys.idToken = yield this.importArray(tokenKeys.idToken, correlationId);
      tokenKeys.accessToken = yield this.importArray(tokenKeys.accessToken, correlationId);
      tokenKeys.refreshToken = yield this.importArray(tokenKeys.refreshToken, correlationId);
      if (tokenKeys.idToken.length || tokenKeys.accessToken.length || tokenKeys.refreshToken.length) {
        this.setItem(getTokenKeysCacheKey(this.clientId), JSON.stringify(tokenKeys));
      } else {
        this.removeItem(getTokenKeysCacheKey(this.clientId));
      }
    });
  }
  /**
   * Helper to decrypt and save cache entries
   * @param key
   * @returns
   */
  getItemFromEncryptedCache(key, correlationId) {
    return __async(this, null, function* () {
      if (!this.encryptionCookie) {
        return null;
      }
      const rawCache = this.getItem(key);
      if (!rawCache) {
        return null;
      }
      let encObj;
      try {
        encObj = JSON.parse(rawCache);
      } catch (e) {
        return null;
      }
      if (!isEncrypted(encObj)) {
        this.performanceClient.incrementFields({ unencryptedCacheCount: 1 }, correlationId);
        return rawCache;
      }
      if (encObj.id !== this.encryptionCookie.id) {
        this.performanceClient.incrementFields({ encryptedCacheExpiredCount: 1 }, correlationId);
        return null;
      }
      this.performanceClient.incrementFields({ encryptedCacheCount: 1 }, correlationId);
      return invokeAsync(decrypt, Decrypt, this.logger, this.performanceClient, correlationId)(this.encryptionCookie.key, encObj.nonce, this.getContext(key), encObj.data);
    });
  }
  /**
   * Helper to decrypt and save an array of cache keys
   * @param arr
   * @returns Array of keys successfully imported
   */
  importArray(arr, correlationId) {
    return __async(this, null, function* () {
      const importedArr = [];
      const promiseArr = [];
      arr.forEach((key) => {
        const promise = this.getItemFromEncryptedCache(key, correlationId).then((value) => {
          if (value) {
            this.memoryStorage.setItem(key, value);
            importedArr.push(key);
          } else {
            this.removeItem(key);
          }
        });
        promiseArr.push(promise);
      });
      yield Promise.all(promiseArr);
      return importedArr;
    });
  }
  getContext(key) {
    return key.includes(this.clientId) ? this.clientId : "";
  }
  getBroadcastContext(key) {
    const normalizedKey = key.toLowerCase();
    const keySegments = normalizedKey.split(CACHE_KEY_SEPARATOR);
    if (keySegments.length > 1) {
      return keySegments[4] === this.clientId.toLowerCase() ? this.clientId : "";
    }
    const credentialType = this.getCredentialType(normalizedKey);
    if (credentialType) {
      const ownerPrefix = `-${credentialType}-${this.clientId.toLowerCase()}-`;
      return normalizedKey.includes(ownerPrefix) ? this.clientId : "";
    }
    return normalizedKey.includes(this.clientId.toLowerCase()) ? this.clientId : "";
  }
  getCredentialType(key) {
    const normalizedKey = key.toLowerCase();
    const keySegments = normalizedKey.split(CACHE_KEY_SEPARATOR);
    const structuredCredentialType = keySegments[3];
    return Object.values(Constants_exports.CredentialType).map((type) => type.toLowerCase()).find((type) => structuredCredentialType === type || normalizedKey.includes(`-${type}-`));
  }
  isFamilyRefreshToken(key, credentialType) {
    if (credentialType !== Constants_exports.CredentialType.REFRESH_TOKEN.toLowerCase()) {
      return false;
    }
    const normalizedKey = key.toLowerCase();
    const keySegments = normalizedKey.split(CACHE_KEY_SEPARATOR);
    return keySegments.length > 1 ? keySegments[4] === Constants_exports.THE_FAMILY_ID : normalizedKey.includes(`-${credentialType}-${Constants_exports.THE_FAMILY_ID}-`);
  }
  isContextValid(key, context) {
    const credentialType = this.getCredentialType(key);
    const isFamilyRefreshToken = credentialType && this.isFamilyRefreshToken(key, credentialType);
    const isClientBoundCredential = !!credentialType && !isFamilyRefreshToken;
    return (!isClientBoundCredential || !!context) && context === this.getBroadcastContext(key);
  }
  updateCache(event, correlationId) {
    return __async(this, null, function* () {
      this.logger.trace("17cxcm", correlationId);
      const perfMeasurement = this.performanceClient.startMeasurement(LocalStorageUpdated);
      perfMeasurement.add({ isBackground: true });
      const key = event.data?.key;
      const context = event.data?.context;
      if (typeof key !== "string" || !key) {
        this.logger.error("0e10qr", correlationId);
        perfMeasurement.end({ success: false, errorCode: "noKey" });
        return;
      }
      if (typeof context !== "string") {
        this.logger.error("16gtk4", correlationId);
        perfMeasurement.end({
          success: false,
          errorCode: "noContext"
        });
        return;
      }
      if (!this.isContextValid(key, context)) {
        this.logger.trace(`04rtdy ${context}`, correlationId);
        perfMeasurement.discard();
        return;
      }
      const persistedValue = this.getItem(key);
      try {
        const value = yield this.getItemFromEncryptedCache(key, correlationId);
        if (this.getItem(key) !== persistedValue) {
          perfMeasurement.discard();
          return;
        }
        if (!value) {
          this.memoryStorage.removeItem(key);
          this.logger.verbose("04ypih", correlationId);
        } else {
          this.memoryStorage.setItem(key, value);
          this.logger.verbose("1vzsgt", correlationId);
        }
        perfMeasurement.end({ success: true });
      } catch (e) {
        if (this.getItem(key) !== persistedValue) {
          perfMeasurement.discard();
          return;
        }
        this.memoryStorage.removeItem(key);
        this.logger.error("0flmza", correlationId);
        perfMeasurement.end({
          success: false,
          errorCode: "cacheUpdateFailed"
        });
      }
    });
  }
};

// node_modules/@azure/msal-browser/dist/cache/SessionStorage.mjs
var SessionStorage = class {
  constructor() {
    if (!window.sessionStorage) {
      throw createBrowserConfigurationAuthError(storageNotSupported, "");
    }
  }
  initialize() {
    return __async(this, null, function* () {
    });
  }
  getItem(key) {
    return window.sessionStorage.getItem(key);
  }
  getUserData(key) {
    return this.getItem(key);
  }
  setItem(key, value) {
    window.sessionStorage.setItem(key, value);
  }
  setUserData(key, value) {
    return __async(this, null, function* () {
      this.setItem(key, value);
    });
  }
  removeItem(key) {
    window.sessionStorage.removeItem(key);
  }
  getKeys() {
    return Object.keys(window.sessionStorage);
  }
  containsKey(key) {
    return window.sessionStorage.hasOwnProperty(key);
  }
  decryptData() {
    return Promise.resolve(null);
  }
};

// node_modules/@azure/msal-browser/dist/event/EventType.mjs
var EventType = {
  INITIALIZE_START: "msal:initializeStart",
  INITIALIZE_END: "msal:initializeEnd",
  ACTIVE_ACCOUNT_CHANGED: "msal:activeAccountChanged",
  LOGIN_SUCCESS: "msal:loginSuccess",
  ACQUIRE_TOKEN_START: "msal:acquireTokenStart",
  BROKERED_REQUEST_START: "msal:brokeredRequestStart",
  ACQUIRE_TOKEN_SUCCESS: "msal:acquireTokenSuccess",
  BROKERED_REQUEST_SUCCESS: "msal:brokeredRequestSuccess",
  ACQUIRE_TOKEN_FAILURE: "msal:acquireTokenFailure",
  BROKERED_REQUEST_FAILURE: "msal:brokeredRequestFailure",
  ACQUIRE_TOKEN_NETWORK_START: "msal:acquireTokenFromNetworkStart",
  HANDLE_REDIRECT_START: "msal:handleRedirectStart",
  HANDLE_REDIRECT_END: "msal:handleRedirectEnd",
  POPUP_OPENED: "msal:popupOpened",
  LOGOUT_START: "msal:logoutStart",
  LOGOUT_SUCCESS: "msal:logoutSuccess",
  LOGOUT_FAILURE: "msal:logoutFailure",
  LOGOUT_END: "msal:logoutEnd",
  RESTORE_FROM_BFCACHE: "msal:restoreFromBFCache",
  BROKER_CONNECTION_ESTABLISHED: "msal:brokerConnectionEstablished"
};

// node_modules/@azure/msal-browser/dist/utils/Helpers.mjs
function removeElementFromArray(array, element) {
  const index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
  }
}

// node_modules/@azure/msal-browser/dist/cache/BrowserCacheManager.mjs
var MigrationRemovalReason = {
  Invalid: "invalid",
  TtlExpired: "ttlExpired",
  DecryptFailed: "decryptFailed",
  Expired: "expired"
};
var BrowserCacheManager = class _BrowserCacheManager extends CacheManager {
  constructor(clientId, cacheConfig, cryptoImpl, logger, performanceClient, eventHandler, staticAuthorityOptions, tokenBindingKeyManager = DEFAULT_TOKEN_BINDING_KEY_MANAGER) {
    super(clientId, cryptoImpl, logger, performanceClient, staticAuthorityOptions, tokenBindingKeyManager);
    this.cacheConfig = cacheConfig;
    this.logger = logger;
    this.internalStorage = new MemoryStorage();
    this.browserStorage = getStorageImplementation(clientId, cacheConfig.cacheLocation, logger, performanceClient);
    this.temporaryCacheStorage = getStorageImplementation(clientId, BrowserCacheLocation.SessionStorage, logger, performanceClient);
    this.cookieStorage = new CookieStorage();
    this.eventHandler = eventHandler;
  }
  initialize(correlationId) {
    return __async(this, null, function* () {
      this.performanceClient.addFields({
        cacheLocation: this.cacheConfig.cacheLocation,
        cacheRetentionDays: this.cacheConfig.cacheRetentionDays
      }, correlationId);
      yield this.browserStorage.initialize(correlationId);
      yield this.migrateExistingCache(correlationId);
      this.trackVersionChanges(correlationId);
    });
  }
  /**
   * Migrates any existing cache data from previous versions of MSAL.js into the current cache structure.
   */
  migrateExistingCache(correlationId) {
    return __async(this, null, function* () {
      let accountKeys = getAccountKeys(this.browserStorage);
      let tokenKeys = getTokenKeys(this.clientId, this.browserStorage);
      this.performanceClient.addFields({
        preMigrateAcntCount: accountKeys.length,
        preMigrateATCount: tokenKeys.accessToken.length,
        preMigrateITCount: tokenKeys.idToken.length,
        preMigrateRTCount: tokenKeys.refreshToken.length
      }, correlationId);
      for (let i = 0; i < ACCOUNT_SCHEMA_VERSION; i++) {
        const credentialSchema = i;
        yield this.removeStaleAccounts(i, credentialSchema, correlationId);
      }
      for (let i = 0; i < CREDENTIAL_SCHEMA_VERSION; i++) {
        const accountSchema = i;
        yield this.migrateIdTokens(i, accountSchema, correlationId);
      }
      const kmsiMap = this.getKMSIValues();
      for (let i = 0; i < CREDENTIAL_SCHEMA_VERSION; i++) {
        yield this.migrateAccessTokens(i, kmsiMap, correlationId);
        yield this.migrateRefreshTokens(i, kmsiMap, correlationId);
      }
      accountKeys = getAccountKeys(this.browserStorage);
      tokenKeys = getTokenKeys(this.clientId, this.browserStorage);
      this.performanceClient.addFields({
        postMigrateAcntCount: accountKeys.length,
        postMigrateATCount: tokenKeys.accessToken.length,
        postMigrateITCount: tokenKeys.idToken.length,
        postMigrateRTCount: tokenKeys.refreshToken.length
      }, correlationId);
    });
  }
  /**
   * Parses entry, adds lastUpdatedAt if it doesn't exist, removes entry if expired or invalid
   * @param key
   * @param correlationId
   * @returns
   */
  updateOldEntry(key, correlationId) {
    return __async(this, null, function* () {
      const rawValue = this.browserStorage.getItem(key);
      const parsedValue = this.validateAndParseJson(rawValue || "");
      if (!parsedValue) {
        this.browserStorage.removeItem(key);
        return {
          entry: null,
          removalReason: MigrationRemovalReason.Invalid
        };
      }
      if (!parsedValue.lastUpdatedAt) {
        parsedValue.lastUpdatedAt = Date.now().toString();
        this.setItem(key, JSON.stringify(parsedValue), correlationId);
      } else if (TimeUtils_exports.isCacheExpired(parsedValue.lastUpdatedAt, this.cacheConfig.cacheRetentionDays)) {
        this.browserStorage.removeItem(key);
        return {
          entry: null,
          removalReason: MigrationRemovalReason.TtlExpired
        };
      }
      const wasEncrypted = isEncrypted(parsedValue);
      const decryptedData = wasEncrypted ? yield this.browserStorage.decryptData(key, parsedValue, correlationId) : parsedValue;
      if (!decryptedData) {
        this.browserStorage.removeItem(key);
        return {
          entry: null,
          removalReason: wasEncrypted ? MigrationRemovalReason.DecryptFailed : MigrationRemovalReason.Invalid
        };
      }
      if (!CacheHelpers_exports.isCredentialEntity(decryptedData)) {
        this.browserStorage.removeItem(key);
        return {
          entry: null,
          removalReason: MigrationRemovalReason.Invalid
        };
      }
      if ((CacheHelpers_exports.isAccessTokenEntity(decryptedData) || CacheHelpers_exports.isRefreshTokenEntity(decryptedData)) && decryptedData.expiresOn && TimeUtils_exports.isTokenExpired(decryptedData.expiresOn, Constants_exports.DEFAULT_TOKEN_RENEWAL_OFFSET_SEC)) {
        this.browserStorage.removeItem(key);
        return {
          entry: null,
          removalReason: MigrationRemovalReason.Expired
        };
      }
      return { entry: decryptedData };
    });
  }
  /**
   * Remove accounts from the cache for older schema versions if they have not been updated in the last cacheRetentionDays
   * @param accountSchema
   * @param credentialSchema
   * @param correlationId
   * @returns
   */
  removeStaleAccounts(accountSchema, credentialSchema, correlationId) {
    return __async(this, null, function* () {
      const accountKeysToCheck = getAccountKeys(this.browserStorage, accountSchema);
      if (accountKeysToCheck.length === 0) {
        return;
      }
      for (const accountKey of [...accountKeysToCheck]) {
        this.performanceClient.incrementFields({ oldAcntCount: 1 }, correlationId);
        const rawValue = this.browserStorage.getItem(accountKey);
        const parsedValue = this.validateAndParseJson(rawValue || "");
        if (!parsedValue) {
          this.browserStorage.removeItem(accountKey);
          this.performanceClient.incrementFields({ invalidAcntCount: 1 }, correlationId);
          removeElementFromArray(accountKeysToCheck, accountKey);
          continue;
        }
        if (!parsedValue.lastUpdatedAt) {
          parsedValue.lastUpdatedAt = Date.now().toString();
          this.setItem(accountKey, JSON.stringify(parsedValue), correlationId);
          continue;
        } else if (TimeUtils_exports.isCacheExpired(parsedValue.lastUpdatedAt, this.cacheConfig.cacheRetentionDays)) {
          yield this.removeAccountOldSchema(accountKey, parsedValue, credentialSchema, correlationId);
          this.performanceClient.incrementFields({ ttlExpiredAcntCount: 1 }, correlationId);
          removeElementFromArray(accountKeysToCheck, accountKey);
        } else if (isEncrypted(parsedValue)) {
          const decrypted = yield this.browserStorage.decryptData(accountKey, parsedValue, correlationId);
          if (!decrypted) {
            this.browserStorage.removeItem(accountKey);
            this.performanceClient.incrementFields({
              decryptFailedAcntCount: 1
            }, correlationId);
            removeElementFromArray(accountKeysToCheck, accountKey);
          }
        }
      }
      this.setAccountKeys(accountKeysToCheck, correlationId, accountSchema);
    });
  }
  /**
   * Remove the given account and all associated tokens from the cache
   * @param accountKey
   * @param rawObject
   * @param credentialSchema
   * @param correlationId
   */
  removeAccountOldSchema(accountKey, rawObject, credentialSchema, correlationId) {
    return __async(this, null, function* () {
      const decryptedData = isEncrypted(rawObject) ? yield this.browserStorage.decryptData(accountKey, rawObject, correlationId) : rawObject;
      const homeAccountId = decryptedData?.homeAccountId;
      if (homeAccountId) {
        const tokenKeys = this.getTokenKeys(credentialSchema);
        [...tokenKeys.idToken].filter((key) => key.includes(homeAccountId)).forEach((key) => {
          this.browserStorage.removeItem(key);
          removeElementFromArray(tokenKeys.idToken, key);
        });
        [...tokenKeys.accessToken].filter((key) => key.includes(homeAccountId)).forEach((key) => {
          this.browserStorage.removeItem(key);
          removeElementFromArray(tokenKeys.accessToken, key);
        });
        [...tokenKeys.refreshToken].filter((key) => key.includes(homeAccountId)).forEach((key) => {
          this.browserStorage.removeItem(key);
          removeElementFromArray(tokenKeys.refreshToken, key);
        });
        this.setTokenKeys(tokenKeys, correlationId, credentialSchema);
      }
      this.browserStorage.removeItem(accountKey);
    });
  }
  /**
   * Gets key value pair mapping homeAccountId to KMSI value
   * @returns
   */
  getKMSIValues() {
    const kmsiMap = {};
    const tokenKeys = this.getTokenKeys().idToken;
    for (const key of tokenKeys) {
      const rawValue = this.browserStorage.getUserData(key);
      if (rawValue) {
        const idToken = JSON.parse(rawValue);
        const claims = AuthToken_exports.extractTokenClaims(idToken.secret, base64Decode, "");
        if (claims) {
          kmsiMap[idToken.homeAccountId] = AuthToken_exports.isKmsi(claims);
        }
      }
    }
    return kmsiMap;
  }
  /**
   * Migrates id tokens from the old schema to the new schema, also migrates associated account object if it doesn't already exist in the new schema
   * @param credentialSchema
   * @param accountSchema
   * @param correlationId
   * @returns
   */
  migrateIdTokens(credentialSchema, accountSchema, correlationId) {
    return __async(this, null, function* () {
      const credentialKeysToMigrate = getTokenKeys(this.clientId, this.browserStorage, credentialSchema);
      if (credentialKeysToMigrate.idToken.length === 0) {
        return;
      }
      const currentCredentialKeys = getTokenKeys(this.clientId, this.browserStorage, CREDENTIAL_SCHEMA_VERSION);
      const currentAccountKeys = getAccountKeys(this.browserStorage);
      const previousAccountKeys = getAccountKeys(this.browserStorage, accountSchema);
      for (const idTokenKey of [...credentialKeysToMigrate.idToken]) {
        this.performanceClient.incrementFields({ oldITCount: 1 }, correlationId);
        const result = yield this.updateOldEntry(idTokenKey, correlationId);
        const oldSchemaData = result.entry;
        if (!oldSchemaData) {
          switch (result.removalReason) {
            case MigrationRemovalReason.TtlExpired:
              this.performanceClient.incrementFields({ ttlExpiredITCount: 1 }, correlationId);
              break;
            case MigrationRemovalReason.DecryptFailed:
              this.performanceClient.incrementFields({ decryptFailedITCount: 1 }, correlationId);
              break;
            case MigrationRemovalReason.Invalid:
              this.performanceClient.incrementFields({ invalidITCount: 1 }, correlationId);
              break;
          }
          removeElementFromArray(credentialKeysToMigrate.idToken, idTokenKey);
          continue;
        }
        const currentAccountKey = currentAccountKeys.find((key) => key.includes(oldSchemaData.homeAccountId));
        const previousAccountKey = previousAccountKeys.find((key) => key.includes(oldSchemaData.homeAccountId));
        let account = null;
        if (currentAccountKey) {
          account = this.getAccount(currentAccountKey, correlationId);
        } else if (previousAccountKey) {
          const rawValue = this.browserStorage.getItem(previousAccountKey);
          const parsedValue = this.validateAndParseJson(rawValue || "");
          account = parsedValue && isEncrypted(parsedValue) ? yield this.browserStorage.decryptData(previousAccountKey, parsedValue, correlationId) : parsedValue;
        }
        if (!account) {
          this.performanceClient.incrementFields({ skipITMigrateCount: 1 }, correlationId);
          continue;
        }
        const claims = AuthToken_exports.extractTokenClaims(oldSchemaData.secret, base64Decode, correlationId);
        const newIdTokenKey = this.generateCredentialKey(oldSchemaData);
        const currentIdToken = this.getIdTokenCredential(newIdTokenKey, correlationId);
        const oldTokenHasSignInState = Object.keys(claims).includes("signin_state");
        const currentTokenHasSignInState = currentIdToken && Object.keys(AuthToken_exports.extractTokenClaims(currentIdToken.secret, base64Decode, correlationId) || {}).includes("signin_state");
        if (!currentIdToken || oldSchemaData.lastUpdatedAt > currentIdToken.lastUpdatedAt && (oldTokenHasSignInState || !currentTokenHasSignInState)) {
          const tenantProfiles = account.tenantProfiles || [];
          const tenantId = getTenantIdFromIdTokenClaims(claims) || account.realm;
          if (tenantId && !tenantProfiles.find((tenantProfile) => {
            return tenantProfile.tenantId === tenantId;
          })) {
            const newTenantProfile = buildTenantProfile(account.homeAccountId, account.localAccountId, tenantId, account.nativeAccountId, claims);
            tenantProfiles.push(newTenantProfile);
          }
          account.tenantProfiles = tenantProfiles;
          const newAccountKey = this.generateAccountKey(AccountEntityUtils_exports.getAccountInfo(account));
          const kmsi = AuthToken_exports.isKmsi(claims);
          yield this.setUserData(newAccountKey, JSON.stringify(account), correlationId, account.lastUpdatedAt, kmsi);
          if (!currentAccountKeys.includes(newAccountKey)) {
            currentAccountKeys.push(newAccountKey);
          }
          yield this.setUserData(newIdTokenKey, JSON.stringify(oldSchemaData), correlationId, oldSchemaData.lastUpdatedAt, kmsi);
          this.performanceClient.incrementFields({ migratedITCount: 1 }, correlationId);
          if (!currentCredentialKeys.idToken.includes(newIdTokenKey)) {
            currentCredentialKeys.idToken.push(newIdTokenKey);
          }
        }
      }
      this.setTokenKeys(credentialKeysToMigrate, correlationId, credentialSchema);
      this.setTokenKeys(currentCredentialKeys, correlationId);
      this.setAccountKeys(currentAccountKeys, correlationId);
    });
  }
  /**
   * Migrates access tokens from old cache schema to current schema
   * @param credentialSchema
   * @param kmsiMap
   * @param correlationId
   * @returns
   */
  migrateAccessTokens(credentialSchema, kmsiMap, correlationId) {
    return __async(this, null, function* () {
      const credentialKeysToMigrate = getTokenKeys(this.clientId, this.browserStorage, credentialSchema);
      if (credentialKeysToMigrate.accessToken.length === 0) {
        return;
      }
      const currentCredentialKeys = getTokenKeys(this.clientId, this.browserStorage, CREDENTIAL_SCHEMA_VERSION);
      for (const accessTokenKey of [...credentialKeysToMigrate.accessToken]) {
        this.performanceClient.incrementFields({ oldATCount: 1 }, correlationId);
        const result = yield this.updateOldEntry(accessTokenKey, correlationId);
        const oldSchemaData = result.entry;
        if (!oldSchemaData) {
          switch (result.removalReason) {
            case MigrationRemovalReason.TtlExpired:
              this.performanceClient.incrementFields({ ttlExpiredATCount: 1 }, correlationId);
              break;
            case MigrationRemovalReason.DecryptFailed:
              this.performanceClient.incrementFields({ decryptFailedATCount: 1 }, correlationId);
              break;
            case MigrationRemovalReason.Expired:
              this.performanceClient.incrementFields({ expiredATCount: 1 }, correlationId);
              break;
            case MigrationRemovalReason.Invalid:
              this.performanceClient.incrementFields({ invalidATCount: 1 }, correlationId);
              break;
          }
          removeElementFromArray(credentialKeysToMigrate.accessToken, accessTokenKey);
          continue;
        }
        if (!(oldSchemaData.homeAccountId in kmsiMap)) {
          this.performanceClient.incrementFields({ skipATMigrateCount: 1 }, correlationId);
          continue;
        }
        const newKey = this.generateCredentialKey(oldSchemaData);
        const kmsi = kmsiMap[oldSchemaData.homeAccountId];
        if (!currentCredentialKeys.accessToken.includes(newKey)) {
          yield this.setUserData(newKey, JSON.stringify(oldSchemaData), correlationId, oldSchemaData.lastUpdatedAt, kmsi);
          this.performanceClient.incrementFields({ migratedATCount: 1 }, correlationId);
          currentCredentialKeys.accessToken.push(newKey);
        } else {
          const currentToken = this.getAccessTokenCredential(newKey, correlationId);
          if (!currentToken || oldSchemaData.lastUpdatedAt > currentToken.lastUpdatedAt) {
            yield this.setUserData(newKey, JSON.stringify(oldSchemaData), correlationId, oldSchemaData.lastUpdatedAt, kmsi);
            this.performanceClient.incrementFields({ migratedATCount: 1 }, correlationId);
          }
        }
      }
      this.setTokenKeys(credentialKeysToMigrate, correlationId, credentialSchema);
      this.setTokenKeys(currentCredentialKeys, correlationId);
    });
  }
  /**
   * Migrates refresh tokens from old cache schema to current schema
   * @param credentialSchema
   * @param kmsiMap
   * @param correlationId
   * @returns
   */
  migrateRefreshTokens(credentialSchema, kmsiMap, correlationId) {
    return __async(this, null, function* () {
      const credentialKeysToMigrate = getTokenKeys(this.clientId, this.browserStorage, credentialSchema);
      if (credentialKeysToMigrate.refreshToken.length === 0) {
        return;
      }
      const currentCredentialKeys = getTokenKeys(this.clientId, this.browserStorage, CREDENTIAL_SCHEMA_VERSION);
      for (const refreshTokenKey of [
        ...credentialKeysToMigrate.refreshToken
      ]) {
        this.performanceClient.incrementFields({ oldRTCount: 1 }, correlationId);
        const result = yield this.updateOldEntry(refreshTokenKey, correlationId);
        const oldSchemaData = result.entry;
        if (!oldSchemaData) {
          switch (result.removalReason) {
            case MigrationRemovalReason.TtlExpired:
              this.performanceClient.incrementFields({ ttlExpiredRTCount: 1 }, correlationId);
              break;
            case MigrationRemovalReason.DecryptFailed:
              this.performanceClient.incrementFields({ decryptFailedRTCount: 1 }, correlationId);
              break;
            case MigrationRemovalReason.Expired:
              this.performanceClient.incrementFields({ expiredRTCount: 1 }, correlationId);
              break;
            case MigrationRemovalReason.Invalid:
              this.performanceClient.incrementFields({ invalidRTCount: 1 }, correlationId);
              break;
          }
          removeElementFromArray(credentialKeysToMigrate.refreshToken, refreshTokenKey);
          continue;
        }
        if (!(oldSchemaData.homeAccountId in kmsiMap)) {
          this.performanceClient.incrementFields({ skipRTMigrateCount: 1 }, correlationId);
          continue;
        }
        const newKey = this.generateCredentialKey(oldSchemaData);
        const kmsi = kmsiMap[oldSchemaData.homeAccountId];
        if (!currentCredentialKeys.refreshToken.includes(newKey)) {
          yield this.setUserData(newKey, JSON.stringify(oldSchemaData), correlationId, oldSchemaData.lastUpdatedAt, kmsi);
          this.performanceClient.incrementFields({ migratedRTCount: 1 }, correlationId);
          currentCredentialKeys.refreshToken.push(newKey);
        } else {
          const currentToken = this.getRefreshTokenCredential(newKey, correlationId);
          if (!currentToken || oldSchemaData.lastUpdatedAt > currentToken.lastUpdatedAt) {
            yield this.setUserData(newKey, JSON.stringify(oldSchemaData), correlationId, oldSchemaData.lastUpdatedAt, kmsi);
            this.performanceClient.incrementFields({ migratedRTCount: 1 }, correlationId);
          }
        }
      }
      this.setTokenKeys(credentialKeysToMigrate, correlationId, credentialSchema);
      this.setTokenKeys(currentCredentialKeys, correlationId);
    });
  }
  /**
   * Tracks upgrades and downgrades for telemetry and debugging purposes
   */
  trackVersionChanges(correlationId) {
    const previousVersion = this.browserStorage.getItem(VERSION_CACHE_KEY);
    if (previousVersion) {
      this.logger.info(`1wuc87 ${previousVersion}`, correlationId);
      this.performanceClient.addGlobalFields({
        previousLibraryVersion: previousVersion
      });
    }
    if (previousVersion !== version) {
      this.setItem(VERSION_CACHE_KEY, version, correlationId);
    }
  }
  /**
   * Parses passed value as JSON object, JSON.parse() will throw an error.
   * @param input
   */
  validateAndParseJson(jsonValue) {
    if (!jsonValue) {
      return null;
    }
    try {
      const parsedJson = JSON.parse(jsonValue);
      return parsedJson && typeof parsedJson === "object" ? parsedJson : null;
    } catch (error) {
      return null;
    }
  }
  /**
   * Helper to setItem in browser storage, with cleanup in case of quota errors
   * @param key
   * @param value
   */
  setItem(key, value, correlationId) {
    const tokenKeysCount = new Array(CREDENTIAL_SCHEMA_VERSION + 1).fill(0);
    const accessTokenKeys = [];
    const maxRetries = 20;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        this.browserStorage.setItem(key, value);
        if (i > 0) {
          for (let schemaVersion = 0; schemaVersion <= CREDENTIAL_SCHEMA_VERSION; schemaVersion++) {
            const startIndex = tokenKeysCount.slice(0, schemaVersion).reduce((sum, count) => sum + count, 0);
            if (startIndex >= i) {
              break;
            }
            const endIndex = i > startIndex + tokenKeysCount[schemaVersion] ? startIndex + tokenKeysCount[schemaVersion] : i;
            if (i > startIndex && tokenKeysCount[schemaVersion] > 0) {
              this.removeAccessTokenKeys(accessTokenKeys.slice(startIndex, endIndex), correlationId, schemaVersion);
            }
          }
        }
        break;
      } catch (e) {
        const cacheError = createCacheError(e);
        if (cacheError.errorCode === CacheErrorCodes_exports.cacheQuotaExceeded && i < maxRetries) {
          if (!accessTokenKeys.length) {
            for (let i2 = 0; i2 <= CREDENTIAL_SCHEMA_VERSION; i2++) {
              if (key === getTokenKeysCacheKey(this.clientId, i2)) {
                const tokenKeys = JSON.parse(value).accessToken;
                accessTokenKeys.push(...tokenKeys);
                tokenKeysCount[i2] = tokenKeys.length;
              } else {
                const tokenKeys = this.getTokenKeys(i2).accessToken;
                accessTokenKeys.push(...tokenKeys);
                tokenKeysCount[i2] = tokenKeys.length;
              }
            }
          }
          if (accessTokenKeys.length <= i) {
            throw cacheError;
          }
          this.removeAccessToken(
            accessTokenKeys[i],
            correlationId,
            false
            // Don't save token keys yet, do it at the end
          );
        } else {
          throw cacheError;
        }
      }
    }
  }
  /**
   * Helper to setUserData in browser storage, with cleanup in case of quota errors
   * @param key
   * @param value
   * @param correlationId
   */
  setUserData(key, value, correlationId, timestamp, kmsi) {
    return __async(this, null, function* () {
      const tokenKeysCount = new Array(CREDENTIAL_SCHEMA_VERSION + 1).fill(0);
      const accessTokenKeys = [];
      const maxRetries = 20;
      for (let i = 0; i <= maxRetries; i++) {
        try {
          yield invokeAsync(this.browserStorage.setUserData.bind(this.browserStorage), PerformanceEvents_exports.SetUserData, this.logger, this.performanceClient, correlationId)(key, value, correlationId, timestamp, kmsi);
          if (i > 0) {
            for (let schemaVersion = 0; schemaVersion <= CREDENTIAL_SCHEMA_VERSION; schemaVersion++) {
              const startIndex = tokenKeysCount.slice(0, schemaVersion).reduce((sum, count) => sum + count, 0);
              if (startIndex >= i) {
                break;
              }
              const endIndex = i > startIndex + tokenKeysCount[schemaVersion] ? startIndex + tokenKeysCount[schemaVersion] : i;
              if (i > startIndex && tokenKeysCount[schemaVersion] > 0) {
                this.removeAccessTokenKeys(accessTokenKeys.slice(startIndex, endIndex), correlationId, schemaVersion);
              }
            }
          }
          break;
        } catch (e) {
          const cacheError = createCacheError(e);
          if (cacheError.errorCode === CacheErrorCodes_exports.cacheQuotaExceeded && i < maxRetries) {
            if (!accessTokenKeys.length) {
              for (let i2 = 0; i2 <= CREDENTIAL_SCHEMA_VERSION; i2++) {
                const tokenKeys = this.getTokenKeys(i2).accessToken;
                accessTokenKeys.push(...tokenKeys);
                tokenKeysCount[i2] = tokenKeys.length;
              }
            }
            if (accessTokenKeys.length <= i) {
              throw cacheError;
            }
            this.removeAccessToken(
              accessTokenKeys[i],
              correlationId,
              false
              // Don't save token keys yet, do it at the end
            );
          } else {
            throw cacheError;
          }
        }
      }
    });
  }
  /**
   * Reads account from cache, deserializes it into an account entity and returns it.
   * If account is not found from the key, returns null and removes key from map.
   * @param accountKey
   * @returns
   */
  getAccount(accountKey, correlationId) {
    this.logger.trace("1lfvm6", correlationId);
    const serializedAccount = this.browserStorage.getUserData(accountKey);
    if (!serializedAccount) {
      this.removeAccountKeyFromMap(accountKey, correlationId);
      return null;
    }
    const parsedAccount = this.validateAndParseJson(serializedAccount);
    if (!parsedAccount || !AccountEntityUtils_exports.isAccountEntity(parsedAccount)) {
      return null;
    }
    const account = CacheManager.toObject({}, parsedAccount);
    this.performanceClient.addFields({
      accountCachedBy: apiIdToName(account.cachedByApiId)
    }, correlationId);
    return account;
  }
  /**
   * set account entity in the platform cache
   * @param account
   */
  setAccount(account, correlationId, kmsi, apiId) {
    return __async(this, null, function* () {
      this.logger.trace("1bz3wr", correlationId);
      const key = this.generateAccountKey(AccountEntityUtils_exports.getAccountInfo(account));
      const timestamp = Date.now().toString();
      account.lastUpdatedAt = timestamp;
      account.cachedByApiId = apiId;
      yield this.setUserData(key, JSON.stringify(account), correlationId, timestamp, kmsi);
      this.addAccountKeyToMap(key, correlationId);
      this.performanceClient.addFields({ kmsi }, correlationId);
    });
  }
  setAccountKeys(accountKeys, correlationId, schemaVersion = ACCOUNT_SCHEMA_VERSION) {
    if (accountKeys.length === 0) {
      this.removeItem(getAccountKeysCacheKey(schemaVersion));
    } else {
      this.setItem(getAccountKeysCacheKey(schemaVersion), JSON.stringify(accountKeys), correlationId);
    }
  }
  /**
   * Returns the array of account keys currently cached
   * @returns
   */
  getAccountKeys() {
    return getAccountKeys(this.browserStorage);
  }
  /**
   * Add a new account to the key map
   * @param key
   */
  addAccountKeyToMap(key, correlationId) {
    this.logger.trace("0rb85k", correlationId);
    this.logger.tracePii(`1l9bdo ${key}`, correlationId);
    const accountKeys = this.getAccountKeys();
    if (accountKeys.indexOf(key) === -1) {
      accountKeys.push(key);
      this.setItem(getAccountKeysCacheKey(), JSON.stringify(accountKeys), correlationId);
      this.logger.verbose("0xia39", correlationId);
      return true;
    } else {
      this.logger.verbose("0161kk", correlationId);
      return false;
    }
  }
  /**
   * Remove an account from the key map
   * @param key
   */
  removeAccountKeyFromMap(key, correlationId) {
    this.logger.trace("1jpigu", correlationId);
    this.logger.tracePii(`1xzspl ${key}`, correlationId);
    const accountKeys = this.getAccountKeys();
    const removalIndex = accountKeys.indexOf(key);
    if (removalIndex > -1) {
      accountKeys.splice(removalIndex, 1);
      this.setAccountKeys(accountKeys, correlationId);
    } else {
      this.logger.trace("1dytu2", correlationId);
    }
  }
  /**
   * Extends inherited removeAccount function to include removal of the account key from the map
   * @param key
   */
  removeAccount(account, correlationId) {
    const activeAccount = this.getActiveAccount(correlationId);
    if (activeAccount?.homeAccountId === account.homeAccountId && activeAccount?.environment === account.environment) {
      this.setActiveAccount(null, correlationId);
    }
    super.removeAccount(account, correlationId);
    this.removeAccountKeyFromMap(this.generateAccountKey(account), correlationId);
    this.browserStorage.getKeys().forEach((key) => {
      if (key.includes(account.homeAccountId) && key.includes(account.environment)) {
        this.browserStorage.removeItem(key);
      }
    });
  }
  /**
   * Removes given idToken from the cache and from the key map
   * @param key
   */
  removeIdToken(key, correlationId) {
    super.removeIdToken(key, correlationId);
    const tokenKeys = this.getTokenKeys();
    const idRemoval = tokenKeys.idToken.indexOf(key);
    if (idRemoval > -1) {
      this.logger.info("05udv9", correlationId);
      tokenKeys.idToken.splice(idRemoval, 1);
      this.setTokenKeys(tokenKeys, correlationId);
    }
  }
  /**
   * Removes given accessToken from the cache and from the key map
   * @param key
   */
  removeAccessToken(key, correlationId, updateTokenKeys = true) {
    super.removeAccessToken(key, correlationId);
    updateTokenKeys && this.removeAccessTokenKeys([key], correlationId);
  }
  /**
   * Remove access token key from the key map
   * @param key
   * @param correlationId
   * @param tokenKeys
   */
  removeAccessTokenKeys(keys, correlationId, schemaVersion = CREDENTIAL_SCHEMA_VERSION) {
    this.logger.trace("17o18n", correlationId);
    const tokenKeys = this.getTokenKeys(schemaVersion);
    let keysRemoved = 0;
    keys.forEach((key) => {
      const accessRemoval = tokenKeys.accessToken.indexOf(key);
      if (accessRemoval > -1) {
        tokenKeys.accessToken.splice(accessRemoval, 1);
        keysRemoved++;
      }
    });
    if (keysRemoved > 0) {
      this.logger.info(`15i5d5 ${keysRemoved}`, correlationId);
      this.setTokenKeys(tokenKeys, correlationId, schemaVersion);
      return;
    }
  }
  /**
   * Removes given refreshToken from the cache and from the key map
   * @param key
   */
  removeRefreshToken(key, correlationId) {
    super.removeRefreshToken(key, correlationId);
    const tokenKeys = this.getTokenKeys();
    const refreshRemoval = tokenKeys.refreshToken.indexOf(key);
    if (refreshRemoval > -1) {
      this.logger.info("1f4fq3", correlationId);
      tokenKeys.refreshToken.splice(refreshRemoval, 1);
      this.setTokenKeys(tokenKeys, correlationId);
    }
  }
  /**
   * Gets the keys for the cached tokens associated with this clientId
   * @returns
   */
  getTokenKeys(schemaVersion = CREDENTIAL_SCHEMA_VERSION) {
    return getTokenKeys(this.clientId, this.browserStorage, schemaVersion);
  }
  /**
   * Sets the token keys in the cache
   * @param tokenKeys
   * @param correlationId
   * @returns
   */
  setTokenKeys(tokenKeys, correlationId, schemaVersion = CREDENTIAL_SCHEMA_VERSION) {
    if (tokenKeys.idToken.length === 0 && tokenKeys.accessToken.length === 0 && tokenKeys.refreshToken.length === 0) {
      this.removeItem(getTokenKeysCacheKey(this.clientId, schemaVersion));
      return;
    } else {
      this.setItem(getTokenKeysCacheKey(this.clientId, schemaVersion), JSON.stringify(tokenKeys), correlationId);
    }
  }
  /**
   * generates idToken entity from a string
   * @param idTokenKey
   */
  getIdTokenCredential(idTokenKey, correlationId) {
    const value = this.browserStorage.getUserData(idTokenKey);
    if (!value) {
      this.logger.trace("1jukz6", correlationId);
      this.removeIdToken(idTokenKey, correlationId);
      return null;
    }
    const parsedIdToken = this.validateAndParseJson(value);
    if (!parsedIdToken || !CacheHelpers_exports.isIdTokenEntity(parsedIdToken)) {
      this.logger.trace("1jukz6", correlationId);
      return null;
    }
    this.logger.trace("01ju66", correlationId);
    return parsedIdToken;
  }
  /**
   * set IdToken credential to the platform cache
   * @param idToken
   */
  setIdTokenCredential(idToken, correlationId, kmsi) {
    return __async(this, null, function* () {
      this.logger.trace("13hjll", correlationId);
      const idTokenKey = this.generateCredentialKey(idToken);
      const timestamp = Date.now().toString();
      idToken.lastUpdatedAt = timestamp;
      yield this.setUserData(idTokenKey, JSON.stringify(idToken), correlationId, timestamp, kmsi);
      const tokenKeys = this.getTokenKeys();
      if (tokenKeys.idToken.indexOf(idTokenKey) === -1) {
        this.logger.info("07jy92", correlationId);
        tokenKeys.idToken.push(idTokenKey);
        this.setTokenKeys(tokenKeys, correlationId);
      }
    });
  }
  /**
   * generates accessToken entity from a string
   * @param key
   */
  getAccessTokenCredential(accessTokenKey, correlationId) {
    const value = this.browserStorage.getUserData(accessTokenKey);
    if (!value) {
      this.logger.trace("0bqvx8", correlationId);
      this.removeAccessTokenKeys([accessTokenKey], correlationId);
      return null;
    }
    const parsedAccessToken = this.validateAndParseJson(value);
    if (!parsedAccessToken || !CacheHelpers_exports.isAccessTokenEntity(parsedAccessToken)) {
      this.logger.trace("0bqvx8", correlationId);
      return null;
    }
    this.logger.trace("1o81rl", correlationId);
    return parsedAccessToken;
  }
  /**
   * Set accessToken credential to the platform cache
   * @param accessToken - the access token entity to cache
   */
  setAccessTokenCredential(accessToken, correlationId, kmsi, additionalCacheKeyHash) {
    return __async(this, null, function* () {
      this.logger.trace("1pondb", correlationId);
      const accessTokenKey = this.generateCredentialKey(accessToken, additionalCacheKeyHash);
      const timestamp = Date.now().toString();
      accessToken.lastUpdatedAt = timestamp;
      yield this.setUserData(accessTokenKey, JSON.stringify(accessToken), correlationId, timestamp, kmsi);
      const tokenKeys = this.getTokenKeys();
      const index = tokenKeys.accessToken.indexOf(accessTokenKey);
      if (index !== -1) {
        tokenKeys.accessToken.splice(index, 1);
      }
      this.logger.trace(`1onhey ${index === -1 ? "added to" : "updated in"}`, correlationId);
      tokenKeys.accessToken.push(accessTokenKey);
      this.setTokenKeys(tokenKeys, correlationId);
    });
  }
  /**
   * generates refreshToken entity from a string
   * @param refreshTokenKey
   */
  getRefreshTokenCredential(refreshTokenKey, correlationId) {
    const value = this.browserStorage.getUserData(refreshTokenKey);
    if (!value) {
      this.logger.trace("0jlizt", correlationId);
      this.removeRefreshToken(refreshTokenKey, correlationId);
      return null;
    }
    const parsedRefreshToken = this.validateAndParseJson(value);
    if (!parsedRefreshToken || !CacheHelpers_exports.isRefreshTokenEntity(parsedRefreshToken)) {
      this.logger.trace("0jlizt", correlationId);
      return null;
    }
    this.logger.trace("0nokxi", correlationId);
    return parsedRefreshToken;
  }
  /**
   * set refreshToken credential to the platform cache
   * @param refreshToken
   */
  setRefreshTokenCredential(refreshToken, correlationId, kmsi) {
    return __async(this, null, function* () {
      this.logger.trace("0tcg8d", correlationId);
      const refreshTokenKey = this.generateCredentialKey(refreshToken);
      const timestamp = Date.now().toString();
      refreshToken.lastUpdatedAt = timestamp;
      yield this.setUserData(refreshTokenKey, JSON.stringify(refreshToken), correlationId, timestamp, kmsi);
      const tokenKeys = this.getTokenKeys();
      if (tokenKeys.refreshToken.indexOf(refreshTokenKey) === -1) {
        this.logger.info("0eckjs", correlationId);
        tokenKeys.refreshToken.push(refreshTokenKey);
        this.setTokenKeys(tokenKeys, correlationId);
      }
    });
  }
  /**
   * fetch appMetadata entity from the platform cache
   * @param appMetadataKey
   * @param correlationId
   */
  getAppMetadata(appMetadataKey, correlationId) {
    const value = this.browserStorage.getItem(appMetadataKey);
    if (!value) {
      this.logger.trace("1q101h", correlationId);
      return null;
    }
    const parsedMetadata = this.validateAndParseJson(value);
    if (!parsedMetadata || !CacheHelpers_exports.isAppMetadataEntity(appMetadataKey, parsedMetadata)) {
      this.logger.trace("1q101h", correlationId);
      return null;
    }
    this.logger.trace("19pvg2", correlationId);
    return parsedMetadata;
  }
  /**
   * set appMetadata entity to the platform cache
   * @param appMetadata
   * @param correlationId
   */
  setAppMetadata(appMetadata, correlationId) {
    this.logger.trace("0cyma6", correlationId);
    const appMetadataKey = CacheHelpers_exports.generateAppMetadataKey(appMetadata);
    this.setItem(appMetadataKey, JSON.stringify(appMetadata), correlationId);
  }
  /**
   * fetch server telemetry entity from the platform cache
   * @param serverTelemetryKey
   * @param correlationId
   */
  getServerTelemetry(serverTelemetryKey, correlationId) {
    const value = this.browserStorage.getItem(serverTelemetryKey);
    if (!value) {
      this.logger.trace("0jk19c", correlationId);
      return null;
    }
    const parsedEntity = this.validateAndParseJson(value);
    if (!parsedEntity || !CacheHelpers_exports.isServerTelemetryEntity(serverTelemetryKey, parsedEntity)) {
      this.logger.trace("0jk19c", correlationId);
      return null;
    }
    this.logger.trace("12jguk", correlationId);
    return parsedEntity;
  }
  /**
   * set server telemetry entity to the platform cache
   * @param serverTelemetryKey
   * @param serverTelemetry
   */
  setServerTelemetry(serverTelemetryKey, serverTelemetry, correlationId) {
    this.logger.trace("1poh61", correlationId);
    this.setItem(serverTelemetryKey, JSON.stringify(serverTelemetry), correlationId);
  }
  /**
   *
   */
  getAuthorityMetadata(key, correlationId) {
    const value = this.internalStorage.getItem(key);
    if (!value) {
      this.logger.trace("1r39oe", correlationId);
      return null;
    }
    const parsedMetadata = this.validateAndParseJson(value);
    if (parsedMetadata && CacheHelpers_exports.isAuthorityMetadataEntity(key, parsedMetadata)) {
      this.logger.trace("1ohvk3", correlationId);
      return parsedMetadata;
    }
    return null;
  }
  /**
   *
   */
  getAuthorityMetadataKeys() {
    const allKeys = this.internalStorage.getKeys();
    return allKeys.filter((key) => {
      return this.isAuthorityMetadata(key);
    });
  }
  /**
   * Sets wrapper metadata in memory
   * @param wrapperSKU
   * @param wrapperVersion
   */
  setWrapperMetadata(wrapperSKU, wrapperVersion) {
    this.internalStorage.setItem(InMemoryCacheKeys.WRAPPER_SKU, wrapperSKU);
    this.internalStorage.setItem(InMemoryCacheKeys.WRAPPER_VER, wrapperVersion);
  }
  /**
   * Returns wrapper metadata from in-memory storage
   */
  getWrapperMetadata() {
    const sku = this.internalStorage.getItem(InMemoryCacheKeys.WRAPPER_SKU) || "";
    const version2 = this.internalStorage.getItem(InMemoryCacheKeys.WRAPPER_VER) || "";
    return [sku, version2];
  }
  /**
   *
   * @param key
   * @param entity
   * @param correlationId
   */
  setAuthorityMetadata(key, entity, correlationId) {
    this.logger.trace("07w8n2", correlationId);
    this.internalStorage.setItem(key, JSON.stringify(entity));
  }
  /**
   * Gets the active account
   */
  getActiveAccount(correlationId) {
    const activeAccountKeyFilters = this.generateCacheKey(Constants_exports.PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS);
    const activeAccountValueFilters = this.browserStorage.getItem(activeAccountKeyFilters);
    if (!activeAccountValueFilters) {
      this.logger.trace("08gw0e", correlationId);
      return null;
    }
    const activeAccountValueObj = this.validateAndParseJson(activeAccountValueFilters);
    if (activeAccountValueObj) {
      this.logger.trace("1t3ch7", correlationId);
      return this.getAccountInfoFilteredBy({
        homeAccountId: activeAccountValueObj.homeAccountId,
        localAccountId: activeAccountValueObj.localAccountId,
        tenantId: activeAccountValueObj.tenantId
      }, correlationId);
    }
    this.logger.trace("0me1up", correlationId);
    return null;
  }
  /**
   * Sets the active account's localAccountId in cache
   * @param account
   */
  setActiveAccount(account, correlationId) {
    const activeAccountKey = this.generateCacheKey(Constants_exports.PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS);
    if (account) {
      this.logger.verbose("0rsj80", correlationId);
      const activeAccountValue = {
        homeAccountId: account.homeAccountId,
        localAccountId: account.localAccountId,
        tenantId: account.tenantId
      };
      this.setItem(activeAccountKey, JSON.stringify(activeAccountValue), correlationId);
    } else {
      this.logger.verbose("1bp5z5", correlationId);
      this.browserStorage.removeItem(activeAccountKey);
    }
    this.eventHandler.emitEvent(EventType.ACTIVE_ACCOUNT_CHANGED, correlationId);
  }
  /**
   * fetch throttling entity from the platform cache
   * @param throttlingCacheKey
   * @param correlationId
   */
  getThrottlingCache(throttlingCacheKey, correlationId) {
    const value = this.browserStorage.getItem(throttlingCacheKey);
    if (!value) {
      this.logger.trace("1h4wa6", correlationId);
      return null;
    }
    const parsedThrottlingCache = this.validateAndParseJson(value);
    if (!parsedThrottlingCache || !CacheHelpers_exports.isThrottlingEntity(throttlingCacheKey, parsedThrottlingCache)) {
      this.logger.trace("1h4wa6", correlationId);
      return null;
    }
    this.logger.trace("0of6n8", correlationId);
    return parsedThrottlingCache;
  }
  /**
   * set throttling entity to the platform cache
   * @param throttlingCacheKey
   * @param throttlingCache
   */
  setThrottlingCache(throttlingCacheKey, throttlingCache, correlationId) {
    this.logger.trace("0wfgh6", correlationId);
    this.setItem(throttlingCacheKey, JSON.stringify(throttlingCache), correlationId);
  }
  /**
   * Gets cache item with given key.
   * @param cacheKey
   * @param correlationId
   * @param generateKey
   */
  getTemporaryCache(cacheKey, correlationId, generateKey) {
    this.logger.trace("1ordf8", correlationId);
    const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;
    return this.temporaryCacheStorage.getItem(key);
  }
  /**
   * Sets the cache item with the key and value given.
   * @param key
   * @param value
   */
  setTemporaryCache(cacheKey, value, generateKey) {
    const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;
    this.temporaryCacheStorage.setItem(key, value);
  }
  /**
   * Removes the cache item with the given key.
   * @param key
   */
  removeItem(key) {
    this.browserStorage.removeItem(key);
  }
  /**
   * Removes the temporary cache item with the given key.
   * @param key
   */
  removeTemporaryItem(key) {
    this.temporaryCacheStorage.removeItem(key);
  }
  /**
   * Gets all keys in window.
   */
  getKeys() {
    return this.browserStorage.getKeys();
  }
  /**
   * Clears all cache entries created by MSAL.
   */
  clear(correlationId) {
    this.removeAllAccounts(correlationId);
    this.removeAppMetadata(correlationId);
    this.temporaryCacheStorage.getKeys().forEach((cacheKey) => {
      if (cacheKey.indexOf(PREFIX) !== -1 || cacheKey.indexOf(this.clientId) !== -1) {
        this.removeTemporaryItem(cacheKey);
      }
    });
    this.browserStorage.getKeys().forEach((cacheKey) => {
      if (cacheKey.indexOf(PREFIX) !== -1 || cacheKey.indexOf(this.clientId) !== -1) {
        this.browserStorage.removeItem(cacheKey);
      }
    });
    this.internalStorage.clear();
  }
  /**
   * Prepend msal.<client-id> to each key
   * @param key
   * @param addInstanceId
   */
  generateCacheKey(key) {
    if (StringUtils.startsWith(key, PREFIX)) {
      return key;
    }
    return `${PREFIX}.${this.clientId}.${key}`;
  }
  /**
   * Generate Credential Key. All changes to the key REQUIRE a schema version update.
   * Cache Key: msal.<schema_version>|<home_account_id>|<environment>|<credential_type>|<client_id or familyId>|<realm>|<scopes>|<scheme>|<additional_cache_key_components_hash>
   *
   * @param credentialEntity
   * @param hash - optional precomputed hash of additionalCacheKeyComponents
   * @returns
   */
  generateCredentialKey(credential, additionalCacheKeyHash) {
    const familyId = credential.credentialType === Constants_exports.CredentialType.REFRESH_TOKEN && credential.familyId || credential.clientId;
    const scheme = credential.tokenType && credential.tokenType.toLowerCase() !== Constants_exports.AuthenticationScheme.BEARER.toLowerCase() ? credential.tokenType.toLowerCase() : "";
    const credentialKey = [
      `${PREFIX}.${CREDENTIAL_SCHEMA_VERSION}`,
      credential.homeAccountId,
      credential.environment,
      credential.credentialType,
      familyId,
      credential.realm || "",
      credential.target || "",
      scheme
    ];
    if (credential.additionalCacheKeyComponents && Object.keys(credential.additionalCacheKeyComponents).length > 0 && additionalCacheKeyHash) {
      credentialKey.push(additionalCacheKeyHash);
    }
    return credentialKey.join(CACHE_KEY_SEPARATOR).toLowerCase();
  }
  /**
   * Cache Key: msal.<schema_version>.<home_account_id>.<environment>.<tenant_id>
   * @param account
   * @returns
   */
  generateAccountKey(account) {
    const homeTenantId = account.homeAccountId.split(".")[1];
    const accountKey = [
      `${PREFIX}.${ACCOUNT_SCHEMA_VERSION}`,
      account.homeAccountId,
      account.environment,
      homeTenantId || account.tenantId || ""
    ];
    return accountKey.join(CACHE_KEY_SEPARATOR).toLowerCase();
  }
  /**
   * Reset all temporary cache items
   * @param correlationId
   */
  resetRequestCache(correlationId) {
    this.logger.trace("0h0ynu", correlationId);
    this.removeTemporaryItem(this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS));
    this.removeTemporaryItem(this.generateCacheKey(TemporaryCacheKeys.VERIFIER));
    this.removeTemporaryItem(this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI));
    this.removeTemporaryItem(this.generateCacheKey(TemporaryCacheKeys.URL_HASH));
    this.removeTemporaryItem(this.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST));
    this.setInteractionInProgress(false, void 0);
  }
  cacheAuthorizeRequest(authCodeRequest, correlationId, codeVerifier) {
    this.logger.trace("1tzef5", correlationId);
    const encodedValue = base64Encode(JSON.stringify(authCodeRequest));
    this.setTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, encodedValue, true);
    if (codeVerifier) {
      const encodedVerifier = base64Encode(codeVerifier);
      this.setTemporaryCache(TemporaryCacheKeys.VERIFIER, encodedVerifier, true);
    }
  }
  /**
   * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
   * @param correlationId
   */
  getCachedRequest(correlationId) {
    this.logger.trace("0uen20", correlationId);
    const encodedTokenRequest = this.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, correlationId, true);
    if (!encodedTokenRequest) {
      throw createBrowserAuthError(noTokenRequestCacheError, "");
    }
    const encodedVerifier = this.getTemporaryCache(TemporaryCacheKeys.VERIFIER, correlationId, true);
    let parsedRequest;
    let verifier = "";
    try {
      parsedRequest = JSON.parse(base64Decode(encodedTokenRequest));
      if (encodedVerifier) {
        verifier = base64Decode(encodedVerifier);
      }
    } catch (e) {
      this.logger.errorPii(`0ewsey ${encodedTokenRequest}`, correlationId);
      this.logger.error(`0tvdic ${e}`, correlationId);
      throw createBrowserAuthError(unableToParseTokenRequestCacheError, "");
    }
    return [parsedRequest, verifier];
  }
  /**
   * Gets cached native request for redirect flows
   * @param correlationId
   */
  getCachedNativeRequest() {
    this.logger.trace("1yxcdm", "");
    const cachedRequest = this.getTemporaryCache(TemporaryCacheKeys.NATIVE_REQUEST, "", true);
    if (!cachedRequest) {
      this.logger.trace("0mnxd4", "");
      return null;
    }
    const parsedRequest = this.validateAndParseJson(cachedRequest);
    if (!parsedRequest) {
      this.logger.error("0rrkip", "");
      return null;
    }
    return parsedRequest;
  }
  isInteractionInProgress(matchClientId) {
    const clientId = this.getInteractionInProgress()?.clientId;
    if (matchClientId) {
      return clientId === this.clientId;
    } else {
      return !!clientId;
    }
  }
  getInteractionInProgress() {
    const key = `${PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
    const value = this.getTemporaryCache(key, "", false);
    try {
      return value ? JSON.parse(value) : null;
    } catch (e) {
      this.logger.error("0jjyys", "");
      this.removeTemporaryItem(key);
      this.resetRequestCache("");
      clearHash(window);
      return null;
    }
  }
  setInteractionInProgress(inProgress, type = INTERACTION_TYPE.SIGNIN, allowOverride = false, correlationId = "") {
    const key = `${PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
    if (inProgress) {
      const existingInteraction = this.getInteractionInProgress();
      if (existingInteraction) {
        if (allowOverride) {
          this.logger.warning(`1pmscr ${existingInteraction.clientId} ${existingInteraction.type}`, correlationId);
          cancelPendingBridgeResponse(this.logger, correlationId);
          this.removeTemporaryItem(key);
        } else {
          throw createBrowserAuthError(interactionInProgress, "");
        }
      }
      this.setTemporaryCache(key, JSON.stringify({ clientId: this.clientId, type }), false);
    } else if (!inProgress && this.getInteractionInProgress()?.clientId === this.clientId) {
      this.removeTemporaryItem(key);
    }
  }
  /**
   * Builds credential entities from AuthenticationResult object and saves the resulting credentials to the cache
   * @param result
   * @param request
   */
  hydrateCache(result, request) {
    return __async(this, null, function* () {
      const idTokenEntity = CacheHelpers_exports.createIdTokenEntity(result.account.homeAccountId, result.account.environment, result.idToken, this.clientId, result.tenantId);
      const accessTokenEntity = CacheHelpers_exports.createAccessTokenEntity(
        result.account.homeAccountId,
        result.account.environment,
        result.accessToken,
        this.clientId,
        result.tenantId,
        result.scopes.join(" "),
        // Access token expiresOn stored in seconds, converting from AuthenticationResult expiresOn stored as Date
        result.expiresOn ? TimeUtils_exports.toSecondsFromDate(result.expiresOn) : 0,
        result.extExpiresOn ? TimeUtils_exports.toSecondsFromDate(result.extExpiresOn) : 0,
        base64Decode,
        request.correlationId || "",
        void 0,
        // refreshOn
        result.tokenType,
        void 0,
        // userAssertionHash
        request.sshKid
      );
      if (request.resource) {
        accessTokenEntity.resource = request.resource;
      }
      const cacheRecord = {
        idToken: idTokenEntity,
        accessToken: accessTokenEntity
      };
      return this.saveCacheRecord(cacheRecord, result.correlationId, AuthToken_exports.isKmsi(AuthToken_exports.extractTokenClaims(result.idToken, base64Decode, result.correlationId)), ApiId.hydrateCache);
    });
  }
  /**
   * saves a cache record
   * @param cacheRecord {CacheRecord}
   * @param storeInCache {?StoreInCache}
   * @param correlationId {?string} correlation id
   */
  saveCacheRecord(cacheRecord, correlationId, kmsi, apiId, storeInCache) {
    return __async(this, null, function* () {
      try {
        yield __superGet(_BrowserCacheManager.prototype, this, "saveCacheRecord").call(this, cacheRecord, correlationId, kmsi, apiId, storeInCache);
      } catch (e) {
        if (e instanceof CacheError && this.performanceClient && correlationId) {
          try {
            const tokenKeys = this.getTokenKeys();
            this.performanceClient.addFields({
              cacheRtCount: tokenKeys.refreshToken.length,
              cacheIdCount: tokenKeys.idToken.length,
              cacheAtCount: tokenKeys.accessToken.length
            }, correlationId);
          } catch (e2) {
          }
        }
        throw e;
      }
    });
  }
};
function getStorageImplementation(clientId, cacheLocation, logger, performanceClient) {
  try {
    switch (cacheLocation) {
      case BrowserCacheLocation.LocalStorage:
        return new LocalStorage(clientId, logger, performanceClient);
      case BrowserCacheLocation.SessionStorage:
        return new SessionStorage();
      case BrowserCacheLocation.MemoryStorage:
      default:
        break;
    }
  } catch (e) {
    logger.error(e, "");
  }
  return new MemoryStorage();
}
var DEFAULT_BROWSER_CACHE_MANAGER = (clientId, logger, performanceClient, eventHandler, staticAuthorityOptions, tokenBindingKeyManager = DEFAULT_TOKEN_BINDING_KEY_MANAGER) => {
  const cacheOptions = {
    cacheLocation: BrowserCacheLocation.MemoryStorage,
    cacheRetentionDays: 5
  };
  return new BrowserCacheManager(clientId, cacheOptions, DEFAULT_CRYPTO_IMPLEMENTATION, logger, performanceClient, eventHandler, staticAuthorityOptions, tokenBindingKeyManager);
};

// node_modules/@azure/msal-browser/dist/cache/AccountManager.mjs
function getAllAccounts(logger, browserStorage, isInBrowser, correlationId, accountFilter) {
  logger.verbose("1yd030", correlationId);
  return isInBrowser ? browserStorage.getAllAccounts(accountFilter, correlationId) : [];
}
function getAccount(accountFilter, logger, browserStorage, correlationId) {
  logger.trace("0u7b90", correlationId);
  const account = browserStorage.getAccountInfoFilteredBy(accountFilter, correlationId);
  if (account) {
    logger.verbose("0btgll", correlationId);
    return account;
  } else {
    logger.verbose("0ltaj5", correlationId);
    return null;
  }
}
function setActiveAccount(account, browserStorage, correlationId) {
  browserStorage.setActiveAccount(account, correlationId);
}
function getActiveAccount(browserStorage, correlationId) {
  return browserStorage.getActiveAccount(correlationId);
}

// node_modules/@azure/msal-browser/dist/event/EventHandler.mjs
var BROADCAST_CHANNEL_NAME2 = "msal.broadcast.event";
var EventHandler = class {
  constructor(logger) {
    this.eventCallbacks = /* @__PURE__ */ new Map();
    this.logger = logger || new Logger({}, name, version);
    if (typeof BroadcastChannel !== "undefined") {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME2);
    }
    this.invokeCrossTabCallbacks = this.invokeCrossTabCallbacks.bind(this);
  }
  /**
   * Adds event callbacks to array
   * @param callback - callback to be invoked when an event is raised
   * @param eventTypes - list of events that this callback will be invoked for, if not provided callback will be invoked for all events
   * @param callbackId - Identifier for the callback, used to locate and remove the callback when no longer required
   */
  addEventCallback(callback, eventTypes, callbackId) {
    if (typeof window !== "undefined") {
      const id = callbackId || createGuid();
      if (this.eventCallbacks.has(id)) {
        this.logger.error(`1578i0 ${id}`, "");
        return null;
      }
      this.eventCallbacks.set(id, [callback, eventTypes || []]);
      this.logger.verbose(`1cnec4 ${id}`, "");
      return id;
    }
    return null;
  }
  /**
   * Removes callback with provided id from callback array
   * @param callbackId
   */
  removeEventCallback(callbackId) {
    this.eventCallbacks.delete(callbackId);
    this.logger.verbose(`12zotd ${callbackId}`, "");
  }
  /**
   * Emits events by calling callback with event message
   * @param eventType
   * @param interactionType
   * @param payload
   * @param error
   */
  emitEvent(eventType, correlationId, interactionType, payload, error) {
    const message = {
      eventType,
      interactionType: interactionType || null,
      payload: payload || null,
      error: error || null,
      correlationId,
      timestamp: Date.now()
    };
    switch (eventType) {
      case EventType.LOGIN_SUCCESS:
      case EventType.LOGOUT_SUCCESS:
      case EventType.ACTIVE_ACCOUNT_CHANGED:
        this.broadcastChannel?.postMessage(message);
    }
    this.invokeCallbacks(message);
  }
  /**
   * Invoke registered callbacks
   * @param message
   */
  invokeCallbacks(message) {
    this.eventCallbacks.forEach(([callback, eventTypes], callbackId) => {
      if (eventTypes.length === 0 || eventTypes.includes(message.eventType)) {
        this.logger.verbose(`15jpwk ${callbackId} ${message.eventType}`, "");
        callback.apply(null, [message]);
      }
    });
  }
  /**
   * Wrapper around invokeCallbacks to handle broadcast events received from other tabs/instances
   * @param event
   */
  invokeCrossTabCallbacks(event) {
    const message = event.data;
    this.invokeCallbacks(message);
  }
  /**
   * Listen for events broadcasted from other tabs/instances
   */
  subscribeCrossTab() {
    this.broadcastChannel?.addEventListener("message", this.invokeCrossTabCallbacks);
  }
  /**
   * Unsubscribe from broadcast events
   */
  unsubscribeCrossTab() {
    this.broadcastChannel?.removeEventListener("message", this.invokeCrossTabCallbacks);
  }
};

// node_modules/@azure/msal-browser/dist/interaction_client/BaseInteractionClient.mjs
var BaseInteractionClient = class {
  constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, correlationId, platformAuthProvider, tokenBindingKeyManager) {
    this.config = config;
    this.browserStorage = storageImpl;
    this.browserCrypto = browserCrypto;
    this.networkClient = this.config.system.networkClient;
    this.eventHandler = eventHandler;
    this.navigationClient = navigationClient;
    this.platformAuthProvider = platformAuthProvider;
    this.correlationId = correlationId;
    this.logger = logger.clone(name, version);
    this.performanceClient = performanceClient;
    this.tokenBindingKeyManager = tokenBindingKeyManager || new TokenBindingKeyManager(this.logger, this.performanceClient);
  }
};
function getRedirectUri(requestRedirectUri, clientConfigRedirectUri, logger, correlationId) {
  logger.verbose("0bd1la", correlationId);
  const redirectUri = requestRedirectUri || clientConfigRedirectUri || "";
  return UrlString.getAbsoluteUrl(redirectUri, getCurrentUri(), correlationId);
}
function initializeServerTelemetryManager(apiId, clientId, correlationId, browserStorage, logger, forceRefresh, enabled = true) {
  logger.verbose("1p12tq", correlationId);
  if (!enabled) {
    logger.verbose("0tajnr", correlationId);
    return new StubServerTelemetryManager();
  }
  const telemetryPayload = {
    clientId,
    correlationId,
    apiId,
    forceRefresh: forceRefresh || false,
    wrapperSKU: browserStorage.getWrapperMetadata()[0],
    wrapperVer: browserStorage.getWrapperMetadata()[1]
  };
  return new ServerTelemetryManager(telemetryPayload, browserStorage);
}
function getDiscoveredAuthority(config, correlationId, performanceClient, browserStorage, logger, requestAuthority, requestAzureCloudOptions, requestExtraQueryParameters, account) {
  return __async(this, null, function* () {
    const instanceAwareEQ = requestExtraQueryParameters && requestExtraQueryParameters.hasOwnProperty("instance_aware") ? requestExtraQueryParameters["instance_aware"] : void 0;
    const authorityOptions = {
      protocolMode: config.system.protocolMode,
      OIDCOptions: config.auth.OIDCOptions,
      knownAuthorities: config.auth.knownAuthorities,
      cloudDiscoveryMetadata: config.auth.cloudDiscoveryMetadata,
      authorityMetadata: config.auth.authorityMetadata
    };
    const resolvedAuthority = requestAuthority || config.auth.authority;
    const resolvedInstanceAware = instanceAwareEQ?.length ? instanceAwareEQ === "true" : config.auth.instanceAware;
    const userAuthority = account && resolvedInstanceAware ? config.auth.authority.replace(UrlString.getDomainFromUrl(resolvedAuthority, correlationId), account.environment) : resolvedAuthority;
    const builtAuthority = Authority.generateAuthority(userAuthority, requestAzureCloudOptions || config.auth.azureCloudOptions);
    const discoveredAuthority = yield invokeAsync(AuthorityFactory_exports.createDiscoveredInstance, AuthorityFactoryCreateDiscoveredInstance, logger, performanceClient, correlationId)(builtAuthority, config.system.networkClient, browserStorage, authorityOptions, logger, correlationId, performanceClient);
    if (account && !discoveredAuthority.isAlias(account.environment)) {
      throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.authorityMismatch, correlationId);
    }
    return discoveredAuthority;
  });
}
function clearCacheOnLogout(browserStorage, browserCrypto, logger, correlationId, account) {
  return __async(this, null, function* () {
    if (account) {
      try {
        browserStorage.removeAccount(account, correlationId);
        logger.verbose("0s4z6h", correlationId);
      } catch (error) {
        logger.error("0mgg1d", correlationId);
      }
    } else {
      try {
        logger.verbose("0zj631", correlationId);
        browserStorage.clear(correlationId);
        yield browserCrypto.clearKeystore(correlationId);
      } catch (e) {
        logger.error("12ih0c", correlationId);
      }
    }
  });
}

// node_modules/@azure/msal-browser/dist/request/RequestHelpers.mjs
var SUPPORTED_AUTHENTICATION_SCHEMES = /* @__PURE__ */ new Set([
  Constants_exports.AuthenticationScheme.BEARER,
  Constants_exports.AuthenticationScheme.POP,
  Constants_exports.AuthenticationScheme.DPOP,
  Constants_exports.AuthenticationScheme.SSH
]);
function validateSshRequest(request, correlationId) {
  if (!request.sshJwk) {
    throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.missingSshJwk, correlationId);
  }
  if (!request.sshKid) {
    throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.missingSshKid, correlationId);
  }
}
function validateDpopRequest(request, correlationId) {
  if (!request.resourceRequestMethod?.trim() || !request.resourceRequestUri?.trim()) {
    throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.dpopMissingResourceContext, correlationId);
  }
}
function getTokenBindingRequestParams(request, tokenBindingKeyManager, logger, performanceClient) {
  return __async(this, null, function* () {
    switch (request.authenticationScheme) {
      case Constants_exports.AuthenticationScheme.DPOP:
        if (request.platformBroker) {
          return {};
        }
        if (request.dpopJkt) {
          return { dpopJkt: request.dpopJkt };
        }
        return {
          dpopJkt: yield tokenBindingKeyManager.provisionTokenBindingKey({
            tokenBindingKeyType: Constants_exports.AuthenticationScheme.DPOP.toLowerCase(),
            tokenBindingKeyAlgorithm: JsonWebTokenAlgorithms.ES256,
            correlationId: request.correlationId
          })
        };
      case Constants_exports.AuthenticationScheme.POP:
        if (!request.platformBroker) {
          return {};
        }
        const cryptoOps = new CryptoOps(logger, performanceClient);
        if (request.popKid) {
          return { reqCnf: cryptoOps.encodeKid(request.popKid) };
        }
        const popTokenGenerator = new PopTokenGenerator(cryptoOps, tokenBindingKeyManager, performanceClient);
        const generatedReqCnfData = yield invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PerformanceEvents_exports.PopTokenGenerateCnf, logger, performanceClient, request.correlationId)(request, logger);
        return { reqCnf: generatedReqCnfData.reqCnfString };
      default:
        return {};
    }
  });
}
function initializeBaseRequest(request, config, performanceClient, logger, correlationId) {
  return __async(this, null, function* () {
    const authority = request.authority || config.auth.authority;
    const scopes = [...request && request.scopes || []];
    const validatedRequest = __spreadProps(__spreadValues({}, request), {
      correlationId: request.correlationId,
      authority,
      scopes
    });
    if (!validatedRequest.authenticationScheme) {
      validatedRequest.authenticationScheme = Constants_exports.AuthenticationScheme.BEARER;
      logger.verbose("1l4fwv", correlationId);
    } else {
      if (!SUPPORTED_AUTHENTICATION_SCHEMES.has(validatedRequest.authenticationScheme)) {
        throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.unsupportedAuthenticationScheme, correlationId);
      }
      switch (validatedRequest.authenticationScheme) {
        case Constants_exports.AuthenticationScheme.SSH:
          validateSshRequest(request, correlationId);
          break;
        case Constants_exports.AuthenticationScheme.DPOP: {
          validateDpopRequest(request, correlationId);
          break;
        }
      }
      logger.verbose(`1ecmns ${validatedRequest.authenticationScheme}`, correlationId);
    }
    return validatedRequest;
  });
}
function initializeSilentRequest(request, account, config, performanceClient, logger) {
  return __async(this, null, function* () {
    const baseRequest = yield invokeAsync(initializeBaseRequest, InitializeBaseRequest, logger, performanceClient, request.correlationId)(request, config, performanceClient, logger, request.correlationId);
    return __spreadProps(__spreadValues(__spreadValues({}, request), baseRequest), {
      account,
      forceRefresh: request.forceRefresh || false
    });
  });
}
function validateRequestMethod(interactionRequest, protocolMode) {
  let httpMethod;
  const requestMethod = interactionRequest.httpMethod;
  if (protocolMode === ProtocolMode.EAR) {
    if (requestMethod && requestMethod !== Constants_exports.HttpMethod.POST) {
      throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.invalidRequestMethodForEAR, "");
    } else {
      httpMethod = Constants_exports.HttpMethod.POST;
    }
  } else {
    httpMethod = requestMethod || Constants_exports.HttpMethod.GET;
  }
  return httpMethod;
}

// node_modules/@azure/msal-browser/dist/interaction_client/StandardInteractionClient.mjs
var StandardInteractionClient = class extends BaseInteractionClient {
  /**
   * Initializer for the logout request.
   * @param logoutRequest
   */
  initializeLogoutRequest(logoutRequest) {
    this.logger.verbose("0546u4", this.correlationId);
    const validLogoutRequest = __spreadValues({
      correlationId: this.correlationId
    }, logoutRequest);
    if (logoutRequest) {
      if (!logoutRequest.logoutHint) {
        if (logoutRequest.account) {
          const logoutHint = logoutRequest.account.loginHint || this.getLogoutHintFromIdTokenClaims(logoutRequest.account);
          if (logoutHint) {
            this.logger.verbose("0d7s8p", this.correlationId);
            validLogoutRequest.logoutHint = logoutHint;
          }
        } else {
          this.logger.verbose("0pdtc3", this.correlationId);
        }
      } else {
        this.logger.verbose("12k4l4", this.correlationId);
      }
    } else {
      this.logger.verbose("07ndze", this.correlationId);
    }
    if (!logoutRequest || logoutRequest.postLogoutRedirectUri !== null) {
      if (logoutRequest && logoutRequest.postLogoutRedirectUri) {
        this.logger.verbose("1vamm6", validLogoutRequest.correlationId);
        validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(logoutRequest.postLogoutRedirectUri, getCurrentUri(), validLogoutRequest.correlationId);
      } else if (this.config.auth.postLogoutRedirectUri === null) {
        this.logger.verbose("15m5g7", validLogoutRequest.correlationId);
      } else if (this.config.auth.postLogoutRedirectUri) {
        this.logger.verbose("1f4xlz", validLogoutRequest.correlationId);
        validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(this.config.auth.postLogoutRedirectUri, getCurrentUri(), validLogoutRequest.correlationId);
      } else {
        this.logger.verbose("17s5rf", validLogoutRequest.correlationId);
        validLogoutRequest.postLogoutRedirectUri = UrlString.getAbsoluteUrl(getCurrentUri(), getCurrentUri(), validLogoutRequest.correlationId);
      }
    } else {
      this.logger.verbose("0ljv63", validLogoutRequest.correlationId);
    }
    return validLogoutRequest;
  }
  /**
   * Parses login_hint ID Token Claim out of AccountInfo object to be used as
   * logout_hint in end session request.
   * @param account
   */
  getLogoutHintFromIdTokenClaims(account) {
    const idTokenClaims = account.idTokenClaims;
    if (idTokenClaims) {
      if (idTokenClaims.login_hint) {
        this.logger.verbose("0u5bmc", this.correlationId);
        return idTokenClaims.login_hint;
      } else {
        this.logger.verbose("0mvp54", this.correlationId);
      }
    } else {
      this.logger.verbose("1e7bdp", this.correlationId);
    }
    return null;
  }
  /**
   * Creates an Authorization Code Client with the given authority, or the default authority.
   * @param params {
   *         serverTelemetryManager: ServerTelemetryManager;
   *         authorityUrl?: string;
   *         requestAzureCloudOptions?: AzureCloudOptions;
   *         requestExtraQueryParameters?: StringDict;
   *         account?: AccountInfo;
   *        }
   */
  createAuthCodeClient(params) {
    return __async(this, null, function* () {
      const clientConfig = yield invokeAsync(this.getClientConfiguration.bind(this), StandardInteractionClientGetClientConfiguration, this.logger, this.performanceClient, this.correlationId)(params);
      return new AuthorizationCodeClient(clientConfig, this.performanceClient);
    });
  }
  /**
   * Creates a Client Configuration object with the given request authority, or the default authority.
   * @param params {
   *         serverTelemetryManager: ServerTelemetryManager;
   *         requestAuthority?: string;
   *         requestAzureCloudOptions?: AzureCloudOptions;
   *         requestExtraQueryParameters?: boolean;
   *         account?: AccountInfo;
   *        }
   */
  getClientConfiguration(params) {
    return __async(this, null, function* () {
      const { serverTelemetryManager, requestAuthority, requestAzureCloudOptions, requestExtraQueryParameters, account } = params;
      const discoveredAuthority = params.authority || (yield invokeAsync(getDiscoveredAuthority, StandardInteractionClientGetDiscoveredAuthority, this.logger, this.performanceClient, this.correlationId)(this.config, this.correlationId, this.performanceClient, this.browserStorage, this.logger, requestAuthority, requestAzureCloudOptions, requestExtraQueryParameters, account));
      const logger = this.config.system.loggerOptions;
      return {
        authOptions: {
          clientId: this.config.auth.clientId,
          authority: discoveredAuthority,
          clientCapabilities: this.config.auth.clientCapabilities,
          redirectUri: this.config.auth.redirectUri,
          isMcp: this.config.auth.isMcp
        },
        systemOptions: {
          tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds,
          preventCorsPreflight: true
        },
        loggerOptions: {
          loggerCallback: logger.loggerCallback,
          piiLoggingEnabled: logger.piiLoggingEnabled,
          logLevel: logger.logLevel,
          correlationId: this.correlationId
        },
        cryptoInterface: this.browserCrypto,
        tokenBindingKeyManager: this.tokenBindingKeyManager,
        networkInterface: this.networkClient,
        storageInterface: this.browserStorage,
        serverTelemetryManager,
        libraryInfo: {
          sku: BrowserConstants.MSAL_SKU,
          version,
          cpu: "",
          os: ""
        },
        telemetry: this.config.telemetry
      };
    });
  }
};
function initializeAuthorizationRequest(request, interactionType, config, browserCrypto, browserStorage, logger, performanceClient, correlationId) {
  return __async(this, null, function* () {
    const redirectUri = getRedirectUri(request.redirectUri, config.auth.redirectUri, logger, correlationId);
    if (new URL(redirectUri).origin !== new URL(window.location.href).origin) {
      logger.warning("08qbvw", correlationId);
      performanceClient.addFields({ isRedirectUriCrossOrigin: true }, correlationId);
    }
    const browserState = {
      interactionType
    };
    const state = ProtocolUtils_exports.setRequestState(browserCrypto, request && request.state || "", browserState, correlationId);
    const baseRequest = yield invokeAsync(initializeBaseRequest, InitializeBaseRequest, logger, performanceClient, correlationId)(__spreadProps(__spreadValues({}, request), { correlationId }), config, performanceClient, logger, correlationId);
    const interactionRequest = __spreadProps(__spreadValues({}, baseRequest), {
      redirectUri,
      state,
      nonce: request.nonce || createNewGuid(),
      responseMode: config.auth.OIDCOptions.responseMode
    });
    const validatedRequest = __spreadProps(__spreadValues({}, interactionRequest), {
      httpMethod: validateRequestMethod(interactionRequest, config.system.protocolMode)
    });
    if (request.loginHint || request.sid) {
      return validatedRequest;
    }
    const account = request.account || browserStorage.getActiveAccount(correlationId);
    if (account) {
      logger.verbose("1eqlb3", correlationId);
      logger.verbosePii(`0tf99t ${account.homeAccountId}`, correlationId);
      validatedRequest.account = account;
    }
    return validatedRequest;
  });
}

// node_modules/@azure/msal-browser/dist/popup_relay/constants.mjs
var POPUP_RELAY_RESPONSE_TYPE = "msal:popup-relay-response:v1";

// node_modules/@azure/msal-browser/dist/popup_relay/relayClient.mjs
function buildPopupRelayUrl(popupRelayUri, id, action, correlationId) {
  const req = __spreadValues({ id }, action);
  const target = new URL(popupRelayUri, window.location.origin);
  if (target.origin !== window.location.origin) {
    throw createBrowserAuthError(popupRelayUnsupportedFlow, correlationId, "popup_relay_cross_origin");
  }
  const hashParams = new URLSearchParams();
  hashParams.set("req", JSON.stringify(req));
  target.hash = hashParams.toString();
  return target.toString();
}
function waitForPopupRelayResponse(timeoutMs, logger, request, popupWindow, performanceClient) {
  return __async(this, null, function* () {
    return new Promise((resolve, reject) => {
      const correlationId = request.correlationId;
      logger.verbose("1d05g9", correlationId);
      performanceClient.addFields({ redirectBridgeTimeoutMs: timeoutMs }, correlationId);
      const { libraryState } = ProtocolUtils_exports.parseRequestState(base64Decode, request.state || "", correlationId);
      const expectedId = libraryState.id;
      const expectedOrigin = window.location.origin;
      let settled = false;
      const cleanup = () => {
        window.removeEventListener("message", onMessage);
        clearTimeout(timeoutId);
        clearInterval(closedPoll);
      };
      const onMessage = (event) => {
        if (event.origin !== expectedOrigin || event.source !== popupWindow) {
          return;
        }
        const data = event.data;
        if (!data || data.type !== POPUP_RELAY_RESPONSE_TYPE || data.id !== expectedId) {
          return;
        }
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        if (data.error) {
          reject(createBrowserAuthError(data.error, correlationId));
        } else if (data.payload) {
          resolve(data.payload);
        } else {
          reject(createBrowserAuthError(redirectBridgeEmptyResponse, correlationId));
        }
      };
      window.addEventListener("message", onMessage);
      const timeoutId = window.setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(createBrowserAuthError(timedOut, correlationId, "popup_relay_timeout"));
      }, timeoutMs);
      const closedPoll = window.setInterval(() => {
        if (popupWindow.closed && !settled) {
          settled = true;
          cleanup();
          reject(createBrowserAuthError(userCancelled, correlationId));
        }
      }, 500);
    });
  });
}

// node_modules/@azure/msal-browser/dist/utils/BrowserProtocolUtils.mjs
function extractBrowserRequestState(browserCrypto, state, correlationId) {
  if (!state) {
    return null;
  }
  try {
    const requestStateObj = ProtocolUtils_exports.parseRequestState(browserCrypto.base64Decode, state, correlationId);
    return requestStateObj.libraryState.meta;
  } catch (e) {
    throw createClientAuthError(ClientAuthErrorCodes_exports.invalidState, correlationId);
  }
}

// node_modules/@azure/msal-browser/dist/response/ResponseHandler.mjs
function deserializeResponse(responseString, responseLocation, logger, correlationId) {
  const serverParams = UrlUtils_exports.getDeserializedResponse(responseString);
  if (!serverParams) {
    if (!UrlUtils_exports.stripLeadingHashOrQuery(responseString)) {
      logger.error(`18h0l1 ${responseLocation} ${responseLocation}`, correlationId);
      throw createBrowserAuthError(hashEmptyError, correlationId);
    } else {
      logger.error(`13pl0s ${responseLocation} ${responseLocation}`, correlationId);
      logger.errorPii(`1097vx ${responseLocation} ${responseString}`, correlationId);
      throw createBrowserAuthError(hashDoesNotContainKnownProperties, correlationId);
    }
  }
  return serverParams;
}
function validateInteractionType(response, browserCrypto, interactionType, correlationId) {
  if (!response.state) {
    throw createBrowserAuthError(noStateInHash, correlationId);
  }
  const platformStateObj = extractBrowserRequestState(browserCrypto, response.state, correlationId);
  if (!platformStateObj) {
    throw createBrowserAuthError(unableToParseState, correlationId);
  }
  if (platformStateObj.interactionType !== interactionType) {
    throw createBrowserAuthError(stateInteractionTypeMismatch, correlationId);
  }
}

// node_modules/@azure/msal-browser/dist/interaction_handler/InteractionHandler.mjs
var InteractionHandler = class {
  constructor(authCodeModule, storageImpl, authCodeRequest, logger, performanceClient) {
    this.authModule = authCodeModule;
    this.browserStorage = storageImpl;
    this.authCodeRequest = authCodeRequest;
    this.logger = logger;
    this.performanceClient = performanceClient;
  }
  /**
   * Function to handle response parameters from hash.
   * @param locationHash
   */
  handleCodeResponse(response, request, apiId) {
    return __async(this, null, function* () {
      let authCodeResponse;
      try {
        authCodeResponse = Authorize_exports.getAuthorizationCodePayload(response, request.state, request.correlationId);
      } catch (e) {
        if (e instanceof ServerError && e.subError === userCancelled) {
          throw createBrowserAuthError(userCancelled, request.correlationId);
        } else {
          throw e;
        }
      }
      return invokeAsync(this.handleCodeResponseFromServer.bind(this), PerformanceEvents_exports.HandleCodeResponseFromServer, this.logger, this.performanceClient, request.correlationId)(authCodeResponse, request, apiId);
    });
  }
  /**
   * Process auth code response from AAD
   * @param authCodeResponse
   * @param request
   * @param validateNonce
   * @returns
   */
  handleCodeResponseFromServer(authCodeResponse, request, apiId, validateNonce = true) {
    return __async(this, null, function* () {
      this.logger.trace("0mf2hb", request.correlationId);
      this.authCodeRequest.code = authCodeResponse.code;
      if (validateNonce) {
        authCodeResponse.nonce = request.nonce || void 0;
      }
      authCodeResponse.state = request.state;
      if (authCodeResponse.client_info) {
        this.authCodeRequest.clientInfo = authCodeResponse.client_info;
      } else {
        const ccsCred = this.createCcsCredentials(request);
        if (ccsCred) {
          this.authCodeRequest.ccsCredential = ccsCred;
        }
      }
      const tokenResponse = yield invokeAsync(this.authModule.acquireToken.bind(this.authModule), AuthClientAcquireToken, this.logger, this.performanceClient, request.correlationId)(this.authCodeRequest, apiId, authCodeResponse);
      return tokenResponse;
    });
  }
  /**
   * Build ccs creds if available
   */
  createCcsCredentials(request) {
    if (request.account) {
      return {
        credential: request.account.homeAccountId,
        type: CcsCredentialType.HOME_ACCOUNT_ID
      };
    } else if (request.loginHint) {
      return {
        credential: request.loginHint,
        type: CcsCredentialType.UPN
      };
    }
    return null;
  }
};

// node_modules/@azure/msal-browser/dist/broker/nativeBroker/PlatformAuthRequest.mjs
var PlatformAuthTokenType = {
  DPOP_WITH_PROOF: "dpop+proof"
};
var PROOF_OF_POSSESSION_TOKEN_TYPES = [
  Constants_exports.AuthenticationScheme.POP,
  Constants_exports.AuthenticationScheme.DPOP,
  PlatformAuthTokenType.DPOP_WITH_PROOF
];
function isProofOfPossessionTokenType(tokenType) {
  return tokenType !== void 0 && PROOF_OF_POSSESSION_TOKEN_TYPES.includes(tokenType);
}
function createPlatformAuthExtraParametersNoCache(extraParametersNoCache, isProofOfPossessionRequest, resourceRequestMethod, resourceRequestUri, dpopNonce) {
  if (!isProofOfPossessionRequest) {
    return extraParametersNoCache;
  }
  return __spreadValues(__spreadValues(__spreadValues(__spreadValues({}, extraParametersNoCache), resourceRequestMethod && {
    pop_method: resourceRequestMethod
  }), resourceRequestUri && {
    pop_url: resourceRequestUri
  }), dpopNonce && {
    pop_nonce: dpopNonce
  });
}

// node_modules/@azure/msal-browser/dist/error/NativeAuthErrorCodes.mjs
var contentError = "ContentError";
var pageException = "PageException";
var userSwitch = "user_switch";
var unsupportedMethod = "unsupported_method";

// node_modules/@azure/msal-browser/dist/broker/nativeBroker/NativeStatusCodes.mjs
var USER_INTERACTION_REQUIRED = "USER_INTERACTION_REQUIRED";
var USER_CANCEL = "USER_CANCEL";
var NO_NETWORK = "NO_NETWORK";
var DISABLED = "DISABLED";
var ACCOUNT_UNAVAILABLE = "ACCOUNT_UNAVAILABLE";
var UI_NOT_ALLOWED = "UI_NOT_ALLOWED";

// node_modules/@azure/msal-browser/dist/error/NativeAuthError.mjs
var INVALID_METHOD_ERROR = -2147186943;
var NativeAuthError = class _NativeAuthError extends AuthError {
  constructor(errorCode, correlationId, description, ext) {
    super(errorCode, correlationId, description || getDefaultErrorMessage(errorCode));
    Object.setPrototypeOf(this, _NativeAuthError.prototype);
    this.name = "NativeAuthError";
    this.ext = ext;
  }
};
function isFatalNativeAuthError(error) {
  if (error.ext && error.ext.status && error.ext.status === DISABLED) {
    return true;
  }
  if (error.ext && error.ext.error && error.ext.error === INVALID_METHOD_ERROR) {
    return true;
  }
  switch (error.errorCode) {
    case contentError:
    case pageException:
      return true;
    default:
      return false;
  }
}
function createNativeAuthError(code, correlationId, description, ext) {
  let error;
  if (ext && ext.status) {
    switch (ext.status) {
      case ACCOUNT_UNAVAILABLE:
        error = createInteractionRequiredAuthError(InteractionRequiredAuthErrorCodes_exports.nativeAccountUnavailable, correlationId, getDefaultErrorMessage(code));
        break;
      case USER_INTERACTION_REQUIRED:
        error = new InteractionRequiredAuthError(code, correlationId, description);
        break;
      case USER_CANCEL:
        error = createBrowserAuthError(userCancelled, correlationId);
        break;
      case NO_NETWORK:
        error = createBrowserAuthError(noNetworkConnectivity, correlationId);
        break;
      case UI_NOT_ALLOWED:
        error = createInteractionRequiredAuthError(InteractionRequiredAuthErrorCodes_exports.uiNotAllowed, correlationId);
        break;
      default:
        error = new NativeAuthError(code, correlationId, description, ext);
    }
    return error;
  }
  error = new NativeAuthError(code, correlationId, description, ext);
  return error;
}

// node_modules/@azure/msal-browser/dist/interaction_client/SilentCacheClient.mjs
var SilentCacheClient = class extends StandardInteractionClient {
  /**
   * Returns unexpired tokens from the cache, if available
   * @param silentRequest
   */
  acquireToken(silentRequest) {
    return __async(this, null, function* () {
      const serverTelemetryManager = initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      const clientConfig = yield invokeAsync(this.getClientConfiguration.bind(this), StandardInteractionClientGetClientConfiguration, this.logger, this.performanceClient, this.correlationId)({
        serverTelemetryManager,
        requestAuthority: silentRequest.authority,
        requestAzureCloudOptions: silentRequest.azureCloudOptions,
        account: silentRequest.account
      });
      const silentAuthClient = new SilentFlowClient(clientConfig, this.performanceClient);
      this.logger.verbose("0wa871", this.correlationId);
      try {
        const response = yield invokeAsync(silentAuthClient.acquireCachedToken.bind(silentAuthClient), SilentFlowClientAcquireCachedToken, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest);
        const authResponse = response[0];
        this.performanceClient.addFields({
          fromCache: true
        }, silentRequest.correlationId);
        return authResponse;
      } catch (error) {
        if (error instanceof BrowserAuthError && error.errorCode === cryptoKeyNotFound) {
          this.logger.verbose("06wena", this.correlationId);
        }
        throw error;
      }
    });
  }
  /**
   * API to silenty clear the browser cache.
   * @param logoutRequest
   */
  logout(logoutRequest) {
    this.logger.verbose("1rkurh", this.correlationId);
    const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
    return clearCacheOnLogout(this.browserStorage, this.browserCrypto, this.logger, this.correlationId, validLogoutRequest.account);
  }
};

// node_modules/@azure/msal-browser/dist/interaction_client/PlatformAuthInteractionClient.mjs
var PlatformAuthInteractionClient = class extends BaseInteractionClient {
  constructor(config, browserStorage, browserCrypto, logger, eventHandler, navigationClient, apiId, performanceClient, provider, accountId, nativeStorageImpl, correlationId, tokenBindingKeyManager) {
    super(config, browserStorage, browserCrypto, logger, eventHandler, navigationClient, performanceClient, correlationId, provider, tokenBindingKeyManager);
    this.apiId = apiId;
    this.accountId = accountId;
    this.platformAuthProvider = provider;
    this.nativeStorageManager = nativeStorageImpl;
    this.silentCacheClient = new SilentCacheClient(config, this.nativeStorageManager, browserCrypto, logger, eventHandler, navigationClient, performanceClient, correlationId, provider, this.tokenBindingKeyManager);
    const extensionName = this.platformAuthProvider.getExtensionName();
    this.skus = ServerTelemetryManager.makeExtraSkuString({
      libraryName: BrowserConstants.MSAL_SKU,
      libraryVersion: version,
      extensionName,
      extensionVersion: this.platformAuthProvider.getExtensionVersion()
    });
  }
  /**
   * Adds SKUs to request extra query parameters
   * @param request {PlatformAuthRequest}
   * @private
   */
  addRequestSKUs(request) {
    request.extraParameters = __spreadProps(__spreadValues({}, request.extraParameters), {
      [AADServerParamKeys_exports.X_CLIENT_EXTRA_SKU]: this.skus
    });
  }
  /**
   * Acquire token from native platform via browser extension
   * @param request
   */
  acquireToken(request, cacheLookupPolicy) {
    return __async(this, null, function* () {
      this.logger.trace("03qeos", this.correlationId);
      const nativeATMeasurement = this.performanceClient.startMeasurement(NativeInteractionClientAcquireToken, this.correlationId);
      const reqTimestamp = TimeUtils_exports.nowSeconds();
      const serverTelemetryManager = initializeServerTelemetryManager(this.apiId, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      let nativeRequest;
      try {
        nativeRequest = yield invokeAsync(this.initializePlatformRequest.bind(this), PlatformAuthInteractionClientInitializeRequest, this.logger, this.performanceClient, this.correlationId)(request);
      } catch (e) {
        nativeATMeasurement.add({
          isNativeBroker: false
        });
        nativeATMeasurement.end({
          success: false
        }, e);
        throw e;
      }
      try {
        const result = yield this.acquireTokensFromCache(this.accountId, nativeRequest);
        nativeATMeasurement.add({
          isNativeBroker: false
        });
        nativeATMeasurement.end({
          success: true,
          fromCache: true
        });
        return result;
      } catch (e) {
        if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
          this.logger.info("0eitbc", this.correlationId);
          nativeATMeasurement.add({
            isNativeBroker: false
          });
          nativeATMeasurement.end({
            success: false
          });
          throw e;
        }
        this.logger.info("0957j1", this.correlationId);
      }
      try {
        const validatedResponse = yield this.platformAuthProvider.sendMessage(nativeRequest);
        const result = yield invokeAsync(this.handleNativeResponse.bind(this), PlatformAuthHandleNativeResponse, this.logger, this.performanceClient, this.correlationId)(validatedResponse, nativeRequest, reqTimestamp, request.storeInCache);
        nativeATMeasurement.end({
          success: true,
          requestId: result.requestId
        });
        serverTelemetryManager.clearNativeBrokerErrorCode();
        return result;
      } catch (e) {
        if (e instanceof NativeAuthError) {
          serverTelemetryManager.setNativeBrokerErrorCode(e.errorCode);
        }
        nativeATMeasurement.end({
          success: false
        }, e);
        this.setBrokerErrorTelemetry(e);
        throw e;
      }
    });
  }
  /**
   * Records platform-broker error telemetry on the root event for the current
   * correlationId. `isNativeBroker` is set optimistically to true because the
   * broker was engaged; when the caller subsequently falls back to a web flow
   * that succeeds, the root success measurement overrides it to false via
   * `result.fromPlatformBroker`. Terminal broker errors (no fallback) retain
   * true. `brokerErrorName`/`brokerErrorCode` are recorded when the error is an `AuthError`.
   * @param error error thrown by the broker interaction
   */
  setBrokerErrorTelemetry(error) {
    if (error instanceof AuthError) {
      this.performanceClient.addFields({
        isNativeBroker: true,
        brokerErrorName: error.name,
        brokerErrorCode: error.errorCode
      }, this.correlationId);
    }
  }
  /**
   * Creates silent flow request
   * @param request
   * @param cachedAccount
   * @returns CommonSilentFlowRequest
   */
  createSilentCacheRequest(request, cachedAccount) {
    const silentRequest = {
      authority: request.authority,
      correlationId: this.correlationId,
      scopes: ScopeSet.fromString(request.scope, this.correlationId).asArray(),
      account: cachedAccount,
      forceRefresh: false,
      resource: request.extraParameters?.resource
    };
    if (request.attributeTokens) {
      silentRequest.attributeTokens = request.attributeTokens.split(" ");
    }
    return silentRequest;
  }
  /**
   * Fetches the tokens from the cache if un-expired
   * @param nativeAccountId
   * @param request
   * @returns authenticationResult
   */
  acquireTokensFromCache(nativeAccountId, request) {
    return __async(this, null, function* () {
      if (!nativeAccountId) {
        this.logger.warning("1ndf3e", this.correlationId);
        throw createClientAuthError(ClientAuthErrorCodes_exports.noAccountFound, this.correlationId);
      }
      const account = this.browserStorage.getBaseAccountInfo({
        nativeAccountId
      }, this.correlationId);
      if (!account) {
        throw createClientAuthError(ClientAuthErrorCodes_exports.noAccountFound, this.correlationId);
      }
      try {
        const silentRequest = this.createSilentCacheRequest(request, account);
        const result = yield this.silentCacheClient.acquireToken(silentRequest);
        const idToken = this.browserStorage.getIdToken(account, this.correlationId, this.browserStorage.getTokenKeys(), account.tenantId);
        const idTokenClaims = AuthToken_exports.extractTokenClaims(idToken?.secret || "", base64Decode, this.correlationId);
        const fullAccount = updateAccountTenantProfileData(
          account,
          void 0,
          // tenantProfile optional
          idTokenClaims,
          idToken?.secret
        );
        return __spreadProps(__spreadValues({}, result), {
          idToken: idToken?.secret || "",
          idTokenClaims,
          account: fullAccount
        });
      } catch (e) {
        throw e;
      }
    });
  }
  /**
   * Acquires a token from native platform then redirects to the redirectUri instead of returning the response
   * @param {RedirectRequest} request
   * @param {InProgressPerformanceEvent} rootMeasurement
   * @param {HandleRedirectPromiseOptions} options
   */
  acquireTokenRedirect(request, rootMeasurement, options) {
    return __async(this, null, function* () {
      this.logger.trace("0luikq", this.correlationId);
      const nativeRequest = yield invokeAsync(this.initializePlatformRequest.bind(this), PlatformAuthInteractionClientInitializeRequest, this.logger, this.performanceClient, this.correlationId)(request);
      const navigateToLoginRequestUrl = options?.navigateToLoginRequestUrl ?? true;
      try {
        yield this.platformAuthProvider.sendMessage(nativeRequest);
      } catch (e) {
        if (e instanceof NativeAuthError) {
          const serverTelemetryManager = initializeServerTelemetryManager(this.apiId, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
          serverTelemetryManager.setNativeBrokerErrorCode(e.errorCode);
          if (isFatalNativeAuthError(e)) {
            this.setBrokerErrorTelemetry(e);
            throw e;
          }
        }
      }
      this.browserStorage.setTemporaryCache(TemporaryCacheKeys.NATIVE_REQUEST, JSON.stringify(__spreadProps(__spreadValues({}, nativeRequest), {
        storeInCache: request.storeInCache
      })), true);
      const navigationOptions = {
        apiId: ApiId.acquireTokenRedirect,
        timeout: this.config.system.redirectNavigationTimeout,
        noHistory: false
      };
      const redirectUri = navigateToLoginRequestUrl ? UrlString.getAbsoluteUrl(request.redirectStartPage || window.location.href, getCurrentUri(), this.correlationId) : getRedirectUri(request.redirectUri, this.config.auth.redirectUri, this.logger, this.correlationId);
      rootMeasurement.end({ success: true });
      yield this.navigationClient.navigateExternal(redirectUri, navigationOptions);
    });
  }
  /**
   * If the previous page called native platform for a token using redirect APIs, send the same request again and return the response
   * @param performanceClient {IPerformanceClient?}
   * @param correlationId {string?} correlation identifier
   */
  handleRedirectPromise() {
    return __async(this, null, function* () {
      this.logger.trace("1c5lhw", this.correlationId);
      if (!this.browserStorage.isInteractionInProgress(true)) {
        this.logger.info("0le6uv", this.correlationId);
        return null;
      }
      const cachedRequest = this.browserStorage.getCachedNativeRequest();
      if (!cachedRequest) {
        this.logger.verbose("0a6zjb", this.correlationId);
        this.performanceClient?.addFields({
          errorCode: "no_cached_request"
        }, this.correlationId);
        return null;
      }
      const _a = cachedRequest, { prompt, storeInCache } = _a, request = __objRest(_a, ["prompt", "storeInCache"]);
      if (prompt) {
        this.logger.verbose("0ac34v", this.correlationId);
      }
      this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST));
      const reqTimestamp = TimeUtils_exports.nowSeconds();
      try {
        this.logger.verbose("003x5a", this.correlationId);
        const response = yield this.platformAuthProvider.sendMessage(request);
        const authResult = yield invokeAsync(this.handleNativeResponse.bind(this), PlatformAuthHandleNativeResponse, this.logger, this.performanceClient, this.correlationId)(response, request, reqTimestamp, storeInCache);
        const serverTelemetryManager = initializeServerTelemetryManager(this.apiId, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
        serverTelemetryManager.clearNativeBrokerErrorCode();
        return authResult;
      } catch (e) {
        this.setBrokerErrorTelemetry(e);
        throw e;
      }
    });
  }
  /**
   * Logout from native platform via browser extension
   * @param request
   */
  logout() {
    this.logger.trace("0u2sjm", this.correlationId);
    return Promise.reject("Logout not implemented yet");
  }
  /**
   * Transform response from native platform into AuthenticationResult object which will be returned to the end user
   * @param response
   * @param request
   * @param reqTimestamp
   */
  handleNativeResponse(response, request, reqTimestamp, storeInCache) {
    return __async(this, null, function* () {
      this.logger.trace("1bojln", this.correlationId);
      const idTokenClaims = AuthToken_exports.extractTokenClaims(response.id_token, base64Decode, this.correlationId);
      const homeAccountIdentifier = this.createHomeAccountIdentifier(response, idTokenClaims);
      const cachedhomeAccountId = this.browserStorage.getAccountInfoFilteredBy({
        nativeAccountId: request.accountId
      }, this.correlationId)?.homeAccountId;
      if (request.extraParameters?.child_client_id && response.account.id !== request.accountId) {
        this.logger.info("1ub1in", this.correlationId);
      } else if (homeAccountIdentifier !== cachedhomeAccountId && response.account.id !== request.accountId) {
        throw createNativeAuthError(userSwitch, this.correlationId);
      }
      const authority = yield getDiscoveredAuthority(this.config, this.correlationId, this.performanceClient, this.browserStorage, this.logger, request.authority);
      const baseAccount = buildAccountToCache(
        this.browserStorage,
        authority,
        homeAccountIdentifier,
        base64Decode,
        this.correlationId,
        idTokenClaims,
        response.client_info,
        authority.getPreferredCache(),
        // environment
        idTokenClaims.tid,
        void 0,
        // auth code payload
        response.account.id,
        this.logger,
        this.performanceClient
      );
      response.expires_in = Number(response.expires_in);
      const result = yield invokeAsync(this.generateAuthenticationResult.bind(this), NativeGenerateAuthResult, this.logger, this.performanceClient, this.correlationId)(response, request, idTokenClaims, baseAccount, authority.canonicalAuthority, reqTimestamp);
      yield invokeAsync(this.cacheAccount.bind(this), PlatformAuthCacheAccount, this.logger, this.performanceClient, this.correlationId)(baseAccount, AuthToken_exports.isKmsi(idTokenClaims));
      yield invokeAsync(this.cacheNativeTokens.bind(this), PlatformAuthCacheNativeTokens, this.logger, this.performanceClient, this.correlationId)(
        response,
        request,
        homeAccountIdentifier,
        idTokenClaims,
        result.tenantId,
        reqTimestamp,
        authority.getPreferredCache(),
        // environment
        storeInCache
      );
      return result;
    });
  }
  /**
   * creates an homeAccountIdentifier for the account
   * @param response
   * @param idTokenObj
   * @returns
   */
  createHomeAccountIdentifier(response, idTokenClaims) {
    const homeAccountIdentifier = AccountEntityUtils_exports.generateHomeAccountId(response.client_info || "", AuthorityType.Default, this.logger, this.browserCrypto, this.correlationId, idTokenClaims);
    return homeAccountIdentifier;
  }
  /**
   * Helper to generate scopes
   * @param response
   * @param request
   * @returns
   */
  generateScopes(requestScopes, responseScopes) {
    return responseScopes ? ScopeSet.fromString(responseScopes, this.correlationId) : ScopeSet.fromString(requestScopes, this.correlationId);
  }
  /**
   * If PoP token is requesred, records the PoP token if returned from the WAM, else generates one in the browser
   * @param request
   * @param response
   */
  generatePopAccessToken(response, request) {
    return __async(this, null, function* () {
      if (request.tokenType === Constants_exports.AuthenticationScheme.POP && request.signPopToken) {
        if (response.shr) {
          this.logger.trace("0coqhu", this.correlationId);
          return response.shr;
        }
        const popTokenGenerator = new PopTokenGenerator(this.browserCrypto, this.tokenBindingKeyManager, this.performanceClient);
        const shrParameters = {
          resourceRequestMethod: request.resourceRequestMethod,
          resourceRequestUri: request.resourceRequestUri,
          shrClaims: request.shrClaims,
          shrNonce: request.shrNonce,
          correlationId: this.correlationId
        };
        if (!request.keyId) {
          throw createClientAuthError(ClientAuthErrorCodes_exports.keyIdMissing, this.correlationId);
        }
        return popTokenGenerator.signPopToken(response.access_token, request.keyId, shrParameters);
      } else {
        return response.access_token;
      }
    });
  }
  /**
   * Generates authentication result
   * @param response
   * @param request
   * @param idTokenObj
   * @param accountEntity
   * @param authority
   * @param reqTimestamp
   * @returns
   */
  generateAuthenticationResult(response, request, idTokenClaims, accountEntity, authority, reqTimestamp) {
    return __async(this, null, function* () {
      const mats = this.addTelemetryFromNativeResponse(response.properties.MATS);
      const responseScopes = this.generateScopes(request.scope, response.scope);
      const accountProperties = response.account.properties || {};
      const uid = accountProperties["UID"] || idTokenClaims.oid || idTokenClaims.sub || "";
      const tid = accountProperties["TenantId"] || idTokenClaims.tid || "";
      const accountInfo = updateAccountTenantProfileData(
        AccountEntityUtils_exports.getAccountInfo(accountEntity),
        void 0,
        // tenantProfile optional
        idTokenClaims,
        response.id_token
      );
      if (accountInfo.nativeAccountId !== response.account.id) {
        accountInfo.nativeAccountId = response.account.id;
        const targetTenantId = tid || accountInfo.tenantId;
        const tenantProfile = accountInfo.tenantProfiles?.get(targetTenantId);
        if (tenantProfile) {
          tenantProfile.nativeAccountId = response.account.id;
        }
      }
      const responseAccessToken = yield this.generatePopAccessToken(response, request);
      const tokenType = request.tokenType === Constants_exports.AuthenticationScheme.POP ? Constants_exports.AuthenticationScheme.POP : Constants_exports.AuthenticationScheme.BEARER;
      const result = __spreadValues({
        authority,
        uniqueId: uid,
        tenantId: tid,
        scopes: responseScopes.asArray(),
        account: accountInfo,
        idToken: response.id_token,
        idTokenClaims,
        accessToken: responseAccessToken,
        fromCache: mats ? this.isResponseFromCache(mats) : false,
        // Request timestamp and NativeResponse expires_in are in seconds, converting to Date for AuthenticationResult
        expiresOn: TimeUtils_exports.toDateFromSeconds(reqTimestamp + response.expires_in),
        tokenType,
        correlationId: this.correlationId,
        state: response.state,
        fromPlatformBroker: true
      }, request.extraParameters?.resource && {
        resource: request.extraParameters.resource
      });
      return result;
    });
  }
  /**
   * cache the account entity in browser storage
   * @param accountEntity
   */
  cacheAccount(accountEntity, kmsi) {
    return __async(this, null, function* () {
      yield this.browserStorage.setAccount(accountEntity, this.correlationId, kmsi, this.apiId);
      this.browserStorage.removeAccountContext(AccountEntityUtils_exports.getAccountInfo(accountEntity), this.correlationId);
    });
  }
  /**
   * Stores the access_token and id_token in inmemory storage
   * @param response
   * @param request
   * @param homeAccountIdentifier
   * @param idTokenObj
   * @param responseAccessToken
   * @param tenantId
   * @param reqTimestamp
   */
  cacheNativeTokens(response, request, homeAccountIdentifier, idTokenClaims, tenantId, reqTimestamp, environment, storeInCache) {
    return __async(this, null, function* () {
      const cachedIdToken = CacheHelpers_exports.createIdTokenEntity(homeAccountIdentifier, environment, response.id_token || "", request.clientId, idTokenClaims.tid || "");
      const expiresIn = request.tokenType === Constants_exports.AuthenticationScheme.POP ? Constants_exports.SHR_NONCE_VALIDITY : (typeof response.expires_in === "string" ? parseInt(response.expires_in, 10) : response.expires_in) || 0;
      const tokenExpirationSeconds = reqTimestamp + expiresIn;
      const responseScopes = this.generateScopes(response.scope, request.scope);
      const additionalCacheKeyComponents = request.attributeTokens ? {
        attribute_tokens: request.attributeTokens
      } : void 0;
      const cachedAccessToken = CacheHelpers_exports.createAccessTokenEntity(homeAccountIdentifier, environment, response.access_token, request.clientId, idTokenClaims.tid || tenantId, responseScopes.printScopes(), tokenExpirationSeconds, 0, base64Decode, request.correlationId, void 0, request.tokenType, void 0, request.keyId, additionalCacheKeyComponents);
      if (request.extraParameters?.resource) {
        cachedAccessToken.resource = request.extraParameters.resource;
      }
      if (!!cachedIdToken && storeInCache?.idToken !== false) {
        yield this.browserStorage.setIdTokenCredential(cachedIdToken, this.correlationId, AuthToken_exports.isKmsi(idTokenClaims));
      }
      const nativeCacheRecord = {
        accessToken: cachedAccessToken
      };
      return this.nativeStorageManager.saveCacheRecord(nativeCacheRecord, this.correlationId, AuthToken_exports.isKmsi(idTokenClaims), this.apiId, storeInCache);
    });
  }
  getExpiresInValue(tokenType, expiresIn) {
    return tokenType === Constants_exports.AuthenticationScheme.POP ? Constants_exports.SHR_NONCE_VALIDITY : (typeof expiresIn === "string" ? parseInt(expiresIn, 10) : expiresIn) || 0;
  }
  addTelemetryFromNativeResponse(matsResponse) {
    const mats = this.getMATSFromResponse(matsResponse);
    if (!mats) {
      return null;
    }
    this.performanceClient.addFields({
      extensionId: this.platformAuthProvider.getExtensionId(),
      extensionVersion: this.platformAuthProvider.getExtensionVersion(),
      matsBrokerVersion: mats.broker_version,
      matsAccountJoinOnStart: mats.account_join_on_start,
      matsAccountJoinOnEnd: mats.account_join_on_end,
      matsDeviceJoin: mats.device_join,
      matsPromptBehavior: mats.prompt_behavior,
      matsApiErrorCode: mats.api_error_code,
      matsUiVisible: mats.ui_visible,
      matsSilentCode: mats.silent_code,
      matsSilentBiSubCode: mats.silent_bi_sub_code,
      matsSilentMessage: mats.silent_message,
      matsSilentStatus: mats.silent_status,
      matsHttpStatus: mats.http_status,
      matsHttpEventCount: mats.http_event_count
    }, this.correlationId);
    return mats;
  }
  /**
   * Gets MATS telemetry from native response
   * @param response
   * @returns
   */
  getMATSFromResponse(matsResponse) {
    if (matsResponse) {
      try {
        return JSON.parse(matsResponse);
      } catch (e) {
        this.logger.error("0b3l57", this.correlationId);
      }
    }
    return null;
  }
  /**
   * Returns whether or not response came from native cache
   * @param response
   * @returns
   */
  isResponseFromCache(mats) {
    if (typeof mats.is_cached === "undefined") {
      this.logger.verbose("1okqev", this.correlationId);
      return false;
    }
    return !!mats.is_cached;
  }
  /**
   * Translates developer provided request object into NativeRequest object
   * @param request
   */
  initializePlatformRequest(request) {
    return __async(this, null, function* () {
      this.logger.trace("1xdm2a", this.correlationId);
      const canonicalAuthority = yield this.getCanonicalAuthority(request);
      const configClaims = request.skipBrokerClaims && !!request.embeddedClientId ? void 0 : this.config.auth.clientCapabilities;
      const { scopes, claims, extraParametersNoCache, dpopNonce } = request;
      const scopeSet = new ScopeSet([...scopes || [], ...Constants_exports.OIDC_DEFAULT_SCOPES], this.correlationId);
      const mergedClaims = RequestParameterBuilder_exports.buildMergedClaims(claims, configClaims?.length ? configClaims : void 0);
      const hasAttributeTokens = !!request.attributeTokens?.length;
      this.performanceClient?.addFields({
        hasAttributeTokens
      }, this.correlationId);
      const validatedRequest = {
        claims: mergedClaims,
        accountId: this.accountId,
        clientId: this.config.auth.clientId,
        authority: canonicalAuthority.urlString,
        scope: scopeSet.printScopes(),
        redirectUri: getRedirectUri(request.redirectUri, this.config.auth.redirectUri, this.logger, this.correlationId),
        prompt: this.getPrompt(request.prompt),
        correlationId: this.correlationId,
        isSts: false,
        tokenType: request.authenticationScheme,
        windowTitleSubstring: document.title,
        nonce: request.nonce,
        state: request.state,
        loginHint: request.loginHint,
        extraParameters: __spreadValues(__spreadValues({}, request.extraParameters), request.resource && { resource: request.resource }),
        extendedExpiryToken: false,
        keyId: request.popKid,
        resourceRequestMethod: request.resourceRequestMethod,
        resourceRequestUri: request.resourceRequestUri,
        shrClaims: request.shrClaims,
        shrNonce: request.shrNonce,
        extraParametersNoCache: createPlatformAuthExtraParametersNoCache(extraParametersNoCache, isProofOfPossessionTokenType(request.authenticationScheme), request.resourceRequestMethod, request.resourceRequestUri, dpopNonce)
      };
      if (hasAttributeTokens) {
        validatedRequest.attributeTokens = CacheHelpers_exports.serializeAttributeTokens(request.attributeTokens);
      }
      if (validatedRequest.signPopToken && !!request.popKid) {
        throw createBrowserAuthError(invalidPopTokenRequest, this.correlationId);
      }
      this.handleExtraBrokerParams(validatedRequest, request.embeddedClientId);
      validatedRequest.extraParameters = validatedRequest.extraParameters || {};
      validatedRequest.extraParameters.telemetry = PlatformAuthConstants.MATS_TELEMETRY;
      if (request.authenticationScheme === Constants_exports.AuthenticationScheme.POP) {
        const shrParameters = {
          resourceRequestUri: request.resourceRequestUri,
          resourceRequestMethod: request.resourceRequestMethod,
          shrClaims: request.shrClaims,
          shrNonce: request.shrNonce,
          correlationId: this.correlationId
        };
        const popTokenGenerator = new PopTokenGenerator(this.browserCrypto, this.tokenBindingKeyManager, this.performanceClient);
        let reqCnfData;
        if (!validatedRequest.keyId) {
          const generatedReqCnfData = yield invokeAsync(popTokenGenerator.generateCnf.bind(popTokenGenerator), PerformanceEvents_exports.PopTokenGenerateCnf, this.logger, this.performanceClient, this.correlationId)(shrParameters, this.logger);
          reqCnfData = generatedReqCnfData.reqCnfString;
          validatedRequest.keyId = generatedReqCnfData.kid;
          validatedRequest.signPopToken = true;
        } else {
          reqCnfData = this.browserCrypto.base64UrlEncode(JSON.stringify({ kid: validatedRequest.keyId }));
          validatedRequest.signPopToken = false;
        }
        validatedRequest.reqCnf = reqCnfData;
      }
      this.addRequestSKUs(validatedRequest);
      return validatedRequest;
    });
  }
  getCanonicalAuthority(request) {
    return __async(this, null, function* () {
      const requestAuthority = request.authority || this.config.auth.authority;
      const { azureCloudOptions, account } = request;
      if (account) {
        yield getDiscoveredAuthority(
          this.config,
          this.correlationId,
          this.performanceClient,
          this.browserStorage,
          this.logger,
          requestAuthority,
          azureCloudOptions,
          void 0,
          // requestExtraQueryParameters
          account
        );
      }
      const canonicalAuthority = new UrlString(requestAuthority, this.correlationId);
      canonicalAuthority.validateAsUri();
      return canonicalAuthority;
    });
  }
  getPrompt(prompt) {
    switch (this.apiId) {
      case ApiId.ssoSilent:
      case ApiId.acquireTokenSilent_silentFlow:
        this.logger.trace("12n1y2", this.correlationId);
        return Constants_exports.PromptValue.NONE;
    }
    if (!prompt) {
      this.logger.trace("0uid1p", this.correlationId);
      return void 0;
    }
    switch (prompt) {
      case Constants_exports.PromptValue.NONE:
      case Constants_exports.PromptValue.CONSENT:
      case Constants_exports.PromptValue.LOGIN:
        this.logger.trace("0i0hco", this.correlationId);
        return prompt;
      default:
        this.logger.trace(`0w3tpw ${prompt}`, this.correlationId);
        throw createBrowserAuthError(nativePromptNotSupported, this.correlationId);
    }
  }
  /**
   * Handles extra broker request parameters
   * @param request {PlatformAuthRequest}
   * @private
   */
  handleExtraBrokerParams(request, embeddedClientId) {
    var _a, _b, _c;
    const hasExtraBrokerParams = request.extraParameters && request.extraParameters.hasOwnProperty(AADServerParamKeys_exports.BROKER_CLIENT_ID) && request.extraParameters.hasOwnProperty(AADServerParamKeys_exports.BROKER_REDIRECT_URI) && request.extraParameters.hasOwnProperty(AADServerParamKeys_exports.CLIENT_ID);
    if (!embeddedClientId && !hasExtraBrokerParams) {
      return;
    }
    let child_client_id = "";
    const child_redirect_uri = request.redirectUri;
    if (embeddedClientId) {
      request.redirectUri = this.config.auth.redirectUri;
      child_client_id = embeddedClientId;
    } else if (request.extraParameters) {
      request.redirectUri = request.extraParameters[AADServerParamKeys_exports.BROKER_REDIRECT_URI];
      child_client_id = request.extraParameters[AADServerParamKeys_exports.CLIENT_ID];
    }
    const _d = request.extraParameters || {}, {
      [_a = AADServerParamKeys_exports.BROKER_CLIENT_ID]: _brkClientId,
      [_b = AADServerParamKeys_exports.BROKER_REDIRECT_URI]: _brkRedirectUri,
      [_c = AADServerParamKeys_exports.CLIENT_ID]: _clientId
    } = _d, remainingExtraParameters = __objRest(_d, [
      __restKey(_a),
      __restKey(_b),
      __restKey(_c)
    ]);
    request.extraParameters = __spreadProps(__spreadValues({}, remainingExtraParameters), {
      child_client_id,
      child_redirect_uri
    });
    this.performanceClient?.addFields({
      embeddedClientId: child_client_id,
      embeddedRedirectUri: child_redirect_uri
    }, this.correlationId);
  }
};

// node_modules/@azure/msal-browser/dist/protocol/Authorize.mjs
var clientDataAccountTypeMapping = /* @__PURE__ */ new Map([
  ["e", "AAD"],
  ["m", "MSA"]
]);
function parseClientData(clientdata) {
  if (!clientdata) {
    return null;
  }
  try {
    const shouldDecode = /%(?:[0-9A-Fa-f]{2})/.test(clientdata);
    const decoded = shouldDecode ? decodeURIComponent(clientdata) : clientdata;
    const parts = decoded.split("|");
    if (parts.length < 5) {
      return null;
    }
    return {
      accountType: clientDataAccountTypeMapping.get(parts[0]?.trim() || "") || "",
      error: parts[1]?.trim() || "",
      subError: parts[2]?.trim() || "",
      cloudInstance: parts[3]?.trim() || "",
      callerDataBoundary: parts[4]?.trim() || ""
    };
  } catch (e) {
    return null;
  }
}
function instrumentClientData(response, correlationId, performanceClient) {
  const parsed = parseClientData(response.clientdata);
  parsed?.accountType && performanceClient.addFields({ accountType: parsed.accountType }, correlationId);
  parsed?.error && performanceClient.addFields({ serverErrorNo: parsed.error }, correlationId);
  parsed?.subError && performanceClient.addFields({ serverSubErrorNo: parsed.subError }, correlationId);
}
function getStandardParameters(config, authority, request, logger, performanceClient) {
  return __async(this, null, function* () {
    const parameters = Authorize_exports.getStandardAuthorizeRequestParameters(__spreadProps(__spreadValues({}, config.auth), { authority }), request, logger, performanceClient);
    RequestParameterBuilder_exports.addLibraryInfo(parameters, {
      sku: BrowserConstants.MSAL_SKU,
      version,
      os: "",
      cpu: ""
    });
    if (config.system.protocolMode !== ProtocolMode.OIDC) {
      RequestParameterBuilder_exports.addApplicationTelemetry(parameters, config.telemetry.application);
    }
    if (request.platformBroker) {
      RequestParameterBuilder_exports.addNativeBroker(parameters);
      performanceClient.addFields({
        isPlatformAuthorizeRequest: true
      }, request.correlationId);
      if (request.authenticationScheme === Constants_exports.AuthenticationScheme.POP && request.reqCnf) {
        RequestParameterBuilder_exports.addPopToken(parameters, request.reqCnf);
      }
    }
    if (request.authenticationScheme === Constants_exports.AuthenticationScheme.DPOP && request.dpopJkt) {
      parameters.set(AADServerParamKeys_exports.DPOP_JKT, request.dpopJkt);
    }
    RequestParameterBuilder_exports.instrumentBrokerParams(parameters, request.correlationId, performanceClient);
    return parameters;
  });
}
function getAuthCodeRequestUrl(config, authority, request, logger, performanceClient) {
  return __async(this, null, function* () {
    if (!request.codeChallenge) {
      throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.pkceParamsMissing, request.correlationId);
    }
    const parameters = yield invokeAsync(getStandardParameters, GetStandardParams, logger, performanceClient, request.correlationId)(config, authority, request, logger, performanceClient);
    RequestParameterBuilder_exports.addResponseType(parameters, Constants_exports.OAuthResponseType.CODE);
    RequestParameterBuilder_exports.addCodeChallengeParams(parameters, request.codeChallenge, Constants_exports.S256_CODE_CHALLENGE_METHOD);
    RequestParameterBuilder_exports.addExtraParameters(parameters, __spreadValues(__spreadValues({}, request.extraQueryParameters), request.extraParameters));
    return Authorize_exports.getAuthorizeUrl(authority, parameters);
  });
}
function getEARFormData(config, authority, request, logger, performanceClient) {
  return __async(this, null, function* () {
    if (!request.earJwk) {
      throw createBrowserAuthError(earJwkEmpty, request.correlationId);
    }
    const parameters = yield getStandardParameters(config, authority, request, logger, performanceClient);
    RequestParameterBuilder_exports.addResponseType(parameters, Constants_exports.OAuthResponseType.IDTOKEN_TOKEN_REFRESHTOKEN);
    RequestParameterBuilder_exports.addEARParameters(parameters, request.earJwk);
    RequestParameterBuilder_exports.addCodeChallengeParams(parameters, request.codeChallenge, Constants_exports.S256_CODE_CHALLENGE_METHOD);
    RequestParameterBuilder_exports.addExtraParameters(parameters, __spreadValues({}, request.extraParameters));
    const queryParams = /* @__PURE__ */ new Map();
    RequestParameterBuilder_exports.addExtraParameters(queryParams, request.extraQueryParameters || {});
    RequestParameterBuilder_exports.addCorrelationId(queryParams, request.correlationId);
    const action = Authorize_exports.getAuthorizeUrl(authority, queryParams);
    return { action, fields: Object.fromEntries(parameters) };
  });
}
function getEARForm(frame, config, authority, request, logger, performanceClient) {
  return __async(this, null, function* () {
    const { action, fields } = yield getEARFormData(config, authority, request, logger, performanceClient);
    return createForm(frame, action, fields);
  });
}
function getCodeFormData(config, authority, request, logger, performanceClient) {
  return __async(this, null, function* () {
    const parameters = yield getStandardParameters(config, authority, request, logger, performanceClient);
    RequestParameterBuilder_exports.addResponseType(parameters, Constants_exports.OAuthResponseType.CODE);
    RequestParameterBuilder_exports.addCodeChallengeParams(parameters, request.codeChallenge, request.codeChallengeMethod || Constants_exports.S256_CODE_CHALLENGE_METHOD);
    RequestParameterBuilder_exports.addExtraParameters(parameters, __spreadValues({}, request.extraParameters));
    const queryParams = /* @__PURE__ */ new Map();
    RequestParameterBuilder_exports.addExtraParameters(queryParams, request.extraQueryParameters || {});
    RequestParameterBuilder_exports.addCorrelationId(queryParams, request.correlationId);
    const action = Authorize_exports.getAuthorizeUrl(authority, queryParams);
    return { action, fields: Object.fromEntries(parameters) };
  });
}
function getCodeForm(frame, config, authority, request, logger, performanceClient) {
  return __async(this, null, function* () {
    const { action, fields } = yield getCodeFormData(config, authority, request, logger, performanceClient);
    return createForm(frame, action, fields);
  });
}
function createForm(frame, action, fields) {
  const form = frame.createElement("form");
  form.method = "post";
  form.action = action;
  Object.keys(fields).forEach((name2) => {
    const input = frame.createElement("input");
    input.hidden = true;
    input.name = name2;
    input.value = fields[name2];
    form.appendChild(input);
  });
  frame.body.appendChild(form);
  return form;
}
function handleResponsePlatformBroker(request, accountId, apiId, config, browserStorage, nativeStorage, eventHandler, logger, performanceClient, platformAuthProvider) {
  return __async(this, null, function* () {
    logger.verbose("11qcow", request.correlationId);
    if (!platformAuthProvider) {
      throw createBrowserAuthError(nativeConnectionNotEstablished, request.correlationId);
    }
    const browserCrypto = new CryptoOps(logger, performanceClient);
    const nativeInteractionClient = new PlatformAuthInteractionClient(config, browserStorage, browserCrypto, logger, eventHandler, config.system.navigationClient, apiId, performanceClient, platformAuthProvider, accountId, nativeStorage, request.correlationId);
    const { userRequestState } = ProtocolUtils_exports.parseRequestState(browserCrypto.base64Decode, request.state, request.correlationId);
    return invokeAsync(nativeInteractionClient.acquireToken.bind(nativeInteractionClient), NativeInteractionClientAcquireToken, logger, performanceClient, request.correlationId)(__spreadProps(__spreadValues({}, request), {
      state: userRequestState,
      prompt: void 0
      // Server should handle the prompt, ideally native broker can do this part silently
    }));
  });
}
function handleResponseCode(request, response, codeVerifier, apiId, config, authClient, browserStorage, nativeStorage, eventHandler, logger, performanceClient, platformAuthProvider) {
  return __async(this, null, function* () {
    ThrottlingUtils.removeThrottle(browserStorage, config.auth.clientId, request);
    instrumentClientData(response, request.correlationId, performanceClient);
    if (response.accountId) {
      return invokeAsync(handleResponsePlatformBroker, HandleResponsePlatformBroker, logger, performanceClient, request.correlationId)(request, response.accountId, apiId, config, browserStorage, nativeStorage, eventHandler, logger, performanceClient, platformAuthProvider);
    }
    const authCodeRequest = __spreadProps(__spreadValues({}, request), {
      code: response.code || "",
      codeVerifier
    });
    const interactionHandler = new InteractionHandler(authClient, browserStorage, authCodeRequest, logger, performanceClient);
    const result = yield invokeAsync(interactionHandler.handleCodeResponse.bind(interactionHandler), HandleCodeResponse, logger, performanceClient, request.correlationId)(response, request, apiId);
    return result;
  });
}
function handleResponseEAR(request, response, apiId, config, authority, browserStorage, nativeStorage, eventHandler, logger, performanceClient, platformAuthProvider) {
  return __async(this, null, function* () {
    ThrottlingUtils.removeThrottle(browserStorage, config.auth.clientId, request);
    instrumentClientData(response, request.correlationId, performanceClient);
    Authorize_exports.validateAuthorizationResponse(response, request.state, request.correlationId);
    if (!response.ear_jwe) {
      throw createBrowserAuthError(earJweEmpty, request.correlationId);
    }
    if (!request.earJwk) {
      throw createBrowserAuthError(earJwkEmpty, request.correlationId);
    }
    const decryptedData = JSON.parse(yield invokeAsync(decryptEarResponse, DecryptEarResponse, logger, performanceClient, request.correlationId)(request.earJwk, response.ear_jwe));
    if (decryptedData.accountId) {
      return invokeAsync(handleResponsePlatformBroker, HandleResponsePlatformBroker, logger, performanceClient, request.correlationId)(request, decryptedData.accountId, apiId, config, browserStorage, nativeStorage, eventHandler, logger, performanceClient, platformAuthProvider);
    }
    const responseHandler = new ResponseHandler(config.auth.clientId, browserStorage, new CryptoOps(logger, performanceClient), logger, performanceClient, null, null, new TokenBindingKeyManager(logger, performanceClient));
    responseHandler.validateTokenResponse(decryptedData, request.correlationId);
    const additionalData = {
      code: "",
      state: request.state,
      nonce: request.nonce,
      client_info: decryptedData.client_info,
      cloud_graph_host_name: decryptedData.cloud_graph_host_name,
      cloud_instance_host_name: decryptedData.cloud_instance_host_name,
      cloud_instance_name: decryptedData.cloud_instance_name,
      msgraph_host: decryptedData.msgraph_host
    };
    return yield invokeAsync(responseHandler.handleServerTokenResponse.bind(responseHandler), PerformanceEvents_exports.HandleServerTokenResponse, logger, performanceClient, request.correlationId)(decryptedData, authority, TimeUtils_exports.nowSeconds(), request, apiId, additionalData, void 0, void 0, void 0, void 0);
  });
}

// node_modules/@azure/msal-browser/dist/crypto/PkceGenerator.mjs
var RANDOM_BYTE_ARR_LENGTH = 32;
function generatePkceCodes(performanceClient, logger, correlationId) {
  return __async(this, null, function* () {
    const codeVerifier = invoke(generateCodeVerifier, GenerateCodeVerifier, logger, performanceClient, correlationId)(performanceClient, logger, correlationId);
    const codeChallenge = yield invokeAsync(generateCodeChallengeFromVerifier, GenerateCodeChallengeFromVerifier, logger, performanceClient, correlationId)(codeVerifier, performanceClient, logger, correlationId);
    return {
      verifier: codeVerifier,
      challenge: codeChallenge
    };
  });
}
function generateCodeVerifier(performanceClient, logger, correlationId) {
  try {
    const buffer = new Uint8Array(RANDOM_BYTE_ARR_LENGTH);
    invoke(getRandomValues, GetRandomValues, logger, performanceClient, correlationId)(buffer);
    const pkceCodeVerifierB64 = urlEncodeArr(buffer);
    return pkceCodeVerifierB64;
  } catch (e) {
    throw createBrowserAuthError(pkceNotCreated, correlationId);
  }
}
function generateCodeChallengeFromVerifier(pkceCodeVerifier, performanceClient, logger, correlationId) {
  return __async(this, null, function* () {
    try {
      const pkceHashedCodeVerifier = yield invokeAsync(sha256Digest, Sha256Digest, logger, performanceClient, correlationId)(pkceCodeVerifier);
      return urlEncodeArr(new Uint8Array(pkceHashedCodeVerifier));
    } catch (e) {
      throw createBrowserAuthError(pkceNotCreated, correlationId);
    }
  });
}

// node_modules/@azure/msal-browser/dist/broker/nativeBroker/PlatformAuthExtensionHandler.mjs
var PlatformAuthExtensionHandler = class _PlatformAuthExtensionHandler {
  constructor(logger, handshakeTimeoutMs, performanceClient, extensionId, correlationId) {
    this.logger = logger;
    this.handshakeTimeoutMs = handshakeTimeoutMs;
    this.extensionId = extensionId;
    this.resolvers = /* @__PURE__ */ new Map();
    this.handshakeResolvers = /* @__PURE__ */ new Map();
    this.messageChannel = new MessageChannel();
    this.windowListener = this.onWindowMessage.bind(this);
    this.performanceClient = performanceClient;
    this.correlationId = correlationId || createNewGuid();
    this.handshakeEvent = this.performanceClient.startMeasurement(NativeMessageHandlerHandshake, this.correlationId);
    this.platformAuthType = PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER;
  }
  /**
   * Sends a given message to the extension and resolves with the extension response
   * @param request
   */
  sendMessage(request) {
    return __async(this, null, function* () {
      const correlationId = this.getCorrelationId(request.correlationId);
      const sendMessageMeasurement = this.performanceClient.startMeasurement(PlatformAuthExtensionGetToken, correlationId);
      sendMessageMeasurement.add({
        platformAuthProviderType: this.platformAuthType
      });
      this.logger.trace(`0on4p2 ${this.platformAuthType}`, correlationId);
      try {
        const extensionRequest = __spreadValues({}, request);
        delete extensionRequest.resourceRequestMethod;
        delete extensionRequest.resourceRequestUri;
        const messageBody = {
          method: NativeExtensionMethod.GetToken,
          request: extensionRequest
        };
        const req = {
          channel: PlatformAuthConstants.CHANNEL_ID,
          extensionId: this.extensionId,
          responseId: createNewGuid(),
          body: messageBody
        };
        this.logger.trace(`1qadfi ${this.platformAuthType}`, correlationId);
        this.logger.tracePii(`1xm533 ${this.platformAuthType} ${JSON.stringify(req)}`, correlationId);
        this.messageChannel.port1.postMessage(req);
        const response = yield new Promise((resolve, reject) => {
          this.resolvers.set(req.responseId, {
            resolve,
            reject,
            correlationId
          });
        });
        const validatedResponse = this.validatePlatformBrokerResponse(response, correlationId);
        sendMessageMeasurement.end({
          success: true,
          platformAuthProviderType: this.platformAuthType
        });
        return validatedResponse;
      } catch (e) {
        sendMessageMeasurement.end({
          success: false,
          platformAuthProviderType: this.platformAuthType
        }, e);
        throw e;
      }
    });
  }
  /**
   * Returns an instance of the MessageHandler that has successfully established a connection with an extension
   * @param {Logger} logger
   * @param {number} handshakeTimeoutMs
   * @param {IPerformanceClient} performanceClient
   * @param {ICrypto} crypto
   */
  static createProvider(logger, handshakeTimeoutMs, performanceClient, correlationId) {
    return __async(this, null, function* () {
      logger.trace("15zfnw", correlationId);
      const createProviderMeasurement = performanceClient.startMeasurement(PlatformAuthExtensionCreateProvider, correlationId);
      try {
        const preferredProvider = new _PlatformAuthExtensionHandler(logger, handshakeTimeoutMs, performanceClient, PlatformAuthConstants.PREFERRED_EXTENSION_ID, correlationId);
        yield preferredProvider.sendHandshakeRequest();
        createProviderMeasurement.add({
          platformAuthProviderAvailable: true,
          platformAuthProviderType: PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER
        });
        createProviderMeasurement.end({
          platformAuthProviderAvailable: true,
          platformAuthProviderType: PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER
        });
        return preferredProvider;
      } catch (e) {
        try {
          const backupProvider = new _PlatformAuthExtensionHandler(logger, handshakeTimeoutMs, performanceClient, void 0, correlationId);
          yield backupProvider.sendHandshakeRequest();
          createProviderMeasurement.add({
            platformAuthProviderAvailable: true,
            platformAuthProviderType: PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER
          });
          createProviderMeasurement.end({
            platformAuthProviderAvailable: true,
            platformAuthProviderType: PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER
          });
          return backupProvider;
        } catch (backupError) {
          createProviderMeasurement.add({
            platformAuthProviderAvailable: false
          });
          createProviderMeasurement.end({
            platformAuthProviderAvailable: false
          }, backupError);
          throw backupError;
        }
      }
    });
  }
  /**
   * Send handshake request helper.
   */
  sendHandshakeRequest() {
    return __async(this, null, function* () {
      this.logger.trace(`1dpg9o ${this.platformAuthType}`, this.correlationId);
      window.addEventListener("message", this.windowListener, false);
      const req = {
        channel: PlatformAuthConstants.CHANNEL_ID,
        extensionId: this.extensionId,
        responseId: createNewGuid(),
        body: {
          method: NativeExtensionMethod.HandshakeRequest
        }
      };
      this.handshakeEvent.add({
        extensionId: this.extensionId,
        extensionHandshakeTimeoutMs: this.handshakeTimeoutMs,
        platformAuthRequestCorrelationId: this.correlationId
      });
      this.messageChannel.port1.onmessage = (event) => {
        this.onChannelMessage(event);
      };
      window.postMessage(req, window.origin, [this.messageChannel.port2]);
      return new Promise((resolve, reject) => {
        this.handshakeResolvers.set(req.responseId, {
          resolve,
          reject,
          correlationId: this.correlationId
        });
        this.timeoutId = window.setTimeout(() => {
          window.removeEventListener("message", this.windowListener, false);
          this.messageChannel.port1.close();
          this.messageChannel.port2.close();
          this.handshakeEvent.add({
            extensionHandshakeTimedOut: true
          });
          this.handshakeEvent.end({
            extensionHandshakeTimedOut: true,
            success: false
          });
          reject(createBrowserAuthError(nativeHandshakeTimeout, this.correlationId));
          this.handshakeResolvers.delete(req.responseId);
        }, this.handshakeTimeoutMs);
      });
    });
  }
  /**
   * Invoked when a message is posted to the window. If a handshake request is received it means the extension is not installed.
   * @param event
   */
  onWindowMessage(event) {
    let correlationId = createGuid();
    this.logger.trace(`0jpn5u ${this.platformAuthType}`, correlationId);
    if (event.source !== window) {
      return;
    }
    const request = event.data;
    if (!request.channel || request.channel !== PlatformAuthConstants.CHANNEL_ID) {
      return;
    }
    if (request.extensionId && request.extensionId !== this.extensionId) {
      return;
    }
    if (request.body.method === NativeExtensionMethod.HandshakeRequest) {
      const handshakeResolver = this.handshakeResolvers.get(request.responseId);
      if (!handshakeResolver) {
        this.logger.trace(`07buhm ${this.platformAuthType} ${request.responseId}`, correlationId);
        return;
      }
      correlationId = handshakeResolver.correlationId;
      this.logger.verbose(request.extensionId ? `0xrkug ${request.extensionId}` : "No extension installed", correlationId);
      clearTimeout(this.timeoutId);
      this.messageChannel.port1.close();
      this.messageChannel.port2.close();
      window.removeEventListener("message", this.windowListener, false);
      this.handshakeEvent.add({
        extensionInstalled: false
      });
      this.handshakeEvent.end({
        success: false,
        extensionInstalled: false
      });
      handshakeResolver.reject(createBrowserAuthError(nativeExtensionNotInstalled, correlationId));
      this.handshakeResolvers.delete(request.responseId);
    }
  }
  /**
   * Invoked when a message is received from the extension on the MessageChannel port
   * @param event
   */
  onChannelMessage(event) {
    const request = event.data;
    const responseId = request?.responseId;
    const resolver = responseId ? this.resolvers.get(responseId) : void 0;
    const handshakeResolver = responseId ? this.handshakeResolvers.get(responseId) : void 0;
    const correlationId = resolver?.correlationId || handshakeResolver?.correlationId || createGuid();
    this.logger.trace(`1py8yf ${this.platformAuthType}`, correlationId);
    try {
      const method = request.body.method;
      if (method === NativeExtensionMethod.Response) {
        if (!resolver) {
          return;
        }
        try {
          const response = request.body.response;
          this.logger.trace(`19hpgm ${this.platformAuthType}`, correlationId);
          this.logger.tracePii(`179a24 ${this.platformAuthType} ${JSON.stringify(response)}`, correlationId);
          if (response.status !== "Success") {
            resolver.reject(createNativeAuthError(response.code, correlationId, response.description, response.ext));
          } else if (response.result) {
            if (response.result["code"] && response.result["description"]) {
              resolver.reject(createNativeAuthError(response.result["code"], correlationId, response.result["description"], response.result["ext"]));
            } else {
              resolver.resolve(response.result);
            }
          } else {
            throw createAuthError(AuthErrorCodes_exports.unexpectedError, correlationId, "Event does not contain result.");
          }
        } finally {
          this.resolvers.delete(request.responseId);
        }
      } else if (method === NativeExtensionMethod.HandshakeResponse) {
        if (!handshakeResolver) {
          this.logger.trace(`082qnt ${this.platformAuthType} ${request.responseId}`, correlationId);
          return;
        }
        clearTimeout(this.timeoutId);
        window.removeEventListener("message", this.windowListener, false);
        this.extensionId = request.extensionId;
        this.extensionVersion = request.body.version?.toString();
        this.logger.verbose(`0yf5ib ${this.platformAuthType} ${this.extensionId}`, correlationId);
        this.handshakeEvent.add({
          extensionId: this.extensionId,
          extensionVersion: this.extensionVersion,
          extensionInstalled: true
        });
        this.handshakeEvent.end({
          extensionId: this.extensionId,
          extensionVersion: this.extensionVersion,
          extensionInstalled: true,
          success: true
        });
        handshakeResolver.resolve();
        this.handshakeResolvers.delete(request.responseId);
      } else if (resolver) {
        this.resolvers.delete(request.responseId);
        resolver.reject(createAuthError(AuthErrorCodes_exports.unexpectedError, correlationId, "Extension response contains an unexpected method."));
      }
    } catch (err) {
      this.logger.error("0xf978", correlationId);
      this.logger.errorPii(`04i99o ${err}`, correlationId);
      this.logger.errorPii(`0xdvsy ${event}`, correlationId);
      if (resolver) {
        this.resolvers.delete(responseId);
        resolver.reject(err instanceof AuthError ? err : createAuthError(AuthErrorCodes_exports.unexpectedError, correlationId, "Unable to parse extension response."));
      } else if (handshakeResolver) {
        clearTimeout(this.timeoutId);
        window.removeEventListener("message", this.windowListener, false);
        this.messageChannel.port1.close();
        this.messageChannel.port2.close();
        this.handshakeEvent.end({
          success: false
        });
        this.handshakeResolvers.delete(responseId);
        handshakeResolver.reject(err);
      }
    }
  }
  /**
   * Validates native platform response before processing
   * @param response
   */
  validatePlatformBrokerResponse(response, correlationId) {
    const responseCorrelationId = this.getCorrelationId(correlationId);
    const validationMeasurement = this.performanceClient.startMeasurement(PlatformAuthExtensionValidateResponse, responseCorrelationId);
    if (response && Object.prototype.hasOwnProperty.call(response, "access_token") && Object.prototype.hasOwnProperty.call(response, "id_token") && Object.prototype.hasOwnProperty.call(response, "client_info") && Object.prototype.hasOwnProperty.call(response, "account") && Object.prototype.hasOwnProperty.call(response, "scope") && Object.prototype.hasOwnProperty.call(response, "expires_in")) {
      validationMeasurement.end({
        success: true,
        platformAuthProviderType: this.platformAuthType
      });
      return response;
    } else {
      const error = createAuthError(AuthErrorCodes_exports.unexpectedError, responseCorrelationId, "Response missing expected properties.");
      validationMeasurement.end({
        success: false,
        platformAuthProviderType: this.platformAuthType
      }, error);
      throw error;
    }
  }
  getCorrelationId(correlationId) {
    return correlationId || this.correlationId;
  }
  /**
   * Returns the Id for the browser extension this handler is communicating with
   * @returns
   */
  getExtensionId() {
    return this.extensionId;
  }
  /**
   * Returns the version for the browser extension this handler is communicating with
   * @returns
   */
  getExtensionVersion() {
    return this.extensionVersion;
  }
  getExtensionName() {
    return this.getExtensionId() === PlatformAuthConstants.PREFERRED_EXTENSION_ID ? "chrome" : this.getExtensionId()?.length ? "unknown" : void 0;
  }
};

// node_modules/@azure/msal-browser/dist/broker/nativeBroker/PlatformAuthDOMHandler.mjs
var PlatformAuthDOMHandler = class _PlatformAuthDOMHandler {
  constructor(logger, performanceClient, correlationId) {
    this.logger = logger;
    this.performanceClient = performanceClient;
    this.correlationId = correlationId;
    this.platformAuthType = PlatformAuthConstants.PLATFORM_DOM_PROVIDER;
  }
  static createProvider(logger, performanceClient, correlationId) {
    return __async(this, null, function* () {
      logger.trace("12mj4a", correlationId);
      const createProviderMeasurement = performanceClient.startMeasurement(PlatformAuthDOMCreateProvider, correlationId);
      try {
        const platformAuthentication = window.navigator.platformAuthentication;
        if (!platformAuthentication) {
          createProviderMeasurement.add({
            platformAuthProviderAvailable: false
          });
          createProviderMeasurement.end({
            platformAuthProviderAvailable: false
          });
          return void 0;
        }
        const supportedContracts = yield invokeAsync(platformAuthentication.getSupportedContracts.bind(platformAuthentication), PlatformAuthDOMGetSupportedContracts, logger, performanceClient, correlationId)(PlatformAuthConstants.MICROSOFT_ENTRA_BROKERID);
        const contractSupported = supportedContracts?.includes(PlatformAuthConstants.PLATFORM_DOM_APIS);
        if (contractSupported) {
          logger.trace("1h5q1r", correlationId);
          createProviderMeasurement.add({
            platformAuthProviderAvailable: true,
            platformAuthProviderType: PlatformAuthConstants.PLATFORM_DOM_PROVIDER
          });
          createProviderMeasurement.end({
            platformAuthProviderAvailable: true,
            platformAuthProviderType: PlatformAuthConstants.PLATFORM_DOM_PROVIDER
          });
          return new _PlatformAuthDOMHandler(logger, performanceClient, correlationId);
        }
        createProviderMeasurement.add({
          platformAuthProviderAvailable: false
        });
        createProviderMeasurement.end({
          platformAuthProviderAvailable: false
        });
        return void 0;
      } catch (e) {
        createProviderMeasurement.add({
          platformAuthProviderAvailable: false
        });
        createProviderMeasurement.end({
          platformAuthProviderAvailable: false
        }, e);
        throw e;
      }
    });
  }
  /**
   * Returns the Id for the broker extension this handler is communicating with
   * @returns
   */
  getExtensionId() {
    return PlatformAuthConstants.MICROSOFT_ENTRA_BROKERID;
  }
  getExtensionVersion() {
    return "";
  }
  getExtensionName() {
    return PlatformAuthConstants.DOM_API_NAME;
  }
  /**
   * Send token request to platform broker via browser DOM API
   * @param request
   * @returns
   */
  sendMessage(request) {
    return __async(this, null, function* () {
      const correlationId = this.getCorrelationId(request.correlationId);
      const sendMessageMeasurement = this.performanceClient.startMeasurement(PlatformAuthDOMGetToken, correlationId);
      sendMessageMeasurement.add({
        platformAuthProviderType: this.platformAuthType
      });
      this.logger.trace(`02bcil ${this.platformAuthType}`, correlationId);
      try {
        const platformDOMRequest = invoke(this.initializePlatformDOMRequest.bind(this), PlatformAuthDOMInitializeRequest, this.logger, this.performanceClient, correlationId)(request);
        const response = (
          // @ts-ignore
          yield window.navigator.platformAuthentication.executeGetToken(platformDOMRequest)
        );
        const validatedResponse = this.validatePlatformBrokerResponse(response, correlationId);
        sendMessageMeasurement.end({
          success: true,
          platformAuthProviderType: this.platformAuthType
        });
        return validatedResponse;
      } catch (e) {
        this.logger.error(`11im7g ${this.platformAuthType}`, correlationId);
        sendMessageMeasurement.end({
          success: false,
          platformAuthProviderType: this.platformAuthType
        }, e);
        throw e;
      }
    });
  }
  initializePlatformDOMRequest(request) {
    const _a = request, { accountId, clientId, authority, scope, redirectUri, correlationId, state, preferBinding, enclave, reqCnf, extraParametersNoCache, extraParameters } = _a, remainingProperties = __objRest(_a, ["accountId", "clientId", "authority", "scope", "redirectUri", "correlationId", "state", "preferBinding", "enclave", "reqCnf", "extraParametersNoCache", "extraParameters"]);
    const requestCorrelationId = this.getCorrelationId(correlationId);
    this.logger.trace(`15d6yv ${this.platformAuthType}`, requestCorrelationId);
    delete remainingProperties.resourceRequestMethod;
    delete remainingProperties.resourceRequestUri;
    const validExtraParameters = this.getDOMExtraParams(remainingProperties, requestCorrelationId);
    const platformDOMRequest = {
      accountId,
      brokerId: this.getExtensionId(),
      authority,
      clientId,
      correlationId: requestCorrelationId,
      extraParameters: __spreadValues(__spreadValues({}, extraParameters), validExtraParameters),
      isSecurityTokenService: false,
      redirectUri,
      scope,
      state,
      preferBinding,
      enclave,
      requestConfirmation: reqCnf,
      extraParametersNoCache
    };
    return platformDOMRequest;
  }
  validatePlatformBrokerResponse(response, correlationId) {
    const validationMeasurement = this.performanceClient.startMeasurement(PlatformAuthDOMValidateResponse, correlationId);
    const requiredKeys = [
      "accessToken",
      "idToken",
      "clientInfo",
      "account",
      "scopes",
      "expiresIn"
    ];
    const isValid = response && requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(response, key));
    if (response && Object.prototype.hasOwnProperty.call(response, "isSuccess")) {
      if (isValid) {
        this.logger.trace(`0h4vei ${this.platformAuthType}`, correlationId);
        try {
          const validatedResponse = this.convertToPlatformBrokerResponse(response, correlationId);
          validationMeasurement.end({
            success: true,
            platformAuthProviderType: this.platformAuthType
          });
          return validatedResponse;
        } catch (e) {
          validationMeasurement.end({
            success: false,
            platformAuthProviderType: this.platformAuthType
          }, e);
          throw e;
        }
      } else if (Object.prototype.hasOwnProperty.call(response, "error")) {
        const errorResponse = response;
        if (errorResponse.isSuccess === false && errorResponse.error && errorResponse.error.code) {
          this.logger.trace(`0g92vm ${this.platformAuthType}`, correlationId);
          const nativeAuthError = createNativeAuthError(errorResponse.error.code, correlationId, errorResponse.error.description, {
            error: parseInt(errorResponse.error.errorCode),
            protocol_error: errorResponse.error.protocolError,
            status: errorResponse.error.status,
            properties: errorResponse.error.properties
          });
          validationMeasurement.end({
            success: false,
            platformAuthProviderType: this.platformAuthType,
            brokerErrorName: errorResponse.error.code,
            brokerErrorCode: errorResponse.error.errorCode
          }, nativeAuthError);
          throw nativeAuthError;
        }
      }
    }
    const error = createAuthError(AuthErrorCodes_exports.unexpectedError, correlationId, "Response missing expected properties.");
    validationMeasurement.end({
      success: false,
      platformAuthProviderType: this.platformAuthType
    }, error);
    throw error;
  }
  getCorrelationId(correlationId) {
    return correlationId || this.correlationId;
  }
  convertToPlatformBrokerResponse(response, correlationId) {
    this.logger.trace(`14913t ${this.platformAuthType}`, correlationId);
    const responseProperties = response.properties || {};
    const bindingAttested = this.parseDOMBoolean(responseProperties.binding_attested, "binding_attested", correlationId);
    const nativeResponse = {
      access_token: response.accessToken,
      id_token: response.idToken,
      client_info: response.clientInfo,
      account: response.account,
      expires_in: response.expiresIn,
      scope: response.scopes,
      state: response.state || "",
      properties: responseProperties,
      extendedLifetimeToken: response.extendedLifetimeToken ?? false,
      shr: response.proofOfPossessionPayload,
      token_type: responseProperties.token_type,
      DPoP: responseProperties.dpop_proof,
      binding_attested: bindingAttested
    };
    return nativeResponse;
  }
  parseDOMBoolean(value, propertyName, correlationId) {
    if (value === void 0) {
      return void 0;
    }
    if (value === "true" || value === "false") {
      return value === "true";
    }
    throw createAuthError(AuthErrorCodes_exports.unexpectedError, correlationId, `Platform broker returned invalid ${propertyName} value.`);
  }
  getDOMExtraParams(extraParameters, correlationId) {
    try {
      const stringifiedProperties = {};
      for (const [key, value] of Object.entries(extraParameters)) {
        if (!value) {
          continue;
        }
        if (typeof value === "object") {
          stringifiedProperties[key] = JSON.stringify(value);
        } else {
          stringifiedProperties[key] = String(value);
        }
      }
      return stringifiedProperties;
    } catch (e) {
      this.logger.error(`0eu9o3 ${this.platformAuthType}`, correlationId);
      this.logger.errorPii(`17rpl5 ${this.platformAuthType} ${e}`, correlationId);
      return {};
    }
  }
};

// node_modules/@azure/msal-browser/dist/broker/nativeBroker/PlatformAuthProvider.mjs
function isPlatformBrokerAvailable(domConfig, loggerOptions, perfClient, correlationId) {
  return __async(this, null, function* () {
    const logger = new Logger(loggerOptions || {}, name, version);
    const performanceClient = perfClient || new StubPerformanceClient();
    if (typeof window === "undefined") {
      logger.trace("082ed3", correlationId || createNewGuid());
      return false;
    }
    return !!(yield getPlatformAuthProvider(logger, performanceClient, correlationId || createNewGuid(), void 0, domConfig));
  });
}
function getPlatformAuthProvider(logger, performanceClient, correlationId, nativeBrokerHandshakeTimeout, enablePlatformBrokerDOMSupport) {
  return __async(this, null, function* () {
    logger.trace("134j0v", correlationId);
    const discoveryMeasurement = performanceClient.startMeasurement(PlatformAuthProviderDiscovery, correlationId);
    logger.trace(`04c81g ${enablePlatformBrokerDOMSupport}`, correlationId);
    let platformAuthProvider;
    try {
      if (enablePlatformBrokerDOMSupport) {
        try {
          platformAuthProvider = yield PlatformAuthDOMHandler.createProvider(logger, performanceClient, correlationId);
        } catch (e) {
          logger.trace("1ij09j", correlationId);
        }
        if (platformAuthProvider) {
          discoveryMeasurement.add({
            platformAuthProviderType: PlatformAuthConstants.PLATFORM_DOM_PROVIDER
          });
          discoveryMeasurement.end({
            success: true,
            platformAuthProviderType: PlatformAuthConstants.PLATFORM_DOM_PROVIDER
          });
          return platformAuthProvider;
        }
      }
      logger.trace("0l3na8", correlationId);
      platformAuthProvider = yield PlatformAuthExtensionHandler.createProvider(logger, nativeBrokerHandshakeTimeout || DEFAULT_NATIVE_BROKER_HANDSHAKE_TIMEOUT_MS, performanceClient, correlationId);
      if (platformAuthProvider) {
        discoveryMeasurement.add({
          platformAuthProviderType: PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER
        });
      }
      discoveryMeasurement.end({
        success: !!platformAuthProvider,
        platformAuthProviderType: platformAuthProvider ? PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER : void 0
      });
    } catch (e) {
      logger.trace("0icbd7", e);
      discoveryMeasurement.end({
        success: false
      }, e);
    }
    return platformAuthProvider;
  });
}
function isPlatformAuthAllowed(config, logger, correlationId, platformAuthProvider, authenticationScheme, performanceClient) {
  logger.trace("0uko3r", correlationId);
  const schemeSupported = !authenticationScheme || authenticationScheme === Constants_exports.AuthenticationScheme.BEARER || authenticationScheme === Constants_exports.AuthenticationScheme.POP;
  const fields = __spreadValues({
    allowPlatformBroker: config.system.allowPlatformBroker
  }, config.system.allowPlatformBroker && {
    platformAuthProviderType: platformAuthProvider instanceof PlatformAuthDOMHandler ? PlatformAuthConstants.PLATFORM_DOM_PROVIDER : platformAuthProvider ? PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER : void 0
  });
  performanceClient?.addFields(fields, correlationId);
  if (!config.system.allowPlatformBroker && config.experimental.allowPlatformBrokerWithDOM) {
    throw createClientConfigurationError(ClientConfigurationErrorCodes_exports.invalidPlatformBrokerConfiguration, "");
  }
  if (!config.system.allowPlatformBroker) {
    logger.trace("04hozs", correlationId);
    return false;
  }
  if (!platformAuthProvider) {
    logger.trace("0kvv1r", correlationId);
    return false;
  }
  if (!schemeSupported) {
    logger.trace("1dd2nh", correlationId);
    return false;
  }
  logger.trace("18tev1", correlationId);
  return true;
}

// node_modules/@azure/msal-browser/dist/interaction_client/PopupClient.mjs
var PopupClient = class extends StandardInteractionClient {
  constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeStorageImpl, correlationId, platformAuthHandler, waitForPopupResponseHook, tokenBindingKeyManager) {
    super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, correlationId, platformAuthHandler, tokenBindingKeyManager);
    this.nativeStorage = nativeStorageImpl;
    this.eventHandler = eventHandler;
    this.waitForPopupResponseHook = waitForPopupResponseHook;
  }
  /**
   * Acquires tokens by opening a popup window to the /authorize endpoint of the authority
   * @param request
   * @param pkceCodes
   */
  acquireToken(request, pkceCodes) {
    let popupParams = void 0;
    try {
      const popupName = this.generatePopupName(request.scopes || Constants_exports.OIDC_DEFAULT_SCOPES, request.authority || this.config.auth.authority);
      popupParams = {
        popupName,
        popupWindowAttributes: request.popupWindowAttributes || {},
        popupWindowParent: request.popupWindowParent ?? window
      };
      this.performanceClient.addFields({ isAsyncPopup: !this.config.system.navigatePopups }, this.correlationId);
      if (!this.config.system.navigatePopups) {
        this.logger.verbose("162h4u", this.correlationId);
        return this.acquireTokenPopupAsync(request, popupParams, pkceCodes);
      } else {
        const validatedRequest = __spreadProps(__spreadValues({}, request), {
          httpMethod: validateRequestMethod(request, this.config.system.protocolMode)
        });
        this.logger.verbose("1f9ok3", this.correlationId);
        popupParams.popup = this.openSizedPopup("about:blank", popupParams);
        return this.acquireTokenPopupAsync(validatedRequest, popupParams, pkceCodes);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
   * @param logoutRequest
   */
  logout(logoutRequest) {
    try {
      this.logger.verbose("068rup", this.correlationId);
      const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
      const popupParams = {
        popupName: this.generateLogoutPopupName(validLogoutRequest),
        popupWindowAttributes: logoutRequest?.popupWindowAttributes || {},
        popupWindowParent: logoutRequest?.popupWindowParent ?? window
      };
      const authority = logoutRequest && logoutRequest.authority;
      const mainWindowRedirectUri = logoutRequest && logoutRequest.mainWindowRedirectUri;
      if (!this.config.system.navigatePopups) {
        this.logger.verbose("1phd8u", this.correlationId);
        return this.logoutPopupAsync(validLogoutRequest, popupParams, authority, mainWindowRedirectUri);
      } else {
        this.logger.verbose("1a28da", this.correlationId);
        popupParams.popup = this.openSizedPopup("about:blank", popupParams);
        return this.logoutPopupAsync(validLogoutRequest, popupParams, authority, mainWindowRedirectUri);
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Helper which obtains an access_token for your API via opening a popup window in the user's browser
   * @param request
   * @param popupParams
   * @param pkceCodes
   *
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  acquireTokenPopupAsync(request, popupParams, pkceCodes) {
    return __async(this, null, function* () {
      this.logger.verbose("1g77pg", this.correlationId);
      const validRequest = yield invokeAsync(initializeAuthorizationRequest, StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, this.correlationId)(request, InteractionType.Popup, this.config, this.browserCrypto, this.browserStorage, this.logger, this.performanceClient, this.correlationId);
      if (popupParams.popup) {
        preconnect(validRequest.authority);
      }
      const isPlatformBroker = isPlatformAuthAllowed(this.config, this.logger, this.correlationId, this.platformAuthProvider, request.authenticationScheme);
      validRequest.platformBroker = isPlatformBroker;
      if (this.config.system.protocolMode === ProtocolMode.EAR) {
        return this.executeEarFlow(validRequest, popupParams, pkceCodes);
      } else {
        return this.executeCodeFlow(validRequest, popupParams, pkceCodes);
      }
    });
  }
  /**
   * Executes auth code + PKCE flow
   * @param request
   * @param popupParams
   * @param pkceCodes
   * @returns
   */
  executeCodeFlow(request, popupParams, pkceCodes) {
    return __async(this, null, function* () {
      const correlationId = request.correlationId;
      const serverTelemetryManager = initializeServerTelemetryManager(ApiId.acquireTokenPopup, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      const pkce = pkceCodes || (yield invokeAsync(generatePkceCodes, GeneratePkceCodes, this.logger, this.performanceClient, correlationId)(this.performanceClient, this.logger, correlationId));
      const tokenBindingParams = yield getTokenBindingRequestParams(request, this.tokenBindingKeyManager, this.logger, this.performanceClient);
      const popupRequest = __spreadValues(__spreadProps(__spreadValues({}, request), {
        codeChallenge: pkce.challenge
      }), tokenBindingParams);
      try {
        const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, correlationId)({
          serverTelemetryManager,
          requestAuthority: popupRequest.authority,
          requestAzureCloudOptions: popupRequest.azureCloudOptions,
          requestExtraQueryParameters: popupRequest.extraQueryParameters,
          account: popupRequest.account
        });
        if (popupRequest.httpMethod === Constants_exports.HttpMethod.POST) {
          return yield this.executeCodeFlowWithPost(popupRequest, popupParams, authClient, pkce.verifier);
        } else {
          const navigateUrl = yield invokeAsync(getAuthCodeRequestUrl, PerformanceEvents_exports.GetAuthCodeUrl, this.logger, this.performanceClient, correlationId)(this.config, authClient.authority, popupRequest, this.logger, this.performanceClient);
          const popupRelayUri = this.config.auth.popupRelayUri;
          const popupNavigateUrl = popupRelayUri ? buildPopupRelayUrl(popupRelayUri, this.getRelayStateId(request.state, correlationId), { method: "GET", url: navigateUrl }, correlationId) : navigateUrl;
          const popupWindow = this.initiateAuthRequest(popupNavigateUrl, popupParams);
          this.eventHandler.emitEvent(EventType.POPUP_OPENED, correlationId, InteractionType.Popup, { popupWindow }, null);
          const responseString = yield this.waitForPopupResponse(request, popupWindow, popupParams.popupWindowParent);
          const serverParams = invoke(deserializeResponse, DeserializeResponse, this.logger, this.performanceClient, this.correlationId)(responseString, this.config.auth.OIDCOptions.responseMode, this.logger, this.correlationId);
          return yield invokeAsync(handleResponseCode, HandleResponseCode, this.logger, this.performanceClient, correlationId)(popupRequest, serverParams, pkce.verifier, ApiId.acquireTokenPopup, this.config, authClient, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
        }
      } catch (e) {
        popupParams.popup?.close();
        if (e instanceof AuthError) {
          e.correlationId = this.correlationId;
          serverTelemetryManager.cacheFailedRequest(e);
        }
        throw e;
      }
    });
  }
  /**
   * Executes EAR flow
   * @param request
   */
  executeEarFlow(request, popupParams, pkceCodes) {
    return __async(this, null, function* () {
      const { correlationId, authority, azureCloudOptions, extraQueryParameters, account } = request;
      const discoveredAuthority = yield invokeAsync(getDiscoveredAuthority, StandardInteractionClientGetDiscoveredAuthority, this.logger, this.performanceClient, correlationId)(this.config, this.correlationId, this.performanceClient, this.browserStorage, this.logger, authority, azureCloudOptions, extraQueryParameters, account);
      const earJwk = yield invokeAsync(generateEarKey, GenerateEarKey, this.logger, this.performanceClient, correlationId)();
      const pkce = pkceCodes || (yield invokeAsync(generatePkceCodes, GeneratePkceCodes, this.logger, this.performanceClient, correlationId)(this.performanceClient, this.logger, correlationId));
      const tokenBindingParams = yield getTokenBindingRequestParams(request, this.tokenBindingKeyManager, this.logger, this.performanceClient);
      const popupRequest = __spreadValues(__spreadProps(__spreadValues({}, request), {
        earJwk,
        codeChallenge: pkce.challenge
      }), tokenBindingParams);
      const popupWindow = yield this.openPostFormPopup(popupRequest, discoveredAuthority, popupParams, correlationId, true);
      const responseString = yield invokeAsync(this.waitForPopupResponse.bind(this), SilentHandlerMonitorIframeForHash, this.logger, this.performanceClient, correlationId)(popupRequest, popupWindow, popupParams.popupWindowParent);
      const serverParams = invoke(deserializeResponse, DeserializeResponse, this.logger, this.performanceClient, this.correlationId)(responseString, this.config.auth.OIDCOptions.responseMode, this.logger, this.correlationId);
      if (!serverParams.ear_jwe && serverParams.code) {
        const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, correlationId)({
          serverTelemetryManager: initializeServerTelemetryManager(ApiId.acquireTokenPopup, this.config.auth.clientId, correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled),
          requestAuthority: request.authority,
          requestAzureCloudOptions: request.azureCloudOptions,
          requestExtraQueryParameters: request.extraQueryParameters,
          account: request.account,
          authority: discoveredAuthority
        });
        return invokeAsync(handleResponseCode, HandleResponseCode, this.logger, this.performanceClient, correlationId)(popupRequest, serverParams, pkce.verifier, ApiId.acquireTokenPopup, this.config, authClient, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
      } else {
        return invokeAsync(handleResponseEAR, HandleResponseEar, this.logger, this.performanceClient, correlationId)(popupRequest, serverParams, ApiId.acquireTokenPopup, this.config, discoveredAuthority, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
      }
    });
  }
  executeCodeFlowWithPost(request, popupParams, authClient, pkceVerifier) {
    return __async(this, null, function* () {
      const correlationId = request.correlationId;
      const discoveredAuthority = yield invokeAsync(getDiscoveredAuthority, StandardInteractionClientGetDiscoveredAuthority, this.logger, this.performanceClient, correlationId)(this.config, this.correlationId, this.performanceClient, this.browserStorage, this.logger);
      const popupWindow = yield this.openPostFormPopup(request, discoveredAuthority, popupParams, correlationId, false);
      const responseString = yield invokeAsync(this.waitForPopupResponse.bind(this), SilentHandlerMonitorIframeForHash, this.logger, this.performanceClient, correlationId)(request, popupWindow, popupParams.popupWindowParent);
      const serverParams = invoke(deserializeResponse, DeserializeResponse, this.logger, this.performanceClient, this.correlationId)(responseString, this.config.auth.OIDCOptions.responseMode, this.logger, this.correlationId);
      return invokeAsync(handleResponseCode, HandleResponseCode, this.logger, this.performanceClient, correlationId)(request, serverParams, pkceVerifier, ApiId.acquireTokenPopup, this.config, authClient, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
    });
  }
  /**
   *
   * @param validRequest
   * @param popupName
   * @param requestAuthority
   * @param popup
   * @param mainWindowRedirectUri
   * @param popupWindowAttributes
   */
  logoutPopupAsync(validRequest, popupParams, requestAuthority, mainWindowRedirectUri) {
    return __async(this, null, function* () {
      this.logger.verbose("0b7yrk", this.correlationId);
      this.eventHandler.emitEvent(EventType.LOGOUT_START, this.correlationId, InteractionType.Popup, validRequest);
      const serverTelemetryManager = initializeServerTelemetryManager(ApiId.logoutPopup, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      try {
        yield clearCacheOnLogout(this.browserStorage, this.browserCrypto, this.logger, this.correlationId, validRequest.account);
        const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, this.correlationId)({
          serverTelemetryManager,
          requestAuthority,
          account: validRequest.account || void 0
        });
        try {
          authClient.authority.endSessionEndpoint;
        } catch (e) {
          if (validRequest.account?.homeAccountId && validRequest.postLogoutRedirectUri && authClient.authority.protocolMode === ProtocolMode.OIDC) {
            this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, validRequest.correlationId, InteractionType.Popup, validRequest);
            if (mainWindowRedirectUri) {
              const navigationOptions = {
                apiId: ApiId.logoutPopup,
                timeout: this.config.system.redirectNavigationTimeout,
                noHistory: false
              };
              const absoluteUrl = UrlString.getAbsoluteUrl(mainWindowRedirectUri, getCurrentUri(), this.correlationId);
              yield this.navigationClient.navigateInternal(absoluteUrl, navigationOptions);
            }
            popupParams.popup?.close();
            return;
          }
        }
        validRequest.state = ProtocolUtils_exports.setRequestState(this.browserCrypto, validRequest.state || "", {
          interactionType: InteractionType.Popup
        }, validRequest.correlationId);
        const logoutUri = authClient.getLogoutUri(validRequest);
        this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, validRequest.correlationId, InteractionType.Popup, validRequest);
        const popupRelayUri = this.config.auth.popupRelayUri;
        const popupNavigateUrl = popupRelayUri ? buildPopupRelayUrl(popupRelayUri, this.getRelayStateId(validRequest.state || "", this.correlationId), { method: "GET", url: logoutUri }, this.correlationId) : logoutUri;
        const popupWindow = this.openPopup(popupNavigateUrl, popupParams);
        this.eventHandler.emitEvent(EventType.POPUP_OPENED, validRequest.correlationId, InteractionType.Popup, { popupWindow }, null);
        yield this.waitForPopupResponse(validRequest, popupWindow, popupParams.popupWindowParent).catch(() => {
        });
        if (mainWindowRedirectUri) {
          const navigationOptions = {
            apiId: ApiId.logoutPopup,
            timeout: this.config.system.redirectNavigationTimeout,
            noHistory: false
          };
          const absoluteUrl = UrlString.getAbsoluteUrl(mainWindowRedirectUri, getCurrentUri(), this.correlationId);
          this.logger.verbose("0qcur2", this.correlationId);
          this.logger.verbosePii(`0oj7lk ${absoluteUrl}`, this.correlationId);
          yield this.navigationClient.navigateInternal(absoluteUrl, navigationOptions);
        } else {
          this.logger.verbose("03zgcf", this.correlationId);
        }
      } catch (e) {
        popupParams.popup?.close();
        if (e instanceof AuthError) {
          e.correlationId = this.correlationId;
          serverTelemetryManager.cacheFailedRequest(e);
        }
        this.eventHandler.emitEvent(EventType.LOGOUT_FAILURE, this.correlationId, InteractionType.Popup, null, e);
        this.eventHandler.emitEvent(EventType.LOGOUT_END, this.correlationId, InteractionType.Popup);
        throw e;
      }
      this.eventHandler.emitEvent(EventType.LOGOUT_END, this.correlationId, InteractionType.Popup);
    });
  }
  /**
   * Opens a popup window with given request Url.
   * @param requestUrl
   */
  initiateAuthRequest(requestUrl, params) {
    if (requestUrl) {
      this.logger.infoPii(`1kcr9k ${requestUrl}`, this.correlationId);
      return this.openPopup(requestUrl, params);
    } else {
      this.logger.error("1l7hyp", this.correlationId);
      throw createBrowserAuthError(emptyNavigateUri, this.correlationId);
    }
  }
  /**
   * @hidden
   *
   * Configures popup window for login.
   *
   * @param urlNavigate
   * @param title
   * @param popUpWidth
   * @param popUpHeight
   * @param popupWindowAttributes
   * @ignore
   * @hidden
   */
  openPopup(urlNavigate, popupParams) {
    try {
      let popupWindow;
      if (popupParams.popup) {
        popupWindow = popupParams.popup;
        this.logger.verbosePii(`0cgeo7 ${urlNavigate}`, this.correlationId);
        popupWindow.location.assign(urlNavigate);
      } else if (typeof popupParams.popup === "undefined") {
        this.logger.verbosePii(`0c2awd ${urlNavigate}`, this.correlationId);
        popupWindow = this.openSizedPopup(urlNavigate, popupParams);
      }
      if (!popupWindow) {
        throw createBrowserAuthError(emptyWindowError, this.correlationId);
      }
      try {
        popupWindow.document.title = "Microsoft Authentication";
      } catch (e) {
        if (typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "SecurityError") {
        } else {
          this.logger.verbose("1s1yfs", this.correlationId);
        }
      }
      if (popupWindow.focus) {
        popupWindow.focus();
      }
      this.currentWindow = popupWindow;
      return popupWindow;
    } catch (e) {
      this.logger.error(`0dxfb9 ${e.message}`, this.correlationId);
      throw createBrowserAuthError(popupWindowError, this.correlationId);
    }
  }
  /**
   * Helper function to set popup window dimensions and position
   * @param urlNavigate
   * @param popupName
   * @param popupWindowAttributes
   * @returns
   */
  openSizedPopup(urlNavigate, { popupName, popupWindowAttributes, popupWindowParent }) {
    const winLeft = popupWindowParent.screenLeft ? popupWindowParent.screenLeft : popupWindowParent.screenX;
    const winTop = popupWindowParent.screenTop ? popupWindowParent.screenTop : popupWindowParent.screenY;
    const winWidth = popupWindowParent.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const winHeight = popupWindowParent.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    let width = popupWindowAttributes.popupSize?.width;
    let height = popupWindowAttributes.popupSize?.height;
    let top = popupWindowAttributes.popupPosition?.top;
    let left = popupWindowAttributes.popupPosition?.left;
    if (!width || width < 0 || width > winWidth) {
      this.logger.verbose("08vfmo", this.correlationId);
      width = BrowserConstants.POPUP_WIDTH;
    }
    if (!height || height < 0 || height > winHeight) {
      this.logger.verbose("09cxa0", this.correlationId);
      height = BrowserConstants.POPUP_HEIGHT;
    }
    if (!top || top < 0 || top > winHeight) {
      this.logger.verbose("1qh4wo", this.correlationId);
      top = Math.max(0, winHeight / 2 - BrowserConstants.POPUP_HEIGHT / 2 + winTop);
    }
    if (!left || left < 0 || left > winWidth) {
      this.logger.verbose("1sz3en", this.correlationId);
      left = Math.max(0, winWidth / 2 - BrowserConstants.POPUP_WIDTH / 2 + winLeft);
    }
    return popupWindowParent.open(urlNavigate, popupName, `width=${width}, height=${height}, top=${top}, left=${left}, scrollbars=yes`);
  }
  /**
   * Generates the name for the popup based on the client id and request
   * @param clientId
   * @param request
   */
  generatePopupName(scopes, authority) {
    return `${BrowserConstants.POPUP_NAME_PREFIX}.${this.config.auth.clientId}.${scopes.join("-")}.${authority}.${this.correlationId}`;
  }
  /**
   * Generates the name for the popup based on the client id and request for logouts
   * @param clientId
   * @param request
   */
  generateLogoutPopupName(request) {
    const homeAccountId = request.account && request.account.homeAccountId;
    return `${BrowserConstants.POPUP_NAME_PREFIX}.${this.config.auth.clientId}.${homeAccountId}.${this.correlationId}`;
  }
  /**
   * Decodes the per-request library-state id from the encoded request state.
   */
  getRelayStateId(state, correlationId) {
    return ProtocolUtils_exports.parseRequestState(base64Decode, state, correlationId).libraryState.id;
  }
  /**
   * Opens the interactive popup for a POST-form /authorize request. Shared by
   * the auth-code POST and EAR flows, which are identical apart from the form
   * builder (`isEAR` selects the EAR vs auth-code builders). When a
   * popup-relay page is configured the form is carried to the relay page
   * (which opens the IdP child popup); otherwise the form is submitted
   * directly into the popup.
   */
  openPostFormPopup(request, discoveredAuthority, popupParams, correlationId, isEAR) {
    return __async(this, null, function* () {
      const popupRelayUri = this.config.auth.popupRelayUri;
      if (popupRelayUri) {
        const getFormData = isEAR ? getEARFormData : getCodeFormData;
        const formData = yield getFormData(this.config, discoveredAuthority, request, this.logger, this.performanceClient);
        const relayUrl = buildPopupRelayUrl(popupRelayUri, this.getRelayStateId(request.state, correlationId), {
          method: "POST",
          action: formData.action,
          fields: formData.fields
        }, correlationId);
        return this.initiateAuthRequest(relayUrl, popupParams);
      }
      const popupWindow = popupParams.popup || this.openPopup("about:blank", popupParams);
      const getForm = isEAR ? getEARForm : getCodeForm;
      const form = yield getForm(popupWindow.document, this.config, discoveredAuthority, request, this.logger, this.performanceClient);
      form.submit();
      return popupWindow;
    });
  }
  waitForPopupResponse(request, popupWindow, popupWindowParent) {
    return __async(this, null, function* () {
      if (this.config.auth.popupRelayUri) {
        return waitForPopupRelayResponse(this.config.system.popupBridgeTimeout, this.logger, request, popupWindow, this.performanceClient);
      }
      if (this.waitForPopupResponseHook) {
        return this.waitForPopupResponseHook(request, popupWindow, popupWindowParent);
      }
      return waitForBridgeResponse(this.config.system.popupBridgeTimeout, this.logger, request, this.performanceClient);
    });
  }
};

// node_modules/@azure/msal-browser/dist/interaction_client/RedirectClient.mjs
function getNavigationType() {
  if (typeof window === "undefined" || typeof window.performance === "undefined" || typeof window.performance.getEntriesByType !== "function") {
    return void 0;
  }
  const navigationEntries = window.performance.getEntriesByType("navigation");
  const navigation = navigationEntries.length ? navigationEntries[0] : void 0;
  return navigation?.type;
}
var RedirectClient = class extends StandardInteractionClient {
  constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, nativeStorageImpl, correlationId, platformAuthHandler, tokenBindingKeyManager) {
    super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, correlationId, platformAuthHandler, tokenBindingKeyManager);
    this.nativeStorage = nativeStorageImpl;
  }
  /**
   * Redirects the page to the /authorize endpoint of the IDP
   * @param request
   */
  acquireToken(request) {
    return __async(this, null, function* () {
      const validRequest = yield invokeAsync(initializeAuthorizationRequest, StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, this.correlationId)(request, InteractionType.Redirect, this.config, this.browserCrypto, this.browserStorage, this.logger, this.performanceClient, this.correlationId);
      validRequest.platformBroker = isPlatformAuthAllowed(this.config, this.logger, this.correlationId, this.platformAuthProvider, request.authenticationScheme);
      let rejectBackButtonCancellation;
      const backButtonCancellation = new Promise((_, reject) => {
        rejectBackButtonCancellation = reject;
      });
      const handleBackButton = (event) => {
        if (event.persisted) {
          this.logger.verbose("0udvtt", this.correlationId);
          this.browserStorage.resetRequestCache(this.correlationId);
          this.eventHandler.emitEvent(EventType.RESTORE_FROM_BFCACHE, this.correlationId, InteractionType.Redirect);
          rejectBackButtonCancellation(createBrowserAuthError(userCancelled, this.correlationId));
        }
      };
      const redirectStartPage = this.getRedirectStartPage(request.redirectStartPage);
      this.logger.verbosePii(`0zao0a ${redirectStartPage}`, this.correlationId);
      this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, redirectStartPage, true);
      window.addEventListener("pageshow", handleBackButton);
      try {
        const redirectOperation = this.config.system.protocolMode === ProtocolMode.EAR ? this.executeEarFlow(validRequest) : this.executeCodeFlow(validRequest);
        yield Promise.race([redirectOperation, backButtonCancellation]);
      } catch (e) {
        if (e instanceof AuthError) {
          e.correlationId = this.correlationId;
        }
        window.removeEventListener("pageshow", handleBackButton);
        throw e;
      }
    });
  }
  /**
   * Executes auth code + PKCE flow
   * @param request
   * @returns
   */
  executeCodeFlow(request) {
    return __async(this, null, function* () {
      const correlationId = request.correlationId;
      const serverTelemetryManager = initializeServerTelemetryManager(ApiId.acquireTokenRedirect, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      const pkceCodes = yield invokeAsync(generatePkceCodes, GeneratePkceCodes, this.logger, this.performanceClient, correlationId)(this.performanceClient, this.logger, correlationId);
      const tokenBindingParams = yield getTokenBindingRequestParams(request, this.tokenBindingKeyManager, this.logger, this.performanceClient);
      const redirectRequest = __spreadValues(__spreadProps(__spreadValues({}, request), {
        codeChallenge: pkceCodes.challenge
      }), tokenBindingParams);
      this.browserStorage.cacheAuthorizeRequest(redirectRequest, this.correlationId, pkceCodes.verifier);
      try {
        if (redirectRequest.httpMethod === Constants_exports.HttpMethod.POST) {
          return yield this.executeCodeFlowWithPost(redirectRequest);
        } else {
          const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, this.correlationId)({
            serverTelemetryManager,
            requestAuthority: redirectRequest.authority,
            requestAzureCloudOptions: redirectRequest.azureCloudOptions,
            requestExtraQueryParameters: redirectRequest.extraQueryParameters,
            account: redirectRequest.account
          });
          const navigateUrl = yield invokeAsync(getAuthCodeRequestUrl, PerformanceEvents_exports.GetAuthCodeUrl, this.logger, this.performanceClient, request.correlationId)(this.config, authClient.authority, redirectRequest, this.logger, this.performanceClient);
          return yield this.initiateAuthRequest(navigateUrl);
        }
      } catch (e) {
        if (e instanceof AuthError) {
          e.correlationId = this.correlationId;
          serverTelemetryManager.cacheFailedRequest(e);
        }
        throw e;
      }
    });
  }
  /**
   * Executes EAR flow
   * @param request
   */
  executeEarFlow(request) {
    return __async(this, null, function* () {
      const { correlationId, authority, azureCloudOptions, extraQueryParameters, account } = request;
      const discoveredAuthority = yield invokeAsync(getDiscoveredAuthority, StandardInteractionClientGetDiscoveredAuthority, this.logger, this.performanceClient, correlationId)(this.config, this.correlationId, this.performanceClient, this.browserStorage, this.logger, authority, azureCloudOptions, extraQueryParameters, account);
      const earJwk = yield invokeAsync(generateEarKey, GenerateEarKey, this.logger, this.performanceClient, correlationId)();
      const pkceCodes = yield invokeAsync(generatePkceCodes, GeneratePkceCodes, this.logger, this.performanceClient, correlationId)(this.performanceClient, this.logger, correlationId);
      const tokenBindingParams = yield getTokenBindingRequestParams(request, this.tokenBindingKeyManager, this.logger, this.performanceClient);
      const redirectRequest = __spreadValues(__spreadProps(__spreadValues({}, request), {
        earJwk,
        codeChallenge: pkceCodes.challenge
      }), tokenBindingParams);
      this.browserStorage.cacheAuthorizeRequest(redirectRequest, this.correlationId, pkceCodes.verifier);
      const form = yield getEARForm(document, this.config, discoveredAuthority, redirectRequest, this.logger, this.performanceClient);
      form.submit();
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(createBrowserAuthError(timedOut, "", "failed_to_redirect"));
        }, this.config.system.redirectNavigationTimeout);
      });
    });
  }
  /**
   * Executes classic Authorization Code flow with a POST request.
   * @param request
   */
  executeCodeFlowWithPost(request) {
    return __async(this, null, function* () {
      const correlationId = request.correlationId;
      const discoveredAuthority = yield invokeAsync(getDiscoveredAuthority, StandardInteractionClientGetDiscoveredAuthority, this.logger, this.performanceClient, correlationId)(this.config, this.correlationId, this.performanceClient, this.browserStorage, this.logger);
      this.browserStorage.cacheAuthorizeRequest(request, this.correlationId);
      const form = yield getCodeForm(document, this.config, discoveredAuthority, request, this.logger, this.performanceClient);
      form.submit();
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(createBrowserAuthError(timedOut, "", "failed_to_redirect"));
        }, this.config.system.redirectNavigationTimeout);
      });
    });
  }
  /**
   * Checks if navigateToLoginRequestUrl is set, and:
   * - if true, performs logic to cache and navigate
   * - if false, handles hash string and parses response
   * @param hash {string} url hash
   * @param parentMeasurement {InProgressPerformanceEvent} parent measurement
   * @param request {CommonAuthorizationUrlRequest} request object
   * @param pkceVerifier {string} PKCE verifier
   * @param options {HandleRedirectPromiseOptions} options for handling redirect promise
   */
  handleRedirectPromise(request, pkceVerifier, parentMeasurement, options) {
    return __async(this, null, function* () {
      const originalTitle = document.title;
      document.title = "Microsoft Authentication";
      const serverTelemetryManager = initializeServerTelemetryManager(ApiId.handleRedirectPromise, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      const navigateToLoginRequestUrl = options?.navigateToLoginRequestUrl ?? true;
      try {
        const [serverParams, responseString] = this.getRedirectResponse(options?.hash || "");
        if (!serverParams) {
          this.logger.info("1qmv0q", this.correlationId);
          this.browserStorage.resetRequestCache(this.correlationId);
          if (getNavigationType() !== "back_forward") {
            parentMeasurement.event.errorCode = "no_server_response";
          } else {
            this.logger.verbose("1eqegq", this.correlationId);
          }
          return null;
        }
        const loginRequestUrl = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, this.correlationId, true) || "";
        const loginRequestUrlNormalized = UrlUtils_exports.normalizeUrlForComparison(loginRequestUrl, this.logger, this.correlationId);
        const currentUrlNormalized = UrlUtils_exports.normalizeUrlForComparison(window.location.href, this.logger, this.correlationId);
        if (loginRequestUrlNormalized === currentUrlNormalized && navigateToLoginRequestUrl) {
          this.logger.verbose("11yred", this.correlationId);
          if (loginRequestUrl.indexOf("#") > -1) {
            replaceHash(loginRequestUrl);
          }
          const handleHashResult = yield this.handleResponse(serverParams, request, pkceVerifier, serverTelemetryManager);
          return handleHashResult;
        } else if (!navigateToLoginRequestUrl) {
          this.logger.verbose("0v4sdv", this.correlationId);
          return yield this.handleResponse(serverParams, request, pkceVerifier, serverTelemetryManager);
        } else if (!isInIframe() || this.config.system.allowRedirectInIframe) {
          this.browserStorage.setTemporaryCache(TemporaryCacheKeys.URL_HASH, responseString, true);
          const navigationOptions = {
            apiId: ApiId.handleRedirectPromise,
            timeout: this.config.system.redirectNavigationTimeout,
            noHistory: true
          };
          let processHashOnRedirect = true;
          if (!loginRequestUrl) {
            const homepage = getHomepage(this.correlationId);
            this.browserStorage.setTemporaryCache(TemporaryCacheKeys.ORIGIN_URI, homepage, true);
            this.logger.warning("1dutq1", this.correlationId);
            processHashOnRedirect = yield this.navigationClient.navigateInternal(homepage, navigationOptions);
          } else {
            this.logger.verbose(`08jpy1 ${loginRequestUrl}`, this.correlationId);
            processHashOnRedirect = yield this.navigationClient.navigateInternal(loginRequestUrl, navigationOptions);
          }
          if (!processHashOnRedirect) {
            return yield this.handleResponse(serverParams, request, pkceVerifier, serverTelemetryManager);
          }
        }
        return null;
      } catch (e) {
        if (e instanceof AuthError) {
          e.correlationId = this.correlationId;
          serverTelemetryManager.cacheFailedRequest(e);
        }
        throw e;
      } finally {
        document.title = originalTitle;
      }
    });
  }
  /**
   * Gets the response hash for a redirect request
   * Returns null if interactionType in the state value is not "redirect" or the hash does not contain known properties
   * @param hash
   */
  getRedirectResponse(userProvidedResponse) {
    this.logger.verbose("1c5i8m", this.correlationId);
    let responseString = userProvidedResponse;
    if (!responseString) {
      if (this.config.auth.OIDCOptions.responseMode === Constants_exports.ResponseMode.QUERY) {
        responseString = window.location.search;
      } else {
        responseString = window.location.hash;
      }
    }
    let response = UrlUtils_exports.getDeserializedResponse(responseString);
    if (response) {
      try {
        validateInteractionType(response, this.browserCrypto, InteractionType.Redirect, this.correlationId);
      } catch (e) {
        if (e instanceof AuthError) {
          this.logger.error(`0bkq6p ${e.errorCode} ${e.errorMessage}`, this.correlationId);
        }
        return [null, ""];
      }
      clearHash(window);
      this.logger.verbose("00uvho", this.correlationId);
      return [response, responseString];
    }
    const cachedHash = this.browserStorage.getTemporaryCache(TemporaryCacheKeys.URL_HASH, this.correlationId, true);
    this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.URL_HASH));
    if (cachedHash) {
      response = UrlUtils_exports.getDeserializedResponse(cachedHash);
      if (response) {
        this.logger.verbose("001671", this.correlationId);
        return [response, cachedHash];
      }
    }
    return [null, ""];
  }
  /**
   * Checks if hash exists and handles in window.
   * @param hash
   * @param state
   */
  handleResponse(serverParams, request, codeVerifier, serverTelemetryManager) {
    return __async(this, null, function* () {
      const state = serverParams.state;
      if (!state) {
        throw createBrowserAuthError(noStateInHash, request.correlationId);
      }
      const { authority, azureCloudOptions, extraQueryParameters, account } = request;
      if (serverParams.ear_jwe) {
        const discoveredAuthority = yield invokeAsync(getDiscoveredAuthority, StandardInteractionClientGetDiscoveredAuthority, this.logger, this.performanceClient, request.correlationId)(this.config, this.correlationId, this.performanceClient, this.browserStorage, this.logger, authority, azureCloudOptions, extraQueryParameters, account);
        return invokeAsync(handleResponseEAR, HandleResponseEar, this.logger, this.performanceClient, request.correlationId)(request, serverParams, ApiId.acquireTokenRedirect, this.config, discoveredAuthority, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
      }
      const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, this.correlationId)({ serverTelemetryManager, requestAuthority: request.authority });
      return invokeAsync(handleResponseCode, HandleResponseCode, this.logger, this.performanceClient, request.correlationId)(request, serverParams, codeVerifier, ApiId.acquireTokenRedirect, this.config, authClient, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
    });
  }
  /**
   * Redirects window to given URL.
   * @param urlNavigate
   * @param onRedirectNavigateRequest - onRedirectNavigate callback provided on the request
   */
  initiateAuthRequest(requestUrl) {
    return __async(this, null, function* () {
      this.logger.verbose("0yaw2e", this.correlationId);
      if (requestUrl) {
        this.logger.infoPii(`1luf83 ${requestUrl}`, this.correlationId);
        const navigationOptions = {
          apiId: ApiId.acquireTokenRedirect,
          timeout: this.config.system.redirectNavigationTimeout,
          noHistory: false
        };
        const onRedirectNavigate = this.config.auth.onRedirectNavigate;
        if (typeof onRedirectNavigate === "function") {
          this.logger.verbose("1nehvl", this.correlationId);
          const navigate = onRedirectNavigate(requestUrl);
          if (navigate !== false) {
            this.logger.verbose("1a0jxh", this.correlationId);
            yield this.navigationClient.navigateExternal(requestUrl, navigationOptions);
            return;
          } else {
            this.logger.verbose("09k5h5", this.correlationId);
            return;
          }
        } else {
          this.logger.verbose("0klwf7", this.correlationId);
          yield this.navigationClient.navigateExternal(requestUrl, navigationOptions);
          return;
        }
      } else {
        this.logger.info("0rlh4e", this.correlationId);
        throw createBrowserAuthError(emptyNavigateUri, this.correlationId);
      }
    });
  }
  /**
   * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
   * Default behaviour is to redirect the user to `window.location.href`.
   * @param logoutRequest
   */
  logout(logoutRequest) {
    return __async(this, null, function* () {
      this.logger.verbose("1rkurh", this.correlationId);
      const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);
      const serverTelemetryManager = initializeServerTelemetryManager(ApiId.logout, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      try {
        this.eventHandler.emitEvent(EventType.LOGOUT_START, this.correlationId, InteractionType.Redirect, logoutRequest);
        yield clearCacheOnLogout(this.browserStorage, this.browserCrypto, this.logger, this.correlationId, validLogoutRequest.account);
        const navigationOptions = {
          apiId: ApiId.logout,
          timeout: this.config.system.redirectNavigationTimeout,
          noHistory: false
        };
        const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, this.correlationId)({
          serverTelemetryManager,
          requestAuthority: logoutRequest && logoutRequest.authority,
          requestExtraQueryParameters: logoutRequest?.extraQueryParameters,
          account: logoutRequest && logoutRequest.account || void 0
        });
        if (authClient.authority.protocolMode === ProtocolMode.OIDC) {
          try {
            authClient.authority.endSessionEndpoint;
          } catch (e) {
            if (validLogoutRequest.account?.homeAccountId) {
              this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, this.correlationId, InteractionType.Redirect, validLogoutRequest);
              return;
            }
          }
        }
        validLogoutRequest.state = ProtocolUtils_exports.setRequestState(this.browserCrypto, validLogoutRequest.state || "", {
          interactionType: InteractionType.Redirect
        }, validLogoutRequest.correlationId);
        const logoutUri = authClient.getLogoutUri(validLogoutRequest);
        if (validLogoutRequest.account?.homeAccountId) {
          this.eventHandler.emitEvent(EventType.LOGOUT_SUCCESS, this.correlationId, InteractionType.Redirect, validLogoutRequest);
        }
        const onRedirectNavigate = this.config.auth.onRedirectNavigate;
        if (typeof onRedirectNavigate === "function") {
          const navigate = onRedirectNavigate(logoutUri);
          if (navigate !== false) {
            this.logger.verbose("06v57e", this.correlationId);
            if (!this.browserStorage.getInteractionInProgress()) {
              this.browserStorage.setInteractionInProgress(true, INTERACTION_TYPE.SIGNOUT);
            }
            yield this.navigationClient.navigateExternal(logoutUri, navigationOptions);
            return;
          } else {
            this.browserStorage.setInteractionInProgress(false);
            this.logger.verbose("0xqes1", this.correlationId);
          }
        } else {
          if (!this.browserStorage.getInteractionInProgress()) {
            this.browserStorage.setInteractionInProgress(true, INTERACTION_TYPE.SIGNOUT);
          }
          yield this.navigationClient.navigateExternal(logoutUri, navigationOptions);
          return;
        }
      } catch (e) {
        if (e instanceof AuthError) {
          e.correlationId = this.correlationId;
          serverTelemetryManager.cacheFailedRequest(e);
        }
        this.eventHandler.emitEvent(EventType.LOGOUT_FAILURE, this.correlationId, InteractionType.Redirect, null, e);
        this.eventHandler.emitEvent(EventType.LOGOUT_END, this.correlationId, InteractionType.Redirect);
        throw e;
      }
      this.eventHandler.emitEvent(EventType.LOGOUT_END, this.correlationId, InteractionType.Redirect);
    });
  }
  /**
   * Use to get the redirectStartPage either from request or use current window
   * @param requestStartPage
   */
  getRedirectStartPage(requestStartPage) {
    const redirectStartPage = requestStartPage || window.location.href;
    const absoluteRedirectStartPage = UrlString.getAbsoluteUrl(redirectStartPage, getCurrentUri(), this.correlationId);
    UrlUtils_exports.validateUrl(absoluteRedirectStartPage, this.logger, this.correlationId);
    return absoluteRedirectStartPage;
  }
};

// node_modules/@azure/msal-browser/dist/interaction_handler/SilentHandler.mjs
function initiateCodeRequest(frame, requestUrl, logger, correlationId) {
  return __async(this, null, function* () {
    if (!requestUrl) {
      logger.info("1l7hyp", correlationId);
      throw createBrowserAuthError(emptyNavigateUri, correlationId);
    }
    frame.src = requestUrl;
    return frame;
  });
}
function initiateCodeFlowWithPost(frame, config, authority, request, logger, performanceClient) {
  return __async(this, null, function* () {
    if (!frame.contentDocument) {
      throw "No document associated with iframe!";
    }
    const form = yield getCodeForm(frame.contentDocument, config, authority, request, logger, performanceClient);
    form.submit();
    return frame;
  });
}
function initiateEarRequest(frame, config, authority, request, logger, performanceClient) {
  return __async(this, null, function* () {
    if (!frame.contentDocument) {
      throw "No document associated with iframe!";
    }
    const form = yield getEARForm(frame.contentDocument, config, authority, request, logger, performanceClient);
    form.submit();
    return frame;
  });
}
function createHiddenIframe() {
  const authFrame = document.createElement("iframe");
  authFrame.className = "msalSilentIframe";
  authFrame.title = "Microsoft Authentication";
  authFrame.style.visibility = "hidden";
  authFrame.style.position = "absolute";
  authFrame.style.width = authFrame.style.height = "0";
  authFrame.style.border = "0";
  authFrame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
  authFrame.setAttribute("allow", "local-network-access *");
  document.body.appendChild(authFrame);
  return authFrame;
}
function removeHiddenIframe(iframe) {
  if (document.body === iframe.parentNode) {
    document.body.removeChild(iframe);
  }
}

// node_modules/@azure/msal-browser/dist/interaction_client/SilentIframeClient.mjs
var SilentIframeClient = class extends StandardInteractionClient {
  constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, apiId, performanceClient, nativeStorageImpl, correlationId, platformAuthProvider, waitForIframeResponseHook, tokenBindingKeyManager) {
    super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, correlationId, platformAuthProvider, tokenBindingKeyManager);
    this.apiId = apiId;
    this.nativeStorage = nativeStorageImpl;
    this.waitForIframeResponseHook = waitForIframeResponseHook;
  }
  /**
   * Acquires a token silently by opening a hidden iframe to the /authorize endpoint with prompt=none or prompt=no_session
   * @param request
   */
  acquireToken(request) {
    return __async(this, null, function* () {
      if (!request.loginHint && !request.sid && (!request.account || !request.account.username)) {
        this.logger.warning("1kl318", this.correlationId);
      }
      const inputRequest = __spreadValues({}, request);
      if (inputRequest.prompt) {
        if (inputRequest.prompt !== Constants_exports.PromptValue.NONE && inputRequest.prompt !== Constants_exports.PromptValue.NO_SESSION) {
          this.logger.warning(`0bmctg ${inputRequest.prompt} ${Constants_exports.PromptValue.NONE}`, this.correlationId);
          inputRequest.prompt = Constants_exports.PromptValue.NONE;
        }
      } else {
        inputRequest.prompt = Constants_exports.PromptValue.NONE;
      }
      const silentRequest = yield invokeAsync(initializeAuthorizationRequest, StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, this.correlationId)(inputRequest, InteractionType.Silent, this.config, this.browserCrypto, this.browserStorage, this.logger, this.performanceClient, this.correlationId);
      silentRequest.platformBroker = isPlatformAuthAllowed(this.config, this.logger, this.correlationId, this.platformAuthProvider, silentRequest.authenticationScheme);
      preconnect(silentRequest.authority);
      if (this.config.system.protocolMode === ProtocolMode.EAR) {
        return this.executeEarFlow(silentRequest);
      } else {
        return this.executeCodeFlow(silentRequest);
      }
    });
  }
  /**
   * Executes auth code + PKCE flow
   * @param request
   * @returns
   */
  executeCodeFlow(request) {
    return __async(this, null, function* () {
      let authClient;
      const serverTelemetryManager = initializeServerTelemetryManager(this.apiId, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      try {
        authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, request.correlationId)({
          serverTelemetryManager,
          requestAuthority: request.authority,
          requestAzureCloudOptions: request.azureCloudOptions,
          requestExtraQueryParameters: request.extraQueryParameters,
          account: request.account
        });
        return yield invokeAsync(this.silentTokenHelper.bind(this), SilentIframeClientTokenHelper, this.logger, this.performanceClient, request.correlationId)(authClient, request);
      } catch (e) {
        if (e instanceof AuthError) {
          e.correlationId = this.correlationId;
          serverTelemetryManager.cacheFailedRequest(e);
        }
        if (!authClient || !(e instanceof AuthError) || e.errorCode !== BrowserConstants.INVALID_GRANT_ERROR) {
          throw e;
        }
        this.performanceClient.addFields({
          retryError: e.errorCode
        }, this.correlationId);
        return yield invokeAsync(this.silentTokenHelper.bind(this), SilentIframeClientTokenHelper, this.logger, this.performanceClient, this.correlationId)(authClient, request);
      }
    });
  }
  /**
   * Executes EAR flow
   * @param request
   */
  executeEarFlow(request) {
    return __async(this, null, function* () {
      const { correlationId, authority, azureCloudOptions, extraQueryParameters, account } = request;
      const discoveredAuthority = yield invokeAsync(getDiscoveredAuthority, StandardInteractionClientGetDiscoveredAuthority, this.logger, this.performanceClient, correlationId)(this.config, this.correlationId, this.performanceClient, this.browserStorage, this.logger, authority, azureCloudOptions, extraQueryParameters, account);
      const earJwk = yield invokeAsync(generateEarKey, GenerateEarKey, this.logger, this.performanceClient, correlationId)();
      const pkceCodes = yield invokeAsync(generatePkceCodes, GeneratePkceCodes, this.logger, this.performanceClient, correlationId)(this.performanceClient, this.logger, correlationId);
      const silentRequest = __spreadProps(__spreadValues({}, request), {
        earJwk,
        codeChallenge: pkceCodes.challenge
      });
      const iframe = createHiddenIframe();
      const responseType = this.config.auth.OIDCOptions.responseMode;
      let responseString;
      try {
        const responsePromise = invokeAsync(this.waitForIframeResponse.bind(this), SilentHandlerMonitorIframeForHash, this.logger, this.performanceClient, correlationId)(iframe, request);
        responsePromise.catch(() => {
        });
        yield invokeAsync(initiateEarRequest, SilentHandlerInitiateAuthRequest, this.logger, this.performanceClient, correlationId)(iframe, this.config, discoveredAuthority, silentRequest, this.logger, this.performanceClient);
        responseString = yield responsePromise;
      } finally {
        invoke(removeHiddenIframe, RemoveHiddenIframe, this.logger, this.performanceClient, correlationId)(iframe);
      }
      const serverParams = invoke(deserializeResponse, DeserializeResponse, this.logger, this.performanceClient, correlationId)(responseString, responseType, this.logger, this.correlationId);
      if (!serverParams.ear_jwe && serverParams.code) {
        const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, correlationId)({
          serverTelemetryManager: initializeServerTelemetryManager(this.apiId, this.config.auth.clientId, correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled),
          requestAuthority: request.authority,
          requestAzureCloudOptions: request.azureCloudOptions,
          requestExtraQueryParameters: request.extraQueryParameters,
          account: request.account,
          authority: discoveredAuthority
        });
        return invokeAsync(handleResponseCode, HandleResponseCode, this.logger, this.performanceClient, correlationId)(silentRequest, serverParams, pkceCodes.verifier, this.apiId, this.config, authClient, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
      } else {
        return invokeAsync(handleResponseEAR, HandleResponseEar, this.logger, this.performanceClient, correlationId)(silentRequest, serverParams, this.apiId, this.config, discoveredAuthority, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
      }
    });
  }
  /**
   * Verifies SSO capability by making an iframe request to /authorize without exchanging the code for tokens.
   * This is useful for verifying SSO capability in the background without the overhead of a full token exchange.
   * @param request - The SSO silent request
   * @returns true if SSO verification was successful with a valid authorization code, false otherwise
   */
  verifySso(request) {
    return __async(this, null, function* () {
      const inputRequest = __spreadValues({}, request);
      if (!inputRequest.prompt) {
        inputRequest.prompt = Constants_exports.PromptValue.NONE;
      }
      const silentRequest = yield invokeAsync(initializeAuthorizationRequest, StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, this.correlationId)(inputRequest, InteractionType.Silent, this.config, this.browserCrypto, this.browserStorage, this.logger, this.performanceClient, this.correlationId);
      const authClient = yield invokeAsync(this.createAuthCodeClient.bind(this), StandardInteractionClientCreateAuthCodeClient, this.logger, this.performanceClient, this.correlationId)({
        serverTelemetryManager: initializeServerTelemetryManager(this.apiId, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled),
        requestAuthority: silentRequest.authority,
        requestAzureCloudOptions: silentRequest.azureCloudOptions,
        requestExtraQueryParameters: silentRequest.extraQueryParameters,
        account: silentRequest.account
      });
      const { serverParams } = yield this.silentAuthorizeHelper(authClient, silentRequest);
      const correlationId = silentRequest.correlationId;
      Authorize_exports.validateAuthorizationResponse(serverParams, silentRequest.state, correlationId);
      if (!serverParams.code) {
        this.logger.warning("0y34ti", correlationId);
        return false;
      }
      this.logger.verbose("0kkkcj", correlationId);
      return true;
    });
  }
  /**
   * Currently Unsupported
   */
  logout() {
    return Promise.reject(createBrowserAuthError(silentLogoutUnsupported, ""));
  }
  /**
   * Helper which acquires an authorization code silently using a hidden iframe from given url
   * using the scopes requested as part of the id, and exchanges the code for a set of OAuth tokens.
   * @param navigateUrl
   * @param userRequestScopes
   */
  silentTokenHelper(authClient, request) {
    return __async(this, null, function* () {
      const { serverParams, pkceCodes, silentRequest } = yield this.silentAuthorizeHelper(authClient, request);
      return invokeAsync(handleResponseCode, HandleResponseCode, this.logger, this.performanceClient, request.correlationId)(silentRequest, serverParams, pkceCodes.verifier, this.apiId, this.config, authClient, this.browserStorage, this.nativeStorage, this.eventHandler, this.logger, this.performanceClient, this.platformAuthProvider);
    });
  }
  /**
   * Shared helper that generates PKCE codes, builds the /authorize URL,
   * loads it in a hidden iframe, waits for the redirect-bridge response,
   * and returns the deserialized server parameters along with the PKCE codes
   * and the request that was sent.
   */
  silentAuthorizeHelper(authClient, request) {
    return __async(this, null, function* () {
      const correlationId = request.correlationId;
      const pkceCodes = yield invokeAsync(generatePkceCodes, GeneratePkceCodes, this.logger, this.performanceClient, correlationId)(this.performanceClient, this.logger, correlationId);
      const tokenBindingParams = yield getTokenBindingRequestParams(request, this.tokenBindingKeyManager, this.logger, this.performanceClient);
      const silentRequest = __spreadValues(__spreadProps(__spreadValues({}, request), {
        codeChallenge: pkceCodes.challenge
      }), tokenBindingParams);
      const iframe = createHiddenIframe();
      const responseType = this.config.auth.OIDCOptions.responseMode;
      let responseString;
      try {
        const responsePromise = invokeAsync(this.waitForIframeResponse.bind(this), SilentHandlerMonitorIframeForHash, this.logger, this.performanceClient, correlationId)(iframe, request);
        responsePromise.catch(() => {
        });
        if (request.httpMethod === Constants_exports.HttpMethod.POST) {
          yield invokeAsync(initiateCodeFlowWithPost, SilentHandlerInitiateAuthRequest, this.logger, this.performanceClient, correlationId)(iframe, this.config, authClient.authority, silentRequest, this.logger, this.performanceClient);
        } else {
          const navigateUrl = yield invokeAsync(getAuthCodeRequestUrl, PerformanceEvents_exports.GetAuthCodeUrl, this.logger, this.performanceClient, correlationId)(this.config, authClient.authority, silentRequest, this.logger, this.performanceClient);
          yield invokeAsync(initiateCodeRequest, SilentHandlerInitiateAuthRequest, this.logger, this.performanceClient, correlationId)(iframe, navigateUrl, this.logger, correlationId);
        }
        responseString = yield responsePromise;
      } finally {
        invoke(removeHiddenIframe, RemoveHiddenIframe, this.logger, this.performanceClient, correlationId)(iframe);
      }
      const serverParams = invoke(deserializeResponse, DeserializeResponse, this.logger, this.performanceClient, correlationId)(responseString, responseType, this.logger, this.correlationId);
      return { serverParams, pkceCodes, silentRequest };
    });
  }
  waitForIframeResponse(iframe, request) {
    return __async(this, null, function* () {
      if (this.waitForIframeResponseHook) {
        return this.waitForIframeResponseHook(iframe, request);
      }
      return waitForBridgeResponse(this.config.system.iframeBridgeTimeout, this.logger, request, this.performanceClient, this.config.experimental);
    });
  }
};

// node_modules/@azure/msal-browser/dist/interaction_client/SilentRefreshClient.mjs
var SilentRefreshClient = class extends StandardInteractionClient {
  /**
   * Exchanges the refresh token for new tokens
   * @param request
   */
  acquireToken(request) {
    return __async(this, null, function* () {
      const baseRequest = yield invokeAsync(initializeBaseRequest, InitializeBaseRequest, this.logger, this.performanceClient, request.correlationId)(request, this.config, this.performanceClient, this.logger, this.correlationId);
      const tokenBindingParams = yield getTokenBindingRequestParams(baseRequest, this.tokenBindingKeyManager, this.logger, this.performanceClient);
      const silentRequest = __spreadValues(__spreadValues(__spreadValues({}, request), baseRequest), tokenBindingParams);
      if (request.redirectUri) {
        silentRequest.redirectUri = getRedirectUri(request.redirectUri, this.config.auth.redirectUri, this.logger, this.correlationId);
      }
      const serverTelemetryManager = initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      const refreshTokenClient = yield this.createRefreshTokenClient({
        serverTelemetryManager,
        authorityUrl: silentRequest.authority,
        azureCloudOptions: silentRequest.azureCloudOptions,
        account: silentRequest.account
      });
      return invokeAsync(refreshTokenClient.acquireTokenByRefreshToken.bind(refreshTokenClient), RefreshTokenClientAcquireTokenByRefreshToken, this.logger, this.performanceClient, request.correlationId)(silentRequest, ApiId.acquireTokenSilent_silentFlow).catch((e) => {
        e.correlationId = this.correlationId;
        serverTelemetryManager.cacheFailedRequest(e);
        throw e;
      });
    });
  }
  /**
   * Currently Unsupported
   */
  logout() {
    return Promise.reject(createBrowserAuthError(silentLogoutUnsupported, ""));
  }
  /**
   * Creates a Refresh Client with the given authority, or the default authority.
   * @param params {
   *         serverTelemetryManager: ServerTelemetryManager;
   *         authorityUrl?: string;
   *         azureCloudOptions?: AzureCloudOptions;
   *         extraQueryParams?: StringDict;
   *         account?: AccountInfo;
   *        }
   */
  createRefreshTokenClient(params) {
    return __async(this, null, function* () {
      const clientConfig = yield invokeAsync(this.getClientConfiguration.bind(this), StandardInteractionClientGetClientConfiguration, this.logger, this.performanceClient, this.correlationId)({
        serverTelemetryManager: params.serverTelemetryManager,
        requestAuthority: params.authorityUrl,
        requestAzureCloudOptions: params.azureCloudOptions,
        requestExtraQueryParameters: params.extraQueryParameters,
        account: params.account
      });
      return new RefreshTokenClient(clientConfig, this.performanceClient);
    });
  }
};

// node_modules/@azure/msal-browser/dist/interaction_client/HybridSpaAuthorizationCodeClient.mjs
var HybridSpaAuthorizationCodeClient = class extends AuthorizationCodeClient {
  constructor(config, performanceClient) {
    super(config, performanceClient);
    this.includeRedirectUri = false;
  }
};

// node_modules/@azure/msal-browser/dist/interaction_client/SilentAuthCodeClient.mjs
var SilentAuthCodeClient = class extends StandardInteractionClient {
  constructor(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, apiId, performanceClient, correlationId, platformAuthProvider, tokenBindingKeyManager) {
    super(config, storageImpl, browserCrypto, logger, eventHandler, navigationClient, performanceClient, correlationId, platformAuthProvider, tokenBindingKeyManager);
    this.apiId = apiId;
  }
  /**
   * Acquires a token silently by redeeming an authorization code against the /token endpoint
   * @param request
   */
  acquireToken(request) {
    return __async(this, null, function* () {
      if (!request.code) {
        throw createBrowserAuthError(authCodeRequired, this.correlationId);
      }
      const silentRequest = yield invokeAsync(initializeAuthorizationRequest, StandardInteractionClientInitializeAuthorizationRequest, this.logger, this.performanceClient, this.correlationId)(
        request,
        InteractionType.Silent,
        this.config,
        this.browserCrypto,
        this.browserStorage,
        this.logger,
        this.performanceClient,
        /*
         * correlationId is optional in request payload, while this.correlationId is always instantiated as request.correlationId || createGuid().
         * Each auth request creates a new instance of *Client so we can safely use this.correlationId.
         */
        this.correlationId
      );
      const serverTelemetryManager = initializeServerTelemetryManager(this.apiId, this.config.auth.clientId, this.correlationId, this.browserStorage, this.logger, void 0, this.config.system.serverTelemetryEnabled);
      try {
        const tokenBindingParams = yield getTokenBindingRequestParams(silentRequest, this.tokenBindingKeyManager, this.logger, this.performanceClient);
        const authCodeRequest = __spreadValues(__spreadProps(__spreadValues({}, silentRequest), {
          code: request.code
        }), tokenBindingParams);
        const clientConfig = yield invokeAsync(this.getClientConfiguration.bind(this), StandardInteractionClientGetClientConfiguration, this.logger, this.performanceClient, this.correlationId)({
          serverTelemetryManager,
          requestAuthority: silentRequest.authority,
          requestAzureCloudOptions: silentRequest.azureCloudOptions,
          requestExtraQueryParameters: silentRequest.extraQueryParameters,
          account: silentRequest.account
        });
        const authClient = new HybridSpaAuthorizationCodeClient(clientConfig, this.performanceClient);
        this.logger.verbose("1uic5e", this.correlationId);
        const interactionHandler = new InteractionHandler(authClient, this.browserStorage, authCodeRequest, this.logger, this.performanceClient);
        return yield invokeAsync(interactionHandler.handleCodeResponseFromServer.bind(interactionHandler), PerformanceEvents_exports.HandleCodeResponseFromServer, this.logger, this.performanceClient, this.correlationId)({
          code: request.code,
          msgraph_host: request.msGraphHost,
          cloud_graph_host_name: request.cloudGraphHostName,
          cloud_instance_host_name: request.cloudInstanceHostName
        }, silentRequest, this.apiId, false);
      } catch (e) {
        if (e instanceof AuthError) {
          e.correlationId = this.correlationId;
          serverTelemetryManager.cacheFailedRequest(e);
        }
        throw e;
      }
    });
  }
  /**
   * Currently Unsupported
   */
  logout() {
    return Promise.reject(createBrowserAuthError(silentLogoutUnsupported, ""));
  }
};

// node_modules/@azure/msal-browser/dist/utils/MsalFrameStatsUtils.mjs
function getNetworkInfo() {
  if (typeof window === "undefined" || !window.navigator) {
    return {};
  }
  const connection = "connection" in window.navigator ? window.navigator.connection : void 0;
  return {
    effectiveType: connection?.effectiveType,
    rtt: connection?.rtt
  };
}
function collectInstanceStats(currentClientId, performanceEvent, logger, correlationId) {
  const frameInstances = (
    // @ts-ignore
    window.msal?.clientIds || []
  );
  const msalInstanceCount = frameInstances.length;
  const sameClientIdInstanceCount = frameInstances.filter((i) => i === currentClientId).length;
  if (sameClientIdInstanceCount > 1) {
    logger.warning("1e88vg", correlationId);
  }
  performanceEvent.add({
    msalInstanceCount,
    sameClientIdInstanceCount
  });
}

// node_modules/@azure/msal-browser/dist/request/SilentRequestHelpers.mjs
function resolveSilentRequestPreparation(input, platformAuthProvider, logger, performanceClient) {
  const { request, account, correlationId, config } = input;
  const prepareRequest = account.nativeAccountId && isPlatformAuthAllowed(config, logger, correlationId, platformAuthProvider, request.authenticationScheme, performanceClient) ? preparePlatformSilentRequest : prepareWebSilentRequest;
  return prepareRequest(input);
}
function prepareWebSilentRequest({ request, account, correlationId, config }) {
  const thumbprint = getRequestThumbprint(config.auth.clientId, __spreadProps(__spreadValues({}, request), {
    authority: request.authority || config.auth.authority,
    correlationId
  }), account.homeAccountId);
  return {
    key: JSON.stringify(thumbprint),
    request,
    account
  };
}
function preparePlatformSilentRequest({ request, account, config }) {
  const platformRequest = snapshotPlatformSilentRequest(__spreadProps(__spreadValues({}, request), {
    account
  }));
  return {
    key: `platform:${getPlatformSilentRequestKey(platformRequest, config)}`,
    request: platformRequest,
    account: platformRequest.account
  };
}
function getPlatformSilentRequestKey(request, config) {
  const thumbprint = getRequestThumbprint(config.auth.clientId, __spreadProps(__spreadValues({}, request), {
    authority: request.authority || config.auth.authority,
    correlationId: request.correlationId || "",
    scopes: new ScopeSet([...request.scopes || [], ...Constants_exports.OIDC_DEFAULT_SCOPES], request.correlationId || "").asArray().sort()
  }), request.account.homeAccountId);
  return JSON.stringify(__spreadProps(__spreadValues({}, thumbprint), {
    accountId: request.account.nativeAccountId,
    accountTenantId: request.account.tenantId,
    accountEnvironment: request.account.environment,
    azureCloudInstance: request.azureCloudOptions?.azureCloudInstance,
    cloudTenantId: request.azureCloudOptions?.tenant,
    redirectUri: request.redirectUri || config.auth.redirectUri,
    nonce: request.nonce,
    prompt: request.prompt,
    state: request.state,
    loginHint: request.loginHint,
    popKid: request.popKid,
    shrNonce: request.shrNonce,
    dpopNonce: request.dpopNonce,
    skipBrokerClaims: request.embeddedClientId ? !!request.skipBrokerClaims : void 0,
    extraParameters: canonicalizeStringDict(request.extraParameters),
    extraQueryParameters: canonicalizeStringDict(request.extraQueryParameters),
    extraParametersNoCache: canonicalizeStringDict(request.extraParametersNoCache),
    forceRefresh: !!request.forceRefresh,
    cacheLookupPolicy: request.cacheLookupPolicy ?? CacheLookupPolicy.Default
  }));
}
function snapshotPlatformSilentRequest(request) {
  return __spreadProps(__spreadValues({}, request), {
    scopes: [...request.scopes || []],
    account: __spreadValues({}, request.account),
    azureCloudOptions: request.azureCloudOptions ? __spreadValues({}, request.azureCloudOptions) : void 0,
    extraParameters: request.extraParameters ? __spreadValues({}, request.extraParameters) : void 0,
    extraQueryParameters: request.extraQueryParameters ? __spreadValues({}, request.extraQueryParameters) : void 0,
    extraParametersNoCache: request.extraParametersNoCache ? __spreadValues({}, request.extraParametersNoCache) : void 0,
    attributeTokens: request.attributeTokens ? [...request.attributeTokens] : void 0,
    storeInCache: request.storeInCache ? __spreadValues({}, request.storeInCache) : void 0
  });
}
function canonicalizeStringDict(values = {}) {
  return Object.keys(values).sort().map((key) => [key, values[key]]);
}

// node_modules/@azure/msal-browser/dist/controllers/StandardController.mjs
function preflightCheck2(initialized, performanceEvent, config, request) {
  try {
    preflightCheck(initialized);
    enforceResourceParameter(config.auth.isMcp, request);
  } catch (e) {
    performanceEvent.end({ success: false }, e, request.account);
    throw e;
  }
}
var StandardController = class _StandardController {
  /**
   * @constructor
   * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
   *
   * Important attributes in the Configuration object for auth are:
   * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
   * - authority: the authority URL for your application.
   * - redirect_uri: the uri of your application registered in the portal.
   *
   * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
   * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
   * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
   * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
   * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
   * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
   *
   * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
   * Full B2C functionality will be available in this library in future versions.
   *
   * @param configuration Object for the MSAL PublicClientApplication instance
   */
  constructor(operatingContext) {
    this.operatingContext = operatingContext;
    this.isBrowserEnvironment = this.operatingContext.isBrowserEnvironment();
    this.config = operatingContext.getConfig();
    this.initialized = false;
    this.logger = this.operatingContext.getLogger();
    this.networkClient = this.config.system.networkClient;
    this.navigationClient = this.config.system.navigationClient;
    this.redirectResponse = /* @__PURE__ */ new Map();
    this.hybridAuthCodeResponses = /* @__PURE__ */ new Map();
    this.performanceClient = this.config.telemetry.client;
    this.performanceClient.addGlobalFields({
      allowPlatformBroker: this.config.system.allowPlatformBroker
    });
    if (this.isBrowserEnvironment) {
      this.browserCrypto = new CryptoOps(this.logger, this.performanceClient);
      this.tokenBindingKeyManager = new TokenBindingKeyManager(this.logger, this.performanceClient);
    } else {
      this.browserCrypto = DEFAULT_CRYPTO_IMPLEMENTATION;
      this.tokenBindingKeyManager = DEFAULT_TOKEN_BINDING_KEY_MANAGER;
    }
    this.eventHandler = new EventHandler(this.logger);
    this.browserStorage = this.isBrowserEnvironment ? new BrowserCacheManager(this.config.auth.clientId, this.config.cache, this.browserCrypto, this.logger, this.performanceClient, this.eventHandler, buildStaticAuthorityOptions(this.config.auth), this.tokenBindingKeyManager) : DEFAULT_BROWSER_CACHE_MANAGER(this.config.auth.clientId, this.logger, this.performanceClient, this.eventHandler, void 0, this.tokenBindingKeyManager);
    const nativeCacheOptions = {
      cacheLocation: BrowserCacheLocation.MemoryStorage,
      cacheRetentionDays: 5
    };
    this.nativeInternalStorage = new BrowserCacheManager(this.config.auth.clientId, nativeCacheOptions, this.browserCrypto, this.logger, this.performanceClient, this.eventHandler, void 0, this.tokenBindingKeyManager);
    this.activeSilentTokenRequests = /* @__PURE__ */ new Map();
    this.trackStateChange = this.trackStateChange.bind(this);
    this.trackStateChangeWithMeasurement = this.trackStateChangeWithMeasurement.bind(this);
  }
  static createController(operatingContext, request) {
    return __async(this, null, function* () {
      const controller = new _StandardController(operatingContext);
      yield controller.initialize(request);
      return controller;
    });
  }
  trackStateChange(correlationId, event) {
    if (!correlationId) {
      return;
    }
    if (event.type === "visibilitychange") {
      this.logger.info("16v6hv", correlationId);
      this.performanceClient.incrementFields({ visibilityChangeCount: 1 }, correlationId);
    } else if (event.type === "online") {
      this.logger.info("0zirfd", correlationId);
      this.performanceClient.incrementFields({ onlineStatusChangeCount: 1 }, correlationId);
    } else if (event.type === "offline") {
      this.logger.info("1xk9ef", correlationId);
      this.performanceClient.incrementFields({ onlineStatusChangeCount: 1 }, correlationId);
    }
  }
  /**
   * Initializer function to perform async startup tasks such as connecting to WAM extension
   * @param request {?InitializeApplicationRequest} correlation id
   */
  initialize(request) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(request);
      this.logger.trace("1f7joy", correlationId);
      if (this.initialized) {
        this.logger.info("061m5x", correlationId);
        return;
      }
      if (!this.isBrowserEnvironment) {
        this.logger.info("19fvpi", correlationId);
        this.initialized = true;
        this.eventHandler.emitEvent(EventType.INITIALIZE_END, correlationId);
        return;
      }
      const allowPlatformBroker = this.config.system.allowPlatformBroker;
      const initMeasurement = this.performanceClient.startMeasurement(InitializeClientApplication, correlationId);
      this.eventHandler.emitEvent(EventType.INITIALIZE_START, correlationId);
      this.logMultipleInstances(initMeasurement, correlationId);
      initMeasurement.add({ isMcp: this.config.auth.isMcp });
      yield invokeAsync(this.browserStorage.initialize.bind(this.browserStorage), InitializeCache, this.logger, this.performanceClient, correlationId)(correlationId);
      if (allowPlatformBroker) {
        try {
          this.platformAuthProvider = yield getPlatformAuthProvider(this.logger, this.performanceClient, correlationId, this.config.system.nativeBrokerHandshakeTimeout, this.config.experimental.allowPlatformBrokerWithDOM);
        } catch (e) {
          this.logger.verbose(e, correlationId);
        }
      }
      if (this.config.cache.cacheLocation === BrowserCacheLocation.LocalStorage) {
        this.eventHandler.subscribeCrossTab();
      }
      !this.config.system.navigatePopups && (yield this.preGeneratePkceCodes(correlationId));
      this.initialized = true;
      this.eventHandler.emitEvent(EventType.INITIALIZE_END, correlationId);
      initMeasurement.end({
        allowPlatformBroker,
        success: true
      });
    });
  }
  // #region Redirect Flow
  /**
   * Event handler function which allows users to fire events after the PublicClientApplication object
   * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
   * auth flows.
   * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
   * @param options Object containing optional configuration for redirect promise handling.
   * @returns Token response or null. If the return value is null, then no auth redirect was detected.
   */
  handleRedirectPromise(options) {
    return __async(this, null, function* () {
      this.logger.verbose("02l8bm", "");
      blockAPICallsBeforeInitialize(this.initialized);
      if (this.isBrowserEnvironment) {
        const redirectResponseKey = options?.hash || "";
        let response = this.redirectResponse.get(redirectResponseKey);
        if (typeof response === "undefined") {
          response = this.handleRedirectPromiseInternal(options);
          this.redirectResponse.set(redirectResponseKey, response);
          this.logger.verbose("1wn9kp", "");
        } else {
          this.logger.verbose("0w0gm3", "");
        }
        return response;
      }
      this.logger.verbose("12xi63", "");
      return null;
    });
  }
  /**
   * The internal details of handleRedirectPromise. This is separated out to a helper to allow handleRedirectPromise to memoize requests
   * @param hash
   * @returns
   */
  handleRedirectPromiseInternal(options) {
    return __async(this, null, function* () {
      if (!this.browserStorage.isInteractionInProgress(true)) {
        this.logger.info("0le6uv", "");
        return null;
      }
      const interactionType = this.browserStorage.getInteractionInProgress()?.type;
      if (interactionType === INTERACTION_TYPE.SIGNOUT) {
        this.logger.verbose("1ywcv2", "");
        this.browserStorage.setInteractionInProgress(false);
        return Promise.resolve(null);
      }
      const loggedInAccounts = this.getAllAccounts();
      const platformBrokerRequest = this.browserStorage.getCachedNativeRequest();
      const useNative = platformBrokerRequest && !options?.hash;
      let rootMeasurement;
      let redirectResponse;
      let cachedRedirectRequest;
      try {
        if (useNative && this.platformAuthProvider) {
          const correlationId = platformBrokerRequest?.correlationId || "";
          this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, correlationId, InteractionType.Redirect);
          rootMeasurement = this.performanceClient.startMeasurement(AcquireTokenRedirect, correlationId);
          this.logger.trace("12v7is", correlationId);
          rootMeasurement.add({
            isPlatformBrokerRequest: true
          });
          const nativeClient = new PlatformAuthInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.handleRedirectPromise, this.performanceClient, this.platformAuthProvider, platformBrokerRequest.accountId, this.nativeInternalStorage, platformBrokerRequest.correlationId, this.tokenBindingKeyManager);
          redirectResponse = invokeAsync(nativeClient.handleRedirectPromise.bind(nativeClient), HandleNativeRedirectPromiseMeasurement, this.logger, this.performanceClient, rootMeasurement.event.correlationId)();
        } else {
          const [standardRequest, codeVerifier] = this.browserStorage.getCachedRequest("");
          cachedRedirectRequest = standardRequest;
          const correlationId = standardRequest.correlationId;
          this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_START, correlationId, InteractionType.Redirect);
          rootMeasurement = this.performanceClient.startMeasurement(AcquireTokenRedirect, correlationId);
          this.logger.trace("0znzs5", correlationId);
          const redirectClient = this.createRedirectClient(correlationId);
          redirectResponse = invokeAsync(redirectClient.handleRedirectPromise.bind(redirectClient), HandleRedirectPromiseMeasurement, this.logger, this.performanceClient, rootMeasurement.event.correlationId)(standardRequest, codeVerifier, rootMeasurement, options);
        }
      } catch (e) {
        this.browserStorage.resetRequestCache("");
        throw e;
      }
      return redirectResponse.then((result) => {
        if (result) {
          this.browserStorage.resetRequestCache(result.correlationId);
          this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, result.correlationId, InteractionType.Redirect, result);
          this.logger.verbose("0ui8f5", result.correlationId);
          const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
          if (isLoggingIn) {
            this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, result.correlationId, InteractionType.Redirect, result.account);
            this.logger.verbose("16im3l", result.correlationId);
          }
          rootMeasurement.end({
            success: true,
            isNativeBroker: result.fromPlatformBroker ?? false
          }, void 0, result.account);
          this.verifySsoCapability(cachedRedirectRequest, InteractionType.Redirect);
        } else {
          if (!!rootMeasurement.event.errorCode) {
            rootMeasurement.end({ success: false });
          } else {
            rootMeasurement.discard();
          }
        }
        this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, rootMeasurement.event.correlationId, InteractionType.Redirect);
        return result;
      }).catch((e) => {
        this.browserStorage.resetRequestCache(rootMeasurement.event.correlationId);
        const eventError = e;
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, rootMeasurement.event.correlationId, InteractionType.Redirect, null, eventError);
        this.eventHandler.emitEvent(EventType.HANDLE_REDIRECT_END, rootMeasurement.event.correlationId, InteractionType.Redirect);
        rootMeasurement.end({
          success: false
        }, eventError);
        throw e;
      });
    });
  }
  /**
   * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects
   * the page, so any code that follows this function will not execute.
   *
   * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
   * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
   *
   * @param request
   */
  acquireTokenRedirect(request) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(request);
      this.logger.verbose("0os66p", correlationId);
      redirectPreflightCheck(this.initialized, this.config);
      this.browserStorage.setInteractionInProgress(true, INTERACTION_TYPE.SIGNIN);
      const atrMeasurement = this.performanceClient.startMeasurement(AcquireTokenPreRedirect, correlationId);
      atrMeasurement.add({
        scenarioId: request.scenarioId
      });
      const configOnRedirectNavigateCb = this.config.auth.onRedirectNavigate;
      this.config.auth.onRedirectNavigate = (url) => {
        const navigate = typeof configOnRedirectNavigateCb === "function" ? configOnRedirectNavigateCb(url) : void 0;
        atrMeasurement.add({
          navigateCallbackResult: navigate !== false
        });
        atrMeasurement.event = atrMeasurement.end({ success: true }, void 0, request.account) || atrMeasurement.event;
        return navigate;
      };
      try {
        enforceResourceParameter(this.config.auth.isMcp, request);
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, correlationId, InteractionType.Redirect, request);
        let result;
        const platformAuthProvider = this.platformAuthProvider;
        if (this.canUsePlatformBroker(request) && platformAuthProvider) {
          const nativeClient = new PlatformAuthInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.acquireTokenRedirect, this.performanceClient, platformAuthProvider, this.getNativeAccountId(request), this.nativeInternalStorage, correlationId, this.tokenBindingKeyManager);
          result = invokeAsync(nativeClient.acquireTokenRedirect.bind(nativeClient), NativeInteractionClientAcquireTokenRedirect, this.logger, this.performanceClient, correlationId)(request, atrMeasurement).catch((e) => {
            if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
              this.platformAuthProvider = void 0;
              const redirectClient = this.createRedirectClient(correlationId);
              return redirectClient.acquireToken(request);
            } else if (e instanceof InteractionRequiredAuthError) {
              this.logger.verbose("1ipyz4", correlationId);
              const redirectClient = this.createRedirectClient(correlationId);
              return redirectClient.acquireToken(request);
            }
            throw e;
          });
        } else {
          const redirectClient = this.createRedirectClient(correlationId);
          result = redirectClient.acquireToken(request);
        }
        return yield result;
      } catch (e) {
        this.browserStorage.resetRequestCache(correlationId);
        if (atrMeasurement.event.status === 2) {
          this.performanceClient.startMeasurement(AcquireTokenRedirect, correlationId).end({ success: false }, e, request.account);
        } else {
          atrMeasurement.end({ success: false }, e, request.account);
        }
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, correlationId, InteractionType.Redirect, null, e);
        throw e;
      }
    });
  }
  // #endregion
  // #region Popup Flow
  /**
   * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
   *
   * @param request
   *
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  acquireTokenPopup(request) {
    const correlationId = this.getRequestCorrelationId(request);
    const atPopupMeasurement = this.performanceClient.startMeasurement(AcquireTokenPopup, correlationId);
    atPopupMeasurement.add({
      scenarioId: request.scenarioId
    });
    try {
      this.logger.verbose("0ch87b", correlationId);
      preflightCheck2(this.initialized, atPopupMeasurement, this.config, request);
      this.browserStorage.setInteractionInProgress(true, INTERACTION_TYPE.SIGNIN, request.overrideInteractionInProgress, correlationId);
    } catch (e) {
      return Promise.reject(e);
    }
    const loggedInAccounts = this.getAllAccounts();
    this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, correlationId, InteractionType.Popup, request);
    let result;
    const pkce = this.getPreGeneratedPkceCodes(correlationId);
    if (this.canUsePlatformBroker(request)) {
      atPopupMeasurement.add({
        isPlatformBrokerRequest: true
      });
      result = this.acquireTokenNative(__spreadProps(__spreadValues({}, request), {
        correlationId
      }), ApiId.acquireTokenPopup).then((response) => {
        atPopupMeasurement.end({
          success: true,
          isNativeBroker: response.fromPlatformBroker ?? false
        }, void 0, response.account);
        return response;
      }).catch((e) => {
        if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
          this.platformAuthProvider = void 0;
          const popupClient = this.createPopupClient(correlationId);
          return popupClient.acquireToken(request, pkce);
        } else if (e instanceof InteractionRequiredAuthError) {
          this.logger.verbose("0yy5fw", correlationId);
          const popupClient = this.createPopupClient(correlationId);
          return popupClient.acquireToken(request, pkce);
        }
        throw e;
      });
    } else {
      const popupClient = this.createPopupClient(correlationId);
      result = popupClient.acquireToken(request, pkce);
    }
    return result.then((result2) => {
      const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
      this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, correlationId, InteractionType.Popup, result2);
      if (isLoggingIn) {
        this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, correlationId, InteractionType.Popup, result2.account);
      }
      atPopupMeasurement.end({
        success: true,
        isNativeBroker: result2.fromPlatformBroker ?? false,
        accessTokenSize: result2.accessToken.length,
        idTokenSize: result2.idToken.length
      }, void 0, result2.account);
      this.verifySsoCapability(request, InteractionType.Popup);
      return result2;
    }).catch((e) => {
      this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, correlationId, InteractionType.Popup, null, e);
      atPopupMeasurement.end({
        success: false
      }, e, request.account);
      return Promise.reject(e);
    }).finally(() => __async(this, null, function* () {
      this.browserStorage.setInteractionInProgress(false);
      if (!this.config.system.navigatePopups) {
        yield this.preGeneratePkceCodes(correlationId);
      }
    }));
  }
  trackStateChangeWithMeasurement(event) {
    const measurement = this.ssoSilentMeasurement || this.acquireTokenByCodeAsyncMeasurement;
    if (!measurement) {
      return;
    }
    if (event.type === "visibilitychange") {
      this.logger.info(`0yzimq ${measurement.event.name}`, measurement.event.correlationId);
      measurement.increment({
        visibilityChangeCount: 1
      });
    } else if (event.type === "online") {
      this.logger.info(`1caf53 ${measurement.event.name}`, measurement.event.correlationId);
      measurement.increment({
        onlineStatusChangeCount: 1
      });
    } else if (event.type === "offline") {
      this.logger.info(`0fdyk7 ${measurement.event.name}`, measurement.event.correlationId);
      measurement.increment({
        onlineStatusChangeCount: 1
      });
    }
  }
  addStateChangeListeners(listener) {
    document.addEventListener("visibilitychange", listener);
    window.addEventListener("online", listener);
    window.addEventListener("offline", listener);
  }
  removeStateChangeListeners(listener) {
    document.removeEventListener("visibilitychange", listener);
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  }
  /**
   * Reads the cached ssoCapable value from localStorage.
   * @returns The cached ssoCapable boolean value, or undefined if not cached or expired.
   */
  getCachedSsoCapable() {
    try {
      const cachedValue = window.localStorage.getItem(SSO_CAPABLE);
      if (cachedValue) {
        const parsed = JSON.parse(cachedValue);
        if (parsed && typeof parsed.ssoCapable === "boolean" && parsed.expiresOn && Date.now() < parsed.expiresOn) {
          return parsed.ssoCapable;
        }
      }
    } catch (e) {
    }
    return void 0;
  }
  /**
   * SSO capability verification in the background.
   * This method makes an iframe request to /authorize to verify SSO capability without calling /token.
   * This method does not block the caller and tracks telemetry for success/failure.
   * This method only executes if verifySSO is set to true in the auth configuration.
   * The result is cached in localStorage with a 24-hour TTL; the SSO verification call
   * is only attempted when the cached value is absent or expired.
   * @param request - The original request used for the authentication flow
   * @param interactionType - The interactionType of the AT operation for logging purposes
   */
  verifySsoCapability(request, interactionType) {
    if (!this.config.auth.verifySSO) {
      return;
    }
    const ssoCacheKey = SSO_CAPABLE;
    const SSO_CAPABLE_TTL_MS = 24 * 60 * 60 * 1e3;
    const cachedSsoCapable = this.getCachedSsoCapable();
    if (cachedSsoCapable !== void 0) {
      this.logger.verbose(`13poou ${interactionType}`, "");
      return;
    }
    const correlationId = createNewGuid();
    const ssoCapableMeasurement = this.performanceClient.startMeasurement(SsoCapable, correlationId);
    ssoCapableMeasurement.add({
      "ext.interactionType": interactionType
    });
    this.logger.verbose(`0pbr0i ${interactionType}`, correlationId);
    setTimeout(() => {
      const ssoVerificationRequest = __spreadProps(__spreadValues({}, request), {
        correlationId
      });
      const silentIframeClient = this.createSilentIframeClient(correlationId);
      silentIframeClient.verifySso(ssoVerificationRequest).then((result) => {
        this.logger.verbose(`1gd1iv ${interactionType} ${result}`, correlationId);
        try {
          const cacheEntry = JSON.stringify({
            ssoCapable: result,
            expiresOn: Date.now() + SSO_CAPABLE_TTL_MS
          });
          window.localStorage.setItem(ssoCacheKey, cacheEntry);
        } catch (e) {
          this.logger.warning(`18lmoj ${interactionType}`, correlationId);
        }
        ssoCapableMeasurement.end({
          fromCache: false,
          success: result
        }, void 0);
      }).catch((error) => {
        this.logger.warning(`05g83w ${interactionType} ${error.message}`, correlationId);
        try {
          window.localStorage.removeItem(ssoCacheKey);
        } catch (e) {
          this.logger.warning(`0nlf9q ${interactionType}`, correlationId);
        }
        ssoCapableMeasurement.end({
          fromCache: false,
          success: false
        }, error);
      });
    }, 0);
  }
  // #endregion
  // #region Silent Flow
  /**
   * This function uses a hidden iframe to fetch an authorization code from the eSTS. There are cases where this may not work:
   * - Any browser using a form of Intelligent Tracking Prevention
   * - If there is not an established session with the service
   *
   * In these cases, the request must be done inside a popup or full frame redirect.
   *
   * For the cases where interaction is required, you cannot send a request with prompt=none.
   *
   * If your refresh token has expired, you can use this function to fetch a new set of tokens silently as long as
   * you session on the server still exists.
   * @param request {@link SsoSilentRequest}
   *
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  ssoSilent(request) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(request);
      const validRequest = __spreadProps(__spreadValues({}, request), {
        correlationId
      });
      this.ssoSilentMeasurement = this.performanceClient.startMeasurement(SsoSilent, correlationId);
      this.ssoSilentMeasurement?.add({
        scenarioId: request.scenarioId,
        ssoCapable: this.getCachedSsoCapable()
      });
      preflightCheck2(this.initialized, this.ssoSilentMeasurement, this.config, validRequest);
      this.ssoSilentMeasurement?.increment({
        visibilityChangeCount: 0,
        onlineStatusChangeCount: 0
      });
      this.addStateChangeListeners(this.trackStateChangeWithMeasurement);
      const loggedInAccounts = this.getAllAccounts();
      this.logger.verbose("0w1b45", correlationId);
      this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, correlationId, InteractionType.Silent, validRequest);
      let result;
      if (this.canUsePlatformBroker(validRequest)) {
        this.ssoSilentMeasurement?.add({
          isPlatformBrokerRequest: true
        });
        result = this.acquireTokenNative(validRequest, ApiId.ssoSilent).catch((e) => {
          if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
            this.platformAuthProvider = void 0;
            const silentIframeClient = this.createSilentIframeClient(validRequest.correlationId);
            return silentIframeClient.acquireToken(validRequest);
          }
          throw e;
        });
      } else {
        const silentIframeClient = this.createSilentIframeClient(validRequest.correlationId);
        result = silentIframeClient.acquireToken(validRequest);
      }
      return result.then((response) => {
        const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, correlationId, InteractionType.Silent, response);
        if (isLoggingIn) {
          this.eventHandler.emitEvent(EventType.LOGIN_SUCCESS, correlationId, InteractionType.Silent, response.account);
        }
        this.ssoSilentMeasurement?.end({
          success: true,
          isNativeBroker: response.fromPlatformBroker ?? false,
          accessTokenSize: response.accessToken.length,
          idTokenSize: response.idToken.length
        }, void 0, response.account);
        return response;
      }).catch((e) => {
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, correlationId, InteractionType.Silent, null, e);
        this.ssoSilentMeasurement?.end({
          success: false
        }, e, request.account);
        throw e;
      }).finally(() => {
        this.removeStateChangeListeners(this.trackStateChangeWithMeasurement);
      });
    });
  }
  /**
   * This function redeems an authorization code (passed as code) from the eSTS token endpoint.
   * This authorization code should be acquired server-side using a confidential client to acquire a spa_code.
   * This API is not indended for normal authorization code acquisition and redemption.
   *
   * Redemption of this authorization code will not require PKCE, as it was acquired by a confidential client.
   *
   * @param request {@link AuthorizationCodeRequest}
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  acquireTokenByCode(request) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(request);
      this.logger.trace("0ch6ga", correlationId);
      const atbcMeasurement = this.performanceClient.startMeasurement(AcquireTokenByCode, correlationId);
      preflightCheck2(this.initialized, atbcMeasurement, this.config, request);
      this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, correlationId, InteractionType.Silent, request);
      atbcMeasurement.add({ scenarioId: request.scenarioId });
      try {
        if (request.code && request.nativeAccountId) {
          throw createBrowserAuthError(spaCodeAndNativeAccountIdPresent, correlationId);
        } else if (request.code) {
          const hybridAuthCode = request.code;
          let response = this.hybridAuthCodeResponses.get(hybridAuthCode);
          if (!response) {
            this.logger.verbose("06eh73", correlationId);
            response = this.acquireTokenByCodeAsync(__spreadProps(__spreadValues({}, request), {
              correlationId
            })).then((result) => {
              this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, correlationId, InteractionType.Silent, result);
              this.hybridAuthCodeResponses.delete(hybridAuthCode);
              atbcMeasurement.end({
                success: true,
                isNativeBroker: false,
                accessTokenSize: result.accessToken.length,
                idTokenSize: result.idToken.length
              }, void 0, result.account);
              return result;
            }).catch((error) => {
              this.hybridAuthCodeResponses.delete(hybridAuthCode);
              this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, correlationId, InteractionType.Silent, null, error);
              atbcMeasurement.end({
                success: false
              }, error);
              throw error;
            });
            this.hybridAuthCodeResponses.set(hybridAuthCode, response);
          } else {
            this.logger.verbose("0qgp28", correlationId);
            atbcMeasurement.discard();
          }
          return yield response;
        } else if (request.nativeAccountId) {
          if (this.canUsePlatformBroker(request, request.nativeAccountId)) {
            atbcMeasurement.add({
              isPlatformBrokerRequest: true
            });
            const result = yield this.acquireTokenNative(__spreadProps(__spreadValues({}, request), {
              correlationId
            }), ApiId.acquireTokenByCode, request.nativeAccountId).catch((e) => {
              if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
                this.platformAuthProvider = void 0;
              }
              throw e;
            });
            atbcMeasurement.end({
              success: true,
              isNativeBroker: result.fromPlatformBroker ?? false
            }, void 0, result.account);
            return result;
          } else {
            throw createBrowserAuthError(unableToAcquireTokenFromNativePlatform, correlationId);
          }
        } else {
          throw createBrowserAuthError(authCodeOrNativeAccountIdRequired, correlationId);
        }
      } catch (e) {
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, correlationId, InteractionType.Silent, null, e);
        atbcMeasurement.end({
          success: false
        }, e);
        throw e;
      }
    });
  }
  /**
   * Creates a SilentAuthCodeClient to redeem an authorization code.
   * @param request
   * @returns Result of the operation to redeem the authorization code
   */
  acquireTokenByCodeAsync(request) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(request);
      this.logger.trace("10d9hy", correlationId);
      this.acquireTokenByCodeAsyncMeasurement = this.performanceClient.startMeasurement(AcquireTokenByCodeAsync, correlationId);
      this.acquireTokenByCodeAsyncMeasurement?.increment({
        visibilityChangeCount: 0,
        onlineStatusChangeCount: 0
      });
      this.addStateChangeListeners(this.trackStateChangeWithMeasurement);
      const silentAuthCodeClient = this.createSilentAuthCodeClient(correlationId);
      const silentTokenResult = yield silentAuthCodeClient.acquireToken(request).then((response) => {
        this.acquireTokenByCodeAsyncMeasurement?.end({
          success: true,
          isNativeBroker: false,
          fromCache: response.fromCache
        });
        return response;
      }).catch((tokenRenewalError) => {
        this.acquireTokenByCodeAsyncMeasurement?.end({
          success: false
        }, tokenRenewalError);
        throw tokenRenewalError;
      }).finally(() => {
        this.removeStateChangeListeners(this.trackStateChangeWithMeasurement);
      });
      return silentTokenResult;
    });
  }
  /**
   * Attempt to acquire an access token from the cache
   * @param silentCacheClient SilentCacheClient
   * @param commonRequest CommonSilentFlowRequest
   * @param silentRequest SilentRequest
   * @returns A promise that, when resolved, returns the access token
   */
  acquireTokenFromCache(commonRequest, cacheLookupPolicy) {
    return __async(this, null, function* () {
      switch (cacheLookupPolicy) {
        case CacheLookupPolicy.Default:
        case CacheLookupPolicy.AccessToken:
        case CacheLookupPolicy.AccessTokenAndRefreshToken:
          const silentCacheClient = this.createSilentCacheClient(commonRequest.correlationId);
          return invokeAsync(silentCacheClient.acquireToken.bind(silentCacheClient), SilentCacheClientAcquireToken, this.logger, this.performanceClient, commonRequest.correlationId)(commonRequest);
        default:
          throw createClientAuthError(ClientAuthErrorCodes_exports.tokenRefreshRequired, commonRequest.correlationId);
      }
    });
  }
  /**
   * Attempt to acquire an access token via a refresh token
   * @param commonRequest CommonSilentFlowRequest
   * @param cacheLookupPolicy CacheLookupPolicy
   * @returns A promise that, when resolved, returns the access token
   */
  acquireTokenByRefreshToken(commonRequest, cacheLookupPolicy) {
    return __async(this, null, function* () {
      switch (cacheLookupPolicy) {
        case CacheLookupPolicy.Default:
        case CacheLookupPolicy.AccessTokenAndRefreshToken:
        case CacheLookupPolicy.RefreshToken:
        case CacheLookupPolicy.RefreshTokenAndNetwork:
          const silentRefreshClient = this.createSilentRefreshClient(commonRequest.correlationId);
          return invokeAsync(silentRefreshClient.acquireToken.bind(silentRefreshClient), SilentRefreshClientAcquireToken, this.logger, this.performanceClient, commonRequest.correlationId)(commonRequest);
        default:
          throw createClientAuthError(ClientAuthErrorCodes_exports.tokenRefreshRequired, commonRequest.correlationId);
      }
    });
  }
  /**
   * Attempt to acquire an access token via an iframe
   * @param request CommonSilentFlowRequest
   * @returns A promise that, when resolved, returns the access token
   */
  acquireTokenBySilentIframe(request) {
    return __async(this, null, function* () {
      const silentIframeClient = this.createSilentIframeClient(request.correlationId);
      return invokeAsync(silentIframeClient.acquireToken.bind(silentIframeClient), SilentIframeClientAcquireToken, this.logger, this.performanceClient, request.correlationId)(request);
    });
  }
  // #endregion
  // #region Logout
  /**
   * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
   * Default behaviour is to redirect the user to `window.location.href`.
   * @param logoutRequest
   */
  logoutRedirect(logoutRequest) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(logoutRequest);
      redirectPreflightCheck(this.initialized, this.config);
      this.browserStorage.setInteractionInProgress(true, INTERACTION_TYPE.SIGNOUT);
      const redirectClient = this.createRedirectClient(correlationId);
      return redirectClient.logout(logoutRequest);
    });
  }
  /**
   * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
   * @param logoutRequest
   */
  logoutPopup(logoutRequest) {
    try {
      const correlationId = this.getRequestCorrelationId(logoutRequest);
      preflightCheck(this.initialized);
      this.browserStorage.setInteractionInProgress(true, INTERACTION_TYPE.SIGNOUT);
      const popupClient = this.createPopupClient(correlationId);
      return popupClient.logout(logoutRequest).finally(() => {
        this.browserStorage.setInteractionInProgress(false);
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Creates a cache interaction client to clear broswer cache.
   * @param logoutRequest
   */
  clearCache(logoutRequest) {
    return __async(this, null, function* () {
      if (!this.isBrowserEnvironment) {
        return;
      }
      const correlationId = this.getRequestCorrelationId(logoutRequest);
      const cacheClient = this.createSilentCacheClient(correlationId);
      return cacheClient.logout(logoutRequest);
    });
  }
  // #endregion
  // #region Account APIs
  /**
   * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
   * @param accountFilter - (Optional) filter to narrow down the accounts returned
   * @returns Array of AccountInfo objects in cache
   */
  getAllAccounts(accountFilter) {
    return getAllAccounts(this.logger, this.browserStorage, this.isBrowserEnvironment, this.getRequestCorrelationId(), accountFilter);
  }
  /**
   * Returns the first account found in the cache that matches the account filter passed in.
   * @param accountFilter
   * @returns The first account found in the cache matching the provided filter or null if no account could be found.
   */
  getAccount(accountFilter) {
    return getAccount(accountFilter, this.logger, this.browserStorage, this.getRequestCorrelationId());
  }
  /**
   * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
   * @param account
   */
  setActiveAccount(account) {
    setActiveAccount(account, this.browserStorage, this.getRequestCorrelationId());
  }
  /**
   * Gets the currently active account
   */
  getActiveAccount() {
    return getActiveAccount(this.browserStorage, this.getRequestCorrelationId());
  }
  // #endregion
  /**
   * Hydrates the cache with the tokens from an AuthenticationResult
   * @param result
   * @param request
   * @returns
   */
  hydrateCache(result, request) {
    return __async(this, null, function* () {
      this.logger.verbose("16jycr", result.correlationId);
      const accountEntity = AccountEntityUtils_exports.createAccountEntityFromAccountInfo(result.account, result.cloudGraphHostName, result.msGraphHost);
      yield this.browserStorage.setAccount(accountEntity, result.correlationId, AuthToken_exports.isKmsi(result.idTokenClaims), ApiId.hydrateCache);
      if (result.fromPlatformBroker) {
        this.logger.verbose("1i5atf", result.correlationId);
        const idTokenEntity = CacheHelpers_exports.createIdTokenEntity(result.account.homeAccountId, result.account.environment, result.idToken, this.config.auth.clientId, result.tenantId);
        const attributeTokenPartition = CacheHelpers_exports.serializeAttributeTokens(request.attributeTokens);
        const additionalCacheKeyComponents = attributeTokenPartition ? {
          attribute_tokens: attributeTokenPartition
        } : void 0;
        const accessTokenEntity = CacheHelpers_exports.createAccessTokenEntity(
          result.account.homeAccountId,
          result.account.environment,
          result.accessToken,
          this.config.auth.clientId,
          result.tenantId,
          result.scopes.join(" "),
          result.expiresOn ? TimeUtils_exports.toSecondsFromDate(result.expiresOn) : 0,
          result.extExpiresOn ? TimeUtils_exports.toSecondsFromDate(result.extExpiresOn) : 0,
          base64Decode,
          request.correlationId || "",
          void 0,
          // refreshOn
          result.tokenType,
          void 0,
          // userAssertionHash
          request.sshKid,
          additionalCacheKeyComponents
        );
        if (request.resource) {
          accessTokenEntity.resource = request.resource;
        }
        const components = additionalCacheKeyComponents;
        const additionalCacheKeyHash = components ? yield this.browserCrypto.hashString(JSON.stringify(components)) : void 0;
        const kmsi = AuthToken_exports.isKmsi(result.idTokenClaims);
        yield this.browserStorage.setIdTokenCredential(idTokenEntity, result.correlationId, kmsi);
        yield this.nativeInternalStorage.setAccessTokenCredential(accessTokenEntity, result.correlationId, kmsi, additionalCacheKeyHash);
      } else {
        return this.browserStorage.hydrateCache(result, request);
      }
    });
  }
  // #region Helpers
  /**
   * Acquire a token from native device (e.g. WAM)
   * @param request
   * @param apiId
   * @param accountId
   * @param cacheLookupPolicy
   */
  acquireTokenNative(request, apiId, accountId, cacheLookupPolicy) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(request);
      this.logger.trace("0b9y3p", correlationId);
      if (!this.platformAuthProvider) {
        throw createBrowserAuthError(nativeConnectionNotEstablished, correlationId);
      }
      const nativeClient = new PlatformAuthInteractionClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, apiId, this.performanceClient, this.platformAuthProvider, accountId || this.getNativeAccountId(request), this.nativeInternalStorage, correlationId, this.tokenBindingKeyManager);
      return invokeAsync(nativeClient.acquireToken.bind(nativeClient), NativeInteractionClientAcquireToken, this.logger, this.performanceClient, correlationId)(request, cacheLookupPolicy);
    });
  }
  /**
   * Returns boolean indicating if this request can use the platform broker
   * @param request
   */
  canUsePlatformBroker(request, accountId) {
    const correlationId = this.getRequestCorrelationId(request);
    this.logger.trace("1n9lbl", correlationId);
    const platformAuthAllowed = isPlatformAuthAllowed(this.config, this.logger, correlationId, this.platformAuthProvider, request.authenticationScheme, this.performanceClient);
    if (!platformAuthAllowed) {
      this.logger.trace("0yoy1g", correlationId);
      return false;
    }
    if (request.prompt) {
      switch (request.prompt) {
        case Constants_exports.PromptValue.NONE:
        case Constants_exports.PromptValue.CONSENT:
        case Constants_exports.PromptValue.LOGIN:
          this.logger.trace("0vdv8e", correlationId);
          break;
        default:
          this.logger.trace(`0pdzw6 ${request.prompt}`, correlationId);
          return false;
      }
    }
    if (!accountId && !this.getNativeAccountId(request)) {
      this.logger.trace("16lbtk", correlationId);
      return false;
    }
    return true;
  }
  /**
   * Get the native accountId from the account
   * @param request
   * @returns
   */
  getNativeAccountId(request) {
    const account = request.account || this.getAccount({
      loginHint: request.loginHint,
      sid: request.sid
    }) || (!request.loginHint && !request.sid ? this.getActiveAccount() : null);
    return account && account.nativeAccountId || "";
  }
  /**
   * Returns new instance of the Popup Interaction Client
   * @param correlationId
   */
  createPopupClient(correlationId) {
    return new PopupClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.performanceClient, this.nativeInternalStorage, correlationId, this.platformAuthProvider, this.operatingContext.getResponseHandlers()?.waitForPopupResponse, this.tokenBindingKeyManager);
  }
  /**
   * Returns new instance of the Redirect Interaction Client
   * @param correlationId
   */
  createRedirectClient(correlationId) {
    return new RedirectClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.performanceClient, this.nativeInternalStorage, correlationId, this.platformAuthProvider, this.tokenBindingKeyManager);
  }
  /**
   * Returns new instance of the Silent Iframe Interaction Client
   * @param correlationId
   */
  createSilentIframeClient(correlationId) {
    return new SilentIframeClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.ssoSilent, this.performanceClient, this.nativeInternalStorage, correlationId, this.platformAuthProvider, this.operatingContext.getResponseHandlers()?.waitForIframeResponse, this.tokenBindingKeyManager);
  }
  /**
   * Returns new instance of the Silent Cache Interaction Client
   */
  createSilentCacheClient(correlationId) {
    return new SilentCacheClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.performanceClient, correlationId, this.platformAuthProvider, this.tokenBindingKeyManager);
  }
  /**
   * Returns new instance of the Silent Refresh Interaction Client
   */
  createSilentRefreshClient(correlationId) {
    return new SilentRefreshClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, this.performanceClient, correlationId, this.platformAuthProvider, this.tokenBindingKeyManager);
  }
  /**
   * Returns new instance of the Silent AuthCode Interaction Client
   */
  createSilentAuthCodeClient(correlationId) {
    return new SilentAuthCodeClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient, ApiId.acquireTokenByCode, this.performanceClient, correlationId, this.platformAuthProvider, this.tokenBindingKeyManager);
  }
  /**
   * Adds event callbacks to array
   * @param callback
   */
  addEventCallback(callback, eventTypes) {
    return this.eventHandler.addEventCallback(callback, eventTypes);
  }
  /**
   * Removes callback with provided id from callback array
   * @param callbackId
   */
  removeEventCallback(callbackId) {
    this.eventHandler.removeEventCallback(callbackId);
  }
  /**
   * Registers a callback to receive performance events.
   *
   * @param {PerformanceCallbackFunction} callback
   * @returns {string}
   */
  addPerformanceCallback(callback) {
    blockNonBrowserEnvironment();
    return this.performanceClient.addPerformanceCallback(callback);
  }
  /**
   * Removes a callback registered with addPerformanceCallback.
   *
   * @param {string} callbackId
   * @returns {boolean}
   */
  removePerformanceCallback(callbackId) {
    return this.performanceClient.removePerformanceCallback(callbackId);
  }
  /**
   * Returns the logger instance
   */
  getLogger() {
    return this.logger;
  }
  /**
   * Replaces the default logger set in configurations with new Logger with new configurations
   * @param logger Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }
  /**
   * Called by wrapper libraries (Angular & React) to set SKU and Version passed down to telemetry, logger, etc.
   * @param sku
   * @param version
   */
  initializeWrapperLibrary(sku, version2) {
    this.browserStorage.setWrapperMetadata(sku, version2);
  }
  /**
   * Sets navigation client
   * @param navigationClient
   */
  setNavigationClient(navigationClient) {
    this.navigationClient = navigationClient;
  }
  /**
   * Returns the configuration object
   */
  getConfiguration() {
    return this.config;
  }
  /**
   * Returns the performance client
   */
  getPerformanceClient() {
    return this.performanceClient;
  }
  /**
   * Returns the browser env indicator
   */
  isBrowserEnv() {
    return this.isBrowserEnvironment;
  }
  /**
   * Generates a correlation id for a request if none is provided.
   *
   * @protected
   * @param {?Partial<BaseAuthRequest>} [request]
   * @returns {string}
   */
  getRequestCorrelationId(request) {
    if (request?.correlationId) {
      return request.correlationId;
    }
    if (this.isBrowserEnvironment) {
      return createNewGuid();
    }
    return "";
  }
  // #endregion
  /**
   * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
   * any code that follows this function will not execute.
   *
   * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
   * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
   *
   * @param request
   */
  loginRedirect(request) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(request);
      this.logger.verbose("0lz9hf", correlationId);
      return this.acquireTokenRedirect(__spreadValues({
        correlationId
      }, request || DEFAULT_REQUEST));
    });
  }
  /**
   * Use when initiating the login process via opening a popup window in the user's browser
   *
   * @param request
   *
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  loginPopup(request) {
    const correlationId = this.getRequestCorrelationId(request);
    this.logger.verbose("0qw7v5", correlationId);
    return this.acquireTokenPopup(__spreadValues({
      correlationId
    }, request || DEFAULT_REQUEST));
  }
  /**
   * Silently acquire an access token for a given set of scopes. Returns currently processing promise if parallel requests are made.
   *
   * @param {@link (SilentRequest:type)}
   * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
   */
  acquireTokenSilent(request) {
    return __async(this, null, function* () {
      const correlationId = this.getRequestCorrelationId(request);
      const atsMeasurement = this.performanceClient.startMeasurement(AcquireTokenSilent, correlationId);
      atsMeasurement.add({
        cacheLookupPolicy: request.cacheLookupPolicy,
        scenarioId: request.scenarioId,
        ssoCapable: this.getCachedSsoCapable()
      });
      preflightCheck2(this.initialized, atsMeasurement, this.config, request);
      this.logger.verbose("0x1c4s", correlationId);
      const account = request.account || this.getActiveAccount();
      if (!account) {
        throw createBrowserAuthError(noAccountError, correlationId);
      }
      return this.acquireTokenSilentDeduped(request, account, correlationId).then((result) => {
        atsMeasurement.end({
          success: true,
          isNativeBroker: result.fromPlatformBroker ?? false,
          fromCache: result.fromCache,
          accessTokenSize: result.accessToken.length,
          idTokenSize: result.idToken.length
        }, void 0, result.account);
        return __spreadProps(__spreadValues({}, result), {
          state: request.state,
          correlationId
          // Ensures PWB scenarios can correctly match request to response
        });
      }).catch((error) => {
        if (error instanceof AuthError) {
          error.correlationId = correlationId;
        }
        atsMeasurement.end({
          success: false
        }, error, account);
        throw error;
      });
    });
  }
  /**
   * Checks if identical request is already in flight and returns reference to the existing promise or fires off a new one if this is the first
   * @param request
   * @param account
   * @param correlationId
   * @returns
   */
  acquireTokenSilentDeduped(request, account, correlationId) {
    return __async(this, null, function* () {
      const preparedRequest = resolveSilentRequestPreparation({
        request,
        account,
        correlationId,
        config: this.config
      }, this.platformAuthProvider, this.logger, this.performanceClient);
      const inProgressRequest = this.activeSilentTokenRequests.get(preparedRequest.key);
      if (typeof inProgressRequest === "undefined") {
        this.logger.verbose("0fcjbk", correlationId);
        this.performanceClient.addFields({ deduped: false }, correlationId);
        const activeRequest = invokeAsync(this.acquireTokenSilentAsync.bind(this), AcquireTokenSilentAsync, this.logger, this.performanceClient, correlationId)(__spreadProps(__spreadValues({}, preparedRequest.request), {
          correlationId
        }), preparedRequest.account);
        this.activeSilentTokenRequests.set(preparedRequest.key, activeRequest);
        return activeRequest.finally(() => {
          this.activeSilentTokenRequests.delete(preparedRequest.key);
        });
      } else {
        this.logger.verbose("1yq7nb", correlationId);
        this.performanceClient.addFields({ deduped: true }, correlationId);
        return inProgressRequest;
      }
    });
  }
  /**
   * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
   * @param {@link (SilentRequest:type)}
   * @param {@link (AccountInfo:type)}
   * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse}
   */
  acquireTokenSilentAsync(request, account) {
    return __async(this, null, function* () {
      const trackStateChange = (event) => this.trackStateChange(request.correlationId, event);
      this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, request.correlationId, InteractionType.Silent, request);
      if (request.correlationId) {
        this.performanceClient.incrementFields({ visibilityChangeCount: 0, onlineStatusChangeCount: 0 }, request.correlationId);
      }
      this.addStateChangeListeners(trackStateChange);
      const silentRequest = yield invokeAsync(initializeSilentRequest, InitializeSilentRequest, this.logger, this.performanceClient, request.correlationId)(request, account, this.config, this.performanceClient, this.logger);
      const cacheLookupPolicy = request.cacheLookupPolicy || CacheLookupPolicy.Default;
      const result = this.acquireTokenSilentNoIframe(silentRequest, cacheLookupPolicy).catch((refreshTokenError) => __async(this, null, function* () {
        const shouldTryToResolveSilently = checkIfRefreshTokenErrorCanBeResolvedSilently(refreshTokenError, cacheLookupPolicy);
        if (shouldTryToResolveSilently) {
          const silentRefreshReason = `${refreshTokenError.errorCode}${refreshTokenError.subError ? `|${refreshTokenError.subError}` : ""}`;
          this.performanceClient.addFields({ silentRefreshReason }, request.correlationId);
          if (!this.activeIframeRequest) {
            let _resolve;
            this.activeIframeRequest = [
              new Promise((resolve) => {
                _resolve = resolve;
              }),
              silentRequest.correlationId
            ];
            this.logger.verbose("0rh08z", silentRequest.correlationId);
            return invokeAsync(this.acquireTokenBySilentIframe.bind(this), AcquireTokenBySilentIframe, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest).then((iframeResult) => {
              _resolve(true);
              return iframeResult;
            }).catch((e) => {
              _resolve(false);
              throw e;
            }).finally(() => {
              this.activeIframeRequest = void 0;
            });
          } else if (cacheLookupPolicy !== CacheLookupPolicy.Skip) {
            const [activePromise, activeCorrelationId] = this.activeIframeRequest;
            this.logger.verbose(`1w8fso ${activeCorrelationId}`, silentRequest.correlationId);
            const awaitConcurrentIframeMeasure = this.performanceClient.startMeasurement(AwaitConcurrentIframe, silentRequest.correlationId);
            awaitConcurrentIframeMeasure.add({
              awaitIframeCorrelationId: activeCorrelationId
            });
            const activePromiseResult = yield activePromise;
            awaitConcurrentIframeMeasure.end({
              success: activePromiseResult
            });
            if (activePromiseResult) {
              this.logger.verbose(`0ywzzi ${activeCorrelationId}`, silentRequest.correlationId);
              return this.acquireTokenSilentNoIframe(silentRequest, cacheLookupPolicy);
            } else {
              this.logger.info(`17y14q ${activeCorrelationId}`, silentRequest.correlationId);
              throw refreshTokenError;
            }
          } else {
            this.logger.warning("1bd4p8", silentRequest.correlationId);
            return invokeAsync(this.acquireTokenBySilentIframe.bind(this), AcquireTokenBySilentIframe, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest);
          }
        } else {
          throw refreshTokenError;
        }
      }));
      return result.then((response) => {
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, request.correlationId, InteractionType.Silent, response);
        if (request.correlationId) {
          this.performanceClient.addFields({
            fromCache: response.fromCache,
            isNativeBroker: response.fromPlatformBroker ?? false
          }, request.correlationId);
        }
        return response;
      }).catch((tokenRenewalError) => {
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, request.correlationId, InteractionType.Silent, null, tokenRenewalError);
        throw tokenRenewalError;
      }).finally(() => {
        this.removeStateChangeListeners(trackStateChange);
      });
    });
  }
  /**
   * AcquireTokenSilent without the iframe fallback. This is used to enable the correct fallbacks in cases where there's a potential for multiple silent requests to be made in parallel and prevent those requests from making concurrent iframe requests.
   * @param silentRequest
   * @param cacheLookupPolicy
   * @returns
   */
  acquireTokenSilentNoIframe(silentRequest, cacheLookupPolicy) {
    return __async(this, null, function* () {
      if (isPlatformAuthAllowed(this.config, this.logger, silentRequest.correlationId, this.platformAuthProvider, silentRequest.authenticationScheme, this.performanceClient) && silentRequest.account.nativeAccountId) {
        this.logger.verbose("0sczo4", silentRequest.correlationId);
        this.performanceClient.addFields({ isPlatformBrokerRequest: true }, silentRequest.correlationId);
        return this.acquireTokenNative(silentRequest, ApiId.acquireTokenSilent_silentFlow, silentRequest.account.nativeAccountId, cacheLookupPolicy).catch((e) => __async(this, null, function* () {
          if (e instanceof NativeAuthError && isFatalNativeAuthError(e)) {
            this.logger.verbose("07rkmb", silentRequest.correlationId);
            this.platformAuthProvider = void 0;
            throw createClientAuthError(ClientAuthErrorCodes_exports.tokenRefreshRequired, silentRequest.correlationId);
          }
          throw e;
        }));
      } else {
        this.logger.verbose("0ox81t", silentRequest.correlationId);
        if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
          this.logger.verbose("0fvwxe", silentRequest.correlationId);
        }
        return invokeAsync(this.acquireTokenFromCache.bind(this), AcquireTokenFromCache, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest, cacheLookupPolicy).catch((cacheError) => {
          if (cacheLookupPolicy === CacheLookupPolicy.AccessToken) {
            throw cacheError;
          }
          this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_NETWORK_START, silentRequest.correlationId, InteractionType.Silent, silentRequest);
          return invokeAsync(this.acquireTokenByRefreshToken.bind(this), AcquireTokenByRefreshToken, this.logger, this.performanceClient, silentRequest.correlationId)(silentRequest, cacheLookupPolicy);
        });
      }
    });
  }
  /**
   * Pre-generates PKCE codes and stores it in local variable
   * @param correlationId
   */
  preGeneratePkceCodes(correlationId) {
    return __async(this, null, function* () {
      this.logger.verbose("1x6uj6", correlationId);
      this.pkceCode = yield invokeAsync(generatePkceCodes, GeneratePkceCodes, this.logger, this.performanceClient, correlationId)(this.performanceClient, this.logger, correlationId);
      return Promise.resolve();
    });
  }
  /**
   * Provides pre-generated PKCE codes, if any
   * @param correlationId
   */
  getPreGeneratedPkceCodes(correlationId) {
    const res = this.pkceCode ? __spreadValues({}, this.pkceCode) : void 0;
    this.pkceCode = void 0;
    if (res) {
      this.logger.verbose("12js1o", correlationId);
    } else {
      this.logger.verbose("1oe9ci", correlationId);
    }
    this.performanceClient.addFields({ usePreGeneratedPkce: !!res }, correlationId);
    return res;
  }
  logMultipleInstances(performanceEvent, correlationId) {
    const clientId = this.config.auth.clientId;
    if (!window)
      return;
    window.msal = window.msal || {};
    window.msal.clientIds = window.msal.clientIds || [];
    const clientIds = window.msal.clientIds;
    if (clientIds.length > 0) {
      this.logger.verbose("1qtz3l", correlationId);
    }
    window.msal.clientIds.push(clientId);
    collectInstanceStats(clientId, performanceEvent, this.logger, correlationId);
  }
};
function checkIfRefreshTokenErrorCanBeResolvedSilently(refreshTokenError, cacheLookupPolicy) {
  const noInteractionRequired = !(refreshTokenError instanceof InteractionRequiredAuthError && // For refresh token errors, bad_token does not always require interaction (silently resolvable)
  refreshTokenError.subError !== InteractionRequiredAuthErrorCodes_exports.badToken);
  const refreshTokenRefreshRequired = refreshTokenError.errorCode === BrowserConstants.INVALID_GRANT_ERROR || refreshTokenError.errorCode === ClientAuthErrorCodes_exports.tokenRefreshRequired;
  const isSilentlyResolvable = noInteractionRequired && refreshTokenRefreshRequired || refreshTokenError.errorCode === InteractionRequiredAuthErrorCodes_exports.noTokensFound || refreshTokenError.errorCode === InteractionRequiredAuthErrorCodes_exports.refreshTokenExpired;
  const tryIframeRenewal = iFrameRenewalPolicies.includes(cacheLookupPolicy);
  return isSilentlyResolvable && tryIframeRenewal;
}

// node_modules/@azure/msal-browser/dist/operatingcontext/BaseOperatingContext.mjs
var BaseOperatingContext = class _BaseOperatingContext {
  static loggerCallback(level, message) {
    switch (level) {
      case LogLevel.Error:
        console.error(message);
        return;
      case LogLevel.Info:
        console.info(message);
        return;
      case LogLevel.Verbose:
        console.debug(message);
        return;
      case LogLevel.Warning:
        console.warn(message);
        return;
      default:
        console.log(message);
        return;
    }
  }
  constructor(config, responseHandlers) {
    this.browserEnvironment = typeof window !== "undefined";
    this.config = buildConfiguration(config, this.browserEnvironment);
    this.responseHandlers = responseHandlers;
    let sessionStorage;
    try {
      sessionStorage = window[BrowserCacheLocation.SessionStorage];
    } catch (e) {
    }
    const logLevelKey = sessionStorage?.getItem(LOG_LEVEL_CACHE_KEY);
    const piiLoggingKey = sessionStorage?.getItem(LOG_PII_CACHE_KEY)?.toLowerCase();
    const piiLoggingEnabled = piiLoggingKey === "true" ? true : piiLoggingKey === "false" ? false : void 0;
    const loggerOptions = __spreadValues({}, this.config.system.loggerOptions);
    const logLevel = logLevelKey && Object.keys(LogLevel).includes(logLevelKey) ? LogLevel[logLevelKey] : void 0;
    if (logLevel) {
      loggerOptions.loggerCallback = _BaseOperatingContext.loggerCallback;
      loggerOptions.logLevel = logLevel;
    }
    if (piiLoggingEnabled !== void 0) {
      loggerOptions.piiLoggingEnabled = piiLoggingEnabled;
    }
    this.logger = new Logger(loggerOptions, name, version);
    this.available = false;
  }
  /**
   * Return the MSAL config
   * @returns BrowserConfiguration
   */
  getConfig() {
    return this.config;
  }
  /**
   * Returns the internal response handlers supplied by PublicClientApplication, if any.
   * @returns AuthResponseHandlers | undefined
   */
  getResponseHandlers() {
    return this.responseHandlers;
  }
  /**
   * Returns the MSAL Logger
   * @returns Logger
   */
  getLogger() {
    return this.logger;
  }
  isAvailable() {
    return this.available;
  }
  isBrowserEnvironment() {
    return this.browserEnvironment;
  }
};

// node_modules/@azure/msal-browser/dist/operatingcontext/StandardOperatingContext.mjs
var StandardOperatingContext = class _StandardOperatingContext extends BaseOperatingContext {
  /**
   * Return the module name.  Intended for use with import() to enable dynamic import
   * of the implementation associated with this operating context
   * @returns
   */
  getModuleName() {
    return _StandardOperatingContext.MODULE_NAME;
  }
  /**
   * Returns the unique identifier for this operating context
   * @returns string
   */
  getId() {
    return _StandardOperatingContext.ID;
  }
  /**
   * Checks whether the operating context is available.
   * Confirms that the code is running a browser rather.  This is required.
   * @returns Promise<boolean> indicating whether this operating context is currently available.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialize(correlationId) {
    return __async(this, null, function* () {
      this.available = typeof window !== "undefined";
      return this.available;
    });
  }
};
StandardOperatingContext.MODULE_NAME = "";
StandardOperatingContext.ID = "StandardOperatingContext";

// node_modules/@azure/msal-browser/dist/naa/BridgeError.mjs
function isBridgeError(error) {
  return error.status !== void 0;
}

// node_modules/@azure/msal-browser/dist/naa/BridgeStatusCode.mjs
var BridgeStatusCode = {
  UserInteractionRequired: "USER_INTERACTION_REQUIRED",
  UserCancel: "USER_CANCEL",
  NoNetwork: "NO_NETWORK",
  TransientError: "TRANSIENT_ERROR",
  PersistentError: "PERSISTENT_ERROR",
  Disabled: "DISABLED",
  AccountUnavailable: "ACCOUNT_UNAVAILABLE",
  NestedAppAuthUnavailable: "NESTED_APP_AUTH_UNAVAILABLE"
  // NAA is unavailable in the current context, can retry with standard browser based auth
};

// node_modules/@azure/msal-browser/dist/webBrokerBridge/WebBrokerBridgeError.mjs
var WebBrokerBridgeErrorCode = {
  /* Interaction / auth outcomes */
  UserInteractionRequired: "user_interaction_required",
  UserCanceled: "user_canceled",
  /* Environment / connectivity */
  NoNetwork: "no_network",
  AccountUnavailable: "account_unavailable",
  BridgeDisabled: "bridge_disabled",
  BridgeUnavailable: "bridge_unavailable",
  /* Server-side outcomes */
  TransientError: "transient_error",
  PersistentError: "persistent_error",
  /* Broker-channel failures */
  BridgeTimeout: "bridge_timeout",
  BridgeHandshakeFailed: "bridge_handshake_failed",
  BridgeConnectionReset: "bridge_connection_reset",
  BridgeResponseInvalid: "bridge_response_invalid",
  PopupWillRedirect: "popup_will_redirect",
  ShrGenerationError: "shr_generation_error",
  /* Fallback */
  Unknown: "unknown"
};

// node_modules/@azure/msal-browser/dist/webBrokerBridge/WebBrokerBridgeErrorMap.mjs
function toAuthError(err) {
  const correlationId = err.correlationId ?? "";
  switch (err.code) {
    case WebBrokerBridgeErrorCode.UserInteractionRequired:
      return new InteractionRequiredAuthError(err.innerErrorCode || "", correlationId, err.description, err.subError);
    case WebBrokerBridgeErrorCode.TransientError:
    case WebBrokerBridgeErrorCode.PersistentError:
      return new ServerError(err.innerErrorCode || "", correlationId, err.description, err.subError);
    case WebBrokerBridgeErrorCode.UserCanceled:
      return new ClientAuthError(ClientAuthErrorCodes_exports.userCanceled, correlationId);
    case WebBrokerBridgeErrorCode.NoNetwork:
      return new ClientAuthError(ClientAuthErrorCodes_exports.noNetworkConnectivity, correlationId);
    case WebBrokerBridgeErrorCode.AccountUnavailable:
      return new ClientAuthError(ClientAuthErrorCodes_exports.noAccountFound, correlationId);
    case WebBrokerBridgeErrorCode.BridgeDisabled:
      return new ClientAuthError(ClientAuthErrorCodes_exports.nestedAppAuthBridgeDisabled, correlationId);
    case WebBrokerBridgeErrorCode.BridgeUnavailable:
      return new ClientAuthError(err.innerErrorCode || ClientAuthErrorCodes_exports.nestedAppAuthBridgeDisabled, correlationId, err.description);
    /*
     * PWB broker-channel failures. The common code doubles as the
     * concrete errorCode on AuthError so the original error identity
     * can be recovered by round-tripping the string.
     */
    case WebBrokerBridgeErrorCode.BridgeTimeout:
    case WebBrokerBridgeErrorCode.BridgeHandshakeFailed:
    case WebBrokerBridgeErrorCode.BridgeConnectionReset:
    case WebBrokerBridgeErrorCode.BridgeResponseInvalid:
    case WebBrokerBridgeErrorCode.PopupWillRedirect:
    case WebBrokerBridgeErrorCode.ShrGenerationError:
      return new AuthError(err.code, correlationId, err.description, err.subError);
    case WebBrokerBridgeErrorCode.Unknown:
    default:
      return new AuthError(err.innerErrorCode || "unknown_error", correlationId, err.description || "An unknown error occurred", err.subError);
  }
}

// node_modules/@azure/msal-browser/dist/naa/mapping/NestedAppAuthAdapter.mjs
var NestedAppAuthAdapter = class {
  constructor(clientId, clientCapabilities, crypto, logger) {
    this.clientId = clientId;
    this.clientCapabilities = clientCapabilities;
    this.crypto = crypto;
    this.logger = logger;
  }
  toNaaTokenRequest(request) {
    let extraParams;
    if (request.extraQueryParameters === void 0) {
      extraParams = /* @__PURE__ */ new Map();
    } else {
      extraParams = new Map(Object.entries(request.extraQueryParameters));
    }
    const correlationId = request.correlationId || this.crypto.createNewGuid();
    const claims = RequestParameterBuilder_exports.buildMergedClaims(request.claims, this.clientCapabilities);
    const scopes = request.scopes || Constants_exports.OIDC_DEFAULT_SCOPES;
    const attributeTokens = CacheHelpers_exports.serializeAttributeTokens(request.attributeTokens);
    const tokenRequest = {
      platformBrokerId: request.account?.homeAccountId,
      clientId: this.clientId,
      authority: request.authority,
      resource: request.resource,
      scope: scopes.join(" "),
      correlationId,
      claims: !StringUtils.isEmptyObj(claims) ? claims : void 0,
      state: request.state,
      authenticationScheme: request.authenticationScheme || Constants_exports.AuthenticationScheme.BEARER,
      extraParameters: extraParams,
      attributeTokens
    };
    return tokenRequest;
  }
  fromNaaTokenResponse(request, response, reqTimestamp) {
    if (!response.token.id_token || !response.token.access_token) {
      throw createClientAuthError(ClientAuthErrorCodes_exports.nullOrEmptyToken, request.correlationId);
    }
    const expiresOn = TimeUtils_exports.toDateFromSeconds(reqTimestamp + (response.token.expires_in || 0));
    const idTokenClaims = AuthToken_exports.extractTokenClaims(response.token.id_token, this.crypto.base64Decode, request.correlationId);
    const account = this.fromNaaAccountInfo(response.account, response.token.id_token, idTokenClaims);
    const scopes = response.token.scope || request.scope;
    const authenticationResult = {
      authority: response.token.authority || account.environment,
      uniqueId: account.localAccountId,
      tenantId: account.tenantId,
      scopes: scopes.split(" "),
      account,
      idToken: response.token.id_token,
      idTokenClaims,
      accessToken: response.token.access_token,
      fromCache: false,
      expiresOn,
      tokenType: request.authenticationScheme || Constants_exports.AuthenticationScheme.BEARER,
      correlationId: request.correlationId,
      extExpiresOn: expiresOn,
      state: request.state
    };
    return authenticationResult;
  }
  /*
   *  export type AccountInfo = {
   *     homeAccountId: string;
   *     environment: string;
   *     tenantId: string;
   *     username: string;
   *     localAccountId: string;
   *     name?: string;
   *     idToken?: string;
   *     idTokenClaims?: TokenClaims & {
   *         [key: string]:
   *             | string
   *             | number
   *             | string[]
   *             | object
   *             | undefined
   *             | unknown;
   *     };
   *     nativeAccountId?: string;
   *     authorityType?: string;
   * };
   */
  fromNaaAccountInfo(fromAccount, idToken, idTokenClaims) {
    const effectiveIdTokenClaims = idTokenClaims || fromAccount.idTokenClaims;
    const localAccountId = fromAccount.localAccountId || effectiveIdTokenClaims?.oid || effectiveIdTokenClaims?.sub || "";
    const tenantId = fromAccount.tenantId || getTenantIdFromIdTokenClaims(effectiveIdTokenClaims) || "";
    const homeAccountId = fromAccount.homeAccountId || `${localAccountId}.${tenantId}`;
    const environment = fromAccount.environment;
    if (!environment) {
      throw createClientAuthError(ClientAuthErrorCodes_exports.invalidCacheEnvironment, "");
    }
    const preferredUsername = effectiveIdTokenClaims?.preferred_username || effectiveIdTokenClaims?.upn;
    const email = effectiveIdTokenClaims?.emails?.[0] || null;
    const username = fromAccount.username || preferredUsername || email || "";
    const name2 = fromAccount.name || effectiveIdTokenClaims?.name || "";
    const loginHint = fromAccount.loginHint || effectiveIdTokenClaims?.login_hint;
    const tenantProfiles = /* @__PURE__ */ new Map();
    const tenantProfile = buildTenantProfile(homeAccountId, localAccountId, tenantId, fromAccount.platformBrokerId, effectiveIdTokenClaims);
    tenantProfiles.set(tenantId, tenantProfile);
    const account = {
      homeAccountId,
      environment,
      tenantId,
      username,
      localAccountId,
      name: name2,
      loginHint,
      idToken,
      idTokenClaims: effectiveIdTokenClaims,
      nativeAccountId: fromAccount.platformBrokerId,
      tenantProfiles
    };
    return account;
  }
  /**
   *
   * @param error BridgeError
   * @returns AuthError, ClientAuthError, ClientConfigurationError, ServerError, InteractionRequiredError
   */
  fromBridgeError(error) {
    if (isBridgeError(error)) {
      return toAuthError(bridgeErrorToWebBrokerBridgeError(error));
    }
    return new AuthError("unknown_error", "", "An unknown error occurred");
  }
  /**
   * Returns an AuthenticationResult from the given cache items
   *
   * @param account
   * @param idToken
   * @param accessToken
   * @param reqTimestamp
   * @returns
   */
  toAuthenticationResultFromCache(account, idToken, accessToken, request, correlationId) {
    if (!idToken || !accessToken) {
      throw createClientAuthError(ClientAuthErrorCodes_exports.nullOrEmptyToken, correlationId);
    }
    const idTokenClaims = AuthToken_exports.extractTokenClaims(idToken.secret, this.crypto.base64Decode, correlationId);
    const scopes = accessToken.target || request.scopes.join(" ");
    const authenticationResult = {
      authority: accessToken.environment || account.environment,
      uniqueId: account.localAccountId,
      tenantId: account.tenantId,
      scopes: scopes.split(" "),
      account,
      idToken: idToken.secret,
      idTokenClaims: idTokenClaims || {},
      accessToken: accessToken.secret,
      fromCache: true,
      expiresOn: TimeUtils_exports.toDateFromSeconds(accessToken.expiresOn),
      extExpiresOn: TimeUtils_exports.toDateFromSeconds(accessToken.extendedExpiresOn),
      tokenType: request.authenticationScheme || Constants_exports.AuthenticationScheme.BEARER,
      correlationId,
      state: request.state
    };
    return authenticationResult;
  }
};
function bridgeErrorToWebBrokerBridgeError(error) {
  switch (error.status) {
    case BridgeStatusCode.UserCancel:
      return { code: WebBrokerBridgeErrorCode.UserCanceled };
    case BridgeStatusCode.NoNetwork:
      return { code: WebBrokerBridgeErrorCode.NoNetwork };
    case BridgeStatusCode.AccountUnavailable:
      return { code: WebBrokerBridgeErrorCode.AccountUnavailable };
    case BridgeStatusCode.Disabled:
      return { code: WebBrokerBridgeErrorCode.BridgeDisabled };
    case BridgeStatusCode.NestedAppAuthUnavailable:
      return {
        code: WebBrokerBridgeErrorCode.BridgeUnavailable,
        innerErrorCode: error.code,
        description: error.description
      };
    case BridgeStatusCode.TransientError:
      return {
        code: WebBrokerBridgeErrorCode.TransientError,
        innerErrorCode: error.code,
        description: error.description
      };
    case BridgeStatusCode.PersistentError:
      return {
        code: WebBrokerBridgeErrorCode.PersistentError,
        innerErrorCode: error.code,
        description: error.description
      };
    case BridgeStatusCode.UserInteractionRequired:
      return {
        code: WebBrokerBridgeErrorCode.UserInteractionRequired,
        innerErrorCode: error.code,
        description: error.description
      };
    default:
      return {
        code: WebBrokerBridgeErrorCode.Unknown,
        innerErrorCode: error.code,
        description: error.description
      };
  }
}

// node_modules/@azure/msal-browser/dist/error/NestedAppAuthError.mjs
var NestedAppAuthError = class _NestedAppAuthError extends AuthError {
  constructor(errorCode, correlationId, errorMessage) {
    super(errorCode, correlationId, errorMessage);
    Object.setPrototypeOf(this, _NestedAppAuthError.prototype);
    this.name = "NestedAppAuthError";
  }
  static createUnsupportedError(correlationId) {
    return new _NestedAppAuthError(unsupportedMethod, correlationId || "");
  }
};

// node_modules/@azure/msal-browser/dist/controllers/NestedAppAuthController.mjs
var NestedAppAuthController = class _NestedAppAuthController {
  constructor(operatingContext) {
    this.operatingContext = operatingContext;
    const proxy = this.operatingContext.getBridgeProxy();
    if (proxy !== void 0) {
      this.bridgeProxy = proxy;
    } else {
      throw new Error("unexpected: bridgeProxy is undefined");
    }
    this.config = operatingContext.getConfig();
    this.logger = this.operatingContext.getLogger();
    this.performanceClient = this.config.telemetry.client;
    this.browserCrypto = operatingContext.isBrowserEnvironment() ? new CryptoOps(this.logger, this.performanceClient, true) : DEFAULT_CRYPTO_IMPLEMENTATION;
    const tokenBindingKeyManager = operatingContext.isBrowserEnvironment() ? new TokenBindingKeyManager(this.logger, this.performanceClient) : DEFAULT_TOKEN_BINDING_KEY_MANAGER;
    this.eventHandler = new EventHandler(this.logger);
    this.browserStorage = this.operatingContext.isBrowserEnvironment() ? new BrowserCacheManager(this.config.auth.clientId, this.config.cache, this.browserCrypto, this.logger, this.performanceClient, this.eventHandler, buildStaticAuthorityOptions(this.config.auth), tokenBindingKeyManager) : DEFAULT_BROWSER_CACHE_MANAGER(this.config.auth.clientId, this.logger, this.performanceClient, this.eventHandler, void 0, tokenBindingKeyManager);
    this.nestedAppAuthAdapter = new NestedAppAuthAdapter(this.config.auth.clientId, this.config.auth.clientCapabilities, this.browserCrypto, this.logger);
    const accountContext = this.bridgeProxy.getAccountContext();
    this.currentAccountContext = accountContext ? accountContext : null;
  }
  /**
   * Factory function to create a new instance of NestedAppAuthController
   * @param operatingContext
   * @returns Promise<IController>
   */
  static createController(operatingContext) {
    return __async(this, null, function* () {
      const controller = new _NestedAppAuthController(operatingContext);
      return Promise.resolve(controller);
    });
  }
  /**
   * Specific implementation of initialize function for NestedAppAuthController
   * @returns
   */
  initialize(request, isBroker) {
    return __async(this, null, function* () {
      const initCorrelationId = request?.correlationId || createNewGuid();
      yield this.browserStorage.initialize(initCorrelationId);
      return Promise.resolve();
    });
  }
  /**
   * Validate the incoming request and add correlationId if not present
   * @param request
   * @returns
   */
  ensureValidRequest(request) {
    if (request?.correlationId) {
      return request;
    }
    return __spreadProps(__spreadValues({}, request), {
      correlationId: this.browserCrypto.createNewGuid()
    });
  }
  /**
   * Internal implementation of acquireTokenInteractive flow
   * @param request
   * @returns
   */
  acquireTokenInteractive(request) {
    return __async(this, null, function* () {
      const validRequest = this.ensureValidRequest(request);
      const correlationId = validRequest.correlationId || createNewGuid();
      this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, correlationId, InteractionType.Popup, validRequest);
      const atPopupMeasurement = this.performanceClient.startMeasurement(AcquireTokenPopup, correlationId);
      atPopupMeasurement.add({ nestedAppAuthRequest: true });
      try {
        enforceResourceParameter(this.config.auth.isMcp, validRequest);
        const naaRequest = this.nestedAppAuthAdapter.toNaaTokenRequest(validRequest);
        const reqTimestamp = TimeUtils_exports.nowSeconds();
        const response = yield this.bridgeProxy.getTokenInteractive(naaRequest);
        const result = __spreadValues({}, this.nestedAppAuthAdapter.fromNaaTokenResponse(naaRequest, response, reqTimestamp));
        try {
          yield this.hydrateCache(result, request);
        } catch (error) {
          this.logger.warningPii(`1mwr91 ${error}`, correlationId);
        }
        this.currentAccountContext = {
          homeAccountId: result.account.homeAccountId,
          environment: result.account.environment,
          tenantId: result.account.tenantId
        };
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, correlationId, InteractionType.Popup, result);
        atPopupMeasurement.add({
          accessTokenSize: result.accessToken.length,
          idTokenSize: result.idToken.length
        });
        atPopupMeasurement.end({
          success: true,
          requestId: result.requestId
        }, void 0, result.account);
        return result;
      } catch (e) {
        const error = e instanceof AuthError ? e : this.nestedAppAuthAdapter.fromBridgeError(e);
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, correlationId, InteractionType.Popup, null, e);
        atPopupMeasurement.end({
          success: false
        }, e, request.account);
        throw error;
      }
    });
  }
  /**
   * Internal implementation of acquireTokenSilent flow
   * @param request
   * @returns
   */
  acquireTokenSilentInternal(request) {
    return __async(this, null, function* () {
      const validRequest = this.ensureValidRequest(request);
      const correlationId = validRequest.correlationId || createNewGuid();
      this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, correlationId, InteractionType.Silent, validRequest);
      const result = yield this.acquireTokenFromCache(validRequest);
      if (result) {
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, correlationId, InteractionType.Silent, result);
        return result;
      }
      const ssoSilentMeasurement = this.performanceClient.startMeasurement(SsoSilent, correlationId);
      ssoSilentMeasurement.increment({
        visibilityChangeCount: 0
      });
      ssoSilentMeasurement.add({
        nestedAppAuthRequest: true
      });
      try {
        enforceResourceParameter(this.config.auth.isMcp, validRequest);
        const naaRequest = this.nestedAppAuthAdapter.toNaaTokenRequest(validRequest);
        naaRequest.forceRefresh = validRequest.forceRefresh;
        const reqTimestamp = TimeUtils_exports.nowSeconds();
        const response = yield this.bridgeProxy.getTokenSilent(naaRequest);
        const result2 = this.nestedAppAuthAdapter.fromNaaTokenResponse(naaRequest, response, reqTimestamp);
        try {
          yield this.hydrateCache(result2, request);
        } catch (error) {
          this.logger.warningPii(`1mwr91 ${error}`, correlationId);
        }
        this.currentAccountContext = {
          homeAccountId: result2.account.homeAccountId,
          environment: result2.account.environment,
          tenantId: result2.account.tenantId
        };
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, correlationId, InteractionType.Silent, result2);
        ssoSilentMeasurement?.add({
          accessTokenSize: result2.accessToken.length,
          idTokenSize: result2.idToken.length
        });
        ssoSilentMeasurement?.end({
          success: true,
          requestId: result2.requestId
        }, void 0, result2.account);
        return result2;
      } catch (e) {
        const error = e instanceof AuthError ? e : this.nestedAppAuthAdapter.fromBridgeError(e);
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, correlationId, InteractionType.Silent, null, e);
        ssoSilentMeasurement?.end({
          success: false
        }, e, request.account);
        throw error;
      }
    });
  }
  /**
   * acquires tokens from cache
   * @param request
   * @returns
   */
  acquireTokenFromCache(request) {
    return __async(this, null, function* () {
      const correlationId = request.correlationId || createNewGuid();
      const atsMeasurement = this.performanceClient.startMeasurement(AcquireTokenSilent, correlationId);
      atsMeasurement?.add({
        nestedAppAuthRequest: true
      });
      if (request.claims) {
        this.logger.verbose("11t57w", correlationId);
        return null;
      }
      if (request.forceRefresh) {
        this.logger.verbose("1ovnmo", correlationId);
        return null;
      }
      let result = null;
      if (!request.cacheLookupPolicy) {
        request.cacheLookupPolicy = CacheLookupPolicy.Default;
      }
      switch (request.cacheLookupPolicy) {
        case CacheLookupPolicy.Default:
        case CacheLookupPolicy.AccessToken:
        case CacheLookupPolicy.AccessTokenAndRefreshToken:
          result = yield this.acquireTokenFromCacheInternal(request);
          break;
        default:
          return null;
      }
      if (result) {
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, correlationId, InteractionType.Silent, result);
        atsMeasurement.add({
          accessTokenSize: result.accessToken.length,
          idTokenSize: result.idToken.length
        });
        atsMeasurement.end({
          success: true
        }, void 0, result.account);
        return result;
      }
      this.logger.warning("1yb4fi", correlationId);
      this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, correlationId, InteractionType.Silent, null);
      atsMeasurement.end({
        success: false
      }, void 0, request.account);
      return null;
    });
  }
  /**
   *
   * @param request
   * @returns
   */
  acquireTokenFromCacheInternal(request) {
    return __async(this, null, function* () {
      const accountContext = this.bridgeProxy.getAccountContext() || this.currentAccountContext;
      const correlationId = request.correlationId || createNewGuid();
      let currentAccount = null;
      if (accountContext) {
        currentAccount = getAccount(accountContext, this.logger, this.browserStorage, correlationId);
      }
      if (!currentAccount) {
        this.logger.verbose("10qnr0", correlationId);
        return Promise.resolve(null);
      }
      this.logger.verbose("1u7hux", correlationId);
      const authRequest = __spreadProps(__spreadValues({}, request), {
        correlationId,
        authority: request.authority || currentAccount.environment,
        scopes: request.scopes?.length ? request.scopes : [...Constants_exports.OIDC_DEFAULT_SCOPES]
      });
      const tokenKeys = this.browserStorage.getTokenKeys();
      const cachedAccessToken = this.browserStorage.getAccessToken(currentAccount, authRequest, tokenKeys, currentAccount.tenantId);
      if (!cachedAccessToken) {
        this.logger.verbose("03vm49", correlationId);
        return Promise.resolve(null);
      } else if (TimeUtils_exports.wasClockTurnedBack(cachedAccessToken.cachedAt) || TimeUtils_exports.isTokenExpired(cachedAccessToken.expiresOn, this.config.system.tokenRenewalOffsetSeconds)) {
        this.logger.verbose("18egye", correlationId);
        return Promise.resolve(null);
      } else if (authRequest.resource) {
        const requestedResource = authRequest.resource;
        const cachedResource = cachedAccessToken.resource;
        if (!cachedResource || cachedResource !== requestedResource) {
          this.logger.verbose("0qraxd", correlationId);
          return Promise.resolve(null);
        }
      }
      const cachedIdToken = this.browserStorage.getIdToken(currentAccount, authRequest.correlationId, tokenKeys, currentAccount.tenantId);
      if (!cachedIdToken) {
        this.logger.verbose("0d68kd", correlationId);
        return Promise.resolve(null);
      }
      return this.nestedAppAuthAdapter.toAuthenticationResultFromCache(currentAccount, cachedIdToken, cachedAccessToken, authRequest, authRequest.correlationId);
    });
  }
  /**
   * acquireTokenPopup flow implementation
   * @param request
   * @returns
   */
  acquireTokenPopup(request) {
    return __async(this, null, function* () {
      return this.acquireTokenInteractive(request);
    });
  }
  /**
   * acquireTokenRedirect flow is not supported in nested app auth
   * @param request
   */
  acquireTokenRedirect(request) {
    throw NestedAppAuthError.createUnsupportedError(request?.correlationId);
  }
  /**
   * acquireTokenSilent flow implementation
   * @param silentRequest
   * @returns
   */
  acquireTokenSilent(silentRequest) {
    return __async(this, null, function* () {
      return this.acquireTokenSilentInternal(silentRequest);
    });
  }
  /**
   * Hybrid flow is not currently supported in nested app auth
   * @param request
   */
  acquireTokenByCode(request) {
    throw NestedAppAuthError.createUnsupportedError(request?.correlationId);
  }
  /**
   * Adds event callbacks to array
   * @param callback
   * @param eventTypes
   */
  addEventCallback(callback, eventTypes) {
    return this.eventHandler.addEventCallback(callback, eventTypes);
  }
  /**
   * Removes callback with provided id from callback array
   * @param callbackId
   */
  removeEventCallback(callbackId) {
    this.eventHandler.removeEventCallback(callbackId);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addPerformanceCallback(callback) {
    throw NestedAppAuthError.createUnsupportedError();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removePerformanceCallback(callbackId) {
    throw NestedAppAuthError.createUnsupportedError();
  }
  // #region Account APIs
  /**
   * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
   * @param accountFilter - (Optional) filter to narrow down the accounts returned
   * @returns Array of AccountInfo objects in cache
   */
  getAllAccounts(accountFilter) {
    return getAllAccounts(this.logger, this.browserStorage, this.isBrowserEnv(), createNewGuid(), accountFilter);
  }
  /**
   * Returns the first account found in the cache that matches the account filter passed in.
   * @param accountFilter
   * @returns The first account found in the cache matching the provided filter or null if no account could be found.
   */
  getAccount(accountFilter) {
    return getAccount(accountFilter, this.logger, this.browserStorage, createNewGuid());
  }
  /**
   * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
   * @param account
   */
  setActiveAccount(account) {
    return setActiveAccount(account, this.browserStorage, createNewGuid());
  }
  /**
   * Gets the currently active account
   */
  getActiveAccount() {
    return getActiveAccount(this.browserStorage, createNewGuid());
  }
  // #endregion
  handleRedirectPromise(options) {
    return Promise.resolve(null);
  }
  loginPopup(request) {
    return this.acquireTokenInteractive(request || DEFAULT_REQUEST);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loginRedirect(request) {
    throw NestedAppAuthError.createUnsupportedError(request?.correlationId);
  }
  logoutRedirect(logoutRequest) {
    throw NestedAppAuthError.createUnsupportedError(logoutRequest?.correlationId);
  }
  logoutPopup(logoutRequest) {
    throw NestedAppAuthError.createUnsupportedError(logoutRequest?.correlationId);
  }
  ssoSilent(request) {
    return this.acquireTokenSilentInternal(request);
  }
  /**
   * Returns the logger instance
   */
  getLogger() {
    return this.logger;
  }
  /**
   * Replaces the default logger set in configurations with new Logger with new configurations
   * @param logger Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initializeWrapperLibrary(sku, version2) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setNavigationClient(navigationClient) {
    this.logger.warning("1k8729", "");
  }
  getConfiguration() {
    return this.config;
  }
  isBrowserEnv() {
    return this.operatingContext.isBrowserEnvironment();
  }
  getBrowserCrypto() {
    return this.browserCrypto;
  }
  getPerformanceClient() {
    throw NestedAppAuthError.createUnsupportedError();
  }
  getRedirectResponse() {
    throw NestedAppAuthError.createUnsupportedError();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  clearCache(logoutRequest) {
    return __async(this, null, function* () {
      throw NestedAppAuthError.createUnsupportedError(logoutRequest?.correlationId);
    });
  }
  hydrateCache(result, request) {
    return __async(this, null, function* () {
      this.logger.verbose("16jycr", result.correlationId);
      const accountEntity = AccountEntityUtils_exports.createAccountEntityFromAccountInfo(result.account, result.cloudGraphHostName, result.msGraphHost);
      yield this.browserStorage.setAccount(accountEntity, result.correlationId, AuthToken_exports.isKmsi(result.idTokenClaims), ApiId.hydrateCache);
      return this.browserStorage.hydrateCache(result, request);
    });
  }
};

// node_modules/@azure/msal-browser/dist/webBrokerBridge/PendingRequestRegistry.mjs
var PendingRequestRegistry = class {
  constructor() {
    this.pending = /* @__PURE__ */ new Map();
  }
  /**
   * Register a pending request. Returns a promise that resolves when a
   * response with the matching `requestId` arrives, or rejects if the
   * caller invokes `reject` for that id.
   */
  register(requestId) {
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
    });
  }
  /** Resolve a pending request. No-op if `requestId` isn't registered. */
  resolve(requestId, response) {
    const entry = this.pending.get(requestId);
    if (entry === void 0) {
      return;
    }
    this.pending.delete(requestId);
    entry.resolve(response);
  }
  /** Reject a pending request. No-op if `requestId` isn't registered. */
  reject(requestId, reason) {
    const entry = this.pending.get(requestId);
    if (entry === void 0) {
      return;
    }
    this.pending.delete(requestId);
    entry.reject(reason);
  }
  /** True if `requestId` has an in-flight registration. */
  has(requestId) {
    return this.pending.has(requestId);
  }
  /**
   * Register, then invoke `send` synchronously. If `send` throws, the
   * pending entry is cleared and the promise rejects with the thrown
   * error.
   */
  sendAndAwait(message, send) {
    return __async(this, null, function* () {
      const promise = this.register(message.requestId);
      try {
        send(message);
      } catch (err) {
        this.reject(message.requestId, err);
      }
      return promise;
    });
  }
};

// node_modules/@azure/msal-browser/dist/naa/BridgeProxy.mjs
var BridgeProxy = class _BridgeProxy {
  /**
   * initializeNestedAppAuthBridge - Initializes the bridge to the host app
   * @returns a promise that resolves to an InitializeBridgeResponse or rejects with an Error
   * @remarks This method will be called by the create factory method
   * @remarks If the bridge is not available, this method will throw an error
   */
  static initializeNestedAppAuthBridge() {
    return __async(this, null, function* () {
      if (window === void 0) {
        throw new Error("window is undefined");
      }
      if (window.nestedAppAuthBridge === void 0) {
        throw new Error("window.nestedAppAuthBridge is undefined");
      }
      try {
        window.nestedAppAuthBridge.addEventListener("message", (response) => {
          const responsePayload = typeof response === "string" ? response : response.data;
          const responseEnvelope = JSON.parse(responsePayload);
          if (responseEnvelope.success) {
            _BridgeProxy.pendingRegistry.resolve(responseEnvelope.requestId, responseEnvelope);
          } else {
            _BridgeProxy.pendingRegistry.reject(responseEnvelope.requestId, responseEnvelope.error);
          }
        });
        const bridgeResponse = yield _BridgeProxy.sendRequestViaRegistry(_BridgeProxy.buildRequest("GetInitContext"));
        return _BridgeProxy.validateBridgeResultOrThrow(bridgeResponse.initContext);
      } catch (error) {
        window.console.log(error);
        throw error;
      }
    });
  }
  /**
   * getTokenInteractive - Attempts to get a token interactively from the bridge
   * @param request A token request
   * @returns a promise that resolves to an auth result or rejects with a BridgeError
   */
  getTokenInteractive(request) {
    return this.getToken("GetTokenPopup", request);
  }
  /**
   * getTokenSilent Attempts to get a token silently from the bridge
   * @param request A token request
   * @returns a promise that resolves to an auth result or rejects with a BridgeError
   */
  getTokenSilent(request) {
    return this.getToken("GetToken", request);
  }
  getToken(requestType, request) {
    return __async(this, null, function* () {
      const result = yield this.sendRequest(requestType, {
        tokenParams: request
      });
      return {
        token: _BridgeProxy.validateBridgeResultOrThrow(result.token),
        account: _BridgeProxy.validateBridgeResultOrThrow(result.account)
      };
    });
  }
  getHostCapabilities() {
    return this.capabilities ?? null;
  }
  getAccountContext() {
    return this.accountContext ? this.accountContext : null;
  }
  static buildRequest(method, requestParams) {
    return __spreadValues({
      messageType: "NestedAppAuthRequest",
      method,
      requestId: createNewGuid(),
      sendTime: Date.now(),
      clientLibrary: BrowserConstants.MSAL_SKU,
      clientLibraryVersion: version
    }, requestParams);
  }
  /**
   * A method used to send a request to the bridge
   * @param request A token request
   * @returns a promise that resolves to a response of provided type or rejects with a BridgeError
   */
  sendRequest(method, requestParams) {
    return _BridgeProxy.sendRequestViaRegistry(_BridgeProxy.buildRequest(method, requestParams));
  }
  /**
   * Registers `message.requestId` with the shared pending-request
   * registry, then posts the envelope over the host bridge. Resolves
   * with the matching response envelope; rejects with the raw
   * `BridgeError` payload.
   */
  static sendRequestViaRegistry(message) {
    const correlationKey = {
      requestId: message.requestId,
      type: message.method
    };
    return _BridgeProxy.pendingRegistry.sendAndAwait(correlationKey, () => {
      window.nestedAppAuthBridge.postMessage(JSON.stringify(message));
    });
  }
  static validateBridgeResultOrThrow(input) {
    if (input === void 0) {
      const bridgeError = {
        status: BridgeStatusCode.NestedAppAuthUnavailable
      };
      throw bridgeError;
    }
    return input;
  }
  /**
   * Private constructor for BridgeProxy
   * @param sdkName The name of the SDK being used to make requests on behalf of the app
   * @param sdkVersion The version of the SDK being used to make requests on behalf of the app
   * @param capabilities The capabilities of the bridge / SDK / platform broker
   */
  constructor(sdkName, sdkVersion, accountContext, capabilities) {
    this.sdkName = sdkName;
    this.sdkVersion = sdkVersion;
    this.accountContext = accountContext;
    this.capabilities = capabilities;
  }
  /**
   * Factory method for creating an implementation of IBridgeProxy
   * @returns A promise that resolves to a BridgeProxy implementation
   */
  static create() {
    return __async(this, null, function* () {
      const response = yield _BridgeProxy.initializeNestedAppAuthBridge();
      return new _BridgeProxy(response.sdkName, response.sdkVersion, response.accountContext, response.capabilities);
    });
  }
};
BridgeProxy.pendingRegistry = new PendingRequestRegistry();

// node_modules/@azure/msal-browser/dist/operatingcontext/NestedAppOperatingContext.mjs
var NestedAppOperatingContext = class _NestedAppOperatingContext extends BaseOperatingContext {
  constructor() {
    super(...arguments);
    this.bridgeProxy = void 0;
    this.accountContext = null;
  }
  /**
   * Return the module name.  Intended for use with import() to enable dynamic import
   * of the implementation associated with this operating context
   * @returns
   */
  getModuleName() {
    return _NestedAppOperatingContext.MODULE_NAME;
  }
  /**
   * Returns the unique identifier for this operating context
   * @returns string
   */
  getId() {
    return _NestedAppOperatingContext.ID;
  }
  /**
   * Returns the current BridgeProxy
   * @returns IBridgeProxy | undefined
   */
  getBridgeProxy() {
    return this.bridgeProxy;
  }
  /**
   * Checks whether the operating context is available.
   * Confirms that the code is running a browser rather.  This is required.
   * @param correlationId
   * @returns Promise<boolean> indicating whether this operating context is currently available.
   */
  initialize(correlationId) {
    return __async(this, null, function* () {
      const cid = correlationId || "";
      try {
        if (typeof window !== "undefined") {
          if (typeof window.__initializeNestedAppAuth === "function") {
            yield window.__initializeNestedAppAuth();
          }
          const bridgeProxy = yield BridgeProxy.create();
          this.accountContext = bridgeProxy.getAccountContext();
          this.bridgeProxy = bridgeProxy;
          this.available = bridgeProxy !== void 0;
        }
      } catch (ex) {
        this.logger.infoPii(`1mdxyj ${ex}`, cid);
      }
      this.logger.info(`12jy9a ${this.available}`, cid);
      return this.available;
    });
  }
};
NestedAppOperatingContext.MODULE_NAME = "";
NestedAppOperatingContext.ID = "NestedAppOperatingContext";

// node_modules/@azure/msal-browser/dist/app/PublicClientApplication.mjs
var PublicClientApplication = class {
  /**
   * @constructor
   * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
   *
   * Important attributes in the Configuration object for auth are:
   * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
   * - authority: the authority URL for your application.
   * - redirect_uri: the uri of your application registered in the portal.
   *
   * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
   * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
   * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
   * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
   * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
   * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
   *
   * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
   * Full B2C functionality will be available in this library in future versions.
   *
   * @param configuration Object for the MSAL PublicClientApplication instance
   * @param IController Optional parameter to explictly set the controller. (Will be removed when we remove public constructor)
   */
  constructor(configuration, controller) {
    this.controller = controller || new StandardController(new StandardOperatingContext(configuration, {
      waitForPopupResponse: this.waitForPopupResponse.bind(this),
      waitForIframeResponse: this.waitForIframeResponse.bind(this)
    }));
  }
  /**
   * Waits for the auth response from a popup window opened by MSAL.
   *
   * The default implementation delegates to MSAL's `BroadcastChannel`-based bridge.
   * Subclasses must return the raw response string (hash/query/fragment), or reject
   * with an `AuthError` on failure.
   *
   * @internal
   * @param request The in-flight authorization or end-session request.
   * @param popupWindow The popup window opened by MSAL.
   * @param popupWindowParent The parent window that opened the popup.
   */
  waitForPopupResponse(request, popupWindow, popupWindowParent) {
    return __async(this, null, function* () {
      const controller = this.controller;
      return waitForBridgeResponse(controller.getConfiguration().system.popupBridgeTimeout, controller.getLogger(), request, controller.getPerformanceClient());
    });
  }
  /**
   * Waits for the auth response from a hidden iframe used by MSAL silent flows.
   *
   * The default implementation delegates to MSAL's `BroadcastChannel`-based bridge.
   * Subclasses must return the raw response string (hash/query/fragment), or reject
   * with an `AuthError` on failure.
   *
   * @internal
   * @param iframe The hidden iframe MSAL attached to the document.
   * @param request The in-flight authorization request.
   */
  waitForIframeResponse(iframe, request) {
    return __async(this, null, function* () {
      const controller = this.controller;
      const config = controller.getConfiguration();
      return waitForBridgeResponse(config.system.iframeBridgeTimeout, controller.getLogger(), request, controller.getPerformanceClient(), config.experimental);
    });
  }
  /**
   * Initializer function to perform async startup tasks such as connecting to WAM extension
   * @param request {?InitializeApplicationRequest}
   */
  initialize(request) {
    return __async(this, null, function* () {
      return this.controller.initialize(request);
    });
  }
  /**
   * Use when you want to obtain an access_token for your API via opening a popup window in the user's browser
   *
   * @param request
   *
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  acquireTokenPopup(request) {
    return __async(this, null, function* () {
      return this.controller.acquireTokenPopup(request);
    });
  }
  /**
   * Use when you want to obtain an access_token for your API by redirecting the user's browser window to the authorization endpoint. This function redirects
   * the page, so any code that follows this function will not execute.
   *
   * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
   * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
   *
   * @param request
   */
  acquireTokenRedirect(request) {
    return this.controller.acquireTokenRedirect(request);
  }
  /**
   * Silently acquire an access token for a given set of scopes. Returns currently processing promise if parallel requests are made.
   *
   * @param {@link (SilentRequest:type)}
   * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthenticationResult} object
   */
  acquireTokenSilent(silentRequest) {
    return this.controller.acquireTokenSilent(silentRequest);
  }
  /**
   * This function redeems an authorization code (passed as code) from the eSTS token endpoint.
   * This authorization code should be acquired server-side using a confidential client to acquire a spa_code.
   * This API is not indended for normal authorization code acquisition and redemption.
   *
   * Redemption of this authorization code will not require PKCE, as it was acquired by a confidential client.
   *
   * @param request {@link AuthorizationCodeRequest}
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  acquireTokenByCode(request) {
    return this.controller.acquireTokenByCode(request);
  }
  /**
   * Adds event callbacks to array
   * @param callback
   * @param eventTypes
   */
  addEventCallback(callback, eventTypes) {
    return this.controller.addEventCallback(callback, eventTypes);
  }
  /**
   * Removes callback with provided id from callback array
   * @param callbackId
   */
  removeEventCallback(callbackId) {
    return this.controller.removeEventCallback(callbackId);
  }
  /**
   * Registers a callback to receive performance events.
   *
   * @param {PerformanceCallbackFunction} callback
   * @returns {string}
   */
  addPerformanceCallback(callback) {
    return this.controller.addPerformanceCallback(callback);
  }
  /**
   * Removes a callback registered with addPerformanceCallback.
   *
   * @param {string} callbackId
   * @returns {boolean}
   */
  removePerformanceCallback(callbackId) {
    return this.controller.removePerformanceCallback(callbackId);
  }
  /**
   * Returns the first account found in the cache that matches the account filter passed in.
   * @param accountFilter
   * @returns The first account found in the cache matching the provided filter or null if no account could be found.
   */
  getAccount(accountFilter) {
    return this.controller.getAccount(accountFilter);
  }
  /**
   * Returns all the accounts in the cache that match the optional filter. If no filter is provided, all accounts are returned.
   * @param accountFilter - (Optional) filter to narrow down the accounts returned
   * @returns Array of AccountInfo objects in cache
   */
  getAllAccounts(accountFilter) {
    return this.controller.getAllAccounts(accountFilter);
  }
  /**
   * Event handler function which allows users to fire events after the PublicClientApplication object
   * has loaded during redirect flows. This should be invoked on all page loads involved in redirect
   * auth flows.
   * @param hash Hash to process. Defaults to the current value of window.location.hash. Only needs to be provided explicitly if the response to be handled is not contained in the current value.
   * @param options Object containing optional configuration for redirect promise handling.
   * @returns Token response or null. If the return value is null, then no auth redirect was detected.
   */
  handleRedirectPromise(options) {
    return this.controller.handleRedirectPromise(options);
  }
  /**
   * Use when initiating the login process via opening a popup window in the user's browser
   *
   * @param request
   *
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  loginPopup(request) {
    return this.controller.loginPopup(request);
  }
  /**
   * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
   * any code that follows this function will not execute.
   *
   * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
   * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
   *
   * @param request
   */
  loginRedirect(request) {
    return this.controller.loginRedirect(request);
  }
  /**
   * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
   * Default behaviour is to redirect the user to `window.location.href`.
   * @param logoutRequest
   */
  logoutRedirect(logoutRequest) {
    return this.controller.logoutRedirect(logoutRequest);
  }
  /**
   * Clears local cache for the current user then opens a popup window prompting the user to sign-out of the server
   * @param logoutRequest
   */
  logoutPopup(logoutRequest) {
    return this.controller.logoutPopup(logoutRequest);
  }
  /**
   * This function uses a hidden iframe to fetch an authorization code from the eSTS. There are cases where this may not work:
   * - Any browser using a form of Intelligent Tracking Prevention
   * - If there is not an established session with the service
   *
   * In these cases, the request must be done inside a popup or full frame redirect.
   *
   * For the cases where interaction is required, you cannot send a request with prompt=none.
   *
   * If your refresh token has expired, you can use this function to fetch a new set of tokens silently as long as
   * you session on the server still exists.
   * @param request {@link SsoSilentRequest}
   *
   * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
   */
  ssoSilent(request) {
    return this.controller.ssoSilent(request);
  }
  /**
   * Returns the logger instance
   */
  getLogger() {
    return this.controller.getLogger();
  }
  /**
   * Replaces the default logger set in configurations with new Logger with new configurations
   * @param logger Logger instance
   */
  setLogger(logger) {
    this.controller.setLogger(logger);
  }
  /**
   * Sets the account to use as the active account. If no account is passed to the acquireToken APIs, then MSAL will use this active account.
   * @param account
   */
  setActiveAccount(account) {
    this.controller.setActiveAccount(account);
  }
  /**
   * Gets the currently active account
   */
  getActiveAccount() {
    return this.controller.getActiveAccount();
  }
  /**
   * Called by wrapper libraries (Angular & React) to set SKU and Version passed down to telemetry, logger, etc.
   * @param sku
   * @param version
   */
  initializeWrapperLibrary(sku, version2) {
    return this.controller.initializeWrapperLibrary(sku, version2);
  }
  /**
   * Sets navigation client
   * @param navigationClient
   */
  setNavigationClient(navigationClient) {
    this.controller.setNavigationClient(navigationClient);
  }
  /**
   * Returns the configuration object
   * @internal
   */
  getConfiguration() {
    return this.controller.getConfiguration();
  }
  /**
   * Hydrates cache with the tokens and account in the AuthenticationResult object
   * @param result
   * @param request - The request object that was used to obtain the AuthenticationResult
   * @returns
   */
  hydrateCache(result, request) {
    return __async(this, null, function* () {
      return this.controller.hydrateCache(result, request);
    });
  }
  /**
   * Clears tokens and account from the browser cache.
   * @param logoutRequest
   */
  clearCache(logoutRequest) {
    return this.controller.clearCache(logoutRequest);
  }
};
function createNestablePublicClientApplication(configuration, correlationId, pcaFactory) {
  return __async(this, null, function* () {
    const nestedAppAuth = new NestedAppOperatingContext(configuration);
    yield nestedAppAuth.initialize(correlationId);
    if (nestedAppAuth.isAvailable()) {
      const cid = correlationId || createNewGuid();
      const controller = new NestedAppAuthController(nestedAppAuth);
      const nestablePCA = pcaFactory ? pcaFactory(configuration, controller) : new PublicClientApplication(configuration, controller);
      yield nestablePCA.initialize({ correlationId: cid });
      return nestablePCA;
    }
    return createStandardPublicClientApplication(configuration);
  });
}
function createStandardPublicClientApplication(configuration) {
  return __async(this, null, function* () {
    const pca = new PublicClientApplication(configuration);
    yield pca.initialize();
    return pca;
  });
}

// node_modules/@azure/msal-browser/dist/app/IPublicClientApplication.mjs
var stubbedPublicClientApplication = {
  initialize: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  acquireTokenPopup: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  acquireTokenRedirect: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  acquireTokenSilent: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  acquireTokenByCode: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  getAllAccounts: () => {
    return [];
  },
  getAccount: () => {
    return null;
  },
  handleRedirectPromise: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  loginPopup: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  loginRedirect: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  logoutRedirect: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  logoutPopup: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  ssoSilent: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  addEventCallback: () => {
    return null;
  },
  removeEventCallback: () => {
    return;
  },
  addPerformanceCallback: () => {
    return "";
  },
  removePerformanceCallback: () => {
    return false;
  },
  getLogger: () => {
    throw createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, "");
  },
  setLogger: () => {
    return;
  },
  setActiveAccount: () => {
    return;
  },
  getActiveAccount: () => {
    return null;
  },
  initializeWrapperLibrary: () => {
    return;
  },
  setNavigationClient: () => {
    return;
  },
  getConfiguration: () => {
    throw createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, "");
  },
  hydrateCache: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  },
  clearCache: () => {
    return Promise.reject(createBrowserConfigurationAuthError(stubbedPublicClientApplicationCalled, ""));
  }
};

// node_modules/@azure/msal-browser/dist/cache/TokenCache.mjs
function loadExternalTokens(_0, _1, _2, _3) {
  return __async(this, arguments, function* (config, request, response, options, performanceClient = new StubPerformanceClient()) {
    blockNonBrowserEnvironment();
    const browserConfig = buildConfiguration(config, true);
    const correlationId = request.correlationId || createNewGuid();
    const rootMeasurement = performanceClient.startMeasurement(LoadExternalTokens, correlationId);
    try {
      const idTokenClaims = response.id_token ? AuthToken_exports.extractTokenClaims(response.id_token, base64Decode, correlationId) : void 0;
      const kmsi = AuthToken_exports.isKmsi(idTokenClaims || {});
      const authorityOptions = {
        protocolMode: browserConfig.system.protocolMode,
        knownAuthorities: browserConfig.auth.knownAuthorities,
        cloudDiscoveryMetadata: browserConfig.auth.cloudDiscoveryMetadata,
        authorityMetadata: browserConfig.auth.authorityMetadata
      };
      const logger = new Logger(browserConfig.system.loggerOptions || {}, name, version);
      const cryptoOps = new CryptoOps(logger, browserConfig.telemetry.client);
      const storage = new BrowserCacheManager(browserConfig.auth.clientId, browserConfig.cache, cryptoOps, logger, browserConfig.telemetry.client, new EventHandler(logger), buildStaticAuthorityOptions(browserConfig.auth), new TokenBindingKeyManager(logger, browserConfig.telemetry.client));
      yield storage.initialize(correlationId);
      const authorityString = request.authority || browserConfig.auth.authority;
      const authority = yield AuthorityFactory_exports.createDiscoveredInstance(Authority.generateAuthority(authorityString, request.azureCloudOptions), browserConfig.system.networkClient, storage, authorityOptions, logger, correlationId, performanceClient);
      const cacheRecordAccount = yield invokeAsync(loadAccount, LoadAccount, logger, performanceClient, correlationId)(request, options.clientInfo || response.client_info || "", correlationId, storage, logger, cryptoOps, authority, idTokenClaims, performanceClient);
      const idToken = yield invokeAsync(loadIdToken, LoadIdToken, logger, performanceClient, correlationId)(response, cacheRecordAccount.homeAccountId, cacheRecordAccount.environment, cacheRecordAccount.realm, kmsi, correlationId, storage, logger, config.auth.clientId);
      const accessToken = yield invokeAsync(loadAccessToken, LoadAccessToken, logger, performanceClient, correlationId)(request, response, cacheRecordAccount.homeAccountId, cacheRecordAccount.environment, cacheRecordAccount.realm, kmsi, options, correlationId, storage, logger, config.auth.clientId);
      const refreshToken = yield invokeAsync(loadRefreshToken, LoadRefreshToken, logger, performanceClient, correlationId)(response, cacheRecordAccount.homeAccountId, cacheRecordAccount.environment, kmsi, correlationId, storage, logger, config.auth.clientId, performanceClient);
      rootMeasurement.end({ success: true }, void 0, AccountEntityUtils_exports.getAccountInfo(cacheRecordAccount));
      return generateAuthenticationResult(request, {
        account: cacheRecordAccount,
        idToken,
        accessToken,
        refreshToken
      }, authority, idTokenClaims);
    } catch (error) {
      rootMeasurement.end({ success: false }, error);
      throw error;
    }
  });
}
function loadAccount(request, clientInfo, correlationId, storage, logger, cryptoObj, authority, idTokenClaims, performanceClient) {
  return __async(this, null, function* () {
    logger.verbose("0ke46k", correlationId);
    if (request.account) {
      const accountEntity = AccountEntityUtils_exports.createAccountEntityFromAccountInfo(request.account);
      yield storage.setAccount(accountEntity, correlationId, AuthToken_exports.isKmsi(idTokenClaims || {}), ApiId.loadExternalTokens);
      return accountEntity;
    } else if (!clientInfo && !idTokenClaims) {
      logger.error("0hzcn4", correlationId);
      throw createBrowserAuthError(unableToLoadToken, "");
    }
    const homeAccountId = AccountEntityUtils_exports.generateHomeAccountId(clientInfo, authority.authorityType, logger, cryptoObj, correlationId, idTokenClaims);
    const claimsTenantId = idTokenClaims?.tid;
    const cachedAccount = buildAccountToCache(
      storage,
      authority,
      homeAccountId,
      base64Decode,
      correlationId,
      idTokenClaims,
      clientInfo,
      authority.getPreferredCache(),
      claimsTenantId,
      void 0,
      // authCodePayload
      void 0,
      // nativeAccountId
      logger,
      performanceClient
    );
    yield storage.setAccount(cachedAccount, correlationId, AuthToken_exports.isKmsi(idTokenClaims || {}), ApiId.loadExternalTokens);
    return cachedAccount;
  });
}
function loadIdToken(response, homeAccountId, environment, tenantId, kmsi, correlationId, storage, logger, clientId) {
  return __async(this, null, function* () {
    if (!response.id_token) {
      logger.verbose("1pm7g1", correlationId);
      return null;
    }
    logger.verbose("168lyi", correlationId);
    const idTokenEntity = CacheHelpers_exports.createIdTokenEntity(homeAccountId, environment, response.id_token, clientId, tenantId);
    yield storage.setIdTokenCredential(idTokenEntity, correlationId, kmsi);
    return idTokenEntity;
  });
}
function loadAccessToken(request, response, homeAccountId, environment, tenantId, kmsi, options, correlationId, storage, logger, clientId) {
  return __async(this, null, function* () {
    if (!response.access_token) {
      logger.verbose("1ckp9e", correlationId);
      return null;
    } else if (!response.expires_in) {
      logger.error("15mzx8", correlationId);
      return null;
    } else if (!response.scope && (!request.scopes || !request.scopes.length)) {
      logger.error("1h7xse", correlationId);
      return null;
    }
    logger.verbose("01kmxb", correlationId);
    const scopes = response.scope ? ScopeSet.fromString(response.scope, correlationId) : new ScopeSet(request.scopes, correlationId);
    const expiresOn = options.expiresOn || response.expires_in + TimeUtils_exports.nowSeconds();
    const extendedExpiresOn = options.extendedExpiresOn || (response.ext_expires_in || response.expires_in) + TimeUtils_exports.nowSeconds();
    const accessTokenEntity = CacheHelpers_exports.createAccessTokenEntity(homeAccountId, environment, response.access_token, clientId, tenantId, scopes.printScopes(), expiresOn, extendedExpiresOn, base64Decode, correlationId);
    yield storage.setAccessTokenCredential(accessTokenEntity, correlationId, kmsi);
    return accessTokenEntity;
  });
}
function loadRefreshToken(response, homeAccountId, environment, kmsi, correlationId, storage, logger, clientId, performanceClient) {
  return __async(this, null, function* () {
    if (!response.refresh_token) {
      logger.verbose("1l7um5", correlationId);
      return null;
    }
    const expiresOn = response.refresh_token_expires_in ? response.refresh_token_expires_in + TimeUtils_exports.nowSeconds() : void 0;
    performanceClient.addFields({
      extRtExpiresOnSeconds: expiresOn
    }, correlationId);
    logger.verbose("0qy8ev", correlationId);
    const refreshTokenEntity = CacheHelpers_exports.createRefreshTokenEntity(
      homeAccountId,
      environment,
      response.refresh_token,
      clientId,
      response.foci,
      void 0,
      // userAssertionHash
      expiresOn
    );
    yield storage.setRefreshTokenCredential(refreshTokenEntity, correlationId, kmsi);
    return refreshTokenEntity;
  });
}
function generateAuthenticationResult(request, cacheRecord, authority, idTokenClaims) {
  let accessToken = "";
  let responseScopes = [];
  let expiresOn = null;
  let extExpiresOn;
  if (cacheRecord?.accessToken) {
    accessToken = cacheRecord.accessToken.secret;
    responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target, request.correlationId || "").asArray();
    expiresOn = TimeUtils_exports.toDateFromSeconds(cacheRecord.accessToken.expiresOn);
    extExpiresOn = TimeUtils_exports.toDateFromSeconds(cacheRecord.accessToken.extendedExpiresOn);
  }
  const accountEntity = cacheRecord.account;
  return {
    authority: authority.canonicalAuthority,
    uniqueId: cacheRecord.account.localAccountId,
    tenantId: cacheRecord.account.realm,
    scopes: responseScopes,
    account: AccountEntityUtils_exports.getAccountInfo(accountEntity),
    idToken: cacheRecord.idToken?.secret || "",
    idTokenClaims: idTokenClaims || {},
    accessToken,
    fromCache: true,
    expiresOn,
    correlationId: request.correlationId || "",
    requestId: "",
    extExpiresOn,
    familyId: cacheRecord.refreshToken?.familyId || "",
    tokenType: cacheRecord?.accessToken?.tokenType || "",
    state: request.state || "",
    cloudGraphHostName: accountEntity.cloudGraphHostName || "",
    msGraphHost: accountEntity.msGraphHost || "",
    fromPlatformBroker: false
  };
}

// node_modules/@azure/msal-browser/dist/event/EventMessage.mjs
var EventMessageUtils = class {
  /**
   * Gets interaction status from event message
   * @param message
   * @param currentStatus
   */
  static getInteractionStatusFromEvent(message, currentStatus) {
    switch (message.eventType) {
      case EventType.ACQUIRE_TOKEN_START:
        if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
          return InteractionStatus.AcquireToken;
        }
        break;
      case EventType.HANDLE_REDIRECT_START:
        return InteractionStatus.HandleRedirect;
      case EventType.LOGOUT_START:
        return InteractionStatus.Logout;
      case EventType.LOGOUT_END:
        if (currentStatus && currentStatus !== InteractionStatus.Logout) {
          break;
        }
        return InteractionStatus.None;
      case EventType.HANDLE_REDIRECT_END:
        if (currentStatus && currentStatus !== InteractionStatus.HandleRedirect) {
          break;
        }
        return InteractionStatus.None;
      case EventType.ACQUIRE_TOKEN_SUCCESS:
      case EventType.ACQUIRE_TOKEN_FAILURE:
      case EventType.RESTORE_FROM_BFCACHE:
        if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
          if (currentStatus && currentStatus !== InteractionStatus.AcquireToken) {
            break;
          }
          return InteractionStatus.None;
        }
        break;
    }
    return null;
  }
};

// node_modules/@azure/msal-browser/dist/crypto/SignedHttpRequest.mjs
var SignedHttpRequest = class {
  constructor(shrParameters, shrOptions) {
    const loggerOptions = shrOptions && shrOptions.loggerOptions || {};
    this.logger = new Logger(loggerOptions, name, version);
    this.cryptoOps = new CryptoOps(this.logger);
    const tokenBindingKeyManager = new TokenBindingKeyManager(this.logger);
    this.popTokenGenerator = new PopTokenGenerator(this.cryptoOps, tokenBindingKeyManager, new StubPerformanceClient());
    this.shrParameters = shrParameters;
  }
  /**
   * Generates and caches a keypair for the given request options.
   * @returns Public key digest, which should be sent to the token issuer.
   */
  generatePublicKeyThumbprint() {
    return __async(this, null, function* () {
      const { kid } = yield this.popTokenGenerator.generateKid(this.shrParameters);
      return kid;
    });
  }
  /**
   * Generates a signed http request for the given payload with the given key.
   * @param payload Payload to sign (e.g. access token)
   * @param publicKeyThumbprint Public key digest (from generatePublicKeyThumbprint API)
   * @param claims Additional claims to include/override in the signed JWT
   * @returns Pop token signed with the corresponding private key
   */
  signRequest(payload, publicKeyThumbprint, claims) {
    return __async(this, null, function* () {
      return this.popTokenGenerator.signPayload(payload, publicKeyThumbprint, this.shrParameters, claims);
    });
  }
  /**
   * Removes cached keys from browser for given public key thumbprint
   * @param publicKeyThumbprint Public key digest (from generatePublicKeyThumbprint API)
   * @param correlationId
   * @returns If keys are properly deleted
   */
  removeKeys(publicKeyThumbprint, correlationId) {
    return __async(this, null, function* () {
      return this.cryptoOps.removeTokenBindingKey(publicKeyThumbprint, correlationId);
    });
  }
};

// node_modules/@azure/msal-browser/dist/telemetry/BrowserPerformanceClient.mjs
function getPerfMeasurementModule() {
  let sessionStorage;
  try {
    sessionStorage = window[BrowserCacheLocation.SessionStorage];
    const perfEnabled = sessionStorage?.getItem(BROWSER_PERF_ENABLED_KEY);
    if (Number(perfEnabled) === 1) {
      return import("./BrowserPerformanceMeasurement-H6ET7EDW.js");
    }
  } catch (e) {
  }
  return void 0;
}
function supportsBrowserPerformanceNow() {
  return typeof window !== "undefined" && typeof window.performance !== "undefined" && typeof window.performance.now === "function";
}
function getPerfDurationMs(startTime) {
  if (!startTime || !supportsBrowserPerformanceNow()) {
    return void 0;
  }
  return Math.round(window.performance.now() - startTime);
}
var BrowserPerformanceClient = class extends PerformanceClient {
  constructor(configuration, intFields) {
    super(configuration.auth.clientId, configuration.auth.authority || `${Constants_exports.DEFAULT_AUTHORITY}`, new Logger(configuration.system?.loggerOptions || {}, name, version), name, version, configuration.telemetry?.application || {
      appName: "",
      appVersion: ""
    }, intFields);
  }
  generateId() {
    return createNewGuid();
  }
  getPageVisibility() {
    return document.visibilityState?.toString() || null;
  }
  getOnlineStatus() {
    return typeof navigator !== "undefined" ? navigator.onLine : null;
  }
  deleteIncompleteSubMeasurements(inProgressEvent) {
    void getPerfMeasurementModule()?.then((module) => {
      const rootEvent = this.eventsByCorrelationId.get(inProgressEvent.event.correlationId);
      const isRootEvent = rootEvent && rootEvent.eventId === inProgressEvent.event.eventId;
      const incompleteMeasurements = [];
      if (isRootEvent && rootEvent?.incompleteSubMeasurements) {
        rootEvent.incompleteSubMeasurements.forEach((subMeasurement) => {
          incompleteMeasurements.push(__spreadValues({}, subMeasurement));
        });
      }
      module.BrowserPerformanceMeasurement.flushMeasurements(inProgressEvent.event.correlationId, incompleteMeasurements);
    });
  }
  /**
   * Starts measuring performance for a given operation. Returns a function that should be used to end the measurement.
   * Also captures browser page visibilityState.
   *
   * @param {PerformanceEvents} measureName
   * @param {?string} [correlationId]
   * @returns {((event?: Partial<PerformanceEvent>) => PerformanceEvent| null)}
   */
  startMeasurement(measureName, correlationId) {
    const startPageVisibility = this.getPageVisibility();
    const startOnlineStatus = this.getOnlineStatus();
    const inProgressEvent = super.startMeasurement(measureName, correlationId);
    const startTime = supportsBrowserPerformanceNow() ? window.performance.now() : void 0;
    const browserMeasurement = getPerfMeasurementModule()?.then((module) => {
      return new module.BrowserPerformanceMeasurement(measureName, inProgressEvent.event.correlationId);
    });
    void browserMeasurement?.then((measurement) => measurement.startMeasurement());
    return __spreadProps(__spreadValues({}, inProgressEvent), {
      end: (event, error, account) => {
        const networkInfo = getNetworkInfo();
        const res = inProgressEvent.end(__spreadProps(__spreadValues({}, event), {
          startPageVisibility,
          startOnlineStatus,
          endPageVisibility: this.getPageVisibility(),
          durationMs: getPerfDurationMs(startTime),
          networkEffectiveType: networkInfo.effectiveType,
          networkRtt: networkInfo.rtt
        }), error, account);
        void browserMeasurement?.then((measurement) => measurement.endMeasurement());
        this.deleteIncompleteSubMeasurements(inProgressEvent);
        return res;
      },
      discard: () => {
        inProgressEvent.discard();
        void browserMeasurement?.then((measurement) => measurement.flushMeasurement());
        this.deleteIncompleteSubMeasurements(inProgressEvent);
      }
    });
  }
};

// node_modules/@azure/msal-browser/dist/index.mjs
var AuthenticationScheme = Constants_exports.AuthenticationScheme;
var ResponseMode = Constants_exports.ResponseMode;
var PromptValue = Constants_exports.PromptValue;
var JsonWebTokenTypes = Constants_exports.JsonWebTokenTypes;
var OIDC_DEFAULT_SCOPES = Constants_exports.OIDC_DEFAULT_SCOPES;

export {
  MemoryStorage,
  BrowserRootPerformanceEvents_exports,
  LocalStorage,
  SessionStorage,
  EventType,
  EventHandler,
  isPlatformBrokerAvailable,
  PublicClientApplication,
  createNestablePublicClientApplication,
  createStandardPublicClientApplication,
  stubbedPublicClientApplication,
  loadExternalTokens,
  EventMessageUtils,
  SignedHttpRequest,
  BrowserPerformanceClient,
  AuthenticationScheme,
  ResponseMode,
  PromptValue,
  JsonWebTokenTypes,
  OIDC_DEFAULT_SCOPES
};
//# sourceMappingURL=chunk-B5KT7IW5.js.map
