// Pure project-filter logic. No imports: unit-tested under node:test.

export type StatusBucket = 'in-progress' | 'completed' | 'planned';
export type Access = 'public' | 'private';

export interface RowFacts {
	status: string;
	access: string;
}

export interface Selection {
	status: string;
	access: string;
}

export const ALL = 'all';

const BUCKETS: Record<string, StatusBucket> = {
	active: 'in-progress',
	maintained: 'in-progress',
	experimental: 'in-progress',
	completed: 'completed',
	archived: 'planned',
	planned: 'planned',
};

/** Every project status lands in exactly one chip; archived is not finished work, so it is not "completed". Unknown statuses count as in progress. */
export function statusBucket(status: string): StatusBucket {
	return BUCKETS[status] ?? 'in-progress';
}

export function accessOf(github: string): Access {
	return github.trim().length > 0 ? 'public' : 'private';
}

/** A row shows when it matches the selected status AND the selected access. */
export function matches(row: RowFacts, sel: Selection): boolean {
	const statusOk = sel.status === ALL || sel.status === row.status;
	const accessOk = sel.access === ALL || sel.access === row.access;
	return statusOk && accessOk;
}

const LABELS: Record<string, string> = {
	'in-progress': 'In progress',
	completed: 'Completed',
	planned: 'Planned',
	public: 'Public',
	private: 'Private',
};

/** Clicking the selected value chip again returns that group to All. */
export function nextValue(selected: string, clicked: string): string {
	return selected === clicked ? ALL : clicked;
}

/** Visible and announced result line; names the active filters so it differs when they change. */
export function summaryText(shown: number, total: number, sel: Selection): string {
	const base = `Showing ${shown} of ${total} projects`;
	const active = [sel.status, sel.access].filter((v) => v !== ALL).map((v) => LABELS[v] ?? v);
	return active.length > 0 ? `${base} - ${active.join(', ')}` : base;
}
