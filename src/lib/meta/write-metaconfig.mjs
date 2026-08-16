import { writeFile } from 'node:fs/promises';
import { metaconfigSchema } from './metaconfig-schema.mjs';
import { defaultMetaconfigPath } from './default-metaconfig-path.mjs';
import { stringify } from 'yaml';

/**
 * @param {metaconfigSchema} metaconfigYml
 * @returns {Promise<string>} The metaconfig yml as a string
 */
export async function writeMetaconfig(metaconfigYml) {
  const metaconfigYmlText = stringify(metaconfigYml);
  await writeFile(defaultMetaconfigPath, metaconfigYmlText);
  return metaconfigYmlText;
}
