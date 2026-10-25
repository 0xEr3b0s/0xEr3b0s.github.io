// Taskbar buttons: one per open or minimized window.
import { getActiveId, type Managed } from './registry';

function bar(): HTMLElement | null {
	return document.getElementById('taskbar-windows');
}

function buttonFor(id: string): HTMLButtonElement | null {
	const buttons = bar()?.querySelectorAll<HTMLButtonElement>('button[data-task-window]') ?? [];
	return Array.from(buttons).find((b) => b.dataset.taskWindow === id) ?? null;
}

function buildButton(m: Managed): HTMLButtonElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'task-button';
	button.dataset.taskWindow = m.id;
	const icon = m.el.querySelector('.xp-titlebar .xp-icon');
	if (icon) button.append(icon.cloneNode(true));
	const label = document.createElement('span');
	label.className = 'task-label';
	label.textContent = m.el.dataset.label ?? m.id;
	button.append(label);
	return button;
}

export function addTaskButton(m: Managed): void {
	if (buttonFor(m.id)) return;
	bar()?.append(buildButton(m));
}

export function removeTaskButton(id: string): void {
	buttonFor(id)?.remove();
}

export function setTaskLabel(m: Managed): void {
	const label = buttonFor(m.id)?.querySelector('.task-label');
	if (label) label.textContent = m.el.dataset.label ?? m.id;
}

export function refreshTaskbar(): void {
	const active = getActiveId();
	bar()
		?.querySelectorAll<HTMLButtonElement>('button[data-task-window]')
		.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.taskWindow === active)));
}
