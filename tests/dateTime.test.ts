import { describe, it, expect } from 'vitest';
import { parseLocalDateTime, formatLocalDateTime, roundToMinute } from '../src/utils/dateTime';

describe('dateTime', () => {
	it('should parse a valid datetime-local string as local time, not UTC', () => {
		const expectedTimestamp = new Date(2026, 0, 1, 14, 30).getTime();
		expect(parseLocalDateTime('2026-01-01T14:30')).toBe(expectedTimestamp);
	});

	it('should return null for a malformed datetime string', () => {
		expect(parseLocalDateTime('not-a-date')).toBeNull();
	});

	it('should return null for an empty string', () => {
		expect(parseLocalDateTime('')).toBeNull();
	});

	it('should format a timestamp as a zero-padded local datetime-local string', () => {
		const timestamp = new Date(2026, 0, 5, 9, 5).getTime();
		expect(formatLocalDateTime(timestamp)).toBe('2026-01-05T09:05');
	});

	it('should round-trip a datetime-local string through parse and format', () => {
		const original = '2026-03-09T23:45';
		const parsed = parseLocalDateTime(original);
		expect(parsed).not.toBeNull();
		expect(formatLocalDateTime(parsed as number)).toBe(original);
	});

	it('should truncate seconds and milliseconds so two timestamps in the same minute round to the same value', () => {
		const early = new Date(2026, 0, 1, 9, 0, 5, 100).getTime();
		const late = new Date(2026, 0, 1, 9, 0, 55, 900).getTime();
		expect(roundToMinute(early)).toBe(roundToMinute(late));
		expect(roundToMinute(early)).toBe(new Date(2026, 0, 1, 9, 0, 0, 0).getTime());
	});

	it('should not round two timestamps in different minutes to the same value', () => {
		const nineOhZero = new Date(2026, 0, 1, 9, 0, 30).getTime();
		const nineOhOne = new Date(2026, 0, 1, 9, 1, 0).getTime();
		expect(roundToMinute(nineOhZero)).not.toBe(roundToMinute(nineOhOne));
	});
});
