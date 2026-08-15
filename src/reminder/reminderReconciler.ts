import joplin from 'api';
import { loadReminders } from './reminderStore';
import { getNextReminder } from './reminderScheduler';

export const reconcileNoteReminders = async (noteId: string, now: number = Date.now()): Promise<number> => {
	const reminders = await loadReminders(noteId);
	const nextReminder = getNextReminder(reminders, now);
	const targetTodoDue = nextReminder?.at ?? 0;

	const note = await joplin.data.get(['notes', noteId], { fields: ['todo_due'] });
	if (note.todo_due !== targetTodoDue) {
		await joplin.data.put(['notes', noteId], null, { todo_due: targetTodoDue });
	}

	return targetTodoDue;
};
