// Pure ranking of GitHub repos against the curated projects. No imports: unit-tested under node:test.

export interface RankRepo {
	slug: string;
	stars: number;
	pushedAt: string | null;
}

export interface CuratedRef {
	slug: string;
	featured: boolean;
	order: number;
}

/** "owner/name" (lower-cased) from a github.com URL, or null. */
export function slugFromUrl(url: string): string | null {
	const m = /github\.com\/([^/\s?#]+)\/([^/\s?#]+)/i.exec(url);
	if (!m || !m[1] || !m[2]) return null;
	return `${m[1]}/${m[2].replace(/\.git$/i, '')}`.toLowerCase();
}

function curatedKey(slug: string, curated: readonly CuratedRef[]): CuratedRef | undefined {
	return curated.find((c) => c.slug === slug.toLowerCase());
}

function byCurated(a: CuratedRef, b: CuratedRef): number {
	if (a.featured !== b.featured) return a.featured ? -1 : 1;
	return a.order - b.order;
}

function byActivity(a: RankRepo, b: RankRepo): number {
	if (a.stars !== b.stars) return b.stars - a.stars;
	return (b.pushedAt ?? '').localeCompare(a.pushedAt ?? '');
}

/** Curated repos first (featured, then project order), then the rest by stars, then recency. */
export function rankRepos<T extends RankRepo>(repos: readonly T[], curated: readonly CuratedRef[]): T[] {
	const hit = repos.filter((r) => curatedKey(r.slug, curated));
	const rest = repos.filter((r) => !curatedKey(r.slug, curated));
	hit.sort((a, b) => byCurated(curatedKey(a.slug, curated)!, curatedKey(b.slug, curated)!));
	return [...hit, ...rest.sort(byActivity)];
}
