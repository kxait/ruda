import z from 'zod';

export const remoteConfigSchema = z.object({
  env: z.record(z.string(), z.string()),
  files: z.record(z.string(), z.string()),
});

/** @typedef {z.infer<typeof remoteConfigSchema>} RemoteConfig */
