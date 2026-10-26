import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, createPlayer, dueIndex, focusAfter, jsonForScript, sanitizeSteps, TIMING, toneOf, transcript } from './replay.ts';

type Steps = Parameters<typeof buildTimeline>[0];

const prompt = [{ text: '$ ', tone: 'accent' as const }];
const cmd = (text: string): Steps[number] => ({ kind: 'cmd', prompt, text });

test('empty steps give an empty timeline', () => {
	assert.deepEqual(buildTimeline([]), { events: [], total: 0 });
	assert.deepEqual(transcript([]), []);
});

test('typing duration scales with text length', () => {
	const short = buildTimeline([cmd('ls')]).total;
	const long = buildTimeline([cmd('ls -la')]).total;
	assert.equal(long - short, 4 * TIMING.charMs);
});

test('a command emits prompt, one char event per character, then enter', () => {
	const { events } = buildTimeline([cmd('ab')]);
	assert.deepEqual(
		events.map((e) => e.type),
		['prompt', 'char', 'char', 'enter'],
	);
	assert.equal(events[1].at, TIMING.promptMs);
	assert.equal(events[2].at, TIMING.promptMs + TIMING.charMs);
});

test('output uses the default delay then spaces lines apart', () => {
	const { events } = buildTimeline([{ kind: 'out', lines: [[{ text: 'a' }], [{ text: 'b' }]] }]);
	assert.equal(events[0].at, TIMING.outDelayMs);
	assert.equal(events[1].at, TIMING.outDelayMs + TIMING.lineMs);
});

test('an explicit out delay is respected, including zero', () => {
	const zero = buildTimeline([{ kind: 'out', delay: 0, lines: [[{ text: 'a' }]] }]);
	assert.equal(zero.events[0].at, 0);
	const late = buildTimeline([{ kind: 'out', delay: 900, lines: [[{ text: 'a' }]] }]);
	assert.equal(late.events[0].at, 900);
});

test('a key event lands after a beat and echoes its label', () => {
	const { events } = buildTimeline([{ kind: 'key', label: '^C' }]);
	assert.deepEqual(events, [{ at: TIMING.keyMs, type: 'key', label: '^C' }]);
});

test('a pause shifts later events without emitting any', () => {
	const { events, total } = buildTimeline([
		{ kind: 'pause', ms: 1000 },
		{ kind: 'out', delay: 0, lines: [[{ text: 'x' }]] },
	]);
	assert.equal(events.length, 1);
	assert.equal(events[0].at, 1000);
	assert.equal(total, 1000);
});

test('events are ordered by timestamp across steps', () => {
	const { events } = buildTimeline([cmd('ls'), { kind: 'out', lines: [[{ text: 'f' }]] }, { kind: 'key', label: '^C' }]);
	const times = events.map((e) => e.at);
	assert.deepEqual(times, [...times].sort((a, b) => a - b));
});

test('transcript joins prompt and typed text, keeps output, appends key to the last line', () => {
	const lines = transcript([cmd('ls'), { kind: 'out', lines: [[{ text: 'f', tone: 'dim' }]] }, { kind: 'key', label: '^C' }]);
	assert.deepEqual(lines, [[...prompt, { text: 'ls' }], [{ text: 'f', tone: 'dim' }, { text: '^C' }]]);
});

test('transcript does not mutate the input steps', () => {
	const out: Steps = [{ kind: 'out', lines: [[{ text: 'f' }]] }, { kind: 'key', label: '^C' }];
	transcript(out);
	assert.equal((out[0] as { lines: unknown[][] }).lines[0].length, 1);
});

test('dueIndex returns the first event not yet due', () => {
	const { events } = buildTimeline([cmd('ab')]);
	assert.equal(dueIndex(events, 0, 0), 1);
	assert.equal(dueIndex(events, 0, TIMING.promptMs), 2);
	assert.equal(dueIndex(events, 2, 1e9), events.length);
});

test('jsonForScript cannot close the script element', () => {
	assert.ok(!jsonForScript([{ text: '</script>' }]).includes('</'));
});

test('toneOf allow-lists tones', () => {
	assert.equal(toneOf('err'), 'err');
	assert.equal(toneOf('x" onload="y'), 'out');
	assert.equal(toneOf(undefined), 'out');
});

test('sanitizeSteps drops malformed steps', () => {
	const good = { kind: 'key', label: '^C' };
	const bad = [null, 3, { kind: 'cmd', text: 'x' }, { kind: 'out', lines: [['no']] }, { kind: 'pause', ms: 'x' }];
	assert.deepEqual(sanitizeSteps([good, ...bad]), [good]);
	assert.deepEqual(sanitizeSteps('nope'), []);
});

function harness(alive: () => boolean = () => true) {
	const { events, total } = buildTimeline([cmd('ab'), { kind: 'pause', ms: 1000 }]);
	const log = { applied: 0, ended: 0, stopped: 0 };
	const player = createPlayer(events, total, {
		apply: () => void log.applied++,
		onEnd: () => void log.ended++,
		onStop: () => void log.stopped++,
		alive,
	}, () => Date.now());
	return { player, log, events, total };
}

test('player fires onEnd once, at total, not at the last event', () => {
	mock.timers.enable({ apis: ['setTimeout', 'Date'] });
	try {
		const { player, log, events, total } = harness();
		player.start();
		mock.timers.tick(events[events.length - 1].at);
		assert.equal(log.applied, events.length);
		assert.equal(log.ended, 0);
		mock.timers.tick(total);
		mock.timers.tick(5000);
		assert.equal(log.ended, 1);
	} finally {
		mock.timers.reset();
	}
});

test('pause freezes progress and resume continues from the same point', () => {
	mock.timers.enable({ apis: ['setTimeout', 'Date'] });
	try {
		const { player, log, events } = harness();
		player.start();
		mock.timers.tick(TIMING.promptMs);
		const seen = log.applied;
		player.pause();
		mock.timers.tick(10_000);
		assert.equal(log.applied, seen);
		player.resume();
		mock.timers.tick(events[events.length - 1].at);
		assert.equal(log.applied, events.length);
	} finally {
		mock.timers.reset();
	}
});

test('player stops and reports when the node is no longer alive', () => {
	mock.timers.enable({ apis: ['setTimeout', 'Date'] });
	try {
		let alive = true;
		const { player, log } = harness(() => alive);
		player.start();
		alive = false;
		mock.timers.tick(10_000);
		assert.equal(log.stopped, 1);
		assert.equal(log.ended, 0);
	} finally {
		mock.timers.reset();
	}
});

test('focusAfter moves focus only off a button that is being hidden', () => {
	assert.equal(focusAfter('replay', 'playing'), 'pause');
	assert.equal(focusAfter('pause', 'done'), 'replay');
	assert.equal(focusAfter('pause', 'paused'), null);
	assert.equal(focusAfter(null, 'playing'), null);
	assert.equal(focusAfter(null, 'done'), null);
	assert.equal(focusAfter('pause', 'idle'), null);
});
