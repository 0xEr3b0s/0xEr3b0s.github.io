export const site = {
	name: 'nirmata',
	// Display name only; anything that talks to GitHub uses githubLogin.
	handle: 'nirmata',
	// GitHub account the build fetches repos from ("nirmata" is taken on GitHub).
	githubLogin: '0xnirmata',
	title: 'nirmata — Systems & Offensive Security',
	description:
		'Low-level and offensive-security developer. Red teaming, binary exploitation, systems programming.',
};

export const links = {
	github: 'https://github.com/0xnirmata',
	// Fill in later: once set, the Contact section shows it as a mailto link
	// instead of the "à compléter" placeholder.
	email: '',
};

export const profile = {
	shortIntro: 'Systems & offensive-security developer — low-level, from the metal up.',
	location: 'Paris, France',
	currentStatus:
		'Seeking a cybersecurity internship — red teaming focus, open to blue team work too.',
	focus: [
		'Red teaming & offensive security',
		'Low-level / systems programming',
		'Network attacks & tooling',
	],
	currentlyLearning: [
		'Advanced binary exploitation (RainFall)',
		'Blue teaming fundamentals',
		'Rust for security tooling',
	],
	skills: {
		languages: ['C', 'C++', 'Rust', 'Go', 'Python', 'Bash'],
		tools: ['Git', 'GDB', 'Docker', 'CMake'],
		systems: ['Linux', 'Networking'],
	},
	whoIAm: `I work close to the metal, in C, C++ and Rust, drawn to the parts of a system most people never look at: memory, binaries, protocols, the machine underneath the abstraction. Most of what I build starts by taking something apart to understand how it really works.`,
};

export const nav = [
	{ label: 'PROJECTS', href: '/projects' },
	{ label: 'ABOUT', href: '/about' },
	{ label: 'GITHUB', href: links.github, external: true },
];

// Project categories, in display order. The `id` must match the `category`
// field in a project's front-matter (see src/content.config.ts). To add,
// rename or reorder a section on the /projects page, edit this list only.
export const categories = [
	{ id: 'offensive', label: 'Offensive security' },
	{ id: 'network', label: 'Network' },
	{ id: 'systems', label: 'Systems' },
	{ id: 'kernel', label: 'Kernel' },
	{ id: 'infra', label: 'Infrastructure' },
];

// Status buckets shown in the legend, in display order. Every project status
// maps to one of these via statusBucket() in src/scripts/filter.ts; each `id`
// matches a `.status-<id>` rule in src/styles/xp.css that gives it its colour.
export const statusLegend = [
	{ id: 'in-progress', label: 'in progress' },
	{ id: 'completed', label: 'completed' },
	{ id: 'planned', label: 'planned' },
];
