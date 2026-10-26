// Internet Explorer window: one instance, in-window history of opened projects.
import { cleanToken, find, findAll, safely } from '../dom';
import { initReplays } from '../replay';
import { parseAddress } from './address';
import { ghIndexTemplate, ghLogin, loadRepo, repoAllowlist } from './github';
import { allowRepo, GH_INDEX, ghRepoId, hashFor, pageFromHash, parseGhAddress, repoOfId } from './pages';
import { canGoBack, canGoForward, current, emptyNav, INDEX, step, visit, type Nav } from './history';
import { getWindow, type Managed } from './registry';
import { setTaskLabel } from './taskbar';
import { ensureWindow, focusWindow, openWindow } from './windows';

const IE_ID = 'ie';
let nav: Nav = emptyNav();

function templateFor(id: string): HTMLTemplateElement | null {
	const all = findAll<HTMLTemplateElement>(document, 'template[data-project]');
	return all.find((t) => t.dataset.project === id) ?? null;
}

interface Page {
	/** Static content to clone; null when the page is loaded lazily (GitHub repo). */
	tpl: HTMLTemplateElement | null;
	title: string;
	address: string;
	repo?: string;
}

function ghPage(id: string): Page | null {
	const repo = repoOfId(id);
	if (repo) {
		const name = allowRepo(repo, repoAllowlist());
		const address = `https://github.com/${ghLogin()}/${name ?? ''}`;
		return name ? { tpl: null, title: name, address, repo: name } : null;
	}
	const tpl = ghIndexTemplate();
	return tpl ? { tpl, title: 'GitHub', address: `https://github.com/${ghLogin()}` } : null;
}

function pageFor(id: string): Page | null {
	if (id === GH_INDEX || repoOfId(id)) return ghPage(id);
	if (id === INDEX) {
		const tpl = document.getElementById('tpl-index');
		return tpl instanceof HTMLTemplateElement
			? { tpl, title: 'Projects', address: 'http://0xer3b0s/projects' }
			: null;
	}
	const tpl = templateFor(id);
	return tpl ? { tpl, title: tpl.dataset.title ?? id, address: `http://0xer3b0s/projects/${id}` } : null;
}

export function hasProject(id: string): boolean {
	return templateFor(id) !== null;
}

function setDisabled(ie: HTMLElement, action: string, disabled: boolean): void {
	const button = find<HTMLButtonElement>(ie, `[data-action="${action}"]`);
	if (button) button.disabled = disabled;
}

function syncToolbar(ie: HTMLElement): void {
	setDisabled(ie, 'ie-back', !canGoBack(nav));
	setDisabled(ie, 'ie-forward', !canGoForward(nav));
}

function syncAddress(ie: HTMLElement, address: string): void {
	const input = find<HTMLInputElement>(ie, '.ie-address-input');
	if (input) input.value = address;
}

// Title span (the dialog's accessible name), taskbar label and a polite announcement.
function syncNames(m: Managed, title: string, say: boolean): void {
	const name = `Internet Explorer - ${title}`;
	m.el.dataset.label = name;
	setTaskLabel(m);
	const span = find<HTMLElement>(m.el, '.xp-title');
	if (span) span.textContent = name;
	syncControls(m.el, name);
	if (say) announce(m.el, name);
}

function syncHash(id: string): void {
	try {
		const url = id === INDEX ? window.location.pathname + window.location.search : `#${hashFor(id)}`;
		window.history.replaceState(null, '', url);
	} catch {
		// hash update is a nicety; ignore failures
	}
}

function syncControls(win: HTMLElement, name: string): void {
	const verbs: Record<string, string> = { minimize: 'Minimize', maximize: 'Maximize', close: 'Close' };
	findAll<HTMLElement>(win, '.xp-controls [data-action]').forEach((b) => {
		const verb = verbs[b.dataset.action ?? ''];
		if (verb) b.setAttribute('aria-label', `${verb} ${name}`);
	});
}

// Clear first, then set on the next frame, so repeating the same text is still announced.
function announce(win: HTMLElement, text: string): void {
	const status = find<HTMLElement>(win, '.ie-status');
	if (!status) return;
	status.textContent = '';
	setTimeout(() => {
		status.textContent = text;
	}, 50);
}

function renderBody(m: Managed, id: string, page: Page, body: HTMLElement): void {
	body.removeAttribute('aria-busy');
	if (page.tpl) {
		body.replaceChildren(page.tpl.content.cloneNode(true));
		safely(() => initReplays(body));
		return;
	}
	if (!page.repo) return;
	const stillCurrent = () => current(nav) === id;
	void loadRepo(body, page.repo, stillCurrent, (msg) => announce(m.el, msg));
}

function showCurrent(m: Managed): void {
	const id = current(nav);
	const page = id ? pageFor(id) : null;
	const body = find<HTMLElement>(m.el, '.ie-body');
	if (!id || !page || !body) return;
	renderBody(m, id, page, body);
	body.scrollTop = 0;
	syncAddress(m.el, page.address);
	syncToolbar(m.el);
	syncNames(m, page.title, !page.repo);
	syncHash(id);
}

function focusBody(m: Managed): void {
	find<HTMLElement>(m.el, '.ie-body')?.focus({ preventScroll: true });
}

export function openPageId(id: string): void {
	openPage(id);
}

function openPage(id: string): void {
	const m = ensureWindow(IE_ID);
	if (!m) return;
	const wasOpen = m.state === 'open';
	if (id !== INDEX && current(nav) === null) nav = visit(nav, INDEX);
	nav = visit(nav, id);
	showCurrent(m);
	if (!wasOpen) return void openWindow(IE_ID);
	focusWindow(m, false);
	focusBody(m);
}

export function openProject(raw: string): void {
	const id = cleanToken(raw);
	if (hasProject(id)) openPage(id);
}

export function openGhIndex(): void {
	if (ghIndexTemplate()) openPage(GH_INDEX);
}

export function openGhRepo(raw: string): void {
	const name = allowRepo(raw, repoAllowlist());
	if (name) openPage(ghRepoId(name));
}

/** Resolve a location hash to a page id (projects and GitHub), or null. */
export function pageIdFromHash(hash: string): string | null {
	return pageFromHash(hash, repoAllowlist(), hasProject);
}

export function openIndex(): void {
	openPage(INDEX);
}

function move(delta: number): void {
	const m = getWindow(IE_ID);
	const next = step(nav, delta);
	if (!m || next === nav) return;
	nav = next;
	showCurrent(m);
	focusBody(m);
}

export function goBack(): void {
	move(-1);
}

export function goForward(): void {
	move(1);
}

export function refreshPage(): void {
	const m = getWindow(IE_ID);
	if (!m) return;
	showCurrent(m);
	focusBody(m);
}

export function goHome(): void {
	openIndex();
}

function openGhTarget(m: Managed | undefined, target: ReturnType<typeof parseGhAddress>): void {
	if (target?.kind === 'gh-index') openGhIndex();
	else if (target?.kind === 'gh-repo') openGhRepo(target.name);
	else if (m) announce(m.el, 'Page not found');
}

export function submitAddress(form: HTMLFormElement): void {
	const input = find<HTMLInputElement>(form, '.ie-address-input');
	const raw = input?.value ?? '';
	const gh = parseGhAddress(raw, repoAllowlist(), ghLogin());
	if (gh) return openGhTarget(getWindow(IE_ID), gh);
	const target = parseAddress(raw, hasProject);
	if (target.kind === 'index') return openIndex();
	if (target.kind === 'project') return openProject(target.id);
	const m = getWindow(IE_ID);
	if (m) announce(m.el, 'Page not found');
}
