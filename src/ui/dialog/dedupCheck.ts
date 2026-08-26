import { parseLocalDateTime } from '../../utils/dateTime';
import { isDuplicateReminder } from '../../reminder/reminderScheduler';

export const getListedTimestamps = (list: HTMLElement): number[] => {
	const inputs = list.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
	return Array.from(inputs)
		.map((input) => parseLocalDateTime(input.value))
		.filter((at): at is number => at !== null);
};

export const isTimestampAlreadyListed = (list: HTMLElement, at: number): boolean =>
	isDuplicateReminder(getListedTimestamps(list).map((existingAt) => ({ id: '', at: existingAt })), at);
