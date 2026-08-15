import { describe, it, expect, vi, beforeEach } from 'vitest';

const registerMock = vi.fn();
const selectedNoteMock = vi.fn();
const showToastMock = vi.fn(async () => {});

vi.mock('api', () => ({
	default: {
		commands: {
			register: registerMock,
		},
		workspace: {
			selectedNote: selectedNoteMock,
		},
		views: {
			dialogs: {
				showToast: showToastMock,
			},
		},
	},
}));

const openReminderDialogMock = vi.fn();
vi.mock('../src/ui/reminderDialog', () => ({
	openReminderDialog: openReminderDialogMock,
}));

const { registerCommands } = await import('../src/registerCommands');

beforeEach(() => {
	registerMock.mockReset();
	selectedNoteMock.mockReset();
	openReminderDialogMock.mockReset();
	showToastMock.mockClear();
});

describe('registerCommands', () => {
	it('should register the manage command enabled only for todo notes', async () => {
		await registerCommands();
		const command = registerMock.mock.calls[0][0];
		expect(command.name).toBe('advancedReminder.manage');
		expect(command.enabledCondition).toBe('noteIsTodo');
	});

	it('should open the dialog for the selected note when executed', async () => {
		await registerCommands();
		const command = registerMock.mock.calls[0][0];
		selectedNoteMock.mockResolvedValue({ id: 'note-1' });

		await command.execute();

		expect(openReminderDialogMock).toHaveBeenCalledWith('note-1');
	});

	it('should do nothing when executed with no note selected', async () => {
		await registerCommands();
		const command = registerMock.mock.calls[0][0];
		selectedNoteMock.mockResolvedValue(null);

		await command.execute();

		expect(openReminderDialogMock).not.toHaveBeenCalled();
	});

	it('should catch a dialog failure and show an error toast instead of failing silently', async () => {
		await registerCommands();
		const command = registerMock.mock.calls[0][0];
		selectedNoteMock.mockResolvedValue({ id: 'note-1' });
		openReminderDialogMock.mockRejectedValue(new Error('boom'));

		await expect(command.execute()).resolves.toBeUndefined();

		expect(showToastMock).toHaveBeenCalledTimes(1);
		expect(showToastMock.mock.calls[0][0]).toMatchObject({ type: 'error' });
	});
});
