import { readRudaYml } from '../lib/config.mjs';
import { getSshConnection } from '../lib/get-ssh-connection.mjs';
import { getRemoteConfig } from '../lib/get-remote-config.mjs';
import { getSingleEnv } from '../lib/get-single-env.mjs';
import { checkEnvInitialized } from '../lib/check-env-initialized.mjs';
import { writeRemoteConfig } from '../lib/write-remote-config.mjs';
import { readFile, stat } from 'node:fs/promises';
import { ok } from 'node:assert';
import chalk from 'chalk';
/** @import {Command} from "commander" */

// perplexity
const EnvLineRe = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/;

/**
 * <env file>
 * -e, --env <env name>
 *
 * @this {Command}
 */
export async function setAll() {
  const path = this.args[0];
  const statResult = await stat(path);
  if (!statResult.isFile()) {
    console.error(chalk.red('error: file does not exist'));
    process.exit(1);
  }
  const fileContent = await readFile(path, 'utf8');

  const lines = fileContent.split('\n').filter(Boolean);
  if (lines.length === 0) {
    console.error(chalk.red('error: file is empty'));
    process.exit(1);
  }

  const linesNotMatching = lines
    .filter((l) => !l.startsWith('#'))
    .map((l, i) => ({
      i,
      result: EnvLineRe.test(l),
    }))
    .filter((l) => !l.result);

  if (Object.keys(linesNotMatching).length > 0) {
    const lineNumbers = Object.values(linesNotMatching).map((l) => l.i);
    console.error(
      chalk.red(
        `error: file contains invalid lines (${lineNumbers.join(', ')})`,
      ),
    );
    process.exit(1);
  }

  const pairs = lines
    .map((l) => {
      const result = EnvLineRe.exec(l);
      return [result?.[1], result?.[2]];
    })
    .filter((p) => p.every(Boolean));

  const yml = await readRudaYml();

  const env = getSingleEnv(this, yml);

  const sshConnection = await getSshConnection(env);

  await checkEnvInitialized(env, sshConnection);

  const config = await getRemoteConfig(env, sshConnection);

  for (const [key, value] of pairs) {
    ok(key && value, 'error: key and value must be defined');
    config.env[key] = value;
  }

  await writeRemoteConfig(env, sshConnection, config);

  sshConnection.dispose();
  console.log(chalk.blue('set-all'), 'done');
}
