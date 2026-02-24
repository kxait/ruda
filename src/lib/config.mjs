import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';
import { parse } from 'yaml';
import z from 'zod';

export const rudaYmlEnvironmentSchema = z.object({
  hostname: z.string(),
  username: z.string(),
  keyPath: z.string(),
  repo: z.string(),
})

export const rudaYmlSchema = z.object({
  environments: z.record(z.string(), rudaYmlEnvironmentSchema)
})

export const DefaultRudaYmlPath = './.ruda.yml'
/**
  * @returns {Promise<z.infer<typeof rudaYmlSchema>>}
  */
export async function readRudaYml() {
  const p = process.env.RUDA_YML || DefaultRudaYmlPath

  const pp = path.join(cwd(), p)


  if (!(await stat(pp)).isFile()) {
    console.error('no .ruda.yml file found or was not file')
    process.exit(1)
  }
  try {
    const rudaYmlContent = await readFile(pp, 'utf8')
    const rudaYmlParsed = parse(rudaYmlContent)
    const rudaYml = rudaYmlSchema.parse(rudaYmlParsed)
    return rudaYml
  } catch (error) {
    console.error('could not read or parse .ruda.yml file')
    console.error(error)
    process.exit(1)
  }
}
