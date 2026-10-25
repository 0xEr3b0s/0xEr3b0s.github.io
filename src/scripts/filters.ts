// DOM glue for the project index filters. Delegated, so it works on cloned nodes.
import { findAll } from './dom';
import { ALL, matches, nextValue, summaryText, type Selection } from './filter';

function pressedValue(root: HTMLElement, group: string): string {
	const on = findAll<HTMLElement>(root, `[data-filter="${group}"][aria-pressed="true"]`)[0];
	return on?.dataset.filterValue ?? ALL;
}

function setPressed(root: HTMLElement, button: HTMLElement): void {
	const group = button.dataset.filter ?? '';
	const value = nextValue(pressedValue(root, group), button.dataset.filterValue ?? ALL);
	findAll<HTMLElement>(root, `[data-filter="${group}"]`).forEach((b) => {
		b.setAttribute('aria-pressed', String(b.dataset.filterValue === value));
	});
}

function updateGroups(root: HTMLElement): void {
	findAll<HTMLElement>(root, '.ex-group').forEach((g) => {
		const visible = findAll<HTMLElement>(g, 'li:not([hidden])').length;
		g.hidden = visible === 0;
		const count = g.querySelector('.ex-count');
		if (count) count.textContent = `(${visible})`;
	});
}

function announce(live: Element, text: string): void {
	live.textContent = '';
	setTimeout(() => {
		live.textContent = text;
	}, 50);
}

function updateSummary(root: HTMLElement, shown: number, total: number, sel: Selection): void {
	const text = summaryText(shown, total, sel);
	const visible = root.querySelector('.ex-total');
	if (visible) visible.textContent = text;
	const live = root.querySelector('.ex-result');
	if (live) announce(live, text);
	const empty = root.querySelector<HTMLElement>('.ex-empty');
	if (empty) empty.hidden = shown !== 0;
}

export function applyFilters(root: HTMLElement): void {
	const sel = { status: pressedValue(root, 'status'), access: pressedValue(root, 'access') };
	const rows = findAll<HTMLElement>(root, '[data-status][data-access]');
	let shown = 0;
	rows.forEach((row) => {
		const show = matches({ status: row.dataset.status ?? '', access: row.dataset.access ?? '' }, sel);
		const item = row.closest('li');
		if (item) item.hidden = !show;
		if (show) shown += 1;
	});
	updateGroups(root);
	updateSummary(root, shown, rows.length, sel);
}

function onClick(e: MouseEvent): void {
	if (!(e.target instanceof Element)) return;
	const button = e.target.closest<HTMLElement>('[data-filter-value]');
	const root = button?.closest<HTMLElement>('.explorer');
	if (!button || !root) return;
	setPressed(root, button);
	applyFilters(root);
}

export function initFilters(): void {
	document.addEventListener('click', onClick);
}
