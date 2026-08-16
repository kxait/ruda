import z from 'zod';

export const metaconfigSchema = z.object({
  version: z.literal('1'),
  sshHost: z.string(),
  sshUser: z.string(),
  sshPort: z.string(),
  sshKeyPath: z.string(),
});
/** @typedef {z.infer<typeof metaconfigSchema>} metaconfigSchema */
