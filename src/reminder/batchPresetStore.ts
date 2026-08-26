import joplin from 'api';
import { SettingItemType } from 'api/types';
import { BatchPreset, BatchPresetEntry } from '../types';
import { BATCH_PRESETS_SETTING_KEY } from '../constants';
import { formatRelativeDuration } from '../utils/relativeDuration';

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// Presets saved before entries/description existed only stored raw
// offsetsMs. Years/months can't be reconstructed from a millisecond count
// (they aren't a fixed length), so this fallback decomposes into
// days/hours/minutes/seconds only — good enough to keep old presets
// rendering instead of crashing on a missing `entries` array.
const labelFromOffsetMs = (offsetMs: number): string => {
	let remaining = Math.max(0, Math.round(offsetMs / MS_PER_SECOND) * MS_PER_SECOND);
	const days = Math.floor(remaining / MS_PER_DAY);
	remaining -= days * MS_PER_DAY;
	const hours = Math.floor(remaining / MS_PER_HOUR);
	remaining -= hours * MS_PER_HOUR;
	const minutes = Math.floor(remaining / MS_PER_MINUTE);
	remaining -= minutes * MS_PER_MINUTE;
	const seconds = Math.floor(remaining / MS_PER_SECOND);
	return formatRelativeDuration({ years: 0, months: 0, days, hours, minutes, seconds });
};

// Settings data is raw JSON with no schema enforcement — a hand-edited
// settings file, a future bug, or a preset saved before validation existed
// could all produce an entry with a non-finite, zero, or negative
// offsetMs. Applying that blindly would silently create a reminder for
// "now" or the past (or NaN, cascading into a broken row) — so bad
// entries are dropped here, at the single point everything reads through,
// rather than trusted at every render/apply call site individually.
const isValidEntry = (entry: Partial<BatchPresetEntry>): entry is BatchPresetEntry =>
	typeof entry.offsetMs === 'number' && Number.isFinite(entry.offsetMs) && entry.offsetMs > 0
	&& typeof entry.label === 'string' && entry.label.length > 0;

const normalizeBatchPreset = (raw: Partial<BatchPreset> & { offsetsMs?: number[] }): BatchPreset => {
	const entries = raw.entries ?? (raw.offsetsMs ?? []).map((offsetMs): BatchPresetEntry => ({
		offsetMs,
		label: labelFromOffsetMs(offsetMs),
	}));

	return {
		id: raw.id ?? `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		name: raw.name ?? '',
		description: raw.description ?? '',
		entries: entries.filter(isValidEntry),
	};
};

export const registerBatchPresetSettings = async (): Promise<void> => {
	await joplin.settings.registerSettings({
		[BATCH_PRESETS_SETTING_KEY]: {
			value: [],
			type: SettingItemType.Array,
			public: false,
			label: 'Advanced Reminder batch presets',
		},
	});
};

export const loadBatchPresets = async (): Promise<BatchPreset[]> => {
	const presets = await joplin.settings.value(BATCH_PRESETS_SETTING_KEY);
	return Array.isArray(presets) ? presets.map(normalizeBatchPreset) : [];
};

export const saveBatchPreset = async (name: string, description: string, entries: BatchPresetEntry[]): Promise<void> => {
	const existingPresets = await loadBatchPresets();
	const newPreset: BatchPreset = { id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, description, entries };
	await joplin.settings.setValue(BATCH_PRESETS_SETTING_KEY, [...existingPresets, newPreset]);
};

export const deleteBatchPresets = async (presetIds: string[]): Promise<void> => {
	const existingPresets = await loadBatchPresets();
	const remainingPresets = existingPresets.filter((preset) => !presetIds.includes(preset.id));
	await joplin.settings.setValue(BATCH_PRESETS_SETTING_KEY, remainingPresets);
};
