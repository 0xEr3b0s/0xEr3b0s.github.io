// Pure in-window navigation history. No imports: unit-tested under node:test.

/** Reserved page id for the project index. Not a valid project token (contains '#'). */
export const INDEX = '#index';

export interface Nav {
	stack: readonly string[];
	index: number;
}

export function emptyNav(): Nav {
	return { stack: [], index: -1 };
}

export function current(nav: Nav): string | null {
	return nav.stack[nav.index] ?? null;
}

/** Visit `id`: drops forward entries, unless `id` is already the current page. */
export function visit(nav: Nav, id: string): Nav {
	if (current(nav) === id) return nav;
	const stack = [...nav.stack.slice(0, nav.index + 1), id];
	return { stack, index: stack.length - 1 };
}

/** Move by `delta` entries; out-of-range moves leave the history unchanged. */
export function step(nav: Nav, delta: number): Nav {
	const next = nav.index + delta;
	if (next < 0 || next >= nav.stack.length) return nav;
	return { stack: nav.stack, index: next };
}

export function canGoBack(nav: Nav): boolean {
	return nav.index > 0;
}

export function canGoForward(nav: Nav): boolean {
	return nav.index < nav.stack.length - 1;
}
