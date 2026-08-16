import z from 'zod';

export const remoteConfigSchema = z.object({
  env: z.record(z.string(), z.string()),
  files: z.record(z.string(), z.string()),
  idRsaPath: z.string().optional(),
});

/** @typedef {z.infer<typeof remoteConfigSchema>} remoteConfigSchema */
