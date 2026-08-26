export interface RelativeDuration {
	years: number;
	months: number;
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

const UNIT_LABELS: { key: keyof RelativeDuration; singular: string }[] = [
	{ key: 'years', singular: 'year' },
	{ key: 'months', singular: 'month' },
	{ key: 'days', singular: 'day' },
	{ key: 'hours', singular: 'hour' },
	{ key: 'minutes', singular: 'minute' },
	{ key: 'seconds', singular: 'second' },
];

export const isZeroDuration = (duration: RelativeDuration): boolean =>
	UNIT_LABELS.every(({ key }) => duration[key] === 0);

// Calendar-correct addition (via Date setters) rather than flat
// millisecond multiplication — years and months don't have a fixed
// length, so "add 1 month" has to mean "advance the calendar month,"
// not "add 30 days."
export const addRelativeDuration = (base: number, duration: RelativeDuration): number => {
	const date = new Date(base);
	date.setFullYear(date.getFullYear() + duration.years);
	date.setMonth(date.getMonth() + duration.months);
	date.setDate(date.getDate() + duration.days);
	date.setHours(date.getHours() + duration.hours);
	date.setMinutes(date.getMinutes() + duration.minutes);
	date.setSeconds(date.getSeconds() + duration.seconds);
	return date.getTime();
};

export const formatRelativeDuration = (duration: RelativeDuration): string => {
	const parts = UNIT_LABELS
		.filter(({ key }) => duration[key] > 0)
		.map(({ key, singular }) => `${duration[key]} ${singular}${duration[key] === 1 ? '' : 's'}`);

	if (parts.length === 0) return 'After 0 seconds';
	return `After ${parts.join(', ')}`;
};
