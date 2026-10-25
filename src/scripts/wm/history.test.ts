import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canGoBack, canGoForward, current, emptyNav, INDEX, step, visit } from './history.ts';

test('an empty history has no current page and no moves', () => {
	const nav = emptyNav();
	assert.equal(current(nav), null);
	assert.equal(canGoBack(nav), false);
	assert.equal(canGoForward(nav), false);
});

test('visit appends and moves to the new page', () => {
	const nav = visit(visit(emptyNav(), 'a'), 'b');
	assert.equal(current(nav), 'b');
	assert.equal(canGoBack(nav), true);
	assert.equal(canGoForward(nav), false);
});

test('back then forward walks the stack', () => {
	const nav = visit(visit(emptyNav(), 'a'), 'b');
	const back = step(nav, -1);
	assert.equal(current(back), 'a');
	assert.equal(current(step(back, 1)), 'b');
});

test('visiting after going back drops the forward entries', () => {
	const back = step(visit(visit(emptyNav(), 'a'), 'b'), -1);
	const nav = visit(back, 'c');
	assert.deepEqual(nav.stack, ['a', 'c']);
	assert.equal(canGoForward(nav), false);
});

test('revisiting the current page keeps the forward entries', () => {
	const back = step(visit(visit(emptyNav(), 'a'), 'b'), -1);
	assert.equal(visit(back, 'a'), back);
	assert.equal(canGoForward(back), true);
});

test('out-of-range steps change nothing', () => {
	const nav = visit(emptyNav(), 'a');
	assert.equal(step(nav, -1), nav);
	assert.equal(step(nav, 1), nav);
});

test('index then project: Back shows the index, Forward the project', () => {
	const nav = visit(visit(emptyNav(), INDEX), 'rainfall');
	const back = step(nav, -1);
	assert.equal(current(back), INDEX);
	assert.equal(current(step(back, 1)), 'rainfall');
});

test('the index id can never collide with a sanitised project token', () => {
	assert.equal(/^[a-z0-9-]+$/.test(INDEX), false);
});
