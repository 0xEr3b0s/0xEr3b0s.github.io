export const site = {
	name: '0xEr3b0s',
	handle: '0xEr3b0s',
	title: '0xEr3b0s — Systems & Offensive Security',
	description:
		'Low-level and offensive-security developer. Red teaming, binary exploitation, systems programming.',
};

export const links = {
	github: 'https://github.com/0xEr3b0s',
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
	lookingFor: ['Any cybersecurity internship — red teaming focus, open to blue teaming'],
	interests: [
		'Red teaming & offensive security',
		'Binary exploitation & reverse engineering',
		'Low-level & systems programming',
		'Networking & network attacks',
		'Blue teaming (learning)',
		'Open source',
	],
	skills: {
		languages: ['C', 'C++', 'Rust', 'Go', 'Python', 'Bash'],
		tools: ['Git', 'GDB', 'Docker', 'CMake'],
		systems: ['Linux', 'Networking'],
		other: ['Offensive security'],
	},
	whoIAm: `I am 0xEr3b0s, a systems and offensive-security developer. I work close to the metal — C, C++, Rust — and I am drawn to the parts of a system most people never look at: memory, binaries, protocols, the machine underneath the abstraction. My focus is offensive security, red teaming in particular, though I stay open to blue-team work as a way to round out that understanding. I am currently looking for a cybersecurity internship, in any of these areas.`,
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

// Statuses shown in the colour legend on the /projects page, in display order.
// Each `id` must match a `.status-<id>` rule in src/styles/terminal.css, which
// gives it its colour, and one of the values allowed by the schema.
export const statusLegend = [
	{ id: 'active', label: 'active' },
	{ id: 'planned', label: 'planned' },
	{ id: 'completed', label: 'completed' },
	{ id: 'experimental', label: 'experimental' },
	{ id: 'maintained', label: 'maintained' },
	{ id: 'archived', label: 'archived' },
];
