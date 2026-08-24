import { nextReminderFieldName, buildReminderRow } from './reminderRow';
import { formatLocalDateTime } from '../../utils/dateTime';
import { QUICK_REMINDER_PRESETS } from '../../reminder/quickReminderPresets';

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

	const addPresetRow = (offsetMs: number): void => {
		const value = formatLocalDateTime(Date.now() + offsetMs);
		list.appendChild(buildReminderRow(nextReminderFieldName(list), value));
	};

	const presetsContainer = document.getElementById('quick-add-presets');
	presetsContainer?.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;

		if (target.id === 'add-batch-reminders') {
			const confirmed = window.confirm(`Add ${QUICK_REMINDER_PRESETS.length} preset reminders?`);
			if (!confirmed) return;
			QUICK_REMINDER_PRESETS.forEach((preset) => addPresetRow(preset.offsetMs));
			return;
		}

		const offsetMs = target.dataset.offsetMs;
		if (offsetMs) addPresetRow(Number(offsetMs));
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
