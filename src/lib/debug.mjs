/** @type {boolean} */
let debugEnabled = false;

/** @param {boolean} enabled */
export function setDebug(enabled) {
  debugEnabled = Boolean(enabled);
}

/** @returns {boolean} */
export function isDebug() {
  return debugEnabled;
}

// Expose the accessor process-wide so any module can check debug mode without
// threading it through call signatures.
/** @type {typeof globalThis & { isDebug: typeof isDebug }} */
const debugGlobal = globalThis;
debugGlobal.isDebug = isDebug;
