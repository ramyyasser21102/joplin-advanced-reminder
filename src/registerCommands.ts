import joplin from 'api';
import { ToastType } from 'api/types';
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

			try {
				await openReminderDialog(note.id);
			} catch (error) {
				// eslint-disable-next-line no-console
				console.error(`Advanced Reminder: failed to open the reminder dialog for note ${note.id}`, error);
				await joplin.views.dialogs.showToast({
					message: 'Advanced Reminder: failed to open the reminder dialog. See the console for details.',
					type: ToastType.Error,
				});
			}
		},
	});
};
