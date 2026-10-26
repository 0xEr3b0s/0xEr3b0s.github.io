import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAddress } from './address.ts';

const known = (id: string) => id === 'rainfall' || id === 'ft-ping';

test('a full project URL resolves to the project', () => {
	assert.deepEqual(parseAddress('http://nirmata/projects/rainfall', known), { kind: 'project', id: 'rainfall' });
});

test('"projects" resolves to the index', () => {
	assert.deepEqual(parseAddress('http://nirmata/projects', known), { kind: 'index' });
	assert.deepEqual(parseAddress('projects', known), { kind: 'index' });
});

test('the site root and empty input resolve to the index', () => {
	assert.deepEqual(parseAddress('/', known), { kind: 'index' });
	assert.deepEqual(parseAddress('http://nirmata/', known), { kind: 'index' });
	assert.deepEqual(parseAddress('   ', known), { kind: 'index' });
});

test('an unknown token is unknown', () => {
	assert.deepEqual(parseAddress('http://nirmata/projects/nope', known), { kind: 'unknown' });
});

test('query and hash are ignored', () => {
	assert.deepEqual(parseAddress('/projects/rainfall?x=1', known), { kind: 'project', id: 'rainfall' });
	assert.deepEqual(parseAddress('http://nirmata/projects/ft-ping#top', known), { kind: 'project', id: 'ft-ping' });
});
