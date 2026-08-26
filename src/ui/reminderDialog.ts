import joplin from 'api';
import { importTodoDueReminder, saveReminders, loadReminders } from '../reminder/reminderStore';
import { loadBatchPresets, saveBatchPreset, deleteBatchPresets } from '../reminder/batchPresetStore';
import { BatchPresetEntry } from '../types';
import { sanitizePresetName, sanitizePresetDescription, INVALID_PRESET_NAME_MESSAGE } from '../reminder/presetNameValidation';
import { reconcileNoteReminders } from '../reminder/reminderReconciler';
import { BATCH_STAGED_FIELD_NAME } from '../constants';
import { buildReminderFormHtml } from './reminderFormHtml';
import { parseReminderFormData, parseBatchStagedItems, parsePresetIdsToDelete } from './reminderFormParser';
import { promptForPresetName, PresetNameAndDescription } from './presetNameDialog';

type ReminderFormData = { reminders?: Record<string, string> };

let dialogHandle: string | null = null;

const getDialogHandle = async (): Promise<string> => {
	if (dialogHandle !== null) return dialogHandle;

	dialogHandle = await joplin.views.dialogs.create('advancedReminderDialog');
	await joplin.views.dialogs.addScript(dialogHandle, './ui/dialog/dialog.js');
	await joplin.views.dialogs.addScript(dialogHandle, './ui/dialog/dialog.css');
	await joplin.views.dialogs.addScript(dialogHandle, './ui/dialog/dialog-batch.css');
	await joplin.views.dialogs.addScript(dialogHandle, './ui/dialog/dialog-buttons.css');
	await joplin.views.dialogs.addScript(dialogHandle, './ui/dialog/dialog-theme.css');
	await joplin.views.dialogs.setButtons(dialogHandle, [
		{ id: 'ok', title: 'Save' },
		{ id: 'save-preset', title: 'Save custom batch as preset' },
		{ id: 'delete-presets', title: 'Delete selected presets' },
		{ id: 'clear-all', title: 'Clear all' },
		{ id: 'cancel', title: 'Cancel' },
	]);
	// Fit-to-content sizes the dialog by measuring rendered content, which
	// raced with our CSS loading and produced a clipped, padding-less
	// layout. A fixed 90vw/80vh canvas sidesteps that measurement entirely.
	await joplin.views.dialogs.setFitToContent(dialogHandle, false);

	return dialogHandle;
};

const resolvePresetNameAndDescription = async (formData: ReminderFormData): Promise<PresetNameAndDescription | null> => {
	const inlineName = formData.reminders?.batchPresetName ?? '';
	if (inlineName.trim().length === 0) return promptForPresetName();

	const sanitizedName = sanitizePresetName(inlineName);
	if (sanitizedName === null) {
		await joplin.views.dialogs.showMessageBox(INVALID_PRESET_NAME_MESSAGE);
		return null;
	}

	const description = sanitizePresetDescription(formData.reminders?.batchPresetDescription ?? '');
	return { name: sanitizedName, description };
};

const saveCurrentListAsPreset = async (formData: unknown): Promise<void> => {
	const typedFormData = formData as ReminderFormData;
	const stagedItems = parseBatchStagedItems(typedFormData.reminders?.[BATCH_STAGED_FIELD_NAME]);
	if (stagedItems.length === 0) {
		await joplin.views.dialogs.showMessageBox(
			'Add at least one time in "Custom batch" first, then use "Save as preset" again.',
		);
		return;
	}

	const nameAndDescription = await resolvePresetNameAndDescription(typedFormData);
	if (nameAndDescription === null) return;

	const now = Date.now();
	const entries: BatchPresetEntry[] = stagedItems.map((item) => ({ offsetMs: item.at - now, label: item.label }));
	await saveBatchPreset(nameAndDescription.name, nameAndDescription.description, entries);
};

const deleteSelectedPresets = async (formData: unknown): Promise<void> => {
	const typedFormData = formData as ReminderFormData;
	const presetIds = parsePresetIdsToDelete(typedFormData.reminders?.deletePresetIds);
	if (presetIds.length === 0) {
		await joplin.views.dialogs.showMessageBox(
			'Nothing is marked for deletion yet. Click "Remove preset" next to the preset(s) you want to delete, then try this again.',
		);
		return;
	}

	const plural = presetIds.length === 1 ? '' : 's';
	const confirmedButtonIndex = await joplin.views.dialogs.showMessageBox(
		`Delete ${presetIds.length} preset${plural}? This can't be undone.`,
	);
	if (confirmedButtonIndex !== 0) return;

	await deleteBatchPresets(presetIds);
};

const clearAllReminders = async (noteId: string): Promise<void> => {
	const existingReminders = await loadReminders(noteId);
	if (existingReminders.length === 0) {
		await joplin.views.dialogs.showMessageBox('This note has no saved reminders to clear.');
		return;
	}

	const plural = existingReminders.length === 1 ? '' : 's';
	const confirmedButtonIndex = await joplin.views.dialogs.showMessageBox(
		`Delete all ${existingReminders.length} saved reminder${plural} for this note? This can't be undone.`,
	);
	if (confirmedButtonIndex !== 0) return;

	await saveReminders(noteId, []);
	await reconcileNoteReminders(noteId);
};

export const openReminderDialog = async (noteId: string): Promise<void> => {
	const existingReminders = await importTodoDueReminder(noteId);
	const batchPresets = await loadBatchPresets();
	const isDark = await joplin.shouldUseDarkColors();

	const handle = await getDialogHandle();
	await joplin.views.dialogs.setHtml(handle, buildReminderFormHtml(existingReminders, isDark, batchPresets));

	const result = await joplin.views.dialogs.open(handle);
	if (result.id === 'save-preset') {
		await saveCurrentListAsPreset(result.formData);
		return;
	}
	if (result.id === 'delete-presets') {
		await deleteSelectedPresets(result.formData);
		return;
	}
	if (result.id === 'clear-all') {
		await clearAllReminders(noteId);
		return;
	}
	if (result.id !== 'ok') return;

	const { reminders, droppedCount, duplicateCount, pastCount } = parseReminderFormData(result.formData);
	await saveReminders(noteId, reminders);
	await reconcileNoteReminders(noteId);

	const warnings: string[] = [];
	if (droppedCount > 0) {
		const plural = droppedCount === 1 ? "time wasn't" : "times weren't";
		warnings.push(`• ${droppedCount} reminder ${plural} understood, so ${droppedCount === 1 ? 'it was' : 'they were'} skipped.`);
	}
	if (pastCount > 0) {
		const plural = pastCount === 1 ? 'reminder is' : 'reminders are';
		warnings.push(`• ${pastCount} ${plural} for a time already in the past, so ${pastCount === 1 ? 'it was' : 'they were'} removed.`);
	}
	if (duplicateCount > 0) {
		const plural = duplicateCount === 1 ? 'reminder' : 'reminders';
		warnings.push(`• ${duplicateCount} duplicate ${plural} already in the list, so ${duplicateCount === 1 ? 'it was' : 'they were'} skipped.`);
	}
	if (warnings.length > 0) {
		const heading = warnings.length === 1
			? 'Saved, with one thing to know:'
			: `Saved, with ${warnings.length} things to know:`;
		await joplin.views.dialogs.showMessageBox(`${heading}\n${warnings.join('\n')}`);
	}
};
