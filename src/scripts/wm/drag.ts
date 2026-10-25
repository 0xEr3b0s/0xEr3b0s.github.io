// Title bar dragging with pointer events, clamped inside the windows layer.
import { isDesktopWidth } from '../dom';
import { setPosition } from './place';
import { clampPosition, type Point } from './position';

interface Grab {
	el: HTMLElement;
	layer: HTMLElement;
	bar: HTMLElement;
	pointerId: number;
	grab: Point;
	origin: Point;
}

let current: Grab | null = null;

function canDrag(el: HTMLElement): boolean {
	return isDesktopWidth() && !el.classList.contains('is-max') && !!el.parentElement;
}

function makeGrab(e: PointerEvent, el: HTMLElement, bar: HTMLElement): Grab | null {
	const layer = el.parentElement;
	if (!layer) return null;
	const rect = el.getBoundingClientRect();
	const lrect = layer.getBoundingClientRect();
	return {
		el, layer, bar,
		pointerId: e.pointerId,
		grab: { x: e.clientX - rect.left, y: e.clientY - rect.top },
		origin: { x: lrect.left, y: lrect.top },
	};
}

function stopDrag(): void {
	if (!current) return;
	try {
		current.bar.releasePointerCapture(current.pointerId);
	} catch {
		// capture already released
	}
	current.bar.removeEventListener('pointermove', onMove);
	current.bar.removeEventListener('pointerup', onEnd);
	current.bar.removeEventListener('pointercancel', onEnd);
	current = null;
}

function onEnd(e: PointerEvent): void {
	if (current && e.pointerId === current.pointerId) stopDrag();
}

function onMove(e: PointerEvent): void {
	const g = current;
	if (!g || e.pointerId !== g.pointerId) return;
	if (!canDrag(g.el)) return stopDrag();
	const size = { x: g.el.offsetWidth, y: g.el.offsetHeight };
	const bounds = { x: g.layer.clientWidth, y: g.layer.clientHeight };
	const raw = { x: e.clientX - g.origin.x - g.grab.x, y: e.clientY - g.origin.y - g.grab.y };
	setPosition(g.el, clampPosition(raw, size, bounds));
}

export function startDrag(e: PointerEvent, el: HTMLElement, bar: HTMLElement): void {
	if (current || e.button !== 0 || !canDrag(el)) return;
	const g = makeGrab(e, el, bar);
	if (!g) return;
	current = g;
	bar.setPointerCapture(e.pointerId);
	bar.addEventListener('pointermove', onMove);
	bar.addEventListener('pointerup', onEnd);
	bar.addEventListener('pointercancel', onEnd);
}
