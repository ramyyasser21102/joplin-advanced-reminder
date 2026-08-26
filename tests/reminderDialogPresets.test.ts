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

describe('reminderDialog save-as-preset', () => {
	it('should save a named batch preset from staged custom-batch timestamps, without saving reminders to the note', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');

		openMock
			.mockResolvedValueOnce({
				id: 'save-preset',
				formData: { reminders: { 'reminder-0': '2099-01-01T09:00', batchStagedTimestamps: '[{"at":4102444800000,"label":"After 1 year"}]' } },
			})
			.mockResolvedValueOnce({ id: 'ok', formData: { presetName: { name: 'Bedtime prep' } } });

		await openReminderDialog(noteId);

		expect(userDataStore.size).toBe(0);
		expect(batchPresetsSetting).toHaveLength(1);
		const saved = batchPresetsSetting[0] as { name: string; entries: { offsetMs: number; label: string }[] };
		expect(saved.name).toBe('Bedtime prep');
		expect(saved.entries[0].label).toBe('After 1 year');
	});

	it('should save a preset using the inline custom-batch name and description fields, without opening the naming dialog', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');

		openMock.mockResolvedValueOnce({
			id: 'save-preset',
			formData: {
				reminders: {
					batchStagedTimestamps: '[{"at":4102444800000,"label":"After 1 year"}]',
					batchPresetName: 'Bedtime prep',
					batchPresetDescription: 'Wind-down reminders',
				},
			},
		});

		await openReminderDialog(noteId);

		expect(openMock).toHaveBeenCalledTimes(1);
		expect(batchPresetsSetting).toHaveLength(1);
		const saved = batchPresetsSetting[0] as { name: string; description: string };
		expect(saved.name).toBe('Bedtime prep');
		expect(saved.description).toBe('Wind-down reminders');
	});

	it('should reject an invalid inline preset name and not save it', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');

		openMock.mockResolvedValueOnce({
			id: 'save-preset',
			formData: {
				reminders: {
					batchStagedTimestamps: '[{"at":4102444800000,"label":"After 1 year"}]',
					batchPresetName: '<script>bad</script>',
				},
			},
		});

		await openReminderDialog(noteId);

		expect(openMock).toHaveBeenCalledTimes(1);
		expect(batchPresetsSetting).toHaveLength(0);
		expect(showMessageBoxMock).toHaveBeenCalledWith(expect.stringContaining("preset name isn't valid"));
	});

	it('should ignore the main Reminders list when saving a preset, and require a staged custom batch instead', async () => {
		const { openReminderDialog } = await import('../src/ui/reminderDialog');

		openMock.mockResolvedValueOnce({
			id: 'save-preset',
			formData: { reminders: { 'reminder-0': '2099-01-01T09:00' } },
		});

		await openReminderDialog(noteId);

		expect(openMock).toHaveBeenCalledTimes(1);
		expect(batchPresetsSetting).toHaveLength(0);
		expect(showMessageBoxMock).toHaveBeenCalledWith(expect.stringContaining('Custom batch'));
	});
});
