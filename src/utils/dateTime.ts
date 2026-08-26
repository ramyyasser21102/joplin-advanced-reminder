export const parseLocalDateTime = (localDateTime: string): number | null => {
	const date = new Date(localDateTime);
	if (Number.isNaN(date.getTime())) return null;
	return date.getTime();
};

export const formatLocalDateTime = (timestamp: number): string => {
	const date = new Date(timestamp);
	const pad = (value: number): string => String(value).padStart(2, '0');

	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());

	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// datetime-local inputs (and everything stored/compared as a Reminder.at)
// only carry minute resolution. Computed candidates like Date.now() +
// offsetMs still carry seconds/ms, so comparing them against listed values
// without this round-trip almost never matches — the seconds/ms component
// makes an otherwise-identical minute look unique.
export const roundToMinute = (timestamp: number): number => {
	const formatted = formatLocalDateTime(timestamp);
	const parsed = parseLocalDateTime(formatted);
	return parsed === null ? timestamp : parsed;
};
