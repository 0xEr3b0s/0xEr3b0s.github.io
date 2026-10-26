import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankRepos, slugFromUrl } from './ghrank.ts';

const repo = (name: string, stars = 0, pushedAt: string | null = null) => ({ slug: `o/${name}`, stars, pushedAt });

test('slugFromUrl normalises github URLs', () => {
	assert.equal(slugFromUrl('https://github.com/0xnirmata/RainFall'), '0xnirmata/rainfall');
	assert.equal(slugFromUrl('https://github.com/o/x.git'), 'o/x');
	assert.equal(slugFromUrl('https://example.com/o/x'), null);
	assert.equal(slugFromUrl(''), null);
});

test('curated repos come first: featured, then project order', () => {
	const curated = [
		{ slug: 'o/b', featured: false, order: 1 },
		{ slug: 'o/a', featured: true, order: 5 },
		{ slug: 'o/c', featured: true, order: 2 },
	];
	const out = rankRepos([repo('b'), repo('x', 99), repo('a'), repo('c')], curated).map((r) => r.slug);
	assert.deepEqual(out, ['o/c', 'o/a', 'o/b', 'o/x']);
});

test('the rest sort by stars then recency', () => {
	const out = rankRepos(
		[repo('old', 1, '2025-01-01'), repo('new', 1, '2026-01-01'), repo('top', 5, '2020-01-01')],
		[],
	).map((r) => r.slug);
	assert.deepEqual(out, ['o/top', 'o/new', 'o/old']);
});

test('slug matching is case-insensitive', () => {
	const out = rankRepos([repo('x', 9), { slug: 'O/Fancy', stars: 0, pushedAt: null }], [
		{ slug: 'o/fancy', featured: false, order: 1 },
	]);
	assert.equal(out[0]?.slug, 'O/Fancy');
});
