import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demotedLevel, langClass, relativeAge, shortDate } from './ghformat.ts';

test('langClass slugs language names', () => {
	assert.equal(langClass('C++'), 'lang-cpp');
	assert.equal(langClass('C'), 'lang-c');
	assert.equal(langClass('Shell'), 'lang-shell');
	assert.equal(langClass('???'), 'lang-other');
});

test('shortDate trims ISO timestamps', () => {
	assert.equal(shortDate('2026-10-22T10:00:00Z'), '2026-10-22');
	assert.equal(shortDate('yesterday'), 'yesterday');
});

test('demotedLevel adds one and caps at 6', () => {
	assert.equal(demotedLevel(1), 2);
	assert.equal(demotedLevel(5), 6);
	assert.equal(demotedLevel(6), 6);
});

test('relativeAge picks the largest fitting unit', () => {
	const now = new Date('2026-10-25T12:00:00Z');
	assert.equal(relativeAge('2026-10-25T11:59:40Z', now), 'just now');
	assert.equal(relativeAge('2026-10-25T11:55:00Z', now), '5 minutes ago');
	assert.equal(relativeAge('2026-10-25T11:00:00Z', now), '1 hour ago');
	assert.equal(relativeAge('2026-10-22T12:00:00Z', now), '3 days ago');
	assert.equal(relativeAge('2026-08-25T12:00:00Z', now), '2 months ago');
	assert.equal(relativeAge('2024-10-25T12:00:00Z', now), '2 years ago');
	assert.equal(relativeAge('garbage', now), 'garbage');
});
