import joplin from 'api';
import { ToastType } from 'api/types';
import { reconcileNoteReminders } from './reminderReconciler';

export const reconcileNoteRemindersSafely = async (noteId: string): Promise<void> => {
	try {
		await reconcileNoteReminders(noteId);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(`Advanced Reminder: failed to reconcile reminders for note ${noteId}`, error);
		await joplin.views.dialogs.showToast({
			message: 'Advanced Reminder: failed to update a reminder. See the console for details.',
			type: ToastType.Error,
		});
	}
};
