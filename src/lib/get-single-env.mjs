/**
 * @import {Command} from "commander"
 * @import {
 *   RudaYmlResult,
 *   RudaYmlResultEnv
 * } from "./config.mjs"
 */

/**
 * @param {Command} self
 * @param {RudaYmlResult} yml
 * @returns {RudaYmlResultEnv}
 */
export function getSingleEnv(self, yml) {
  const env = self.opts().env;

  if (!Boolean(env) && !yml.hasOneEnv) {
    console.error(
      'error: more than one environment in config, must specify env',
    );
    process.exit(1);
  }

  if (yml.hasOneEnv) {
    return yml.environments[Object.keys(yml.environments)[0]];
  }

  const maybeEnv = yml.environments[env];
  if (!maybeEnv) {
    console.error(`error: no environment named ${env}`);
    process.exit(1);
  }

  return maybeEnv;
}
