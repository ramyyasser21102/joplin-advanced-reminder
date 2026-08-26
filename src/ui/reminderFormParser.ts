import { Reminder } from '../types';
import { REMINDER_FIELD_PREFIX } from '../constants';
import { parseLocalDateTime } from '../utils/dateTime';
import { isDuplicateReminder } from '../reminder/reminderScheduler';

export interface ParsedReminderForm {
	reminders: Reminder[];
	droppedCount: number;
	duplicateCount: number;
	pastCount: number;
}

export const parseReminderFormData = (
	formData: { reminders?: Record<string, string> },
	now: number = Date.now(),
): ParsedReminderForm => {
	const fields = formData?.reminders ?? {};
	const reminders: Reminder[] = [];
	let droppedCount = 0;
	let duplicateCount = 0;
	let pastCount = 0;

	for (const [fieldName, value] of Object.entries(fields)) {
		if (!fieldName.startsWith(REMINDER_FIELD_PREFIX)) continue;

		const at = parseLocalDateTime(value);
		if (at === null) {
			if (value) droppedCount += 1;
			continue;
		}

		if (at <= now) {
			pastCount += 1;
			continue;
		}

		if (isDuplicateReminder(reminders, at)) {
			duplicateCount += 1;
			continue;
		}

		reminders.push({ id: fieldName, at });
	}

	return { reminders, droppedCount, duplicateCount, pastCount };
};

export interface StagedBatchItem {
	at: number;
	label: string;
}

const isStagedBatchItem = (value: unknown): value is StagedBatchItem => {
	if (typeof value !== 'object' || value === null) return false;
	const candidate = value as Record<string, unknown>;
	return typeof candidate.at === 'number' && Number.isFinite(candidate.at) && typeof candidate.label === 'string';
};

export const parseBatchStagedItems = (raw: string | undefined): StagedBatchItem[] => {
	if (!raw) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}
	if (!Array.isArray(parsed)) return [];
	return parsed.filter(isStagedBatchItem);
};

export const parsePresetIdsToDelete = (raw: string | undefined): string[] => {
	if (!raw) return [];
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}
	if (!Array.isArray(parsed)) return [];
	return parsed.filter((value): value is string => typeof value === 'string' && value.length > 0);
};
