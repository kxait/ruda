import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';
import { parse } from 'yaml';
import z from 'zod';

import { config } from 'dotenv';
import chalk from 'chalk';
config();

const rudaYmlEnvironmentSchema = z.object({
  repo_url: z.string(),
  ssh_host: z.string(),
  ssh_user: z.string(),
  ssh_key_path: z.string(),
  env: z.record(z.string(), z.string()).optional(),
  files: z.array(z.string()).optional(),
});

const rudaYmlSchema = z.object({
  envs: z
    .record(z.string(), rudaYmlEnvironmentSchema)
    .refine(
      (d) => Object.keys(d).length > 0,
      'must have at least one environment',
    ),
});

const DefaultRudaYmlPath = './.ruda.yml';
/**
 * @typedef {z.infer<typeof rudaYmlEnvironmentSchema> & { name: string }} RudaYmlResultEnv
 *
 *
 * @typedef {{
 *   envs: Record<string, RudaYmlResultEnv>;
 *   hasOneEnv: boolean;
 * }} RudaYmlResult
 */

/** @returns {Promise<RudaYmlResult>} */
export async function readRudaYml() {
  const p = process.env.RUDA_YML || DefaultRudaYmlPath;

  const pp = path.join(cwd(), p);

  if (!(await stat(pp)).isFile()) {
    console.error('no .ruda.yml file found or was not file');
    process.exit(1);
  }
  try {
    const rudaYmlContent = await readFile(pp, 'utf8');
    const rudaYmlParsed = parse(rudaYmlContent);
    const rudaYml = rudaYmlSchema.parse(rudaYmlParsed);
    /** @type {RudaYmlResult} */
    return {
      envs: Object.fromEntries(
        Object.entries(rudaYml.envs).map(([k, v]) => [
          k,
          {
            repo_url: unwrapEnvValue(v.repo_url) ?? '',
            ssh_host: unwrapEnvValue(v.ssh_host) ?? '',
            ssh_user: unwrapEnvValue(v.ssh_user) ?? '',
            ssh_key_path: unwrapEnvValue(v.ssh_key_path) ?? '',
            env: Object.fromEntries(
              Object.entries(v.env ?? {}).map(([k, v]) => [
                k,
                unwrapEnvValue(v) ?? '',
              ]),
            ),
            files: v.files?.map((f) => unwrapEnvValue(f) ?? '') ?? [],
            name: k,
          },
        ]),
      ),
      hasOneEnv: Object.keys(rudaYml.envs).length === 1,
    };
  } catch (error) {
    console.error('could not read or parse .ruda.yml file');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Unwraps env vars in the form $VAR_NAME
 *
 * @param {string} value
 * @returns {string | undefined}
 */
function unwrapEnvValue(value) {
  if (value.startsWith('$')) {
    const v = process.env[value.slice(1)];
    if (!v) {
      console.warn(chalk.yellow(`warn: env var ${value} not found`));
    }
    return v;
  }
  return value;
}
