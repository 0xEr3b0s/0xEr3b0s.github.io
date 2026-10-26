// Terminal replay: pure timeline logic first, then the thin DOM player.
import type { ReplayStep, Segment, Tone } from '../data/replays';

const TONES: readonly Tone[] = ['out', 'err', 'dim', 'accent', 'red'];

/** Allow-list a tone before it becomes a class name; anything unknown renders as plain output. */
export function toneOf(tone: unknown): Tone {
	return TONES.find((t) => t === tone) ?? 'out';
}

function isSegment(x: unknown): x is Segment {
	return typeof x === 'object' && x !== null && typeof (x as { text?: unknown }).text === 'string';
}

function isSegments(x: unknown): x is Segment[] {
	return Array.isArray(x) && x.every(isSegment);
}

function isStep(x: unknown): x is ReplayStep {
	if (typeof x !== 'object' || x === null) return false;
	const s = x as Record<string, unknown>;
	if (s.kind === 'cmd') return isSegments(s.prompt) && typeof s.text === 'string';
	if (s.kind === 'out') return Array.isArray(s.lines) && s.lines.every(isSegments);
	if (s.kind === 'key') return typeof s.label === 'string';
	return s.kind === 'pause' && typeof s.ms === 'number';
}

/** Keep only well-formed steps; malformed ones are dropped rather than breaking the replay. */
export function sanitizeSteps(data: unknown): ReplayStep[] {
	return Array.isArray(data) ? data.filter(isStep) : [];
}

export const TIMING = {
	promptMs: 200,
	charMs: 40,
	enterMs: 250,
	outDelayMs: 150,
	lineMs: 60,
	keyMs: 350,
	afterKeyMs: 150,
} as const;

export type ReplayEvent =
	| { at: number; type: 'prompt'; segments: Segment[] }
	| { at: number; type: 'char'; char: string }
	| { at: number; type: 'enter' }
	| { at: number; type: 'line'; segments: Segment[] }
	| { at: number; type: 'key'; label: string };

export interface Timeline {
	events: ReplayEvent[];
	/** Absolute ms of the last thing that happens, pauses included. */
	total: number;
}

interface Chunk {
	events: ReplayEvent[];
	end: number;
}

function cmdChunk(step: Extract<ReplayStep, { kind: 'cmd' }>, t: number): Chunk {
	const events: ReplayEvent[] = [{ at: t, type: 'prompt', segments: step.prompt }];
	const typingStart = t + TIMING.promptMs;
	const chars = Array.from(step.text);
	chars.forEach((char, i) => events.push({ at: typingStart + i * TIMING.charMs, type: 'char', char }));
	const end = typingStart + chars.length * TIMING.charMs + TIMING.enterMs;
	events.push({ at: end, type: 'enter' });
	return { events, end };
}

function outChunk(step: Extract<ReplayStep, { kind: 'out' }>, t: number): Chunk {
	const start = t + Math.max(0, step.delay ?? TIMING.outDelayMs);
	const events: ReplayEvent[] = step.lines.map((segments, i) => ({
		at: start + i * TIMING.lineMs,
		type: 'line',
		segments,
	}));
	const end = step.lines.length > 0 ? start + (step.lines.length - 1) * TIMING.lineMs : start;
	return { events, end };
}

function keyChunk(step: Extract<ReplayStep, { kind: 'key' }>, t: number): Chunk {
	const at = t + TIMING.keyMs;
	return { events: [{ at, type: 'key', label: step.label }], end: at + TIMING.afterKeyMs };
}

function chunkFor(step: ReplayStep, t: number): Chunk {
	switch (step.kind) {
		case 'cmd':
			return cmdChunk(step, t);
		case 'out':
			return outChunk(step, t);
		case 'key':
			return keyChunk(step, t);
		case 'pause':
			return { events: [], end: t + Math.max(0, step.ms) };
	}
}

/** Turn steps into events with absolute timestamps (ms from the start of the replay). */
export function buildTimeline(steps: readonly ReplayStep[]): Timeline {
	const events: ReplayEvent[] = [];
	let t = 0;
	for (const step of steps) {
		const chunk = chunkFor(step, t);
		events.push(...chunk.events);
		t = chunk.end;
	}
	return { events, total: t };
}

/** The final screen as lines of segments: what the server renders and what the replay ends on. */
export function transcript(steps: readonly ReplayStep[]): Segment[][] {
	const lines: Segment[][] = [];
	for (const step of steps) {
		if (step.kind === 'cmd') lines.push([...step.prompt, { text: step.text }]);
		else if (step.kind === 'out') lines.push(...step.lines.map((l) => [...l]));
		else if (step.kind === 'key') appendToLastLine(lines, { text: step.label });
	}
	return lines;
}

function appendToLastLine(lines: Segment[][], segment: Segment): void {
	const last = lines[lines.length - 1];
	if (last) last.push(segment);
	else lines.push([segment]);
}

/** Index of the first event not yet due at `elapsed` ms, starting from `from`. */
export function dueIndex(events: readonly ReplayEvent[], from: number, elapsed: number): number {
	let i = from;
	while (i < events.length && events[i].at <= elapsed) i++;
	return i;
}

/** Escape a JSON string so it can sit inside a <script> element. */
export function jsonForScript(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------- player

export interface Player {
	start(): void;
	pause(): void;
	resume(): void;
	stop(): void;
}

export interface PlayerHooks {
	apply(event: ReplayEvent): void;
	/** Fired once, when the timeline's total duration has elapsed. */
	onEnd(): void;
	/** Fired once if the player gave up because the node left the DOM. */
	onStop?(): void;
	/** False once the replay's node has left the DOM. */
	alive(): boolean;
}

export function createPlayer(
	events: readonly ReplayEvent[],
	total: number,
	hooks: PlayerHooks,
	now: () => number = () => performance.now(),
): Player {
	let idx = 0;
	let startedAt = 0;
	let elapsed = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const halt = () => {
		clearTimeout(timer);
		timer = undefined;
	};
	const tick = () => {
		if (!hooks.alive()) {
			halt();
			return hooks.onStop?.();
		}
		const at = now() - startedAt;
		const next = dueIndex(events, idx, at);
		for (; idx < next; idx++) hooks.apply(events[idx]);
		if (idx >= events.length && at >= total) return hooks.onEnd();
		const nextAt = idx < events.length ? events[idx].at : total;
		timer = setTimeout(tick, Math.max(0, nextAt - at));
	};
	const resume = () => {
		halt();
		startedAt = now() - elapsed;
		tick();
	};
	return {
		start() {
			idx = 0;
			elapsed = 0;
			resume();
		},
		pause() {
			elapsed = now() - startedAt;
			halt();
		},
		resume,
		stop: halt,
	};
}

// ---------------------------------------------------------------- DOM

interface Screen {
	live: HTMLElement;
	line: HTMLElement | null;
	typed: HTMLElement | null;
	cursor: HTMLElement | null;
}

function segmentsEl(line: HTMLElement, segments: readonly Segment[]): void {
	for (const seg of segments) {
		const span = document.createElement('span');
		span.className = `tr-${toneOf(seg.tone)}`;
		span.textContent = seg.text;
		line.append(span);
	}
}

function newLine(screen: Screen, segments: readonly Segment[]): HTMLElement {
	const line = document.createElement('div');
	line.className = 'tr-line';
	segmentsEl(line, segments);
	screen.live.append(line);
	screen.line = line;
	return line;
}

function dropCursor(screen: Screen): void {
	screen.cursor?.remove();
	screen.cursor = null;
	screen.typed = null;
}

function startCommand(screen: Screen, segments: readonly Segment[]): void {
	const line = newLine(screen, segments);
	screen.typed = document.createElement('span');
	screen.typed.className = 'tr-out';
	screen.cursor = document.createElement('span');
	screen.cursor.className = 'tr-cursor';
	line.append(screen.typed, screen.cursor);
}

function applyEvent(screen: Screen, ev: ReplayEvent): void {
	if (ev.type === 'prompt') startCommand(screen, ev.segments);
	else if (ev.type === 'char' && screen.typed) screen.typed.textContent += ev.char;
	else if (ev.type === 'enter') dropCursor(screen);
	else if (ev.type === 'line') newLine(screen, ev.segments);
	else if (ev.type === 'key') {
		if (!screen.line) newLine(screen, []);
		screen.line?.append(Object.assign(document.createElement('span'), { className: 'tr-out', textContent: ev.label }));
	}
}

export type ReplayState = 'idle' | 'playing' | 'paused' | 'done';

interface Ui {
	node: HTMLElement;
	scroller: HTMLElement;
	live: HTMLElement;
	pauseBtn: HTMLButtonElement;
	replayBtn: HTMLButtonElement;
}

function queryUi(node: HTMLElement): Ui | null {
	const scroller = node.querySelector<HTMLElement>('.tr-screen');
	const live = node.querySelector<HTMLElement>('.tr-live');
	const pauseBtn = node.querySelector<HTMLButtonElement>('[data-tr-action="pause"]');
	const replayBtn = node.querySelector<HTMLButtonElement>('[data-tr-action="replay"]');
	return scroller && live && pauseBtn && replayBtn ? { node, scroller, live, pauseBtn, replayBtn } : null;
}

function readSteps(node: HTMLElement): ReplayStep[] | null {
	const raw = node.querySelector('script[type="application/json"]')?.textContent;
	if (!raw) return null;
	try {
		const steps = sanitizeSteps(JSON.parse(raw));
		return steps.length > 0 ? steps : null;
	} catch {
		return null;
	}
}

export type ReplayButton = 'pause' | 'replay';

/** The button that should take focus when the focused one is about to be hidden, else null. */
export function focusAfter(focused: ReplayButton | null, state: ReplayState): ReplayButton | null {
	const visible: ReplayButton | null = state === 'done' ? 'replay' : state === 'idle' ? null : 'pause';
	return focused !== null && visible !== null && focused !== visible ? visible : null;
}

function focusedButton(ui: Ui): ReplayButton | null {
	if (document.activeElement === ui.pauseBtn) return 'pause';
	return document.activeElement === ui.replayBtn ? 'replay' : null;
}

function showState(ui: Ui, state: ReplayState): void {
	const move = focusAfter(focusedButton(ui), state);
	ui.node.dataset.state = state;
	ui.pauseBtn.hidden = state !== 'playing' && state !== 'paused';
	ui.pauseBtn.textContent = state === 'paused' ? 'Play' : 'Pause';
	ui.replayBtn.hidden = state !== 'done';
	if (move) (move === 'pause' ? ui.pauseBtn : ui.replayBtn).focus({ preventScroll: true });
}

function isNearBottom(el: HTMLElement): boolean {
	return el.scrollHeight - el.scrollTop - el.clientHeight < 24;
}

function wireReplay(ui: Ui, { events, total }: Timeline): () => void {
	let player: Player | null = null;
	let following = true;
	const toBottom = () => {
		ui.scroller.scrollTop = ui.scroller.scrollHeight;
	};
	const play = () => {
		player?.stop();
		ui.live.replaceChildren();
		ui.scroller.scrollTop = 0;
		following = true;
		const screen: Screen = { live: ui.live, line: null, typed: null, cursor: null };
		player = createPlayer(events, total, {
			apply: (ev) => {
				following = isNearBottom(ui.scroller);
				applyEvent(screen, ev);
				if (following) toBottom();
			},
			onEnd: () => {
				showState(ui, 'done');
				if (following) toBottom();
			},
			onStop: () => showState(ui, 'idle'),
			alive: () => ui.node.isConnected,
		});
		showState(ui, 'playing');
		player.start();
	};
	// Per-node on purpose: the node can be cloned into the IE window, so a document-level handler would double up.
	ui.node.addEventListener('click', (e) => {
		const action = (e.target as Element).closest<HTMLElement>('[data-tr-action]')?.dataset.trAction;
		if (action === 'replay') play();
		else if (action === 'pause') togglePause(ui, player);
	});
	return play;
}

function togglePause(ui: Ui, player: Player | null): void {
	if (!player) return;
	const paused = ui.node.dataset.state === 'paused';
	if (paused) player.resume();
	else player.pause();
	showState(ui, paused ? 'playing' : 'paused');
}

function playOnceInView(node: HTMLElement, play: () => void): void {
	if (typeof IntersectionObserver === 'undefined') return;
	const io = new IntersectionObserver(
		(entries) => {
			if (!node.isConnected) return io.disconnect();
			if (!entries.some((e) => e.isIntersecting)) return;
			io.disconnect();
			play();
		},
		{ threshold: 0.4 },
	);
	io.observe(node);
}

function prefersReducedMotion(): boolean {
	try {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	} catch {
		return false;
	}
}

function setup(node: HTMLElement): void {
	node.dataset.replayReady = '';
	const ui = queryUi(node);
	const steps = readSteps(node);
	if (!ui || !steps || prefersReducedMotion()) return;
	const play = wireReplay(ui, buildTimeline(steps));
	playOnceInView(node, play);
}

/** Arm every not-yet-armed replay under `root` (document, or a freshly cloned template body). */
export function initReplays(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>('[data-replay]:not([data-replay-ready])').forEach(setup);
}
