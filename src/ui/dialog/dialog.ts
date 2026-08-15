import { nextReminderFieldName, buildReminderRow } from './reminderRow';

document.addEventListener('DOMContentLoaded', () => {
	const list = document.getElementById('reminder-list');
	if (!list) return;

	const addButton = document.getElementById('add-reminder');

	addButton?.addEventListener('click', () => {
		list.appendChild(buildReminderRow(nextReminderFieldName(list)));
	});

	list.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;
		if (target.classList.contains('remove-reminder')) {
			target.closest('.reminder-row')?.remove();
		}
	});

	list.addEventListener('blur', (event) => {
		const target = event.target as HTMLElement;
		if (target instanceof HTMLInputElement && target.type === 'datetime-local') {
			target.classList.toggle('empty', target.value === '');
		}
	}, true);
});
