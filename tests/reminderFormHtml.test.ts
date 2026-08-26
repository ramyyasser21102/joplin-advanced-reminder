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

	it('should rename the row-add button to "Create reminder"', () => {
		expect(buildReminderFormHtml([], false)).toContain('>Create reminder<');
	});

	it('should render one quick-add preset button per preset plus a distinct batch button', () => {
		const html = buildReminderFormHtml([], false);

		expect(html).toContain('id="quick-add-presets"');
		expect(html).toContain('>5 min<');
		expect(html).toContain('>1 week<');
		expect((html.match(/data-offset-ms="/g) ?? []).length).toBe(6);
		expect(html).toContain('id="add-batch-reminders"');
		expect(html).toContain('>Add all<');
	});

	it('should render a year/month/day/hour/minute/second duration input plus a preset-name field', () => {
		const html = buildReminderFormHtml([], false);

		expect(html).toContain('id="ad-hoc-batch-years"');
		expect(html).toContain('id="ad-hoc-batch-months"');
		expect(html).toContain('id="ad-hoc-batch-days"');
		expect(html).toContain('id="ad-hoc-batch-hours"');
		expect(html).toContain('id="ad-hoc-batch-minutes"');
		expect(html).toContain('id="ad-hoc-batch-seconds"');
		expect(html).toContain('type="number"');
		expect(html).toContain('id="ad-hoc-batch-stage"');
		expect(html).toContain('id="batch-staging-list"');
		expect(html).toContain('id="batch-preset-name"');
		expect(html).toContain('name="batchPresetName"');
		expect(html).toContain('id="batch-preset-description"');
		expect(html).toContain('name="batchPresetDescription"');
		expect(html).toContain('id="accept-batch"');
		expect(html).toContain('id="cancel-batch"');
	});

	it('should render one entry chip per preset entry, plus an Add all chip, name, and description', () => {
		const html = buildReminderFormHtml([], false, [
			{
				id: 'preset-1',
				name: 'Bedtime prep',
				description: 'Wind-down reminders',
				entries: [
					{ offsetMs: 300000, label: 'After 5 minutes' },
					{ offsetMs: 600000, label: 'After 10 minutes' },
				],
			},
		]);

		expect(html).toContain('class="saved-preset-name">Bedtime prep<');
		expect(html).toContain('class="saved-preset-description">Wind-down reminders<');
		expect(html).toContain('>After 5 minutes<');
		expect(html).toContain('>After 10 minutes<');
		expect(html).toContain('data-preset-entry="true"');
		expect(html).toContain('data-offset-ms="300000"');
		expect(html).toContain('data-preset-add-all="true"');
		expect(html).toContain('data-preset-name="Bedtime prep"');
		expect(html).toContain('data-offsets="[300000,600000]"');
		expect(html).toContain('>Add all<');
	});

	it('should render the dialog notice banner as the first child of the form, hidden by default', () => {
		const html = buildReminderFormHtml([], false);
		expect(html).toContain('id="dialog-notice"');
		expect(html).toContain('id="dialog-notice-message"');
		expect(html).toContain('id="dialog-notice-actions"');
		expect(html).toContain('id="dialog-notice-confirm"');
		expect(html).toContain('id="dialog-notice-cancel"');
		expect(html).toContain('id="dialog-notice-dismiss"');
		expect(html.indexOf('id="dialog-notice"')).toBeLessThan(html.indexOf('id="quick-add-presets"'));
	});

	it('should HTML-escape a preset name and description so they cannot inject markup', () => {
		const html = buildReminderFormHtml([], false, [
			{
				id: 'preset-1',
				name: '<script>alert(1)</script>',
				description: '<img src=x onerror=alert(2)>',
				entries: [{ offsetMs: 60000, label: 'After 1 minute' }],
			},
		]);

		expect(html).not.toContain('<script>alert(1)</script>');
		expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
		expect(html).not.toContain('<img src=x onerror=alert(2)>');
		expect(html).toContain('&lt;img src=x onerror=alert(2)&gt;');
	});

	it('should render an empty-state message when no presets exist, with no delete-ids field', () => {
		const html = buildReminderFormHtml([], false);
		expect(html).toContain('saved-presets-empty');
		expect(html).not.toContain('data-preset-entry');
		expect(html).not.toContain('id="delete-preset-ids"');
	});

	it('should render a Remove button per preset and a hidden delete-ids field when presets exist', () => {
		const html = buildReminderFormHtml([], false, [
			{ id: 'preset-1', name: 'Bedtime prep', description: '', entries: [{ offsetMs: 60000, label: 'After 1 minute' }] },
		]);

		expect(html).toContain('data-preset-remove="true"');
		expect(html).toContain('data-preset-id="preset-1"');
		expect(html).toContain('>Remove preset<');
		expect(html).toContain('id="delete-preset-ids"');
		expect(html).toContain('name="deletePresetIds"');
		expect(html).toContain('value="[]"');
	});

	it('should omit the description paragraph when a preset has no description', () => {
		const html = buildReminderFormHtml([], false, [
			{ id: 'preset-1', name: 'No description', description: '', entries: [{ offsetMs: 60000, label: 'After 1 minute' }] },
		]);
		expect(html).not.toContain('saved-preset-description');
	});

	it('should render a Reset button visually distinct from "Create reminder"', () => {
		const html = buildReminderFormHtml([], false);
		expect(html).toContain('class="btn btn-primary btn-filled" id="add-reminder">Create reminder<');
		expect(html).toContain('class="btn btn-danger btn-outline" id="reset-reminders">Reset<');
	});

	it('should give Reset and Remove preset the same danger button style', () => {
		const html = buildReminderFormHtml([], false, [
			{ id: 'preset-1', name: 'Test', description: '', entries: [{ offsetMs: 60000, label: 'After 1 minute' }] },
		]);
		const dangerButtonClass = 'class="btn btn-danger btn-outline"';
		expect(html).toContain(`${dangerButtonClass} id="reset-reminders">Reset<`);
		expect((html.match(new RegExp(dangerButtonClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length).toBe(2);
	});
});
