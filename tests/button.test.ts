import { describe, it, expect } from 'vitest';
import { buildButtonHtml } from '../src/ui/components/button';

describe('button', () => {
	it('should render the color and style as classes and the label as text content', () => {
		const html = buildButtonHtml({ label: 'Save', color: 'primary', style: 'outline' });
		expect(html).toContain('class="btn btn-primary btn-outline"');
		expect(html).toContain('>Save<');
		expect(html).toContain('type="button"');
	});

	it('should default to the filled style when none is given', () => {
		expect(buildButtonHtml({ label: 'Save', color: 'primary' })).toContain('class="btn btn-primary btn-filled"');
	});

	it('should support every color x style combination', () => {
		const colors = ['primary', 'secondary', 'danger', 'success', 'regular'] as const;
		const styles = ['filled', 'outline', 'ghost'] as const;

		for (const color of colors) {
			for (const style of styles) {
				expect(buildButtonHtml({ label: 'X', color, style })).toContain(`class="btn btn-${color} btn-${style}"`);
			}
		}
	});

	it('should omit the id attribute when none is given', () => {
		expect(buildButtonHtml({ label: 'Cancel', color: 'secondary', style: 'ghost' })).not.toContain(' id=');
	});

	it('should include the id attribute when given', () => {
		expect(buildButtonHtml({ id: 'my-button', label: 'Cancel', color: 'secondary', style: 'ghost' })).toContain('id="my-button"');
	});

	it('should render each data attribute with a data- prefix', () => {
		const html = buildButtonHtml({
			label: '5 min',
			color: 'regular',
			style: 'outline',
			dataAttributes: { 'offset-ms': '300000' },
		});
		expect(html).toContain('data-offset-ms="300000"');
	});
});
