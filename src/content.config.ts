import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		status: z.enum(['active', 'maintained', 'experimental', 'completed', 'archived']),
		year: z.number(),
		featured: z.boolean().default(false),
		order: z.number().default(0),
		technologies: z.array(z.string()).default([]),
		github: z.string().default(''),
		demo: z.string().default(''),
		documentation: z.string().default(''),
		image: z.string().default(''),
		problem: z.string().default(''),
		solution: z.string().default(''),
	}),
});

export const collections = { projects };
