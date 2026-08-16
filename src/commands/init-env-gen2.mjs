/** @import {Command} from "commander" */

import chalk from 'chalk';
import { commandNames } from './command-names.mjs';
import { readFile } from 'node:fs/promises';
import { ok } from 'node:assert';
import { getDefaultSshConnectionPool } from '../lib/ssh/ssh-connection-pool.mjs';
import { getRemoteValidRudaDirPath } from '../lib/remote/get-remote-valid-ruda-dir-path.mjs';
import { remoteConfigGen2Schema } from '../lib/remote/remote-config-gen2-schema.mjs';
import { stringify } from 'yaml';
import { encodeTransport } from '../lib/encode-transport.mjs';
import { remoteGenerateEd25519 } from '../lib/remote/remote-generate-ed25519.mjs';
import { elegantExit } from '../lib/elegant-exit.mjs';

/** @this {Command} */
export async function initEnvGen2() {
  const name = this.args[0];
  const remoteUrl = this.args[1];

  /** @type {string | undefined} */
  const idRsaPath = this.opts().identityFile;
  const generateRemoteIdRsa = Boolean(this.opts().generateIdentity);

  if (generateRemoteIdRsa && idRsaPath) {
    console.error(
      chalk.red(
        `error: cannot provide both --generate-identity and --identity-file`,
      ),
    );
    await elegantExit(1);
  }

  if (!idRsaPath && !generateRemoteIdRsa) {
    console.log(
      chalk.yellow(commandNames.envInit),
      `warn: no identity file provided or generated, assuming public access to repo`,
    );
  }

  let idRsaContent = '';
  if (idRsaPath) {
    try {
      idRsaContent = await readFile(idRsaPath, 'utf8');
    } catch (e) {
      console.error(
        chalk.red(`error: could not read identity file at ${idRsaPath}`),
      );
      console.error(e);
      await elegantExit(1);
    }
  }

  const sshConnection = await getDefaultSshConnectionPool().getConnection();
  ok(sshConnection !== 'busy');
  const remoteRudaPath = await getRemoteValidRudaDirPath(sshConnection, true);

  const envPath = `${remoteRudaPath}/${name}`;

  const existsDir = await sshConnection.exec('sh', [
    '-c',
    `test -d ${envPath} && echo $? || echo $?`,
  ]);

  if (existsDir.trim() !== '1') {
    console.error(chalk.red(`error: dir ${envPath} already exists`));
    await elegantExit(1);
  }

  await sshConnection.exec('sh', ['-c', `mkdir -p ${envPath}`]);

  const remoteConfig = remoteConfigGen2Schema.parse({
    version: '2',
    env: {},
    files: {},
    remoteUrl,
    didGenerateIdRsa: generateRemoteIdRsa,
  });
  const remoteConfigYml = stringify(remoteConfig);
  const remoteConfigYmlEncoded = encodeTransport(remoteConfigYml);

  await sshConnection.exec('sh', [
    '-c',
    `echo ${remoteConfigYmlEncoded} | base64 -d > ${envPath}/config.yml`,
  ]);

  await sshConnection.exec('sh', ['-c', `mkdir -p ${envPath}/files`]);

  // only in case of not generating id rsa
  if (idRsaContent) {
    const idRsaContentEncoded = encodeTransport(idRsaContent);
    await sshConnection.exec('sh', [
      '-c',
      `echo ${idRsaContentEncoded} | base64 -d > ${envPath}/id_rsa`,
    ]);
  }

  if (generateRemoteIdRsa) {
    const pubkey = await remoteGenerateEd25519(sshConnection, envPath);
    console.log(chalk.blue(commandNames.envInit), `generated public key`);
    console.log(pubkey);
  }

  console.log(chalk.blue(commandNames.envInit), `done at ${envPath}`);
}
