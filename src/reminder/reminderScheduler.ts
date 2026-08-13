import { Reminder } from '../types';

export const sortReminders = (reminders: Reminder[]): Reminder[] =>
	[...reminders].sort((firstReminder, secondReminder) => firstReminder.at - secondReminder.at);

export const getFutureReminders = (reminders: Reminder[], now: number): Reminder[] =>
	reminders.filter((reminder) => reminder.at > now);

export const getNextReminder = (reminders: Reminder[], now: number): Reminder | undefined =>
	sortReminders(getFutureReminders(reminders, now))[0];

export const isDuplicateReminder = (reminders: Reminder[], at: number): boolean =>
	reminders.some((reminder) => reminder.at === at);
