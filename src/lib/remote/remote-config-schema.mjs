import z from 'zod';

export const remoteConfigSchema = z.object({
  version: z.literal('2'),
  env: z.record(z.string(), z.string()),
  files: z.record(z.string(), z.string()),
  remoteUrl: z.string(),
  didGenerateIdRsa: z.boolean(),
});

/** @typedef {z.infer<typeof remoteConfigSchema>} remoteConfigSchema */
