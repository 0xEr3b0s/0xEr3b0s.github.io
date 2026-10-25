// Pure helpers for the in-site GitHub pages: history ids, hashes, addresses, allowlist.
import { cleanToken } from '../dom.ts';

/** History id of the GitHub index. Contains ':' so it can never clash with a project token. */
export const GH_INDEX = 'gh:';

export type GhTarget = { kind: 'gh-index' } | { kind: 'gh-repo'; name: string } | { kind: 'unknown' };

export function ghRepoId(name: string): string {
	return `gh:${name}`;
}

/** The repo name behind a history id, or null for the index and non-GitHub ids. */
export function repoOfId(id: string): string | null {
	return id.startsWith('gh:') && id.length > 3 ? id.slice(3) : null;
}

export function isGhId(id: string): boolean {
	return id.startsWith('gh:');
}

/** Exact, case-insensitive match against the build-time snapshot; returns the canonical name. */
export function allowRepo(raw: string, allowed: readonly string[]): string | null {
	const wanted = raw.trim().toLowerCase();
	if (wanted === '') return null;
	return allowed.find((n) => n.toLowerCase() === wanted) ?? null;
}

export function hashFor(id: string): string {
	if (id === GH_INDEX) return 'gh';
	const repo = repoOfId(id);
	return repo ? `gh/${repo}` : id;
}

/** Page id for a location hash, or null. Only allowlisted repos and known projects resolve. */
export function pageFromHash(
	raw: string,
	allowed: readonly string[],
	isProject: (id: string) => boolean,
): string | null {
	const h = raw.replace(/^#/, '');
	if (h === 'gh') return GH_INDEX;
	if (h.startsWith('gh/')) {
		const name = allowRepo(h.slice(3), allowed);
		return name ? ghRepoId(name) : null;
	}
	const token = cleanToken(h);
	return token !== '' && isProject(token) ? token : null;
}

function segmentsOf(raw: string): { host: boolean; segs: string[] } | null {
	const clean = (raw.split(/[?#]/)[0] ?? '').trim();
	const hostForm = /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:www\.)?github\.com(\/.*)?$/i.exec(clean);
	if (hostForm) return { host: true, segs: (hostForm[1] ?? '').split('/').filter(Boolean) };
	const pathForm = /^\/?github(\/.*)?$/i.exec(clean);
	return pathForm ? { host: false, segs: (pathForm[1] ?? '').split('/').filter(Boolean) } : null;
}

/** Parse a GitHub-looking address; null means "not a GitHub address". */
export function parseGhAddress(raw: string, allowed: readonly string[], login: string): GhTarget | null {
	const parsed = segmentsOf(raw);
	if (!parsed) return null;
	const [first, repo] = parsed.host ? parsed.segs : ['', ...parsed.segs];
	if (parsed.host && first && first.toLowerCase() !== login.toLowerCase()) return { kind: 'unknown' };
	if (!repo) return { kind: 'gh-index' };
	const name = allowRepo(repo, allowed);
	return name ? { kind: 'gh-repo', name } : { kind: 'unknown' };
}
