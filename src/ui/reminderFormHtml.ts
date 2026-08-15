import { Reminder } from '../types';
import { REMINDER_FIELD_PREFIX } from '../constants';
import { formatLocalDateTime } from '../utils/dateTime';

const buildReminderRowHtml = (fieldName: string, value: string): string => `
	<div class="reminder-row">
		<input type="datetime-local" name="${fieldName}" value="${value}" />
		<button type="button" class="remove-reminder">Remove</button>
	</div>
`;

export const buildReminderFormHtml = (reminders: Reminder[], isDark: boolean): string => {
	const rows = reminders
		.map((reminder, index) => buildReminderRowHtml(`${REMINDER_FIELD_PREFIX}${index}`, formatLocalDateTime(reminder.at)))
		.join('');

	return `
		<form name="reminders" class="${isDark ? 'theme-dark' : 'theme-light'}">
			<div id="reminder-list" data-next-id="${reminders.length}">${rows}</div>
			<button type="button" id="add-reminder">Add Reminder</button>
		</form>
	`;
};
