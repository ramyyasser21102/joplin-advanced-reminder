import { describe, it, expect } from 'vitest';
import { sortReminders, getFutureReminders, getNextReminder, isDuplicateReminder } from '../src/reminder/reminderScheduler';
import { Reminder } from '../src/types';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const now = Date.UTC(2026, 0, 1, 12, 0, 0);

const buildReminder = (id: string, at: number): Reminder => ({ id, at });

describe('reminderScheduler', () => {
	it('should sort reminders chronologically when given an unordered list', () => {
		const reminders = [
			buildReminder('afternoon', now + ONE_HOUR_IN_MS * 3),
			buildReminder('morning', now - ONE_HOUR_IN_MS * 3),
			buildReminder('evening', now + ONE_HOUR_IN_MS * 6),
		];
		expect(sortReminders(reminders).map((reminder) => reminder.id)).toEqual(['morning', 'afternoon', 'evening']);
	});

	it('should exclude reminders at or before now when filtering future reminders', () => {
		const reminders = [
			buildReminder('past', now - ONE_HOUR_IN_MS),
			buildReminder('exactlyNow', now),
			buildReminder('future', now + ONE_HOUR_IN_MS),
		];
		expect(getFutureReminders(reminders, now).map((reminder) => reminder.id)).toEqual(['future']);
	});

	it('should return the earliest future reminder when several exist', () => {
		const reminders = [
			buildReminder('tomorrow', now + ONE_HOUR_IN_MS * 24),
			buildReminder('soonest', now + ONE_HOUR_IN_MS),
			buildReminder('yesterday', now - ONE_HOUR_IN_MS * 24),
		];
		expect(getNextReminder(reminders, now)?.id).toBe('soonest');
	});

	it('should return undefined when no future reminder exists', () => {
		expect(getNextReminder([buildReminder('yesterday', now - ONE_HOUR_IN_MS * 24)], now)).toBeUndefined();
	});

	it('should detect a duplicate reminder time', () => {
		const reminders = [buildReminder('existing', now + ONE_HOUR_IN_MS)];
		expect(isDuplicateReminder(reminders, now + ONE_HOUR_IN_MS)).toBe(true);
		expect(isDuplicateReminder(reminders, now + ONE_HOUR_IN_MS * 2)).toBe(false);
	});
});
