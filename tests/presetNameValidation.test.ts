import { describe, it, expect } from 'vitest';
import { sanitizePresetName, PRESET_NAME_MAX_LENGTH } from '../src/reminder/presetNameValidation';

describe('presetNameValidation', () => {
	it('should trim surrounding whitespace from an otherwise valid name', () => {
		expect(sanitizePresetName('  Bedtime prep  ')).toBe('Bedtime prep');
	});

	it('should accept letters, numbers, spaces, and basic punctuation', () => {
		expect(sanitizePresetName(`Morning routine (v2) - 9 a.m.!`)).toBe(`Morning routine (v2) - 9 a.m.!`);
	});

	it('should reject an empty or whitespace-only name', () => {
		expect(sanitizePresetName('')).toBeNull();
		expect(sanitizePresetName('   ')).toBeNull();
	});

	it('should reject a name longer than the max length', () => {
		expect(sanitizePresetName('a'.repeat(PRESET_NAME_MAX_LENGTH + 1))).toBeNull();
	});

	it('should accept a name exactly at the max length', () => {
		const name = 'a'.repeat(PRESET_NAME_MAX_LENGTH);
		expect(sanitizePresetName(name)).toBe(name);
	});

	it('should reject names containing HTML-significant characters', () => {
		expect(sanitizePresetName('<script>alert(1)</script>')).toBeNull();
		expect(sanitizePresetName('Tom & Jerry')).toBeNull();
		expect(sanitizePresetName(`Say "hi"`)).toBeNull();
	});
});
