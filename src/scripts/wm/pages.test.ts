import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	allowRepo, GH_INDEX, ghRepoId, hashFor, isGhId, pageFromHash, parseGhAddress, repoOfId,
} from './pages.ts';

const repos = ['RainFall', 'libasm', 'ft_ping'];
const login = '0xnirmata';

test('history ids round-trip', () => {
	assert.equal(repoOfId(ghRepoId('libasm')), 'libasm');
	assert.equal(repoOfId(GH_INDEX), null);
	assert.equal(isGhId(GH_INDEX), true);
	assert.equal(isGhId('rainfall'), false);
});

test('allowRepo is an exact allowlist match and returns the canonical name', () => {
	assert.equal(allowRepo('rainfall', repos), 'RainFall');
	assert.equal(allowRepo('../etc/passwd', repos), null);
	assert.equal(allowRepo('rain', repos), null);
	assert.equal(allowRepo('', repos), null);
});

test('hashFor and pageFromHash agree', () => {
	assert.equal(hashFor(GH_INDEX), 'gh');
	assert.equal(hashFor(ghRepoId('libasm')), 'gh/libasm');
	assert.equal(pageFromHash('#gh', repos, () => false), GH_INDEX);
	assert.equal(pageFromHash('#gh/LIBASM', repos, () => false), 'gh:libasm');
	assert.equal(pageFromHash('#gh/nope', repos, () => false), null);
	assert.equal(pageFromHash('#kfs', repos, (id) => id === 'kfs'), 'kfs');
	assert.equal(pageFromHash('#zzz', repos, () => false), null);
});

test('github addresses resolve to index, repo or unknown', () => {
	assert.deepEqual(parseGhAddress('https://github.com/0xnirmata', repos, login), { kind: 'gh-index' });
	assert.deepEqual(parseGhAddress('github.com', repos, login), { kind: 'gh-index' });
	assert.deepEqual(parseGhAddress('https://github.com/0xnirmata/rainfall?tab=x#y', repos, login), {
		kind: 'gh-repo', name: 'RainFall',
	});
	assert.deepEqual(parseGhAddress('/github/libasm', repos, login), { kind: 'gh-repo', name: 'libasm' });
	assert.deepEqual(parseGhAddress('https://github.com/someoneelse/rainfall', repos, login), { kind: 'unknown' });
	assert.deepEqual(parseGhAddress('https://github.com/0xnirmata/nope', repos, login), { kind: 'unknown' });
});

test('non-github addresses are not claimed', () => {
	assert.equal(parseGhAddress('http://nirmata/projects/kfs', repos, login), null);
	assert.equal(parseGhAddress('githubber', repos, login), null);
});
