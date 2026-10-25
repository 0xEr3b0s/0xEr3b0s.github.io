import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capWidth, clampPosition } from './position.ts';

const bounds = { x: 1000, y: 600 };
const win = { x: 400, y: 300 };

test('clampPosition leaves an in-bounds position alone', () => {
	assert.deepEqual(clampPosition({ x: 100, y: 50 }, win, bounds), { x: 100, y: 50 });
});

test('clampPosition pins negative coordinates to 0', () => {
	assert.deepEqual(clampPosition({ x: -30, y: -5 }, win, bounds), { x: 0, y: 0 });
});

test('clampPosition keeps the far edge inside the bounds', () => {
	assert.deepEqual(clampPosition({ x: 900, y: 900 }, win, bounds), { x: 600, y: 300 });
});

test('clampPosition pins to 0 when the window is larger than the bounds', () => {
	assert.deepEqual(clampPosition({ x: 50, y: 50 }, { x: 2000, y: 2000 }, bounds), { x: 0, y: 0 });
});

test('capWidth never exceeds the layer width', () => {
	assert.equal(capWidth(780, 720), 720);
	assert.equal(capWidth(500, 720), 500);
	assert.equal(capWidth(500, -4), 0);
});
