import { describe, it, expect, vi, beforeEach } from 'vitest';

const showToastMock = vi.fn(async () => {});

vi.mock('api', () => ({
	default: {
		views: {
			dialogs: {
				showToast: showToastMock,
			},
		},
	},
}));

const reconcileNoteRemindersMock = vi.fn();
vi.mock('../src/reminder/reminderReconciler', () => ({
	reconcileNoteReminders: reconcileNoteRemindersMock,
}));

const { reconcileNoteRemindersSafely } = await import('../src/reminder/reconcileNoteRemindersSafely');

beforeEach(() => {
	showToastMock.mockClear();
	reconcileNoteRemindersMock.mockReset();
});

describe('reconcileNoteRemindersSafely', () => {
	it('should resolve without showing a toast when reconciliation succeeds', async () => {
		reconcileNoteRemindersMock.mockResolvedValue(0);
		await expect(reconcileNoteRemindersSafely('note-1')).resolves.toBeUndefined();
		expect(showToastMock).not.toHaveBeenCalled();
	});

	it('should catch a reconciliation failure and show an error toast instead of throwing', async () => {
		reconcileNoteRemindersMock.mockRejectedValue(new Error('boom'));
		await expect(reconcileNoteRemindersSafely('note-1')).resolves.toBeUndefined();
		expect(showToastMock).toHaveBeenCalledTimes(1);
		expect(showToastMock.mock.calls[0][0]).toMatchObject({ type: 'error' });
	});
});
