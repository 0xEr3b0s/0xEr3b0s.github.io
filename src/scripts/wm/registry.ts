// Single source of truth for managed windows.

export type WinState = 'open' | 'minimized' | 'closed';

export interface Managed {
	id: string;
	el: HTMLElement;
	state: WinState;
	placed: boolean;
	/** Element that had focus when the window was opened; refocused on close. */
	opener: HTMLElement | null;
}

const windows = new Map<string, Managed>();
let zCounter = 10;
let activeId: string | null = null;

export function getWindow(id: string): Managed | undefined {
	return windows.get(id);
}

export function allWindows(): Managed[] {
	return Array.from(windows.values());
}

export function addWindow(m: Managed): void {
	windows.set(m.id, m);
}

export function nextZ(): number {
	zCounter += 1;
	return zCounter;
}

export function getActiveId(): string | null {
	return activeId;
}

export function setActiveId(id: string | null): void {
	activeId = id;
}

export function topOpenWindow(): Managed | undefined {
	const open = allWindows().filter((m) => m.state === 'open');
	return open.sort((a, b) => zOf(b) - zOf(a))[0];
}

function zOf(m: Managed): number {
	return Number(m.el.style.getPropertyValue('--z')) || 0;
}
