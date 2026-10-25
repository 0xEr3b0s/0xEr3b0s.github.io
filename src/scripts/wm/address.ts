// Pure address-bar parsing. Only dependency is the pure token cleaner.
import { cleanToken } from '../dom.ts';

export type AddressTarget = { kind: 'index' } | { kind: 'project'; id: string } | { kind: 'unknown' };

function lastSegment(raw: string): string {
	const path = (raw.split(/[?#]/)[0] ?? '').trim().replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '');
	return path.split('/').filter(Boolean).pop() ?? '';
}

/** Map what the user typed to a page. `isKnown` says whether a project id exists. */
export function parseAddress(raw: string, isKnown: (id: string) => boolean): AddressTarget {
	const token = cleanToken(lastSegment(raw));
	if (token === '' || token === 'projects') return { kind: 'index' };
	return isKnown(token) ? { kind: 'project', id: token } : { kind: 'unknown' };
}
