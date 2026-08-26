import { describe, it, expect } from 'vitest';
import { addRelativeDuration, formatRelativeDuration, isZeroDuration, RelativeDuration } from '../src/utils/relativeDuration';

const ZERO: RelativeDuration = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

describe('addRelativeDuration', () => {
	it('should add each unit using calendar-correct arithmetic', () => {
		const base = new Date(2026, 0, 1, 9, 0, 0).getTime();
		const result = addRelativeDuration(base, { ...ZERO, years: 1, months: 2, days: 3, hours: 4, minutes: 5, seconds: 6 });
		expect(result).toBe(new Date(2027, 2, 4, 13, 5, 6).getTime());
	});

	it('should handle a zero duration as a no-op', () => {
		const base = new Date(2026, 0, 1, 9, 0, 0).getTime();
		expect(addRelativeDuration(base, ZERO)).toBe(base);
	});

	it('should correctly cross a leap-year February boundary', () => {
		const base = new Date(2028, 1, 28, 0, 0, 0).getTime();
		const result = addRelativeDuration(base, { ...ZERO, days: 1 });
		expect(result).toBe(new Date(2028, 1, 29, 0, 0, 0).getTime());
	});
});

describe('formatRelativeDuration', () => {
	it('should render a single non-zero unit in singular form', () => {
		expect(formatRelativeDuration({ ...ZERO, days: 1 })).toBe('After 1 day');
	});

	it('should render a single non-zero unit in plural form', () => {
		expect(formatRelativeDuration({ ...ZERO, days: 2 })).toBe('After 2 days');
	});

	it('should join multiple non-zero units and skip zero units', () => {
		expect(formatRelativeDuration({ ...ZERO, years: 1, days: 3, minutes: 30 })).toBe('After 1 year, 3 days, 30 minutes');
	});

	it('should fall back to a zero-second label when every unit is zero', () => {
		expect(formatRelativeDuration(ZERO)).toBe('After 0 seconds');
	});
});

describe('isZeroDuration', () => {
	it('should be true only when every unit is zero', () => {
		expect(isZeroDuration(ZERO)).toBe(true);
		expect(isZeroDuration({ ...ZERO, seconds: 1 })).toBe(false);
	});
});
