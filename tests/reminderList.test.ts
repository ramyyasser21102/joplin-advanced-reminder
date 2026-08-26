import { describe, it, expect } from 'vitest';
import { buildReminderListHtml } from '../src/ui/components/reminderList';

describe('reminderList', () => {
	it('should render one input row per reminder with sequential field names', () => {
		const reminders = [
			{ id: 'a', at: new Date(2026, 0, 1, 9, 0).getTime() },
			{ id: 'b', at: new Date(2026, 0, 2, 18, 30).getTime() },
		];
		const { rowsHtml, nextId } = buildReminderListHtml(reminders);

		expect(rowsHtml).toContain('name="reminder-0"');
		expect(rowsHtml).toContain('value="2026-01-01T09:00"');
		expect(rowsHtml).toContain('name="reminder-1"');
		expect(rowsHtml).toContain('value="2026-01-02T18:30"');
		expect(nextId).toBe(2);
	});

	it('should render one empty row and nextId 1 when there are no reminders', () => {
		const { rowsHtml, nextId } = buildReminderListHtml([]);
		expect(rowsHtml).toContain('name="reminder-0"');
		expect(rowsHtml).toContain('value=""');
		expect(nextId).toBe(1);
	});
});
