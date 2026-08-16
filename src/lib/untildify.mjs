import { homedir } from 'node:os';

/**
 * @param {string} p
 * @returns {string}
 */
export function untildify(p) {
  return p.replace(/^~/, homedir());
}
