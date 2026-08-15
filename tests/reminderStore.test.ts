import { describe, it, expect, vi, beforeEach } from 'vitest';

const userDataStore = new Map<string, unknown>();
let nextTodoDue = 0;

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
			get: vi.fn(async () => ({ todo_due: nextTodoDue })),
		},
	},
}));

const { loadReminders, saveReminders, deleteReminders, importTodoDueReminder } = await import('../src/reminder/reminderStore');

const noteId = 'note-1';

beforeEach(() => {
	userDataStore.clear();
	nextTodoDue = 0;
});

describe('reminderStore', () => {
	it('should return an empty list when no reminders have ever been saved', async () => {
		expect(await loadReminders(noteId)).toEqual([]);
	});

	it('should round-trip reminders through save and load', async () => {
		const reminders = [{ id: 'a', at: 1000 }, { id: 'b', at: 2000 }];
		await saveReminders(noteId, reminders);
		expect(await loadReminders(noteId)).toEqual(reminders);
	});

	it('should return an empty list after reminders are deleted', async () => {
		await saveReminders(noteId, [{ id: 'a', at: 1000 }]);
		await deleteReminders(noteId);
		expect(await loadReminders(noteId)).toEqual([]);
	});

	it('should leave reminders unchanged when the note has no todo_due set', async () => {
		nextTodoDue = 0;
		await saveReminders(noteId, [{ id: 'a', at: 1000 }]);
		const result = await importTodoDueReminder(noteId);
		expect(result).toEqual([{ id: 'a', at: 1000 }]);
	});

	it('should import todo_due as a new reminder when it is not already present', async () => {
		nextTodoDue = 5000;
		await saveReminders(noteId, [{ id: 'a', at: 1000 }]);
		const result = await importTodoDueReminder(noteId);
		expect(result).toEqual([{ id: 'a', at: 1000 }, { id: 'imported-5000', at: 5000 }]);
		expect(await loadReminders(noteId)).toEqual(result);
	});

	it('should not duplicate todo_due when it matches an existing reminder time', async () => {
		nextTodoDue = 1000;
		await saveReminders(noteId, [{ id: 'a', at: 1000 }]);
		const result = await importTodoDueReminder(noteId);
		expect(result).toEqual([{ id: 'a', at: 1000 }]);
	});
});
