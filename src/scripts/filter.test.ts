import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessOf, matches, nextValue, statusBucket, summaryText } from './filter.ts';

const row = { status: 'in-progress', access: 'public' };

test('All/All shows everything', () => {
	assert.equal(matches(row, { status: 'all', access: 'all' }), true);
	assert.equal(matches({ status: 'planned', access: 'private' }, { status: 'all', access: 'all' }), true);
});

test('status-only filter', () => {
	assert.equal(matches(row, { status: 'in-progress', access: 'all' }), true);
	assert.equal(matches(row, { status: 'completed', access: 'all' }), false);
});

test('access-only filter', () => {
	assert.equal(matches(row, { status: 'all', access: 'public' }), true);
	assert.equal(matches(row, { status: 'all', access: 'private' }), false);
});

test('combined filters are ANDed', () => {
	assert.equal(matches(row, { status: 'in-progress', access: 'public' }), true);
	assert.equal(matches(row, { status: 'in-progress', access: 'private' }), false);
	assert.equal(matches(row, { status: 'planned', access: 'public' }), false);
});

test('every status maps to one bucket', () => {
	assert.equal(statusBucket('active'), 'in-progress');
	assert.equal(statusBucket('maintained'), 'in-progress');
	assert.equal(statusBucket('archived'), 'completed');
	assert.equal(statusBucket('planned'), 'planned');
	assert.equal(statusBucket('weird'), 'in-progress');
});

test('access follows the github link', () => {
	assert.equal(accessOf('https://github.com/x/y'), 'public');
	assert.equal(accessOf(''), 'private');
	assert.equal(accessOf('  '), 'private');
});

test('re-clicking the selected value returns to All', () => {
	assert.equal(nextValue('planned', 'planned'), 'all');
	assert.equal(nextValue('all', 'planned'), 'planned');
	assert.equal(nextValue('all', 'all'), 'all');
});

test('summary names the active filters', () => {
	assert.equal(summaryText(8, 8, { status: 'all', access: 'all' }), 'Showing 8 of 8 projects');
	assert.equal(
		summaryText(3, 8, { status: 'in-progress', access: 'public' }),
		'Showing 3 of 8 projects - In progress, Public',
	);
	assert.equal(summaryText(0, 8, { status: 'all', access: 'private' }), 'Showing 0 of 8 projects - Private');
});
