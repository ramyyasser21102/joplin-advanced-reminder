export interface QuickReminderPreset {
	label: string;
	offsetMs: number;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const QUICK_REMINDER_PRESETS: QuickReminderPreset[] = [
	{ label: '5 min', offsetMs: 5 * MINUTE_MS },
	{ label: '10 min', offsetMs: 10 * MINUTE_MS },
	{ label: '30 min', offsetMs: 30 * MINUTE_MS },
	{ label: '1 hour', offsetMs: HOUR_MS },
	{ label: '1 day', offsetMs: DAY_MS },
	{ label: '1 week', offsetMs: 7 * DAY_MS },
];
