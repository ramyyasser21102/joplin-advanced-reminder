import joplin from 'api';
import { MANAGE_COMMAND } from './constants';
import { openReminderDialog } from './ui/reminderDialog';

export const registerCommands = async (): Promise<void> => {
	await joplin.commands.register({
		name: MANAGE_COMMAND,
		label: 'Manage reminders',
		iconName: 'fas fa-bell',
		enabledCondition: 'noteIsTodo',
		execute: async () => {
			const note = await joplin.workspace.selectedNote();
			if (!note) return;
			await openReminderDialog(note.id);
		},
	});
};
