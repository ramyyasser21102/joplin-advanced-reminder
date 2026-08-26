import { Reminder } from '../../types';
import { REMINDER_FIELD_PREFIX } from '../../constants';
import { formatLocalDateTime } from '../../utils/dateTime';

export interface ReminderListHtml {
	rowsHtml: string;
	nextId: number;
}

const buildReminderRowHtml = (fieldName: string, value: string): string => `
	<div class="reminder-row">
		<input type="datetime-local" name="${fieldName}" value="${value}" />
		<button type="button" class="remove-reminder">Remove</button>
	</div>
`;

export const buildReminderListHtml = (reminders: Reminder[]): ReminderListHtml => {
	const nextId = Math.max(reminders.length, 1);
	const rowsHtml = reminders.length === 0
		? buildReminderRowHtml(`${REMINDER_FIELD_PREFIX}0`, '')
		: reminders
			.map((reminder, index) => buildReminderRowHtml(`${REMINDER_FIELD_PREFIX}${index}`, formatLocalDateTime(reminder.at)))
			.join('');

	return { rowsHtml, nextId };
};
