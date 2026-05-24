import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    lang: z.enum(['he', 'en']),
    metaTitle: z.string().max(60),
    metaDescription: z.string().max(160),
    h1: z.string(),
    subhead: z.string().optional(),
    cta: z.string().optional(),
    ctaHref: z.string().optional(),
  }),
});

export const collections = { pages };
