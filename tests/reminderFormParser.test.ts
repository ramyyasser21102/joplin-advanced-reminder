import { describe, it, expect } from 'vitest';
import { parseReminderFormData } from '../src/ui/reminderFormParser';

describe('reminderFormParser', () => {
	it('should parse valid reminder fields into reminders', () => {
		const result = parseReminderFormData({
			reminders: {
				'reminder-0': '2026-01-01T09:00',
				'reminder-1': '2026-01-02T18:30',
			},
		});
		expect(result.droppedCount).toBe(0);
		expect(result.reminders).toEqual([
			{ id: 'reminder-0', at: new Date(2026, 0, 1, 9, 0).getTime() },
			{ id: 'reminder-1', at: new Date(2026, 0, 2, 18, 30).getTime() },
		]);
	});

	it('should silently skip empty rows without counting them as dropped', () => {
		const result = parseReminderFormData({
			reminders: {
				'reminder-0': '2026-01-01T09:00',
				'reminder-1': '',
			},
		});
		expect(result.droppedCount).toBe(0);
		expect(result.reminders).toHaveLength(1);
	});

	it('should count non-empty unparseable values as dropped', () => {
		const result = parseReminderFormData({
			reminders: {
				'reminder-0': 'not-a-date',
			},
		});
		expect(result.droppedCount).toBe(1);
		expect(result.reminders).toEqual([]);
	});

	it('should ignore fields that are not reminder fields', () => {
		const result = parseReminderFormData({
			reminders: { 'unrelated-field': 'ignored' } as Record<string, string>,
		});
		expect(result.reminders).toEqual([]);
		expect(result.droppedCount).toBe(0);
	});

	it('should return no reminders when the reminders form is missing entirely', () => {
		const result = parseReminderFormData({});
		expect(result.reminders).toEqual([]);
		expect(result.droppedCount).toBe(0);
	});
});
