import { describe, it, expect, vi, beforeEach } from 'vitest';

const createMock = vi.fn(async () => 'handle-1');
const setHtmlMock = vi.fn(async () => '');
const addScriptMock = vi.fn(async () => {});
const setButtonsMock = vi.fn(async () => []);
const setFitToContentMock = vi.fn(async () => true);
const openMock = vi.fn();
const showMessageBoxMock = vi.fn(async () => 0);

const userDataStore = new Map<string, unknown>();
const noteTodoDue = new Map<string, number>();
let batchPresetsSetting: unknown[] = [];

vi.mock('api', () => ({
	default: {
		shouldUseDarkColors: vi.fn(async () => false),
		views: {
			dialogs: {
				create: createMock,
				setHtml: setHtmlMock,
				addScript: addScriptMock,
				setButtons: setButtonsMock,
				setFitToContent: setFitToContentMock,
				open: openMock,
				showMessageBox: showMessageBoxMock,
			},
		},
		settings: {
			value: vi.fn(async () => batchPresetsSetting),
			setValue: vi.fn(async (_key: string, value: unknown[]) => {
				batchPresetsSetting = value;
			}),
		},
		data: {
			userDataGet: vi.fn(async (_itemType: number, itemId: string, key: string) =>
				userDataStore.get(`${itemId}:${key}`)),
			userDataSet: vi.fn(async (_itemType: number, itemId: string, key: string, value: unknown) => {
				userDataStore.set(`${itemId}:${key}`, value);
			}),
			userDataDelete: vi.fn(async (_itemType: number, itemId: string, key: string) => {
				userDataStore.delete(`${itemId}:${key}`);
			}),
			get: vi.fn(async (path: string[]) => ({ todo_due: noteTodoDue.get(path[1]) ?? 0 })),
			put: vi.fn(async (path: string[], _query: unknown, body: { todo_due: number }) => {
				noteTodoDue.set(path[1], body.todo_due);
			}),
		},
	},
}));

const noteId = 'note-1';

beforeEach(() => {
	vi.resetModules();
	createMock.mockClear();
	setHtmlMock.mockClear();
	addScriptMock.mockClear();
	setButtonsMock.mockClear();
	setFitToContentMock.mockClear();
	openMock.mockReset();
	showMessageBoxMock.mockClear();
	userDataStore.clear();
	noteTodoDue.clear();
	batchPresetsSetting = [];
});

describe('reminderDialog clear-all', () => {
	it('should delete every saved reminder and reconcile todo_due to 0 when Clear all is confirmed', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');
		const { saveReminders } = await import('../src/reminder/reminderStore');
		await saveReminders(noteId, [{ id: 'a', at: 5000 }]);
		noteTodoDue.set(noteId, 5000);
		showMessageBoxMock.mockResolvedValueOnce(0);

		openMock.mockResolvedValueOnce({ id: 'clear-all' });

		await openReminderDialog(noteId);

		const saved = userDataStore.get(`${noteId}:advancedReminder.reminders.v1`) as { reminders: unknown[] };
		expect(saved.reminders).toEqual([]);
		expect(noteTodoDue.get(noteId)).toBe(0);
	});

	it('should leave saved reminders untouched when Clear all is not confirmed', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');
		const { saveReminders } = await import('../src/reminder/reminderStore');
		await saveReminders(noteId, [{ id: 'a', at: 5000 }]);
		noteTodoDue.set(noteId, 5000);
		showMessageBoxMock.mockResolvedValueOnce(1);

		openMock.mockResolvedValueOnce({ id: 'clear-all' });

		await openReminderDialog(noteId);

		const saved = userDataStore.get(`${noteId}:advancedReminder.reminders.v1`) as { reminders: unknown[] };
		expect(saved.reminders).toHaveLength(1);
		expect(noteTodoDue.get(noteId)).toBe(5000);
	});

	it('should show an informational message and skip the confirm when there is nothing to clear', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');
		openMock.mockResolvedValueOnce({ id: 'clear-all' });

		await openReminderDialog(noteId);

		expect(showMessageBoxMock).toHaveBeenCalledWith(expect.stringContaining('no saved reminders'));
		expect(showMessageBoxMock).toHaveBeenCalledTimes(1);
	});
});
