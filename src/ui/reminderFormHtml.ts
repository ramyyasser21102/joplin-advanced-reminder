import { Reminder } from '../types';
import { REMINDER_FIELD_PREFIX } from '../constants';
import { formatLocalDateTime } from '../utils/dateTime';
import { QUICK_REMINDER_PRESETS } from '../reminder/quickReminderPresets';

const buildReminderRowHtml = (fieldName: string, value: string): string => `
	<div class="reminder-row">
		<input type="datetime-local" name="${fieldName}" value="${value}" />
		<button type="button" class="remove-reminder">Remove</button>
	</div>
`;

const buildPresetButtonsHtml = (): string => {
	const presetButtons = QUICK_REMINDER_PRESETS
		.map((preset) => `<button type="button" class="quick-add-preset" data-offset-ms="${preset.offsetMs}">${preset.label}</button>`)
		.join('');

	return `
		<div id="quick-add-presets">
			${presetButtons}
			<button type="button" id="add-batch-reminders">Add all (batch)</button>
		</div>
	`;
};

export const buildReminderFormHtml = (reminders: Reminder[], isDark: boolean): string => {
	const rowCount = Math.max(reminders.length, 1);
	const rows = reminders.length === 0
		? buildReminderRowHtml(`${REMINDER_FIELD_PREFIX}0`, '')
		: reminders
			.map((reminder, index) => buildReminderRowHtml(`${REMINDER_FIELD_PREFIX}${index}`, formatLocalDateTime(reminder.at)))
			.join('');

	return `
		<form name="reminders" class="${isDark ? 'theme-dark' : 'theme-light'}">
			${buildPresetButtonsHtml()}
			<div id="reminder-list" data-next-id="${rowCount}">${rows}</div>
			<button type="button" id="add-reminder">Add Reminder</button>
		</form>
	`;
};
