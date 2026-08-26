import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/utils/html';

describe('html', () => {
	it('should escape angle brackets so markup cannot be injected', () => {
		expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
	});

	it('should escape ampersands, quotes, and apostrophes', () => {
		expect(escapeHtml(`Tom & "Jerry" 'n friends`)).toBe('Tom &amp; &quot;Jerry&quot; &#39;n friends');
	});

	it('should leave plain text unchanged', () => {
		expect(escapeHtml('Bedtime prep')).toBe('Bedtime prep');
	});
});
