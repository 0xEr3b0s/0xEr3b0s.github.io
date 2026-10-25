// Build-time snapshot of a user's public GitHub, so the site can render an
// in-page, navigable "mini-GitHub" (repo list + each repo's README) without the
// visitor's browser ever calling the API. Fetched at build, cached on disk for
// CACHE_TTL_MS. Never throws: on any failure it returns an empty snapshot and
// the UI shows an empty state. Set GITHUB_TOKEN in CI to raise the rate limit.
//
// README HTML comes from GitHub's own renderer (Accept: ...github.html), which
// GitHub sanitises server-side (no scripts); the UI injects it as trusted HTML.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export interface RepoCard {
	name: string;
	slug: string; // owner/name
	description: string | null;
	language: string | null;
	stars: number;
	forks: number;
	pushedAt: string | null;
	topics: string[];
	htmlUrl: string;
	isFork: boolean;
	defaultBranch: string;
}

export interface TreeEntry {
	name: string;
	type: 'dir' | 'file';
	path: string;
	htmlUrl: string;
}

export interface CommitInfo {
	message: string;
	date: string | null;
	sha: string;
	htmlUrl: string;
}

export interface GitHubSnapshot {
	login: string;
	htmlUrl: string;
	repos: RepoCard[];
	/** README HTML keyed by repo name; a repo with no README is absent. */
	readmeHtml: Record<string, string>;
	/** Root file/dir listing keyed by repo name (dirs first, then files). */
	trees: Record<string, TreeEntry[]>;
	/** Latest commit on the default branch, keyed by repo name. */
	commits: Record<string, CommitInfo>;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const CACHE_FILE = join(process.cwd(), '.astro', 'github-snapshot.json');
const API = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 10000;

let snapshot: Promise<GitHubSnapshot> | null = null;
let tmpSeq = 0;

function headers(accept: string): Record<string, string> {
	const h: Record<string, string> = { Accept: accept, 'User-Agent': '0xEr3b0s-portfolio-build' };
	const token = process.env.GITHUB_TOKEN;
	if (token) h.Authorization = `Bearer ${token}`;
	return h;
}

async function fetchWith<T>(url: string, accept: string, read: (r: Response) => Promise<T>): Promise<T | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const res = await fetch(url, { headers: headers(accept), signal: controller.signal });
		return res.ok ? await read(res) : null;
	} catch {
		return null; // offline, timeout, rate-limit — caller renders without it
	} finally {
		clearTimeout(timer);
	}
}

function toCard(raw: Record<string, unknown>): RepoCard {
	return {
		name: String(raw.name ?? ''),
		slug: String(raw.full_name ?? ''),
		description: typeof raw.description === 'string' ? raw.description : null,
		language: typeof raw.language === 'string' ? raw.language : null,
		stars: typeof raw.stargazers_count === 'number' ? raw.stargazers_count : 0,
		forks: typeof raw.forks_count === 'number' ? raw.forks_count : 0,
		pushedAt: typeof raw.pushed_at === 'string' ? raw.pushed_at : null,
		topics: Array.isArray(raw.topics) ? raw.topics.filter((t): t is string => typeof t === 'string') : [],
		htmlUrl: typeof raw.html_url === 'string' ? raw.html_url : '',
		isFork: raw.fork === true,
		defaultBranch: typeof raw.default_branch === 'string' ? raw.default_branch : 'main',
	};
}

// --- README HTML hardening (build-time, pure) --------------------------------
// GitHub's rendered README keeps intra-repo links relative and its own heading
// levels. Make links absolute, pin images to no-referrer, and shift headings
// down one level so they nest under the repo title the page already shows.

const RELATIVE = /^(https?:|#|mailto:|\/\/|\/)/i;

function rewriteLinks(html: string, blobBase: string): string {
	return html.replace(/href="([^"]*)"/g, (m, url) => (RELATIVE.test(url) ? m : `href="${blobBase}${url}"`));
}

function rewriteImage(tag: string, rawBase: string): string {
	let out = tag.replace(/src="([^"]*)"/, (m, url) => (RELATIVE.test(url) ? m : `src="${rawBase}${url}"`));
	// Match the attribute (space before the name), not "?alt=" inside a URL or "data-alt=".
	if (!/\sreferrerpolicy=/i.test(out)) out = out.replace(/^<img/i, '<img referrerpolicy="no-referrer"');
	if (!/\salt=/i.test(out)) out = out.replace(/^<img/i, '<img alt=""');
	return out;
}

function rewriteImages(html: string, rawBase: string): string {
	return html.replace(/<img\b[^>]*>/gi, (tag) => rewriteImage(tag, rawBase));
}

function demoteHeadings(html: string): string {
	return html.replace(/<(\/?)h([1-5])\b/gi, (_m, slash, level) => `<${slash}h${Number(level) + 1}`);
}

export function enhanceReadme(html: string, slug: string, branch: string): string {
	const blob = `https://github.com/${slug}/blob/${branch}/`;
	const raw = `https://github.com/${slug}/raw/${branch}/`;
	return demoteHeadings(rewriteImages(rewriteLinks(html, blob), raw));
}

/** owner/name with only the characters GitHub allows, so it can't inject a
 * different path into the API request that uses it. */
export function isValidSlug(slug: string): boolean {
	return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(slug);
}

async function listRepos(login: string): Promise<RepoCard[]> {
	const url = `${API}/users/${login}/repos?per_page=100&type=owner&sort=pushed`;
	const data = await fetchWith(url, 'application/vnd.github+json', (r) => r.json());
	if (!Array.isArray(data)) return [];
	return data
		.filter((r): r is Record<string, unknown> => !!r && (r as Record<string, unknown>).private === false)
		.map(toCard)
		.filter((c) => c.name !== '' && isValidSlug(c.slug) && !c.isFork);
}

async function fetchReadme(slug: string): Promise<string | null> {
	return fetchWith(`${API}/repos/${slug}/readme`, 'application/vnd.github.html', (r) => r.text());
}

async function readmeFor(repo: RepoCard): Promise<readonly [string, string | null]> {
	const html = await fetchReadme(repo.slug);
	return [repo.name, html ? enhanceReadme(html, repo.slug, repo.defaultBranch) : null] as const;
}

async function fetchReadmes(repos: RepoCard[]): Promise<Record<string, string>> {
	const entries = await Promise.all(repos.map(readmeFor));
	const out: Record<string, string> = {};
	for (const [name, html] of entries) if (html) out[name] = html;
	return out;
}

function toTreeEntry(raw: Record<string, unknown>): TreeEntry {
	return {
		name: String(raw.name ?? ''),
		type: raw.type === 'dir' ? 'dir' : 'file',
		path: String(raw.path ?? ''),
		htmlUrl: typeof raw.html_url === 'string' ? raw.html_url : '',
	};
}

/** Directories first, then files, each group A-Z (case-insensitive). Pure. */
export function sortEntries(entries: TreeEntry[]): TreeEntry[] {
	const rank = (e: TreeEntry) => (e.type === 'dir' ? 0 : 1);
	return [...entries].sort(
		(a, b) => rank(a) - rank(b) || a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
	);
}

async function fetchTree(slug: string): Promise<TreeEntry[]> {
	const data = await fetchWith(`${API}/repos/${slug}/contents`, 'application/vnd.github+json', (r) => r.json());
	if (!Array.isArray(data)) return [];
	return sortEntries(data.filter((r): r is Record<string, unknown> => !!r).map(toTreeEntry));
}

function toCommit(raw: Record<string, unknown>): CommitInfo {
	const commit = (raw.commit ?? {}) as Record<string, unknown>;
	const author = (commit.author ?? {}) as Record<string, unknown>;
	const full = typeof commit.message === 'string' ? commit.message : '';
	const sha = typeof raw.sha === 'string' ? raw.sha : '';
	return {
		message: full.split('\n')[0],
		date: typeof author.date === 'string' ? author.date : null,
		sha: sha.slice(0, 7),
		htmlUrl: typeof raw.html_url === 'string' ? raw.html_url : '',
	};
}

async function fetchCommit(slug: string): Promise<CommitInfo | null> {
	const data = await fetchWith(`${API}/repos/${slug}/commits?per_page=1`, 'application/vnd.github+json', (r) => r.json());
	return Array.isArray(data) && data[0] ? toCommit(data[0] as Record<string, unknown>) : null;
}

async function fetchTrees(repos: RepoCard[]): Promise<Record<string, TreeEntry[]>> {
	const entries = await Promise.all(repos.map(async (r) => [r.name, await fetchTree(r.slug)] as const));
	return Object.fromEntries(entries);
}

async function fetchCommits(repos: RepoCard[]): Promise<Record<string, CommitInfo>> {
	const entries = await Promise.all(repos.map(async (r) => [r.name, await fetchCommit(r.slug)] as const));
	const out: Record<string, CommitInfo> = {};
	for (const [name, info] of entries) if (info) out[name] = info;
	return out;
}

function isFresh(raw: { at?: unknown }): boolean {
	return typeof raw.at === 'number' && Date.now() - raw.at < CACHE_TTL_MS;
}

async function readCache(): Promise<GitHubSnapshot | null> {
	try {
		const parsed = JSON.parse(await readFile(CACHE_FILE, 'utf8'));
		if (isFresh(parsed) && parsed.data && Array.isArray(parsed.data.repos)) return parsed.data;
	} catch {
		// no cache yet or unreadable — fetch fresh
	}
	return null;
}

async function writeCache(data: GitHubSnapshot): Promise<void> {
	try {
		await mkdir(dirname(CACHE_FILE), { recursive: true });
		const tmp = `${CACHE_FILE}.${process.pid}.${tmpSeq++}.tmp`;
		await writeFile(tmp, JSON.stringify({ at: Date.now(), data }), 'utf8');
		await rename(tmp, CACHE_FILE);
	} catch {
		// a failing cache write must never break the build
	}
}

async function build(login: string): Promise<GitHubSnapshot> {
	const repos = await listRepos(login);
	const [readmeHtml, trees, commits] = await Promise.all([
		fetchReadmes(repos),
		fetchTrees(repos),
		fetchCommits(repos),
	]);
	return { login, htmlUrl: `https://github.com/${login}`, repos, readmeHtml, trees, commits };
}

const FALLBACK_FILE = join(process.cwd(), 'src', 'data', 'github-snapshot.fallback.json');

// A snapshot committed to the repo, used only when a build's live fetch comes
// back empty (network down or rate-limited), so the GitHub section never ships
// blank. Refresh it with `node --experimental-strip-types scripts/...` or let a
// healthy build overwrite the on-disk cache.
async function readFallback(): Promise<GitHubSnapshot | null> {
	try {
		const parsed = JSON.parse(await readFile(FALLBACK_FILE, 'utf8'));
		return Array.isArray(parsed?.repos) ? (parsed as GitHubSnapshot) : null;
	} catch {
		return null;
	}
}

async function load(login: string): Promise<GitHubSnapshot> {
	const cached = await readCache();
	if (cached) return cached;
	const fresh = await build(login);
	if (fresh.repos.length > 0) {
		await writeCache(fresh);
		return fresh;
	}
	return (await readFallback()) ?? fresh;
}

/** The snapshot for `login`, fetched once per build and memoised. */
export function getGitHubSnapshot(login: string): Promise<GitHubSnapshot> {
	if (!snapshot) snapshot = load(login);
	return snapshot;
}
