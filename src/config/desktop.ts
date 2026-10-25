// UI-only desktop configuration: icons, Start menu entries and default window frames.
import { links } from '../data/site';

export type IconName = 'folder' | 'user' | 'github' | 'mail' | 'ie' | 'flag' | 'doc';

export interface DesktopApp {
	id: string;
	label: string;
	icon: IconName;
	href: string;
	external: boolean;
	/** Window opened by this entry when JS is on; null for plain links. */
	windowId: string | null;
}

export interface Frame {
	x: number;
	y: number;
	w: number;
	h: number;
}

export const apps: readonly DesktopApp[] = [
	{ id: 'projects', label: 'Explorer', icon: 'ie', href: '/projects', external: false, windowId: 'projects' },
	{ id: 'about', label: 'About', icon: 'user', href: '/about', external: false, windowId: 'about' },
	{ id: 'github', label: 'GitHub.lnk', icon: 'github', href: links.github, external: true, windowId: 'github' },
	{ id: 'contact', label: 'Contact', icon: 'mail', href: '/about#contact', external: false, windowId: 'contact' },
];

export const frames: Record<string, Frame> = {
	ie: { x: 184, y: 56, w: 780, h: 540 },
	about: { x: 240, y: 80, w: 620, h: 500 },
	contact: { x: 300, y: 120, w: 440, h: 300 },
};

export const fallbackFrame: Frame = { x: 160, y: 40, w: 600, h: 440 };
