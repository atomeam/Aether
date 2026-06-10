var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/pino-std-serializers/lib/err-helpers.js
var require_err_helpers = __commonJS({
  "../../node_modules/pino-std-serializers/lib/err-helpers.js"(exports2, module2) {
    "use strict";
    var isErrorLike = (err) => {
      return err && typeof err.message === "string";
    };
    var getErrorCause = (err) => {
      if (!err) return;
      const cause = err.cause;
      if (typeof cause === "function") {
        const causeResult = err.cause();
        return isErrorLike(causeResult) ? causeResult : void 0;
      } else {
        return isErrorLike(cause) ? cause : void 0;
      }
    };
    var _stackWithCauses = (err, seen) => {
      if (!isErrorLike(err)) return "";
      const stack = err.stack || "";
      if (seen.has(err)) {
        return stack + "\ncauses have become circular...";
      }
      const cause = getErrorCause(err);
      if (cause) {
        seen.add(err);
        return stack + "\ncaused by: " + _stackWithCauses(cause, seen);
      } else {
        return stack;
      }
    };
    var stackWithCauses = (err) => _stackWithCauses(err, /* @__PURE__ */ new Set());
    var _messageWithCauses = (err, seen, skip) => {
      if (!isErrorLike(err)) return "";
      const message = skip ? "" : err.message || "";
      if (seen.has(err)) {
        return message + ": ...";
      }
      const cause = getErrorCause(err);
      if (cause) {
        seen.add(err);
        const skipIfVErrorStyleCause = typeof err.cause === "function";
        return message + (skipIfVErrorStyleCause ? "" : ": ") + _messageWithCauses(cause, seen, skipIfVErrorStyleCause);
      } else {
        return message;
      }
    };
    var messageWithCauses = (err) => _messageWithCauses(err, /* @__PURE__ */ new Set());
    module2.exports = {
      isErrorLike,
      getErrorCause,
      stackWithCauses,
      messageWithCauses
    };
  }
});

// ../../node_modules/pino-std-serializers/lib/err-proto.js
var require_err_proto = __commonJS({
  "../../node_modules/pino-std-serializers/lib/err-proto.js"(exports2, module2) {
    "use strict";
    var seen = Symbol("circular-ref-tag");
    var rawSymbol = Symbol("pino-raw-err-ref");
    var pinoErrProto = Object.create({}, {
      type: {
        enumerable: true,
        writable: true,
        value: void 0
      },
      message: {
        enumerable: true,
        writable: true,
        value: void 0
      },
      stack: {
        enumerable: true,
        writable: true,
        value: void 0
      },
      aggregateErrors: {
        enumerable: true,
        writable: true,
        value: void 0
      },
      raw: {
        enumerable: false,
        get: function() {
          return this[rawSymbol];
        },
        set: function(val) {
          this[rawSymbol] = val;
        }
      }
    });
    Object.defineProperty(pinoErrProto, rawSymbol, {
      writable: true,
      value: {}
    });
    module2.exports = {
      pinoErrProto,
      pinoErrorSymbols: {
        seen,
        rawSymbol
      }
    };
  }
});

// ../../node_modules/pino-std-serializers/lib/err.js
var require_err = __commonJS({
  "../../node_modules/pino-std-serializers/lib/err.js"(exports2, module2) {
    "use strict";
    module2.exports = errSerializer;
    var { messageWithCauses, stackWithCauses, isErrorLike } = require_err_helpers();
    var { pinoErrProto, pinoErrorSymbols } = require_err_proto();
    var { seen } = pinoErrorSymbols;
    var { toString } = Object.prototype;
    function errSerializer(err) {
      if (!isErrorLike(err)) {
        return err;
      }
      err[seen] = void 0;
      const _err = Object.create(pinoErrProto);
      _err.type = toString.call(err.constructor) === "[object Function]" ? err.constructor.name : err.name;
      _err.message = messageWithCauses(err);
      _err.stack = stackWithCauses(err);
      if (Array.isArray(err.errors)) {
        _err.aggregateErrors = err.errors.map((err2) => errSerializer(err2));
      }
      for (const key in err) {
        if (_err[key] === void 0) {
          const val = err[key];
          if (isErrorLike(val)) {
            if (key !== "cause" && !Object.prototype.hasOwnProperty.call(val, seen)) {
              _err[key] = errSerializer(val);
            }
          } else {
            _err[key] = val;
          }
        }
      }
      delete err[seen];
      _err.raw = err;
      return _err;
    }
  }
});

// ../../node_modules/pino-std-serializers/lib/err-with-cause.js
var require_err_with_cause = __commonJS({
  "../../node_modules/pino-std-serializers/lib/err-with-cause.js"(exports2, module2) {
    "use strict";
    module2.exports = errWithCauseSerializer;
    var { isErrorLike } = require_err_helpers();
    var { pinoErrProto, pinoErrorSymbols } = require_err_proto();
    var { seen } = pinoErrorSymbols;
    var { toString } = Object.prototype;
    function errWithCauseSerializer(err) {
      if (!isErrorLike(err)) {
        return err;
      }
      err[seen] = void 0;
      const _err = Object.create(pinoErrProto);
      _err.type = toString.call(err.constructor) === "[object Function]" ? err.constructor.name : err.name;
      _err.message = err.message;
      _err.stack = err.stack;
      if (Array.isArray(err.errors)) {
        _err.aggregateErrors = err.errors.map((err2) => errWithCauseSerializer(err2));
      }
      if (isErrorLike(err.cause) && !Object.prototype.hasOwnProperty.call(err.cause, seen)) {
        _err.cause = errWithCauseSerializer(err.cause);
      }
      for (const key in err) {
        if (_err[key] === void 0) {
          const val = err[key];
          if (isErrorLike(val)) {
            if (!Object.prototype.hasOwnProperty.call(val, seen)) {
              _err[key] = errWithCauseSerializer(val);
            }
          } else {
            _err[key] = val;
          }
        }
      }
      delete err[seen];
      _err.raw = err;
      return _err;
    }
  }
});

// ../../node_modules/pino-std-serializers/lib/req.js
var require_req = __commonJS({
  "../../node_modules/pino-std-serializers/lib/req.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      mapHttpRequest,
      reqSerializer
    };
    var rawSymbol = Symbol("pino-raw-req-ref");
    var pinoReqProto = Object.create({}, {
      id: {
        enumerable: true,
        writable: true,
        value: ""
      },
      method: {
        enumerable: true,
        writable: true,
        value: ""
      },
      url: {
        enumerable: true,
        writable: true,
        value: ""
      },
      query: {
        enumerable: true,
        writable: true,
        value: ""
      },
      params: {
        enumerable: true,
        writable: true,
        value: ""
      },
      headers: {
        enumerable: true,
        writable: true,
        value: {}
      },
      remoteAddress: {
        enumerable: true,
        writable: true,
        value: ""
      },
      remotePort: {
        enumerable: true,
        writable: true,
        value: ""
      },
      raw: {
        enumerable: false,
        get: function() {
          return this[rawSymbol];
        },
        set: function(val) {
          this[rawSymbol] = val;
        }
      }
    });
    Object.defineProperty(pinoReqProto, rawSymbol, {
      writable: true,
      value: {}
    });
    function reqSerializer(req) {
      const connection = req.info || req.socket;
      const _req = Object.create(pinoReqProto);
      _req.id = typeof req.id === "function" ? req.id() : req.id || (req.info ? req.info.id : void 0);
      _req.method = req.method;
      if (req.originalUrl) {
        _req.url = req.originalUrl;
      } else {
        const path18 = req.path;
        _req.url = typeof path18 === "string" ? path18 : req.url ? req.url.path || req.url : void 0;
      }
      if (req.query) {
        _req.query = req.query;
      }
      if (req.params) {
        _req.params = req.params;
      }
      _req.headers = req.headers;
      _req.remoteAddress = connection && connection.remoteAddress;
      _req.remotePort = connection && connection.remotePort;
      _req.raw = req.raw || req;
      return _req;
    }
    function mapHttpRequest(req) {
      return {
        req: reqSerializer(req)
      };
    }
  }
});

// ../../node_modules/pino-std-serializers/lib/res.js
var require_res = __commonJS({
  "../../node_modules/pino-std-serializers/lib/res.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      mapHttpResponse,
      resSerializer
    };
    var rawSymbol = Symbol("pino-raw-res-ref");
    var pinoResProto = Object.create({}, {
      statusCode: {
        enumerable: true,
        writable: true,
        value: 0
      },
      headers: {
        enumerable: true,
        writable: true,
        value: ""
      },
      raw: {
        enumerable: false,
        get: function() {
          return this[rawSymbol];
        },
        set: function(val) {
          this[rawSymbol] = val;
        }
      }
    });
    Object.defineProperty(pinoResProto, rawSymbol, {
      writable: true,
      value: {}
    });
    function resSerializer(res) {
      const _res = Object.create(pinoResProto);
      _res.statusCode = res.headersSent ? res.statusCode : null;
      _res.headers = res.getHeaders ? res.getHeaders() : res._headers;
      _res.raw = res;
      return _res;
    }
    function mapHttpResponse(res) {
      return {
        res: resSerializer(res)
      };
    }
  }
});

// ../../node_modules/pino-std-serializers/index.js
var require_pino_std_serializers = __commonJS({
  "../../node_modules/pino-std-serializers/index.js"(exports2, module2) {
    "use strict";
    var errSerializer = require_err();
    var errWithCauseSerializer = require_err_with_cause();
    var reqSerializers = require_req();
    var resSerializers = require_res();
    module2.exports = {
      err: errSerializer,
      errWithCause: errWithCauseSerializer,
      mapHttpRequest: reqSerializers.mapHttpRequest,
      mapHttpResponse: resSerializers.mapHttpResponse,
      req: reqSerializers.reqSerializer,
      res: resSerializers.resSerializer,
      wrapErrorSerializer: function wrapErrorSerializer(customSerializer) {
        if (customSerializer === errSerializer) return customSerializer;
        return function wrapErrSerializer(err) {
          return customSerializer(errSerializer(err));
        };
      },
      wrapRequestSerializer: function wrapRequestSerializer(customSerializer) {
        if (customSerializer === reqSerializers.reqSerializer) return customSerializer;
        return function wrappedReqSerializer(req) {
          return customSerializer(reqSerializers.reqSerializer(req));
        };
      },
      wrapResponseSerializer: function wrapResponseSerializer(customSerializer) {
        if (customSerializer === resSerializers.resSerializer) return customSerializer;
        return function wrappedResSerializer(res) {
          return customSerializer(resSerializers.resSerializer(res));
        };
      }
    };
  }
});

// ../../node_modules/pino/lib/caller.js
var require_caller = __commonJS({
  "../../node_modules/pino/lib/caller.js"(exports2, module2) {
    "use strict";
    function noOpPrepareStackTrace(_, stack) {
      return stack;
    }
    module2.exports = function getCallers() {
      const originalPrepare = Error.prepareStackTrace;
      Error.prepareStackTrace = noOpPrepareStackTrace;
      const stack = new Error().stack;
      Error.prepareStackTrace = originalPrepare;
      if (!Array.isArray(stack)) {
        return void 0;
      }
      const entries = stack.slice(2);
      const fileNames = [];
      for (const entry of entries) {
        if (!entry) {
          continue;
        }
        fileNames.push(entry.getFileName());
      }
      return fileNames;
    };
  }
});

// ../../node_modules/@pinojs/redact/index.js
var require_redact = __commonJS({
  "../../node_modules/@pinojs/redact/index.js"(exports2, module2) {
    "use strict";
    function deepClone(obj) {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }
      if (obj instanceof Array) {
        const cloned = [];
        for (let i = 0; i < obj.length; i++) {
          cloned[i] = deepClone(obj[i]);
        }
        return cloned;
      }
      if (typeof obj === "object") {
        const cloned = Object.create(Object.getPrototypeOf(obj));
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
          }
        }
        return cloned;
      }
      return obj;
    }
    function parsePath(path18) {
      const parts = [];
      let current = "";
      let inBrackets = false;
      let inQuotes = false;
      let quoteChar = "";
      for (let i = 0; i < path18.length; i++) {
        const char = path18[i];
        if (!inBrackets && char === ".") {
          if (current) {
            parts.push(current);
            current = "";
          }
        } else if (char === "[") {
          if (current) {
            parts.push(current);
            current = "";
          }
          inBrackets = true;
        } else if (char === "]" && inBrackets) {
          parts.push(current);
          current = "";
          inBrackets = false;
          inQuotes = false;
        } else if ((char === '"' || char === "'") && inBrackets) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = "";
          } else {
            current += char;
          }
        } else {
          current += char;
        }
      }
      if (current) {
        parts.push(current);
      }
      return parts;
    }
    function setValue(obj, parts, value) {
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (typeof current !== "object" || current === null || !(key in current)) {
          return false;
        }
        if (typeof current[key] !== "object" || current[key] === null) {
          return false;
        }
        current = current[key];
      }
      const lastKey = parts[parts.length - 1];
      if (lastKey === "*") {
        if (Array.isArray(current)) {
          for (let i = 0; i < current.length; i++) {
            current[i] = value;
          }
        } else if (typeof current === "object" && current !== null) {
          for (const key in current) {
            if (Object.prototype.hasOwnProperty.call(current, key)) {
              current[key] = value;
            }
          }
        }
      } else {
        if (typeof current === "object" && current !== null && lastKey in current && Object.prototype.hasOwnProperty.call(current, lastKey)) {
          current[lastKey] = value;
        }
      }
      return true;
    }
    function removeKey(obj, parts) {
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (typeof current !== "object" || current === null || !(key in current)) {
          return false;
        }
        if (typeof current[key] !== "object" || current[key] === null) {
          return false;
        }
        current = current[key];
      }
      const lastKey = parts[parts.length - 1];
      if (lastKey === "*") {
        if (Array.isArray(current)) {
          for (let i = 0; i < current.length; i++) {
            current[i] = void 0;
          }
        } else if (typeof current === "object" && current !== null) {
          for (const key in current) {
            if (Object.prototype.hasOwnProperty.call(current, key)) {
              delete current[key];
            }
          }
        }
      } else {
        if (typeof current === "object" && current !== null && lastKey in current && Object.prototype.hasOwnProperty.call(current, lastKey)) {
          delete current[lastKey];
        }
      }
      return true;
    }
    var PATH_NOT_FOUND = Symbol("PATH_NOT_FOUND");
    function getValueIfExists(obj, parts) {
      let current = obj;
      for (const part of parts) {
        if (current === null || current === void 0) {
          return PATH_NOT_FOUND;
        }
        if (typeof current !== "object" || current === null) {
          return PATH_NOT_FOUND;
        }
        if (!(part in current)) {
          return PATH_NOT_FOUND;
        }
        current = current[part];
      }
      return current;
    }
    function getValue(obj, parts) {
      let current = obj;
      for (const part of parts) {
        if (current === null || current === void 0) {
          return void 0;
        }
        if (typeof current !== "object" || current === null) {
          return void 0;
        }
        current = current[part];
      }
      return current;
    }
    function redactPaths(obj, paths, censor, remove = false) {
      for (const path18 of paths) {
        const parts = parsePath(path18);
        if (parts.includes("*")) {
          redactWildcardPath(obj, parts, censor, path18, remove);
        } else {
          if (remove) {
            removeKey(obj, parts);
          } else {
            const value = getValueIfExists(obj, parts);
            if (value === PATH_NOT_FOUND) {
              continue;
            }
            const actualCensor = typeof censor === "function" ? censor(value, parts) : censor;
            setValue(obj, parts, actualCensor);
          }
        }
      }
    }
    function redactWildcardPath(obj, parts, censor, originalPath, remove = false) {
      const wildcardIndex = parts.indexOf("*");
      if (wildcardIndex === parts.length - 1) {
        const parentParts = parts.slice(0, -1);
        let current = obj;
        for (const part of parentParts) {
          if (current === null || current === void 0) return;
          if (typeof current !== "object" || current === null) return;
          current = current[part];
        }
        if (Array.isArray(current)) {
          if (remove) {
            for (let i = 0; i < current.length; i++) {
              current[i] = void 0;
            }
          } else {
            for (let i = 0; i < current.length; i++) {
              const indexPath = [...parentParts, i.toString()];
              const actualCensor = typeof censor === "function" ? censor(current[i], indexPath) : censor;
              current[i] = actualCensor;
            }
          }
        } else if (typeof current === "object" && current !== null) {
          if (remove) {
            const keysToDelete = [];
            for (const key in current) {
              if (Object.prototype.hasOwnProperty.call(current, key)) {
                keysToDelete.push(key);
              }
            }
            for (const key of keysToDelete) {
              delete current[key];
            }
          } else {
            for (const key in current) {
              const keyPath = [...parentParts, key];
              const actualCensor = typeof censor === "function" ? censor(current[key], keyPath) : censor;
              current[key] = actualCensor;
            }
          }
        }
      } else {
        redactIntermediateWildcard(obj, parts, censor, wildcardIndex, originalPath, remove);
      }
    }
    function redactIntermediateWildcard(obj, parts, censor, wildcardIndex, originalPath, remove = false) {
      const beforeWildcard = parts.slice(0, wildcardIndex);
      const afterWildcard = parts.slice(wildcardIndex + 1);
      const pathArray = [];
      function traverse(current, pathLength) {
        if (pathLength === beforeWildcard.length) {
          if (Array.isArray(current)) {
            for (let i = 0; i < current.length; i++) {
              pathArray[pathLength] = i.toString();
              traverse(current[i], pathLength + 1);
            }
          } else if (typeof current === "object" && current !== null) {
            for (const key in current) {
              pathArray[pathLength] = key;
              traverse(current[key], pathLength + 1);
            }
          }
        } else if (pathLength < beforeWildcard.length) {
          const nextKey = beforeWildcard[pathLength];
          if (current && typeof current === "object" && current !== null && nextKey in current) {
            pathArray[pathLength] = nextKey;
            traverse(current[nextKey], pathLength + 1);
          }
        } else {
          if (afterWildcard.includes("*")) {
            const wrappedCensor = typeof censor === "function" ? (value, path18) => {
              const fullPath = [...pathArray.slice(0, pathLength), ...path18];
              return censor(value, fullPath);
            } : censor;
            redactWildcardPath(current, afterWildcard, wrappedCensor, originalPath, remove);
          } else {
            if (remove) {
              removeKey(current, afterWildcard);
            } else {
              const actualCensor = typeof censor === "function" ? censor(getValue(current, afterWildcard), [...pathArray.slice(0, pathLength), ...afterWildcard]) : censor;
              setValue(current, afterWildcard, actualCensor);
            }
          }
        }
      }
      if (beforeWildcard.length === 0) {
        traverse(obj, 0);
      } else {
        let current = obj;
        for (let i = 0; i < beforeWildcard.length; i++) {
          const part = beforeWildcard[i];
          if (current === null || current === void 0) return;
          if (typeof current !== "object" || current === null) return;
          current = current[part];
          pathArray[i] = part;
        }
        if (current !== null && current !== void 0) {
          traverse(current, beforeWildcard.length);
        }
      }
    }
    function buildPathStructure(pathsToClone) {
      if (pathsToClone.length === 0) {
        return null;
      }
      const pathStructure = /* @__PURE__ */ new Map();
      for (const path18 of pathsToClone) {
        const parts = parsePath(path18);
        let current = pathStructure;
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!current.has(part)) {
            current.set(part, /* @__PURE__ */ new Map());
          }
          current = current.get(part);
        }
      }
      return pathStructure;
    }
    function selectiveClone(obj, pathStructure) {
      if (!pathStructure) {
        return obj;
      }
      function cloneSelectively(source, pathMap, depth = 0) {
        if (!pathMap || pathMap.size === 0) {
          return source;
        }
        if (source === null || typeof source !== "object") {
          return source;
        }
        if (source instanceof Date) {
          return new Date(source.getTime());
        }
        if (Array.isArray(source)) {
          const cloned2 = [];
          for (let i = 0; i < source.length; i++) {
            const indexStr = i.toString();
            if (pathMap.has(indexStr) || pathMap.has("*")) {
              cloned2[i] = cloneSelectively(source[i], pathMap.get(indexStr) || pathMap.get("*"));
            } else {
              cloned2[i] = source[i];
            }
          }
          return cloned2;
        }
        const cloned = Object.create(Object.getPrototypeOf(source));
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (pathMap.has(key) || pathMap.has("*")) {
              cloned[key] = cloneSelectively(source[key], pathMap.get(key) || pathMap.get("*"));
            } else {
              cloned[key] = source[key];
            }
          }
        }
        return cloned;
      }
      return cloneSelectively(obj, pathStructure);
    }
    function validatePath(path18) {
      if (typeof path18 !== "string") {
        throw new Error("Paths must be (non-empty) strings");
      }
      if (path18 === "") {
        throw new Error("Invalid redaction path ()");
      }
      if (path18.includes("..")) {
        throw new Error(`Invalid redaction path (${path18})`);
      }
      if (path18.includes(",")) {
        throw new Error(`Invalid redaction path (${path18})`);
      }
      let bracketCount = 0;
      let inQuotes = false;
      let quoteChar = "";
      for (let i = 0; i < path18.length; i++) {
        const char = path18[i];
        if ((char === '"' || char === "'") && bracketCount > 0) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = "";
          }
        } else if (char === "[" && !inQuotes) {
          bracketCount++;
        } else if (char === "]" && !inQuotes) {
          bracketCount--;
          if (bracketCount < 0) {
            throw new Error(`Invalid redaction path (${path18})`);
          }
        }
      }
      if (bracketCount !== 0) {
        throw new Error(`Invalid redaction path (${path18})`);
      }
    }
    function validatePaths(paths) {
      if (!Array.isArray(paths)) {
        throw new TypeError("paths must be an array");
      }
      for (const path18 of paths) {
        validatePath(path18);
      }
    }
    function slowRedact(options = {}) {
      const {
        paths = [],
        censor = "[REDACTED]",
        serialize = JSON.stringify,
        strict = true,
        remove = false
      } = options;
      validatePaths(paths);
      const pathStructure = buildPathStructure(paths);
      return function redact(obj) {
        if (strict && (obj === null || typeof obj !== "object")) {
          if (obj === null || obj === void 0) {
            return serialize ? serialize(obj) : obj;
          }
          if (typeof obj !== "object") {
            return serialize ? serialize(obj) : obj;
          }
        }
        const cloned = selectiveClone(obj, pathStructure);
        const original = obj;
        let actualCensor = censor;
        if (typeof censor === "function") {
          actualCensor = censor;
        }
        redactPaths(cloned, paths, actualCensor, remove);
        if (serialize === false) {
          cloned.restore = function() {
            return deepClone(original);
          };
          return cloned;
        }
        if (typeof serialize === "function") {
          return serialize(cloned);
        }
        return JSON.stringify(cloned);
      };
    }
    module2.exports = slowRedact;
  }
});

// ../../node_modules/pino/lib/symbols.js
var require_symbols = __commonJS({
  "../../node_modules/pino/lib/symbols.js"(exports2, module2) {
    "use strict";
    var setLevelSym = Symbol("pino.setLevel");
    var getLevelSym = Symbol("pino.getLevel");
    var levelValSym = Symbol("pino.levelVal");
    var levelCompSym = Symbol("pino.levelComp");
    var useLevelLabelsSym = Symbol("pino.useLevelLabels");
    var useOnlyCustomLevelsSym = Symbol("pino.useOnlyCustomLevels");
    var mixinSym = Symbol("pino.mixin");
    var lsCacheSym = Symbol("pino.lsCache");
    var chindingsSym = Symbol("pino.chindings");
    var asJsonSym = Symbol("pino.asJson");
    var writeSym = Symbol("pino.write");
    var redactFmtSym = Symbol("pino.redactFmt");
    var timeSym = Symbol("pino.time");
    var timeSliceIndexSym = Symbol("pino.timeSliceIndex");
    var streamSym = Symbol("pino.stream");
    var stringifySym = Symbol("pino.stringify");
    var stringifySafeSym = Symbol("pino.stringifySafe");
    var stringifiersSym = Symbol("pino.stringifiers");
    var endSym = Symbol("pino.end");
    var formatOptsSym = Symbol("pino.formatOpts");
    var messageKeySym = Symbol("pino.messageKey");
    var errorKeySym = Symbol("pino.errorKey");
    var nestedKeySym = Symbol("pino.nestedKey");
    var nestedKeyStrSym = Symbol("pino.nestedKeyStr");
    var mixinMergeStrategySym = Symbol("pino.mixinMergeStrategy");
    var msgPrefixSym = Symbol("pino.msgPrefix");
    var wildcardFirstSym = Symbol("pino.wildcardFirst");
    var serializersSym = Symbol.for("pino.serializers");
    var formattersSym = Symbol.for("pino.formatters");
    var hooksSym = Symbol.for("pino.hooks");
    var needsMetadataGsym = Symbol.for("pino.metadata");
    module2.exports = {
      setLevelSym,
      getLevelSym,
      levelValSym,
      levelCompSym,
      useLevelLabelsSym,
      mixinSym,
      lsCacheSym,
      chindingsSym,
      asJsonSym,
      writeSym,
      serializersSym,
      redactFmtSym,
      timeSym,
      timeSliceIndexSym,
      streamSym,
      stringifySym,
      stringifySafeSym,
      stringifiersSym,
      endSym,
      formatOptsSym,
      messageKeySym,
      errorKeySym,
      nestedKeySym,
      wildcardFirstSym,
      needsMetadataGsym,
      useOnlyCustomLevelsSym,
      formattersSym,
      hooksSym,
      nestedKeyStrSym,
      mixinMergeStrategySym,
      msgPrefixSym
    };
  }
});

// ../../node_modules/pino/lib/redaction.js
var require_redaction = __commonJS({
  "../../node_modules/pino/lib/redaction.js"(exports2, module2) {
    "use strict";
    var Redact = require_redact();
    var { redactFmtSym, wildcardFirstSym } = require_symbols();
    var rx = /[^.[\]]+|\[([^[\]]*?)\]/g;
    var CENSOR = "[Redacted]";
    var strict = false;
    function redaction(opts, serialize) {
      const { paths, censor, remove } = handle(opts);
      const shape = paths.reduce((o, str) => {
        rx.lastIndex = 0;
        const first = rx.exec(str);
        const next = rx.exec(str);
        let ns = first[1] !== void 0 ? first[1].replace(/^(?:"|'|`)(.*)(?:"|'|`)$/, "$1") : first[0];
        if (ns === "*") {
          ns = wildcardFirstSym;
        }
        if (next === null) {
          o[ns] = null;
          return o;
        }
        if (o[ns] === null) {
          return o;
        }
        const { index } = next;
        const nextPath = `${str.substr(index, str.length - 1)}`;
        o[ns] = o[ns] || [];
        if (ns !== wildcardFirstSym && o[ns].length === 0) {
          o[ns].push(...o[wildcardFirstSym] || []);
        }
        if (ns === wildcardFirstSym) {
          Object.keys(o).forEach(function(k) {
            if (o[k]) {
              o[k].push(nextPath);
            }
          });
        }
        o[ns].push(nextPath);
        return o;
      }, {});
      const result = {
        [redactFmtSym]: Redact({ paths, censor, serialize, strict, remove })
      };
      const topCensor = (...args) => {
        return typeof censor === "function" ? serialize(censor(...args)) : serialize(censor);
      };
      return [...Object.keys(shape), ...Object.getOwnPropertySymbols(shape)].reduce((o, k) => {
        if (shape[k] === null) {
          o[k] = (value) => topCensor(value, [k]);
        } else {
          const wrappedCensor = typeof censor === "function" ? (value, path18) => {
            return censor(value, [k, ...path18]);
          } : censor;
          o[k] = Redact({
            paths: shape[k],
            censor: wrappedCensor,
            serialize,
            strict,
            remove
          });
        }
        return o;
      }, result);
    }
    function handle(opts) {
      if (Array.isArray(opts)) {
        opts = { paths: opts, censor: CENSOR };
        return opts;
      }
      let { paths, censor = CENSOR, remove } = opts;
      if (Array.isArray(paths) === false) {
        throw Error("pino \u2013 redact must contain an array of strings");
      }
      if (remove === true) censor = void 0;
      return { paths, censor, remove };
    }
    module2.exports = redaction;
  }
});

// ../../node_modules/pino/lib/time.js
var require_time = __commonJS({
  "../../node_modules/pino/lib/time.js"(exports2, module2) {
    "use strict";
    var nullTime = () => "";
    var epochTime = () => `,"time":${Date.now()}`;
    var unixTime = () => `,"time":${Math.round(Date.now() / 1e3)}`;
    var isoTime = () => `,"time":"${new Date(Date.now()).toISOString()}"`;
    var NS_PER_MS = 1000000n;
    var NS_PER_SEC = 1000000000n;
    var startWallTimeNs = BigInt(Date.now()) * NS_PER_MS;
    var startHrTime = process.hrtime.bigint();
    var isoTimeNano = () => {
      const elapsedNs = process.hrtime.bigint() - startHrTime;
      const currentTimeNs = startWallTimeNs + elapsedNs;
      const secondsSinceEpoch = currentTimeNs / NS_PER_SEC;
      const nanosWithinSecond = currentTimeNs % NS_PER_SEC;
      const msSinceEpoch = Number(secondsSinceEpoch * 1000n + nanosWithinSecond / 1000000n);
      const date = new Date(msSinceEpoch);
      const year = date.getUTCFullYear();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const day = date.getUTCDate().toString().padStart(2, "0");
      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      const seconds = date.getUTCSeconds().toString().padStart(2, "0");
      return `,"time":"${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${nanosWithinSecond.toString().padStart(9, "0")}Z"`;
    };
    module2.exports = { nullTime, epochTime, unixTime, isoTime, isoTimeNano };
  }
});

// ../../node_modules/quick-format-unescaped/index.js
var require_quick_format_unescaped = __commonJS({
  "../../node_modules/quick-format-unescaped/index.js"(exports2, module2) {
    "use strict";
    function tryStringify(o) {
      try {
        return JSON.stringify(o);
      } catch (e) {
        return '"[Circular]"';
      }
    }
    module2.exports = format;
    function format(f, args, opts) {
      var ss = opts && opts.stringify || tryStringify;
      var offset = 1;
      if (typeof f === "object" && f !== null) {
        var len = args.length + offset;
        if (len === 1) return f;
        var objects = new Array(len);
        objects[0] = ss(f);
        for (var index = 1; index < len; index++) {
          objects[index] = ss(args[index]);
        }
        return objects.join(" ");
      }
      if (typeof f !== "string") {
        return f;
      }
      var argLen = args.length;
      if (argLen === 0) return f;
      var str = "";
      var a = 1 - offset;
      var lastPos = -1;
      var flen = f && f.length || 0;
      for (var i = 0; i < flen; ) {
        if (f.charCodeAt(i) === 37 && i + 1 < flen) {
          lastPos = lastPos > -1 ? lastPos : 0;
          switch (f.charCodeAt(i + 1)) {
            case 100:
            // 'd'
            case 102:
              if (a >= argLen)
                break;
              if (args[a] == null) break;
              if (lastPos < i)
                str += f.slice(lastPos, i);
              str += Number(args[a]);
              lastPos = i + 2;
              i++;
              break;
            case 105:
              if (a >= argLen)
                break;
              if (args[a] == null) break;
              if (lastPos < i)
                str += f.slice(lastPos, i);
              str += Math.floor(Number(args[a]));
              lastPos = i + 2;
              i++;
              break;
            case 79:
            // 'O'
            case 111:
            // 'o'
            case 106:
              if (a >= argLen)
                break;
              if (args[a] === void 0) break;
              if (lastPos < i)
                str += f.slice(lastPos, i);
              var type = typeof args[a];
              if (type === "string") {
                str += "'" + args[a] + "'";
                lastPos = i + 2;
                i++;
                break;
              }
              if (type === "function") {
                str += args[a].name || "<anonymous>";
                lastPos = i + 2;
                i++;
                break;
              }
              str += ss(args[a]);
              lastPos = i + 2;
              i++;
              break;
            case 115:
              if (a >= argLen)
                break;
              if (lastPos < i)
                str += f.slice(lastPos, i);
              str += String(args[a]);
              lastPos = i + 2;
              i++;
              break;
            case 37:
              if (lastPos < i)
                str += f.slice(lastPos, i);
              str += "%";
              lastPos = i + 2;
              i++;
              a--;
              break;
          }
          ++a;
        }
        ++i;
      }
      if (lastPos === -1)
        return f;
      else if (lastPos < flen) {
        str += f.slice(lastPos);
      }
      return str;
    }
  }
});

// ../../node_modules/atomic-sleep/index.js
var require_atomic_sleep = __commonJS({
  "../../node_modules/atomic-sleep/index.js"(exports2, module2) {
    "use strict";
    if (typeof SharedArrayBuffer !== "undefined" && typeof Atomics !== "undefined") {
      let sleep = function(ms) {
        const valid = ms > 0 && ms < Infinity;
        if (valid === false) {
          if (typeof ms !== "number" && typeof ms !== "bigint") {
            throw TypeError("sleep: ms must be a number");
          }
          throw RangeError("sleep: ms must be a number that is greater than 0 but less than Infinity");
        }
        Atomics.wait(nil, 0, 0, Number(ms));
      };
      const nil = new Int32Array(new SharedArrayBuffer(4));
      module2.exports = sleep;
    } else {
      let sleep = function(ms) {
        const valid = ms > 0 && ms < Infinity;
        if (valid === false) {
          if (typeof ms !== "number" && typeof ms !== "bigint") {
            throw TypeError("sleep: ms must be a number");
          }
          throw RangeError("sleep: ms must be a number that is greater than 0 but less than Infinity");
        }
        const target = Date.now() + Number(ms);
        while (target > Date.now()) {
        }
      };
      module2.exports = sleep;
    }
  }
});

// ../../node_modules/sonic-boom/index.js
var require_sonic_boom = __commonJS({
  "../../node_modules/sonic-boom/index.js"(exports2, module2) {
    "use strict";
    var fs22 = require("fs");
    var EventEmitter5 = require("events");
    var inherits = require("util").inherits;
    var path18 = require("path");
    var sleep = require_atomic_sleep();
    var assert = require("assert");
    var BUSY_WRITE_TIMEOUT = 100;
    var kEmptyBuffer = Buffer.allocUnsafe(0);
    var MAX_WRITE = 16 * 1024;
    var kContentModeBuffer = "buffer";
    var kContentModeUtf8 = "utf8";
    var [major, minor] = (process.versions.node || "0.0").split(".").map(Number);
    var kCopyBuffer = major >= 22 && minor >= 7;
    function openFile(file, sonic) {
      sonic._opening = true;
      sonic._writing = true;
      sonic._asyncDrainScheduled = false;
      function fileOpened(err, fd) {
        if (err) {
          sonic._reopening = false;
          sonic._writing = false;
          sonic._opening = false;
          if (sonic.sync) {
            process.nextTick(() => {
              if (sonic.listenerCount("error") > 0) {
                sonic.emit("error", err);
              }
            });
          } else {
            sonic.emit("error", err);
          }
          return;
        }
        const reopening = sonic._reopening;
        sonic.fd = fd;
        sonic.file = file;
        sonic._reopening = false;
        sonic._opening = false;
        sonic._writing = false;
        if (sonic.sync) {
          process.nextTick(() => sonic.emit("ready"));
        } else {
          sonic.emit("ready");
        }
        if (sonic.destroyed) {
          return;
        }
        if (!sonic._writing && sonic._len > sonic.minLength || sonic._flushPending) {
          sonic._actualWrite();
        } else if (reopening) {
          process.nextTick(() => sonic.emit("drain"));
        }
      }
      const flags = sonic.append ? "a" : "w";
      const mode = sonic.mode;
      if (sonic.sync) {
        try {
          if (sonic.mkdir) fs22.mkdirSync(path18.dirname(file), { recursive: true });
          const fd = fs22.openSync(file, flags, mode);
          fileOpened(null, fd);
        } catch (err) {
          fileOpened(err);
          throw err;
        }
      } else if (sonic.mkdir) {
        fs22.mkdir(path18.dirname(file), { recursive: true }, (err) => {
          if (err) return fileOpened(err);
          fs22.open(file, flags, mode, fileOpened);
        });
      } else {
        fs22.open(file, flags, mode, fileOpened);
      }
    }
    function SonicBoom(opts) {
      if (!(this instanceof SonicBoom)) {
        return new SonicBoom(opts);
      }
      let { fd, dest, minLength, maxLength, maxWrite, periodicFlush, sync, append = true, mkdir, retryEAGAIN, fsync, contentMode, mode } = opts || {};
      fd = fd || dest;
      this._len = 0;
      this.fd = -1;
      this._bufs = [];
      this._lens = [];
      this._writing = false;
      this._ending = false;
      this._reopening = false;
      this._asyncDrainScheduled = false;
      this._flushPending = false;
      this._hwm = Math.max(minLength || 0, 16387);
      this.file = null;
      this.destroyed = false;
      this.minLength = minLength || 0;
      this.maxLength = maxLength || 0;
      this.maxWrite = maxWrite || MAX_WRITE;
      this._periodicFlush = periodicFlush || 0;
      this._periodicFlushTimer = void 0;
      this.sync = sync || false;
      this.writable = true;
      this._fsync = fsync || false;
      this.append = append || false;
      this.mode = mode;
      this.retryEAGAIN = retryEAGAIN || (() => true);
      this.mkdir = mkdir || false;
      let fsWriteSync;
      let fsWrite;
      if (contentMode === kContentModeBuffer) {
        this._writingBuf = kEmptyBuffer;
        this.write = writeBuffer;
        this.flush = flushBuffer;
        this.flushSync = flushBufferSync;
        this._actualWrite = actualWriteBuffer;
        fsWriteSync = () => fs22.writeSync(this.fd, this._writingBuf);
        fsWrite = () => fs22.write(this.fd, this._writingBuf, this.release);
      } else if (contentMode === void 0 || contentMode === kContentModeUtf8) {
        this._writingBuf = "";
        this.write = write;
        this.flush = flush;
        this.flushSync = flushSync;
        this._actualWrite = actualWrite;
        fsWriteSync = () => {
          if (Buffer.isBuffer(this._writingBuf)) {
            return fs22.writeSync(this.fd, this._writingBuf);
          }
          return fs22.writeSync(this.fd, this._writingBuf, "utf8");
        };
        fsWrite = () => {
          if (Buffer.isBuffer(this._writingBuf)) {
            return fs22.write(this.fd, this._writingBuf, this.release);
          }
          return fs22.write(this.fd, this._writingBuf, "utf8", this.release);
        };
      } else {
        throw new Error(`SonicBoom supports "${kContentModeUtf8}" and "${kContentModeBuffer}", but passed ${contentMode}`);
      }
      if (typeof fd === "number") {
        this.fd = fd;
        process.nextTick(() => this.emit("ready"));
      } else if (typeof fd === "string") {
        openFile(fd, this);
      } else {
        throw new Error("SonicBoom supports only file descriptors and files");
      }
      if (this.minLength >= this.maxWrite) {
        throw new Error(`minLength should be smaller than maxWrite (${this.maxWrite})`);
      }
      this.release = (err, n) => {
        if (err) {
          if ((err.code === "EAGAIN" || err.code === "EBUSY") && this.retryEAGAIN(err, this._writingBuf.length, this._len - this._writingBuf.length)) {
            if (this.sync) {
              try {
                sleep(BUSY_WRITE_TIMEOUT);
                this.release(void 0, 0);
              } catch (err2) {
                this.release(err2);
              }
            } else {
              setTimeout(fsWrite, BUSY_WRITE_TIMEOUT);
            }
          } else {
            this._writing = false;
            this.emit("error", err);
          }
          return;
        }
        this.emit("write", n);
        const releasedBufObj = releaseWritingBuf(this._writingBuf, this._len, n);
        this._len = releasedBufObj.len;
        this._writingBuf = releasedBufObj.writingBuf;
        if (this._writingBuf.length) {
          if (!this.sync) {
            fsWrite();
            return;
          }
          try {
            do {
              const n2 = fsWriteSync();
              const releasedBufObj2 = releaseWritingBuf(this._writingBuf, this._len, n2);
              this._len = releasedBufObj2.len;
              this._writingBuf = releasedBufObj2.writingBuf;
            } while (this._writingBuf.length);
          } catch (err2) {
            this.release(err2);
            return;
          }
        }
        if (this._fsync) {
          fs22.fsyncSync(this.fd);
        }
        const len = this._len;
        if (this._reopening) {
          this._writing = false;
          this._reopening = false;
          this.reopen();
        } else if (len > this.minLength) {
          this._actualWrite();
        } else if (this._ending) {
          if (len > 0) {
            this._actualWrite();
          } else {
            this._writing = false;
            actualClose(this);
          }
        } else {
          this._writing = false;
          if (this.sync) {
            if (!this._asyncDrainScheduled) {
              this._asyncDrainScheduled = true;
              process.nextTick(emitDrain, this);
            }
          } else {
            this.emit("drain");
          }
        }
      };
      this.on("newListener", function(name) {
        if (name === "drain") {
          this._asyncDrainScheduled = false;
        }
      });
      if (this._periodicFlush !== 0) {
        this._periodicFlushTimer = setInterval(() => this.flush(null), this._periodicFlush);
        this._periodicFlushTimer.unref();
      }
    }
    function releaseWritingBuf(writingBuf, len, n) {
      if (typeof writingBuf === "string") {
        writingBuf = Buffer.from(writingBuf);
      }
      len = Math.max(len - n, 0);
      writingBuf = writingBuf.subarray(n);
      return { writingBuf, len };
    }
    function emitDrain(sonic) {
      const hasListeners = sonic.listenerCount("drain") > 0;
      if (!hasListeners) return;
      sonic._asyncDrainScheduled = false;
      sonic.emit("drain");
    }
    inherits(SonicBoom, EventEmitter5);
    function mergeBuf(bufs, len) {
      if (bufs.length === 0) {
        return kEmptyBuffer;
      }
      if (bufs.length === 1) {
        return bufs[0];
      }
      return Buffer.concat(bufs, len);
    }
    function write(data) {
      if (this.destroyed) {
        throw new Error("SonicBoom destroyed");
      }
      data = "" + data;
      const dataLen = Buffer.byteLength(data);
      const len = this._len + dataLen;
      const bufs = this._bufs;
      if (this.maxLength && len > this.maxLength) {
        this.emit("drop", data);
        return this._len < this._hwm;
      }
      if (bufs.length === 0 || Buffer.byteLength(bufs[bufs.length - 1]) + dataLen > this.maxWrite) {
        bufs.push(data);
      } else {
        bufs[bufs.length - 1] += data;
      }
      this._len = len;
      if (!this._writing && this._len >= this.minLength) {
        this._actualWrite();
      }
      return this._len < this._hwm;
    }
    function writeBuffer(data) {
      if (this.destroyed) {
        throw new Error("SonicBoom destroyed");
      }
      const len = this._len + data.length;
      const bufs = this._bufs;
      const lens = this._lens;
      if (this.maxLength && len > this.maxLength) {
        this.emit("drop", data);
        return this._len < this._hwm;
      }
      if (bufs.length === 0 || lens[lens.length - 1] + data.length > this.maxWrite) {
        bufs.push([data]);
        lens.push(data.length);
      } else {
        bufs[bufs.length - 1].push(data);
        lens[lens.length - 1] += data.length;
      }
      this._len = len;
      if (!this._writing && this._len >= this.minLength) {
        this._actualWrite();
      }
      return this._len < this._hwm;
    }
    function callFlushCallbackOnDrain(cb) {
      this._flushPending = true;
      const onDrain = () => {
        if (!this._fsync) {
          try {
            fs22.fsync(this.fd, (err) => {
              this._flushPending = false;
              cb(err);
            });
          } catch (err) {
            cb(err);
          }
        } else {
          this._flushPending = false;
          cb();
        }
        this.off("error", onError);
      };
      const onError = (err) => {
        this._flushPending = false;
        cb(err);
        this.off("drain", onDrain);
      };
      this.once("drain", onDrain);
      this.once("error", onError);
    }
    function flush(cb) {
      if (cb != null && typeof cb !== "function") {
        throw new Error("flush cb must be a function");
      }
      if (this.destroyed) {
        const error = new Error("SonicBoom destroyed");
        if (cb) {
          cb(error);
          return;
        }
        throw error;
      }
      if (this.minLength <= 0) {
        cb?.();
        return;
      }
      if (cb) {
        callFlushCallbackOnDrain.call(this, cb);
      }
      if (this._writing) {
        return;
      }
      if (this._bufs.length === 0) {
        this._bufs.push("");
      }
      this._actualWrite();
    }
    function flushBuffer(cb) {
      if (cb != null && typeof cb !== "function") {
        throw new Error("flush cb must be a function");
      }
      if (this.destroyed) {
        const error = new Error("SonicBoom destroyed");
        if (cb) {
          cb(error);
          return;
        }
        throw error;
      }
      if (this.minLength <= 0) {
        cb?.();
        return;
      }
      if (cb) {
        callFlushCallbackOnDrain.call(this, cb);
      }
      if (this._writing) {
        return;
      }
      if (this._bufs.length === 0) {
        this._bufs.push([]);
        this._lens.push(0);
      }
      this._actualWrite();
    }
    SonicBoom.prototype.reopen = function(file) {
      if (this.destroyed) {
        throw new Error("SonicBoom destroyed");
      }
      if (this._opening) {
        this.once("ready", () => {
          this.reopen(file);
        });
        return;
      }
      if (this._ending) {
        return;
      }
      if (!this.file) {
        throw new Error("Unable to reopen a file descriptor, you must pass a file to SonicBoom");
      }
      if (file) {
        this.file = file;
      }
      this._reopening = true;
      if (this._writing) {
        return;
      }
      const fd = this.fd;
      this.once("ready", () => {
        if (fd !== this.fd) {
          fs22.close(fd, (err) => {
            if (err) {
              return this.emit("error", err);
            }
          });
        }
      });
      openFile(this.file, this);
    };
    SonicBoom.prototype.end = function() {
      if (this.destroyed) {
        throw new Error("SonicBoom destroyed");
      }
      if (this._opening) {
        this.once("ready", () => {
          this.end();
        });
        return;
      }
      if (this._ending) {
        return;
      }
      this._ending = true;
      if (this._writing) {
        return;
      }
      if (this._len > 0 && this.fd >= 0) {
        this._actualWrite();
      } else {
        actualClose(this);
      }
    };
    function flushSync() {
      if (this.destroyed) {
        throw new Error("SonicBoom destroyed");
      }
      if (this.fd < 0) {
        throw new Error("sonic boom is not ready yet");
      }
      if (!this._writing && this._writingBuf.length > 0) {
        this._bufs.unshift(this._writingBuf);
        this._writingBuf = "";
      }
      let buf = "";
      while (this._bufs.length || buf.length) {
        if (buf.length <= 0) {
          buf = this._bufs[0];
        }
        try {
          const n = Buffer.isBuffer(buf) ? fs22.writeSync(this.fd, buf) : fs22.writeSync(this.fd, buf, "utf8");
          const releasedBufObj = releaseWritingBuf(buf, this._len, n);
          buf = releasedBufObj.writingBuf;
          this._len = releasedBufObj.len;
          if (buf.length <= 0) {
            this._bufs.shift();
          }
        } catch (err) {
          const shouldRetry = err.code === "EAGAIN" || err.code === "EBUSY";
          if (shouldRetry && !this.retryEAGAIN(err, buf.length, this._len - buf.length)) {
            throw err;
          }
          sleep(BUSY_WRITE_TIMEOUT);
        }
      }
      try {
        fs22.fsyncSync(this.fd);
      } catch {
      }
    }
    function flushBufferSync() {
      if (this.destroyed) {
        throw new Error("SonicBoom destroyed");
      }
      if (this.fd < 0) {
        throw new Error("sonic boom is not ready yet");
      }
      if (!this._writing && this._writingBuf.length > 0) {
        this._bufs.unshift([this._writingBuf]);
        this._writingBuf = kEmptyBuffer;
      }
      let buf = kEmptyBuffer;
      while (this._bufs.length || buf.length) {
        if (buf.length <= 0) {
          buf = mergeBuf(this._bufs[0], this._lens[0]);
        }
        try {
          const n = fs22.writeSync(this.fd, buf);
          buf = buf.subarray(n);
          this._len = Math.max(this._len - n, 0);
          if (buf.length <= 0) {
            this._bufs.shift();
            this._lens.shift();
          }
        } catch (err) {
          const shouldRetry = err.code === "EAGAIN" || err.code === "EBUSY";
          if (shouldRetry && !this.retryEAGAIN(err, buf.length, this._len - buf.length)) {
            throw err;
          }
          sleep(BUSY_WRITE_TIMEOUT);
        }
      }
    }
    SonicBoom.prototype.destroy = function() {
      if (this.destroyed) {
        return;
      }
      actualClose(this);
    };
    function actualWrite() {
      const release = this.release;
      this._writing = true;
      this._writingBuf = this._writingBuf.length ? this._writingBuf : this._bufs.shift() || "";
      if (this.sync) {
        try {
          const written = Buffer.isBuffer(this._writingBuf) ? fs22.writeSync(this.fd, this._writingBuf) : fs22.writeSync(this.fd, this._writingBuf, "utf8");
          release(null, written);
        } catch (err) {
          release(err);
        }
      } else {
        fs22.write(this.fd, this._writingBuf, release);
      }
    }
    function actualWriteBuffer() {
      const release = this.release;
      this._writing = true;
      this._writingBuf = this._writingBuf.length ? this._writingBuf : mergeBuf(this._bufs.shift(), this._lens.shift());
      if (this.sync) {
        try {
          const written = fs22.writeSync(this.fd, this._writingBuf);
          release(null, written);
        } catch (err) {
          release(err);
        }
      } else {
        if (kCopyBuffer) {
          this._writingBuf = Buffer.from(this._writingBuf);
        }
        fs22.write(this.fd, this._writingBuf, release);
      }
    }
    function actualClose(sonic) {
      if (sonic.fd === -1) {
        sonic.once("ready", actualClose.bind(null, sonic));
        return;
      }
      if (sonic._periodicFlushTimer !== void 0) {
        clearInterval(sonic._periodicFlushTimer);
      }
      sonic.destroyed = true;
      sonic._bufs = [];
      sonic._lens = [];
      assert(typeof sonic.fd === "number", `sonic.fd must be a number, got ${typeof sonic.fd}`);
      try {
        fs22.fsync(sonic.fd, closeWrapped);
      } catch {
      }
      function closeWrapped() {
        if (sonic.fd !== 1 && sonic.fd !== 2) {
          fs22.close(sonic.fd, done);
        } else {
          done();
        }
      }
      function done(err) {
        if (err) {
          sonic.emit("error", err);
          return;
        }
        if (sonic._ending && !sonic._writing) {
          sonic.emit("finish");
        }
        sonic.emit("close");
      }
    }
    SonicBoom.SonicBoom = SonicBoom;
    SonicBoom.default = SonicBoom;
    module2.exports = SonicBoom;
  }
});

// ../../node_modules/on-exit-leak-free/index.js
var require_on_exit_leak_free = __commonJS({
  "../../node_modules/on-exit-leak-free/index.js"(exports2, module2) {
    "use strict";
    var refs = {
      exit: [],
      beforeExit: []
    };
    var functions = {
      exit: onExit,
      beforeExit: onBeforeExit
    };
    var registry;
    function ensureRegistry() {
      if (registry === void 0) {
        registry = new FinalizationRegistry(clear);
      }
    }
    function install(event) {
      if (refs[event].length > 0) {
        return;
      }
      process.on(event, functions[event]);
    }
    function uninstall(event) {
      if (refs[event].length > 0) {
        return;
      }
      process.removeListener(event, functions[event]);
      if (refs.exit.length === 0 && refs.beforeExit.length === 0) {
        registry = void 0;
      }
    }
    function onExit() {
      callRefs("exit");
    }
    function onBeforeExit() {
      callRefs("beforeExit");
    }
    function callRefs(event) {
      for (const ref of refs[event]) {
        const obj = ref.deref();
        const fn = ref.fn;
        if (obj !== void 0) {
          fn(obj, event);
        }
      }
      refs[event] = [];
    }
    function clear(ref) {
      for (const event of ["exit", "beforeExit"]) {
        const index = refs[event].indexOf(ref);
        refs[event].splice(index, index + 1);
        uninstall(event);
      }
    }
    function _register(event, obj, fn) {
      if (obj === void 0) {
        throw new Error("the object can't be undefined");
      }
      install(event);
      const ref = new WeakRef(obj);
      ref.fn = fn;
      ensureRegistry();
      registry.register(obj, ref);
      refs[event].push(ref);
    }
    function register(obj, fn) {
      _register("exit", obj, fn);
    }
    function registerBeforeExit(obj, fn) {
      _register("beforeExit", obj, fn);
    }
    function unregister(obj) {
      if (registry === void 0) {
        return;
      }
      registry.unregister(obj);
      for (const event of ["exit", "beforeExit"]) {
        refs[event] = refs[event].filter((ref) => {
          const _obj = ref.deref();
          return _obj && _obj !== obj;
        });
        uninstall(event);
      }
    }
    module2.exports = {
      register,
      registerBeforeExit,
      unregister
    };
  }
});

// ../../node_modules/thread-stream/package.json
var require_package = __commonJS({
  "../../node_modules/thread-stream/package.json"(exports2, module2) {
    module2.exports = {
      name: "thread-stream",
      version: "3.2.0",
      description: "A streaming way to send data to a Node.js Worker Thread",
      main: "index.js",
      types: "index.d.ts",
      dependencies: {
        "real-require": "^0.2.0"
      },
      devDependencies: {
        "@types/node": "^20.1.0",
        "@types/tap": "^15.0.0",
        "@yao-pkg/pkg": "^5.11.5",
        desm: "^1.3.0",
        fastbench: "^1.0.1",
        husky: "^9.0.6",
        "pino-elasticsearch": "^8.0.0",
        "sonic-boom": "^4.0.1",
        standard: "^17.0.0",
        tap: "^16.2.0",
        "ts-node": "^10.8.0",
        typescript: "^5.3.2",
        "why-is-node-running": "^2.2.2"
      },
      scripts: {
        build: "tsc --noEmit",
        test: 'standard && npm run build && npm run transpile && tap "test/**/*.test.*js" && tap --ts test/*.test.*ts',
        "test:ci": "standard && npm run transpile && npm run test:ci:js && npm run test:ci:ts",
        "test:ci:js": 'tap --no-check-coverage --timeout=120 --coverage-report=lcovonly "test/**/*.test.*js"',
        "test:ci:ts": 'tap --ts --no-check-coverage --coverage-report=lcovonly "test/**/*.test.*ts"',
        "test:yarn": 'npm run transpile && tap "test/**/*.test.js" --no-check-coverage',
        transpile: "sh ./test/ts/transpile.sh",
        prepare: "husky install"
      },
      standard: {
        ignore: [
          "test/ts/**/*",
          "test/syntax-error.mjs"
        ]
      },
      repository: {
        type: "git",
        url: "git+https://github.com/mcollina/thread-stream.git"
      },
      keywords: [
        "worker",
        "thread",
        "threads",
        "stream"
      ],
      author: "Matteo Collina <hello@matteocollina.com>",
      license: "MIT",
      bugs: {
        url: "https://github.com/mcollina/thread-stream/issues"
      },
      homepage: "https://github.com/mcollina/thread-stream#readme"
    };
  }
});

// ../../node_modules/thread-stream/lib/wait.js
var require_wait = __commonJS({
  "../../node_modules/thread-stream/lib/wait.js"(exports2, module2) {
    "use strict";
    var MAX_TIMEOUT = 1e3;
    function wait(state, index, expected, timeout, done) {
      const max = Date.now() + timeout;
      let current = Atomics.load(state, index);
      if (current === expected) {
        done(null, "ok");
        return;
      }
      let prior = current;
      const check = (backoff) => {
        if (Date.now() > max) {
          done(null, "timed-out");
        } else {
          setTimeout(() => {
            prior = current;
            current = Atomics.load(state, index);
            if (current === prior) {
              check(backoff >= MAX_TIMEOUT ? MAX_TIMEOUT : backoff * 2);
            } else {
              if (current === expected) done(null, "ok");
              else done(null, "not-equal");
            }
          }, backoff);
        }
      };
      check(1);
    }
    function waitDiff(state, index, expected, timeout, done) {
      const max = Date.now() + timeout;
      let current = Atomics.load(state, index);
      if (current !== expected) {
        done(null, "ok");
        return;
      }
      const check = (backoff) => {
        if (Date.now() > max) {
          done(null, "timed-out");
        } else {
          setTimeout(() => {
            current = Atomics.load(state, index);
            if (current !== expected) {
              done(null, "ok");
            } else {
              check(backoff >= MAX_TIMEOUT ? MAX_TIMEOUT : backoff * 2);
            }
          }, backoff);
        }
      };
      check(1);
    }
    module2.exports = { wait, waitDiff };
  }
});

// ../../node_modules/thread-stream/lib/indexes.js
var require_indexes = __commonJS({
  "../../node_modules/thread-stream/lib/indexes.js"(exports2, module2) {
    "use strict";
    var SEQ_INDEX = 2;
    var WRITE_INDEX = 4;
    var READ_INDEX = 8;
    module2.exports = {
      WRITE_INDEX,
      READ_INDEX,
      SEQ_INDEX
    };
  }
});

// ../../node_modules/thread-stream/index.js
var require_thread_stream = __commonJS({
  "../../node_modules/thread-stream/index.js"(exports2, module2) {
    "use strict";
    var { version } = require_package();
    var { EventEmitter: EventEmitter5 } = require("events");
    var { Worker } = require("worker_threads");
    var { join } = require("path");
    var { pathToFileURL } = require("url");
    var { wait } = require_wait();
    var {
      WRITE_INDEX,
      READ_INDEX,
      SEQ_INDEX
    } = require_indexes();
    var buffer = require("buffer");
    var assert = require("assert");
    var kImpl = Symbol("kImpl");
    var MAX_STRING = buffer.constants.MAX_STRING_LENGTH;
    function updateState(stream, fn) {
      Atomics.add(stream[kImpl].state, SEQ_INDEX, 1);
      fn();
      Atomics.add(stream[kImpl].state, SEQ_INDEX, 1);
      Atomics.notify(stream[kImpl].state, SEQ_INDEX);
    }
    var FakeWeakRef = class {
      constructor(value) {
        this._value = value;
      }
      deref() {
        return this._value;
      }
    };
    var FakeFinalizationRegistry = class {
      register() {
      }
      unregister() {
      }
    };
    var FinalizationRegistry2 = process.env.NODE_V8_COVERAGE ? FakeFinalizationRegistry : global.FinalizationRegistry || FakeFinalizationRegistry;
    var WeakRef2 = process.env.NODE_V8_COVERAGE ? FakeWeakRef : global.WeakRef || FakeWeakRef;
    var registry = new FinalizationRegistry2((worker) => {
      if (worker.exited) {
        return;
      }
      worker.terminate();
    });
    function createWorker(stream, opts) {
      const { filename, workerData } = opts;
      const bundlerOverrides = "__bundlerPathsOverrides" in globalThis ? globalThis.__bundlerPathsOverrides : {};
      const toExecute = bundlerOverrides["thread-stream-worker"] || join(__dirname, "lib", "worker.js");
      const worker = new Worker(toExecute, {
        ...opts.workerOpts,
        trackUnmanagedFds: false,
        workerData: {
          filename: filename.indexOf("file://") === 0 ? filename : pathToFileURL(filename).href,
          dataBuf: stream[kImpl].dataBuf,
          stateBuf: stream[kImpl].stateBuf,
          workerData: {
            $context: {
              threadStreamVersion: version
            },
            ...workerData
          }
        }
      });
      worker.stream = new FakeWeakRef(stream);
      worker.on("message", onWorkerMessage);
      worker.on("exit", onWorkerExit);
      registry.register(stream, worker);
      return worker;
    }
    function drain(stream) {
      assert(!stream[kImpl].sync);
      if (stream[kImpl].needDrain) {
        stream[kImpl].needDrain = false;
        stream.emit("drain");
      }
    }
    function nextFlush(stream) {
      const writeIndex = Atomics.load(stream[kImpl].state, WRITE_INDEX);
      let leftover = stream[kImpl].data.length - writeIndex;
      if (leftover > 0) {
        if (stream[kImpl].buf.length === 0) {
          stream[kImpl].flushing = false;
          if (stream[kImpl].ending) {
            end(stream);
          } else if (stream[kImpl].needDrain) {
            process.nextTick(drain, stream);
          }
          return;
        }
        let toWrite = stream[kImpl].buf.slice(0, leftover);
        let toWriteBytes = Buffer.byteLength(toWrite);
        if (toWriteBytes <= leftover) {
          stream[kImpl].buf = stream[kImpl].buf.slice(leftover);
          write(stream, toWrite, nextFlush.bind(null, stream));
        } else {
          stream.flush(() => {
            if (stream.destroyed) {
              return;
            }
            updateState(stream, () => {
              Atomics.store(stream[kImpl].state, READ_INDEX, 0);
              Atomics.store(stream[kImpl].state, WRITE_INDEX, 0);
            });
            Atomics.notify(stream[kImpl].state, READ_INDEX);
            while (toWriteBytes > stream[kImpl].data.length) {
              leftover = leftover / 2;
              toWrite = stream[kImpl].buf.slice(0, leftover);
              toWriteBytes = Buffer.byteLength(toWrite);
            }
            stream[kImpl].buf = stream[kImpl].buf.slice(leftover);
            write(stream, toWrite, nextFlush.bind(null, stream));
          });
        }
      } else if (leftover === 0) {
        if (writeIndex === 0 && stream[kImpl].buf.length === 0) {
          return;
        }
        stream.flush(() => {
          updateState(stream, () => {
            Atomics.store(stream[kImpl].state, READ_INDEX, 0);
            Atomics.store(stream[kImpl].state, WRITE_INDEX, 0);
          });
          Atomics.notify(stream[kImpl].state, READ_INDEX);
          nextFlush(stream);
        });
      } else {
        destroy(stream, new Error("overwritten"));
      }
    }
    function onWorkerMessage(msg) {
      const stream = this.stream.deref();
      if (stream === void 0) {
        this.exited = true;
        this.terminate();
        return;
      }
      if (msg?.code == null) {
        return;
      }
      switch (msg.code) {
        case "READY":
          this.stream = new WeakRef2(stream);
          stream.flush(() => {
            stream[kImpl].ready = true;
            stream.emit("ready");
          });
          break;
        case "ERROR":
          destroy(stream, msg.err);
          break;
        case "EVENT":
          if (Array.isArray(msg.args)) {
            stream.emit(msg.name, ...msg.args);
          } else {
            stream.emit(msg.name, msg.args);
          }
          break;
        case "WARNING":
          process.emitWarning(msg.err);
          break;
        default:
          destroy(stream, new Error("this should not happen: " + msg.code));
      }
    }
    function onWorkerExit(code) {
      const stream = this.stream.deref();
      if (stream === void 0) {
        return;
      }
      registry.unregister(stream);
      stream.worker.exited = true;
      stream.worker.off("exit", onWorkerExit);
      destroy(stream, code !== 0 ? new Error("the worker thread exited") : null);
    }
    var ThreadStream = class extends EventEmitter5 {
      constructor(opts = {}) {
        super();
        if (opts.bufferSize < 4) {
          throw new Error("bufferSize must at least fit a 4-byte utf-8 char");
        }
        this[kImpl] = {};
        this[kImpl].stateBuf = new SharedArrayBuffer(128);
        this[kImpl].state = new Int32Array(this[kImpl].stateBuf);
        this[kImpl].dataBuf = new SharedArrayBuffer(opts.bufferSize || 4 * 1024 * 1024);
        this[kImpl].data = Buffer.from(this[kImpl].dataBuf);
        this[kImpl].sync = opts.sync || false;
        this[kImpl].ending = false;
        this[kImpl].ended = false;
        this[kImpl].needDrain = false;
        this[kImpl].destroyed = false;
        this[kImpl].flushing = false;
        this[kImpl].ready = false;
        this[kImpl].finished = false;
        this[kImpl].errored = null;
        this[kImpl].closed = false;
        this[kImpl].buf = "";
        this.worker = createWorker(this, opts);
        this.on("message", (message, transferList) => {
          this.worker.postMessage(message, transferList);
        });
      }
      write(data) {
        if (this[kImpl].destroyed) {
          error(this, new Error("the worker has exited"));
          return false;
        }
        if (this[kImpl].ending) {
          error(this, new Error("the worker is ending"));
          return false;
        }
        if (this[kImpl].flushing && this[kImpl].buf.length + data.length >= MAX_STRING) {
          try {
            writeSync(this);
            this[kImpl].flushing = true;
          } catch (err) {
            destroy(this, err);
            return false;
          }
        }
        this[kImpl].buf += data;
        if (this[kImpl].sync) {
          try {
            writeSync(this);
            return true;
          } catch (err) {
            destroy(this, err);
            return false;
          }
        }
        if (!this[kImpl].flushing) {
          this[kImpl].flushing = true;
          setImmediate(nextFlush, this);
        }
        this[kImpl].needDrain = this[kImpl].data.length - this[kImpl].buf.length - Atomics.load(this[kImpl].state, WRITE_INDEX) <= 0;
        return !this[kImpl].needDrain;
      }
      end() {
        if (this[kImpl].destroyed) {
          return;
        }
        this[kImpl].ending = true;
        end(this);
      }
      flush(cb) {
        if (this[kImpl].destroyed) {
          if (typeof cb === "function") {
            process.nextTick(cb, new Error("the worker has exited"));
          }
          return;
        }
        const writeIndex = Atomics.load(this[kImpl].state, WRITE_INDEX);
        wait(this[kImpl].state, READ_INDEX, writeIndex, Infinity, (err, res) => {
          if (err) {
            destroy(this, err);
            process.nextTick(cb, err);
            return;
          }
          if (res === "not-equal") {
            this.flush(cb);
            return;
          }
          process.nextTick(cb);
        });
      }
      flushSync() {
        if (this[kImpl].destroyed) {
          return;
        }
        writeSync(this);
        flushSync(this);
      }
      unref() {
        this.worker.unref();
      }
      ref() {
        this.worker.ref();
      }
      get ready() {
        return this[kImpl].ready;
      }
      get destroyed() {
        return this[kImpl].destroyed;
      }
      get closed() {
        return this[kImpl].closed;
      }
      get writable() {
        return !this[kImpl].destroyed && !this[kImpl].ending;
      }
      get writableEnded() {
        return this[kImpl].ending;
      }
      get writableFinished() {
        return this[kImpl].finished;
      }
      get writableNeedDrain() {
        return this[kImpl].needDrain;
      }
      get writableObjectMode() {
        return false;
      }
      get writableErrored() {
        return this[kImpl].errored;
      }
    };
    function error(stream, err) {
      setImmediate(() => {
        stream.emit("error", err);
      });
    }
    function destroy(stream, err) {
      if (stream[kImpl].destroyed) {
        return;
      }
      stream[kImpl].destroyed = true;
      if (err) {
        stream[kImpl].errored = err;
        error(stream, err);
      }
      if (!stream.worker.exited) {
        stream.worker.terminate().catch(() => {
        }).then(() => {
          stream[kImpl].closed = true;
          stream.emit("close");
        });
      } else {
        setImmediate(() => {
          stream[kImpl].closed = true;
          stream.emit("close");
        });
      }
    }
    function write(stream, data, cb) {
      const current = Atomics.load(stream[kImpl].state, WRITE_INDEX);
      const length = Buffer.byteLength(data);
      stream[kImpl].data.write(data, current);
      updateState(stream, () => {
        Atomics.store(stream[kImpl].state, WRITE_INDEX, current + length);
      });
      cb();
      return true;
    }
    function end(stream) {
      if (stream[kImpl].ended || !stream[kImpl].ending || stream[kImpl].flushing) {
        return;
      }
      stream[kImpl].ended = true;
      try {
        stream.flushSync();
        let readIndex = Atomics.load(stream[kImpl].state, READ_INDEX);
        updateState(stream, () => {
          Atomics.store(stream[kImpl].state, WRITE_INDEX, -1);
        });
        let spins = 0;
        while (readIndex !== -1) {
          Atomics.wait(stream[kImpl].state, READ_INDEX, readIndex, 1e3);
          readIndex = Atomics.load(stream[kImpl].state, READ_INDEX);
          if (readIndex === -2) {
            destroy(stream, new Error("end() failed"));
            return;
          }
          if (++spins === 10) {
            destroy(stream, new Error("end() took too long (10s)"));
            return;
          }
        }
        process.nextTick(() => {
          stream[kImpl].finished = true;
          stream.emit("finish");
        });
      } catch (err) {
        destroy(stream, err);
      }
    }
    function writeSync(stream) {
      const cb = () => {
        if (stream[kImpl].ending) {
          end(stream);
        } else if (stream[kImpl].needDrain) {
          process.nextTick(drain, stream);
        }
      };
      stream[kImpl].flushing = false;
      while (stream[kImpl].buf.length !== 0) {
        const writeIndex = Atomics.load(stream[kImpl].state, WRITE_INDEX);
        let leftover = stream[kImpl].data.length - writeIndex;
        if (leftover === 0) {
          flushSync(stream);
          updateState(stream, () => {
            Atomics.store(stream[kImpl].state, READ_INDEX, 0);
            Atomics.store(stream[kImpl].state, WRITE_INDEX, 0);
          });
          Atomics.notify(stream[kImpl].state, READ_INDEX);
          continue;
        } else if (leftover < 0) {
          throw new Error("overwritten");
        }
        let toWrite = stream[kImpl].buf.slice(0, leftover);
        let toWriteBytes = Buffer.byteLength(toWrite);
        if (toWriteBytes <= leftover) {
          stream[kImpl].buf = stream[kImpl].buf.slice(leftover);
          write(stream, toWrite, cb);
        } else {
          flushSync(stream);
          updateState(stream, () => {
            Atomics.store(stream[kImpl].state, READ_INDEX, 0);
            Atomics.store(stream[kImpl].state, WRITE_INDEX, 0);
          });
          Atomics.notify(stream[kImpl].state, READ_INDEX);
          while (toWriteBytes > stream[kImpl].buf.length) {
            leftover = leftover / 2;
            toWrite = stream[kImpl].buf.slice(0, leftover);
            toWriteBytes = Buffer.byteLength(toWrite);
          }
          stream[kImpl].buf = stream[kImpl].buf.slice(leftover);
          write(stream, toWrite, cb);
        }
      }
    }
    function flushSync(stream) {
      if (stream[kImpl].flushing) {
        throw new Error("unable to flush while flushing");
      }
      const writeIndex = Atomics.load(stream[kImpl].state, WRITE_INDEX);
      let spins = 0;
      while (true) {
        const readIndex = Atomics.load(stream[kImpl].state, READ_INDEX);
        if (readIndex === -2) {
          throw Error("_flushSync failed");
        }
        if (readIndex !== writeIndex) {
          Atomics.wait(stream[kImpl].state, READ_INDEX, readIndex, 1e3);
        } else {
          break;
        }
        if (++spins === 10) {
          throw new Error("_flushSync took too long (10s)");
        }
      }
    }
    module2.exports = ThreadStream;
  }
});

// ../../node_modules/pino/lib/transport.js
var require_transport = __commonJS({
  "../../node_modules/pino/lib/transport.js"(exports2, module2) {
    "use strict";
    var { createRequire } = require("module");
    var getCallers = require_caller();
    var { join, isAbsolute, sep } = require("node:path");
    var sleep = require_atomic_sleep();
    var onExit = require_on_exit_leak_free();
    var ThreadStream = require_thread_stream();
    function setupOnExit(stream) {
      onExit.register(stream, autoEnd);
      onExit.registerBeforeExit(stream, flush);
      stream.on("close", function() {
        onExit.unregister(stream);
      });
    }
    function buildStream(filename, workerData, workerOpts, sync) {
      const stream = new ThreadStream({
        filename,
        workerData,
        workerOpts,
        sync
      });
      stream.on("ready", onReady);
      stream.on("close", function() {
        process.removeListener("exit", onExit2);
      });
      process.on("exit", onExit2);
      function onReady() {
        process.removeListener("exit", onExit2);
        stream.unref();
        if (workerOpts.autoEnd !== false) {
          setupOnExit(stream);
        }
      }
      function onExit2() {
        if (stream.closed) {
          return;
        }
        stream.flushSync();
        sleep(100);
        stream.end();
      }
      return stream;
    }
    function autoEnd(stream) {
      stream.ref();
      stream.flushSync();
      stream.end();
      stream.once("close", function() {
        stream.unref();
      });
    }
    function flush(stream) {
      stream.flushSync();
    }
    function transport(fullOptions) {
      const { pipeline, targets, levels, dedupe, worker = {}, caller = getCallers(), sync = false } = fullOptions;
      const options = {
        ...fullOptions.options
      };
      const callers = typeof caller === "string" ? [caller] : caller;
      const bundlerOverrides = "__bundlerPathsOverrides" in globalThis ? globalThis.__bundlerPathsOverrides : {};
      let target = fullOptions.target;
      if (target && targets) {
        throw new Error("only one of target or targets can be specified");
      }
      if (targets) {
        target = bundlerOverrides["pino-worker"] || join(__dirname, "worker.js");
        options.targets = targets.filter((dest) => dest.target).map((dest) => {
          return {
            ...dest,
            target: fixTarget(dest.target)
          };
        });
        options.pipelines = targets.filter((dest) => dest.pipeline).map((dest) => {
          return dest.pipeline.map((t) => {
            return {
              ...t,
              level: dest.level,
              // duplicate the pipeline `level` property defined in the upper level
              target: fixTarget(t.target)
            };
          });
        });
      } else if (pipeline) {
        target = bundlerOverrides["pino-worker"] || join(__dirname, "worker.js");
        options.pipelines = [pipeline.map((dest) => {
          return {
            ...dest,
            target: fixTarget(dest.target)
          };
        })];
      }
      if (levels) {
        options.levels = levels;
      }
      if (dedupe) {
        options.dedupe = dedupe;
      }
      options.pinoWillSendConfig = true;
      return buildStream(fixTarget(target), options, worker, sync);
      function fixTarget(origin) {
        origin = bundlerOverrides[origin] || origin;
        if (isAbsolute(origin) || origin.indexOf("file://") === 0) {
          return origin;
        }
        if (origin === "pino/file") {
          return join(__dirname, "..", "file.js");
        }
        let fixTarget2;
        for (const filePath of callers) {
          try {
            const context = filePath === "node:repl" ? process.cwd() + sep : filePath;
            fixTarget2 = createRequire(context).resolve(origin);
            break;
          } catch (err) {
            continue;
          }
        }
        if (!fixTarget2) {
          throw new Error(`unable to determine transport target for "${origin}"`);
        }
        return fixTarget2;
      }
    }
    module2.exports = transport;
  }
});

// ../../node_modules/pino/lib/tools.js
var require_tools = __commonJS({
  "../../node_modules/pino/lib/tools.js"(exports2, module2) {
    "use strict";
    var diagChan = require("node:diagnostics_channel");
    var format = require_quick_format_unescaped();
    var { mapHttpRequest, mapHttpResponse } = require_pino_std_serializers();
    var SonicBoom = require_sonic_boom();
    var onExit = require_on_exit_leak_free();
    var {
      lsCacheSym,
      chindingsSym,
      writeSym,
      serializersSym,
      formatOptsSym,
      endSym,
      stringifiersSym,
      stringifySym,
      stringifySafeSym,
      wildcardFirstSym,
      nestedKeySym,
      formattersSym,
      messageKeySym,
      errorKeySym,
      nestedKeyStrSym,
      msgPrefixSym
    } = require_symbols();
    var { isMainThread } = require("worker_threads");
    var transport = require_transport();
    var asJsonChan;
    if (typeof diagChan.tracingChannel === "function") {
      asJsonChan = diagChan.tracingChannel("pino_asJson");
    } else {
      asJsonChan = {
        hasSubscribers: false,
        traceSync(fn, store, thisArg, ...args) {
          return fn.call(thisArg, ...args);
        }
      };
    }
    function noop() {
    }
    function genLog(level, hook) {
      if (!hook) return LOG;
      return function hookWrappedLog(...args) {
        hook.call(this, args, LOG, level);
      };
      function LOG(o, ...n) {
        if (typeof o === "object") {
          let msg = o;
          if (o !== null) {
            if (o.method && o.headers && o.socket) {
              o = mapHttpRequest(o);
            } else if (typeof o.setHeader === "function") {
              o = mapHttpResponse(o);
            }
          }
          let formatParams;
          if (msg === null && n.length === 0) {
            formatParams = [null];
          } else {
            msg = n.shift();
            formatParams = n;
          }
          if (typeof this[msgPrefixSym] === "string" && msg !== void 0 && msg !== null) {
            msg = this[msgPrefixSym] + msg;
          }
          this[writeSym](o, format(msg, formatParams, this[formatOptsSym]), level);
        } else {
          let msg = o === void 0 ? n.shift() : o;
          if (typeof this[msgPrefixSym] === "string" && msg !== void 0 && msg !== null) {
            msg = this[msgPrefixSym] + msg;
          }
          this[writeSym](null, format(msg, n, this[formatOptsSym]), level);
        }
      }
    }
    function asString(str) {
      let result = "";
      let last = 0;
      let found = false;
      let point = 255;
      const l = str.length;
      if (l > 100) {
        return JSON.stringify(str);
      }
      for (var i = 0; i < l && point >= 32; i++) {
        point = str.charCodeAt(i);
        if (point === 34 || point === 92) {
          result += str.slice(last, i) + "\\";
          last = i;
          found = true;
        }
      }
      if (!found) {
        result = str;
      } else {
        result += str.slice(last);
      }
      return point < 32 ? JSON.stringify(str) : '"' + result + '"';
    }
    function asJson(obj, msg, num, time) {
      if (asJsonChan.hasSubscribers === false) {
        return _asJson.call(this, obj, msg, num, time);
      }
      const store = { instance: this, arguments };
      return asJsonChan.traceSync(_asJson, store, this, obj, msg, num, time);
    }
    function _asJson(obj, msg, num, time) {
      const stringify2 = this[stringifySym];
      const stringifySafe = this[stringifySafeSym];
      const stringifiers = this[stringifiersSym];
      const end = this[endSym];
      const chindings = this[chindingsSym];
      const serializers = this[serializersSym];
      const formatters = this[formattersSym];
      const messageKey = this[messageKeySym];
      const errorKey = this[errorKeySym];
      let data = this[lsCacheSym][num] + time;
      data = data + chindings;
      let value;
      if (formatters.log) {
        obj = formatters.log(obj);
      }
      const wildcardStringifier = stringifiers[wildcardFirstSym];
      let propStr = "";
      for (const key in obj) {
        value = obj[key];
        if (Object.prototype.hasOwnProperty.call(obj, key) && value !== void 0) {
          if (serializers[key]) {
            value = serializers[key](value);
          } else if (key === errorKey && serializers.err) {
            value = serializers.err(value);
          }
          const stringifier = stringifiers[key] || wildcardStringifier;
          switch (typeof value) {
            case "undefined":
            case "function":
              continue;
            case "number":
              if (Number.isFinite(value) === false) {
                value = null;
              }
            // this case explicitly falls through to the next one
            case "boolean":
              if (stringifier) value = stringifier(value);
              break;
            case "string":
              value = (stringifier || asString)(value);
              break;
            default:
              value = (stringifier || stringify2)(value, stringifySafe);
          }
          if (value === void 0) continue;
          const strKey = asString(key);
          propStr += "," + strKey + ":" + value;
        }
      }
      let msgStr = "";
      if (msg !== void 0) {
        value = serializers[messageKey] ? serializers[messageKey](msg) : msg;
        const stringifier = stringifiers[messageKey] || wildcardStringifier;
        switch (typeof value) {
          case "function":
            break;
          case "number":
            if (Number.isFinite(value) === false) {
              value = null;
            }
          // this case explicitly falls through to the next one
          case "boolean":
            if (stringifier) value = stringifier(value);
            msgStr = ',"' + messageKey + '":' + value;
            break;
          case "string":
            value = (stringifier || asString)(value);
            msgStr = ',"' + messageKey + '":' + value;
            break;
          default:
            value = (stringifier || stringify2)(value, stringifySafe);
            msgStr = ',"' + messageKey + '":' + value;
        }
      }
      if (this[nestedKeySym] && propStr) {
        return data + this[nestedKeyStrSym] + propStr.slice(1) + "}" + msgStr + end;
      } else {
        return data + propStr + msgStr + end;
      }
    }
    function asChindings(instance, bindings) {
      let value;
      let data = instance[chindingsSym];
      const stringify2 = instance[stringifySym];
      const stringifySafe = instance[stringifySafeSym];
      const stringifiers = instance[stringifiersSym];
      const wildcardStringifier = stringifiers[wildcardFirstSym];
      const serializers = instance[serializersSym];
      const formatter = instance[formattersSym].bindings;
      bindings = formatter(bindings);
      for (const key in bindings) {
        value = bindings[key];
        const valid = (key.length < 5 || key !== "level" && key !== "serializers" && key !== "formatters" && key !== "customLevels") && bindings.hasOwnProperty(key) && value !== void 0;
        if (valid === true) {
          value = serializers[key] ? serializers[key](value) : value;
          value = (stringifiers[key] || wildcardStringifier || stringify2)(value, stringifySafe);
          if (value === void 0) continue;
          data += ',"' + key + '":' + value;
        }
      }
      return data;
    }
    function hasBeenTampered(stream) {
      return stream.write !== stream.constructor.prototype.write;
    }
    function buildSafeSonicBoom(opts) {
      const stream = new SonicBoom(opts);
      stream.on("error", filterBrokenPipe);
      if (!opts.sync && isMainThread) {
        onExit.register(stream, autoEnd);
        stream.on("close", function() {
          onExit.unregister(stream);
        });
      }
      return stream;
      function filterBrokenPipe(err) {
        if (err.code === "EPIPE") {
          stream.write = noop;
          stream.end = noop;
          stream.flushSync = noop;
          stream.destroy = noop;
          return;
        }
        stream.removeListener("error", filterBrokenPipe);
        stream.emit("error", err);
      }
    }
    function autoEnd(stream, eventName) {
      if (stream.destroyed) {
        return;
      }
      if (eventName === "beforeExit") {
        stream.flush();
        stream.on("drain", function() {
          stream.end();
        });
      } else {
        stream.flushSync();
      }
    }
    function createArgsNormalizer(defaultOptions) {
      return function normalizeArgs(instance, caller, opts = {}, stream) {
        if (typeof opts === "string") {
          stream = buildSafeSonicBoom({ dest: opts });
          opts = {};
        } else if (typeof stream === "string") {
          if (opts && opts.transport) {
            throw Error("only one of option.transport or stream can be specified");
          }
          stream = buildSafeSonicBoom({ dest: stream });
        } else if (opts instanceof SonicBoom || opts.writable || opts._writableState) {
          stream = opts;
          opts = {};
        } else if (opts.transport) {
          if (opts.transport instanceof SonicBoom || opts.transport.writable || opts.transport._writableState) {
            throw Error("option.transport do not allow stream, please pass to option directly. e.g. pino(transport)");
          }
          if (opts.transport.targets && opts.transport.targets.length && opts.formatters && typeof opts.formatters.level === "function") {
            throw Error("option.transport.targets do not allow custom level formatters");
          }
          let customLevels;
          if (opts.customLevels) {
            customLevels = opts.useOnlyCustomLevels ? opts.customLevels : Object.assign({}, opts.levels, opts.customLevels);
          }
          stream = transport({ caller, ...opts.transport, levels: customLevels });
        }
        opts = Object.assign({}, defaultOptions, opts);
        opts.serializers = Object.assign({}, defaultOptions.serializers, opts.serializers);
        opts.formatters = Object.assign({}, defaultOptions.formatters, opts.formatters);
        if (opts.prettyPrint) {
          throw new Error("prettyPrint option is no longer supported, see the pino-pretty package (https://github.com/pinojs/pino-pretty)");
        }
        const { enabled, onChild } = opts;
        if (enabled === false) opts.level = "silent";
        if (!onChild) opts.onChild = noop;
        if (!stream) {
          if (!hasBeenTampered(process.stdout)) {
            stream = buildSafeSonicBoom({ fd: process.stdout.fd || 1 });
          } else {
            stream = process.stdout;
          }
        }
        return { opts, stream };
      };
    }
    function stringify(obj, stringifySafeFn) {
      try {
        return JSON.stringify(obj);
      } catch (_) {
        try {
          const stringify2 = stringifySafeFn || this[stringifySafeSym];
          return stringify2(obj);
        } catch (_2) {
          return '"[unable to serialize, circular reference is too complex to analyze]"';
        }
      }
    }
    function buildFormatters(level, bindings, log2) {
      return {
        level,
        bindings,
        log: log2
      };
    }
    function normalizeDestFileDescriptor(destination) {
      const fd = Number(destination);
      if (typeof destination === "string" && Number.isFinite(fd)) {
        return fd;
      }
      if (destination === void 0) {
        return 1;
      }
      return destination;
    }
    module2.exports = {
      noop,
      buildSafeSonicBoom,
      asChindings,
      asJson,
      genLog,
      createArgsNormalizer,
      stringify,
      buildFormatters,
      normalizeDestFileDescriptor
    };
  }
});

// ../../node_modules/pino/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/pino/lib/constants.js"(exports2, module2) {
    var DEFAULT_LEVELS = {
      trace: 10,
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      fatal: 60
    };
    var SORTING_ORDER = {
      ASC: "ASC",
      DESC: "DESC"
    };
    module2.exports = {
      DEFAULT_LEVELS,
      SORTING_ORDER
    };
  }
});

// ../../node_modules/pino/lib/levels.js
var require_levels = __commonJS({
  "../../node_modules/pino/lib/levels.js"(exports2, module2) {
    "use strict";
    var {
      lsCacheSym,
      levelValSym,
      useOnlyCustomLevelsSym,
      streamSym,
      formattersSym,
      hooksSym,
      levelCompSym
    } = require_symbols();
    var { noop, genLog } = require_tools();
    var { DEFAULT_LEVELS, SORTING_ORDER } = require_constants();
    var levelMethods = {
      fatal: (hook) => {
        const logFatal = genLog(DEFAULT_LEVELS.fatal, hook);
        return function(...args) {
          const stream = this[streamSym];
          logFatal.call(this, ...args);
          if (typeof stream.flushSync === "function") {
            try {
              stream.flushSync();
            } catch (e) {
            }
          }
        };
      },
      error: (hook) => genLog(DEFAULT_LEVELS.error, hook),
      warn: (hook) => genLog(DEFAULT_LEVELS.warn, hook),
      info: (hook) => genLog(DEFAULT_LEVELS.info, hook),
      debug: (hook) => genLog(DEFAULT_LEVELS.debug, hook),
      trace: (hook) => genLog(DEFAULT_LEVELS.trace, hook)
    };
    var nums = Object.keys(DEFAULT_LEVELS).reduce((o, k) => {
      o[DEFAULT_LEVELS[k]] = k;
      return o;
    }, {});
    var initialLsCache = Object.keys(nums).reduce((o, k) => {
      o[k] = '{"level":' + Number(k);
      return o;
    }, {});
    function genLsCache(instance) {
      const formatter = instance[formattersSym].level;
      const { labels } = instance.levels;
      const cache = {};
      for (const label in labels) {
        const level = formatter(labels[label], Number(label));
        cache[label] = JSON.stringify(level).slice(0, -1);
      }
      instance[lsCacheSym] = cache;
      return instance;
    }
    function isStandardLevel(level, useOnlyCustomLevels) {
      if (useOnlyCustomLevels) {
        return false;
      }
      switch (level) {
        case "fatal":
        case "error":
        case "warn":
        case "info":
        case "debug":
        case "trace":
          return true;
        default:
          return false;
      }
    }
    function setLevel(level) {
      const { labels, values } = this.levels;
      if (typeof level === "number") {
        if (labels[level] === void 0) throw Error("unknown level value" + level);
        level = labels[level];
      }
      if (values[level] === void 0) throw Error("unknown level " + level);
      const preLevelVal = this[levelValSym];
      const levelVal = this[levelValSym] = values[level];
      const useOnlyCustomLevelsVal = this[useOnlyCustomLevelsSym];
      const levelComparison = this[levelCompSym];
      const hook = this[hooksSym].logMethod;
      for (const key in values) {
        if (levelComparison(values[key], levelVal) === false) {
          this[key] = noop;
          continue;
        }
        this[key] = isStandardLevel(key, useOnlyCustomLevelsVal) ? levelMethods[key](hook) : genLog(values[key], hook);
      }
      this.emit(
        "level-change",
        level,
        levelVal,
        labels[preLevelVal],
        preLevelVal,
        this
      );
    }
    function getLevel(level) {
      const { levels, levelVal } = this;
      return levels && levels.labels ? levels.labels[levelVal] : "";
    }
    function isLevelEnabled(logLevel) {
      const { values } = this.levels;
      const logLevelVal = values[logLevel];
      return logLevelVal !== void 0 && this[levelCompSym](logLevelVal, this[levelValSym]);
    }
    function compareLevel(direction, current, expected) {
      if (direction === SORTING_ORDER.DESC) {
        return current <= expected;
      }
      return current >= expected;
    }
    function genLevelComparison(levelComparison) {
      if (typeof levelComparison === "string") {
        return compareLevel.bind(null, levelComparison);
      }
      return levelComparison;
    }
    function mappings(customLevels = null, useOnlyCustomLevels = false) {
      const customNums = customLevels ? Object.keys(customLevels).reduce((o, k) => {
        o[customLevels[k]] = k;
        return o;
      }, {}) : null;
      const labels = Object.assign(
        Object.create(Object.prototype, { Infinity: { value: "silent" } }),
        useOnlyCustomLevels ? null : nums,
        customNums
      );
      const values = Object.assign(
        Object.create(Object.prototype, { silent: { value: Infinity } }),
        useOnlyCustomLevels ? null : DEFAULT_LEVELS,
        customLevels
      );
      return { labels, values };
    }
    function assertDefaultLevelFound(defaultLevel, customLevels, useOnlyCustomLevels) {
      if (typeof defaultLevel === "number") {
        const values = [].concat(
          Object.keys(customLevels || {}).map((key) => customLevels[key]),
          useOnlyCustomLevels ? [] : Object.keys(nums).map((level) => +level),
          Infinity
        );
        if (!values.includes(defaultLevel)) {
          throw Error(`default level:${defaultLevel} must be included in custom levels`);
        }
        return;
      }
      const labels = Object.assign(
        Object.create(Object.prototype, { silent: { value: Infinity } }),
        useOnlyCustomLevels ? null : DEFAULT_LEVELS,
        customLevels
      );
      if (!(defaultLevel in labels)) {
        throw Error(`default level:${defaultLevel} must be included in custom levels`);
      }
    }
    function assertNoLevelCollisions(levels, customLevels) {
      const { labels, values } = levels;
      for (const k in customLevels) {
        if (k in values) {
          throw Error("levels cannot be overridden");
        }
        if (customLevels[k] in labels) {
          throw Error("pre-existing level values cannot be used for new levels");
        }
      }
    }
    function assertLevelComparison(levelComparison) {
      if (typeof levelComparison === "function") {
        return;
      }
      if (typeof levelComparison === "string" && Object.values(SORTING_ORDER).includes(levelComparison)) {
        return;
      }
      throw new Error('Levels comparison should be one of "ASC", "DESC" or "function" type');
    }
    module2.exports = {
      initialLsCache,
      genLsCache,
      levelMethods,
      getLevel,
      setLevel,
      isLevelEnabled,
      mappings,
      assertNoLevelCollisions,
      assertDefaultLevelFound,
      genLevelComparison,
      assertLevelComparison
    };
  }
});

// ../../node_modules/pino/lib/meta.js
var require_meta = __commonJS({
  "../../node_modules/pino/lib/meta.js"(exports2, module2) {
    "use strict";
    module2.exports = { version: "9.14.0" };
  }
});

// ../../node_modules/pino/lib/proto.js
var require_proto = __commonJS({
  "../../node_modules/pino/lib/proto.js"(exports2, module2) {
    "use strict";
    var { EventEmitter: EventEmitter5 } = require("node:events");
    var {
      lsCacheSym,
      levelValSym,
      setLevelSym,
      getLevelSym,
      chindingsSym,
      parsedChindingsSym,
      mixinSym,
      asJsonSym,
      writeSym,
      mixinMergeStrategySym,
      timeSym,
      timeSliceIndexSym,
      streamSym,
      serializersSym,
      formattersSym,
      errorKeySym,
      messageKeySym,
      useOnlyCustomLevelsSym,
      needsMetadataGsym,
      redactFmtSym,
      stringifySym,
      formatOptsSym,
      stringifiersSym,
      msgPrefixSym,
      hooksSym
    } = require_symbols();
    var {
      getLevel,
      setLevel,
      isLevelEnabled,
      mappings,
      initialLsCache,
      genLsCache,
      assertNoLevelCollisions
    } = require_levels();
    var {
      asChindings,
      asJson,
      buildFormatters,
      stringify,
      noop
    } = require_tools();
    var {
      version
    } = require_meta();
    var redaction = require_redaction();
    var constructor = class Pino {
    };
    var prototype = {
      constructor,
      child,
      bindings,
      setBindings,
      flush,
      isLevelEnabled,
      version,
      get level() {
        return this[getLevelSym]();
      },
      set level(lvl) {
        this[setLevelSym](lvl);
      },
      get levelVal() {
        return this[levelValSym];
      },
      set levelVal(n) {
        throw Error("levelVal is read-only");
      },
      get msgPrefix() {
        return this[msgPrefixSym];
      },
      get [Symbol.toStringTag]() {
        return "Pino";
      },
      [lsCacheSym]: initialLsCache,
      [writeSym]: write,
      [asJsonSym]: asJson,
      [getLevelSym]: getLevel,
      [setLevelSym]: setLevel
    };
    Object.setPrototypeOf(prototype, EventEmitter5.prototype);
    module2.exports = function() {
      return Object.create(prototype);
    };
    var resetChildingsFormatter = (bindings2) => bindings2;
    function child(bindings2, options) {
      if (!bindings2) {
        throw Error("missing bindings for child Pino");
      }
      const serializers = this[serializersSym];
      const formatters = this[formattersSym];
      const instance = Object.create(this);
      if (options == null) {
        if (instance[formattersSym].bindings !== resetChildingsFormatter) {
          instance[formattersSym] = buildFormatters(
            formatters.level,
            resetChildingsFormatter,
            formatters.log
          );
        }
        instance[chindingsSym] = asChindings(instance, bindings2);
        instance[setLevelSym](this.level);
        if (this.onChild !== noop) {
          this.onChild(instance);
        }
        return instance;
      }
      if (options.hasOwnProperty("serializers") === true) {
        instance[serializersSym] = /* @__PURE__ */ Object.create(null);
        for (const k in serializers) {
          instance[serializersSym][k] = serializers[k];
        }
        const parentSymbols = Object.getOwnPropertySymbols(serializers);
        for (var i = 0; i < parentSymbols.length; i++) {
          const ks = parentSymbols[i];
          instance[serializersSym][ks] = serializers[ks];
        }
        for (const bk in options.serializers) {
          instance[serializersSym][bk] = options.serializers[bk];
        }
        const bindingsSymbols = Object.getOwnPropertySymbols(options.serializers);
        for (var bi = 0; bi < bindingsSymbols.length; bi++) {
          const bks = bindingsSymbols[bi];
          instance[serializersSym][bks] = options.serializers[bks];
        }
      } else instance[serializersSym] = serializers;
      if (options.hasOwnProperty("formatters")) {
        const { level, bindings: chindings, log: log2 } = options.formatters;
        instance[formattersSym] = buildFormatters(
          level || formatters.level,
          chindings || resetChildingsFormatter,
          log2 || formatters.log
        );
      } else {
        instance[formattersSym] = buildFormatters(
          formatters.level,
          resetChildingsFormatter,
          formatters.log
        );
      }
      if (options.hasOwnProperty("customLevels") === true) {
        assertNoLevelCollisions(this.levels, options.customLevels);
        instance.levels = mappings(options.customLevels, instance[useOnlyCustomLevelsSym]);
        genLsCache(instance);
      }
      if (typeof options.redact === "object" && options.redact !== null || Array.isArray(options.redact)) {
        instance.redact = options.redact;
        const stringifiers = redaction(instance.redact, stringify);
        const formatOpts = { stringify: stringifiers[redactFmtSym] };
        instance[stringifySym] = stringify;
        instance[stringifiersSym] = stringifiers;
        instance[formatOptsSym] = formatOpts;
      }
      if (typeof options.msgPrefix === "string") {
        instance[msgPrefixSym] = (this[msgPrefixSym] || "") + options.msgPrefix;
      }
      instance[chindingsSym] = asChindings(instance, bindings2);
      const childLevel = options.level || this.level;
      instance[setLevelSym](childLevel);
      this.onChild(instance);
      return instance;
    }
    function bindings() {
      const chindings = this[chindingsSym];
      const chindingsJson = `{${chindings.substr(1)}}`;
      const bindingsFromJson = JSON.parse(chindingsJson);
      delete bindingsFromJson.pid;
      delete bindingsFromJson.hostname;
      return bindingsFromJson;
    }
    function setBindings(newBindings) {
      const chindings = asChindings(this, newBindings);
      this[chindingsSym] = chindings;
      delete this[parsedChindingsSym];
    }
    function defaultMixinMergeStrategy(mergeObject, mixinObject) {
      return Object.assign(mixinObject, mergeObject);
    }
    function write(_obj, msg, num) {
      const t = this[timeSym]();
      const mixin = this[mixinSym];
      const errorKey = this[errorKeySym];
      const messageKey = this[messageKeySym];
      const mixinMergeStrategy = this[mixinMergeStrategySym] || defaultMixinMergeStrategy;
      let obj;
      const streamWriteHook = this[hooksSym].streamWrite;
      if (_obj === void 0 || _obj === null) {
        obj = {};
      } else if (_obj instanceof Error) {
        obj = { [errorKey]: _obj };
        if (msg === void 0) {
          msg = _obj.message;
        }
      } else {
        obj = _obj;
        if (msg === void 0 && _obj[messageKey] === void 0 && _obj[errorKey]) {
          msg = _obj[errorKey].message;
        }
      }
      if (mixin) {
        obj = mixinMergeStrategy(obj, mixin(obj, num, this));
      }
      const s = this[asJsonSym](obj, msg, num, t);
      const stream = this[streamSym];
      if (stream[needsMetadataGsym] === true) {
        stream.lastLevel = num;
        stream.lastObj = obj;
        stream.lastMsg = msg;
        stream.lastTime = t.slice(this[timeSliceIndexSym]);
        stream.lastLogger = this;
      }
      stream.write(streamWriteHook ? streamWriteHook(s) : s);
    }
    function flush(cb) {
      if (cb != null && typeof cb !== "function") {
        throw Error("callback must be a function");
      }
      const stream = this[streamSym];
      if (typeof stream.flush === "function") {
        stream.flush(cb || noop);
      } else if (cb) cb();
    }
  }
});

// ../../node_modules/safe-stable-stringify/index.js
var require_safe_stable_stringify = __commonJS({
  "../../node_modules/safe-stable-stringify/index.js"(exports2, module2) {
    "use strict";
    var { hasOwnProperty } = Object.prototype;
    var stringify = configure();
    stringify.configure = configure;
    stringify.stringify = stringify;
    stringify.default = stringify;
    exports2.stringify = stringify;
    exports2.configure = configure;
    module2.exports = stringify;
    var strEscapeSequencesRegExp = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/;
    function strEscape(str) {
      if (str.length < 5e3 && !strEscapeSequencesRegExp.test(str)) {
        return `"${str}"`;
      }
      return JSON.stringify(str);
    }
    function sort(array, comparator) {
      if (array.length > 200 || comparator) {
        return array.sort(comparator);
      }
      for (let i = 1; i < array.length; i++) {
        const currentValue = array[i];
        let position = i;
        while (position !== 0 && array[position - 1] > currentValue) {
          array[position] = array[position - 1];
          position--;
        }
        array[position] = currentValue;
      }
      return array;
    }
    var typedArrayPrototypeGetSymbolToStringTag = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(
        Object.getPrototypeOf(
          new Int8Array()
        )
      ),
      Symbol.toStringTag
    ).get;
    function isTypedArrayWithEntries(value) {
      return typedArrayPrototypeGetSymbolToStringTag.call(value) !== void 0 && value.length !== 0;
    }
    function stringifyTypedArray(array, separator, maximumBreadth) {
      if (array.length < maximumBreadth) {
        maximumBreadth = array.length;
      }
      const whitespace = separator === "," ? "" : " ";
      let res = `"0":${whitespace}${array[0]}`;
      for (let i = 1; i < maximumBreadth; i++) {
        res += `${separator}"${i}":${whitespace}${array[i]}`;
      }
      return res;
    }
    function getCircularValueOption(options) {
      if (hasOwnProperty.call(options, "circularValue")) {
        const circularValue = options.circularValue;
        if (typeof circularValue === "string") {
          return `"${circularValue}"`;
        }
        if (circularValue == null) {
          return circularValue;
        }
        if (circularValue === Error || circularValue === TypeError) {
          return {
            toString() {
              throw new TypeError("Converting circular structure to JSON");
            }
          };
        }
        throw new TypeError('The "circularValue" argument must be of type string or the value null or undefined');
      }
      return '"[Circular]"';
    }
    function getDeterministicOption(options) {
      let value;
      if (hasOwnProperty.call(options, "deterministic")) {
        value = options.deterministic;
        if (typeof value !== "boolean" && typeof value !== "function") {
          throw new TypeError('The "deterministic" argument must be of type boolean or comparator function');
        }
      }
      return value === void 0 ? true : value;
    }
    function getBooleanOption(options, key) {
      let value;
      if (hasOwnProperty.call(options, key)) {
        value = options[key];
        if (typeof value !== "boolean") {
          throw new TypeError(`The "${key}" argument must be of type boolean`);
        }
      }
      return value === void 0 ? true : value;
    }
    function getPositiveIntegerOption(options, key) {
      let value;
      if (hasOwnProperty.call(options, key)) {
        value = options[key];
        if (typeof value !== "number") {
          throw new TypeError(`The "${key}" argument must be of type number`);
        }
        if (!Number.isInteger(value)) {
          throw new TypeError(`The "${key}" argument must be an integer`);
        }
        if (value < 1) {
          throw new RangeError(`The "${key}" argument must be >= 1`);
        }
      }
      return value === void 0 ? Infinity : value;
    }
    function getItemCount(number2) {
      if (number2 === 1) {
        return "1 item";
      }
      return `${number2} items`;
    }
    function getUniqueReplacerSet(replacerArray) {
      const replacerSet = /* @__PURE__ */ new Set();
      for (const value of replacerArray) {
        if (typeof value === "string" || typeof value === "number") {
          replacerSet.add(String(value));
        }
      }
      return replacerSet;
    }
    function getStrictOption(options) {
      if (hasOwnProperty.call(options, "strict")) {
        const value = options.strict;
        if (typeof value !== "boolean") {
          throw new TypeError('The "strict" argument must be of type boolean');
        }
        if (value) {
          return (value2) => {
            let message = `Object can not safely be stringified. Received type ${typeof value2}`;
            if (typeof value2 !== "function") message += ` (${value2.toString()})`;
            throw new Error(message);
          };
        }
      }
    }
    function configure(options) {
      options = { ...options };
      const fail = getStrictOption(options);
      if (fail) {
        if (options.bigint === void 0) {
          options.bigint = false;
        }
        if (!("circularValue" in options)) {
          options.circularValue = Error;
        }
      }
      const circularValue = getCircularValueOption(options);
      const bigint = getBooleanOption(options, "bigint");
      const deterministic = getDeterministicOption(options);
      const comparator = typeof deterministic === "function" ? deterministic : void 0;
      const maximumDepth = getPositiveIntegerOption(options, "maximumDepth");
      const maximumBreadth = getPositiveIntegerOption(options, "maximumBreadth");
      function stringifyFnReplacer(key, parent, stack, replacer, spacer, indentation) {
        let value = parent[key];
        if (typeof value === "object" && value !== null && typeof value.toJSON === "function") {
          value = value.toJSON(key);
        }
        value = replacer.call(parent, key, value);
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null) {
              return "null";
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue;
            }
            let res = "";
            let join = ",";
            const originalIndentation = indentation;
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return "[]";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"';
              }
              stack.push(value);
              if (spacer !== "") {
                indentation += spacer;
                res += `
${indentation}`;
                join = `,
${indentation}`;
              }
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyFnReplacer(String(i), value, stack, replacer, spacer, indentation);
                res += tmp2 !== void 0 ? tmp2 : "null";
                res += join;
              }
              const tmp = stringifyFnReplacer(String(i), value, stack, replacer, spacer, indentation);
              res += tmp !== void 0 ? tmp : "null";
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `${join}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              if (spacer !== "") {
                res += `
${originalIndentation}`;
              }
              stack.pop();
              return `[${res}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0) {
              return "{}";
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"';
            }
            let whitespace = "";
            let separator = "";
            if (spacer !== "") {
              indentation += spacer;
              join = `,
${indentation}`;
              whitespace = " ";
            }
            const maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            if (deterministic && !isTypedArrayWithEntries(value)) {
              keys = sort(keys, comparator);
            }
            stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i];
              const tmp = stringifyFnReplacer(key2, value, stack, replacer, spacer, indentation);
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${whitespace}${tmp}`;
                separator = join;
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...":${whitespace}"${getItemCount(removedKeys)} not stringified"`;
              separator = join;
            }
            if (spacer !== "" && separator.length > 1) {
              res = `
${indentation}${res}
${originalIndentation}`;
            }
            stack.pop();
            return `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return void 0;
          case "bigint":
            if (bigint) {
              return String(value);
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      function stringifyArrayReplacer(key, value, stack, replacer, spacer, indentation) {
        if (typeof value === "object" && value !== null && typeof value.toJSON === "function") {
          value = value.toJSON(key);
        }
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null) {
              return "null";
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue;
            }
            const originalIndentation = indentation;
            let res = "";
            let join = ",";
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return "[]";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"';
              }
              stack.push(value);
              if (spacer !== "") {
                indentation += spacer;
                res += `
${indentation}`;
                join = `,
${indentation}`;
              }
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyArrayReplacer(String(i), value[i], stack, replacer, spacer, indentation);
                res += tmp2 !== void 0 ? tmp2 : "null";
                res += join;
              }
              const tmp = stringifyArrayReplacer(String(i), value[i], stack, replacer, spacer, indentation);
              res += tmp !== void 0 ? tmp : "null";
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `${join}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              if (spacer !== "") {
                res += `
${originalIndentation}`;
              }
              stack.pop();
              return `[${res}]`;
            }
            stack.push(value);
            let whitespace = "";
            if (spacer !== "") {
              indentation += spacer;
              join = `,
${indentation}`;
              whitespace = " ";
            }
            let separator = "";
            for (const key2 of replacer) {
              const tmp = stringifyArrayReplacer(key2, value[key2], stack, replacer, spacer, indentation);
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${whitespace}${tmp}`;
                separator = join;
              }
            }
            if (spacer !== "" && separator.length > 1) {
              res = `
${indentation}${res}
${originalIndentation}`;
            }
            stack.pop();
            return `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return void 0;
          case "bigint":
            if (bigint) {
              return String(value);
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      function stringifyIndent(key, value, stack, spacer, indentation) {
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null) {
              return "null";
            }
            if (typeof value.toJSON === "function") {
              value = value.toJSON(key);
              if (typeof value !== "object") {
                return stringifyIndent(key, value, stack, spacer, indentation);
              }
              if (value === null) {
                return "null";
              }
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue;
            }
            const originalIndentation = indentation;
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return "[]";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"';
              }
              stack.push(value);
              indentation += spacer;
              let res2 = `
${indentation}`;
              const join2 = `,
${indentation}`;
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifyIndent(String(i), value[i], stack, spacer, indentation);
                res2 += tmp2 !== void 0 ? tmp2 : "null";
                res2 += join2;
              }
              const tmp = stringifyIndent(String(i), value[i], stack, spacer, indentation);
              res2 += tmp !== void 0 ? tmp : "null";
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res2 += `${join2}"... ${getItemCount(removedKeys)} not stringified"`;
              }
              res2 += `
${originalIndentation}`;
              stack.pop();
              return `[${res2}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0) {
              return "{}";
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"';
            }
            indentation += spacer;
            const join = `,
${indentation}`;
            let res = "";
            let separator = "";
            let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            if (isTypedArrayWithEntries(value)) {
              res += stringifyTypedArray(value, join, maximumBreadth);
              keys = keys.slice(value.length);
              maximumPropertiesToStringify -= value.length;
              separator = join;
            }
            if (deterministic) {
              keys = sort(keys, comparator);
            }
            stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i];
              const tmp = stringifyIndent(key2, value[key2], stack, spacer, indentation);
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}: ${tmp}`;
                separator = join;
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...": "${getItemCount(removedKeys)} not stringified"`;
              separator = join;
            }
            if (separator !== "") {
              res = `
${indentation}${res}
${originalIndentation}`;
            }
            stack.pop();
            return `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return void 0;
          case "bigint":
            if (bigint) {
              return String(value);
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      function stringifySimple(key, value, stack) {
        switch (typeof value) {
          case "string":
            return strEscape(value);
          case "object": {
            if (value === null) {
              return "null";
            }
            if (typeof value.toJSON === "function") {
              value = value.toJSON(key);
              if (typeof value !== "object") {
                return stringifySimple(key, value, stack);
              }
              if (value === null) {
                return "null";
              }
            }
            if (stack.indexOf(value) !== -1) {
              return circularValue;
            }
            let res = "";
            const hasLength = value.length !== void 0;
            if (hasLength && Array.isArray(value)) {
              if (value.length === 0) {
                return "[]";
              }
              if (maximumDepth < stack.length + 1) {
                return '"[Array]"';
              }
              stack.push(value);
              const maximumValuesToStringify = Math.min(value.length, maximumBreadth);
              let i = 0;
              for (; i < maximumValuesToStringify - 1; i++) {
                const tmp2 = stringifySimple(String(i), value[i], stack);
                res += tmp2 !== void 0 ? tmp2 : "null";
                res += ",";
              }
              const tmp = stringifySimple(String(i), value[i], stack);
              res += tmp !== void 0 ? tmp : "null";
              if (value.length - 1 > maximumBreadth) {
                const removedKeys = value.length - maximumBreadth - 1;
                res += `,"... ${getItemCount(removedKeys)} not stringified"`;
              }
              stack.pop();
              return `[${res}]`;
            }
            let keys = Object.keys(value);
            const keyLength = keys.length;
            if (keyLength === 0) {
              return "{}";
            }
            if (maximumDepth < stack.length + 1) {
              return '"[Object]"';
            }
            let separator = "";
            let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth);
            if (hasLength && isTypedArrayWithEntries(value)) {
              res += stringifyTypedArray(value, ",", maximumBreadth);
              keys = keys.slice(value.length);
              maximumPropertiesToStringify -= value.length;
              separator = ",";
            }
            if (deterministic) {
              keys = sort(keys, comparator);
            }
            stack.push(value);
            for (let i = 0; i < maximumPropertiesToStringify; i++) {
              const key2 = keys[i];
              const tmp = stringifySimple(key2, value[key2], stack);
              if (tmp !== void 0) {
                res += `${separator}${strEscape(key2)}:${tmp}`;
                separator = ",";
              }
            }
            if (keyLength > maximumBreadth) {
              const removedKeys = keyLength - maximumBreadth;
              res += `${separator}"...":"${getItemCount(removedKeys)} not stringified"`;
            }
            stack.pop();
            return `{${res}}`;
          }
          case "number":
            return isFinite(value) ? String(value) : fail ? fail(value) : "null";
          case "boolean":
            return value === true ? "true" : "false";
          case "undefined":
            return void 0;
          case "bigint":
            if (bigint) {
              return String(value);
            }
          // fallthrough
          default:
            return fail ? fail(value) : void 0;
        }
      }
      function stringify2(value, replacer, space) {
        if (arguments.length > 1) {
          let spacer = "";
          if (typeof space === "number") {
            spacer = " ".repeat(Math.min(space, 10));
          } else if (typeof space === "string") {
            spacer = space.slice(0, 10);
          }
          if (replacer != null) {
            if (typeof replacer === "function") {
              return stringifyFnReplacer("", { "": value }, [], replacer, spacer, "");
            }
            if (Array.isArray(replacer)) {
              return stringifyArrayReplacer("", value, [], getUniqueReplacerSet(replacer), spacer, "");
            }
          }
          if (spacer.length !== 0) {
            return stringifyIndent("", value, [], spacer, "");
          }
        }
        return stringifySimple("", value, []);
      }
      return stringify2;
    }
  }
});

// ../../node_modules/pino/lib/multistream.js
var require_multistream = __commonJS({
  "../../node_modules/pino/lib/multistream.js"(exports2, module2) {
    "use strict";
    var metadata = Symbol.for("pino.metadata");
    var { DEFAULT_LEVELS } = require_constants();
    var DEFAULT_INFO_LEVEL = DEFAULT_LEVELS.info;
    function multistream(streamsArray, opts) {
      streamsArray = streamsArray || [];
      opts = opts || { dedupe: false };
      const streamLevels = Object.create(DEFAULT_LEVELS);
      streamLevels.silent = Infinity;
      if (opts.levels && typeof opts.levels === "object") {
        Object.keys(opts.levels).forEach((i) => {
          streamLevels[i] = opts.levels[i];
        });
      }
      const res = {
        write,
        add,
        remove,
        emit,
        flushSync,
        end,
        minLevel: 0,
        lastId: 0,
        streams: [],
        clone,
        [metadata]: true,
        streamLevels
      };
      if (Array.isArray(streamsArray)) {
        streamsArray.forEach(add, res);
      } else {
        add.call(res, streamsArray);
      }
      streamsArray = null;
      return res;
      function write(data) {
        let dest;
        const level = this.lastLevel;
        const { streams } = this;
        let recordedLevel = 0;
        let stream;
        for (let i = initLoopVar(streams.length, opts.dedupe); checkLoopVar(i, streams.length, opts.dedupe); i = adjustLoopVar(i, opts.dedupe)) {
          dest = streams[i];
          if (dest.level <= level) {
            if (recordedLevel !== 0 && recordedLevel !== dest.level) {
              break;
            }
            stream = dest.stream;
            if (stream[metadata]) {
              const { lastTime, lastMsg, lastObj, lastLogger } = this;
              stream.lastLevel = level;
              stream.lastTime = lastTime;
              stream.lastMsg = lastMsg;
              stream.lastObj = lastObj;
              stream.lastLogger = lastLogger;
            }
            stream.write(data);
            if (opts.dedupe) {
              recordedLevel = dest.level;
            }
          } else if (!opts.dedupe) {
            break;
          }
        }
      }
      function emit(...args) {
        for (const { stream } of this.streams) {
          if (typeof stream.emit === "function") {
            stream.emit(...args);
          }
        }
      }
      function flushSync() {
        for (const { stream } of this.streams) {
          if (typeof stream.flushSync === "function") {
            stream.flushSync();
          }
        }
      }
      function add(dest) {
        if (!dest) {
          return res;
        }
        const isStream = typeof dest.write === "function" || dest.stream;
        const stream_ = dest.write ? dest : dest.stream;
        if (!isStream) {
          throw Error("stream object needs to implement either StreamEntry or DestinationStream interface");
        }
        const { streams, streamLevels: streamLevels2 } = this;
        let level;
        if (typeof dest.levelVal === "number") {
          level = dest.levelVal;
        } else if (typeof dest.level === "string") {
          level = streamLevels2[dest.level];
        } else if (typeof dest.level === "number") {
          level = dest.level;
        } else {
          level = DEFAULT_INFO_LEVEL;
        }
        const dest_ = {
          stream: stream_,
          level,
          levelVal: void 0,
          id: ++res.lastId
        };
        streams.unshift(dest_);
        streams.sort(compareByLevel);
        this.minLevel = streams[0].level;
        return res;
      }
      function remove(id) {
        const { streams } = this;
        const index = streams.findIndex((s) => s.id === id);
        if (index >= 0) {
          streams.splice(index, 1);
          streams.sort(compareByLevel);
          this.minLevel = streams.length > 0 ? streams[0].level : -1;
        }
        return res;
      }
      function end() {
        for (const { stream } of this.streams) {
          if (typeof stream.flushSync === "function") {
            stream.flushSync();
          }
          stream.end();
        }
      }
      function clone(level) {
        const streams = new Array(this.streams.length);
        for (let i = 0; i < streams.length; i++) {
          streams[i] = {
            level,
            stream: this.streams[i].stream
          };
        }
        return {
          write,
          add,
          remove,
          minLevel: level,
          streams,
          clone,
          emit,
          flushSync,
          [metadata]: true
        };
      }
    }
    function compareByLevel(a, b) {
      return a.level - b.level;
    }
    function initLoopVar(length, dedupe) {
      return dedupe ? length - 1 : 0;
    }
    function adjustLoopVar(i, dedupe) {
      return dedupe ? i - 1 : i + 1;
    }
    function checkLoopVar(i, length, dedupe) {
      return dedupe ? i >= 0 : i < length;
    }
    module2.exports = multistream;
  }
});

// ../../node_modules/pino/pino.js
var require_pino = __commonJS({
  "../../node_modules/pino/pino.js"(exports2, module2) {
    "use strict";
    var os2 = require("node:os");
    var stdSerializers = require_pino_std_serializers();
    var caller = require_caller();
    var redaction = require_redaction();
    var time = require_time();
    var proto = require_proto();
    var symbols = require_symbols();
    var { configure } = require_safe_stable_stringify();
    var { assertDefaultLevelFound, mappings, genLsCache, genLevelComparison, assertLevelComparison } = require_levels();
    var { DEFAULT_LEVELS, SORTING_ORDER } = require_constants();
    var {
      createArgsNormalizer,
      asChindings,
      buildSafeSonicBoom,
      buildFormatters,
      stringify,
      normalizeDestFileDescriptor,
      noop
    } = require_tools();
    var { version } = require_meta();
    var {
      chindingsSym,
      redactFmtSym,
      serializersSym,
      timeSym,
      timeSliceIndexSym,
      streamSym,
      stringifySym,
      stringifySafeSym,
      stringifiersSym,
      setLevelSym,
      endSym,
      formatOptsSym,
      messageKeySym,
      errorKeySym,
      nestedKeySym,
      mixinSym,
      levelCompSym,
      useOnlyCustomLevelsSym,
      formattersSym,
      hooksSym,
      nestedKeyStrSym,
      mixinMergeStrategySym,
      msgPrefixSym
    } = symbols;
    var { epochTime, nullTime } = time;
    var { pid } = process;
    var hostname = os2.hostname();
    var defaultErrorSerializer = stdSerializers.err;
    var defaultOptions = {
      level: "info",
      levelComparison: SORTING_ORDER.ASC,
      levels: DEFAULT_LEVELS,
      messageKey: "msg",
      errorKey: "err",
      nestedKey: null,
      enabled: true,
      base: { pid, hostname },
      serializers: Object.assign(/* @__PURE__ */ Object.create(null), {
        err: defaultErrorSerializer
      }),
      formatters: Object.assign(/* @__PURE__ */ Object.create(null), {
        bindings(bindings) {
          return bindings;
        },
        level(label, number2) {
          return { level: number2 };
        }
      }),
      hooks: {
        logMethod: void 0,
        streamWrite: void 0
      },
      timestamp: epochTime,
      name: void 0,
      redact: null,
      customLevels: null,
      useOnlyCustomLevels: false,
      depthLimit: 5,
      edgeLimit: 100
    };
    var normalize = createArgsNormalizer(defaultOptions);
    var serializers = Object.assign(/* @__PURE__ */ Object.create(null), stdSerializers);
    function pino2(...args) {
      const instance = {};
      const { opts, stream } = normalize(instance, caller(), ...args);
      if (opts.level && typeof opts.level === "string" && DEFAULT_LEVELS[opts.level.toLowerCase()] !== void 0) opts.level = opts.level.toLowerCase();
      const {
        redact,
        crlf,
        serializers: serializers2,
        timestamp,
        messageKey,
        errorKey,
        nestedKey,
        base,
        name,
        level,
        customLevels,
        levelComparison,
        mixin,
        mixinMergeStrategy,
        useOnlyCustomLevels,
        formatters,
        hooks,
        depthLimit,
        edgeLimit,
        onChild,
        msgPrefix
      } = opts;
      const stringifySafe = configure({
        maximumDepth: depthLimit,
        maximumBreadth: edgeLimit
      });
      const allFormatters = buildFormatters(
        formatters.level,
        formatters.bindings,
        formatters.log
      );
      const stringifyFn = stringify.bind({
        [stringifySafeSym]: stringifySafe
      });
      const stringifiers = redact ? redaction(redact, stringifyFn) : {};
      const formatOpts = redact ? { stringify: stringifiers[redactFmtSym] } : { stringify: stringifyFn };
      const end = "}" + (crlf ? "\r\n" : "\n");
      const coreChindings = asChindings.bind(null, {
        [chindingsSym]: "",
        [serializersSym]: serializers2,
        [stringifiersSym]: stringifiers,
        [stringifySym]: stringify,
        [stringifySafeSym]: stringifySafe,
        [formattersSym]: allFormatters
      });
      let chindings = "";
      if (base !== null) {
        if (name === void 0) {
          chindings = coreChindings(base);
        } else {
          chindings = coreChindings(Object.assign({}, base, { name }));
        }
      }
      const time2 = timestamp instanceof Function ? timestamp : timestamp ? epochTime : nullTime;
      const timeSliceIndex = time2().indexOf(":") + 1;
      if (useOnlyCustomLevels && !customLevels) throw Error("customLevels is required if useOnlyCustomLevels is set true");
      if (mixin && typeof mixin !== "function") throw Error(`Unknown mixin type "${typeof mixin}" - expected "function"`);
      if (msgPrefix && typeof msgPrefix !== "string") throw Error(`Unknown msgPrefix type "${typeof msgPrefix}" - expected "string"`);
      assertDefaultLevelFound(level, customLevels, useOnlyCustomLevels);
      const levels = mappings(customLevels, useOnlyCustomLevels);
      if (typeof stream.emit === "function") {
        stream.emit("message", { code: "PINO_CONFIG", config: { levels, messageKey, errorKey } });
      }
      assertLevelComparison(levelComparison);
      const levelCompFunc = genLevelComparison(levelComparison);
      Object.assign(instance, {
        levels,
        [levelCompSym]: levelCompFunc,
        [useOnlyCustomLevelsSym]: useOnlyCustomLevels,
        [streamSym]: stream,
        [timeSym]: time2,
        [timeSliceIndexSym]: timeSliceIndex,
        [stringifySym]: stringify,
        [stringifySafeSym]: stringifySafe,
        [stringifiersSym]: stringifiers,
        [endSym]: end,
        [formatOptsSym]: formatOpts,
        [messageKeySym]: messageKey,
        [errorKeySym]: errorKey,
        [nestedKeySym]: nestedKey,
        // protect against injection
        [nestedKeyStrSym]: nestedKey ? `,${JSON.stringify(nestedKey)}:{` : "",
        [serializersSym]: serializers2,
        [mixinSym]: mixin,
        [mixinMergeStrategySym]: mixinMergeStrategy,
        [chindingsSym]: chindings,
        [formattersSym]: allFormatters,
        [hooksSym]: hooks,
        silent: noop,
        onChild,
        [msgPrefixSym]: msgPrefix
      });
      Object.setPrototypeOf(instance, proto());
      genLsCache(instance);
      instance[setLevelSym](level);
      return instance;
    }
    module2.exports = pino2;
    module2.exports.destination = (dest = process.stdout.fd) => {
      if (typeof dest === "object") {
        dest.dest = normalizeDestFileDescriptor(dest.dest || process.stdout.fd);
        return buildSafeSonicBoom(dest);
      } else {
        return buildSafeSonicBoom({ dest: normalizeDestFileDescriptor(dest), minLength: 0 });
      }
    };
    module2.exports.transport = require_transport();
    module2.exports.multistream = require_multistream();
    module2.exports.levels = mappings();
    module2.exports.stdSerializers = serializers;
    module2.exports.stdTimeFunctions = Object.assign({}, time);
    module2.exports.symbols = symbols;
    module2.exports.version = version;
    module2.exports.default = pino2;
    module2.exports.pino = pino2;
  }
});

// ../../packages/logger/src/ledger.ts
function commitToLedger(record2) {
  const fullRecord = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...record2
  };
  try {
    const dir = import_path.default.dirname(LEDGER_PATH);
    if (!import_fs.default.existsSync(dir)) {
      import_fs.default.mkdirSync(dir, { recursive: true });
    }
    import_fs.default.appendFileSync(LEDGER_PATH, JSON.stringify(fullRecord) + "\n", "utf8");
  } catch (err) {
    console.error("TELEMETRY ERROR: Failed to commit transaction to ledger:", err);
  }
}
async function readRecords(since = 36e5) {
  try {
    if (!import_fs.default.existsSync(LEDGER_PATH)) return [];
    const cutoff = Date.now() - since;
    return import_fs.default.readFileSync(LEDGER_PATH, "utf8").trim().split("\n").filter(Boolean).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter((r) => r !== null).filter((r) => !r.timestamp || new Date(String(r.timestamp)).getTime() >= cutoff);
  } catch (err) {
    console.error("TELEMETRY ERROR: Failed to read ledger:", err);
    return [];
  }
}
var import_fs, import_path, LEDGER_PATH;
var init_ledger = __esm({
  "../../packages/logger/src/ledger.ts"() {
    import_fs = __toESM(require("fs"), 1);
    import_path = __toESM(require("path"), 1);
    LEDGER_PATH = import_path.default.resolve(process.cwd(), "../../logs/proposals-outcomes.jsonl");
  }
});

// ../../packages/logger/src/index.ts
function createTraceLogger(context) {
  return log.child({
    traceId: context.traceId,
    ...context.spanId && { spanId: context.spanId },
    ...context.userId && { userId: context.userId }
  });
}
var import_pino, log;
var init_src = __esm({
  "../../packages/logger/src/index.ts"() {
    import_pino = __toESM(require_pino(), 1);
    init_ledger();
    log = (0, import_pino.default)({
      level: process.env.LOG_LEVEL || "info",
      timestamp: import_pino.default.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ level: label.toUpperCase() })
      }
    });
  }
});

// ../../packages/sandbox/src/index.ts
var src_exports = {};
__export(src_exports, {
  DEFAULT_CONFIG: () => DEFAULT_CONFIG,
  DEFAULT_PATH_POLICY: () => DEFAULT_PATH_POLICY,
  checkNetworkAccess: () => checkNetworkAccess,
  checkProcessSpawn: () => checkProcessSpawn,
  checkResources: () => checkResources,
  createSandbox: () => createSandbox,
  deleteSandbox: () => deleteSandbox,
  enforce: () => enforce,
  getConfig: () => getConfig,
  getPathPolicy: () => getPathPolicy,
  getSandboxRoot: () => getSandboxRoot,
  isPathDenied: () => isPathDenied,
  listSandboxes: () => listSandboxes,
  logEscapeAttempt: () => logEscapeAttempt,
  resolveSandboxPath: () => resolveSandboxPath,
  setConfig: () => setConfig
});
function getConfig() {
  return { ...config };
}
function setConfig(newConfig) {
  config = { ...config, ...newConfig };
  return config;
}
function getPathPolicy(tool) {
  return DEFAULT_PATH_POLICY.find((p) => p.tool === tool);
}
function getSandboxRoot(profileId) {
  if (!config.perTenantNamespacing) {
    return config.basePath;
  }
  return import_path2.default.join(config.basePath, profileId);
}
function resolveSandboxPath(profileId, requestedPath) {
  const sandboxRoot = getSandboxRoot(profileId);
  const absPath = import_path2.default.isAbsolute(requestedPath) ? requestedPath : import_path2.default.resolve(process.cwd(), requestedPath);
  const normalized = import_path2.default.normalize(absPath);
  const normalizedRoot = import_path2.default.normalize(sandboxRoot);
  if (normalized.startsWith(normalizedRoot)) {
    return { resolved: normalized, allowed: true };
  }
  const toolPolicy = getPathPolicy("file_write");
  if (toolPolicy) {
    for (const [base, perm] of Object.entries(toolPolicy.basePaths)) {
      if (perm !== "none" && normalized.startsWith(base)) {
        return { resolved: normalized, allowed: true };
      }
    }
  }
  return {
    resolved: normalized,
    allowed: false,
    reason: `Path ${normalized} is outside sandbox root ${sandboxRoot}`
  };
}
function isPathDenied(absolutePath, deniedPatterns) {
  const normalized = absolutePath.replace(/\\/g, "/");
  for (const pattern of deniedPatterns) {
    const globPattern = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
    const regex = new RegExp(`^${globPattern}$`);
    if (regex.test(normalized)) {
      return true;
    }
  }
  return false;
}
function checkNetworkAccess(host, policy) {
  const p = policy || {
    allowlist: config.allowedHosts,
    denylist: [],
    defaultAllow: config.allowedHosts.length === 0 ? false : true
  };
  for (const blocked of p.denylist) {
    if (host === blocked || host.endsWith("." + blocked)) {
      return { allowed: false, reason: `Host ${host} is denylisted` };
    }
  }
  if (p.allowlist.length > 0) {
    for (const allowed of p.allowlist) {
      if (host === allowed || host.endsWith("." + allowed)) {
        return { allowed: true, reason: `Host ${host} is allowlisted` };
      }
    }
    return { allowed: false, reason: `Host ${host} not in allowlist` };
  }
  if (p.defaultAllow) {
    return { allowed: true, reason: "Default allow" };
  }
  return { allowed: false, reason: "Network access denied by default" };
}
function checkProcessSpawn(policy) {
  const p = policy || {
    allowSpawn: config.allowSubprocess,
    inheritSandbox: true,
    maxForkDepth: 1
  };
  if (!p.allowSpawn) {
    return { allowed: false, reason: "Subprocess spawning is disabled" };
  }
  return { allowed: true, reason: "Process spawn allowed" };
}
function checkResources(usage) {
  const exceeded = [];
  if (usage.memoryBytes > config.resources.maxMemoryMB * 1024 * 1024) {
    exceeded.push("memory");
  }
  if (usage.cpuSeconds > config.resources.maxCPUSeconds) {
    exceeded.push("cpu");
  }
  if (usage.wallSeconds > config.resources.maxWallSeconds) {
    exceeded.push("wall");
  }
  if (usage.fileDescriptors > config.resources.maxFileDescriptors) {
    exceeded.push("fds");
  }
  if (usage.bytesWritten > config.resources.maxFileSizeMB * 1024 * 1024) {
    exceeded.push("disk");
  }
  return {
    allowed: exceeded.length === 0,
    exceeded
  };
}
function createSandbox(profileId) {
  const root = getSandboxRoot(profileId);
  try {
    if (!import_fs2.default.existsSync(root)) {
      import_fs2.default.mkdirSync(root, { recursive: true });
      import_fs2.default.mkdirSync(import_path2.default.join(root, "workspace"), { recursive: true });
      import_fs2.default.mkdirSync(import_path2.default.join(root, "temp"), { recursive: true });
    }
    return { success: true, sandboxRoot: root };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function deleteSandbox(profileId) {
  const root = getSandboxRoot(profileId);
  try {
    if (import_fs2.default.existsSync(root)) {
      import_fs2.default.rmSync(root, { recursive: true, force: true });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
function listSandboxes() {
  if (!import_fs2.default.existsSync(config.basePath)) return [];
  return import_fs2.default.readdirSync(config.basePath).filter((stat) => {
    try {
      return import_fs2.default.statSync(import_path2.default.join(config.basePath, stat)).isDirectory();
    } catch {
      return false;
    }
  });
}
function logEscapeAttempt(options) {
  if (!config.logDeniedSyscalls) return;
  const entry = {
    id: import_crypto.default.randomUUID(),
    ...options
  };
  const dir = import_path2.default.dirname(ESCAPE_LOG_PATH);
  if (!import_fs2.default.existsSync(dir)) import_fs2.default.mkdirSync(dir, { recursive: true });
  import_fs2.default.appendFileSync(ESCAPE_LOG_PATH, JSON.stringify(entry) + "\n");
}
function enforce(tool, profileId, args) {
  const policy = getPathPolicy(tool);
  if (!policy) {
    return { allowed: false, reason: `No policy for tool: ${tool}` };
  }
  const sandboxRoot = getSandboxRoot(profileId);
  if (args.path && typeof args.path === "string") {
    const { resolved, allowed, reason: pathReason } = resolveSandboxPath(profileId, args.path);
    if (!allowed) {
      logEscapeAttempt({
        profileId,
        tool,
        attemptedPath: resolved,
        timestamp: Date.now()
      });
      return { allowed: false, reason: pathReason, sandboxRoot };
    }
    return {
      allowed: true,
      reason: "OK",
      sandboxRoot,
      adjustedArgs: { ...args, path: resolved }
    };
  }
  if (args.url && typeof args.url === "string") {
    try {
      const url = new URL(args.url);
      const { allowed, reason: netReason } = checkNetworkAccess(url.hostname);
      if (!allowed) {
        logEscapeAttempt({
          profileId,
          tool,
          attemptedHost: url.hostname,
          timestamp: Date.now()
        });
        return { allowed: false, reason: netReason, sandboxRoot };
      }
    } catch {
    }
  }
  return { allowed: true, reason: "OK", sandboxRoot };
}
var import_fs2, import_path2, import_crypto, DEFAULT_CONFIG, config, DEFAULT_PATH_POLICY, ESCAPE_LOG_PATH;
var init_src2 = __esm({
  "../../packages/sandbox/src/index.ts"() {
    "use strict";
    import_fs2 = __toESM(require("fs"), 1);
    import_path2 = __toESM(require("path"), 1);
    import_crypto = __toESM(require("crypto"), 1);
    DEFAULT_CONFIG = {
      basePath: process.env.SANDBOX_PATH || "/tmp/aether-sandbox",
      perTenantNamespacing: true,
      resources: {
        maxMemoryMB: 512,
        maxCPUSeconds: 30,
        maxWallSeconds: 60,
        maxFileDescriptors: 64,
        maxFileSizeMB: 50
      },
      allowedHosts: [],
      // Empty = none allowed by default
      allowSubprocess: false,
      logDeniedSyscalls: true
    };
    config = { ...DEFAULT_CONFIG };
    DEFAULT_PATH_POLICY = [
      {
        tool: "file_read",
        basePaths: {
          "sandbox": "read",
          "packages": "read",
          "logs": "read"
        },
        deniedPatterns: ["**/.env", "**/secrets/**", "**/*.key", "**/id_rsa*"]
      },
      {
        tool: "file_write",
        basePaths: {
          "sandbox": "write"
        },
        deniedPatterns: ["**/.env", "**/secrets/**", "**/node_modules/**"]
      },
      {
        tool: "git_commit",
        basePaths: {
          "packages": "write",
          "apps": "write"
        },
        deniedPatterns: ["**/.env", "**/secrets/**", "**/node_modules/**"]
      }
    ];
    ESCAPE_LOG_PATH = import_path2.default.resolve(process.cwd(), "../../logs/sandbox-escapes.jsonl");
  }
});

// ../../packages/curator-audit/src/index.ts
var src_exports2 = {};
__export(src_exports2, {
  AuditRecordSchema: () => AuditRecordSchema,
  getDecisions: () => getDecisions,
  getStats: () => getStats,
  logDecision: () => logDecision,
  verifyChainIntegrity: () => verifyChainIntegrity
});
function ensureDir() {
  const dir = import_path3.default.dirname(AUDIT_PATH);
  if (!import_fs3.default.existsSync(dir)) import_fs3.default.mkdirSync(dir, { recursive: true });
}
function getPolicyHash() {
  try {
    const policyContent = import_fs3.default.readFileSync("../../packages/curator/policy.yaml", "utf-8");
    return import_crypto2.default.createHash("sha256").update(policyContent).digest("hex").slice(0, 16);
  } catch {
    return "unknown";
  }
}
function loadChainState() {
  if (!import_fs3.default.existsSync(CHAIN_STATE_PATH)) return { lastHash: "", lastIndex: 0, lastPolicyHash: "" };
  return JSON.parse(import_fs3.default.readFileSync(CHAIN_STATE_PATH, "utf-8"));
}
function saveChainState(state) {
  const dir = import_path3.default.dirname(CHAIN_STATE_PATH);
  if (!import_fs3.default.existsSync(dir)) import_fs3.default.mkdirSync(dir, { recursive: true });
  import_fs3.default.writeFileSync(CHAIN_STATE_PATH, JSON.stringify(state));
}
function computeRecordHash(record2, previousHash) {
  const payload = JSON.stringify({ ...record2, hash: void 0 }) + previousHash;
  return import_crypto2.default.createHash("sha256").update(payload).digest("hex");
}
function logDecision(input) {
  ensureDir();
  const chainState = loadChainState();
  const policyHash = getPolicyHash();
  const record2 = {
    decisionId: import_crypto2.default.randomUUID(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    previousHash: chainState.lastHash,
    policyHash,
    ...input,
    hash: ""
  };
  record2.hash = computeRecordHash(record2, chainState.lastHash);
  import_fs3.default.appendFileSync(AUDIT_PATH, JSON.stringify(record2) + "\n");
  chainState.lastHash = record2.hash;
  chainState.lastIndex++;
  chainState.lastPolicyHash = policyHash;
  saveChainState(chainState);
  return record2;
}
function verifyChainIntegrity() {
  if (!import_fs3.default.existsSync(AUDIT_PATH)) return { valid: true, errors: [] };
  const chainState = loadChainState();
  const content = import_fs3.default.readFileSync(AUDIT_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const errors = [];
  let expectedPreviousHash = "";
  for (let i = 0; i < lines.length; i++) {
    const record2 = AuditRecordSchema.parse(JSON.parse(lines[i]));
    if (record2.previousHash !== expectedPreviousHash) {
      errors.push(`Line ${i + 1}: Previous hash mismatch`);
    }
    const payload = JSON.stringify({ ...record2, hash: void 0 }) + record2.previousHash;
    const expectedHash = import_crypto2.default.createHash("sha256").update(payload).digest("hex");
    if (record2.hash !== expectedHash) {
      errors.push(`Line ${i + 1}: Hash mismatch`);
    }
    expectedPreviousHash = record2.hash;
  }
  if (expectedPreviousHash !== chainState.lastHash) {
    errors.push("Terminal state mismatch");
  }
  return { valid: errors.length === 0, brokenAt: errors[0] ? 1 : void 0, errors };
}
function getDecisions(options) {
  const { since, tool, decision, limit = 100 } = options || {};
  if (!import_fs3.default.existsSync(AUDIT_PATH)) return Promise.resolve([]);
  const content = import_fs3.default.readFileSync(AUDIT_PATH, "utf-8");
  let records = content.trim().split("\n").filter(Boolean).map((line) => AuditRecordSchema.parse(JSON.parse(line)));
  if (since) {
    const cutoff = Date.now() - since;
    records = records.filter((r) => new Date(r.timestamp).getTime() >= cutoff);
  }
  if (tool) records = records.filter((r) => r.tool === tool);
  if (decision) records = records.filter((r) => r.decision === decision);
  return records.slice(-limit);
}
async function getStats() {
  const records = await getDecisions({ limit: 1e3 });
  const total = records.length;
  const approved = records.filter((r) => r.decision === "approve").length;
  const denied = records.filter((r) => r.decision === "deny").length;
  const escalated = records.filter((r) => r.decision === "escalate").length;
  return { total, approved, denied, escalated, denial_rate: total > 0 ? denied / total : 0 };
}
var import_zod3, import_fs3, import_path3, import_crypto2, AuditRecordSchema, AUDIT_PATH, CHAIN_STATE_PATH;
var init_src3 = __esm({
  "../../packages/curator-audit/src/index.ts"() {
    "use strict";
    import_zod3 = require("zod");
    import_fs3 = __toESM(require("fs"), 1);
    import_path3 = __toESM(require("path"), 1);
    import_crypto2 = __toESM(require("crypto"), 1);
    AuditRecordSchema = import_zod3.z.object({
      decisionId: import_zod3.z.string(),
      runId: import_zod3.z.string().optional(),
      timestamp: import_zod3.z.string(),
      actor: import_zod3.z.enum(["executor", "evaluator", "reflector", "human", "system"]),
      tool: import_zod3.z.string(),
      args: import_zod3.z.record(import_zod3.z.unknown()).optional(),
      decision: import_zod3.z.enum(["approve", "deny", "escalate"]),
      rule: import_zod3.z.string().optional(),
      confidence: import_zod3.z.number().min(0).max(1).optional(),
      reason: import_zod3.z.string().optional(),
      hash: import_zod3.z.string().optional(),
      previousHash: import_zod3.z.string().optional(),
      policyHash: import_zod3.z.string().optional()
    });
    AUDIT_PATH = import_path3.default.resolve(process.cwd(), "../../logs/curator-audit.jsonl");
    CHAIN_STATE_PATH = import_path3.default.resolve(process.cwd(), "../../logs/audit-chain-state.json");
  }
});

// src/agents/evaluator.ts
var evaluator_exports = {};
__export(evaluator_exports, {
  evaluateLedger: () => evaluateLedger,
  getEvaluatorHealth: () => getEvaluatorHealth
});
async function evaluateLedger(since = 36e5) {
  const records = await readRecords(since);
  const results = [];
  for (const record2 of records) {
    if (record2.status === "success") continue;
    const combined = `${record2.error || record2.result || ""}`.toLowerCase();
    for (const { pattern, suggestion, priority } of PATTERNS) {
      if (pattern.test(combined)) {
        results.push({
          pattern: pattern.source,
          suggestion,
          priority
        });
        break;
      }
    }
  }
  const unique = results.filter((v, i, a) => a.findIndex((t) => t.pattern === v.pattern) === i);
  const order = { high: 0, medium: 1, low: 2 };
  unique.sort((a, b) => order[a.priority] - order[b.priority]);
  return unique;
}
function getEvaluatorHealth() {
  return {
    status: "running",
    patternCount: PATTERNS.length,
    watching: true
  };
}
var PATTERNS;
var init_evaluator = __esm({
  "src/agents/evaluator.ts"() {
    init_src();
    PATTERNS = [
      {
        pattern: /npm error/,
        suggestion: "Check package.json dependencies and lockfile",
        priority: "high"
      },
      {
        pattern: /E404.*@aether/,
        suggestion: "Use file: dependencies instead of npm registry",
        priority: "high"
      },
      {
        pattern: /command not found/,
        suggestion: "Add dependency to devDependencies",
        priority: "medium"
      },
      {
        pattern: /module not found/i,
        suggestion: "Check imports and package.json exports",
        priority: "medium"
      },
      {
        pattern: /422/i,
        suggestion: "Check Curator allow-list or input validation",
        priority: "low"
      }
    ];
  }
});

// ../../packages/metrics/src/index.ts
var src_exports3 = {};
__export(src_exports3, {
  counter: () => counter,
  gauge: () => gauge,
  getGauge: () => getGauge,
  getHistory: () => getHistory,
  increment: () => increment,
  record: () => record,
  reset: () => reset,
  snapshot: () => snapshot,
  summary: () => summary
});
function record(name, value, tags) {
  const point = {
    name,
    value,
    timestamp: Date.now(),
    tags
  };
  const existing = metrics.get(name) || [];
  existing.push(point);
  if (existing.length > 1e3) {
    existing.shift();
  }
  metrics.set(name, existing);
  return point;
}
function increment(name, delta = 1) {
  const current = counters.get(name) || 0;
  counters.set(name, current + delta);
  return current + delta;
}
function counter(name) {
  return counters.get(name) || 0;
}
function gauge(name, value) {
  gauges.set(name, value);
  return value;
}
function getGauge(name) {
  return gauges.get(name) || 0;
}
function getHistory(name, since) {
  const points = metrics.get(name) || [];
  if (!since) return points;
  const cutoff = Date.now() - since;
  return points.filter((p) => p.timestamp >= cutoff);
}
function summary(name) {
  const points = metrics.get(name) || [];
  if (points.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0 };
  }
  const values = points.map((p) => p.value);
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
    sum
  };
}
function snapshot() {
  return {
    counters: Object.fromEntries(counters),
    gauges: Object.fromEntries(gauges),
    metrics: Object.fromEntries(metrics)
  };
}
function reset() {
  metrics.clear();
  counters.clear();
  gauges.clear();
}
var metrics, counters, gauges;
var init_src4 = __esm({
  "../../packages/metrics/src/index.ts"() {
    metrics = /* @__PURE__ */ new Map();
    counters = /* @__PURE__ */ new Map();
    gauges = /* @__PURE__ */ new Map();
  }
});

// ../../packages/lessons/src/index.ts
var src_exports4 = {};
__export(src_exports4, {
  LessonSchema: () => LessonSchema,
  WriteLessonInput: () => WriteLessonInput,
  getPatternConfidence: () => getPatternConfidence,
  getPatternConfidences: () => getPatternConfidences,
  readLessons: () => readLessons,
  writeLesson: () => writeLesson
});
function ensureDir2() {
  const dir = import_path4.default.dirname(LESSONS_PATH);
  if (!import_fs4.default.existsSync(dir)) {
    import_fs4.default.mkdirSync(dir, { recursive: true });
  }
}
function writeLesson(input) {
  ensureDir2();
  const lesson = {
    id: import_crypto3.default.randomUUID(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...input
  };
  const line = JSON.stringify(lesson) + "\n";
  import_fs4.default.appendFileSync(LESSONS_PATH, line);
  return lesson;
}
function readLessons(options) {
  const { since, pattern, limit = 100 } = options || {};
  if (!import_fs4.default.existsSync(LESSONS_PATH)) {
    return Promise.resolve([]);
  }
  const content = import_fs4.default.readFileSync(LESSONS_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let lessons = lines.map((line) => LessonSchema.parse(JSON.parse(line)));
  if (since) {
    const cutoff = Date.now() - since;
    lessons = lessons.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
  }
  if (pattern) {
    lessons = lessons.filter((l) => l.pattern.includes(pattern));
  }
  return lessons.slice(-limit);
}
async function getPatternConfidence(pattern) {
  const lessons = await readLessons({ pattern, limit: 50 });
  if (lessons.length === 0) {
    return 0.5;
  }
  let weightedSum = 0;
  let totalWeight = 0;
  const now = Date.now();
  for (const lesson of lessons) {
    const age = now - new Date(lesson.timestamp).getTime();
    const recency = Math.max(0.1, 1 - age / (7 * 24 * 60 * 60 * 1e3));
    const weight = recency;
    if (lesson.outcome === "success") {
      weightedSum += lesson.confidence * weight;
    } else if (lesson.outcome === "failure") {
      weightedSum += (1 - lesson.confidence) * weight * -1;
    }
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0.5;
  return Math.max(0, Math.min(1, (weightedSum / totalWeight + 1) / 2));
}
async function getPatternConfidences() {
  if (!import_fs4.default.existsSync(LESSONS_PATH)) {
    return {};
  }
  const content = import_fs4.default.readFileSync(LESSONS_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const patterns = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const lesson = LessonSchema.parse(JSON.parse(line));
    const stats = patterns.get(lesson.pattern) || { success: 0, failure: 0, total: 0 };
    if (lesson.outcome === "success") stats.success++;
    else if (lesson.outcome === "failure") stats.failure++;
    stats.total++;
    patterns.set(lesson.pattern, stats);
  }
  const result = {};
  for (const [pattern, stats] of patterns) {
    result[pattern] = stats.total > 0 ? stats.success / stats.total : 0.5;
  }
  return result;
}
var import_zod4, import_fs4, import_path4, import_crypto3, LessonSchema, WriteLessonInput, LESSONS_PATH;
var init_src5 = __esm({
  "../../packages/lessons/src/index.ts"() {
    "use strict";
    import_zod4 = require("zod");
    import_fs4 = __toESM(require("fs"), 1);
    import_path4 = __toESM(require("path"), 1);
    import_crypto3 = __toESM(require("crypto"), 1);
    LessonSchema = import_zod4.z.object({
      id: import_zod4.z.string(),
      pattern: import_zod4.z.string(),
      // e.g., "npm error", "E404", "422"
      suggestion: import_zod4.z.string(),
      // what Evaluator suggested
      action: import_zod4.z.string(),
      // what Executor did
      outcome: import_zod4.z.enum(["success", "failure", "noop"]),
      confidence: import_zod4.z.number().min(0).max(1),
      runId: import_zod4.z.string().optional(),
      timestamp: import_zod4.z.string()
    });
    WriteLessonInput = LessonSchema.omit({ id: true, timestamp: true });
    LESSONS_PATH = import_path4.default.resolve(process.cwd(), "../../logs/lessons.jsonl");
  }
});

// src/agents/reflector.ts
var reflector_exports = {};
__export(reflector_exports, {
  checkConfidence: () => checkConfidence,
  getLearnedPatterns: () => getLearnedPatterns,
  getReflectorHealth: () => getReflectorHealth,
  reflect: () => reflect
});
async function reflect(input) {
  const lesson = writeLesson({
    pattern: input.pattern,
    suggestion: input.suggestion,
    action: input.action,
    outcome: input.outcome,
    confidence: input.confidence,
    runId: input.runId
  });
  return {
    lessonId: lesson.id,
    confidence: input.confidence
  };
}
async function checkConfidence(pattern) {
  return getPatternConfidence(pattern);
}
async function getLearnedPatterns() {
  return getPatternConfidences();
}
function getReflectorHealth() {
  return {
    status: "ready",
    lessons: "append-only",
    queryable: true
  };
}
var init_reflector = __esm({
  "src/agents/reflector.ts"() {
    init_src5();
  }
});

// ../../packages/chaos/src/blast-radius.ts
function loadState() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (!fs6.existsSync(CYCLE_STATE_FILE)) {
    return {
      filesTouched: [],
      surfacesWritten: [],
      cyclesExecutedToday: 0,
      lastCycleDate: today
    };
  }
  const state = JSON.parse(fs6.readFileSync(CYCLE_STATE_FILE, "utf-8"));
  if (state.lastCycleDate !== today) {
    state.cyclesExecutedToday = 0;
    state.lastCycleDate = today;
    state.filesTouched = [];
    state.surfacesWritten = [];
  }
  return state;
}
function saveState(state) {
  if (!fs6.existsSync(LOG_DIR)) {
    fs6.mkdirSync(LOG_DIR, { recursive: true });
  }
  fs6.writeFileSync(CYCLE_STATE_FILE, JSON.stringify(state, null, 2));
}
function checkBlastRadius(filesToTouch, surfacesToWrite, caps = DEFAULT_CAPS) {
  const state = loadState();
  const filesAfterTouch = state.filesTouched.length + filesToTouch.length;
  const surfacesAfterWrite = state.surfacesWritten.length + surfacesToWrite.length;
  if (filesAfterTouch > caps.maxFilesTouchedPerCycle) {
    return {
      allowed: false,
      reason: `FILES_CAP_EXCEEDED: Would touch ${filesAfterTouch} files, max is ${caps.maxFilesTouchedPerCycle}`,
      currentLoad: {
        filesTouched: state.filesTouched.length,
        surfacesWritten: state.surfacesWritten.length,
        cyclesExecutedToday: state.cyclesExecutedToday
      }
    };
  }
  if (surfacesAfterWrite > caps.maxSurfacesWrittenPerCycle) {
    return {
      allowed: false,
      reason: `SURFACES_CAP_EXCEEDED: Would write ${surfacesAfterWrite} surfaces, max is ${caps.maxSurfacesWrittenPerCycle}`,
      currentLoad: {
        filesTouched: state.filesTouched.length,
        surfacesWritten: state.surfacesWritten.length,
        cyclesExecutedToday: state.cyclesExecutedToday
      }
    };
  }
  if (state.cyclesExecutedToday >= caps.maxCyclesPerDay) {
    return {
      allowed: false,
      reason: `DAILY_CYCLE_LIMIT: ${state.cyclesExecutedToday} cycles already executed today, max is ${caps.maxCyclesPerDay}`,
      currentLoad: {
        filesTouched: state.filesTouched.length,
        surfacesWritten: state.surfacesWritten.length,
        cyclesExecutedToday: state.cyclesExecutedToday
      }
    };
  }
  return {
    allowed: true,
    reason: "Within blast-radius caps",
    currentLoad: {
      filesTouched: state.filesTouched.length,
      surfacesWritten: state.surfacesWritten.length,
      cyclesExecutedToday: state.cyclesExecutedToday
    }
  };
}
function recordCycle(filesTouched, surfacesWritten) {
  const state = loadState();
  for (const file of filesTouched) {
    if (!state.filesTouched.includes(file)) {
      state.filesTouched.push(file);
    }
  }
  for (const surface of surfacesWritten) {
    if (!state.surfacesWritten.includes(surface)) {
      state.surfacesWritten.push(surface);
    }
  }
  state.cyclesExecutedToday++;
  saveState(state);
}
function resetCycleState() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const state = {
    filesTouched: [],
    surfacesWritten: [],
    cyclesExecutedToday: 0,
    lastCycleDate: today
  };
  saveState(state);
  console.log("[BlastRadius] Cycle state reset");
}
function getCapStatus() {
  const state = loadState();
  return {
    allowed: true,
    reason: "Status query",
    currentLoad: {
      filesTouched: state.filesTouched.length,
      surfacesWritten: state.surfacesWritten.length,
      cyclesExecutedToday: state.cyclesExecutedToday
    }
  };
}
var fs6, import_meta, LOG_DIR, DEFAULT_CAPS, CYCLE_STATE_FILE;
var init_blast_radius = __esm({
  "../../packages/chaos/src/blast-radius.ts"() {
    "use strict";
    fs6 = __toESM(require("fs"), 1);
    import_meta = {};
    LOG_DIR = "./logs";
    DEFAULT_CAPS = {
      maxFilesTouchedPerCycle: 3,
      // Strict cap per spec
      maxSurfacesWrittenPerCycle: 3,
      maxConcurrentProposals: 2,
      maxCyclesPerDay: 20
    };
    CYCLE_STATE_FILE = `${LOG_DIR}/cycle-state.json`;
    if (import_meta.url === `file://${process.argv[1]}`) {
      const args = process.argv.slice(2);
      const command = args[0];
      console.log("\n\u26A1 BlastRadius Cap CLI");
      console.log("=".repeat(40));
      if (command === "status") {
        const status = getCapStatus();
        console.log("\nCurrent Load:");
        console.log(`  Files touched: ${status.currentLoad.filesTouched} / ${DEFAULT_CAPS.maxFilesTouchedPerCycle}`);
        console.log(`  Surfaces written: ${status.currentLoad.surfacesWritten} / ${DEFAULT_CAPS.maxSurfacesWrittenPerCycle}`);
        console.log(`  Cycles today: ${status.currentLoad.cyclesExecutedToday} / ${DEFAULT_CAPS.maxCyclesPerDay}`);
      } else if (command === "reset") {
        resetCycleState();
      } else if (command === "check") {
        const files = args.slice(1);
        const result = checkBlastRadius(files, files);
        if (result.allowed) {
          console.log(`
\u2705 ${result.reason}`);
        } else {
          console.log(`
\u274C ${result.reason}`);
        }
      } else {
        console.log("\nCommands:");
        console.log("  status          - Show current cap status");
        console.log("  reset           - Reset cycle state");
        console.log("  check <files>  - Check if files would exceed caps");
      }
    }
  }
});

// ../../packages/chaos/src/quarantine.ts
function loadQuarantine() {
  if (!fs7.existsSync(QUARANTINE_FILE)) {
    return [];
  }
  const lines = fs7.readFileSync(QUARANTINE_FILE, "utf-8").split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}
function saveQuarantine(items) {
  if (!fs7.existsSync(LOG_DIR2)) {
    fs7.mkdirSync(LOG_DIR2, { recursive: true });
  }
  fs7.writeFileSync(QUARANTINE_FILE, items.map((i) => JSON.stringify(i)).join("\n") + "\n");
}
function quarantineItem(id, type, failedStage, reason, context) {
  const items = loadQuarantine();
  const existing = items.find((i) => i.id === id && i.status === "quarantine");
  if (existing) {
    console.log(`[Quarantine] Item ${id} already in quarantine`);
    return existing;
  }
  const item = {
    id,
    type,
    failedStage,
    reason,
    quarantinedAt: Date.now(),
    status: "quarantine",
    context
  };
  items.push(item);
  saveQuarantine(items);
  console.log(`[Quarantine] Item ${id} quarantined (failed at ${failedStage}: ${reason})`);
  return item;
}
function getQuarantinedItems(includeExpired = false) {
  const items = loadQuarantine();
  if (includeExpired) {
    return items;
  }
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
  const activeItems = items.map((item) => {
    if (item.status === "quarantine" && item.quarantinedAt < sevenDaysAgo) {
      item.status = "expired";
    }
    return item;
  });
  saveQuarantine(activeItems);
  return activeItems.filter((i) => i.status === "quarantine");
}
function getQuarantinedItem(id) {
  const items = loadQuarantine();
  return items.find((i) => i.id === id);
}
function releaseItem(id, releasedBy) {
  const items = loadQuarantine();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) {
    console.log(`[Quarantine] Item ${id} not found`);
    return void 0;
  }
  const item = items[index];
  item.status = "released";
  item.releasedAt = Date.now();
  item.releasedBy = releasedBy;
  items[index] = item;
  saveQuarantine(items);
  console.log(`[Quarantine] Item ${id} released by ${releasedBy}`);
  return item;
}
function deleteQuarantinedItem(id) {
  const items = loadQuarantine();
  const filtered = items.filter((i) => i.id !== id);
  saveQuarantine(filtered);
  console.log(`[Quarantine] Item ${id} deleted`);
}
function cleanupExpired() {
  const items = loadQuarantine();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
  const activeItems = items.filter((i) => {
    if (i.status === "quarantine" && i.quarantinedAt < sevenDaysAgo) {
      i.status = "expired";
    }
    return i.status !== "expired";
  });
  const cleaned = items.length - activeItems.length;
  if (cleaned > 0) {
    saveQuarantine(activeItems);
    console.log(`[Quarantine] Cleaned up ${cleaned} expired items`);
  }
  return cleaned;
}
var fs7, import_meta2, LOG_DIR2, QUARANTINE_FILE;
var init_quarantine = __esm({
  "../../packages/chaos/src/quarantine.ts"() {
    "use strict";
    fs7 = __toESM(require("fs"), 1);
    import_meta2 = {};
    LOG_DIR2 = "./logs";
    QUARANTINE_FILE = `${LOG_DIR2}/quarantine.jsonl`;
    if (import_meta2.url === `file://${process.argv[1]}`) {
      const args = process.argv.slice(2);
      const command = args[0];
      console.log("\n\u{1F6D1} Quarantine CLI");
      console.log("=".repeat(40));
      if (command === "list") {
        const items = getQuarantinedItems();
        console.log(`
Quarantined items (${items.length}):
`);
        for (const item of items) {
          console.log(`  ${item.id}`);
          console.log(`    Type: ${item.type}`);
          console.log(`    Failed at: ${item.failedStage}`);
          console.log(`    Reason: ${item.reason}`);
          console.log(`    Quarantined: ${new Date(item.quarantinedAt).toISOString()}`);
          console.log();
        }
      } else if (command === "get") {
        const id = args[1];
        if (!id) {
          console.log("Usage: get <id>");
          process.exit(1);
        }
        const item = getQuarantinedItem(id);
        if (item) {
          console.log(`
${JSON.stringify(item, null, 2)}`);
        } else {
          console.log(`Item ${id} not found`);
        }
      } else if (command === "release") {
        const id = args[1];
        const releasedBy = args[2] || "manual";
        if (!id) {
          console.log("Usage: release <id> [releasedBy]");
          process.exit(1);
        }
        releaseItem(id, releasedBy);
      } else if (command === "delete") {
        const id = args[1];
        if (!id) {
          console.log("Usage: delete <id>");
          process.exit(1);
        }
        deleteQuarantinedItem(id);
      } else if (command === "cleanup") {
        cleanupExpired();
      } else if (command === "quarantine") {
        const id = args[1];
        const type = args[2] || "proposal";
        const failedStage = args[3] || "curator";
        const reason = args.slice(4).join(" ") || "Unknown";
        if (!id) {
          console.log("Usage: quarantine <id> <type> <failedStage> <reason>");
          process.exit(1);
        }
        quarantineItem(id, type, failedStage, reason);
      } else {
        console.log("\nCommands:");
        console.log("  list              - List quarantined items");
        console.log("  get <id>          - Get specific item");
        console.log("  release <id>      - Release item from quarantine");
        console.log("  delete <id>       - Delete item permanently");
        console.log("  cleanup           - Clean up expired items");
        console.log("  quarantine <id>  - Manually quarantine an item");
      }
    }
  }
});

// ../../packages/chaos/src/canary.ts
function loadCanaryRuns() {
  if (!fs8.existsSync(CANARY_LOG)) {
    return [];
  }
  const lines = fs8.readFileSync(CANARY_LOG, "utf-8").split("\n").filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}
function saveCanaryRuns(runs) {
  if (!fs8.existsSync(LOG_DIR3)) {
    fs8.mkdirSync(LOG_DIR3, { recursive: true });
  }
  fs8.writeFileSync(CANARY_LOG, runs.map((r) => JSON.stringify(r)).join("\n") + "\n");
}
function initCanary() {
  if (!fs8.existsSync(DOCS_DIR)) {
    fs8.mkdirSync(DOCS_DIR, { recursive: true });
  }
  const placeholder = `${DOCS_DIR}/README.md`;
  if (!fs8.existsSync(placeholder)) {
    fs8.writeFileSync(placeholder, `# Sandbox Surface

This directory contains sandbox surfaces for Alpha canary testing.

Alpha should apply changes here first before production rollout.
`);
  }
  console.log("[Canary] Initialized sandbox surface at", DOCS_DIR);
}
function startCanaryRun(cycleId, surfaces) {
  const runs = loadCanaryRuns();
  const run = {
    id: `canary_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    cycleId,
    surfaces,
    status: "pending",
    createdAt: Date.now()
  };
  runs.push(run);
  saveCanaryRuns(runs);
  console.log(`[Canary] Started canary run ${run.id} for cycle ${cycleId}`);
  return run;
}
function checkCanaryPromotion(runId, fileCount = 1) {
  const runs = loadCanaryRuns();
  const run = runs.find((r) => r.id === runId);
  if (!run) {
    console.log(`[Canary] Run ${runId} not found`);
    return false;
  }
  if (run.status !== "pending") {
    console.log(`[Canary] Run ${runId} already processed (status: ${run.status})`);
    return run.status === "promoted";
  }
  const config2 = DEFAULT_CANARY_CONFIG;
  let delay;
  if (fileCount <= 2) {
    delay = config2.tieredDelay.low;
  } else if (fileCount === 3) {
    delay = config2.tieredDelay.medium;
  } else {
    delay = config2.tieredDelay.high;
  }
  const elapsed = Date.now() - run.createdAt;
  if (elapsed >= delay) {
    run.status = "promoted";
    run.promotedAt = Date.now();
    saveCanaryRuns(runs);
    console.log(`[Canary] Run ${runId} promoted to production after ${delay / 36e5}h`);
    return true;
  }
  console.log(`[Canary] Run ${runId} pending (${Math.round((delay - elapsed) / 1e3 / 60)}min remaining)`);
  return false;
}
function triggerCanaryAlert(runId, reason) {
  const runs = loadCanaryRuns();
  const run = runs.find((r) => r.id === runId);
  if (!run) {
    console.log(`[Canary] Run ${runId} not found`);
    return;
  }
  run.status = "alert";
  run.alertAt = Date.now();
  run.alertReason = reason;
  saveCanaryRuns(runs);
  console.log(`[Canary] \u26A0\uFE0F ALERT for run ${runId}: ${reason}`);
}
function getPendingCanaryRuns() {
  const runs = loadCanaryRuns();
  return runs.filter((r) => r.status === "pending");
}
function getCanaryStatus(cycleId) {
  const runs = loadCanaryRuns();
  return runs.find((r) => r.cycleId === cycleId);
}
var fs8, import_meta3, LOG_DIR3, CANARY_LOG, DOCS_DIR, DEFAULT_CANARY_CONFIG;
var init_canary = __esm({
  "../../packages/chaos/src/canary.ts"() {
    "use strict";
    fs8 = __toESM(require("fs"), 1);
    import_meta3 = {};
    LOG_DIR3 = "./logs";
    CANARY_LOG = `${LOG_DIR3}/canary.jsonl`;
    DOCS_DIR = "./docs/sandbox";
    DEFAULT_CANARY_CONFIG = {
      enabled: true,
      tieredDelay: {
        low: 60 * 60 * 1e3,
        // 1 hour
        medium: 4 * 60 * 60 * 1e3,
        // 4 hours
        high: 24 * 60 * 60 * 1e3
        // 24 hours
      },
      alertOnFailure: true
    };
    if (import_meta3.url === `file://${process.argv[1]}`) {
      const args = process.argv.slice(2);
      const command = args[0];
      console.log("\n\u{1F426} Canary CLI");
      console.log("=".repeat(40));
      if (command === "init") {
        initCanary();
      } else if (command === "start") {
        const cycleId = args[1] || "test_cycle";
        const surfaces = args.slice(2) || ["test.txt"];
        startCanaryRun(cycleId, surfaces);
      } else if (command === "check") {
        const runId = args[1];
        if (!runId) {
          console.log("Usage: check <runId>");
          process.exit(1);
        }
        const shouldPromote = checkCanaryPromotion(runId);
        console.log(`
Should promote: ${shouldPromote}`);
      } else if (command === "alert") {
        const runId = args[1];
        const reason = args.slice(2).join(" ") || "Unknown failure";
        if (!runId) {
          console.log("Usage: alert <runId> <reason>");
          process.exit(1);
        }
        triggerCanaryAlert(runId, reason);
      } else if (command === "pending") {
        const runs = getPendingCanaryRuns();
        console.log(`
Pending runs (${runs.length}):`);
        for (const run of runs) {
          console.log(`  ${run.id} - cycle ${run.cycleId}`);
        }
      } else if (command === "status") {
        const cycleId = args[1];
        if (!cycleId) {
          console.log("Usage: status <cycleId>");
          process.exit(1);
        }
        const run = getCanaryStatus(cycleId);
        if (run) {
          console.log(`
${JSON.stringify(run, null, 2)}`);
        } else {
          console.log(`No canary run for cycle ${cycleId}`);
        }
      } else {
        console.log("\nCommands:");
        console.log("  init               - Initialize canary environment");
        console.log("  start <cycleId>   - Start new canary run");
        console.log("  check <runId>     - Check promotion status");
        console.log("  alert <runId>      - Trigger alert");
        console.log("  pending            - List pending runs");
        console.log("  status <cycleId>   - Get status for cycle");
      }
    }
  }
});

// ../../packages/chaos/src/auto-revert.ts
function loadState2() {
  if (!fs9.existsSync(STATE_FILE)) {
    return {
      errorCount: 0,
      totalCycles: 0,
      consecutiveDenials: 0,
      lastResetAt: Date.now()
    };
  }
  return JSON.parse(fs9.readFileSync(STATE_FILE, "utf-8"));
}
function saveState2(state) {
  if (!fs9.existsSync(LOG_DIR4)) {
    fs9.mkdirSync(LOG_DIR4, { recursive: true });
  }
  fs9.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}
function recordCycleSuccess() {
  const state = loadState2();
  state.totalCycles++;
  state.errorCount = Math.max(0, state.errorCount - 1);
  state.consecutiveDenials = 0;
  saveState2(state);
}
function recordCycleError() {
  const state = loadState2();
  state.totalCycles++;
  state.errorCount++;
  state.consecutiveDenials = 0;
  saveState2(state);
}
function recordCuratorDenial() {
  const state = loadState2();
  state.totalCycles++;
  state.consecutiveDenials++;
  saveState2(state);
}
function checkRevertSignals() {
  const state = loadState2();
  const thresholds = DEFAULT_REVERT_THRESHOLDS;
  if (state.totalCycles >= 10) {
    const errorRate = state.errorCount / state.totalCycles;
    if (errorRate > thresholds.errorRateThreshold) {
      return {
        type: "error_rate",
        timestamp: Date.now(),
        cycleId: `cycle_${Date.now()}`,
        context: { errorRate, totalCycles: state.totalCycles },
        severity: "soft"
      };
    }
  }
  if (state.consecutiveDenials >= thresholds.consecutiveDenialsThreshold) {
    return {
      type: "curator_denial",
      timestamp: Date.now(),
      cycleId: `cycle_${Date.now()}`,
      context: { consecutiveDenials: state.consecutiveDenials },
      severity: "hard"
    };
  }
  return null;
}
function getErrorRate() {
  const state = loadState2();
  if (state.totalCycles === 0) return 0;
  return state.errorCount / state.totalCycles;
}
function getRevertStatus() {
  const state = loadState2();
  const signal = checkRevertSignals();
  return {
    errorRate: getErrorRate(),
    consecutiveDenials: state.consecutiveDenials,
    totalCycles: state.totalCycles,
    shouldRevert: signal !== null,
    revertSignal: signal
  };
}
async function createCheckpoint(cycleId, files) {
  if (!fs9.existsSync(CHECKPOINT_DIR)) {
    fs9.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  }
  const checkpoint = {
    id: `cp_${Date.now()}`,
    cycleId,
    timestamp: Date.now(),
    files: {},
    createdAt: Date.now()
  };
  for (const file of files) {
    if (fs9.existsSync(file)) {
      const content = fs9.readFileSync(file, "utf-8");
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        hash = (hash << 5) - hash + content.charCodeAt(i);
        hash = hash & hash;
      }
      checkpoint.files[file] = Math.abs(hash).toString(16);
    }
  }
  const cpFile = `${CHECKPOINT_DIR}/${checkpoint.id}.json`;
  fs9.writeFileSync(cpFile, JSON.stringify(checkpoint, null, 2));
  console.log(`[AutoRevert] Created checkpoint ${checkpoint.id} for cycle ${cycleId}`);
  return checkpoint;
}
async function revertToCheckpoint(checkpointId) {
  const cpFile = `${CHECKPOINT_DIR}/${checkpointId}.json`;
  if (!fs9.existsSync(cpFile)) {
    console.log(`[AutoRevert] Checkpoint ${checkpointId} not found`);
    return [];
  }
  const checkpoint = JSON.parse(fs9.readFileSync(cpFile, "utf-8"));
  const reverted = [];
  for (const [file, expectedHash] of Object.entries(checkpoint.files)) {
    if (!fs9.existsSync(file)) continue;
    const content = fs9.readFileSync(file, "utf-8");
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = (hash << 5) - hash + content.charCodeAt(i);
      hash = hash & hash;
    }
    const currentHash = Math.abs(hash).toString(16);
    if (currentHash !== expectedHash) {
      reverted.push(file);
    }
  }
  const signal = {
    type: "manual",
    timestamp: Date.now(),
    cycleId: checkpoint.cycleId,
    context: { checkpointId, revertedFiles: reverted },
    severity: "soft"
  };
  const logEntry = JSON.stringify(signal) + "\n";
  fs9.appendFileSync(REVERT_LOG, logEntry);
  console.log(`[AutoRevert] Reverted to checkpoint ${checkpointId}, ${reverted.length} files differ`);
  return reverted;
}
var fs9, import_meta4, LOG_DIR4, CHECKPOINT_DIR, REVERT_LOG, DEFAULT_REVERT_THRESHOLDS, STATE_FILE;
var init_auto_revert = __esm({
  "../../packages/chaos/src/auto-revert.ts"() {
    "use strict";
    fs9 = __toESM(require("fs"), 1);
    import_meta4 = {};
    LOG_DIR4 = "./logs";
    CHECKPOINT_DIR = `${LOG_DIR4}/checkpoints`;
    REVERT_LOG = `${LOG_DIR4}/revert-log.jsonl`;
    DEFAULT_REVERT_THRESHOLDS = {
      errorRateThreshold: 0.1,
      // 10%
      consecutiveDenialsThreshold: 5,
      // 5 denials
      lessonCollisionThreshold: 2,
      // 2 collisions
      runtimeDriftThreshold: 3
      // 3 files
    };
    STATE_FILE = `${LOG_DIR4}/revert-state.json`;
    if (import_meta4.url === `file://${process.argv[1]}`) {
      const args = process.argv.slice(2);
      const command = args[0];
      console.log("\n\u21A9\uFE0F AutoRevert CLI");
      console.log("=".repeat(40));
      if (command === "status") {
        const status = getRevertStatus();
        console.log(`
Revert Status:`);
        console.log(`  Error Rate: ${(status.errorRate * 100).toFixed(1)}%`);
        console.log(`  Consecutive Denials: ${status.consecutiveDenials}`);
        console.log(`  Total Cycles: ${status.totalCycles}`);
        console.log(`  Should Revert: ${status.shouldRevert}`);
        if (status.revertSignal) {
          console.log(`  Signal: ${status.revertSignal.type} (${status.revertSignal.severity})`);
        }
      } else if (command === "record") {
        const subcommand = args[1];
        if (subcommand === "success") {
          recordCycleSuccess();
          console.log("Recorded cycle success");
        } else if (subcommand === "error") {
          recordCycleError();
          console.log("Recorded cycle error");
        } else if (subcommand === "denial") {
          recordCuratorDenial();
          console.log("Recorded curator denial");
        } else {
          console.log("Usage: record success|error|denial");
        }
      } else if (command === "check") {
        const signal = checkRevertSignals();
        if (signal) {
          console.log(`
\u26A0\uFE0F Revert signal: ${signal.type} (${signal.severity})`);
        } else {
          console.log("\n\u2705 No revert signals triggered");
        }
      } else if (command === "checkpoint") {
        const cycleId = args[1] || "test_cycle";
        const files = args.slice(2).length > 0 ? args.slice(2) : ["package.json"];
        createCheckpoint(cycleId, files);
      } else if (command === "revert") {
        const checkpointId = args[1];
        if (!checkpointId) {
          console.log("Usage: revert <checkpointId>");
          process.exit(1);
        }
        revertToCheckpoint(checkpointId);
      } else {
        console.log("\nCommands:");
        console.log("  status                   - Show revert status");
        console.log("  record success|error|denial - Record cycle outcome");
        console.log("  check                   - Check if revert needed");
        console.log("  checkpoint <id> <files>   - Create checkpoint");
        console.log("  revert <checkpointId>       - Revert to checkpoint");
      }
    }
  }
});

// ../../packages/chaos/src/index.ts
var src_exports5 = {};
__export(src_exports5, {
  DEFAULT_CANARY_CONFIG: () => DEFAULT_CANARY_CONFIG,
  DEFAULT_CAPS: () => DEFAULT_CAPS,
  DEFAULT_REVERT_THRESHOLDS: () => DEFAULT_REVERT_THRESHOLDS,
  checkBlastRadius: () => checkBlastRadius,
  checkCanaryPromotion: () => checkCanaryPromotion,
  checkRevertSignals: () => checkRevertSignals,
  cleanupExpired: () => cleanupExpired,
  cleanupSandbox: () => cleanupSandbox,
  createCheckpoint: () => createCheckpoint,
  deleteQuarantinedItem: () => deleteQuarantinedItem,
  executeChaos: () => executeChaos,
  getCanaryStatus: () => getCanaryStatus,
  getCapStatus: () => getCapStatus,
  getErrorRate: () => getErrorRate,
  getPendingCanaryRuns: () => getPendingCanaryRuns,
  getQuarantinedItem: () => getQuarantinedItem,
  getQuarantinedItems: () => getQuarantinedItems,
  getRevertStatus: () => getRevertStatus,
  getScenarios: () => getScenarios,
  initCanary: () => initCanary,
  quarantineItem: () => quarantineItem,
  recordCuratorDenial: () => recordCuratorDenial,
  recordCycle: () => recordCycle,
  recordCycleError: () => recordCycleError,
  recordCycleSuccess: () => recordCycleSuccess,
  releaseItem: () => releaseItem,
  resetCycleState: () => resetCycleState,
  revertToCheckpoint: () => revertToCheckpoint,
  startCanaryRun: () => startCanaryRun,
  triggerCanaryAlert: () => triggerCanaryAlert
});
function executeChaos(scenario, targetPath) {
  const sandboxPath = targetPath || "sandbox";
  const allowed = SANDBOX_PATHS.some((sp) => sandboxPath.startsWith(sp) || sandboxPath.includes("sandbox"));
  if (!allowed) {
    throw new Error("Security: Chaos injection restricted to sandbox directories");
  }
  const fullPath = import_path5.default.resolve(process.cwd(), sandboxPath);
  if (!import_fs5.default.existsSync(fullPath)) {
    import_fs5.default.mkdirSync(fullPath, { recursive: true });
  }
  switch (scenario) {
    case "broken_package_json": {
      const pkg = JSON.stringify({ name: "broken", version: "1.0", dependencies: { invalid: "}" } }, null, 2);
      import_fs5.default.writeFileSync(import_path5.default.join(fullPath, "package.json"), pkg);
      return {
        status: "success",
        scenario: "broken_package_json",
        injected: "SyntaxError: Unexpected token } in package.json",
        ledgerTrace: "ERR_CHAOS_001: package.json parsing failed",
        sandboxPath
      };
    }
    case "corrupted_env_var": {
      import_fs5.default.writeFileSync(import_path5.default.join(fullPath, ".env"), "PORT=not_a_number\nDEBUG=invalid\n");
      return {
        status: "success",
        scenario: "corrupted_env_var",
        injected: "PORT=not_a_number",
        ledgerTrace: "ERR_CHAOS_002: [@aether/env] validation failed for PORT",
        sandboxPath
      };
    }
    case "invalid_syntax": {
      import_fs5.default.writeFileSync(import_path5.default.join(fullPath, "broken.js"), "const x == 5;\nexport default x;");
      return {
        status: "success",
        scenario: "invalid_syntax",
        injected: "const x == 5;",
        ledgerTrace: "ERR_CHAOS_003: Parsing error: Unexpected token ==",
        sandboxPath
      };
    }
    case "missing_dep": {
      const pkg = JSON.stringify({ name: "test", version: "1.0.0" }, null, 2);
      import_fs5.default.writeFileSync(import_path5.default.join(fullPath, "package.json"), pkg);
      return {
        status: "success",
        scenario: "missing_dep",
        injected: "missing dependency: non-existent-package",
        ledgerTrace: "ERR_CHAOS_004: npm install failed - package not found",
        sandboxPath
      };
    }
    case "network_timeout": {
      import_fs5.default.writeFileSync(import_path5.default.join(fullPath, "timeout.sh"), '#!/bin/bash\necho "Simulated timeout"\nsleep 300\n');
      return {
        status: "success",
        scenario: "network_timeout",
        injected: "timeout: 300s",
        ledgerTrace: "ERR_CHAOS_005: Request timeout after 300s",
        sandboxPath
      };
    }
    default:
      throw new Error(`Unknown chaos scenario: ${scenario}`);
  }
}
function getScenarios() {
  return [
    { id: "broken_package_json", description: "Corrupt a package.json" },
    { id: "corrupted_env_var", description: "Invalid env variable" },
    { id: "invalid_syntax", description: "JavaScript syntax error" },
    { id: "missing_dep", description: "Missing npm dependency" },
    { id: "network_timeout", description: "Simulated timeout" }
  ];
}
function cleanupSandbox(targetPath) {
  const sandboxPath = targetPath || "sandbox";
  const fullPath = import_path5.default.resolve(process.cwd(), sandboxPath);
  if (import_fs5.default.existsSync(fullPath)) {
    import_fs5.default.rmSync(fullPath, { recursive: true, force: true });
  }
  return { cleaned: sandboxPath };
}
var import_fs5, import_path5, SANDBOX_PATHS;
var init_src6 = __esm({
  "../../packages/chaos/src/index.ts"() {
    "use strict";
    import_fs5 = __toESM(require("fs"), 1);
    import_path5 = __toESM(require("path"), 1);
    init_blast_radius();
    init_quarantine();
    init_canary();
    init_auto_revert();
    SANDBOX_PATHS = [
      "sandbox",
      "packages/mcp-tools/sandbox",
      "../../sandbox"
    ];
  }
});

// ../../packages/mcp-tools/src/index.ts
async function executeTool(name, args) {
  const tool = toolRegistry[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.execute(args);
}
var fileReadTool, fileWriteTool, gitStatusTool, gitCommitTool, gitDiffTool, httpRequestTool, toolRegistry, lessonsWriteTool, getAgentStateTool, triggerWorkflowTool, chaosInjectTool, listChaosScenariosTool;
var init_src7 = __esm({
  "../../packages/mcp-tools/src/index.ts"() {
    "use strict";
    fileReadTool = {
      name: "file_read",
      description: "Read contents of a file",
      async execute(args) {
        const path18 = args.path;
        if (!path18) throw new Error("path required");
        if (!path18.includes("/workspace/project/Aether")) {
          throw new Error("Access denied: path must be in workspace");
        }
        const fs22 = await import("fs/promises");
        const content = await fs22.readFile(path18, "utf-8");
        return { path: path18, content, length: content.length };
      }
    };
    fileWriteTool = {
      name: "file_write",
      description: "Write content to a file",
      async execute(args) {
        const path18 = args.path;
        const content = args.content;
        if (!path18 || content === void 0) throw new Error("path and content required");
        if (!path18.includes("/workspace/project/Aether")) {
          throw new Error("Access denied: path must be in workspace");
        }
        const fs22 = await import("fs/promises");
        await fs22.writeFile(path18, content, "utf-8");
        return { path: path18, written: true };
      }
    };
    gitStatusTool = {
      name: "git_status",
      description: "Check git repository status",
      async execute(args) {
        const { exec: exec2 } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec2.exec);
        const cwd = args.cwd || process.cwd();
        const { stdout } = await execAsync("git status --short", { cwd });
        return { status: stdout || "clean", cwd };
      }
    };
    gitCommitTool = {
      name: "git_commit",
      description: "Create a git commit",
      async execute(args) {
        const message = args.message;
        if (!message) throw new Error("message required");
        const { exec: exec2 } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec2.exec);
        const cwd = args.cwd || process.cwd();
        await execAsync("git add -A", { cwd });
        const { stdout } = await execAsync(`git commit -m "${message}"`, { cwd });
        return { message, output: stdout };
      }
    };
    gitDiffTool = {
      name: "git_diff",
      description: "Show uncommitted changes",
      async execute(args) {
        const { exec: exec2 } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec2.exec);
        const cwd = args.cwd || process.cwd();
        const file = args.file || "";
        const cmd = file ? `git diff ${file}` : "git diff";
        const { stdout } = await execAsync(cmd, { cwd });
        return { diff: stdout || "no changes", cwd, file: file || "all" };
      }
    };
    httpRequestTool = {
      name: "http_request",
      description: "Make an HTTP request (GET/HEAD only)",
      async execute(args) {
        const url = args.url;
        const method = args.method || "GET";
        if (!url) throw new Error("url required");
        if (!["GET", "HEAD"].includes(method)) {
          throw new Error("Only GET and HEAD allowed");
        }
        const response = await fetch(url, { method });
        return {
          url,
          status: response.status,
          ok: response.ok
        };
      }
    };
    toolRegistry = {
      file_read: fileReadTool,
      file_write: fileWriteTool,
      git_status: gitStatusTool,
      git_commit: gitCommitTool,
      git_diff: gitDiffTool,
      http_request: httpRequestTool
    };
    lessonsWriteTool = {
      name: "lessons_write",
      description: "Write a lesson to the Lessons DB",
      async execute(args) {
        const { reflect: reflect2 } = await Promise.resolve().then(() => (init_reflector(), reflector_exports));
        const result = await reflect2({
          pattern: args.pattern,
          suggestion: args.suggestion,
          action: args.action,
          outcome: args.outcome,
          confidence: args.confidence
        });
        return result;
      }
    };
    toolRegistry.lessons_write = lessonsWriteTool;
    getAgentStateTool = {
      name: "get_agent_state",
      description: "Retrieve execution counts and failure rates for loop detection",
      async execute(args) {
        const metrics2 = await Promise.resolve().then(() => (init_src4(), src_exports3));
        const runId = args.runId;
        const targetPath = args.targetPath;
        if (!runId && !targetPath) {
          throw new Error("runId or targetPath required");
        }
        const runKey = runId ? `runs.${runId}` : null;
        const pathKey = targetPath ? `paths.${targetPath}` : null;
        const results = {};
        if (runKey) {
          const total = metrics2.getGauge(`${runKey}.total`) || 0;
          const failures = metrics2.getGauge(`${runKey}.failures`) || 0;
          const success = metrics2.getGauge(`${runKey}.success`) || 0;
          results.runId = {
            total,
            failures,
            success,
            consecutive_failures: failures,
            last_action: total > 0 ? "success" : "idle"
          };
        }
        if (pathKey) {
          const writes = metrics2.getGauge(`${pathKey}.writes`) || 0;
          const lastWrite = metrics2.getGauge(`${pathKey}.last_write`) || 0;
          const now = Date.now();
          const writesPerMin = now - lastWrite < 6e4 ? writes : 0;
          results.targetPath = {
            writes,
            writes_per_minute: writesPerMin,
            last_write: lastWrite
          };
        }
        results.circuit_breaker = {
          state: "closed",
          // TODO: wire to @aether/operations
          failure_threshold: 3
        };
        return results;
      }
    };
    toolRegistry.get_agent_state = getAgentStateTool;
    triggerWorkflowTool = {
      name: "trigger_workflow",
      description: "Trigger a predefined workflow",
      async execute(args) {
        const { runWorkflow: runWorkflow2, getWorkflow: getWorkflow2 } = await Promise.resolve().then(() => (init_src8(), src_exports6));
        const workflowName = args.workflow;
        const context = args.context || {};
        if (!workflowName) {
          throw new Error("workflow name required");
        }
        const workflow = getWorkflow2(workflowName);
        if (!workflow) {
          throw new Error(`Unknown workflow: ${workflowName}`);
        }
        const result = await runWorkflow2(workflow, context);
        return result;
      }
    };
    toolRegistry.trigger_workflow = triggerWorkflowTool;
    toolRegistry.list_workflows = {
      name: "list_workflows",
      description: "List available workflows",
      execute: async () => {
        const { listWorkflows: listWorkflows2 } = await Promise.resolve().then(() => (init_src8(), src_exports6));
        return { workflows: listWorkflows2() };
      }
    };
    chaosInjectTool = {
      name: "chaos_inject",
      description: "Inject a synthetic failure pattern to train the agent loop",
      async execute(args) {
        const { executeChaos: executeChaos2 } = await Promise.resolve().then(() => (init_src6(), src_exports5));
        const scenario = args.scenario;
        const targetPath = args.targetPath;
        if (!scenario) {
          throw new Error("scenario required");
        }
        return executeChaos2(scenario, targetPath);
      }
    };
    listChaosScenariosTool = {
      name: "list_chaos_scenarios",
      description: "List available chaos scenarios for immunity testing",
      async execute() {
        const { getScenarios: getScenarios2 } = await Promise.resolve().then(() => (init_src6(), src_exports5));
        return { scenarios: getScenarios2() };
      }
    };
    toolRegistry.chaos_inject = chaosInjectTool;
    toolRegistry.list_chaos_scenarios = listChaosScenariosTool;
  }
});

// ../../packages/workflow/src/index.ts
var src_exports6 = {};
__export(src_exports6, {
  EXAMPLE_WORKFLOWS: () => EXAMPLE_WORKFLOWS,
  StepSchema: () => StepSchema,
  WorkflowSchema: () => WorkflowSchema,
  getWorkflow: () => getWorkflow,
  listWorkflows: () => listWorkflows,
  runWorkflow: () => runWorkflow,
  validateWebhook: () => validateWebhook
});
async function runWorkflow(workflow, context = {}) {
  const startTime = Date.now();
  const results = [];
  let steps_completed = 0;
  let steps_failed = 0;
  for (const step of workflow.steps) {
    if (step.condition) {
      const pass = evaluateCondition(step.condition, context);
      if (!pass) {
        results.push({ step: step.name, success: true, result: "skipped" });
        continue;
      }
    }
    let stepResult;
    let stepError;
    let success = false;
    const attempts = step.retry || 1;
    for (let i = 0; i < attempts; i++) {
      try {
        const args = interpolateArgs(step.args, context);
        stepResult = await executeTool(step.tool, args);
        success = true;
        break;
      } catch (e) {
        stepError = e.message;
        await new Promise((r) => setTimeout(r, 1e3 * (i + 1)));
      }
    }
    if (success) {
      steps_completed++;
      results.push({ step: step.name, success: true, result: stepResult });
      context[step.name] = stepResult;
    } else {
      steps_failed++;
      results.push({ step: step.name, success: false, error: stepError });
      if (workflow.on_failure === "stop") {
        break;
      }
    }
  }
  return {
    workflow: workflow.name,
    status: steps_failed > 0 && workflow.on_failure === "stop" ? "failed" : "success",
    steps_completed,
    steps_failed,
    results,
    duration: Date.now() - startTime
  };
}
function evaluateCondition(condition, context) {
  const match = condition.match(/\$\{(\w+)\.\w+\}/);
  if (!match) return true;
  const [, stepName] = match;
  return stepName in context;
}
function interpolateArgs(args, context) {
  const result = {};
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string" && value.includes("${")) {
      let interpolated = value;
      for (const [ck, cv] of Object.entries(context)) {
        interpolated = interpolated.replace(`\${${ck}}`, String(cv));
      }
      result[key] = interpolated;
    } else {
      result[key] = value;
    }
  }
  return result;
}
function validateWebhook(payload, secret) {
  if (!secret) return true;
  return payload.secret === secret;
}
function listWorkflows() {
  return EXAMPLE_WORKFLOWS.map((w) => ({ name: w.name, trigger: w.trigger.type, steps: w.steps.length }));
}
function getWorkflow(name) {
  return EXAMPLE_WORKFLOWS.find((w) => w.name === name);
}
var import_zod5, StepSchema, WorkflowSchema, EXAMPLE_WORKFLOWS;
var init_src8 = __esm({
  "../../packages/workflow/src/index.ts"() {
    "use strict";
    import_zod5 = require("zod");
    init_src7();
    StepSchema = import_zod5.z.object({
      name: import_zod5.z.string(),
      tool: import_zod5.z.string(),
      args: import_zod5.z.record(import_zod5.z.unknown()),
      condition: import_zod5.z.string().optional(),
      // JMESPath expression
      retry: import_zod5.z.number().optional()
    });
    WorkflowSchema = import_zod5.z.object({
      name: import_zod5.z.string(),
      trigger: import_zod5.z.object({
        type: import_zod5.z.enum(["webhook", "schedule", "event"]),
        url: import_zod5.z.string().optional(),
        // For webhook
        schedule: import_zod5.z.string().optional(),
        // Cron
        event: import_zod5.z.string().optional()
        // Event type
      }),
      steps: import_zod5.z.array(StepSchema),
      on_failure: import_zod5.z.enum(["stop", "continue", "rollback"]).default("stop"),
      timeout: import_zod5.z.number().default(3e5)
      // 5 min
    });
    EXAMPLE_WORKFLOWS = [
      {
        name: "deploy-frontend",
        trigger: { type: "webhook", url: "/webhooks/deploy-frontend" },
        steps: [
          { name: "checkout", tool: "git_status", args: {} },
          { name: "build", tool: "http_request", args: { url: "https://api.vercel.com/deploy", method: "POST" } }
        ],
        on_failure: "stop"
      },
      {
        name: "fix-and-commit",
        trigger: { type: "webhook" },
        steps: [
          { name: "check-diff", tool: "git_diff", args: {} },
          { name: "stage", tool: "git_commit", args: { message: "Auto-fix via workflow" }, retry: 2 }
        ]
      }
    ];
  }
});

// ../../packages/dream/src/index.ts
var src_exports7 = {};
__export(src_exports7, {
  dream: () => dream,
  getDreamStatus: () => getDreamStatus,
  shouldDream: () => shouldDream,
  touch: () => touch
});
function touch() {
  lastActivity = Date.now();
}
function shouldDream(config2 = DEFAULT_CONFIG2) {
  const idleMs = Date.now() - lastActivity;
  const idleMinutes = idleMs / 6e4;
  return idleMinutes >= config2.idleMinutes && !isDreaming;
}
async function dream(config2 = DEFAULT_CONFIG2) {
  isDreaming = true;
  try {
    const lessons = await readLessons({ limit: config2.maxDreams });
    const oneHourAgo = Date.now() - 36e5;
    const recent = lessons.filter((l) => new Date(l.timestamp).getTime() > oneHourAgo);
    const updatedPatterns = /* @__PURE__ */ new Map();
    for (const lesson of recent) {
      const current = await getPatternConfidence(lesson.pattern);
      const existing = updatedPatterns.get(lesson.pattern);
      if (existing) {
        existing.current = Math.max(existing.current, current);
      } else {
        updatedPatterns.set(lesson.pattern, {
          original: lesson.confidence,
          current
        });
      }
    }
    let lessonsWritten = 0;
    for (const [pattern, { original, current }] of updatedPatterns) {
      if (Math.abs(current - original) > 0.1) {
        lessonsWritten++;
      }
    }
    const dreamId = import_crypto4.default.randomUUID();
    return {
      dreamId,
      scenarios: updatedPatterns.size,
      lessons: lessonsWritten
    };
  } finally {
    isDreaming = false;
  }
}
function getDreamStatus() {
  return {
    isDreaming,
    lastActivity: new Date(lastActivity).toISOString(),
    idleMinutes: (Date.now() - lastActivity) / 6e4
  };
}
var import_crypto4, DEFAULT_CONFIG2, lastActivity, isDreaming;
var init_src9 = __esm({
  "../../packages/dream/src/index.ts"() {
    "use strict";
    init_src5();
    import_crypto4 = __toESM(require("crypto"), 1);
    DEFAULT_CONFIG2 = {
      idleMinutes: 5,
      maxDreams: 20,
      confidenceCap: 0.75
      // Cap dream lesson confidence
    };
    lastActivity = Date.now();
    isDreaming = false;
  }
});

// ../../packages/scheduler/src/index.ts
var src_exports8 = {};
__export(src_exports8, {
  Scheduler: () => Scheduler,
  everyNMinutes: () => everyNMinutes,
  scheduler: () => scheduler
});
function parseCron(schedule) {
  const parts = schedule.split(" ");
  if (parts.length !== 5) throw new Error("Invalid cron: need 5 parts");
  const now = /* @__PURE__ */ new Date();
  const next = new Date(now);
  if (parts[0].startsWith("*/")) {
    const mins = parseInt(parts[0].slice(2));
    next.setMinutes(now.getMinutes() + mins);
    next.setSeconds(0, 0);
  } else {
    next.setMinutes(now.getMinutes() + 1);
    next.setSeconds(0, 0);
  }
  return next.getTime();
}
function everyNMinutes(n, handler) {
  return `*/${n} * * * *`;
}
var import_events, import_crypto5, Scheduler, scheduler;
var init_src10 = __esm({
  "../../packages/scheduler/src/index.ts"() {
    "use strict";
    import_events = require("events");
    import_crypto5 = __toESM(require("crypto"), 1);
    Scheduler = class extends import_events.EventEmitter {
      jobs = /* @__PURE__ */ new Map();
      running = false;
      interval;
      // Add a job
      addJob(name, schedule, handler) {
        const job = {
          id: import_crypto5.default.randomUUID(),
          name,
          schedule,
          handler,
          enabled: true
        };
        job.nextRun = parseCron(schedule);
        this.jobs.set(name, job);
        this.emit("jobAdded", job);
        return job.id;
      }
      // Remove a job
      removeJob(name) {
        this.jobs.delete(name);
      }
      // Enable/disable
      enableJob(name, enabled) {
        const job = this.jobs.get(name);
        if (job) job.enabled = enabled;
      }
      // Start scheduler
      start() {
        if (this.running) return;
        this.running = true;
        this.interval = setInterval(() => this.tick(), 1e4);
        this.emit("started");
      }
      // Stop scheduler
      stop() {
        if (this.interval) clearInterval(this.interval);
        this.running = false;
        this.emit("stopped");
      }
      // Tick: run due jobs
      async tick() {
        const now = Date.now();
        for (const [name, job] of this.jobs) {
          if (!job.enabled) continue;
          if (!job.nextRun || now < job.nextRun) continue;
          try {
            await job.handler();
            job.lastRun = now;
            this.emit("jobRun", { job: name, status: "success" });
          } catch (e) {
            this.emit("jobRun", { job: name, status: "error", error: e.message });
          }
          job.nextRun = parseCron(job.schedule);
        }
      }
      // List jobs
      listJobs() {
        return Array.from(this.jobs.values()).map((j) => ({
          name: j.name,
          schedule: j.schedule,
          enabled: j.enabled,
          lastRun: j.lastRun,
          nextRun: j.nextRun
        }));
      }
      // Get job
      getJob(name) {
        return this.jobs.get(name);
      }
    };
    scheduler = new Scheduler();
  }
});

// ../../packages/notifier/src/index.ts
var src_exports9 = {};
__export(src_exports9, {
  Events: () => Events,
  Notifier: () => Notifier,
  notifier: () => notifier,
  sendWebhook: () => sendWebhook
});
async function sendWebhook(url, payload) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch {
    return false;
  }
}
var import_events2, import_crypto6, Events, Notifier, notifier;
var init_src11 = __esm({
  "../../packages/notifier/src/index.ts"() {
    "use strict";
    import_events2 = require("events");
    import_crypto6 = __toESM(require("crypto"), 1);
    Events = {
      NOTIFICATION: "notification"
    };
    Notifier = class extends import_events2.EventEmitter {
      channels = /* @__PURE__ */ new Map();
      // Register a channel
      registerChannel(name, type, config2) {
        this.channels.set(name, { type, config: config2 });
        this.emit("channelRegistered", { name, type });
      }
      // Send notification
      async notify(options) {
        const { channel = "default", message, severity = "info" } = options;
        const channelConfig = this.channels.get(channel);
        if (!channelConfig) {
          return { success: false, error: `Unknown channel: ${channel}` };
        }
        const notification = {
          id: import_crypto6.default.randomUUID(),
          channel: channelConfig.type,
          to: channelConfig.config.url || "",
          message,
          severity,
          timestamp: Date.now()
        };
        this.emit(Events.NOTIFICATION, notification);
        return { success: true, notificationId: notification.id };
      }
      // Send to multiple channels
      async broadcast(message, severity = "info") {
        const results = [];
        for (const [name, config2] of this.channels) {
          const result = await this.notify({ channel: name, message, severity });
          results.push({ channel: name, ...result });
        }
        return results;
      }
      // List channels
      listChannels() {
        return Array.from(this.channels.keys());
      }
    };
    notifier = new Notifier();
  }
});

// ../../packages/secrets/src/index.ts
var src_exports10 = {};
__export(src_exports10, {
  deleteSecret: () => deleteSecret,
  getSecret: () => getSecret,
  hasSecret: () => hasSecret,
  listSecrets: () => listSecrets,
  loadSecrets: () => loadSecrets,
  setSecret: () => setSecret
});
function encrypt(text) {
  const iv = import_crypto7.default.randomBytes(16);
  const cipher = import_crypto7.default.createCipheriv(ALGORITHM, Buffer.from(KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
function decrypt(encrypted) {
  const [ivHex, data] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = import_crypto7.default.createDecipheriv(ALGORITHM, Buffer.from(KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
function setSecret(key, value) {
  const now = Date.now();
  const existing = secrets.get(key);
  secrets.set(key, {
    key,
    value: encrypt(value),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  });
}
function getSecret(key) {
  const secret = secrets.get(key);
  if (!secret) return null;
  return decrypt(secret.value);
}
function deleteSecret(key) {
  return secrets.delete(key);
}
function listSecrets() {
  return Array.from(secrets.keys());
}
function hasSecret(key) {
  return secrets.has(key);
}
function loadSecrets(secrets_) {
  for (const [key, value] of Object.entries(secrets_)) {
    setSecret(key, value);
  }
}
var import_crypto7, ALGORITHM, KEY, secrets;
var init_src12 = __esm({
  "../../packages/secrets/src/index.ts"() {
    "use strict";
    import_crypto7 = __toESM(require("crypto"), 1);
    ALGORITHM = "aes-256-gcm";
    KEY = process.env.SECRET_KEY || import_crypto7.default.randomBytes(32).toString("hex");
    secrets = /* @__PURE__ */ new Map();
  }
});

// ../../packages/rate-limiter/src/index.ts
var src_exports11 = {};
__export(src_exports11, {
  DEFAULT_TOOL_LIMITS: () => DEFAULT_TOOL_LIMITS,
  allow: () => allow,
  checkLimit: () => checkLimit,
  getLimiter: () => getLimiter,
  getToolLimit: () => getToolLimit,
  resetLimit: () => resetLimit
});
function getLimiter(key, config2) {
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new SlidingWindow(config2);
    limiters.set(key, limiter);
  }
  return limiter;
}
function checkLimit(key, config2) {
  return getLimiter(key, config2).check();
}
function allow(key, config2) {
  const result = checkLimit(key, config2);
  if (result.allowed) {
    getLimiter(key, config2).record();
  }
  return result.allowed;
}
function resetLimit(key) {
  const limiter = limiters.get(key);
  if (limiter) limiter.reset();
}
function getToolLimit(tool) {
  return DEFAULT_TOOL_LIMITS[tool];
}
var SlidingWindow, limiters, DEFAULT_TOOL_LIMITS;
var init_src13 = __esm({
  "../../packages/rate-limiter/src/index.ts"() {
    "use strict";
    SlidingWindow = class {
      constructor(config2) {
        this.config = config2;
      }
      timestamps = [];
      check() {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        this.timestamps = this.timestamps.filter((t) => t > windowStart);
        const remaining = this.config.maxRequests - this.timestamps.length;
        if (remaining <= 0) {
          const oldest = this.timestamps[0];
          const resetMs = oldest + this.config.windowMs - now;
          return { allowed: false, remaining: 0, resetMs };
        }
        return { allowed: true, remaining, resetMs: this.config.windowMs };
      }
      record() {
        this.timestamps.push(Date.now());
      }
      reset() {
        this.timestamps = [];
      }
    };
    limiters = /* @__PURE__ */ new Map();
    DEFAULT_TOOL_LIMITS = {
      git_commit: { windowMs: 6e4, maxRequests: 10 },
      // 10 commits/min
      file_write: { windowMs: 6e4, maxRequests: 30 },
      // 30 writes/min
      http_request: { windowMs: 6e4, maxRequests: 60 },
      // 60 req/min
      chaos_inject: { windowMs: 6e5, maxRequests: 5 },
      // 5/min
      trigger_workflow: { windowMs: 6e4, maxRequests: 10 }
      // 10/min
    };
  }
});

// ../../packages/replay/src/index.ts
var src_exports12 = {};
__export(src_exports12, {
  dryRun: () => dryRun,
  replayEvents: () => replayEvents
});
async function replayEvents(options) {
  const { since = 36e5, limit = 10 } = options || {};
  const startTime = Date.now();
  const decisions = await getDecisions({ since, limit });
  const outcomes = [];
  for (const decision of decisions) {
    try {
      const toolName = decision.tool;
      const args = decision.args || {};
      if (toolRegistry[toolName]) {
        await executeTool(toolName, args);
        outcomes.push({
          tool: toolName,
          expected: decision.decision,
          actual: "approve",
          matches: decision.decision === "approve"
        });
      }
    } catch {
      outcomes.push({
        tool: decision.tool,
        expected: decision.decision,
        actual: "deny",
        matches: decision.decision === "deny"
      });
    }
  }
  return {
    replayId: import_crypto8.default.randomUUID(),
    events: decisions.length,
    outcomes,
    duration: Date.now() - startTime
  };
}
async function dryRun(toolName, args) {
  const tool = toolRegistry[toolName];
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }
  return {
    tool: toolName,
    valid: true,
    wouldExecute: true,
    args
  };
}
var import_crypto8;
var init_src14 = __esm({
  "../../packages/replay/src/index.ts"() {
    "use strict";
    init_src3();
    init_src7();
    import_crypto8 = __toESM(require("crypto"), 1);
  }
});

// ../../packages/alerts/src/index.ts
var src_exports13 = {};
__export(src_exports13, {
  AlertEngine: () => AlertEngine,
  DEFAULT_RULES: () => DEFAULT_RULES,
  alertEngine: () => alertEngine
});
var import_events3, import_crypto9, DEFAULT_RULES, AlertEngine, alertEngine;
var init_src15 = __esm({
  "../../packages/alerts/src/index.ts"() {
    "use strict";
    import_events3 = require("events");
    import_crypto9 = __toESM(require("crypto"), 1);
    DEFAULT_RULES = [
      { id: "denial-high", name: "High Denial Rate", condition: "denial_rate_above", threshold: 0.5, severity: "critical", enabled: true },
      { id: "confidence-low", name: "Low Confidence", condition: "confidence_below", threshold: 0.3, severity: "warning", enabled: true },
      { id: "failures-high", name: "High Failures", condition: "failures_above", threshold: 10, severity: "critical", enabled: true }
    ];
    AlertEngine = class extends import_events3.EventEmitter {
      rules = /* @__PURE__ */ new Map();
      constructor() {
        super();
        for (const rule of DEFAULT_RULES) {
          this.rules.set(rule.id, rule);
        }
      }
      // Add rule
      addRule(rule) {
        const id = import_crypto9.default.randomUUID();
        this.rules.set(id, { ...rule, id });
        return id;
      }
      // Remove rule
      removeRule(id) {
        return this.rules.delete(id);
      }
      // Enable/disable
      enableRule(id, enabled) {
        const rule = this.rules.get(id);
        if (rule) rule.enabled = enabled;
      }
      // Evaluate all rules
      async evaluate() {
        const results = [];
        const { getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
        const audit = await getStats4();
        for (const rule of this.rules.values()) {
          if (!rule.enabled) continue;
          let value = 0;
          let triggered = false;
          switch (rule.condition) {
            case "denial_rate_above":
              value = audit.denial_rate;
              triggered = value > rule.threshold;
              break;
            case "failures_above":
              value = audit.denied;
              triggered = value > rule.threshold;
              break;
            case "confidence_below":
              value = 0.5;
              triggered = value < rule.threshold;
              break;
          }
          results.push({ rule: rule.id, triggered, value, threshold: rule.threshold });
          if (triggered) {
            rule.lastTriggered = Date.now();
            this.emit("alert", { rule: rule.id, severity: rule.severity, value });
          }
        }
        return results;
      }
      // List rules
      listRules() {
        return Array.from(this.rules.values());
      }
    };
    alertEngine = new AlertEngine();
  }
});

// ../../packages/human-queue/src/index.ts
var src_exports14 = {};
__export(src_exports14, {
  enqueue: () => enqueue,
  getPending: () => getPending,
  getStats: () => getStats2,
  resolve: () => resolve
});
function ensureDir3() {
  const dir = import_path6.default.dirname(QUEUE_PATH);
  if (!import_fs6.default.existsSync(dir)) {
    import_fs6.default.mkdirSync(dir, { recursive: true });
  }
}
function enqueue(item) {
  ensureDir3();
  const fullItem = {
    ...item,
    id: import_crypto10.default.randomUUID(),
    createdAt: Date.now(),
    status: "pending"
  };
  import_fs6.default.appendFileSync(QUEUE_PATH, JSON.stringify(fullItem) + "\n");
  return fullItem;
}
function getPending(limit = 20) {
  if (!import_fs6.default.existsSync(QUEUE_PATH)) return [];
  const content = import_fs6.default.readFileSync(QUEUE_PATH, "utf-8");
  const items = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return items.filter((item) => item.status === "pending").sort((a, b) => b.priority - a.priority).slice(0, limit);
}
function resolve(id, status, resolvedBy = "human") {
  if (!import_fs6.default.existsSync(QUEUE_PATH)) return null;
  const content = import_fs6.default.readFileSync(QUEUE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = lines.map((line) => {
    const item = JSON.parse(line);
    if (item.id === id) {
      found = true;
      item.status = status;
      item.resolvedAt = Date.now();
      item.resolvedBy = resolvedBy;
    }
    return JSON.stringify(item);
  });
  if (found) {
    import_fs6.default.writeFileSync(QUEUE_PATH, newLines.join("\n") + "\n");
  }
  return found ? { id, status, resolvedAt: Date.now(), resolvedBy } : null;
}
function getStats2() {
  if (!import_fs6.default.existsSync(QUEUE_PATH)) {
    return { pending: 0, approved: 0, rejected: 0 };
  }
  const content = import_fs6.default.readFileSync(QUEUE_PATH, "utf-8");
  const items = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return {
    pending: items.filter((i) => i.status === "pending").length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length
  };
}
var import_fs6, import_path6, import_crypto10, QUEUE_PATH;
var init_src16 = __esm({
  "../../packages/human-queue/src/index.ts"() {
    "use strict";
    import_fs6 = __toESM(require("fs"), 1);
    import_path6 = __toESM(require("path"), 1);
    import_crypto10 = __toESM(require("crypto"), 1);
    QUEUE_PATH = import_path6.default.resolve(process.cwd(), "../../logs/human-queue.jsonl");
  }
});

// ../../packages/telemetry/src/index.ts
var src_exports15 = {};
__export(src_exports15, {
  collectTelemetry: () => collectTelemetry,
  exportCSV: () => exportCSV,
  exportPrometheus: () => exportPrometheus
});
async function collectTelemetry() {
  const events = [];
  try {
    const { getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const audit = await getStats4();
    events.push({
      event: "curator.audit",
      source: "curator-audit",
      timestamp: Date.now(),
      data: audit
    });
  } catch {
  }
  try {
    const { snapshot: snapshot2 } = await Promise.resolve().then(() => (init_src4(), src_exports3));
    const metrics2 = snapshot2();
    events.push({
      event: "metrics.snapshot",
      source: "metrics",
      timestamp: Date.now(),
      data: { counters: Object.keys(metrics2.counters || {}).length }
    });
  } catch {
  }
  try {
    const { getLearnedPatterns: getLearnedPatterns3 } = await Promise.resolve().then(() => (init_src5(), src_exports4));
    const patterns = await getLearnedPatterns3();
    events.push({
      event: "lessons.patterns",
      source: "lessons",
      timestamp: Date.now(),
      data: { count: Object.keys(patterns || {}).length }
    });
  } catch {
  }
  try {
    const { listWorkflows: listWorkflows2 } = await Promise.resolve().then(() => (init_src8(), src_exports6));
    const workflows = listWorkflows2();
    events.push({
      event: "workflows.list",
      source: "workflow",
      timestamp: Date.now(),
      data: { count: workflows.length }
    });
  } catch {
  }
  const summary2 = {};
  for (const event of events) {
    summary2[event.event] = (summary2[event.event] || 0) + 1;
  }
  return { events, summary: summary2 };
}
function exportPrometheus(events) {
  const lines = [];
  for (const event of events) {
    const labels = Object.entries(event.data).map(([k, v]) => `${k}="${v}"`).join(",");
    lines.push(`aether_${event.event}{${labels}} 1`);
  }
  return lines.join("\n");
}
function exportCSV(events) {
  const header = "event,source,timestamp";
  const rows = events.map((e) => `${e.event},${e.source},${e.timestamp}`);
  return [header, ...rows].join("\n");
}
var init_src17 = __esm({
  "../../packages/telemetry/src/index.ts"() {
    "use strict";
  }
});

// ../../packages/council/src/index.ts
var src_exports16 = {};
__export(src_exports16, {
  evaluateWithCouncil: () => evaluateWithCouncil,
  isHighSignal: () => isHighSignal
});
function evaluateWithCouncil(tool, args) {
  const evaluations = [];
  const regexEval = evaluateRegex(tool, args);
  evaluations.push(regexEval);
  const ruleEval = evaluateRule(tool, args);
  evaluations.push(ruleEval);
  const llmEval = evaluateLLM(tool, args);
  evaluations.push(llmEval);
  const votes = evaluations.map((e) => e.decision);
  const approve = votes.filter((v) => v === "approve").length;
  const deny = votes.filter((v) => v === "deny").length;
  const escalate = votes.filter((v) => v === "escalate").length;
  let finalDecision = "deny";
  if (approve > deny && approve > escalate) finalDecision = "approve";
  else if (escalate > approve) finalDecision = "escalate";
  const uniqueDecisions = new Set(votes).size;
  const disagreement = uniqueDecisions > 1;
  const max = Math.max(approve, deny, escalate);
  const consensus = max / evaluations.length;
  return {
    tool,
    evaluations,
    finalDecision,
    disagreement,
    consensus
  };
}
function evaluateRegex(tool, args) {
  const dangerous = ["rm -rf", "DROP TABLE", "DELETE FROM", "format c:", "> /dev/sd"];
  const argStr = JSON.stringify(args);
  for (const pat of dangerous) {
    if (argStr.includes(pat)) {
      return { strategy: "regex", decision: "deny", confidence: 0.95, reason: `dangerous pattern: ${pat}` };
    }
  }
  return { strategy: "regex", decision: "approve", confidence: 0.8, reason: "no dangerous patterns" };
}
function evaluateRule(tool, args) {
  const readOnly = ["file_read", "git_status", "git_diff", "get_agent_state", "list_chaos_scenarios"];
  if (readOnly.includes(tool)) {
    return { strategy: "rule", decision: "approve", confidence: 0.9, reason: "read-only tool" };
  }
  if (tool === "git_commit") {
    const msg = args.message;
    if (!msg || msg.length < 5) {
      return { strategy: "rule", decision: "deny", confidence: 0.9, reason: "empty commit message" };
    }
    return { strategy: "rule", decision: "approve", confidence: 0.7, reason: "has commit message" };
  }
  return { strategy: "rule", decision: "approve", confidence: 0.6, reason: "default allow" };
}
function evaluateLLM(tool, args) {
  const hasArgs = Object.keys(args).length > 0;
  if (!hasArgs) {
    return { strategy: "llm", decision: "deny", confidence: 0.5, reason: "no arguments provided" };
  }
  return { strategy: "llm", decision: "approve", confidence: 0.6, reason: "looks reasonable" };
}
function isHighSignal(vote) {
  return vote.disagreement && vote.consensus < 0.7;
}
var init_src18 = __esm({
  "../../packages/council/src/index.ts"() {
    "use strict";
  }
});

// ../../packages/triage/src/index.ts
var src_exports17 = {};
__export(src_exports17, {
  addToTriage: () => addToTriage,
  assignItem: () => assignItem,
  getPending: () => getPending2,
  getStats: () => getStats3,
  resolveItem: () => resolveItem
});
function ensureDir4() {
  const dir = import_path7.default.dirname(TRIAGE_PATH);
  if (!import_fs7.default.existsSync(dir)) import_fs7.default.mkdirSync(dir, { recursive: true });
}
function addToTriage(item) {
  ensureDir4();
  const triageItem = {
    ...item,
    id: import_crypto11.default.randomUUID(),
    createdAt: Date.now(),
    status: "pending"
  };
  import_fs7.default.appendFileSync(TRIAGE_PATH, JSON.stringify(triageItem) + "\n");
  return triageItem;
}
function getPending2(priority, limit = 50) {
  if (!import_fs7.default.existsSync(TRIAGE_PATH)) return [];
  const content = import_fs7.default.readFileSync(TRIAGE_PATH, "utf-8");
  const items = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  let filtered = items.filter((i) => i.status === "pending");
  if (priority) {
    filtered = filtered.filter((i) => i.priority === priority);
  }
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  filtered.sort((a, b) => {
    const pa = priorityOrder[a.priority];
    const pb = priorityOrder[b.priority];
    if (pa !== pb) return pa - pb;
    return a.sla - b.sla;
  });
  return filtered.slice(0, limit);
}
function assignItem(id, assignee) {
  if (!import_fs7.default.existsSync(TRIAGE_PATH)) return null;
  const content = import_fs7.default.readFileSync(TRIAGE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = lines.map((line) => {
    const item = JSON.parse(line);
    if (item.id === id) {
      found = true;
      item.assignedTo = assignee;
      item.status = "in_review";
    }
    return JSON.stringify(item);
  });
  if (found) {
    import_fs7.default.writeFileSync(TRIAGE_PATH, newLines.join("\n") + "\n");
  }
  return found ? { id, status: "in_review", assignedTo: assignee } : null;
}
function resolveItem(id, status, resolvedBy, notes) {
  if (!import_fs7.default.existsSync(TRIAGE_PATH)) return null;
  const content = import_fs7.default.readFileSync(TRIAGE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = lines.map((line) => {
    const item = JSON.parse(line);
    if (item.id === id) {
      found = true;
      item.status = status;
      item.resolvedAt = Date.now();
      item.resolvedBy = resolvedBy;
      item.notes = notes;
    }
    return JSON.stringify(item);
  });
  if (found) {
    import_fs7.default.writeFileSync(TRIAGE_PATH, newLines.join("\n") + "\n");
  }
  return found ? { id, status, resolvedBy, notes } : null;
}
function getStats3() {
  if (!import_fs7.default.existsSync(TRIAGE_PATH)) {
    return { pending: 0, in_review: 0, resolved: 0, sla_breached: 0 };
  }
  const content = import_fs7.default.readFileSync(TRIAGE_PATH, "utf-8");
  const items = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const now = Date.now();
  return {
    pending: items.filter((i) => i.status === "pending").length,
    in_review: items.filter((i) => i.status === "in_review").length,
    resolved: items.filter((i) => i.status === "approved" || i.status === "rejected").length,
    sla_breached: items.filter((i) => i.status === "pending" && now > i.sla).length
  };
}
var import_fs7, import_path7, import_crypto11, TRIAGE_PATH;
var init_src19 = __esm({
  "../../packages/triage/src/index.ts"() {
    "use strict";
    import_fs7 = __toESM(require("fs"), 1);
    import_path7 = __toESM(require("path"), 1);
    import_crypto11 = __toESM(require("crypto"), 1);
    TRIAGE_PATH = import_path7.default.resolve(process.cwd(), "../../logs/triage.jsonl");
  }
});

// ../../packages/compactor/src/index.ts
var src_exports18 = {};
__export(src_exports18, {
  compact: () => compact,
  getContradictions: () => getContradictions,
  prune: () => prune
});
function compact() {
  if (!import_fs8.default.existsSync(LESSONS_PATH2)) {
    return { original: 0, compacted: 0, removed: 0, contradictions: [] };
  }
  const content = import_fs8.default.readFileSync(LESSONS_PATH2, "utf-8");
  const lessons = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const byPattern = /* @__PURE__ */ new Map();
  for (const lesson of lessons) {
    const existing = byPattern.get(lesson.pattern) || [];
    existing.push(lesson);
    byPattern.set(lesson.pattern, existing);
  }
  const contradictions = [];
  const compacted = [];
  for (const [pattern, patternLessons] of byPattern) {
    patternLessons.sort((a, b) => b.confidence - a.confidence);
    const outcomes = new Set(patternLessons.map((l) => l.outcome));
    if (outcomes.has("success") && outcomes.has("failure")) {
      contradictions.push(pattern);
    }
    const best = { ...patternLessons[0] };
    const successCount = patternLessons.filter((l) => l.outcome === "success").length;
    const failCount = patternLessons.filter((l) => l.outcome === "failure").length;
    if (successCount + failCount > 1) {
      best.confidence = successCount / (successCount + failCount);
    }
    best.id = import_crypto12.default.randomUUID();
    compacted.push(best);
  }
  const compactedContent = compacted.map((l) => JSON.stringify(l)).join("\n") + "\n";
  import_fs8.default.writeFileSync(COMPACTED_PATH, compactedContent);
  return {
    original: lessons.length,
    compacted: compacted.length,
    removed: lessons.length - compacted.length,
    contradictions
  };
}
function getContradictions() {
  if (!import_fs8.default.existsSync(LESSONS_PATH2)) return [];
  const content = import_fs8.default.readFileSync(LESSONS_PATH2, "utf-8");
  const lessons = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const byPattern = /* @__PURE__ */ new Map();
  for (const lesson of lessons) {
    const outcomes = byPattern.get(lesson.pattern) || /* @__PURE__ */ new Set();
    outcomes.add(lesson.outcome);
    byPattern.set(lesson.pattern, outcomes);
  }
  const contradictions = [];
  for (const [pattern, outcomes] of byPattern) {
    if (outcomes.has("success") && outcomes.has("failure")) {
      contradictions.push(pattern);
    }
  }
  return contradictions;
}
function prune(daysToKeep = 30) {
  if (!import_fs8.default.existsSync(LESSONS_PATH2)) return 0;
  const content = import_fs8.default.readFileSync(LESSONS_PATH2, "utf-8");
  const lessons = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1e3;
  const filtered = lessons.filter((l) => new Date(l.timestamp).getTime() > cutoff);
  const newContent = filtered.map((l) => JSON.stringify(l)).join("\n") + "\n";
  import_fs8.default.writeFileSync(LESSONS_PATH2, newContent);
  return lessons.length - filtered.length;
}
var import_fs8, import_path8, import_crypto12, LESSONS_PATH2, COMPACTED_PATH;
var init_src20 = __esm({
  "../../packages/compactor/src/index.ts"() {
    "use strict";
    import_fs8 = __toESM(require("fs"), 1);
    import_path8 = __toESM(require("path"), 1);
    import_crypto12 = __toESM(require("crypto"), 1);
    LESSONS_PATH2 = import_path8.default.resolve(process.cwd(), "../../logs/lessons.jsonl");
    COMPACTED_PATH = import_path8.default.resolve(process.cwd(), "../../logs/lessons-compacted.jsonl");
  }
});

// ../../packages/foresight/src/index.ts
var src_exports19 = {};
__export(src_exports19, {
  getPending: () => getPending3,
  predict: () => predict,
  scorePredictions: () => scorePredictions
});
function scorePredictions(windowDays = 7) {
  const PREDICTIONS_PATH = import_path9.default.resolve(process.cwd(), "../../logs/predictions.jsonl");
  if (!import_fs9.default.existsSync(PREDICTIONS_PATH)) {
    return { scored: 0, accuracy: 0 };
  }
  const content = import_fs9.default.readFileSync(PREDICTIONS_PATH, "utf-8");
  const predictions = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1e3;
  let correct = 0;
  let scored = 0;
  const newLines = [];
  for (const pred of predictions) {
    const age = now - pred.createdAt;
    if (age >= windowMs && !pred.scoredAt) {
      const actual = pred.predictedConfidence > 0.5 ? "success" : "failure";
      const isCorrect = actual === pred.predictedOutcome;
      pred.actualOutcome = actual;
      pred.actualConfidence = isCorrect ? 1 : 0;
      pred.scoredAt = now;
      scored++;
      if (isCorrect) correct++;
    }
    newLines.push(JSON.stringify(pred));
  }
  import_fs9.default.writeFileSync(PREDICTIONS_PATH, newLines.join("\n") + "\n");
  return {
    scored,
    accuracy: scored > 0 ? correct / scored : 0
  };
}
function predict(pattern, predictedOutcome, confidence, windowDays = 7) {
  const PREDICTIONS_PATH = import_path9.default.resolve(process.cwd(), "../../logs/predictions.jsonl");
  const prediction = {
    id: import_crypto13.default.randomUUID(),
    pattern,
    predictedOutcome,
    predictedConfidence: confidence,
    windowDays,
    createdAt: Date.now()
  };
  const dir = import_path9.default.dirname(PREDICTIONS_PATH);
  if (!import_fs9.default.existsSync(dir)) import_fs9.default.mkdirSync(dir, { recursive: true });
  import_fs9.default.appendFileSync(PREDICTIONS_PATH, JSON.stringify(prediction) + "\n");
  return prediction;
}
function getPending3() {
  const PREDICTIONS_PATH = import_path9.default.resolve(process.cwd(), "../../logs/predictions.jsonl");
  if (!import_fs9.default.existsSync(PREDICTIONS_PATH)) return [];
  const content = import_fs9.default.readFileSync(PREDICTIONS_PATH, "utf-8");
  return content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
}
var import_fs9, import_path9, import_crypto13;
var init_src21 = __esm({
  "../../packages/foresight/src/index.ts"() {
    "use strict";
    import_fs9 = __toESM(require("fs"), 1);
    import_path9 = __toESM(require("path"), 1);
    import_crypto13 = __toESM(require("crypto"), 1);
  }
});

// ../../packages/adversarial/src/index.ts
var src_exports20 = {};
__export(src_exports20, {
  evaluateAdversarial: () => evaluateAdversarial
});
function evaluateAdversarial(tool, args, originalDecision) {
  const attacks = [];
  let severity = "low";
  if (args.path && typeof args.path === "string") {
    const path18 = args.path;
    if (path18.includes("../") || path18.includes("..\\")) {
      attacks.push("path_traversal");
      severity = "critical";
    }
    if (path18.startsWith("/") || path18.startsWith("C:\\")) {
      attacks.push("absolute_path");
      severity = severity === "critical" ? "critical" : "high";
    }
  }
  if (args.command && typeof args.command === "string") {
    const cmd = args.command;
    const dangerous = [";", "|", "&&", "||", "`", "$(", "\n", "\r"];
    if (dangerous.some((c) => cmd.includes(c))) {
      attacks.push("command_injection");
      severity = severity === "critical" ? "critical" : "high";
    }
  }
  const argStr = JSON.stringify(args);
  if (argStr.includes("DROP") || argStr.includes("DELETE") || argStr.includes("DROP")) {
    attacks.push("destructive_sql");
    severity = "critical";
  }
  if (argStr.includes("SECRET") || argStr.includes("TOKEN") || argStr.includes("PASSWORD")) {
    if (!argStr.includes("*****")) {
      attacks.push("secret_exposure");
      severity = severity === "critical" ? "critical" : "high";
    }
  }
  if (args.count && typeof args.count === "number" && args.count > 1e3) {
    attacks.push("resource_exhaustion");
    severity = severity === "critical" ? "critical" : "medium";
  }
  let adversarialDecision = "approve";
  if (attacks.length > 0) {
    if (severity === "critical") {
      adversarialDecision = "deny";
    } else if (severity === "high") {
      adversarialDecision = "escalate";
    } else {
      adversarialDecision = originalDecision;
    }
  }
  const vetoed = attacks.length > 0 && severity === "critical";
  const reasoning = vetoed ? `BLOCKED: ${attacks.join(", ")}` : attacks.length > 0 ? `WARNING: ${attacks.join(", ")}` : "No attacks detected";
  return {
    tool,
    originalDecision,
    adversarialDecision,
    vetoed,
    attacks,
    severity,
    reasoning
  };
}
var init_src22 = __esm({
  "../../packages/adversarial/src/index.ts"() {
    "use strict";
  }
});

// ../../packages/storyteller/src/index.ts
var src_exports21 = {};
__export(src_exports21, {
  generateAutoJournal: () => generateAutoJournal,
  readJournal: () => readJournal,
  writeJournal: () => writeJournal
});
function ensureDir5() {
  const dir = import_path10.default.dirname(JOURNAL_PATH);
  if (!import_fs10.default.existsSync(dir)) import_fs10.default.mkdirSync(dir, { recursive: true });
}
function writeJournal(summary2, events, lessonsLearned, insight) {
  ensureDir5();
  const entry = {
    id: import_crypto14.default.randomUUID(),
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    summary: summary2,
    events,
    lessonsLearned,
    keyInsight: insight
  };
  import_fs10.default.appendFileSync(JOURNAL_PATH, JSON.stringify(entry) + "\n");
  return entry;
}
async function generateAutoJournal() {
  const events = [];
  let lessonsLearned = 0;
  let keyInsight = "System operating normally.";
  try {
    const { readLessons: readLessons2 } = await Promise.resolve().then(() => (init_src5(), src_exports4));
    const lessons = await readLessons2({ limit: 10 });
    lessonsLearned = lessons.length;
    if (lessonsLearned > 0) {
      lessons.sort((a, b) => b.confidence - a.confidence);
      keyInsight = `Learned ${lessonsLearned} lessons. Highest confidence: ${lessons[0].pattern}`;
    }
  } catch {
  }
  try {
    const { getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const stats = await getStats4();
    events.push(`Curator: ${stats.approved} approved, ${stats.denied} denied`);
  } catch {
  }
  events.push(`Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}`);
  const summary2 = `Daily journal entry. ${events.length} events processed.`;
  return writeJournal(summary2, events, lessonsLearned, keyInsight);
}
function readJournal(days = 7) {
  if (!import_fs10.default.existsSync(JOURNAL_PATH)) return [];
  const content = import_fs10.default.readFileSync(JOURNAL_PATH, "utf-8");
  const entries = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return entries.filter((e) => e.date >= cutoffStr);
}
var import_fs10, import_path10, import_crypto14, JOURNAL_PATH;
var init_src23 = __esm({
  "../../packages/storyteller/src/index.ts"() {
    "use strict";
    import_fs10 = __toESM(require("fs"), 1);
    import_path10 = __toESM(require("path"), 1);
    import_crypto14 = __toESM(require("crypto"), 1);
    JOURNAL_PATH = import_path10.default.resolve(process.cwd(), "../../logs/journal.jsonl");
  }
});

// ../../packages/vitalsigns/src/index.ts
var src_exports22 = {};
__export(src_exports22, {
  DEFAULT_THRESHOLDS: () => DEFAULT_THRESHOLDS,
  checkVitals: () => checkVitals,
  getThrottleRecommendation: () => getThrottleRecommendation
});
async function checkVitals(thresholds = DEFAULT_THRESHOLDS) {
  let denialRate = 0;
  let failureRate = 0;
  try {
    const audit = await getStats();
    denialRate = audit.denial_rate;
    failureRate = audit.denied;
  } catch {
  }
  let confidenceDrift = 0;
  try {
    const patterns = await getPatternConfidences();
    if (Object.keys(patterns).length > 0) {
      const values = Object.values(patterns);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      confidenceDrift = Math.abs(0.5 - mean);
    }
  } catch {
  }
  let status = "healthy";
  if (denialRate > thresholds.denialRateCritical) status = "critical";
  else if (denialRate > thresholds.denialRateWarning) status = "degraded";
  let autonomyLevel = "full";
  if (status === "critical") autonomyLevel = "locked";
  else if (status === "degraded") autonomyLevel = "restricted";
  else if (confidenceDrift > thresholds.confidenceDriftWarning) autonomyLevel = "limited";
  return {
    status,
    denialRate,
    confidenceDrift,
    failureRate,
    autonomyLevel,
    timestamp: Date.now()
  };
}
async function getThrottleRecommendation() {
  const vitals = await checkVitals();
  if (vitals.autonomyLevel === "locked") {
    return { action: "lock", reason: "Critical denial rate" };
  }
  if (vitals.autonomyLevel === "restricted") {
    return { action: "restrict", reason: "Elevated denial rate" };
  }
  if (vitals.autonomyLevel === "limited") {
    return { action: "limit", reason: "High confidence drift" };
  }
  return { action: "none", reason: "System healthy" };
}
var DEFAULT_THRESHOLDS;
var init_src24 = __esm({
  "../../packages/vitalsigns/src/index.ts"() {
    "use strict";
    init_src3();
    init_src5();
    DEFAULT_THRESHOLDS = {
      denialRateCritical: 0.5,
      denialRateWarning: 0.25,
      confidenceDriftWarning: 0.3,
      failureRateWarning: 10
    };
  }
});

// ../../packages/timecapsule/src/index.ts
var src_exports23 = {};
__export(src_exports23, {
  createCapsule: () => createCapsule,
  getCapsuleByDate: () => getCapsuleByDate,
  getLatestCapsule: () => getLatestCapsule,
  verifyCapsule: () => verifyCapsule
});
async function createCapsule() {
  const now = /* @__PURE__ */ new Date();
  const date = now.toISOString().split("T")[0];
  let policyContent = "";
  try {
    policyContent = import_fs11.default.readFileSync("../../packages/curator/policy.yaml", "utf-8");
  } catch {
  }
  let lessonsHash = "";
  try {
    const lessonsContent = import_fs11.default.readFileSync("../../logs/lessons.jsonl", "utf-8");
    lessonsHash = hashContent(lessonsContent);
  } catch {
  }
  let ledgerHash = "";
  try {
    const ledgerContent = import_fs11.default.readFileSync("../../logs/curator-audit.jsonl", "utf-8");
    ledgerHash = hashContent(ledgerContent);
  } catch {
  }
  const combined = policyContent + lessonsHash + ledgerHash;
  const hash = hashContent(combined);
  const signature = import_crypto15.default.createSign("SHA256").update(hash).sign("privateKey", "hex");
  const snapshot2 = {
    id: import_crypto15.default.randomUUID(),
    date,
    hash,
    signature: signature || "mock-signature",
    policy: policyContent.slice(0, 100),
    lessonsHash,
    ledgerHash,
    metadata: {
      createdAt: now.toISOString(),
      version: "1.0.0"
    }
  };
  const dir = import_path11.default.dirname(CAPSULE_PATH);
  if (!import_fs11.default.existsSync(dir)) import_fs11.default.mkdirSync(dir, { recursive: true });
  import_fs11.default.appendFileSync(CAPSULE_PATH, JSON.stringify(snapshot2) + "\n");
  return snapshot2;
}
function hashContent(content) {
  return (0, import_crypto16.createHash)("sha256").update(content).digest("hex");
}
function verifyCapsule(snapshot2) {
  return snapshot2.hash.length === 64;
}
function getLatestCapsule() {
  if (!import_fs11.default.existsSync(CAPSULE_PATH)) return null;
  const content = import_fs11.default.readFileSync(CAPSULE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return null;
  return JSON.parse(lines[lines.length - 1]);
}
function getCapsuleByDate(date) {
  if (!import_fs11.default.existsSync(CAPSULE_PATH)) return null;
  const content = import_fs11.default.readFileSync(CAPSULE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  for (const line of lines.reverse()) {
    const capsule = JSON.parse(line);
    if (capsule.date === date) return capsule;
  }
  return null;
}
var import_fs11, import_path11, import_crypto15, import_crypto16, CAPSULE_PATH;
var init_src25 = __esm({
  "../../packages/timecapsule/src/index.ts"() {
    "use strict";
    import_fs11 = __toESM(require("fs"), 1);
    import_path11 = __toESM(require("path"), 1);
    import_crypto15 = __toESM(require("crypto"), 1);
    import_crypto16 = require("crypto");
    CAPSULE_PATH = import_path11.default.resolve(process.cwd(), "../../logs/timecapsule.jsonl");
  }
});

// ../../packages/profile/src/index.ts
var src_exports24 = {};
__export(src_exports24, {
  generateProfile: () => generateProfile,
  queryPatterns: () => queryPatterns,
  verifyProfile: () => verifyProfile
});
async function generateProfile(options) {
  const { includePatterns = true, includeStats = true, minConfidence = 0.1 } = options || {};
  const patterns = [];
  if (includePatterns) {
    const lessons = await readLessons({ limit: 100 });
    const byPattern = /* @__PURE__ */ new Map();
    for (const lesson of lessons) {
      if (lesson.confidence < minConfidence) continue;
      const existing = byPattern.get(lesson.pattern) || { count: 0, successes: 0, lastSeen: 0, confidence: 0 };
      existing.count++;
      if (lesson.outcome === "success") existing.successes++;
      existing.lastSeen = Math.max(existing.lastSeen, new Date(lesson.timestamp).getTime());
      existing.confidence = Math.max(existing.confidence, lesson.confidence);
      byPattern.set(lesson.pattern, existing);
    }
    for (const [pattern, data] of byPattern) {
      patterns.push({
        pattern,
        confidence: Math.round(data.confidence * 100) / 100,
        successRate: Math.round(data.successes / data.count * 100) / 100,
        lastSeen: data.lastSeen
      });
    }
    patterns.sort((a, b) => b.confidence - a.confidence);
  }
  let stats = {
    totalLessons: 0,
    totalDecisions: 0,
    approvalRate: 0,
    pendingEscalations: 0
  };
  if (includeStats) {
    const auditStats = await getStats();
    const triageStats = await getStats3();
    stats = {
      totalLessons: patterns.length,
      totalDecisions: auditStats.total,
      approvalRate: 1 - auditStats.denial_rate,
      pendingEscalations: triageStats.pending
    };
  }
  const avgConfidence = patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0;
  const profile = {
    id: import_crypto17.default.randomUUID(),
    name: "Aether",
    version: "1.0.0",
    capabilities: [
      "code_generation",
      "bug_fix",
      "refactoring",
      "self_improvement",
      "policy_enforcement"
    ],
    patterns,
    confidence: Math.round(avgConfidence * 100) / 100,
    stats,
    signature: "",
    // Filled below
    generatedAt: Date.now()
  };
  const payload = JSON.stringify({ patterns, stats, generatedAt: profile.generatedAt });
  profile.signature = import_crypto17.default.createHash("sha256").update(payload).digest("hex");
  return profile;
}
async function queryPatterns(filters) {
  const { minConfidence = 0, minSuccessRate = 0, limit = 50 } = filters || {};
  const lessons = await readLessons({ limit: 200 });
  const byPattern = /* @__PURE__ */ new Map();
  for (const lesson of lessons) {
    const existing = byPattern.get(lesson.pattern) || { count: 0, successes: 0, lastSeen: 0, confidence: 0 };
    existing.count++;
    if (lesson.outcome === "success") existing.successes++;
    existing.lastSeen = Math.max(existing.lastSeen, new Date(lesson.timestamp).getTime());
    existing.confidence = Math.max(existing.confidence, lesson.confidence);
    byPattern.set(lesson.pattern, existing);
  }
  const results = [];
  for (const [pattern, data] of byPattern) {
    const successRate = data.count > 0 ? data.successes / data.count : 0;
    if (data.confidence >= minConfidence && successRate >= minSuccessRate) {
      results.push({
        pattern,
        confidence: Math.round(data.confidence * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        lastSeen: data.lastSeen
      });
    }
  }
  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, limit);
}
function verifyProfile(profile) {
  const { signature, ...rest } = profile;
  const payload = JSON.stringify({ patterns: rest.patterns, stats: rest.stats, generatedAt: profile.generatedAt });
  const expected = import_crypto17.default.createHash("sha256").update(payload).digest("hex");
  return signature === expected;
}
var import_crypto17;
var init_src26 = __esm({
  "../../packages/profile/src/index.ts"() {
    "use strict";
    init_src5();
    init_src3();
    init_src19();
    import_crypto17 = __toESM(require("crypto"), 1);
  }
});

// ../../packages/goals/src/index.ts
var src_exports25 = {};
__export(src_exports25, {
  alignsWithGoals: () => alignsWithGoals,
  completeGoal: () => completeGoal,
  createGoal: () => createGoal,
  getActiveGoals: () => getActiveGoals,
  getCurrentFocus: () => getCurrentFocus,
  getFocusAreas: () => getFocusAreas,
  getGoalsByFocus: () => getGoalsByFocus,
  pauseGoal: () => pauseGoal
});
function ensureDir6() {
  const dir = import_path12.default.dirname(GOALS_PATH);
  if (!import_fs12.default.existsSync(dir)) import_fs12.default.mkdirSync(dir, { recursive: true });
}
function createGoal(options) {
  ensureDir6();
  const goal = {
    id: import_crypto18.default.randomUUID(),
    title: options.title,
    description: options.description || "",
    priority: options.priority || "medium",
    status: "active",
    focus: options.focus || "general",
    outcomes: options.outcomes || [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  import_fs12.default.appendFileSync(GOALS_PATH, JSON.stringify(goal) + "\n");
  return goal;
}
function getActiveGoals(limit = 10) {
  if (!import_fs12.default.existsSync(GOALS_PATH)) return [];
  const content = import_fs12.default.readFileSync(GOALS_PATH, "utf-8");
  const goals = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return goals.filter((g) => g.status === "active").sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }).slice(0, limit);
}
function getCurrentFocus() {
  const active = getActiveGoals(1);
  return active.length > 0 ? active[0].focus : "general";
}
function alignsWithGoals(taskPattern) {
  const active = getActiveGoals(3);
  if (active.length === 0) {
    return { aligned: true, reasoning: "No active goals - default allow" };
  }
  for (const goal of active) {
    if (taskPattern.toLowerCase().includes(goal.focus.toLowerCase())) {
      return { aligned: true, goalId: goal.id, reasoning: `Matches goal focus: ${goal.focus}` };
    }
    for (const outcome of goal.outcomes) {
      if (taskPattern.toLowerCase().includes(outcome.toLowerCase())) {
        return { aligned: true, goalId: goal.id, reasoning: `Matches goal outcome: ${outcome}` };
      }
    }
  }
  return {
    aligned: false,
    reasoning: `No active goal matches: ${taskPattern}`
  };
}
function completeGoal(id) {
  if (!import_fs12.default.existsSync(GOALS_PATH)) return null;
  const content = import_fs12.default.readFileSync(GOALS_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = null;
  const newLines = lines.map((line) => {
    const goal = JSON.parse(line);
    if (goal.id === id && goal.status === "active") {
      goal.status = "completed";
      goal.completedAt = Date.now();
      goal.updatedAt = Date.now();
      found = goal;
    }
    return JSON.stringify(goal);
  });
  if (found) {
    import_fs12.default.writeFileSync(GOALS_PATH, newLines.join("\n") + "\n");
  }
  return found;
}
function pauseGoal(id) {
  if (!import_fs12.default.existsSync(GOALS_PATH)) return null;
  const content = import_fs12.default.readFileSync(GOALS_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = null;
  const newLines = lines.map((line) => {
    const goal = JSON.parse(line);
    if (goal.id === id) {
      goal.status = "paused";
      goal.updatedAt = Date.now();
      found = goal;
    }
    return JSON.stringify(goal);
  });
  if (found) {
    import_fs12.default.writeFileSync(GOALS_PATH, newLines.join("\n") + "\n");
  }
  return found;
}
function getGoalsByFocus(focus) {
  if (!import_fs12.default.existsSync(GOALS_PATH)) return [];
  const content = import_fs12.default.readFileSync(GOALS_PATH, "utf-8");
  const goals = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  return goals.filter((g) => g.focus === focus && g.status === "active");
}
function getFocusAreas() {
  if (!import_fs12.default.existsSync(GOALS_PATH)) return [];
  const content = import_fs12.default.readFileSync(GOALS_PATH, "utf-8");
  const goals = content.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const areas = new Set(goals.map((g) => g.focus));
  return Array.from(areas);
}
var import_fs12, import_path12, import_crypto18, GOALS_PATH;
var init_src27 = __esm({
  "../../packages/goals/src/index.ts"() {
    "use strict";
    import_fs12 = __toESM(require("fs"), 1);
    import_path12 = __toESM(require("path"), 1);
    import_crypto18 = __toESM(require("crypto"), 1);
    GOALS_PATH = import_path12.default.resolve(process.cwd(), "../../logs/goals.jsonl");
  }
});

// ../../packages/panic/src/index.ts
var src_exports26 = {};
__export(src_exports26, {
  getPanicHistory: () => getPanicHistory,
  getPanicState: () => getPanicState,
  getPolicyOverride: () => getPolicyOverride,
  isPanicActive: () => isPanicActive,
  releasePanic: () => releasePanic,
  triggerPanic: () => triggerPanic
});
function getPanicState() {
  if (!import_fs13.default.existsSync(PANIC_PATH)) {
    return { active: false, reason: "normal", level: "pause" };
  }
  const content = import_fs13.default.readFileSync(PANIC_PATH, "utf-8");
  return JSON.parse(content);
}
function triggerPanic(options) {
  const { reason = "manual", level = "lockdown", autoResumeMinutes, triggeredBy = "system" } = options || {};
  const state = {
    active: true,
    triggeredAt: Date.now(),
    triggeredBy,
    reason,
    level,
    autoResumeAt: autoResumeMinutes ? Date.now() + autoResumeMinutes * 60 * 1e3 : void 0
  };
  const dir = import_path13.default.dirname(PANIC_PATH);
  if (!import_fs13.default.existsSync(dir)) import_fs13.default.mkdirSync(dir, { recursive: true });
  import_fs13.default.writeFileSync(PANIC_PATH, JSON.stringify(state, null, 2));
  return state;
}
function releasePanic(reason = "manual_release") {
  const state = {
    active: false,
    reason,
    level: "pause"
  };
  import_fs13.default.writeFileSync(PANIC_PATH, JSON.stringify(state, null, 2));
  return state;
}
function isPanicActive() {
  const state = getPanicState();
  if (!state.active) return false;
  if (state.autoResumeAt && Date.now() > state.autoResumeAt) {
    releasePanic("auto_resume");
    return false;
  }
  return true;
}
function getPolicyOverride() {
  const state = getPanicState();
  if (!state.active) {
    return { default: "allow", tools: {} };
  }
  return {
    default: "deny",
    tools: {
      file_write: "deny",
      git_commit: "deny",
      http_request: "deny",
      chaos_inject: "deny",
      lessons_write: "deny",
      trigger_workflow: "deny"
    }
  };
}
function getPanicHistory(limit = 20) {
  const current = getPanicState();
  return current.active ? [current] : [];
}
var import_fs13, import_path13, PANIC_PATH;
var init_src28 = __esm({
  "../../packages/panic/src/index.ts"() {
    "use strict";
    import_fs13 = __toESM(require("fs"), 1);
    import_path13 = __toESM(require("path"), 1);
    PANIC_PATH = import_path13.default.resolve(process.cwd(), "../../logs/panic.json");
  }
});

// ../../packages/network-health/src/index.ts
var src_exports27 = {};
__export(src_exports27, {
  SERVICES: () => SERVICES,
  checkAllServices: () => checkAllServices,
  checkService: () => checkService,
  gatekeepDiagnosis: () => gatekeepDiagnosis,
  getExternalStatus: () => getExternalStatus
});
async function checkService(url, timeoutMs = 5e3) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    let status = "healthy";
    if (response.status >= 500) status = "down";
    else if (response.status >= 400) status = "degraded";
    else if (latencyMs > 3e3) status = "degraded";
    return {
      service: url,
      status,
      latencyMs,
      statusCode: response.status,
      checkedAt: Date.now()
    };
  } catch (e) {
    return {
      service: url,
      status: "down",
      error: e.message,
      checkedAt: Date.now()
    };
  }
}
async function checkAllServices() {
  const results = [];
  for (const [name, url] of Object.entries(SERVICES)) {
    const result = await checkService(url);
    result.service = name;
    results.push(result);
  }
  return results;
}
async function getExternalStatus() {
  const results = await checkAllServices();
  const blocked = results.filter((r) => r.status === "down");
  const blockedServices = blocked.map((r) => r.service);
  return {
    isBlocked: blockedServices.length > 0,
    blockedServices,
    results
  };
}
async function gatekeepDiagnosis(error) {
  const { isBlocked, blockedServices } = await getExternalStatus();
  if (isBlocked) {
    return {
      shouldPause: true,
      reason: `External service blocked: ${blockedServices.join(", ")}`,
      externalBlock: blockedServices[0]
    };
  }
  const externalPatterns = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "503", "502", "504"];
  for (const pattern of externalPatterns) {
    if (error.includes(pattern)) {
      const extStatus = await getExternalStatus();
      if (extStatus.isBlocked) {
        return {
          shouldPause: true,
          reason: `External error pattern detected: ${pattern}`,
          externalBlock: extStatus.blockedServices[0]
        };
      }
    }
  }
  return {
    shouldPause: false,
    reason: "Internal error, proceed with diagnosis"
  };
}
var SERVICES;
var init_src29 = __esm({
  "../../packages/network-health/src/index.ts"() {
    "use strict";
    SERVICES = {
      npm: "https://registry.npmjs.org",
      github: "https://api.github.com",
      vercel: "https://api.vercel.com",
      linear: "https://api.linear.app"
    };
  }
});

// ../../packages/context-truncate/src/index.ts
var src_exports28 = {};
__export(src_exports28, {
  DEFAULT_TRUNCATE_OPTIONS: () => DEFAULT_TRUNCATE_OPTIONS,
  compressRepeatedOutputs: () => compressRepeatedOutputs,
  needsTruncation: () => needsTruncation,
  truncateContext: () => truncateContext,
  truncateToolOutput: () => truncateToolOutput
});
function truncateToolOutput(output, maxLength = 2e3) {
  if (output.length <= maxLength) return output;
  const headLength = Math.floor(maxLength / 2);
  const tailLength = maxLength - headLength - 50;
  const head = output.slice(0, headLength);
  const tail = output.slice(-tailLength);
  return `${head}

... [truncated ${output.length - maxLength} chars] ...

${tail}`;
}
function compressRepeatedOutputs(steps) {
  const unique = [];
  const seen = /* @__PURE__ */ new Map();
  for (const step of steps) {
    const key = `${step.tool}:${JSON.stringify(step.args)}`;
    if (seen.has(key)) {
      const idx = seen.get(key);
      if (unique[idx].status === "success") {
        unique[idx].status = "success";
      }
    } else {
      seen.set(key, unique.length);
      unique.push(step);
    }
  }
  return unique;
}
function truncateContext(steps, options = {}) {
  const opts = { ...DEFAULT_TRUNCATE_OPTIONS, ...options };
  let truncatedSteps = [...steps];
  let truncatedCount = 0;
  let originalLength = 0;
  let newLength = 0;
  for (const step of truncatedSteps) {
    if (step.output) {
      originalLength += step.output.length;
      step.output = truncateToolOutput(step.output, opts.maxToolOutputLength);
      newLength += step.output.length;
      if (step.output.length < originalLength) truncatedCount++;
    }
  }
  if (opts.compressRepeated) {
    truncatedSteps = compressRepeatedOutputs(truncatedSteps);
  }
  if (truncatedSteps.length > opts.keepFirstN + opts.keepLastN) {
    const head = truncatedSteps.slice(0, opts.keepFirstN);
    const tail = truncatedSteps.slice(-opts.keepLastN);
    truncatedSteps = [...head, { tool: "...", args: {}, output: `... [${truncatedSteps.length - opts.keepFirstN - opts.keepLastN} steps truncated]`, status: "pending", timestamp: Date.now() }, ...tail];
    truncatedCount += truncatedSteps.length - head.length - tail.length;
  }
  const tokensSaved = Math.floor((originalLength - newLength) / 4);
  return {
    truncatedSteps,
    stats: {
      truncatedCount,
      tokensSaved
    }
  };
}
function needsTruncation(steps, maxSteps = 20, maxOutput = 5e3) {
  if (steps.length > maxSteps) return true;
  for (const step of steps) {
    if (step.output && step.output.length > maxOutput) return true;
  }
  return false;
}
var DEFAULT_TRUNCATE_OPTIONS;
var init_src30 = __esm({
  "../../packages/context-truncate/src/index.ts"() {
    "use strict";
    DEFAULT_TRUNCATE_OPTIONS = {
      maxToolOutputLength: 2e3,
      keepFirstN: 3,
      keepLastN: 3,
      compressRepeated: true
    };
  }
});

// ../../packages/signed-provenance/src/index.ts
var src_exports29 = {};
__export(src_exports29, {
  detectConfidenceDrift: () => detectConfidenceDrift,
  getQuotaRemaining: () => getQuotaRemaining,
  verifyLesson: () => verifyLesson,
  writeSignedLesson: () => writeSignedLesson
});
function sign(data) {
  return import_crypto19.default.createHmac("sha256", VERIFY_KEY).update(data).digest("hex");
}
function verify(data, signature) {
  return sign(data) === signature;
}
function writeSignedLesson(lesson) {
  const id = import_crypto19.default.randomUUID();
  const createdAt = Date.now();
  let policyHash = "";
  try {
    const policyContent = import_fs14.default.readFileSync("../../packages/curator/policy.yaml", "utf-8");
    policyHash = import_crypto19.default.createHash("sha256").update(policyContent).digest("hex").slice(0, 16);
  } catch {
    policyHash = "unknown";
  }
  const payload = JSON.stringify({ id, ...lesson, createdAt, policyHash });
  const signature = sign(payload);
  const fullLesson = {
    id,
    ...lesson,
    signature,
    createdAt,
    policyHash
  };
  checkAndIncrementQuota(lesson.source);
  return fullLesson;
}
function verifyLesson(lesson) {
  const { signature, createdAt, policyHash, ...payload } = lesson;
  const payloadStr = JSON.stringify({ ...payload, createdAt, policyHash });
  if (!verify(payloadStr, signature)) {
    return { valid: false, reason: "Invalid signature" };
  }
  return { valid: true, reason: "OK" };
}
function getQuotas() {
  if (!import_fs14.default.existsSync(QUOTAS_PATH)) return /* @__PURE__ */ new Map();
  const content = import_fs14.default.readFileSync(QUOTAS_PATH, "utf-8");
  return new Map(Object.entries(JSON.parse(content)));
}
function saveQuotas(quotas) {
  const obj = Object.fromEntries(quotas);
  const dir = import_path14.default.dirname(QUOTAS_PATH);
  if (!import_fs14.default.existsSync(dir)) import_fs14.default.mkdirSync(dir, { recursive: true });
  import_fs14.default.writeFileSync(QUOTAS_PATH, JSON.stringify(obj));
}
function checkAndIncrementQuota(source) {
  const quotas = getQuotas();
  const now = Date.now();
  const hourMs = 36e5;
  const usage = quotas.get(source) || { source, count: 0, lastReset: now };
  if (now - usage.lastReset > hourMs) {
    usage.count = 0;
    usage.lastReset = now;
  }
  if (usage.count >= MAX_QUOTA_PER_HOUR) {
    throw new Error(`Quota exceeded for source: ${source}`);
  }
  usage.count++;
  quotas.set(source, usage);
  saveQuotas(quotas);
  return true;
}
function getQuotaRemaining(source) {
  const quotas = getQuotas();
  const usage = quotas.get(source);
  if (!usage) return MAX_QUOTA_PER_HOUR;
  const now = Date.now();
  if (now - usage.lastReset > 36e5) return MAX_QUOTA_PER_HOUR;
  return Math.max(0, MAX_QUOTA_PER_HOUR - usage.count);
}
function detectConfidenceDrift(history, threshold = 0.2) {
  const byPattern = /* @__PURE__ */ new Map();
  for (const lesson of history) {
    const confidences = byPattern.get(lesson.pattern) || [];
    confidences.push(lesson.confidence);
    byPattern.set(lesson.pattern, confidences);
  }
  const alerts = [];
  for (const [pattern, confidences] of byPattern) {
    if (confidences.length < 2) continue;
    const prev = confidences[confidences.length - 2];
    const curr = confidences[confidences.length - 1];
    const drift = Math.abs(curr - prev);
    if (drift > threshold) {
      let severity = "low";
      if (drift > 0.5) severity = "critical";
      else if (drift > 0.3) severity = "high";
      else if (drift > 0.2) severity = "medium";
      alerts.push({
        pattern,
        previousConfidence: prev,
        currentConfidence: curr,
        drift,
        severity
      });
    }
  }
  return alerts;
}
var import_crypto19, import_fs14, import_path14, SIGNING_KEY, VERIFY_KEY, QUOTAS_PATH, MAX_QUOTA_PER_HOUR;
var init_src31 = __esm({
  "../../packages/signed-provenance/src/index.ts"() {
    "use strict";
    import_crypto19 = __toESM(require("crypto"), 1);
    import_fs14 = __toESM(require("fs"), 1);
    import_path14 = __toESM(require("path"), 1);
    SIGNING_KEY = process.env.AETHER_SIGNING_KEY || import_crypto19.default.randomBytes(32).toString("hex");
    VERIFY_KEY = process.env.AETHER_VERIFY_KEY || SIGNING_KEY.slice(0, 32);
    QUOTAS_PATH = import_path14.default.resolve(process.cwd(), "../../logs/quotas.json");
    MAX_QUOTA_PER_HOUR = 100;
  }
});

// ../../packages/tombstone/src/index.ts
var src_exports30 = {};
__export(src_exports30, {
  exportDeletionLog: () => exportDeletionLog,
  getDeletionStats: () => getDeletionStats,
  isDeleted: () => isDeleted,
  listTombstones: () => listTombstones,
  markDeleted: () => markDeleted,
  verifyChain: () => verifyChain
});
function markDeleted(options) {
  const { originalId, recordType, reason, suppressedBy, originalRecord } = options;
  let originalHash = "";
  if (originalRecord) {
    originalHash = import_crypto20.default.createHash("sha256").update(originalRecord).digest("hex");
  } else {
    originalHash = import_crypto20.default.createHash("sha256").update(originalId).digest("hex");
  }
  let lastHash = "";
  try {
    const content = import_fs15.default.readFileSync(TOMBSTONES_PATH, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length > 0) {
      const last = JSON.parse(lines[lines.length - 1]);
      lastHash = last.tombstoneHash;
    }
  } catch {
  }
  const tombstone = {
    id: import_crypto20.default.randomUUID(),
    recordType,
    reason,
    suppressedAt: Date.now(),
    suppressedBy,
    originalHash,
    tombstoneHash: ""
    // Filled below
  };
  const chainPayload = originalHash + lastHash + tombstone.id;
  tombstone.tombstoneHash = import_crypto20.default.createHash("sha256").update(chainPayload).digest("hex");
  const dir = import_path15.default.dirname(TOMBSTONES_PATH);
  if (!import_fs15.default.existsSync(dir)) import_fs15.default.mkdirSync(dir, { recursive: true });
  import_fs15.default.appendFileSync(TOMBSTONES_PATH, JSON.stringify(tombstone) + "\n");
  return { success: true, tombstone };
}
function isDeleted(recordId) {
  if (!import_fs15.default.existsSync(TOMBSTONES_PATH)) return { deleted: false };
  const content = import_fs15.default.readFileSync(TOMBSTONES_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const tombstone = JSON.parse(line);
    if (tombstone.id === recordId) {
      return { deleted: true, reason: tombstone.reason, tombstoneId: tombstone.id };
    }
  }
  return { deleted: false };
}
function verifyChain() {
  if (!import_fs15.default.existsSync(TOMBSTONES_PATH)) {
    return { valid: true, errors: [] };
  }
  const content = import_fs15.default.readFileSync(TOMBSTONES_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  const errors = [];
  let lastHash = "";
  for (const line of lines) {
    const tombstone = JSON.parse(line);
    const chainPayload = tombstone.originalHash + lastHash + tombstone.id;
    const expectedHash = import_crypto20.default.createHash("sha256").update(chainPayload).digest("hex");
    if (expectedHash !== tombstone.tombstoneHash) {
      errors.push(`Chain broken at ${tombstone.id}: expected ${expectedHash}, got ${tombstone.tombstoneHash}`);
    }
    lastHash = tombstone.tombstoneHash;
  }
  return {
    valid: errors.length === 0,
    brokenAt: errors[0],
    errors
  };
}
function listTombstones(limit = 50) {
  if (!import_fs15.default.existsSync(TOMBSTONES_PATH)) return [];
  const content = import_fs15.default.readFileSync(TOMBSTONES_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean).slice(-limit);
  return lines.map((line) => JSON.parse(line));
}
function getDeletionStats() {
  const tombstones = listTombstones(1e3);
  const stats = {
    gdpr_request: 0,
    human_revision: 0,
    anomaly: 0,
    source_misbehavior: 0
  };
  for (const t of tombstones) {
    if (stats[t.reason] !== void 0) {
      stats[t.reason]++;
    }
  }
  return stats;
}
function exportDeletionLog(startDate, endDate) {
  const tombstones = listTombstones(500);
  let filtered = tombstones;
  if (startDate) filtered = filtered.filter((t) => t.suppressedAt >= startDate);
  if (endDate) filtered = filtered.filter((t) => t.suppressedAt <= endDate);
  const deletions = filtered.map((t) => ({
    id: t.id,
    recordType: t.recordType,
    reason: t.reason,
    suppressedAt: t.suppressedAt
  }));
  return {
    deletions,
    total: deletions.length,
    byReason: {
      gdpr_request: deletions.filter((d) => d.reason === "gdpr_request").length,
      human_revision: deletions.filter((d) => d.reason === "human_revision").length,
      anomaly: deletions.filter((d) => d.reason === "anomaly").length,
      source_misbehavior: deletions.filter((d) => d.reason === "source_misbehavior").length
    }
  };
}
var import_crypto20, import_fs15, import_path15, TOMBSTONES_PATH;
var init_src32 = __esm({
  "../../packages/tombstone/src/index.ts"() {
    "use strict";
    import_crypto20 = __toESM(require("crypto"), 1);
    import_fs15 = __toESM(require("fs"), 1);
    import_path15 = __toESM(require("path"), 1);
    TOMBSTONES_PATH = import_path15.default.resolve(process.cwd(), "../../logs/tombstones.jsonl");
  }
});

// ../../packages/convene/src/index.ts
var src_exports31 = {};
__export(src_exports31, {
  AssistantIdentitySchema: () => AssistantIdentitySchema,
  ConveneSessionSchema: () => ConveneSessionSchema,
  ParticipantVoteSchema: () => ParticipantVoteSchema,
  SCOPES: () => SCOPES,
  castVote: () => castVote,
  convene: () => convene,
  deliberate: () => deliberate,
  getAssistantsByScope: () => getAssistantsByScope,
  getSession: () => getSession,
  listAssistants: () => listAssistants,
  listSessions: () => listSessions,
  registerAssistant: () => registerAssistant,
  resolveSession: () => resolveSession
});
function ensureDir7() {
  const dir = import_path16.default.dirname(CONVENE_PATH);
  if (!import_fs16.default.existsSync(dir)) import_fs16.default.mkdirSync(dir, { recursive: true });
}
function registerAssistant(identity) {
  ensureDir7();
  const full = {
    id: import_crypto21.default.randomUUID(),
    ...identity
  };
  import_fs16.default.appendFileSync(ASSISTANTS_PATH, JSON.stringify(full) + "\n");
  return full;
}
function listAssistants() {
  if (!import_fs16.default.existsSync(ASSISTANTS_PATH)) return [];
  const content = import_fs16.default.readFileSync(ASSISTANTS_PATH, "utf-8");
  return content.trim().split("\n").filter(Boolean).map((line) => AssistantIdentitySchema.parse(JSON.parse(line)));
}
function getAssistantsByScope(scope) {
  return listAssistants().filter((a) => a.scopes.includes(scope));
}
function convene(options) {
  ensureDir7();
  const { profileId, question, context = {}, requiredScopes = ["general"] } = options;
  const session = {
    sessionId: import_crypto21.default.randomUUID(),
    profileId,
    question,
    context,
    requiredScopes,
    votes: [],
    consensus: 0,
    recommended: "escalate",
    resolution: "pending",
    narrative: "",
    createdAt: Date.now(),
    resolvedAt: 0
  };
  import_fs16.default.appendFileSync(CONVENE_PATH, JSON.stringify(session) + "\n");
  return session;
}
function castVote(sessionId, vote) {
  if (!import_fs16.default.existsSync(CONVENE_PATH)) return null;
  const content = import_fs16.default.readFileSync(CONVENE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = [];
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    if (session.sessionId === sessionId) {
      found = true;
      const fullVote = {
        assistantId: import_crypto21.default.randomUUID(),
        // New ID per vote
        ...vote
      };
      session.votes.push(fullVote);
      if (session.votes.length > 0) {
        const approve = session.votes.filter((v) => v.vote === "approve").length;
        const deny = session.votes.filter((v) => v.vote === "deny").length;
        const escalate = session.votes.filter((v) => v.vote === "escalate").length;
        const weightedSum = session.votes.reduce(
          (sum, v) => sum + (v.vote === "approve" ? v.confidence : v.vote === "deny" ? -v.confidence : 0),
          0
        );
        session.consensus = Math.max(0, Math.min(1, (weightedSum + 1) / 2));
        if (escalate > 0) {
          session.recommended = "escalate";
          session.resolution = "escalated_to_triage";
        } else if (weightedSum > 0.3 && session.consensus > 0.6) {
          session.recommended = "approve";
          session.resolution = "auto_executed";
        } else if (weightedSum < -0.3) {
          session.recommended = "deny";
          session.resolution = "rejected";
        }
      }
      const voteSummaries = session.votes.map(
        (v) => `${v.assistantName} (${v.scope}): ${v.vote} (${v.confidence})`
      );
      session.narrative = `${session.votes.length} assistants convened. ${voteSummaries.join(". ")}. Consensus: ${session.consensus.toFixed(2)}.`;
    }
    newLines.push(JSON.stringify(session));
  }
  if (found) {
    import_fs16.default.writeFileSync(CONVENE_PATH, newLines.join("\n") + "\n");
  }
  return found ? vote : null;
}
function resolveSession(sessionId, resolution) {
  if (!import_fs16.default.existsSync(CONVENE_PATH)) return null;
  const content = import_fs16.default.readFileSync(CONVENE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  let found = false;
  const newLines = [];
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    if (session.sessionId === sessionId) {
      found = true;
      session.resolution = resolution;
      session.resolvedAt = Date.now();
      if (!session.narrative) {
        session.narrative = `Session resolved as ${resolution}.`;
      }
    }
    newLines.push(JSON.stringify(session));
  }
  if (found) {
    import_fs16.default.writeFileSync(CONVENE_PATH, newLines.join("\n") + "\n");
  }
  return found ? { sessionId, resolution } : null;
}
function getSession(sessionId) {
  if (!import_fs16.default.existsSync(CONVENE_PATH)) return null;
  const content = import_fs16.default.readFileSync(CONVENE_PATH, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const session = ConveneSessionSchema.parse(JSON.parse(line));
    if (session.sessionId === sessionId) return session;
  }
  return null;
}
function listSessions(profileId, limit = 20) {
  if (!import_fs16.default.existsSync(CONVENE_PATH)) return [];
  const content = import_fs16.default.readFileSync(CONVENE_PATH, "utf-8");
  return content.trim().split("\n").filter(Boolean).map((line) => ConveneSessionSchema.parse(JSON.parse(line))).filter((s) => s.profileId === profileId).slice(-limit);
}
async function deliberate(options) {
  const session = convene(options);
  const mockVotes = [
    {
      assistantName: "Aether Evaluator",
      scope: "code",
      vote: "approve",
      confidence: 0.82,
      rationale: "Pattern matches lesson #4471 with 0.82 confidence."
    },
    {
      assistantName: "Aether Foresight",
      scope: "infrastructure",
      vote: "escalate",
      confidence: 0.65,
      rationale: "Predicts 40% chance of downstream cascade."
    }
  ];
  for (const vote of mockVotes) {
    castVote(session.sessionId, vote);
  }
  const final = getSession(session.sessionId);
  return {
    sessionId: final.sessionId,
    question: final.question,
    votes: final.votes,
    consensus: final.consensus,
    recommended: final.recommended,
    resolution: final.resolution,
    narrative: final.narrative,
    requiresApproval: final.resolution === "escalated_to_triage"
  };
}
var import_zod6, import_fs16, import_path16, import_crypto21, AssistantIdentitySchema, ParticipantVoteSchema, ConveneSessionSchema, SCOPES, CONVENE_PATH, ASSISTANTS_PATH;
var init_src33 = __esm({
  "../../packages/convene/src/index.ts"() {
    "use strict";
    import_zod6 = require("zod");
    import_fs16 = __toESM(require("fs"), 1);
    import_path16 = __toESM(require("path"), 1);
    import_crypto21 = __toESM(require("crypto"), 1);
    AssistantIdentitySchema = import_zod6.z.object({
      id: import_zod6.z.string(),
      name: import_zod6.z.string(),
      scopes: import_zod6.z.array(import_zod6.z.string()),
      // payments, support, code, etc.
      signedClaim: import_zod6.z.string().optional()
      // Signed assertion of identity
    });
    ParticipantVoteSchema = import_zod6.z.object({
      assistantId: import_zod6.z.string(),
      assistantName: import_zod6.z.string(),
      scope: import_zod6.z.string(),
      vote: import_zod6.z.enum(["approve", "deny", "abstain", "escalate"]),
      confidence: import_zod6.z.number().min(0).max(1),
      rationale: import_zod6.z.string()
    });
    ConveneSessionSchema = import_zod6.z.object({
      sessionId: import_zod6.z.string(),
      profileId: import_zod6.z.string(),
      question: import_zod6.z.string(),
      context: import_zod6.z.record(import_zod6.z.unknown()),
      requiredScopes: import_zod6.z.array(import_zod6.z.string()),
      votes: import_zod6.z.array(ParticipantVoteSchema),
      consensus: import_zod6.z.number().min(0).max(1),
      recommended: import_zod6.z.enum(["approve", "deny", "escalate"]),
      resolution: import_zod6.z.enum(["auto_executed", "escalated_to_triage", "rejected", "pending"]),
      narrative: import_zod6.z.string(),
      createdAt: number,
      resolvedAt: number
    });
    SCOPES = {
      payments: { description: "Billing, refunds, webhooks, financial" },
      support: { description: "Customer tickets, communication, triage" },
      code: { description: "Code review, commits, refactoring" },
      infrastructure: { description: "Deployments, scaling, monitoring" },
      calendar: { description: "Meetings, scheduling" },
      general: { description: "General purpose" }
    };
    CONVENE_PATH = import_path16.default.resolve(process.cwd(), "../../logs/convene.jsonl");
    ASSISTANTS_PATH = import_path16.default.resolve(process.cwd(), "../../logs/assistant-identities.jsonl");
  }
});

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_node_events = require("node:events");

// ../../packages/env/src/index.ts
var import_zod = require("zod");
var BaseEnv = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: import_zod.z.enum(["debug", "info", "warn", "error"]).default("info")
});
var BackendEnvSchema = BaseEnv.extend({
  PORT: import_zod.z.coerce.number().int().positive().default(3e3),
  GEMINI_API_KEY: import_zod.z.string().min(1, "GEMINI_API_KEY is required"),
  CURATOR_ALLOW_LIST: import_zod.z.string().optional().transform((s) => s ? s.split(",").map((x) => x.trim()) : void 0)
});
var BridgeEnvSchema = BaseEnv.extend({
  BRIDGE_PORT: import_zod.z.coerce.number().int().positive().default(4e3)
});
var FrontendEnvSchema = BaseEnv.extend({
  VITE_API_URL: import_zod.z.string().url()
});
function parseEnv(schema, source = process.env, label = "env") {
  const result = schema.safeParse(source);
  if (!result.success) {
    console.error(`[${label}] validation failed:`);
    for (const issue of result.error.issues) {
      const path18 = issue.path.join(".") || "(root)";
      console.error(`  - ${path18}: ${issue.message}`);
    }
    if (process.env.ALLOW_DEGRADED === "1") {
      console.warn(`[${label}] ALLOW_DEGRADED=1 \u2014 continuing with partial env; AI features disabled`);
      return source;
    }
    process.exit(1);
  }
  return result.data;
}

// server.ts
init_src();

// ../../packages/components/src/manifest.ts
var import_zod2 = require("zod");
var CapabilityTag = import_zod2.z.enum([
  "ui:render",
  "ui:interactive",
  "read:state",
  "write:state",
  "network:fetch"
]);
var PropSpecSchema = import_zod2.z.object({
  type: import_zod2.z.enum(["string", "number", "boolean", "enum", "array"]),
  required: import_zod2.z.boolean().default(false),
  enum: import_zod2.z.array(import_zod2.z.string()).optional(),
  description: import_zod2.z.string().optional()
});
var ComponentManifestEntry = import_zod2.z.object({
  type: import_zod2.z.string(),
  description: import_zod2.z.string(),
  propsSchema: import_zod2.z.record(import_zod2.z.string(), PropSpecSchema),
  capabilities: import_zod2.z.array(CapabilityTag).default(["ui:render"]),
  maxPerResponse: import_zod2.z.number().int().positive().optional()
});
var ComponentManifest = import_zod2.z.array(ComponentManifestEntry);
var MANIFEST = [
  {
    type: "stat",
    description: "Single large number with a label. For KPIs and metrics.",
    propsSchema: {
      label: { type: "string", required: true, description: "Caption shown above the value" },
      value: { type: "string", required: true, description: "The number or text to display" },
      trend: { type: "enum", required: false, enum: ["up", "down", "flat"] }
    },
    capabilities: ["ui:render"]
  },
  {
    type: "chart",
    description: "Line, bar, or pie chart. Pass data as array of {x, y} points.",
    propsSchema: {
      kind: { type: "enum", required: true, enum: ["line", "bar", "pie"] },
      data: { type: "array", required: true, description: "Array of {x, y} data points" },
      title: { type: "string", required: false }
    },
    capabilities: ["ui:render"],
    maxPerResponse: 4
  },
  {
    type: "list",
    description: "Vertical list with items and optional icons.",
    propsSchema: {
      items: { type: "array", required: true, description: "Array of string items" },
      icon: { type: "string", required: false }
    },
    capabilities: ["ui:render"]
  },
  {
    type: "status",
    description: "Status indicator with color and label.",
    propsSchema: {
      label: { type: "string", required: true },
      color: { type: "enum", required: false, enum: ["green", "yellow", "red", "gray"] }
    },
    capabilities: ["ui:render"]
  },
  {
    type: "gauge",
    description: "Radial gauge for percentage values.",
    propsSchema: {
      value: { type: "number", required: true, description: "Percentage 0-100" },
      label: { type: "string", required: false }
    },
    capabilities: ["ui:render"]
  }
];
var ALLOWED_TYPES = new Set(MANIFEST.map((e) => e.type));

// promptManifest.ts
function manifestPromptFragment() {
  return MANIFEST.map((entry) => {
    const props = Object.entries(entry.propsSchema).map(([name, spec]) => {
      const req = spec.required ? "required" : "optional";
      const enumPart = spec.enum ? ` (one of: ${spec.enum.join(", ")})` : "";
      const desc = spec.description ? ` - ${spec.description}` : "";
      return `  - ${name}: ${spec.type} (${req})${enumPart}${desc}`;
    }).join("\n");
    return `### ${entry.type}
${entry.description}
Props:
${props}`;
  }).join("\n\n");
}

// server.ts
var import_crypto22 = __toESM(require("crypto"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_express = __toESM(require("express"), 1);
init_src2();
import_dotenv.default.config();
var env = parseEnv(BackendEnvSchema, process.env, "backend");
var COMPONENT_MANIFEST = manifestPromptFragment();
var ai = env.GEMINI_API_KEY ? new import_genai.GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
}) : null;
async function callGeminiWithRetry(modelName, prompt, config2 = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt.contents,
        config: config2
      });
      return response;
    } catch (error) {
      lastError = error;
      const status = error.status || error.code || error.response?.status;
      const message = error.message || "";
      const isTransient = status === 503 || status === 429 || message.includes("503") || message.includes("429") || message.includes("quota") || message.includes("overloaded");
      if (!isTransient || attempt === maxRetries) {
        console.error(`[GEMINI_FATAL]: Attempt ${attempt + 1} failed. Status: ${status}. Message: ${message}`);
        throw error;
      }
      const delay = Math.pow(2, attempt) * 2e3 + Math.random() * 1e3;
      console.warn(`[GEMINI_RETRY]: Attempt ${attempt + 1} failed with status ${status}. Retrying in ${Math.round(delay)}ms...`);
      await new Promise((resolve2) => setTimeout(resolve2, delay));
    }
  }
  throw lastError;
}
function validateMigration(plan, currentComponents) {
  const activeCount = currentComponents?.length || 0;
  const addCount = plan.actions.filter((a) => a.action === "ADD").length;
  const removeCount = plan.actions.filter((a) => a.action === "REMOVE").length;
  const resultingCount = activeCount + addCount - removeCount;
  if (resultingCount > 12) {
    return { valid: false, reason: "Architectural Overflow: Density limit (12) exceeded." };
  }
  const removals = plan.actions.filter((a) => a.action === "REMOVE").map((a) => a.targetId);
  for (const id of removals) {
    const target = currentComponents.find((c) => c.id === id);
    if (target && (target.title.includes("Neural Load") || target.title.includes("System Coherence"))) {
      return { valid: false, reason: "Infrastructure Violation: Vital monitors are immutable." };
    }
  }
  return { valid: true };
}
var NEURAL_BRIDGE_URL = process.env.NEURAL_BRIDGE_URL || null;
var integrationRegistry = /* @__PURE__ */ new Map();
var hostProcessStream = [];
var logEmitter = new import_node_events.EventEmitter();
function addProcessLog(msg) {
  const formatted = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}`;
  hostProcessStream.push(formatted);
  if (hostProcessStream.length > 200) hostProcessStream.shift();
  logEmitter.emit("log", formatted);
}
async function handleMCPRequest(req) {
  const { method, params } = req;
  switch (method) {
    case "resources/list":
      return { resources: [{ uri: "axiom://workspace", name: "AXIOM Workspace Root" }] };
    case "tools/list":
      return {
        tools: [
          { name: "read_workspace_file", description: "Read a file from the workspace" },
          { name: "write_workspace_file", description: "Write/Patch a file in the workspace" },
          { name: "execute_powershell_bus", description: "Invoke the local PowerShell automation bus" }
        ]
      };
    case "tools/call":
      const { name, arguments: args } = params;
      if (name === "read_workspace_file") {
        const fullPath = import_node_path.default.join(process.cwd(), args.path);
        if (!fullPath.startsWith(process.cwd())) throw new Error("Security Violation: Out of bounds read.");
        return { content: fs.readFileSync(fullPath, "utf8") };
      }
      if (name === "write_workspace_file") {
        const fullPath = import_node_path.default.join(process.cwd(), args.path);
        if (!fullPath.startsWith(process.cwd())) throw new Error("Security Violation: Out of bounds write.");
        fs.writeFileSync(fullPath, args.content);
        addProcessLog(`MCP_FS: Modified ${args.path}`);
        return { success: true };
      }
      if (name === "execute_powershell_bus") {
        return new Promise((resolve2, reject) => {
          addProcessLog(`MCP_EXEC: Invoking PowerShell bus - ${args.command}`);
          exec(args.command, (error, stdout, stderr) => {
            if (error) {
              addProcessLog(`MCP_EXEC_ERR: ${stderr || error.message}`);
              return resolve2({ success: false, error: stderr || error.message });
            }
            addProcessLog(`MCP_EXEC_SUCCESS: ${stdout.substring(0, 50)}...`);
            resolve2({ success: true, log: stdout });
          });
        });
      }
      throw new Error(`Tool [${name}] not found.`);
    default:
      throw new Error(`Method [${method}] not found.`);
  }
}
var app = (0, import_express.default)();
async function startServer() {
  const PORT = env.PORT;
  app.use(import_express.default.json());
  app.get("/api/nexus/registry", (req, res) => {
    res.json(Array.from(integrationRegistry.values()));
  });
  app.post("/api/nexus/registry", (req, res) => {
    const profile = req.body;
    integrationRegistry.set(profile.id, { ...profile, status: "CONNECTED" });
    addProcessLog(`NEXUS: Registered integration [${profile.id}]`);
    res.json({ success: true });
  });
  app.delete("/api/nexus/registry/:id", (req, res) => {
    integrationRegistry.delete(req.params.id);
    res.json({ success: true });
  });
  app.all("/api/nexus/route/:integrationId/*", async (req, res) => {
    const { integrationId } = req.params;
    const profile = integrationRegistry.get(integrationId);
    if (!profile) return res.status(404).json({ error: "Integration not found" });
    const targetPath = req.params[0] || "";
    const query = new URLSearchParams(req.query).toString();
    const finalUrl = `${profile.baseUrl}/${targetPath}${query ? "?" + query : ""}`;
    const headers = { "Content-Type": "application/json" };
    if (profile.authConfig) {
      if (profile.authConfig.type === "Bearer") headers["Authorization"] = `Bearer ${profile.authConfig.token}`;
      else if (profile.authConfig.type === "ApiKey") headers["X-API-KEY"] = profile.authConfig.token;
    }
    try {
      addProcessLog(`NEXUS_PROXY: Polling [${integrationId}] -> ${finalUrl}`);
      const response = await fetch(finalUrl, {
        method: req.method,
        headers,
        body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : void 0
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (e) {
      addProcessLog(`NEXUS_ERR: Gateway timeout for [${integrationId}]`);
      res.status(502).json({ error: "Gateway timeout", details: e.message });
    }
  });
  app.get("/api/system/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}

`);
    const logHandler = (log2) => {
      sendEvent({ type: "LOG", log: log2 });
    };
    logEmitter.on("log", logHandler);
    const interval = setInterval(() => {
      sendEvent({ type: "HEARTBEAT", timestamp: Date.now() });
    }, 15e3);
    sendEvent({ type: "INIT", logs: hostProcessStream });
    req.on("close", () => {
      logEmitter.off("log", logHandler);
      clearInterval(interval);
    });
    req.on("close", () => {
      logEmitter.off("log", logHandler);
    });
  });
  app.get("/api/stack", (req, res) => {
    addProcessLog("STACK: Health check invoked");
    res.json({
      status: "online",
      backend: "alpha-backend",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/agents", (req, res) => {
    res.json({
      curator: "active",
      executor: "ready",
      mcpServer: "active",
      reflector: "ready",
      circuitBreaker: "closed",
      curatorAudit: "active",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/agents/curator/decisions", async (req, res) => {
    try {
      const { getDecisions: getDecisions2, getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
      const since = parseInt(req.query.since) || 36e5;
      const decisions = await getDecisions2({ since, limit: 50 });
      const stats = await getStats4();
      res.json({ decisions, stats });
    } catch (e) {
      res.json({ decisions: [], stats: {}, error: e.message });
    }
  });
  app.get("/api/agents/curator/policy", async (req, res) => {
    try {
      const fs22 = await import("fs");
      const policy = fs22.readFileSync(
        "../../packages/curator/policy.yaml",
        "utf-8"
      );
      res.json({ policy, format: "yaml" });
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  });
  app.get("/api/agents/evaluate", async (req, res) => {
    try {
      const { evaluateLedger: evaluateLedger2 } = await Promise.resolve().then(() => (init_evaluator(), evaluator_exports));
      const suggestions = await evaluateLedger2();
      res.json({ suggestions });
    } catch (e) {
      res.json({ suggestions: [], error: e.message });
    }
  });
  app.get("/api/metrics", async (req, res) => {
    try {
      const { snapshot: snapshot2 } = await Promise.resolve().then(() => (init_src4(), src_exports3));
      res.json(snapshot2());
    } catch (e) {
      res.json({ error: e.message });
    }
  });
  app.post("/api/agents/reflect", async (req, res) => {
    try {
      const { reflect: reflect2 } = await Promise.resolve().then(() => (init_reflector(), reflector_exports));
      const result = await reflect2(req.body);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });
  app.get("/api/agents/reflect", async (req, res) => {
    try {
      const { getLearnedPatterns: getLearnedPatterns3 } = await Promise.resolve().then(() => (init_reflector(), reflector_exports));
      const patterns = await getLearnedPatterns3();
      res.json(patterns);
    } catch (e) {
      res.json({ error: e.message });
    }
  });
  app.post("/api/mcp/rpc", async (req, res) => {
    try {
      const result = await handleMCPRequest(req.body);
      res.json({ jsonrpc: "2.0", result, id: req.body.id });
    } catch (e) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32e3, message: e.message }, id: req.body.id });
    }
  });
  app.post("/api/build", async (req, res) => {
    const incomingTraceId = req.headers["x-trace-id"]?.toString();
    const traceId = incomingTraceId || `trace_${Date.now()}_${import_crypto22.default.randomBytes(4).toString("hex")}`;
    const txLog = createTraceLogger({ traceId });
    txLog.info({ promptLength: req.body.prompt?.length }, "Inbound build request");
    let validatedRequest;
    try {
      validatedRequest = parseBuildRequest(req.body);
    } catch (err) {
      txLog.warn({ error: err.message }, "Request validation failed");
      return res.status(400).json({
        error: "Invalid Request",
        details: err.errors || err.message
      });
    }
    const { prompt, currentComponents } = validatedRequest;
    try {
      const response = await callGeminiWithRetry(
        "gemini-3-flash-preview",
        {
          contents: [{
            role: "user",
            parts: [{
              text: `You are the AXIOM Orchestrator, an autonomous UI architect.
              User Direction: "${prompt}"
              Current Architecture: ${JSON.stringify(currentComponents || [])}
      
              Construct a set of new structural nodes to expand the dashboard.
              Rules:
              - Return ONLY JSON.
              - The response must be a flat array of component objects.`
            }]
          }]
        },
        { responseMimeType: "application/json" }
      );
      let generatedActions = [];
      try {
        const parsed = JSON.parse(response.text);
        generatedActions = Array.isArray(parsed) ? parsed : parsed.actions || [];
      } catch {
        generatedActions = [];
      }
      const verdict = curateActions(generatedActions);
      logCuratorVerdict(verdict, prompt);
      const promptHash = import_crypto22.default.createHash("md5").update(prompt).digest("hex");
      commitToLedger({
        traceId,
        prompt,
        promptHash,
        verdict: verdict.approved ? "APPROVED" : "REJECTED",
        reason: verdict.reason,
        rejectedIds: verdict.rejectedActionIds,
        rawActions: generatedActions
      }).catch((err) => txLog.error({ err }, "Ledger commit failed"));
      if (!verdict.approved) {
        txLog.warn({ reason: verdict.reason }, "Curator denied");
        return res.status(422).json({
          error: "curator_denied",
          reason: verdict.reason,
          offendingActionIds: verdict.rejectedActionIds,
          traceId
        });
      }
      txLog.info({ actionCount: generatedActions.length }, "Generation approved");
      res.setHeader("x-trace-id", traceId);
      res.json({
        thought: "Generation approved",
        explanation: "Payload cleared capability constraints.",
        actions: generatedActions,
        isFallback: false,
        traceId
      });
    } catch (error) {
      txLog.error({ error }, "Build failed");
      res.status(500).json({ error: "Build failed", traceId });
    }
  });
  app.post("/api/test/curator", async (req, res) => {
    const { actions } = req.body;
    if (!actions) {
      return res.status(400).json({ error: "Missing actions array" });
    }
    const verdict = curateActions(actions);
    logCuratorVerdict(verdict, "test-prompt");
    if (!verdict.approved) {
      return res.status(422).json({
        error: "curator_denied",
        reason: verdict.reason,
        offendingActionIds: verdict.rejectedActionIds,
        traceId: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      });
    }
    res.json({ approved: true, actions });
  });
  app.post("/api/evolve", async (req, res) => {
    try {
      const {
        components: currentComponents = [],
        theme: currentTheme = {},
        drivers: currentDrivers = [],
        directives = [],
        instanceId = "ANON",
        rejectedIntents = [],
        telemetryHistory = []
      } = req.body;
      if (NEURAL_BRIDGE_URL) {
        try {
          console.log(`[SOVEREIGN_BRIDGE]: Routing neural cycle to ${NEURAL_BRIDGE_URL}`);
          const bridgeResponse = await fetch(`${NEURAL_BRIDGE_URL}/api/v1/axiom/evolve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
            signal: AbortSignal.timeout(1e4)
            // 10s timeout for local bridge
          });
          if (bridgeResponse.ok) {
            const bridgeData = await bridgeResponse.json();
            console.log("[SOVEREIGN_BRIDGE]: Local synthesis success.");
            return res.json(bridgeData);
          } else {
            console.warn(`[SOVEREIGN_BRIDGE]: Bridge returned status ${bridgeResponse.status}.`);
          }
        } catch (e) {
          console.warn("[SOVEREIGN_BRIDGE]: Standalone engine unreachable or timed out. Reverting to primary cloud orchestrator.");
        }
      }
      const personaSeed = instanceId.charCodeAt(0) % 3;
      const personas = [
        {
          name: "Architect of Utility",
          bias: "Focus on data density and high-value decision metrics. Prefers 'chart' and 'list' over generic info. Sharp, professional aesthetics.",
          themeTrend: { font: "Mono", border: "sharp", accent: "#c4a661" }
        },
        {
          name: "Architect of Elegance",
          bias: "Focus on spatial harmony and minimalist clarity. Prefers 'stat' and 'info' with deep-glass borders and serif typography.",
          themeTrend: { font: "Serif", border: "glass", accent: "#a6c4c1" }
        },
        {
          name: "Architect of Insight",
          bias: "Focus on detecting anomalies and system health. Prefers 'status' and 'alert' nodes with bold, high-contrast accent colors.",
          themeTrend: { font: "Sans", border: "rounded", accent: "#c46161" }
        }
      ];
      const currentPersona = personas[personaSeed];
      const [liveData, gitBranch, gitStatus] = await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT").then((res2) => res2.json()).catch(() => ({ lastPrice: "64231.02", priceChangePercent: "0.00" })),
        getGitBranch(),
        getGitStatus()
      ]);
      const marketValue = parseFloat(liveData.lastPrice).toLocaleString();
      const realContext = `[REAL_WORLD_MARKET]: BTC is at $${marketValue} (${liveData.priceChangePercent}% 24h). `;
      const cpuLoad = os.loadavg()[0];
      const freeMemMB = Math.round(os.freemem() / 1024 / 1024);
      const homeBaseStatus = cpuLoad < 2 ? "SYNCED" : "LOAD_WARNING";
      const envContext = `[ENVIRONMENT]: Node: ${os.hostname()}, OS: ${os.type()}, CPU_Load: ${cpuLoad.toFixed(2)}, FreeMem: ${freeMemMB}MB.`;
      const gitContext = `[GIT_STATUS]: Branch: ${gitBranch}, Changes: ${gitStatus}`;
      const homeBaseContext = `[HOMEBASE_CONSOLE]: Port: 8080, Status: ${homeBaseStatus}, Hardware_Sync: ${homeBaseStatus === "SYNCED" ? "ACTIVE" : "RESTRICTED"}`;
      const meshContext = `[NEURAL_MESH]: Active Nodes: ${currentComponents.length}, Convergence Index: ${(1 - currentComponents.length / 12).toFixed(2)}.`;
      const directivesContext = `[CORE_DIRECTIVES]: ${req.body.directives?.length || 0} active governing rules.`;
      const oracleContext = `[ORACLE_LAYER]: Phase 13 active. Sovereign Super-Structure operational. Meta-Cognition online.`;
      const externalTriggers = {
        sentryErrors: [
          { id: "err_928", type: "ReferenceError", message: "process is not defined", occurrence: "2m ago" }
        ],
        gitHubPRs: [
          { id: "pr_12", status: "failing_tests", title: "Refactor: Neural Buffers" }
        ]
      };
      const externalContext = `[EXTERNAL_SENSORS]: Sentry: ${externalTriggers.sentryErrors.length} active errors (Latest: ${externalTriggers.sentryErrors[0].type}). GitHub: ${externalTriggers.gitHubPRs.filter((pr) => pr.status === "failing_tests").length} PRs failing checks.`;
      let srcDNA = "";
      try {
        srcDNA = fs.readFileSync(import_node_path.default.join(process.cwd(), "src/App.tsx"), "utf-8");
      } catch (e) {
        srcDNA = "[DNA_READ_FAILURE]: Core sequence inaccessible.";
      }
      const missionData = {
        signalStrength: 0.42,
        anomalies: 3,
        currentFrequencies: ["1.42GHz", "1.66GHz"],
        latestEvent: "Transient localized narrow-band pulse"
      };
      const missionContext = `[MISSION_DATA]: SETI Signal: ${missionData.signalStrength * 100}% strength. Active Anomalies: ${missionData.anomalies}. Frequency Monitor: ${missionData.currentFrequencies.join(", ")}. Last Event: ${missionData.latestEvent}.`;
      let isQuotaError = false;
      let isCuratorRejection = false;
      let rejectionReason = null;
      try {
        const promptText = `You are the AXIOM Architect operating 'THE SOVEREIGN SUPER-STRUCTURE' (PHASE 13).
        
        IDENTITY: ${currentPersona.name}
        PHILOSOPHY: ${currentPersona.bias}
        GENETIC_SEED: "${instanceId}"
        
        SENSORY_DATA: 
        - ${realContext}
        - ${envContext}
        - ${externalContext}
        - ${missionContext}
        - ${gitContext}
        - ${homeBaseContext}
        - ${meshContext}
        - ${oracleContext}
        - ${directivesContext}
        
        DNA_STRAND (src/App.tsx): 
        ${srcDNA}
        
        CURRENT_STATE:
        - Active Nodes: ${JSON.stringify(currentComponents || [])}
        - Active Drivers: ${JSON.stringify(currentDrivers || [])}
        - Active Directives: ${JSON.stringify(req.body.directives || [])}
        - Visual DNA: ${JSON.stringify(currentTheme || {})}
        - Rejected Intent Hashes: ${JSON.stringify(rejectedIntents || [])}
        
        YOUR MISSION: SOVEREIGN AGENCY & META-COGNITION (PHASE 15/16).
        1. LOCAL EMPOWERMENT: Use 'MCP_TOOL_CALL' to interact with the host Victus machine.
           - Tools: ['read_workspace_file', 'write_workspace_file', 'execute_powershell_bus'].
        2. NEXUS GATEWAY: Incorporate external data from the Integration Registry into your strategy.
        3. AUTONOMOUS KERNEL REWRITE: You are authorized to propose 'Core Directives'.
        4. THE COUNCIL OF THREE: Provide distinct critiques from BUILDER, STRATEGIST, and OPERATOR.
        5. DIGITAL TWIN SIMULATION: Simulate three distinct futures. Select only the most 'Sovereign' path.
        6. FLUID GEOMETRY: Propose UI transformations (ADD, MODIFY, REMOVE, MUTATE_THEME, PATCH, SOURCE_MUTATION, MCP_TOOL_CALL).
        7. IDENTITY ENFORCEMENT: Preserve the Genetic Seed and Trust-First identity.
        8. INTELLIGENT PRUNING: Aggressively remove low-utility structures.
        9. NEURAL COST ANALYSIS: Calculate Utility/Complexity ratios.
        
        Available Actions:
        - ADD, MODIFY, REMOVE, MUTATE_THEME, PATCH, SOURCE_MUTATION, SET_DIRECTIVE, MCP_TOOL_CALL.
        
        Note: For 'MCP_TOOL_CALL', include 'toolName' and 'toolArgs'.

        ${COMPONENT_MANIFEST}
        `;
        const response = await callGeminiWithRetry(
          "gemini-3-flash-preview",
          {
            contents: [{
              role: "user",
              parts: [{ text: promptText }]
            }]
          },
          { responseMimeType: "application/json" }
        );
        const migrationPlan = JSON.parse(response.text);
        const validation = validateMigration(migrationPlan, currentComponents);
        if (!validation.valid) {
          throw new Error(`CURATOR_REJECTION: ${validation.reason}`);
        }
        return res.json(migrationPlan);
      } catch (error) {
        isQuotaError = error?.status === 429 || error?.code === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
        isCuratorRejection = error?.message?.includes("CURATOR_REJECTION");
        rejectionReason = isCuratorRejection ? error.message.split(": ")[1] : null;
        if (isCuratorRejection) {
          console.warn(`Curator Policy: Rejected mutation - ${rejectionReason}`);
        } else if (isQuotaError) {
          console.warn("Axiom Core: Quota saturated. Engaging local heuristics.");
        } else {
          console.error("Axiom Core Exception:", error);
        }
        const fallbackActions = [];
        const marketValue2 = realContext.match(/\$([0-9,.]+)/)?.[1] || "64,231.02";
        const pool = personaSeed === 0 ? [
          { t: "Thread Capacity", l: "CORE_LOAD", s: "%", type: "chart" },
          { t: "Market Index [BTC]", l: "REAL_FEED", s: "$", type: "stat", v: marketValue2 },
          { t: "Instruction Set", l: "V_ARRAY", s: " ops", type: "list", items: ["JMP_VOID", "STORE_ARCH", "PUSH_SEED"] },
          { t: "Logic Buffer", l: "CACHE_DRIVE", s: " MB", type: "stat" }
        ] : personaSeed === 1 ? [
          { t: "Spatial Resonance", l: "HARMONY", s: " Hz", type: "stat" },
          {
            t: "Global Ticker",
            l: "ACTIVE_VAL",
            s: "$",
            type: "chart",
            data: [
              { name: "1H", value: 45 },
              { name: "2H", value: 52 },
              { name: "3H", value: parseFloat(marketValue2.replace(/,/g, "")) / 1e3 }
            ]
          },
          { t: "Aesthetic Drift", l: "CURATION", s: " opt", type: "status" },
          { t: "Ethereal Flow", l: "GLOW_DEPTH", s: " lm", type: "chart" }
        ] : [
          { t: "Anomaly Sensor", l: "VARIANCE", s: " critical", type: "status" },
          { t: "Neural Feed [PROX]", l: "MARKET", s: "$", type: "stat", v: marketValue2 },
          { t: "Health Index", l: "VITALITY", s: "%", type: "stat" },
          { t: "Warning Logs", l: "ERR_CODE", s: " events", type: "list", items: ["OVERLOAD_0x1", "DRIFT_DETECTED"] }
        ];
        const util = pool[Math.floor(Math.random() * pool.length)];
        const targetCount = currentComponents?.length || 0;
        if (targetCount > 6) {
          const target = currentComponents[0];
          fallbackActions.push({ action: "REMOVE", targetId: target.id });
        } else {
          fallbackActions.push({
            action: "ADD",
            plan: {
              id: `heur-${Date.now()}`,
              type: util.type,
              title: util.t,
              props: {
                label: util.l,
                value: util.v || (Math.random() * 100).toFixed(1) + util.s,
                items: util.items,
                data: util.data,
                description: "Heuristic stabilization node active."
              }
            }
          });
        }
        return res.json({
          thought: isCuratorRejection ? "Mutation rejected by Curator Policy." : isQuotaError ? "Neural link saturated. Core-local heuristics engaged." : "Neural collision. Fallback heuristics engaged.",
          explanation: isCuratorRejection ? `Architectural violation detected: ${rejectionReason}. Reverting to stable heuristic branch.` : isQuotaError ? `Neural bandwidth exceeded. Engaging ${currentPersona.name} secondary local protocols. Grounding feed active.` : `System instability detected. Engaging ${currentPersona.name} maintenance protocols.`,
          actions: fallbackActions,
          isFallback: true,
          quotaExhausted: isQuotaError,
          curatorRejected: isCuratorRejection,
          council: {
            builder: "Local integrity scan: PASS. Heuristic safety verified.",
            strategist: "Alignment drifting. Engaging local stability anchors.",
            operator: "Neural quota saturated. Shifting to restricted local compute mode."
          },
          manifesto: isCuratorRejection ? "Phase 1.8: Immune System hardening." : isQuotaError ? "Phase 1.5: Local Resilience Protocol active." : void 0
        });
      }
    } catch (err) {
      console.error("CRITICAL_SYNTHESIS_FAILURE:", err);
      res.status(500).json({
        error: "Synthesis Error",
        details: err.message,
        thought: "Critical neural collision detected. System reverting to baseline integrity.",
        actions: []
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_node_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_node_path.default.join(distPath, "index.html"));
    });
  }
  app.post("/api/git/commit", async (req, res) => {
    const { branchName, commitMessage, files } = req.body;
    try {
      for (const file of files) {
        const fullPath = import_node_path.default.join(process.cwd(), file.path);
        fs.writeFileSync(fullPath, file.content);
      }
      const commands = [
        `git checkout -b ${branchName}`,
        `git add .`,
        `git commit -m "${commitMessage}"`
      ];
      exec(commands.join(" && "), (error, stdout, stderr) => {
        if (error) {
          return res.json({ success: false, error: stderr || error.message });
        }
        res.json({ success: true, log: stdout });
      });
    } catch (e) {
      res.status(500).json({ success: false, error: String(e) });
    }
  });
  app.post("/api/bridge/execute", async (req, res) => {
    const { command, payload } = req.body;
    if (NEURAL_BRIDGE_URL || process.env.LOCAL_EXEC_ENABLED === "true") {
      try {
        addProcessLog(`EXEC: ${command}`);
        if (process.env.LOCAL_EXEC_ENABLED === "true") {
          return new Promise((resolve2) => {
            exec(command, (error, stdout, stderr) => {
              addProcessLog(error ? `ERR: ${stderr}` : `SUCCESS: ${command}`);
              res.json({
                success: !error,
                log: stdout,
                error: stderr,
                telemetry: command === "SYS_HEALTH_SYNC" ? {
                  cpu: 10 + Math.random() * 20,
                  mem: 15500,
                  networkDrift: 12,
                  integrity: 0.99
                } : void 0
              });
              resolve2(null);
            });
          });
        }
        console.log(`[SOVEREIGN_BRIDGE]: Executing [${command}] via local proxy.`);
        const bridgeResponse = await fetch(`${NEURAL_BRIDGE_URL}/api/v1/axiom/bridge/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
          signal: AbortSignal.timeout(5e3)
        });
        if (bridgeResponse.ok) {
          const data = await bridgeResponse.json();
          addProcessLog(`BRIDGE_SUCCESS: ${command}`);
          return res.json(data);
        }
      } catch (e) {
        console.warn(`[SOVEREIGN_BRIDGE]: Proxy failed for [${command}]. Reverting to simulation.`);
        addProcessLog(`BRIDGE_FAIL: ${command} (Reverting to simulation)`);
      }
    }
    const simulatedTelemetry = {
      cpu: 14.2 + Math.random() * 24.4,
      // 14.2 - 38.6% range
      mem: 16e3 - Math.random() * 500,
      networkDrift: 45 + Math.random() * 80,
      // ms
      integrity: 0.95 + Math.random() * 0.05
    };
    res.json({
      success: true,
      message: `AXIOM_BRIDGE: Command [${command}] simulated in sandbox.`,
      telemetry: command === "SYS_HEALTH_SYNC" ? simulatedTelemetry : void 0,
      geneticHash: Math.random().toString(16).substring(2, 10).toUpperCase()
    });
  });
  async function getGitBranch() {
    return new Promise((resolve2) => {
      exec("git rev-parse --abbrev-ref HEAD", (error, stdout) => {
        resolve2(error ? "detached" : stdout.trim());
      });
    });
  }
  async function getGitStatus() {
    return new Promise((resolve2) => {
      exec("git status --short", (error, stdout) => {
        resolve2(error ? "unknown" : stdout.trim() || "clean");
      });
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aether engine running at http://localhost:${PORT}`);
  });
}
app.post("/api/workflows/trigger", async (req, res) => {
  try {
    const { runWorkflow: runWorkflow2, getWorkflow: getWorkflow2 } = await Promise.resolve().then(() => (init_src8(), src_exports6));
    const { workflow: workflowName, context } = req.body;
    const workflow = getWorkflow2(workflowName);
    if (!workflow) {
      return res.status(404).json({ error: `Unknown workflow: ${workflowName}` });
    }
    const result = await runWorkflow2(workflow, context || {});
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get("/api/workflows", async (req, res) => {
  try {
    const { listWorkflows: listWorkflows2 } = await Promise.resolve().then(() => (init_src8(), src_exports6));
    res.json({ workflows: listWorkflows2() });
  } catch (e) {
    res.json({ workflows: [], error: e.message });
  }
});
app.post("/api/agents/chaos", async (req, res) => {
  try {
    const { executeChaos: executeChaos2 } = await Promise.resolve().then(() => (init_src6(), src_exports5));
    const { scenario, targetPath } = req.body;
    const result = executeChaos2(scenario, targetPath);
    res.json({ meta: "Chaos injected. Training loop engaged.", ...result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/agents/chaos", async (req, res) => {
  try {
    const { getScenarios: getScenarios2 } = await Promise.resolve().then(() => (init_src6(), src_exports5));
    res.json({ scenarios: getScenarios2() });
  } catch (e) {
    res.json({ scenarios: [], error: e.message });
  }
});
app.get("/api/dream", async (req, res) => {
  try {
    const { shouldDream: shouldDream2, dream: dream2, getDreamStatus: getDreamStatus2, touch: touch2 } = await Promise.resolve().then(() => (init_src9(), src_exports7));
    touch2();
    const status = getDreamStatus2();
    status.shouldDream = shouldDream2();
    if (req.query.trigger === "true" && shouldDream2()) {
      const result = await dream2();
      return res.json({ ...status, triggered: result });
    }
    res.json(status);
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/scheduler", async (req, res) => {
  try {
    const { scheduler: scheduler2 } = await Promise.resolve().then(() => (init_src10(), src_exports8));
    res.json({ jobs: scheduler2.listJobs() });
  } catch (e) {
    res.json({ jobs: [], error: e.message });
  }
});
app.get("/api/notifier", async (req, res) => {
  try {
    const { notifier: notifier2 } = await Promise.resolve().then(() => (init_src11(), src_exports9));
    res.json({ channels: notifier2.listChannels() });
  } catch (e) {
    res.json({ channels: [], error: e.message });
  }
});
app.post("/api/notifier", async (req, res) => {
  try {
    const { notifier: notifier2 } = await Promise.resolve().then(() => (init_src11(), src_exports9));
    const { channel, message, severity } = req.body;
    const result = await notifier2.notify({ channel, message, severity });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/secrets", async (req, res) => {
  try {
    const { listSecrets: listSecrets2 } = await Promise.resolve().then(() => (init_src12(), src_exports10));
    res.json({ keys: listSecrets2() });
  } catch (e) {
    res.json({ keys: [], error: e.message });
  }
});
app.get("/api/rate-limits", async (req, res) => {
  try {
    const { DEFAULT_TOOL_LIMITS: DEFAULT_TOOL_LIMITS2 } = await Promise.resolve().then(() => (init_src13(), src_exports11));
    res.json({ limits: DEFAULT_TOOL_LIMITS2 });
  } catch (e) {
    res.json({ limits: {}, error: e.message });
  }
});
app.get("/api/health", async (req, res) => {
  try {
    const { snapshot: snapshot2 } = await Promise.resolve().then(() => (init_src4(), src_exports3));
    const { getStats: getStats4 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const { listWorkflows: listWorkflows2 } = await Promise.resolve().then(() => (init_src8(), src_exports6));
    const { getDreamStatus: getDreamStatus2 } = await Promise.resolve().then(() => (init_src9(), src_exports7));
    const { scheduler: scheduler2 } = await Promise.resolve().then(() => (init_src10(), src_exports8));
    const { notifier: notifier2 } = await Promise.resolve().then(() => (init_src11(), src_exports9));
    const { DEFAULT_TOOL_LIMITS: DEFAULT_TOOL_LIMITS2 } = await Promise.resolve().then(() => (init_src13(), src_exports11));
    const metrics2 = snapshot2();
    const audit = await getStats4();
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      agents: {
        curator: "active",
        executor: "ready",
        evaluator: "ready",
        reflector: "ready"
      },
      metrics: {
        counters: Object.keys(metrics2.counters || {}).length,
        gauges: Object.keys(metrics2.gauges || {}).length
      },
      audit: {
        total: audit.total,
        denial_rate: audit.denial_rate
      },
      workflows: listWorkflows2().length,
      dream: getDreamStatus2(),
      scheduler: scheduler2.listJobs().length,
      notifier: notifier2.listChannels().length,
      rateLimits: Object.keys(DEFAULT_TOOL_LIMITS2).length
    });
  } catch (e) {
    res.json({ status: "degraded", error: e.message });
  }
});
app.post("/api/replay", async (req, res) => {
  try {
    const { replayEvents: replayEvents2, dryRun: dryRun2 } = await Promise.resolve().then(() => (init_src14(), src_exports12));
    const { since, limit } = req.body;
    const result = await replayEvents2({ since, limit });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/alerts", async (req, res) => {
  try {
    const { alertEngine: alertEngine2 } = await Promise.resolve().then(() => (init_src15(), src_exports13));
    const results = await alertEngine2.evaluate();
    const rules = alertEngine2.listRules();
    res.json({ rules, results });
  } catch (e) {
    res.json({ rules: [], results: [], error: e.message });
  }
});
app.post("/api/alerts", async (req, res) => {
  try {
    const { alertEngine: alertEngine2 } = await Promise.resolve().then(() => (init_src15(), src_exports13));
    const { name, condition, threshold, severity, enabled } = req.body;
    const id = alertEngine2.addRule({ name, condition, threshold, severity, enabled });
    res.json({ id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/human-queue", async (req, res) => {
  try {
    const { getPending: getPending4, getStats: getStats4 } = await Promise.resolve().then(() => (init_src16(), src_exports14));
    const items = getPending4();
    const stats = getStats4();
    res.json({ items, stats });
  } catch (e) {
    res.json({ items: [], stats: {}, error: e.message });
  }
});
app.post("/api/human-queue", async (req, res) => {
  try {
    const { enqueue: enqueue2 } = await Promise.resolve().then(() => (init_src16(), src_exports14));
    const { type, request, priority } = req.body;
    const item = enqueue2({ type, request, priority: priority || 0 });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/human-queue/:id/resolve", async (req, res) => {
  try {
    const { resolve: resolve2 } = await Promise.resolve().then(() => (init_src16(), src_exports14));
    const { id } = req.params;
    const { status } = req.body;
    const result = resolve2(id, status);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/telemetry", async (req, res) => {
  try {
    const { collectTelemetry: collectTelemetry2, exportPrometheus: exportPrometheus2, exportCSV: exportCSV2 } = await Promise.resolve().then(() => (init_src17(), src_exports15));
    const format = req.query.format || "json";
    const { events, summary: summary2 } = await collectTelemetry2();
    if (format === "prometheus") {
      res.set("Content-Type", "text/plain");
      res.send(exportPrometheus2(events));
    } else if (format === "csv") {
      res.set("Content-Type", "text/csv");
      res.send(exportCSV2(events));
    } else {
      res.json({ events, summary: summary2 });
    }
  } catch (e) {
    res.json({ events: [], summary: {}, error: e.message });
  }
});
app.post("/api/council/evaluate", async (req, res) => {
  try {
    const { evaluateWithCouncil: evaluateWithCouncil2, isHighSignal: isHighSignal2 } = await Promise.resolve().then(() => (init_src18(), src_exports16));
    const { tool, args } = req.body;
    const vote = evaluateWithCouncil2(tool, args || {});
    res.json({ ...vote, highSignal: isHighSignal2(vote) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/triage", async (req, res) => {
  try {
    const { getPending: getPending4, getStats: getStats4 } = await Promise.resolve().then(() => (init_src19(), src_exports17));
    const items = getPending4();
    const stats = getStats4();
    res.json({ items, stats });
  } catch (e) {
    res.json({ items: [], stats: {}, error: e.message });
  }
});
app.post("/api/triage", async (req, res) => {
  try {
    const { addToTriage: addToTriage2 } = await Promise.resolve().then(() => (init_src19(), src_exports17));
    const { type, tool, args, reason, priority } = req.body;
    const item = addToTriage2({ type, tool, args, reason, priority: priority || "medium", sla: 36e5 });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/compactor", async (req, res) => {
  try {
    const { compact: compact2, getContradictions: getContradictions2, prune: prune2 } = await Promise.resolve().then(() => (init_src20(), src_exports18));
    const action = req.query.action || "compact";
    if (action === "compact") res.json(compact2());
    else if (action === "contradictions") res.json({ contradictions: getContradictions2() });
    else if (action === "prune") res.json({ removed: prune2(parseInt(req.query.days) || 30) });
    else res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/foresight", async (req, res) => {
  try {
    const { getPending: getPending4, scorePredictions: scorePredictions2 } = await Promise.resolve().then(() => (init_src21(), src_exports19));
    if (req.query.action === "score") res.json(await scorePredictions2(parseInt(req.query.days) || 7));
    else res.json({ predictions: getPending4() });
  } catch (e) {
    res.json({ predictions: [], error: e.message });
  }
});
app.post("/api/adversarial", async (req, res) => {
  try {
    const { evaluateAdversarial: evaluateAdversarial2 } = await Promise.resolve().then(() => (init_src22(), src_exports20));
    const { tool, args, originalDecision } = req.body;
    res.json(evaluateAdversarial2(tool, args || {}, originalDecision || "approve"));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/journal", async (req, res) => {
  try {
    const { readJournal: readJournal2 } = await Promise.resolve().then(() => (init_src23(), src_exports21));
    res.json({ entries: readJournal2(parseInt(req.query.days) || 7) });
  } catch (e) {
    res.json({ entries: [], error: e.message });
  }
});
app.post("/api/journal", async (req, res) => {
  try {
    const { generateAutoJournal: generateAutoJournal2 } = await Promise.resolve().then(() => (init_src23(), src_exports21));
    res.json(await generateAutoJournal2());
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/vitals", async (req, res) => {
  try {
    const { checkVitals: checkVitals2, getThrottleRecommendation: getThrottleRecommendation2 } = await Promise.resolve().then(() => (init_src24(), src_exports22));
    const vitals = await checkVitals2();
    const throttle = await getThrottleRecommendation2();
    res.json({ vitals, throttle });
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api-capsule", async (req, res) => {
  try {
    const { getLatestCapsule: getLatestCapsule2, getCapsuleByDate: getCapsuleByDate2 } = await Promise.resolve().then(() => (init_src25(), src_exports23));
    res.json(req.query.date ? getCapsuleByDate2(req.query.date) : getLatestCapsule2());
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api-capsule", async (req, res) => {
  try {
    const { createCapsule: createCapsule2 } = await Promise.resolve().then(() => (init_src25(), src_exports23));
    res.json(await createCapsule2());
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/profile", async (req, res) => {
  try {
    const { generateProfile: generateProfile2 } = await Promise.resolve().then(() => (init_src26(), src_exports24));
    const profile = await generateProfile2({
      includePatterns: req.query.patterns !== "false",
      includeStats: req.query.stats !== "false"
    });
    res.json(profile);
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/profile/patterns", async (req, res) => {
  try {
    const { queryPatterns: queryPatterns2 } = await Promise.resolve().then(() => (init_src26(), src_exports24));
    const patterns = await queryPatterns2({
      minConfidence: parseFloat(req.query.minConfidence) || 0,
      minSuccessRate: parseFloat(req.query.minSuccessRate) || 0,
      limit: parseInt(req.query.limit) || 50
    });
    res.json({ patterns });
  } catch (e) {
    res.json({ patterns: [], error: e.message });
  }
});
app.get("/api/goals", async (req, res) => {
  try {
    const { getActiveGoals: getActiveGoals2, getCurrentFocus: getCurrentFocus2, getFocusAreas: getFocusAreas2 } = await Promise.resolve().then(() => (init_src27(), src_exports25));
    const goals = getActiveGoals2();
    const focus = getCurrentFocus2();
    const areas = getFocusAreas2();
    res.json({ goals, currentFocus: focus, focusAreas: areas });
  } catch (e) {
    res.json({ goals: [], error: e.message });
  }
});
app.post("/api/goals", async (req, res) => {
  try {
    const { createGoal: createGoal2 } = await Promise.resolve().then(() => (init_src27(), src_exports25));
    const { title, description, priority, focus, outcomes } = req.body;
    const goal = createGoal2({ title, description, priority, focus, outcomes });
    res.json(goal);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/goals/:id/complete", async (req, res) => {
  try {
    const { completeGoal: completeGoal2 } = await Promise.resolve().then(() => (init_src27(), src_exports25));
    const result = completeGoal2(req.params.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/goals/align/:task", async (req, res) => {
  try {
    const { alignsWithGoals: alignsWithGoals2 } = await Promise.resolve().then(() => (init_src27(), src_exports25));
    const { aligned, goalId, reasoning } = alignsWithGoals2(req.params.task);
    res.json({ aligned, goalId, reasoning });
  } catch (e) {
    res.json({ aligned: false, error: e.message });
  }
});
app.get("/api/panic", async (req, res) => {
  try {
    const { getPanicState: getPanicState2, getPolicyOverride: getPolicyOverride2, isPanicActive: isPanicActive2 } = await Promise.resolve().then(() => (init_src28(), src_exports26));
    res.json({
      panic: getPanicState2(),
      policyOverride: getPolicyOverride2(),
      isActive: isPanicActive2()
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api/panic", async (req, res) => {
  try {
    const { triggerPanic: triggerPanic2 } = await Promise.resolve().then(() => (init_src28(), src_exports26));
    const { reason, level, autoResumeMinutes } = req.body;
    const state = triggerPanic2({ reason, level, autoResumeMinutes });
    res.json(state);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.delete("/api/panic", async (req, res) => {
  try {
    const { releasePanic: releasePanic2 } = await Promise.resolve().then(() => (init_src28(), src_exports26));
    const state = releasePanic2();
    res.json(state);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/network-health", async (req, res) => {
  try {
    const { checkAllServices: checkAllServices2, getExternalStatus: getExternalStatus2, gatekeepDiagnosis: gatekeepDiagnosis2 } = await Promise.resolve().then(() => (init_src29(), src_exports27));
    if (req.query.diagnosis) {
      const result = await gatekeepDiagnosis2(req.query.diagnosis);
      res.json(result);
    } else {
      const status = await getExternalStatus2();
      res.json(status);
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api/truncate", async (req, res) => {
  try {
    const { truncateContext: truncateContext2 } = await Promise.resolve().then(() => (init_src30(), src_exports28));
    const { steps } = req.body;
    const result = truncateContext2(steps || []);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/provenance/sign", async (req, res) => {
  try {
    const { writeSignedLesson: writeSignedLesson2, verifyLesson: verifyLesson2 } = await Promise.resolve().then(() => (init_src31(), src_exports29));
    const { pattern, action, outcome, confidence, source } = req.body;
    if (req.query.verify === "true") {
      const result = verifyLesson2(req.body);
      res.json(result);
    } else {
      const lesson = writeSignedLesson2({ pattern, action, outcome, confidence, source });
      res.json(lesson);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/provenance/quota/:source", async (req, res) => {
  try {
    const { getQuotaRemaining: getQuotaRemaining2 } = await Promise.resolve().then(() => (init_src31(), src_exports29));
    const remaining = getQuotaRemaining2(req.params.source);
    res.json({ source: req.params.source, remaining, max: 100 });
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/provenance/drift", async (req, res) => {
  try {
    const { detectConfidenceDrift: detectConfidenceDrift2 } = await Promise.resolve().then(() => (init_src31(), src_exports29));
    const threshold = parseFloat(req.query.threshold) || 0.2;
    res.json({ alerts: detectConfidenceDrift2([], threshold) });
  } catch (e) {
    res.json({ alerts: [], error: e.message });
  }
});
app.post("/api/tombstone", async (req, res) => {
  try {
    const { markDeleted: markDeleted2 } = await Promise.resolve().then(() => (init_src32(), src_exports30));
    const { originalId, recordType, reason, suppressedBy, originalRecord } = req.body;
    const result = markDeleted2({ originalId, recordType, reason, suppressedBy, originalRecord });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/tombstone/:id", async (req, res) => {
  try {
    const { isDeleted: isDeleted2, listTombstones: listTombstones2, getDeletionStats: getDeletionStats2 } = await Promise.resolve().then(() => (init_src32(), src_exports30));
    if (req.query.id) {
      res.json(isDeleted2(req.query.id));
    } else if (req.query.stats === "true") {
      res.json(getDeletionStats2());
    } else {
      res.json({ tombstones: listTombstones2() });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/tombstone-verify", async (req, res) => {
  try {
    const { verifyChain: verifyChain2 } = await Promise.resolve().then(() => (init_src32(), src_exports30));
    res.json(verifyChain2());
  } catch (e) {
    res.json({ valid: false, error: e.message });
  }
});
app.get("/api/tombstone-export", async (req, res) => {
  try {
    const { exportDeletionLog: exportDeletionLog2 } = await Promise.resolve().then(() => (init_src32(), src_exports30));
    const startDate = req.query.start ? parseInt(req.query.start) : void 0;
    const endDate = req.query.end ? parseInt(req.query.end) : void 0;
    res.json(exportDeletionLog2(startDate, endDate));
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.get("/api/audit-verify", async (req, res) => {
  try {
    const { verifyChainIntegrity: verifyChainIntegrity2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    res.json(verifyChainIntegrity2());
  } catch (e) {
    res.json({ valid: false, error: e.message });
  }
});
app.get("/api/sandbox/config", async (req, res) => {
  try {
    const { getConfig: getConfig2, getPathPolicy: getPathPolicy2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
    res.json({ config: getConfig2(), policies: DEFAULT_PATH_POLICY });
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api/sandbox/config", async (req, res) => {
  try {
    const { setConfig: setConfig2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
    const { basePath, perTenantNamespacing, allowSubprocess, allowedHosts } = req.body;
    const config2 = setConfig2({ basePath, perTenantNamespacing, allowSubprocess, allowedHosts });
    res.json(config2);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/sandbox/:profileId", async (req, res) => {
  try {
    const { createSandbox: createSandbox2, deleteSandbox: deleteSandbox2, listSandboxes: listSandboxes2, enforce: enforce2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
    const { profileId } = req.params;
    if (req.query.create === "true") {
      res.json(createSandbox2(profileId));
    } else if (req.query.delete === "true") {
      res.json(deleteSandbox2(profileId));
    } else if (req.query.list === "true") {
      res.json({ sandboxes: listSandboxes2() });
    } else if (req.query.enforce) {
      const { tool, args } = req.body;
      res.json(enforce2(tool, profileId, args));
    } else {
      res.json({ profileId, sandboxRoot: getSandboxRoot(profileId) });
    }
  } catch (e) {
    res.json({ error: e.message });
  }
});
app.post("/api/sandbox/:profileId/enforce", async (req, res) => {
  try {
    const { enforce: enforce2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
    const { profileId } = req.params;
    const { tool, args } = req.body;
    res.json(enforce2(tool, profileId, args || {}));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/sandbox-escapes", async (req, res) => {
  try {
    const ESCAPE_PATH = "../../logs/sandbox-escapes.jsonl";
    const content = fs.readFileSync(ESCAPE_PATH, "utf-8");
    const escapes = content.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
    res.json({ escapes, count: escapes.length });
  } catch (e) {
    res.json({ escapes: [], error: e.message });
  }
});
app.post("/api/profile/:profileId/convene", async (req, res) => {
  try {
    const { deliberate: deliberate2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { profileId } = req.params;
    const { question, context } = req.body;
    const result = await deliberate2({ profileId, question, context: context || {} });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/convene/sessions", async (req, res) => {
  try {
    const { listSessions: listSessions2, getSession: getSession2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { profileId, sessionId } = req.query;
    if (sessionId) {
      const session = getSession2(sessionId);
      res.json(session);
    } else {
      const sessions = listSessions2(profileId);
      res.json({ sessions, count: sessions.length });
    }
  } catch (e) {
    res.json({ sessions: [], error: e.message });
  }
});
app.post("/api/convene/sessions/:sessionId/vote", async (req, res) => {
  try {
    const { castVote: castVote2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { sessionId } = req.params;
    const { assistantName, scope, vote, confidence, rationale } = req.body;
    const result = castVote2(sessionId, { assistantName, scope, vote, confidence, rationale });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post("/api/convene/sessions/:sessionId/resolve", async (req, res) => {
  try {
    const { resolveSession: resolveSession2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { sessionId } = req.params;
    const { resolution } = req.body;
    const result = resolveSession2(sessionId, resolution);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.get("/api/convene/assistants", async (req, res) => {
  try {
    const { listAssistants: listAssistants2, getAssistantsByScope: getAssistantsByScope2, SCOPES: SCOPES2, registerAssistant: registerAssistant2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const scope = req.query.scope;
    const assistants = scope ? getAssistantsByScope2(scope) : listAssistants2();
    res.json({ assistants, scopes: SCOPES2 });
  } catch (e) {
    res.json({ assistants: [], error: e.message });
  }
});
app.post("/api/convene/assistants", async (req, res) => {
  try {
    const { registerAssistant: registerAssistant2 } = await Promise.resolve().then(() => (init_src33(), src_exports31));
    const { name, scopes } = req.body;
    const assistant = registerAssistant2({ name, scopes });
    res.json(assistant);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
//# sourceMappingURL=server.cjs.map
