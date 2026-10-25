// Window lifecycle: open, close, minimize, maximize, focus.
import { find, isDesktopWidth } from '../dom';
import {
	addWindow, allWindows, getActiveId, getWindow, nextZ, setActiveId, topOpenWindow, type Managed,
} from './registry';
import { addTaskButton, refreshTaskbar, removeTaskButton } from './taskbar';
import { applyFrame, clampWindow } from './place';
import { CASCADE_STEP } from './frames';

export function layer(): HTMLElement | null {
	return document.getElementById('windows');
}

export function registerElement(el: HTMLElement): Managed | null {
	const id = el.dataset.window;
	if (!id) return null;
	const m: Managed = { id, el, state: el.hidden ? 'closed' : 'open', placed: false, opener: null };
	addWindow(m);
	return m;
}

export function ensureWindow(id: string): Managed | null {
	const known = getWindow(id);
	if (known) return known;
	const tpl = document.getElementById(`tpl-win-${id}`);
	const host = layer();
	if (!(tpl instanceof HTMLTemplateElement) || !host) return null;
	host.append(tpl.content.cloneNode(true));
	const el = find<HTMLElement>(host, `[data-window="${id}"]`);
	return el ? registerElement(el) : null;
}

function placeOnce(m: Managed): void {
	if (m.placed) return;
	const openCount = allWindows().filter((w) => w.state !== 'closed').length;
	applyFrame(m.el, (openCount % 5) * CASCADE_STEP);
	m.placed = true;
}

export function showWindow(m: Managed): void {
	m.el.hidden = false;
	m.state = 'open';
	placeOnce(m);
	clampWindow(m.el);
	addTaskButton(m);
}

export function focusWindow(m: Managed, moveFocus = true): void {
	m.el.style.setProperty('--z', String(nextZ()));
	allWindows().forEach((w) => w.el.classList.toggle('is-active', w === m));
	setActiveId(m.id);
	refreshTaskbar();
	if (!moveFocus) return;
	m.el.focus({ preventScroll: true });
	if (!isDesktopWidth()) m.el.scrollIntoView({ block: 'start' });
}

function rememberOpener(m: Managed): HTMLElement | null {
	const active = document.activeElement;
	return active instanceof HTMLElement && !m.el.contains(active) ? active : null;
}

export function openWindow(id: string, moveFocus = true): Managed | null {
	const m = ensureWindow(id);
	if (!m) return null;
	if (m.state === 'closed') m.opener = rememberOpener(m);
	showWindow(m);
	focusWindow(m, moveFocus);
	return m;
}

function focusNext(moveFocus: boolean): void {
	const next = topOpenWindow();
	if (next) focusWindow(next, moveFocus);
	else {
		setActiveId(null);
		if (moveFocus) document.getElementById('start-button')?.focus();
	}
}

function isVisible(el: HTMLElement): boolean {
	return el.isConnected && el.getClientRects().length > 0;
}

function returnFocus(m: Managed): void {
	const opener = m.opener;
	m.opener = null;
	if (opener && isVisible(opener)) opener.focus();
	else focusNext(true);
}

export function closeWindow(m: Managed): void {
	const wasActive = getActiveId() === m.id;
	m.el.hidden = true;
	m.state = 'closed';
	m.el.classList.remove('is-max', 'is-active');
	removeTaskButton(m.id);
	if (wasActive) returnFocus(m);
	refreshTaskbar();
}

export function minimizeWindow(m: Managed, moveFocus = true): void {
	const wasActive = getActiveId() === m.id;
	m.el.hidden = true;
	m.state = 'minimized';
	m.el.classList.remove('is-active');
	if (wasActive) focusNext(moveFocus);
	refreshTaskbar();
}

export function toggleMaximize(m: Managed): void {
	if (!isDesktopWidth()) return;
	const on = m.el.classList.toggle('is-max');
	const button = find<HTMLButtonElement>(m.el, '[data-action="maximize"]');
	button?.setAttribute('aria-pressed', String(on));
	focusWindow(m);
}

export function activateFromTaskbar(m: Managed): void {
	if (m.state === 'minimized') showWindow(m);
	else if (getActiveId() === m.id) return minimizeWindow(m, false);
	focusWindow(m);
}

export function clampAll(): void {
	allWindows().forEach((m) => clampWindow(m.el));
}
