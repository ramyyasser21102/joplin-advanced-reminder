import joplin from 'api';
import { loadReminders } from './reminderStore';
import { reconcileNoteRemindersSafely } from './reconcileNoteRemindersSafely';

const NOTES_PAGE_LIMIT = 100;

interface NoteListItem {
	id: string;
	is_todo: number;
}

interface NoteListPage {
	items: NoteListItem[];
	has_more: boolean;
}

export const reconcileAllNotes = async (): Promise<void> => {
	let page = 1;
	let hasMore = true;

	while (hasMore) {
		const response: NoteListPage = await joplin.data.get(['notes'], {
			fields: ['id', 'is_todo'],
			limit: NOTES_PAGE_LIMIT,
			page,
		});

		for (const note of response.items) {
			if (!note.is_todo) continue;

			const reminders = await loadReminders(note.id);
			if (reminders.length === 0) continue;

			await reconcileNoteRemindersSafely(note.id);
		}

		hasMore = response.has_more;
		page += 1;
	}
};
