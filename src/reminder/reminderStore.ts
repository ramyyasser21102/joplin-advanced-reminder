import joplin from 'api';
import { ModelType } from 'api/types';
import { AdvancedReminderData, Reminder } from '../types';
import { USER_DATA_KEY } from '../constants';

export const loadReminders = async (noteId: string): Promise<Reminder[]> => {
	const data = await joplin.data.userDataGet<AdvancedReminderData>(ModelType.Note, noteId, USER_DATA_KEY);
	return data?.reminders ?? [];
};

export const saveReminders = async (noteId: string, reminders: Reminder[]): Promise<void> => {
	const data: AdvancedReminderData = { version: 1, reminders };
	await joplin.data.userDataSet<AdvancedReminderData>(ModelType.Note, noteId, USER_DATA_KEY, data);
};

export const deleteReminders = async (noteId: string): Promise<void> => {
	await joplin.data.userDataDelete(ModelType.Note, noteId, USER_DATA_KEY);
};

export const importTodoDueReminder = async (noteId: string): Promise<Reminder[]> => {
	const existingData = await joplin.data.userDataGet<AdvancedReminderData>(ModelType.Note, noteId, USER_DATA_KEY);
	// Once this plugin has ever saved data for a note — including an
	// explicit empty list from the dialog's Reset button — that data is
	// authoritative. Re-importing todo_due here would resurrect a
	// reminder the user just cleared, using whatever todo_due happens to
	// hold now (which may be stale or set by an unrelated native edit).
	if (existingData !== undefined && existingData !== null) return existingData.reminders ?? [];

	const note = await joplin.data.get(['notes', noteId], { fields: ['todo_due'] });
	const todoDue: number = note.todo_due;
	if (!todoDue) return [];

	const importedReminder: Reminder = { id: `imported-${todoDue}`, at: todoDue };
	await saveReminders(noteId, [importedReminder]);
	return [importedReminder];
};
