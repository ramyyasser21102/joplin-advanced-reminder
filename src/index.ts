import joplin from 'api';
import { registerCommands } from './registerCommands';
import { registerToolbar } from './registerToolbar';
import { registerEventHandlers } from './registerEventHandlers';
import { reconcileAllNotes } from './reminder/reminderStartupSync';
import { registerBatchPresetSettings } from './reminder/batchPresetStore';

joplin.plugins.register({
	onStart: async () => {
		await registerBatchPresetSettings();
		await registerCommands();
		await registerToolbar();
		await registerEventHandlers();
		await reconcileAllNotes();
	},
});
