const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
};

export const escapeHtml = (text: string): string =>
	text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
