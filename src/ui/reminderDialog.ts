import joplin from 'api';
import { importTodoDueReminder, saveReminders } from '../reminder/reminderStore';
import { reconcileNoteReminders } from '../reminder/reminderReconciler';
import { buildReminderFormHtml } from './reminderFormHtml';
import { parseReminderFormData } from './reminderFormParser';

let dialogHandle: string | null = null;

const getDialogHandle = async (): Promise<string> => {
	if (dialogHandle !== null) return dialogHandle;

	dialogHandle = await joplin.views.dialogs.create('advancedReminderDialog');
	await joplin.views.dialogs.addScript(dialogHandle, './ui/dialog/dialog.js');
	await joplin.views.dialogs.addScript(dialogHandle, './ui/dialog/dialog.css');
	await joplin.views.dialogs.setButtons(dialogHandle, [
		{ id: 'ok', title: 'Save' },
		{ id: 'cancel', title: 'Cancel' },
	]);
	// Fit-to-content sizes the dialog by measuring rendered content, which
	// raced with our CSS loading and produced a clipped, padding-less
	// layout. A fixed 90vw/80vh canvas sidesteps that measurement entirely.
	await joplin.views.dialogs.setFitToContent(dialogHandle, false);

	return dialogHandle;
};

export const openReminderDialog = async (noteId: string): Promise<void> => {
	const existingReminders = await importTodoDueReminder(noteId);
	const isDark = await joplin.shouldUseDarkColors();

	const handle = await getDialogHandle();
	await joplin.views.dialogs.setHtml(handle, buildReminderFormHtml(existingReminders, isDark));

	const result = await joplin.views.dialogs.open(handle);
	if (result.id !== 'ok') return;

	const { reminders, droppedCount } = parseReminderFormData(result.formData);
	await saveReminders(noteId, reminders);
	await reconcileNoteReminders(noteId);

	if (droppedCount > 0) {
		const plural = droppedCount === 1 ? 'time was' : 'times were';
		await joplin.views.dialogs.showMessageBox(`${droppedCount} reminder ${plural} not understood and skipped.`);
	}
};
