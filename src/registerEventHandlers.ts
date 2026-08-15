import joplin from 'api';
import { reconcileNoteRemindersSafely } from './reminder/reconcileNoteRemindersSafely';

export const registerEventHandlers = async (): Promise<void> => {
	await joplin.workspace.onNoteAlarmTrigger(async (event) => {
		await reconcileNoteRemindersSafely(event.noteId);
	});
};
