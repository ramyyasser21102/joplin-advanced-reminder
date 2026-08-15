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
