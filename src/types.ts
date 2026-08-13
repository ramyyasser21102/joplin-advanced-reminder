export interface Reminder {
	id: string;
	at: number;
}

export interface AdvancedReminderData {
	version: 1;
	reminders: Reminder[];
}
