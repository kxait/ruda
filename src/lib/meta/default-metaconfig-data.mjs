import { metaconfigSchema } from './metaconfig-schema.mjs';

export const defaultMetaconfigData = metaconfigSchema.parse({
  version: '1',
  sshHost: '',
  sshUser: '',
  sshPort: '',
  sshKeyPath: '',
});
