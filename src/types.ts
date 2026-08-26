export interface Reminder {
	id: string;
	at: number;
}

export interface AdvancedReminderData {
	version: 1;
	reminders: Reminder[];
}

export interface BatchPresetEntry {
	offsetMs: number;
	label: string;
}

export interface BatchPreset {
	id: string;
	name: string;
	description: string;
	entries: BatchPresetEntry[];
}
