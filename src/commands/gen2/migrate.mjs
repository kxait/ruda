/** @import {Command} from "commander" */

import chalk from 'chalk';
import { getCommandContext } from '../../lib/get-command-context.mjs';
import { commandNames } from './command-names.mjs';
import { elegantExit } from '../../lib/elegant-exit.mjs';
import { parse, stringify } from 'yaml';
import { remoteConfigSchema } from '../../lib/remote/remote-config-schema.mjs';
import { remoteConfigGen2Schema } from '../../lib/remote/remote-config-gen2-schema.mjs';
import { rudaYmlSchema } from '../../lib/config.mjs';
import { encodeTransport } from '../../lib/encode-transport.mjs';

/** @this {Command} */
export async function migrate() {
  const name = this.args[0];

  const { sshConnection, remoteRudaPath } = await getCommandContext();

  const envPath = `${remoteRudaPath}/${name}`;

  const configPath = `${envPath}/config.yml`;
  const oldConfigPath = `${configPath}.old`;

  const filesDirPath = `${envPath}/files`;

  const repoDirPath = `${envPath}/repo`;
  const rudaYmlPath = `${repoDirPath}/.ruda.yml`;

  log({
    envPath,
    configPath,
    oldConfigPath,
    filesDirPath,
    repoDirPath,
    rudaYmlPath,
  });

  const envPathExists = await sshConnection.exec('sh', [
    '-c',
    `test -d ${envPath} && echo $? || echo $?`,
  ]);
  if (envPathExists.trim() !== '0') {
    console.error(chalk.red(`env ${name} does not exist`));
    await elegantExit(1);
  }

  log('copying old config');
  await sshConnection.exec('sh', ['-c', `cp ${configPath} ${oldConfigPath}`]);

  const oldConfigText = await sshConnection.exec('sh', [
    '-c',
    `cat ${oldConfigPath}`,
  ]);
  const oldConfigParsed = parse(oldConfigText);
  const oldConfig = remoteConfigSchema.parse(oldConfigParsed);

  log('old config', oldConfig);

  const newConfig = remoteConfigGen2Schema.parse({
    version: '2',
    env: oldConfig.env,
    files: oldConfig.files,
    remoteUrl: '',
    didGenerateIdRsa: false,
  });
  log('new config stub', newConfig);

  const repoDirExists = await sshConnection.exec('sh', [
    '-c',
    `test -d ${repoDirPath} && echo $? || echo $?`,
  ]);
  if (repoDirExists.trim() !== '0') {
    console.error(chalk.red(`repo dir ${repoDirPath} does not exist`));
    await elegantExit(1);
  }

  const repoUrl = await sshConnection.exec(
    'sh',
    ['-c', `git config --get remote.origin.url`],
    { cwd: repoDirPath },
  );

  log('repo url', repoUrl);

  newConfig.remoteUrl = repoUrl;

  const rudaYmlExists = await sshConnection.exec('sh', [
    '-c',
    `test -f ${rudaYmlPath} && echo $? || echo $?`,
  ]);
  if (rudaYmlExists.trim() !== '0') {
    console.warn(
      chalk.yellow(commandNames.migrate),
      `.ruda.yml does not exist in repo, skipping getting static envs`,
    );
  } else {
    const rudaYmlText = await sshConnection.exec('sh', [
      '-c',
      `cat ${rudaYmlPath}`,
    ]);

    log('ruda yml', rudaYmlText);

    const rudaYmlParsed = parse(rudaYmlText);
    const rudaYml = rudaYmlSchema.parse(rudaYmlParsed);

    const maybeEnv = rudaYml.envs[name];
    if (!maybeEnv) {
      console.error(chalk.red(`env ${name} does not exist in .ruda.yml`));
      await elegantExit(1);
    }

    const newEnvs = { ...maybeEnv.env, ...newConfig.env };

    log('.ruda.yml envs combined with env config envs', newEnvs);
    newConfig.env = newEnvs;
  }

  if (!oldConfig.idRsaPath) {
    console.warn(
      chalk.yellow(commandNames.migrate),
      'no id_rsa path, skipping generating pubkey and copying id_rsa to static path',
    );
  } else {
    log('getting id_rsa pubkey');
    const idRsaPubkey = await sshConnection.exec('sh', [
      '-c',
      `ssh-keygen -y -f ${oldConfig.idRsaPath}`,
    ]);
    log(idRsaPubkey);

    const idRsaExistsAtStaticPath = await sshConnection.exec('sh', [
      '-c',
      `test -f ${envPath}/id_rsa && echo $? || echo $?`,
    ]);
    if (idRsaExistsAtStaticPath.trim() === '0') {
      log(`id_rsa file already exists at ${envPath}/id_rsa`);
    } else {
      log('copying id_rsa to static path');
      await sshConnection.exec('sh', [
        '-c',
        `cp ${oldConfig.idRsaPath} ${envPath}/id_rsa`,
      ]);
    }
  }

  log('writing new config');
  log(newConfig);
  const newConfigEncoded = encodeTransport(stringify(newConfig));
  await sshConnection.exec('sh', [
    '-c',
    `echo ${newConfigEncoded} | base64 -d > ${configPath}`,
  ]);

  log('done');
}

/** @param {any[]} args */
function log(...args) {
  console.log(chalk.blue(commandNames.migrate), ...args);
}
