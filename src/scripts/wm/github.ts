// DOM side of the in-site GitHub view: allowlist, index template, lazy README loading.
import { find } from '../dom';
import { demotedLevel } from '../ghformat';

function indexTemplate(): HTMLTemplateElement | null {
	const tpl = document.getElementById('tpl-gh-index');
	return tpl instanceof HTMLTemplateElement ? tpl : null;
}

export function ghIndexTemplate(): HTMLTemplateElement | null {
	return indexTemplate();
}

/** Repo names baked into the page at build time. The only names that may ever be fetched. */
export function repoAllowlist(): string[] {
	const raw = indexTemplate()?.dataset.repos ?? '';
	return raw.split(',').filter((n) => n !== '');
}

export function ghLogin(): string {
	return indexTemplate()?.dataset.login ?? '';
}

function note(text: string, live = false): HTMLElement {
	const p = document.createElement('p');
	p.className = 'gh-note';
	if (live) p.setAttribute('role', 'status');
	p.textContent = text;
	return p;
}

function errorView(name: string): HTMLElement {
	const box = note(`Could not load ${name}. `);
	const a = document.createElement('a');
	a.href = `https://github.com/${encodeURIComponent(ghLogin())}/${encodeURIComponent(name)}`;
	a.target = '_blank';
	a.rel = 'noopener noreferrer';
	a.textContent = '[open on github.com]';
	const cue = document.createElement('span');
	cue.className = 'sr-only';
	cue.textContent = ' (opens in new tab)';
	a.append(cue);
	box.append(a);
	return box;
}

// One fetch per repo: concurrent and repeat visits share the parsed source nodes.
const sources = new Map<string, Promise<Node[]>>();

async function fetchSource(name: string): Promise<Node[]> {
	const res = await fetch(`/github/${encodeURIComponent(name)}/`, { credentials: 'same-origin' });
	if (!res.ok) throw new Error(`status ${res.status}`);
	const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
	const src = doc.querySelector('.ie-body');
	if (!src) throw new Error('no content');
	return Array.from(src.childNodes);
}

function source(name: string): Promise<Node[]> {
	const known = sources.get(name);
	if (known) return known;
	const p = fetchSource(name);
	sources.set(name, p);
	p.catch(() => sources.delete(name));
	return p;
}

/** The injected page lives inside the window's own outline, so no h1: h1 -> h2 ... h6 stays h6. */
function demoteHeadings(root: DocumentFragment): void {
	root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
		const level = demotedLevel(Number(h.tagName.slice(1)));
		const next = document.createElement(`h${level}`);
		for (const attr of Array.from(h.attributes)) next.setAttribute(attr.name, attr.value);
		next.append(...Array.from(h.childNodes));
		h.replaceWith(next);
	});
}

async function buildContent(name: string): Promise<DocumentFragment> {
	const nodes = await source(name);
	const frag = document.createDocumentFragment();
	nodes.forEach((n) => frag.append(document.importNode(n, true)));
	demoteHeadings(frag);
	return frag;
}

/**
 * Lazy-load one repo page into `body`. `name` must already be allowlisted by the caller.
 * `stillCurrent` guards against a slow response landing after the user navigated away.
 */
export async function loadRepo(
	body: HTMLElement,
	name: string,
	stillCurrent: () => boolean,
	done: (message: string) => void,
): Promise<void> {
	body.setAttribute('aria-busy', 'true');
	body.replaceChildren(note('Loading...', true));
	try {
		const content = await buildContent(name);
		if (!stillCurrent()) return;
		body.replaceChildren(content);
		done(`Loaded ${name}`);
	} catch {
		if (!stillCurrent()) return;
		body.replaceChildren(errorView(name));
		done(`Could not load ${name}`);
	} finally {
		if (stillCurrent()) body.removeAttribute('aria-busy');
	}
}

export function bodyOf(win: HTMLElement): HTMLElement | null {
	return find<HTMLElement>(win, '.ie-body');
}
