import { describe, it, expect, vi, beforeEach } from 'vitest';

const dataGetMock = vi.fn();
vi.mock('api', () => ({
	default: {
		data: {
			get: dataGetMock,
		},
	},
}));

const loadRemindersMock = vi.fn();
vi.mock('../src/reminder/reminderStore', () => ({
	loadReminders: loadRemindersMock,
}));

const reconcileSafelyMock = vi.fn();
vi.mock('../src/reminder/reconcileNoteRemindersSafely', () => ({
	reconcileNoteRemindersSafely: reconcileSafelyMock,
}));

const { reconcileAllNotes } = await import('../src/reminder/reminderStartupSync');

beforeEach(() => {
	dataGetMock.mockReset();
	loadRemindersMock.mockReset();
	reconcileSafelyMock.mockReset();
});

describe('reminderStartupSync', () => {
	it('should skip non-todo notes without checking their reminders', async () => {
		dataGetMock.mockResolvedValueOnce({
			items: [{ id: 'regular-note', is_todo: 0 }],
			has_more: false,
		});

		await reconcileAllNotes();

		expect(loadRemindersMock).not.toHaveBeenCalled();
		expect(reconcileSafelyMock).not.toHaveBeenCalled();
	});

	it('should skip todo notes that have no stored reminders', async () => {
		dataGetMock.mockResolvedValueOnce({
			items: [{ id: 'todo-note', is_todo: 1 }],
			has_more: false,
		});
		loadRemindersMock.mockResolvedValueOnce([]);

		await reconcileAllNotes();

		expect(reconcileSafelyMock).not.toHaveBeenCalled();
	});

	it('should reconcile todo notes that have stored reminders', async () => {
		dataGetMock.mockResolvedValueOnce({
			items: [{ id: 'todo-note', is_todo: 1 }],
			has_more: false,
		});
		loadRemindersMock.mockResolvedValueOnce([{ id: 'r1', at: 1000 }]);

		await reconcileAllNotes();

		expect(reconcileSafelyMock).toHaveBeenCalledWith('todo-note');
	});

	it('should continue paginating while has_more is true', async () => {
		dataGetMock
			.mockResolvedValueOnce({ items: [{ id: 'note-1', is_todo: 0 }], has_more: true })
			.mockResolvedValueOnce({ items: [{ id: 'note-2', is_todo: 0 }], has_more: false });

		await reconcileAllNotes();

		expect(dataGetMock).toHaveBeenCalledTimes(2);
		expect(dataGetMock.mock.calls[0][1]).toMatchObject({ page: 1 });
		expect(dataGetMock.mock.calls[1][1]).toMatchObject({ page: 2 });
	});
});
