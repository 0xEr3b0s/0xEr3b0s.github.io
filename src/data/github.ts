// Build-time GitHub stats for projects that link a public repo.
//
// Called from page front-matter (Astro runs this at build, in Node). It never
// throws: on a network error, a rate-limit, or a missing repo it returns what
// it has and leaves the rest absent, so the build always completes. A failed
// fetch is NOT cached, so the next build retries it. Each repo is fetched at
// most once per build (memoised), and successful results are cached on disk per
// entry for CACHE_TTL_MS so repeated local builds don't re-hit the API (the
// unauthenticated limit is 60 requests/hour). Set GITHUB_TOKEN in the
// environment (e.g. the Actions secret) to raise that limit in CI.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface RepoStat {
	/** owner/name, e.g. "0xEr3b0s/RainFall". */
	slug: string;
	/** Primary language GitHub detected, or null. */
	language: string | null;
	/** Total commit count on the default branch, or null if it couldn't be read. */
	commits: number | null;
	/** ISO date of the last push, or null. */
	lastActivity: string | null;
	/** Stargazer count, or null. */
	stars: number | null;
}

interface CacheEntry {
	at: number;
	stat: RepoStat;
}
type Cache = Record<string, CacheEntry>;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const CACHE_FILE = join(process.cwd(), '.astro', 'github-stats.json');
const API = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 8000;

// Per-build memoisation, so N concurrently-rendered pages fetch each repo once.
const inFlight = new Map<string, Promise<RepoStat>>();
let diskCache: Promise<Cache> | null = null;
let tmpSeq = 0; // keeps concurrent cache writes on distinct temp files

function headers(): Record<string, string> {
	const h: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'User-Agent': '0xEr3b0s-portfolio-build',
	};
	const token = process.env.GITHUB_TOKEN;
	if (token) h.Authorization = `Bearer ${token}`;
	return h;
}

/** Extract the "owner/name" slug from a github.com URL, or null if it isn't one.
 * The character class excludes "." runs like ".." and any "%", so the slug
 * cannot smuggle path traversal into the API request below. */
export function repoSlug(githubUrl: string): string | null {
	const m = githubUrl.match(/^https?:\/\/(www\.)?github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/i);
	if (!m) return null;
	const slug = m[2].replace(/\.git$/, '');
	return slug.includes('..') ? null : slug;
}

async function fetchJson(url: string): Promise<{ data: unknown; res: Response } | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const res = await fetch(url, { headers: headers(), signal: controller.signal });
		if (!res.ok) return null;
		return { data: await res.json(), res };
	} catch {
		return null; // offline, timeout, or bad JSON — caller renders without stats
	} finally {
		clearTimeout(timer);
	}
}

/** The `page=N` of the `rel="last"` entry in a GitHub Link header, or null when
 * the header is absent or has no last page (a single page of results). Pure. */
export function parseLastPage(linkHeader: string | null): number | null {
	if (!linkHeader) return null;
	const m = linkHeader.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
	return m ? Number(m[1]) : null;
}

/** Commit count: the last page from the Link header (one commit per page),
 * falling back to the length of a single page when there is only one. */
async function fetchCommitCount(slug: string): Promise<number | null> {
	const first = await fetchJson(`${API}/repos/${slug}/commits?per_page=1`);
	if (!first) return null;
	const fromLink = parseLastPage(first.res.headers.get('link'));
	if (fromLink !== null) return fromLink;
	return Array.isArray(first.data) ? first.data.length : null;
}

function readStringField(data: unknown, key: string): string | null {
	const value = (data as Record<string, unknown> | null)?.[key];
	return typeof value === 'string' ? value : null;
}

function readNumberField(data: unknown, key: string): number | null {
	const value = (data as Record<string, unknown> | null)?.[key];
	return typeof value === 'number' ? value : null;
}

async function fetchOne(slug: string): Promise<RepoStat> {
	const repo = await fetchJson(`${API}/repos/${slug}`);
	const commits = await fetchCommitCount(slug);
	return {
		slug,
		language: readStringField(repo?.data, 'language'),
		commits,
		lastActivity:
			readStringField(repo?.data, 'pushed_at') ?? readStringField(repo?.data, 'updated_at'),
		stars: readNumberField(repo?.data, 'stargazers_count'),
	};
}

/** A stat worth caching: at least one field actually came back. */
function hasData(stat: RepoStat): boolean {
	return stat.language !== null || stat.commits !== null || stat.stars !== null;
}

function isCacheEntry(value: unknown): value is CacheEntry {
	const entry = value as CacheEntry | null;
	return typeof entry?.at === 'number' && typeof entry?.stat?.slug === 'string';
}

async function loadDiskCache(): Promise<Cache> {
	try {
		const parsed: unknown = JSON.parse(await readFile(CACHE_FILE, 'utf8'));
		const out: Cache = {};
		for (const [url, entry] of Object.entries(parsed as Record<string, unknown>)) {
			if (isCacheEntry(entry)) out[url] = entry;
		}
		return out;
	} catch {
		return {}; // no cache yet, or unreadable — treat as empty
	}
}

function readDiskCacheOnce(): Promise<Cache> {
	if (!diskCache) diskCache = loadDiskCache();
	return diskCache;
}

/** Write the cache via a temp file + rename, so concurrent writers never leave
 * a truncated JSON file behind. */
async function persist(url: string, stat: RepoStat): Promise<void> {
	try {
		const cache = await readDiskCacheOnce();
		cache[url] = { at: Date.now(), stat };
		await mkdir(dirname(CACHE_FILE), { recursive: true });
		const tmp = `${CACHE_FILE}.${process.pid}.${tmpSeq++}.tmp`;
		await writeFile(tmp, JSON.stringify(cache), 'utf8');
		await rename(tmp, CACHE_FILE);
	} catch {
		// a read-only or failing cache write must never break the build
	}
}

function isFresh(entry: CacheEntry | undefined): entry is CacheEntry {
	return !!entry && Date.now() - entry.at < CACHE_TTL_MS;
}

async function resolveStat(url: string): Promise<RepoStat> {
	const cache = await readDiskCacheOnce();
	const cached = cache[url];
	if (isFresh(cached)) return cached.stat;
	const stat = await fetchOne(repoSlug(url)!);
	if (hasData(stat)) await persist(url, stat);
	return stat;
}

function statFor(url: string): Promise<RepoStat> {
	const hit = inFlight.get(url);
	if (hit) return hit;
	const pending = resolveStat(url);
	inFlight.set(url, pending);
	return pending;
}

/**
 * Stats for each given github URL, keyed by that same URL. A URL whose repo
 * couldn't be read is simply absent from the map; callers render without it.
 */
export async function getRepoStats(githubUrls: string[]): Promise<Record<string, RepoStat>> {
	const urls = [...new Set(githubUrls.filter((u) => repoSlug(u)))];
	const stats = await Promise.all(urls.map((url) => statFor(url)));
	const out: Record<string, RepoStat> = {};
	urls.forEach((url, i) => {
		if (hasData(stats[i])) out[url] = stats[i];
	});
	return out;
}
