// Start menu: toggled by the Start button, closed by Esc, outside click or item click.

function parts(): { button: HTMLElement; menu: HTMLElement } | null {
	const button = document.getElementById('start-button');
	const menu = document.getElementById('start-menu');
	return button && menu ? { button, menu } : null;
}

function isOpen(menu: HTMLElement): boolean {
	return !menu.hidden;
}

function openMenu(button: HTMLElement, menu: HTMLElement): void {
	menu.hidden = false;
	button.setAttribute('aria-expanded', 'true');
	menu.querySelector<HTMLElement>('a')?.focus();
}

function closeMenu(button: HTMLElement, menu: HTMLElement, refocus: boolean): void {
	menu.hidden = true;
	button.setAttribute('aria-expanded', 'false');
	if (refocus) button.focus();
}

function onDocumentClick(e: MouseEvent, button: HTMLElement, menu: HTMLElement): void {
	const target = e.target instanceof Element ? e.target : null;
	if (!target || !isOpen(menu)) return;
	if (target.closest('#start-button')) return;
	closeMenu(button, menu, false);
}

function onKeydown(e: KeyboardEvent, button: HTMLElement, menu: HTMLElement): void {
	if (e.key === 'Escape' && isOpen(menu)) closeMenu(button, menu, true);
}

export function initStartMenu(): void {
	const p = parts();
	if (!p) return;
	const { button, menu } = p;
	button.addEventListener('click', () => {
		if (isOpen(menu)) closeMenu(button, menu, false);
		else openMenu(button, menu);
	});
	document.addEventListener('click', (e) => onDocumentClick(e, button, menu));
	document.addEventListener('keydown', (e) => onKeydown(e, button, menu));
}
