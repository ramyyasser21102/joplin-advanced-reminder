import { nextReminderFieldName, buildReminderRow } from './reminderRow';
import { formatLocalDateTime, roundToMinute } from '../../utils/dateTime';
import { QUICK_REMINDER_PRESETS } from '../../reminder/quickReminderPresets';
import { isTimestampAlreadyListed } from './dedupCheck';
import { initAdHocBatch } from './components/batchStaging';
import { initSavedPresets } from './components/presetPicker';
import { initDialogNotice, showNotice, showConfirmNotice } from './notice';

const summarizeBatchResult = (createdCount: number, skippedCount: number): string => {
	const created = `Added ${createdCount} reminder${createdCount === 1 ? '' : 's'}.`;
	if (skippedCount === 0) return created;
	return `${created} Skipped ${skippedCount} duplicate${skippedCount === 1 ? '' : 's'} already in your list.`;
};

// This script is injected via a dynamically-created <script> tag after the
// dialog's HTML content has already been set, so document has always
// already finished loading by the time this runs — DOMContentLoaded would
// never fire again and this must run immediately, not wait for it.
const list = document.getElementById('reminder-list');

if (list) {
	initDialogNotice();

	const addButton = document.getElementById('add-reminder');

	addButton?.addEventListener('click', () => {
		list.appendChild(buildReminderRow(nextReminderFieldName(list)));
	});

	const resetButton = document.getElementById('reset-reminders');
	resetButton?.addEventListener('click', async () => {
		const confirmed = await showConfirmNotice(
			'Clear all in-progress rows in this form? Anything already saved to this note is unaffected.',
			'danger',
		);
		if (!confirmed) return;
		list.innerHTML = '';
		list.appendChild(buildReminderRow(nextReminderFieldName(list)));
	});

	const addPresetRow = (rawAt: number): boolean => {
		const at = roundToMinute(rawAt);
		if (isTimestampAlreadyListed(list, at)) return false;
		list.appendChild(buildReminderRow(nextReminderFieldName(list), formatLocalDateTime(at)));
		return true;
	};

	const presetsContainer = document.getElementById('quick-add-presets');
	presetsContainer?.addEventListener('click', async (event) => {
		const target = event.target as HTMLElement;

		if (target.id === 'add-batch-reminders') {
			const confirmed = await showConfirmNotice(`Add all ${QUICK_REMINDER_PRESETS.length} quick-add presets to this note?`, 'success');
			if (!confirmed) return;

			let createdCount = 0;
			QUICK_REMINDER_PRESETS.forEach((preset) => {
				if (addPresetRow(Date.now() + preset.offsetMs)) createdCount += 1;
			});
			showNotice(summarizeBatchResult(createdCount, QUICK_REMINDER_PRESETS.length - createdCount), 'success');
			return;
		}

		const offsetMs = target.dataset.offsetMs;
		if (!offsetMs) return;
		if (!addPresetRow(Date.now() + Number(offsetMs))) {
			showNotice('That time is already in your reminders — pick a different one or check the list below.', 'error');
		}
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

	initAdHocBatch(list);
	initSavedPresets(list);
}
