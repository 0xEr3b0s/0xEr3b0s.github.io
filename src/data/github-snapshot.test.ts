import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enhanceReadme, isValidSlug, sortEntries, type TreeEntry } from './github-snapshot.ts';

test('isValidSlug accepts owner/name', () => {
	assert.equal(isValidSlug('0xEr3b0s/RainFall'), true);
});

test('isValidSlug rejects a bare name', () => {
	assert.equal(isValidSlug('RainFall'), false);
});

test('isValidSlug rejects a three-segment path', () => {
	assert.equal(isValidSlug('a/b/c'), false);
});

test('isValidSlug rejects a comma (would split the allowlist)', () => {
	assert.equal(isValidSlug('a,b/c'), false);
});

test('enhanceReadme makes a relative link absolute to the repo blob', () => {
	const out = enhanceReadme('<a href="docs/x.md">x</a>', 'a/b', 'main');
	assert.match(out, /href="https:\/\/github\.com\/a\/b\/blob\/main\/docs\/x\.md"/);
});

test('enhanceReadme leaves absolute and anchor links untouched', () => {
	const out = enhanceReadme('<a href="https://x/y">y</a><a href="#top">t</a>', 'a/b', 'main');
	assert.match(out, /href="https:\/\/x\/y"/);
	assert.match(out, /href="#top"/);
});

test('enhanceReadme rewrites a relative image src to the raw URL', () => {
	const out = enhanceReadme('<img src="img/p.png">', 'a/b', 'main');
	assert.match(out, /src="https:\/\/github\.com\/a\/b\/raw\/main\/img\/p\.png"/);
});

test('enhanceReadme adds no-referrer and empty alt to an image missing them', () => {
	const out = enhanceReadme('<img src="https://cdn/p.png">', 'a/b', 'main');
	assert.match(out, /referrerpolicy="no-referrer"/);
	assert.match(out, /alt=""/);
});

test('enhanceReadme still adds alt when the src URL merely contains alt=', () => {
	const out = enhanceReadme('<img src="https://cdn/p.png?alt=media">', 'a/b', 'main');
	assert.match(out, /\salt=""/);
});

test('enhanceReadme keeps an existing alt', () => {
	const out = enhanceReadme('<img src="https://cdn/p.png" alt="pic">', 'a/b', 'main');
	assert.match(out, /alt="pic"/);
	assert.doesNotMatch(out, /alt=""/);
});

test('enhanceReadme demotes headings by one level', () => {
	const out = enhanceReadme('<h1>T</h1><h2>S</h2>', 'a/b', 'main');
	assert.equal(out, '<h2>T</h2><h3>S</h3>');
});

test('sortEntries puts directories before files, each A-Z', () => {
	const e = (name: string, type: 'dir' | 'file'): TreeEntry => ({ name, type, path: name, htmlUrl: '' });
	const out = sortEntries([e('README.md', 'file'), e('src', 'dir'), e('Makefile', 'file'), e('docs', 'dir')]);
	assert.deepEqual(out.map((x) => x.name), ['docs', 'src', 'Makefile', 'README.md']);
});
