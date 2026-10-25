// DOM side of window placement: writes the --x/--y/--w/--h custom properties.
import { fallbackFrameSize } from './frames';
import { capWidth, clampPosition, type Point } from './position';

export function setPosition(el: HTMLElement, p: Point): void {
	el.style.setProperty('--x', `${Math.round(p.x)}px`);
	el.style.setProperty('--y', `${Math.round(p.y)}px`);
}

function setWidth(el: HTMLElement, layerWidth: number): void {
	const wanted = Number(el.dataset.w) || fallbackFrameSize.w;
	el.style.setProperty('--w', `${capWidth(wanted, layerWidth)}px`);
}

export function clampWindow(el: HTMLElement): void {
	const layer = el.parentElement;
	if (!layer || el.hidden) return;
	setWidth(el, layer.clientWidth);
	const bounds = { x: layer.clientWidth, y: layer.clientHeight };
	const size = { x: el.offsetWidth, y: el.offsetHeight };
	setPosition(el, clampPosition({ x: el.offsetLeft, y: el.offsetTop }, size, bounds));
}

export function applyFrame(el: HTMLElement, offset: number): void {
	const d = el.dataset;
	el.style.setProperty('--h', `${Number(d.h) || fallbackFrameSize.h}px`);
	setWidth(el, el.parentElement?.clientWidth ?? fallbackFrameSize.w);
	setPosition(el, { x: (Number(d.x) || 0) + offset, y: (Number(d.y) || 0) + offset });
}
