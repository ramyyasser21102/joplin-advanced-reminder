import joplin from 'api';
import { registerCommands } from './registerCommands';
import { registerToolbar } from './registerToolbar';
import { registerEventHandlers } from './registerEventHandlers';
import { reconcileAllNotes } from './reminder/reminderStartupSync';

joplin.plugins.register({
	onStart: async () => {
		await registerCommands();
		await registerToolbar();
		await registerEventHandlers();
		await reconcileAllNotes();
	},
});
