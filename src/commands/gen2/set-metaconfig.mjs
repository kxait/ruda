import { getMetaconfig } from '../../lib/meta/get-metaconfig.mjs';
import { writeMetaconfig } from '../../lib/meta/write-metaconfig.mjs';
import { elegantExit } from '../../lib/elegant-exit.mjs';
/** @import {Command} from "commander" */

/** @this {Command} */
export async function setMetaconfig() {
  const { metaconfigYml } = await getMetaconfig();

  if (this.args.length !== 2) {
    console.error(this.helpInformation());
    await elegantExit(1);
  }

  const [key, value] = this.args;
  switch (key) {
    case 'sshHost':
      metaconfigYml.sshHost = value;
      break;
    case 'sshUser':
      metaconfigYml.sshUser = value;
      break;
    case 'sshPort':
      metaconfigYml.sshPort = value;
      break;
    case 'sshKeyPath':
      metaconfigYml.sshKeyPath = value;
      break;
    default: {
      console.error(this.helpInformation());
      await elegantExit(1);
    }
  }

  const metaconfigYmlText = await writeMetaconfig(metaconfigYml);

  console.log(metaconfigYmlText);
}
