import joplin from 'api';
import { importTodoDueReminder, saveReminders } from '../reminder/reminderStore';
import { reconcileNoteReminders } from '../reminder/reminderReconciler';
import { buildReminderFormHtml } from './reminderFormHtml';
import { parseReminderFormData } from './reminderFormParser';

export const openReminderDialog = async (noteId: string): Promise<void> => {
	const existingReminders = await importTodoDueReminder(noteId);
	const isDark = await joplin.shouldUseDarkColors();

	const handle = await joplin.views.dialogs.create('advancedReminderDialog');
	await joplin.views.dialogs.setHtml(handle, buildReminderFormHtml(existingReminders, isDark));
	await joplin.views.dialogs.addScript(handle, './ui/dialog/dialog.js');
	await joplin.views.dialogs.addScript(handle, './ui/dialog/dialog.css');
	await joplin.views.dialogs.setButtons(handle, [
		{ id: 'ok', title: 'Save' },
		{ id: 'cancel', title: 'Cancel' },
	]);

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
