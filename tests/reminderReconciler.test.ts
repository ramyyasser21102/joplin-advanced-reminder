import { describe, it, expect, vi, beforeEach } from 'vitest';

const userDataStore = new Map<string, unknown>();
const noteTodoDue = new Map<string, number>();

const putMock = vi.fn(async (path: string[], _query: unknown, body: { todo_due: number }) => {
	noteTodoDue.set(path[1], body.todo_due);
});

vi.mock('api', () => ({
	default: {
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
			put: putMock,
		},
	},
}));

const { saveReminders } = await import('../src/reminder/reminderStore');
const { reconcileNoteReminders } = await import('../src/reminder/reminderReconciler');

const noteId = 'note-1';
const HOUR = 60 * 60 * 1000;
const now = Date.UTC(2026, 0, 1, 12, 0, 0);

beforeEach(() => {
	userDataStore.clear();
	noteTodoDue.clear();
	putMock.mockClear();
});

describe('reminderReconciler', () => {
	it('should set todo_due to the earliest future reminder when it differs from the current value', async () => {
		await saveReminders(noteId, [
			{ id: 'later', at: now + HOUR * 3 },
			{ id: 'soonest', at: now + HOUR },
		]);
		const result = await reconcileNoteReminders(noteId, now);
		expect(result).toBe(now + HOUR);
		expect(noteTodoDue.get(noteId)).toBe(now + HOUR);
		expect(putMock).toHaveBeenCalledTimes(1);
	});

	it('should not call put when todo_due already matches the earliest future reminder', async () => {
		await saveReminders(noteId, [{ id: 'soonest', at: now + HOUR }]);
		noteTodoDue.set(noteId, now + HOUR);
		const result = await reconcileNoteReminders(noteId, now);
		expect(result).toBe(now + HOUR);
		expect(putMock).not.toHaveBeenCalled();
	});

	it('should clear todo_due to 0 when no future reminders remain', async () => {
		await saveReminders(noteId, [{ id: 'past', at: now - HOUR }]);
		noteTodoDue.set(noteId, now - HOUR);
		const result = await reconcileNoteReminders(noteId, now);
		expect(result).toBe(0);
		expect(noteTodoDue.get(noteId)).toBe(0);
		expect(putMock).toHaveBeenCalledTimes(1);
	});

	it('should not call put when already 0 and no future reminders remain', async () => {
		await saveReminders(noteId, [{ id: 'past', at: now - HOUR }]);
		noteTodoDue.set(noteId, 0);
		const result = await reconcileNoteReminders(noteId, now);
		expect(result).toBe(0);
		expect(putMock).not.toHaveBeenCalled();
	});

	it('should promote to the next-earliest reminder once the current one is in the past', async () => {
		await saveReminders(noteId, [
			{ id: 'morning', at: now - HOUR },
			{ id: 'afternoon', at: now + HOUR * 2 },
			{ id: 'evening', at: now + HOUR * 6 },
		]);
		noteTodoDue.set(noteId, now - HOUR);
		const result = await reconcileNoteReminders(noteId, now);
		expect(result).toBe(now + HOUR * 2);
	});
});
