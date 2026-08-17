import { stat, writeFile } from 'node:fs/promises';
import { defaultMetaconfigPath } from '../../lib/meta/default-metaconfig-path.mjs';
import chalk from 'chalk';
import { stringify } from 'yaml';
import { defaultMetaconfigData } from '../../lib/meta/default-metaconfig-data.mjs';
import { elegantExit } from '../../lib/elegant-exit.mjs';
/** @import {Command} from "commander" */

/** @this {Command} */
export async function initMetaconfig() {
  try {
    const statResult = await stat(defaultMetaconfigPath);
    if (statResult.isFile()) {
      console.error(
        chalk.red(
          `error: metaconfig file already exists at ${defaultMetaconfigPath}`,
        ),
      );
      await elegantExit(1);
    }
  } catch (e) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      e.code !== 'ENOENT'
    ) {
      console.error(
        chalk.red(
          `error: could not stat metaconfig file at ${defaultMetaconfigPath}`,
        ),
      );
      await elegantExit(1);
    }
  }

  const metaconfigData = { ...defaultMetaconfigData };

  if (this.opts().sshHost) {
    metaconfigData.sshHost = this.opts().sshHost;
  }
  if (this.opts().sshUser) {
    metaconfigData.sshUser = this.opts().sshUser;
  }
  if (this.opts().sshPort) {
    metaconfigData.sshPort = this.opts().sshPort;
  }

  const metaconfigYml = stringify(metaconfigData);
  await writeFile(defaultMetaconfigPath, metaconfigYml);

  console.log(metaconfigYml);
}
