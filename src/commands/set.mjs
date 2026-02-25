import { parse, stringify } from 'yaml';
import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import z from 'zod';
/**
 * @import {Command} from "commander"
 * @import {NodeSSH} from "node-ssh"
 * @import {
 *   RudaYmlResult,
 *   RudaYmlResultEnv
 * } from "../lib/config.mjs"
 */

const remoteConfigSchema = z.object({
  env: z.record(z.string(), z.string()),
});

/** @typedef {z.infer<typeof remoteConfigSchema>} RemoteConfig */

/**
 * <var name>
 * [value]
 * -e, --env <env name>
 *
 * @this {Command}
 */
export async function set() {
  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const config = await getRemoteConfig(env, sshConnection);

  config.env[this.args[0]] = this.args[1];

  await writeRemoteConfig(env, sshConnection, config);

  sshConnection.dispose();
  console.log('done');
}

/**
 * @param {RudaYmlResultEnv} env
 * @param {NodeSSH} sshConnection
 * @returns {Promise<RemoteConfig>}
 */
async function getRemoteConfig(env, sshConnection) {
  const configText = await sshConnection.exec('sh', [
    '-c',
    `cat ~/ruda/${env.name}/config.yml`,
  ]);

  const config = (() => {
    try {
      const configParsed = parse(configText);
      if (configParsed === null) {
        return { env: {} };
      }
      if (configParsed['env'] === null) {
        return { env: {} };
      }
      return remoteConfigSchema.parse(configParsed);
    } catch (e) {
      console.error('error: could not parse remote config', e);
      sshConnection.dispose();
      process.exit(1);
    }
  })();

  return config;
}

/**
 * @param {RudaYmlResultEnv} env
 * @param {NodeSSH} sshConnection
 * @param {RemoteConfig} config
 */
async function writeRemoteConfig(env, sshConnection, config) {
  const configSerialized = stringify(config);

  const encodedConfig = encodeTransport(configSerialized);
  await sshConnection.exec('sh', [
    '-c',
    `echo ${encodedConfig} | base64 -d > ~/ruda/${env.name}/config.yml`,
  ]);
}

/**
 * @param {Command} self
 * @param {RudaYmlResult} yml
 * @returns {RudaYmlResultEnv}
 */
function getSingleEnv(self, yml) {
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

/**
 * @param {RudaYmlResultEnv} env
 * @param {NodeSSH} sshConnection
 */
async function checkEnvInitialized(env, sshConnection) {
  const remoteConfigPath = `~/ruda/${env.name}/config.yml`;

  const configExists = await sshConnection.exec('sh', [
    '-c',
    `test -f ${remoteConfigPath} && echo $? || echo $?`,
  ]);

  if (configExists.trim() !== '0') {
    console.error(`error: env ${env.name} not initialized`);
    process.exit(1);
  }
}

/**
 * @param {string} str
 * @returns {string}
 */
function encodeTransport(str) {
  return Buffer.from(str).toString('base64');
}
