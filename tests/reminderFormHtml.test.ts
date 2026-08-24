import { describe, it, expect } from 'vitest';
import { buildReminderFormHtml } from '../src/ui/reminderFormHtml';

describe('reminderFormHtml', () => {
	it('should render one input row per existing reminder with sequential field names', () => {
		const reminders = [
			{ id: 'a', at: new Date(2026, 0, 1, 9, 0).getTime() },
			{ id: 'b', at: new Date(2026, 0, 2, 18, 30).getTime() },
		];
		const html = buildReminderFormHtml(reminders, false);

		expect(html).toContain('name="reminder-0"');
		expect(html).toContain('value="2026-01-01T09:00"');
		expect(html).toContain('name="reminder-1"');
		expect(html).toContain('value="2026-01-02T18:30"');
		expect(html).toContain('data-next-id="2"');
	});

	it('should render one empty row when there are no reminders, rather than a blank form', () => {
		const html = buildReminderFormHtml([], false);
		expect(html).toContain('name="reminder-0"');
		expect(html).toContain('value=""');
		expect(html).toContain('data-next-id="1"');
	});

	it('should apply the dark theme class when isDark is true', () => {
		expect(buildReminderFormHtml([], true)).toContain('theme-dark');
		expect(buildReminderFormHtml([], false)).toContain('theme-light');
	});

	it('should render one quick-add preset button per preset plus a batch button', () => {
		const html = buildReminderFormHtml([], false);

		expect(html).toContain('id="quick-add-presets"');
		expect(html).toContain('>5 min<');
		expect(html).toContain('>1 week<');
		expect((html.match(/class="quick-add-preset"/g) ?? []).length).toBe(6);
		expect(html).toContain('id="add-batch-reminders"');
	});
});
