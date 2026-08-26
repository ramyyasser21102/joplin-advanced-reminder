export type ButtonColor = 'primary' | 'secondary' | 'danger' | 'success' | 'regular';
export type ButtonStyle = 'filled' | 'outline' | 'ghost';

export interface ButtonHtmlOptions {
	id?: string;
	label: string;
	color: ButtonColor;
	style?: ButtonStyle;
	dataAttributes?: Record<string, string>;
}

export const buildButtonHtml = (options: ButtonHtmlOptions): string => {
	const idAttr = options.id ? ` id="${options.id}"` : '';
	const style = options.style ?? 'filled';
	const dataAttrs = Object.entries(options.dataAttributes ?? {})
		.map(([key, value]) => ` data-${key}="${value}"`)
		.join('');

	return `<button type="button" class="btn btn-${options.color} btn-${style}"${idAttr}${dataAttrs}>${options.label}</button>`;
};
