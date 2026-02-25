import { build } from './commands/build.mjs';
import { deploy } from './commands/deploy.mjs';
import { init } from './commands/init.mjs';
import { program } from 'commander';
import { setAll } from './commands/set-all.mjs';
import { setFile } from './commands/set-file.mjs';
import { uploadCert } from './commands/upload-cert.mjs';
import { set } from './commands/set.mjs';
/**
 * @import {
 *   rudaYmlEnvironmentSchema,
 *   rudaYmlSchema
 * } from "./config.mjs"
 */

program.description('simple remote task runner');
program.command('init').action(init);
program
  .command('upload-cert <cert-path>')
  .action(uploadCert)
  .option('-e, --env <env-name>', 'environment name');
program
  .command('set <var-name> [value]')
  .description(
    'set a variable in the config file, if no value is provided, the variable will be removed',
  )
  .action(set)
  .option('-e, --env <env-name>', 'environment name');
program
  .command('set-all <env-file>')
  .action(setAll)
  .option('-e, --env <env-name>', 'environment name');
program
  .command('set-file <local-file> <remote-path>')
  .action(setFile)
  .option('-e, --env <env-name>', 'environment name');
program
  .command('build')
  .action(build)
  .option('-e, --env <env-name>', 'environment name');
program
  .command('deploy')
  .action(deploy)
  .option('-e, --env <env-name>', 'environment name');
program.parse();
