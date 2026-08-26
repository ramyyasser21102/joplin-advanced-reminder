import { describe, it, expect } from 'vitest';
import { buildButtonGroupHtml } from '../src/ui/components/buttonGroup';

describe('buttonGroup', () => {
	it('should render the heading and the body html', () => {
		const html = buildButtonGroupHtml({ heading: 'Quick add', bodyHtml: '<button>5 min</button>' });
		expect(html).toContain('>Quick add<');
		expect(html).toContain('<button>5 min</button>');
	});

	it('should omit the description paragraph when none is given', () => {
		expect(buildButtonGroupHtml({ heading: 'Quick add', bodyHtml: '' })).not.toContain('group-description');
	});

	it('should render the description paragraph when given', () => {
		const html = buildButtonGroupHtml({ heading: 'Quick add', description: 'Add a preset.', bodyHtml: '' });
		expect(html).toContain('class="group-description"');
		expect(html).toContain('Add a preset.');
	});

	it('should apply the given id to the group section', () => {
		expect(buildButtonGroupHtml({ id: 'quick-add-presets', heading: 'Quick add', bodyHtml: '' }))
			.toContain('id="quick-add-presets"');
	});
});
