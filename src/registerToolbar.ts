import joplin from 'api';
import { ToolbarButtonLocation } from 'api/types';
import { MANAGE_COMMAND } from './constants';

export const registerToolbar = async (): Promise<void> => {
	await joplin.views.toolbarButtons.create('advancedReminderToolbarButton', MANAGE_COMMAND, ToolbarButtonLocation.NoteToolbar);
};
