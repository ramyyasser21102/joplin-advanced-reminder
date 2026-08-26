export interface ButtonGroupHtmlOptions {
	id?: string;
	heading: string;
	description?: string;
	bodyHtml: string;
}

export const buildButtonGroupHtml = (options: ButtonGroupHtmlOptions): string => {
	const idAttr = options.id ? ` id="${options.id}"` : '';
	const descriptionHtml = options.description ? `<p class="group-description">${options.description}</p>` : '';

	return `
		<section class="dialog-group"${idAttr}>
			<h3 class="group-heading">${options.heading}</h3>
			${descriptionHtml}
			<div class="group-body">${options.bodyHtml}</div>
		</section>
	`;
};
