import { Reminder } from '../types';
import { REMINDER_FIELD_PREFIX } from '../constants';
import { parseLocalDateTime } from '../utils/dateTime';

export interface ParsedReminderForm {
	reminders: Reminder[];
	droppedCount: number;
}

export const parseReminderFormData = (formData: { reminders?: Record<string, string> }): ParsedReminderForm => {
	const fields = formData?.reminders ?? {};
	const reminders: Reminder[] = [];
	let droppedCount = 0;

	for (const [fieldName, value] of Object.entries(fields)) {
		if (!fieldName.startsWith(REMINDER_FIELD_PREFIX)) continue;

		const at = parseLocalDateTime(value);
		if (at === null) {
			if (value) droppedCount += 1;
			continue;
		}

		reminders.push({ id: fieldName, at });
	}

	return { reminders, droppedCount };
};
