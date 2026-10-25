// Copy-to-clipboard buttons (data-copy). The result is announced via a polite live region.
import { safely } from './dom';

const RESTORE_MS = 1500;
const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
let live: HTMLElement | null = null;

function liveRegion(): HTMLElement {
	if (live) return live;
	live = document.createElement('p');
	live.className = 'sr-only';
	live.setAttribute('role', 'status');
	document.body.append(live);
	return live;
}

function show(button: HTMLElement, text: string): void {
	button.dataset.label ??= button.textContent ?? '';
	button.textContent = text;
	const region = liveRegion();
	region.textContent = '';
	setTimeout(() => {
		region.textContent = text;
	}, 50);
	clearTimeout(timers.get(button));
	timers.set(button, setTimeout(() => {
		button.textContent = button.dataset.label ?? '';
	}, RESTORE_MS));
}

async function copyText(button: HTMLElement, text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
		show(button, 'Copied');
	} catch {
		show(button, 'Copy failed');
	}
}

export function initCopy(): void {
	document.addEventListener('click', (e) => {
		const button = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-copy]') : null;
		const text = button?.dataset.copy;
		if (button && text) safely(() => void copyText(button, text));
	});
}
