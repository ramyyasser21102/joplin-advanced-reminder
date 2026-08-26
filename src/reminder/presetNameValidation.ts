export const PRESET_NAME_MAX_LENGTH = 60;

export const INVALID_PRESET_NAME_MESSAGE =
	`That preset name isn't valid. Use 1-${PRESET_NAME_MAX_LENGTH} characters — letters, numbers, spaces, and basic `
	+ `punctuation like . , ! ? ' ( ) -. Symbols like < > & and quotes aren't allowed.`;

// Letters/numbers (any script) plus a small set of punctuation a preset
// name would plausibly need. Deliberately excludes <, >, &, quotes, and
// backslashes — those are the characters that matter when this name is
// later interpolated into HTML (see escapeHtml, used at render time as a
// second, independent layer of defense).
const ALLOWED_PRESET_NAME_PATTERN = /^[\p{L}\p{N} .,!?'()-]+$/u;

export const sanitizePresetName = (rawName: string): string | null => {
	const trimmed = rawName.trim();
	if (trimmed.length === 0 || trimmed.length > PRESET_NAME_MAX_LENGTH) return null;
	if (!ALLOWED_PRESET_NAME_PATTERN.test(trimmed)) return null;
	return trimmed;
};

export const PRESET_DESCRIPTION_MAX_LENGTH = 200;

// Descriptions are optional and free-form (unlike names, no character
// allowlist — punctuation like colons/quotes is plausible prose). HTML
// safety comes from escapeHtml at render time instead; this only trims
// and caps length. Truncates rather than rejecting, since going over the
// cap isn't a mistake worth blocking the save over.
export const sanitizePresetDescription = (rawDescription: string): string =>
	rawDescription.trim().slice(0, PRESET_DESCRIPTION_MAX_LENGTH);
