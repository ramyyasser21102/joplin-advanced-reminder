import { nextReminderFieldName, buildReminderRow } from './reminderRow';

// This script is injected via a dynamically-created <script> tag after the
// dialog's HTML content has already been set, so document has always
// already finished loading by the time this runs — DOMContentLoaded would
// never fire again and this must run immediately, not wait for it.
const list = document.getElementById('reminder-list');

if (list) {
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
}
