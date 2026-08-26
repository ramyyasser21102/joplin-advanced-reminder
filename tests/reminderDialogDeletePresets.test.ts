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
	showMessageBoxMock.mockReset();
	showMessageBoxMock.mockResolvedValue(0);
	userDataStore.clear();
	noteTodoDue.clear();
	batchPresetsSetting = [{ id: 'preset-1', name: 'First', description: '', entries: [{ offsetMs: 60000, label: 'After 1 minute' }] }];
});

describe('reminderDialog delete-presets', () => {
	it('should delete only the selected presets when confirmed', async () => {
		batchPresetsSetting.push({ id: 'preset-2', name: 'Second', description: '', entries: [{ offsetMs: 120000, label: 'After 2 minutes' }] });
		const { openReminderDialog } = await import('../src/ui/reminderDialog');

		openMock.mockResolvedValueOnce({
			id: 'delete-presets',
			formData: { reminders: { deletePresetIds: '["preset-1"]' } },
		});

		await openReminderDialog(noteId);

		expect(batchPresetsSetting.map((preset) => (preset as { id: string }).id)).toEqual(['preset-2']);
	});

	it('should leave presets untouched when deletion is not confirmed', async () => {
		showMessageBoxMock.mockResolvedValueOnce(1);
		const { openReminderDialog } = await import('../src/ui/reminderDialog');

		openMock.mockResolvedValueOnce({
			id: 'delete-presets',
			formData: { reminders: { deletePresetIds: '["preset-1"]' } },
		});

		await openReminderDialog(noteId);

		expect(batchPresetsSetting).toHaveLength(1);
	});

	it('should warn instead of deleting when nothing is marked for deletion', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');

		openMock.mockResolvedValueOnce({
			id: 'delete-presets',
			formData: { reminders: { deletePresetIds: '[]' } },
		});

		await openReminderDialog(noteId);

		expect(batchPresetsSetting).toHaveLength(1);
		expect(showMessageBoxMock).toHaveBeenCalledWith(expect.stringContaining('Nothing is marked for deletion'));
	});
});
