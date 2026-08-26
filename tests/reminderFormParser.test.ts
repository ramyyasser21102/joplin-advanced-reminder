import { describe, it, expect } from 'vitest';
import { parseReminderFormData, parseBatchStagedItems, parsePresetIdsToDelete } from '../src/ui/reminderFormParser';

// Fixed reference point, always before the 2026-01-0x fixture dates below —
// keeps "is this reminder in the past" deterministic regardless of when
// the suite actually runs, per the timezone/clock-independence convention
// established in Feature 04.
const beforeFixtures = new Date(2025, 0, 1).getTime();

describe('reminderFormParser', () => {
	it('should parse valid reminder fields into reminders', () => {
		const result = parseReminderFormData({
			reminders: {
				'reminder-0': '2026-01-01T09:00',
				'reminder-1': '2026-01-02T18:30',
			},
		}, beforeFixtures);
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
		}, beforeFixtures);
		expect(result.droppedCount).toBe(0);
		expect(result.reminders).toHaveLength(1);
	});

	it('should count non-empty unparseable values as dropped', () => {
		const result = parseReminderFormData({
			reminders: {
				'reminder-0': 'not-a-date',
			},
		}, beforeFixtures);
		expect(result.droppedCount).toBe(1);
		expect(result.reminders).toEqual([]);
	});

	it('should ignore fields that are not reminder fields', () => {
		const result = parseReminderFormData({
			reminders: { 'unrelated-field': 'ignored' } as Record<string, string>,
		}, beforeFixtures);
		expect(result.reminders).toEqual([]);
		expect(result.droppedCount).toBe(0);
	});

	it('should return no reminders when the reminders form is missing entirely', () => {
		const result = parseReminderFormData({}, beforeFixtures);
		expect(result.reminders).toEqual([]);
		expect(result.droppedCount).toBe(0);
	});

	it('should drop rows with a timestamp already claimed by an earlier row and count them as duplicates', () => {
		const result = parseReminderFormData({
			reminders: {
				'reminder-0': '2026-01-01T09:00',
				'reminder-1': '2026-01-01T09:00',
				'reminder-2': '2026-01-02T10:00',
			},
		}, beforeFixtures);
		expect(result.reminders).toEqual([
			{ id: 'reminder-0', at: new Date(2026, 0, 1, 9, 0).getTime() },
			{ id: 'reminder-2', at: new Date(2026, 0, 2, 10, 0).getTime() },
		]);
		expect(result.duplicateCount).toBe(1);
		expect(result.droppedCount).toBe(0);
	});

	it('should drop rows at or before now and count them as past, not as a normal reminder', () => {
		const now = new Date(2026, 0, 5, 12, 0).getTime();
		const result = parseReminderFormData({
			reminders: {
				'reminder-0': '2026-01-01T09:00',
				'reminder-1': '2026-01-05T12:00',
				'reminder-2': '2026-01-06T09:00',
			},
		}, now);
		expect(result.reminders).toEqual([{ id: 'reminder-2', at: new Date(2026, 0, 6, 9, 0).getTime() }]);
		expect(result.pastCount).toBe(2);
		expect(result.droppedCount).toBe(0);
		expect(result.duplicateCount).toBe(0);
	});
});

describe('parseBatchStagedItems', () => {
	it('should parse a JSON array of {at,label} items', () => {
		expect(parseBatchStagedItems('[{"at":1000,"label":"After 5 min"}]')).toEqual([
			{ at: 1000, label: 'After 5 min' },
		]);
	});

	it('should return an empty array for undefined or empty input', () => {
		expect(parseBatchStagedItems(undefined)).toEqual([]);
		expect(parseBatchStagedItems('')).toEqual([]);
	});

	it('should return an empty array for malformed JSON', () => {
		expect(parseBatchStagedItems('not-json')).toEqual([]);
	});

	it('should return an empty array when the JSON is not an array', () => {
		expect(parseBatchStagedItems('{"a":1}')).toEqual([]);
	});

	it('should filter out entries missing a numeric at or a string label', () => {
		const json = JSON.stringify([
			{ at: 1000, label: 'After 5 min' },
			{ at: 'nope', label: 'After 10 min' },
			{ at: 2000, label: 42 },
			null,
		]);
		expect(parseBatchStagedItems(json)).toEqual([{ at: 1000, label: 'After 5 min' }]);
	});
});

describe('parsePresetIdsToDelete', () => {
	it('should parse a JSON array of string ids', () => {
		expect(parsePresetIdsToDelete('["preset-1","preset-2"]')).toEqual(['preset-1', 'preset-2']);
	});

	it('should return an empty array for undefined, empty, or malformed input', () => {
		expect(parsePresetIdsToDelete(undefined)).toEqual([]);
		expect(parsePresetIdsToDelete('')).toEqual([]);
		expect(parsePresetIdsToDelete('not-json')).toEqual([]);
		expect(parsePresetIdsToDelete('{"a":1}')).toEqual([]);
	});

	it('should filter out non-string or empty-string entries', () => {
		expect(parsePresetIdsToDelete('["preset-1",5,"",null]')).toEqual(['preset-1']);
	});
});
