// Pure formatting helpers for the GitHub pages. No imports: unit-tested under node:test.

/** CSS class for a language dot: "C++" -> "lang-cpp", "Shell" -> "lang-shell". */
export function langClass(language: string): string {
	const slug = language.toLowerCase().replace(/\+/g, 'p').replace(/[^a-z0-9]/g, '');
	return `lang-${slug || 'other'}`;
}

/** YYYY-MM-DD from an ISO timestamp, or the input unchanged when it is not one. */
export function shortDate(iso: string): string {
	return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : iso;
}

/** Heading level after demotion by one; h6 stays h6. */
export function demotedLevel(level: number): number {
	return Math.min(6, Math.max(1, level) + 1);
}

function plural(n: number, unit: string): string {
	return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
}

/** "3 days ago" style age of an ISO timestamp relative to `now`; the input unchanged if unparsable. */
export function relativeAge(iso: string, now: Date): string {
	const then = Date.parse(iso);
	if (Number.isNaN(then)) return iso;
	const secs = Math.max(0, Math.floor((now.getTime() - then) / 1000));
	if (secs < 60) return 'just now';
	const steps: [number, string][] = [[60, 'minute'], [3600, 'hour'], [86400, 'day'], [2592000, 'month'], [31536000, 'year']];
	let unit = steps[0]!;
	for (const s of steps) if (secs >= s[0]) unit = s;
	return plural(Math.floor(secs / unit[0]), unit[1]);
}
