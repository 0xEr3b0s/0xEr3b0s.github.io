// Pure geometry for window placement. No imports: unit-tested under node:test.

export interface Point {
	x: number;
	y: number;
}

/** Keep a window of size `win` fully inside `bounds`. */
export function clampPosition(p: Point, win: Point, bounds: Point): Point {
	const maxX = Math.max(0, bounds.x - win.x);
	const maxY = Math.max(0, bounds.y - win.y);
	return { x: Math.min(Math.max(0, p.x), maxX), y: Math.min(Math.max(0, p.y), maxY) };
}

/** A window can never be wider than the layer that holds it. */
export function capWidth(width: number, layerWidth: number): number {
	return Math.max(0, Math.min(width, layerWidth));
}
