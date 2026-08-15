import { describe, it, expect, vi, beforeEach } from 'vitest';

const onNoteAlarmTriggerMock = vi.fn();
vi.mock('api', () => ({
	default: {
		workspace: {
			onNoteAlarmTrigger: onNoteAlarmTriggerMock,
		},
	},
}));

const reconcileSafelyMock = vi.fn();
vi.mock('../src/reminder/reconcileNoteRemindersSafely', () => ({
	reconcileNoteRemindersSafely: reconcileSafelyMock,
}));

const { registerEventHandlers } = await import('../src/registerEventHandlers');

beforeEach(() => {
	onNoteAlarmTriggerMock.mockReset();
	reconcileSafelyMock.mockReset();
});

describe('registerEventHandlers', () => {
	it('should reconcile the note whose alarm just fired', async () => {
		await registerEventHandlers();
		const handler = onNoteAlarmTriggerMock.mock.calls[0][0];

		await handler({ noteId: 'note-1' });

		expect(reconcileSafelyMock).toHaveBeenCalledWith('note-1');
	});
});
