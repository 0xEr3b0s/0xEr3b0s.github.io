// Desktop bootstrap: registers windows and routes clicks, keys and pointers.
import { isDesktopWidth, safely } from '../dom';
import { startDrag } from './drag';
import {
	goBack, goForward, goHome, openGhIndex, openGhRepo, openIndex, openProject, pageIdFromHash, openPageId, refreshPage, submitAddress,
} from './browser';
import { getWindow, type Managed } from './registry';
import {
	activateFromTaskbar, clampAll, closeWindow, focusWindow, minimizeWindow,
	openWindow, toggleMaximize,
} from './windows';

const WINDOW_ACTIONS: Record<string, (m: Managed) => void> = {
	close: closeWindow,
	minimize: minimizeWindow,
	maximize: toggleMaximize,
};

const IE_ACTIONS: Record<string, () => void> = {
	'ie-back': goBack,
	'ie-forward': goForward,
	'ie-refresh': refreshPage,
	'ie-home': goHome,
};

function windowOf(target: Element): Managed | undefined {
	const id = target.closest<HTMLElement>('[data-window]')?.dataset.window;
	return id ? getWindow(id) : undefined;
}

function isPlainClick(e: MouseEvent): boolean {
	return e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
}

function runAction(target: Element): boolean {
	const name = target.closest<HTMLElement>('[data-action]')?.dataset.action ?? '';
	const m = windowOf(target);
	if (m && WINDOW_ACTIONS[name]) WINDOW_ACTIONS[name](m);
	else if (IE_ACTIONS[name]) IE_ACTIONS[name]();
	else return false;
	return true;
}

function runOpen(target: Element, e: MouseEvent): boolean {
	const link = target.closest<HTMLElement>('[data-project], [data-open], [data-gh-repo], [data-gh-index]');
	if (!link || !isPlainClick(e)) return false;
	if (link.dataset.project) openProject(link.dataset.project);
	else if (link.dataset.ghRepo) openGhRepo(link.dataset.ghRepo);
	else if (link.hasAttribute('data-gh-index') || link.dataset.open === 'github') openGhIndex();
	else if (link.dataset.open === 'projects') openIndex();
	else if (link.dataset.open) openWindow(link.dataset.open);
	else return false;
	return true;
}

function onClick(e: MouseEvent): void {
	if (!(e.target instanceof Element)) return;
	const task = e.target.closest<HTMLElement>('[data-task-window]');
	const taskWin = task?.dataset.taskWindow ? getWindow(task.dataset.taskWindow) : undefined;
	if (taskWin) return activateFromTaskbar(taskWin);
	if (runAction(e.target) || runOpen(e.target, e)) e.preventDefault();
}

function onKeydown(e: KeyboardEvent): void {
	if (e.key !== 'Escape' || e.defaultPrevented || !(e.target instanceof Element)) return;
	if (e.target.closest('input, textarea')) return;
	const m = windowOf(e.target);
	if (m) closeWindow(m);
}

function onPointerDown(e: PointerEvent): void {
	if (!(e.target instanceof Element)) return;
	const m = windowOf(e.target);
	if (!m) return;
	focusWindow(m, false);
	const bar = e.target.closest<HTMLElement>('.xp-titlebar');
	if (bar && !e.target.closest('button')) startDrag(e, m.el, bar);
}

function onSubmit(e: Event): void {
	if (!(e.target instanceof HTMLFormElement) || !e.target.matches('[data-ie-form]')) return;
	e.preventDefault();
	submitAddress(e.target);
}

function onDoubleClick(e: MouseEvent): void {
	if (!(e.target instanceof Element) || e.target.closest('button')) return;
	const bar = e.target.closest('.xp-titlebar');
	const m = bar ? windowOf(bar) : undefined;
	if (m && isDesktopWidth()) toggleMaximize(m);
}

function openFromHash(): void {
	const id = pageIdFromHash(window.location.hash);
	if (id) openPageId(id);
}

export function initDesktop(): void {
	if (!document.getElementById('desktop')) return;
	document.addEventListener('click', onClick);
	document.addEventListener('dblclick', onDoubleClick);
	document.addEventListener('keydown', onKeydown);
	document.addEventListener('pointerdown', onPointerDown);
	document.addEventListener('submit', onSubmit);
	window.addEventListener('resize', () => safely(clampAll));
	window.addEventListener('hashchange', () => safely(openFromHash));
	openFromHash();
}
