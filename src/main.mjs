#!/usr/bin/env node
import { init } from './commands/init.mjs';
import { program } from 'commander';
import { setAll } from './commands/set-all.mjs';
import { setFile } from './commands/set-file.mjs';
import { uploadCert } from './commands/upload-cert.mjs';
import { set } from './commands/set.mjs';
import { run } from './commands/run.mjs';

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
  .description(
    'upload all variables from a file to the remote server, the file must be in .env format',
  )
  .action(setAll)
  .option('-e, --env <env-name>', 'environment name');

program
  .command('set-file <remote-path> [local-file]')
  .description(
    'upload a file to the remote server, if no local file is provided, the file will be removed',
  )
  .action(setFile)
  .option('-e, --env <env-name>', 'environment name');

program
  .command('run')
  .argument('<target>', 'build target')
  .action(run)
  .option('-e, --env <env-name>', 'environment name')
  .option('-r, --revision <revision>', 'revision to build');

program.parse();
