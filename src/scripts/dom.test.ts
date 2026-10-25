import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanToken } from './dom.ts';

test('cleanToken lowercases and keeps [a-z0-9-]', () => {
	assert.equal(cleanToken('Ft-Ping2'), 'ft-ping2');
});

test('cleanToken strips everything else', () => {
	assert.equal(cleanToken('"><script>x</script>'), 'scriptxscript');
	assert.equal(cleanToken('/projects/rainfall?x=1'), 'projectsrainfallx1');
	assert.equal(cleanToken(''), '');
});
