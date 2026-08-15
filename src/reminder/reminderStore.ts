import joplin from 'api';
import { ModelType } from 'api/types';
import { AdvancedReminderData, Reminder } from '../types';
import { USER_DATA_KEY } from '../constants';
import { isDuplicateReminder } from './reminderScheduler';

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
	const note = await joplin.data.get(['notes', noteId], { fields: ['todo_due'] });
	const todoDue: number = note.todo_due;

	const existingReminders = await loadReminders(noteId);
	if (!todoDue || isDuplicateReminder(existingReminders, todoDue)) {
		return existingReminders;
	}

	const importedReminder: Reminder = { id: `imported-${todoDue}`, at: todoDue };
	const mergedReminders = [...existingReminders, importedReminder];
	await saveReminders(noteId, mergedReminders);
	return mergedReminders;
};
