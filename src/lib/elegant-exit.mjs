import { getDefaultSshConnectionPool } from './ssh/ssh-connection-pool.mjs';

/**
 * Also disposes of ssh connections
 *
 * @param {number} code
 */
export async function elegantExit(code) {
  await getDefaultSshConnectionPool().disposeAll();
  process.exit(code);
}
