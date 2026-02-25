/**
 * @param {string} str
 * @returns {string}
 */
export function encodeTransport(str) {
  return Buffer.from(str).toString('base64');
}
