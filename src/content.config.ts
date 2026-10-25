import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// An http(s) URL or the empty-string default. Blocks a javascript: (or other
// scheme) href slipping into a project link through front-matter.
const httpUrlOrEmpty = z
	.string()
	.refine((u) => u === '' || /^https?:\/\//i.test(u), 'must be an http(s) URL')
	.default('');

// A root-relative asset path (e.g. /img/x.png), an http(s) URL, or empty. Keeps
// a stray scheme out of an image src if the field is ever rendered.
const assetPathOrEmpty = z
	.string()
	.refine((u) => u === '' || /^\//.test(u) || /^https?:\/\//i.test(u), 'must be a path or http(s) URL')
	.default('');

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		status: z.enum(['active', 'planned', 'maintained', 'experimental', 'completed', 'archived']),
		year: z.number(),
		category: z.enum(['offensive', 'network', 'systems', 'kernel', 'infra']).default('systems'),
		featured: z.boolean().default(false),
		order: z.number().default(0),
		technologies: z.array(z.string()).default([]),
		github: httpUrlOrEmpty,
		demo: httpUrlOrEmpty,
		documentation: httpUrlOrEmpty,
		image: assetPathOrEmpty,
		problem: z.string().default(''),
		solution: z.string().default(''),
	}),
});

export const collections = { projects };
