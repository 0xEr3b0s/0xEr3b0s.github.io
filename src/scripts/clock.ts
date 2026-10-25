// Tray clock: HH:MM, refreshed on the minute boundary.

const FALLBACK_DELAY_MS = 60_000;
let timer: ReturnType<typeof setTimeout> | undefined;

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

function render(el: HTMLTimeElement): number {
	const now = new Date();
	el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
	el.dateTime = now.toISOString();
	return (60 - now.getSeconds()) * 1000;
}

function tick(el: HTMLTimeElement): void {
	let delay = FALLBACK_DELAY_MS;
	try {
		delay = render(el);
	} catch {
		el.textContent = '';
	} finally {
		clearTimeout(timer);
		if (el.isConnected) timer = setTimeout(() => tick(el), delay);
	}
}

export function startClock(): void {
	const el = document.getElementById('clock');
	if (el instanceof HTMLTimeElement) tick(el);
}
