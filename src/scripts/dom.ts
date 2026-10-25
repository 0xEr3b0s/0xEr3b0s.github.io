// Small DOM helpers shared by every script module.

export function find<T extends HTMLElement>(root: ParentNode, selector: string): T | null {
	return root.querySelector<T>(selector);
}

export function findAll<T extends HTMLElement>(root: ParentNode, selector: string): T[] {
	return Array.from(root.querySelectorAll<T>(selector));
}

export function isDesktopWidth(): boolean {
	try {
		return window.matchMedia('(min-width: 701px)').matches;
	} catch {
		return true;
	}
}

export function cleanToken(raw: string): string {
	return raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export function safely(job: () => void): void {
	try {
		job();
	} catch (error) {
		console.warn('desktop script failed', error);
	}
}
