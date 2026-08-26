import { Reminder, BatchPreset } from '../types';
import { buildButtonHtml } from './components/button';
import { buildButtonGroupHtml } from './components/buttonGroup';
import { buildReminderListHtml } from './components/reminderList';
import { QUICK_REMINDER_PRESETS } from '../reminder/quickReminderPresets';
import { PRESET_NAME_MAX_LENGTH, PRESET_DESCRIPTION_MAX_LENGTH } from '../reminder/presetNameValidation';
import { escapeHtml } from '../utils/html';

const buildQuickAddGroupHtml = (): string => {
	const presetButtons = QUICK_REMINDER_PRESETS
		.map((preset) => buildButtonHtml({
			label: preset.label,
			color: 'regular',
			style: 'outline',
			dataAttributes: { 'offset-ms': String(preset.offsetMs) },
		}))
		.join('');
	const addAllButton = buildButtonHtml({ id: 'add-batch-reminders', label: 'Add all', color: 'success' });

	return buildButtonGroupHtml({
		id: 'quick-add-presets',
		heading: 'Quick add',
		description: 'Add a single preset reminder, or add all of them at once.',
		bodyHtml: `${presetButtons}${addAllButton}`,
	});
};

const DURATION_UNITS: { id: string; label: string }[] = [
	{ id: 'years', label: 'Year(s)' },
	{ id: 'months', label: 'Month(s)' },
	{ id: 'days', label: 'Day(s)' },
	{ id: 'hours', label: 'Hour(s)' },
	{ id: 'minutes', label: 'Minute(s)' },
	{ id: 'seconds', label: 'Second(s)' },
];

const buildDurationInputsHtml = (): string => DURATION_UNITS
	.map(({ id, label }) => `
		<label class="duration-field">
			<span>${label}</span>
			<input type="number" id="ad-hoc-batch-${id}" min="0" value="0" />
		</label>
	`)
	.join('');

const buildAdHocBatchGroupHtml = (): string => {
	const bodyHtml = `
		<div class="ad-hoc-batch-input-row">
			${buildDurationInputsHtml()}
			${buildButtonHtml({ id: 'ad-hoc-batch-stage', label: 'Stage reminder', color: 'regular', style: 'outline' })}
		</div>
		<div id="batch-staging-list" class="batch-staging-list"></div>
		<div class="batch-preset-name-row">
			<input
				type="text"
				id="batch-preset-name"
				name="batchPresetName"
				maxlength="${PRESET_NAME_MAX_LENGTH}"
				placeholder="Name this batch to save it as a reusable preset (optional)"
			/>
			<input
				type="text"
				id="batch-preset-description"
				name="batchPresetDescription"
				maxlength="${PRESET_DESCRIPTION_MAX_LENGTH}"
				placeholder="Description (optional)"
			/>
		</div>
		<div id="batch-staging-actions" class="batch-staging-actions" hidden>
			${buildButtonHtml({ id: 'accept-batch', label: 'Accept batch', color: 'success' })}
			${buildButtonHtml({ id: 'cancel-batch', label: 'Cancel batch', color: 'secondary', style: 'ghost' })}
		</div>
	`;

	return buildButtonGroupHtml({
		id: 'ad-hoc-batch',
		heading: 'Custom batch',
		description: 'Enter how long from now (years/months/days/hours/minutes/seconds), stage it, then accept or cancel the whole batch at once. Name a batch here and use "Save as preset" below to save it — staged items only, not the Reminders list.',
		bodyHtml,
	});
};

const buildSavedPresetBlockHtml = (preset: BatchPreset): string => {
	const descriptionHtml = preset.description
		? `<p class="saved-preset-description">${escapeHtml(preset.description)}</p>`
		: '';
	const entryButtons = preset.entries
		.map((entry) => buildButtonHtml({
			label: entry.label,
			color: 'regular',
			style: 'outline',
			dataAttributes: { 'preset-entry': 'true', 'offset-ms': String(entry.offsetMs) },
		}))
		.join('');
	const addAllButton = buildButtonHtml({
		label: 'Add all',
		color: 'success',
		dataAttributes: {
			'preset-add-all': 'true',
			'preset-name': escapeHtml(preset.name),
			offsets: JSON.stringify(preset.entries.map((entry) => entry.offsetMs)),
		},
	});
	const removeButton = buildButtonHtml({
		label: 'Remove preset',
		color: 'danger',
		style: 'outline',
		dataAttributes: { 'preset-remove': 'true', 'preset-id': preset.id },
	});

	return `
		<div class="saved-preset" data-preset-id="${preset.id}">
			<div class="saved-preset-header">
				<span class="saved-preset-name">${escapeHtml(preset.name)}</span>
				${removeButton}
			</div>
			${descriptionHtml}
			<div class="saved-preset-entries">${entryButtons}${addAllButton}</div>
		</div>
	`;
};

const buildSavedPresetsGroupHtml = (batchPresets: BatchPreset[]): string => {
	const bodyHtml = batchPresets.length === 0
		? '<p class="saved-presets-empty">No saved presets yet — build one in Custom batch above and use "Save as preset".</p>'
		: `${batchPresets.map(buildSavedPresetBlockHtml).join('')}<input type="hidden" id="delete-preset-ids" name="deletePresetIds" value="[]" />`;

	return buildButtonGroupHtml({
		id: 'saved-presets',
		heading: 'Saved presets',
		description: batchPresets.length === 0
			? 'Click a time to add just that reminder, or "Add all" for the whole preset.'
			: 'Click a time to add just that reminder, or "Add all" for the whole preset. "Remove preset" marks it for deletion — confirm with "Delete selected presets" below.',
		bodyHtml,
	});
};

const buildReminderGroupHtml = (reminders: Reminder[]): string => {
	const { rowsHtml, nextId } = buildReminderListHtml(reminders);
	const bodyHtml = `
		<div id="reminder-list" data-next-id="${nextId}">${rowsHtml}</div>
		<div class="reminder-list-actions">
			${buildButtonHtml({ id: 'add-reminder', label: 'Create reminder', color: 'primary' })}
			${buildButtonHtml({ id: 'reset-reminders', label: 'Reset', color: 'danger', style: 'outline' })}
		</div>
	`;

	return buildButtonGroupHtml({
		id: 'reminders',
		heading: 'Reminders',
		description: 'Reset clears these in-progress rows before you hit Save. Use "Clear all" below to delete reminders already saved for this note.',
		bodyHtml,
	});
};

const buildDialogNoticeHtml = (): string => `
	<div id="dialog-notice" class="dialog-notice" hidden>
		<p id="dialog-notice-message"></p>
		<div id="dialog-notice-actions" class="dialog-notice-actions" hidden>
			${buildButtonHtml({ id: 'dialog-notice-confirm', label: 'Confirm', color: 'danger' })}
			${buildButtonHtml({ id: 'dialog-notice-cancel', label: 'Cancel', color: 'secondary', style: 'ghost' })}
		</div>
		<button type="button" class="dialog-notice-dismiss" id="dialog-notice-dismiss" aria-label="Dismiss">&times;</button>
	</div>
`;

export const buildReminderFormHtml = (reminders: Reminder[], isDark: boolean, batchPresets: BatchPreset[] = []): string => `
	<form name="reminders" class="${isDark ? 'theme-dark' : 'theme-light'}">
		${buildDialogNoticeHtml()}
		${buildQuickAddGroupHtml()}
		${buildAdHocBatchGroupHtml()}
		${buildSavedPresetsGroupHtml(batchPresets)}
		${buildReminderGroupHtml(reminders)}
	</form>
`;
