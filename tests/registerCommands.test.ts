import { describe, it, expect, vi, beforeEach } from 'vitest';

const registerMock = vi.fn();
const selectedNoteMock = vi.fn();

vi.mock('api', () => ({
	default: {
		commands: {
			register: registerMock,
		},
		workspace: {
			selectedNote: selectedNoteMock,
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
});
