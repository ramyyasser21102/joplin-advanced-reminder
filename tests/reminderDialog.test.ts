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
});

describe('reminderDialog', () => {
	it('should create the dialog handle only once across multiple opens (regression: create() throws on a reused handle)', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');
		openMock.mockResolvedValue({ id: 'cancel' });

		await openReminderDialog(noteId);
		await openReminderDialog(noteId);

		expect(createMock).toHaveBeenCalledTimes(1);
		expect(setHtmlMock).toHaveBeenCalledTimes(2);
		expect(setButtonsMock).toHaveBeenCalledTimes(1);
		expect(setFitToContentMock).toHaveBeenCalledTimes(1);
	});

	it('should not save anything when the dialog is cancelled', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');
		openMock.mockResolvedValue({ id: 'cancel' });

		await openReminderDialog(noteId);

		expect(userDataStore.size).toBe(0);
	});

	it('should save reminders and reconcile todo_due when the dialog is saved', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');
		openMock.mockResolvedValue({
			id: 'ok',
			formData: { reminders: { 'reminder-0': '2099-01-01T09:00' } },
		});

		await openReminderDialog(noteId);

		const saved = userDataStore.get(`${noteId}:advancedReminder.reminders.v1`) as {
			reminders: { id: string; at: number }[];
		};
		expect(saved.reminders).toHaveLength(1);
		expect(noteTodoDue.get(noteId)).toBe(saved.reminders[0].at);
	});
});
