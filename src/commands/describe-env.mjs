/** @import {Command} from "commander" */

import { getCommandContextWithEnv } from '../lib/get-command-context.mjs';

/** @this {Command} */
export async function describeEnv() {
  const name = this.args[0];

  const { remoteConfig } = await getCommandContextWithEnv({
    envName: name,
  });

  console.log(remoteConfig);
}
