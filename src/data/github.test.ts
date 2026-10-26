import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLastPage, repoSlug } from './github.ts';

test('repoSlug extracts owner/name from a normal URL', () => {
	assert.equal(repoSlug('https://github.com/0xnirmata/RainFall'), '0xnirmata/RainFall');
});

test('repoSlug strips a .git suffix', () => {
	assert.equal(repoSlug('https://github.com/0xnirmata/RainFall.git'), '0xnirmata/RainFall');
});

test('repoSlug ignores a #anchor', () => {
	assert.equal(repoSlug('https://github.com/0xnirmata/RainFall#readme'), '0xnirmata/RainFall');
});

test('repoSlug ignores a ?query', () => {
	assert.equal(repoSlug('https://github.com/0xnirmata/RainFall?tab=readme'), '0xnirmata/RainFall');
});

test('repoSlug returns null for a non-github string', () => {
	assert.equal(repoSlug('https://example.com/foo/bar'), null);
});

test('repoSlug rejects a slug containing path traversal', () => {
	assert.equal(repoSlug('https://github.com/owner/na..me'), null);
});

test('repoSlug stops at a percent-encoded segment', () => {
	assert.equal(repoSlug('https://github.com/a/..%2f..'), null);
});

test('repoSlug is anchored and rejects github.com in a path segment', () => {
	assert.equal(repoSlug('https://evil.example.com/github.com/a/b'), null);
});

test('repoSlug accepts a www. host', () => {
	assert.equal(repoSlug('https://www.github.com/0xnirmata/RainFall'), '0xnirmata/RainFall');
});

test('parseLastPage returns null for a null header', () => {
	assert.equal(parseLastPage(null), null);
});

test('parseLastPage reads page=30 from rel="last"', () => {
	const header =
		'<https://api.github.com/repositories/1/commits?per_page=1&page=2>; rel="next", ' +
		'<https://api.github.com/repositories/1/commits?per_page=1&page=30>; rel="last"';
	assert.equal(parseLastPage(header), 30);
});

test('parseLastPage returns null when there is no last page', () => {
	const header = '<https://api.github.com/repositories/1/commits?per_page=1&page=1>; rel="prev"';
	assert.equal(parseLastPage(header), null);
});
