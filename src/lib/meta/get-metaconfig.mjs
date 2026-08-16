import { readFile, stat } from 'node:fs/promises';
import { defaultMetaconfigPath } from './default-metaconfig-path.mjs';
import chalk from 'chalk';
import { parse } from 'yaml';
import { metaconfigSchema } from './metaconfig-schema.mjs';
import { elegantExit } from '../elegant-exit.mjs';
import { ok } from 'node:assert';

/**
 * @returns {Promise<{
 *   metaconfigYmlText: string;
 *   metaconfigYml: metaconfigSchema;
 * }>}
 */
export async function getMetaconfig() {
  const fileExists = await (async () => {
    try {
      const statResult = await stat(defaultMetaconfigPath);
      if (!statResult.isFile()) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  })();

  if (!fileExists) {
    console.error(
      chalk.red(
        `error: metaconfig file does not exist at ${defaultMetaconfigPath}`,
      ),
    );
    await elegantExit(1);
  }

  const metaconfigYmlContent = await readFile(defaultMetaconfigPath, 'utf8');
  const metaconfigYmlParsed = parse(metaconfigYmlContent);

  const metaconfigParseResult = metaconfigSchema.safeParse(metaconfigYmlParsed);
  if (!metaconfigParseResult.success) {
    console.error(
      chalk.red(`error: invalid metaconfig file at ${defaultMetaconfigPath}`),
    );
    await elegantExit(1);
  }

  ok(metaconfigParseResult.data);

  return {
    metaconfigYmlText: metaconfigYmlContent,
    metaconfigYml: metaconfigParseResult.data,
  };
}
