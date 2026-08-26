import { describe, it, expect, vi, beforeEach } from 'vitest';

let storedPresets: unknown[] = [];
const registerSettingsMock = vi.fn(async () => {});

vi.mock('api', () => ({
	default: {
		settings: {
			registerSettings: registerSettingsMock,
			value: vi.fn(async () => storedPresets),
			setValue: vi.fn(async (_key: string, value: unknown[]) => {
				storedPresets = value;
			}),
		},
	},
}));

beforeEach(() => {
	vi.resetModules();
	registerSettingsMock.mockClear();
	storedPresets = [];
});

describe('batchPresetStore', () => {
	it('should return an empty list when no presets have been saved', async () => {
		const { loadBatchPresets } = await import('../src/reminder/batchPresetStore');
		expect(await loadBatchPresets()).toEqual([]);
	});

	it('should save a new preset with the given name, description, and entries', async () => {
		const { loadBatchPresets, saveBatchPreset } = await import('../src/reminder/batchPresetStore');

		await saveBatchPreset('Bedtime prep', 'Wind-down reminders', [
			{ offsetMs: 300000, label: 'After 5 minutes' },
			{ offsetMs: 600000, label: 'After 10 minutes' },
		]);

		const presets = await loadBatchPresets();
		expect(presets).toHaveLength(1);
		expect(presets[0]).toMatchObject({
			name: 'Bedtime prep',
			description: 'Wind-down reminders',
			entries: [
				{ offsetMs: 300000, label: 'After 5 minutes' },
				{ offsetMs: 600000, label: 'After 10 minutes' },
			],
		});
	});

	it('should append to existing presets rather than replacing them', async () => {
		const { loadBatchPresets, saveBatchPreset } = await import('../src/reminder/batchPresetStore');

		await saveBatchPreset('First', '', [{ offsetMs: 60000, label: 'After 1 minute' }]);
		await saveBatchPreset('Second', '', [{ offsetMs: 120000, label: 'After 2 minutes' }]);

		const presets = await loadBatchPresets();
		expect(presets.map((preset) => preset.name)).toEqual(['First', 'Second']);
	});

	it('should register the setting once at startup', async () => {
		const { registerBatchPresetSettings } = await import('../src/reminder/batchPresetStore');
		await registerBatchPresetSettings();
		expect(registerSettingsMock).toHaveBeenCalledTimes(1);
	});

	it('should normalize a legacy preset (offsetsMs only) into entries with decomposed labels', async () => {
		storedPresets = [{ id: 'preset-1', name: 'Legacy', offsetsMs: [90061000] }];
		const { loadBatchPresets } = await import('../src/reminder/batchPresetStore');

		const presets = await loadBatchPresets();
		expect(presets).toHaveLength(1);
		expect(presets[0].description).toBe('');
		expect(presets[0].entries).toEqual([{ offsetMs: 90061000, label: 'After 1 day, 1 hour, 1 minute, 1 second' }]);
	});

	it('should drop entries with a zero, negative, non-finite, or non-numeric offsetMs on load', async () => {
		storedPresets = [{
			id: 'preset-1',
			name: 'Corrupted',
			description: '',
			entries: [
				{ offsetMs: 60000, label: 'After 1 minute' },
				{ offsetMs: 0, label: 'After 0 seconds' },
				{ offsetMs: -60000, label: 'After -1 minute' },
				{ offsetMs: NaN, label: 'Broken' },
				{ offsetMs: 'nope', label: 'Also broken' },
				{ offsetMs: 60000, label: '' },
			],
		}];
		const { loadBatchPresets } = await import('../src/reminder/batchPresetStore');

		const presets = await loadBatchPresets();
		expect(presets[0].entries).toEqual([{ offsetMs: 60000, label: 'After 1 minute' }]);
	});

	it('should delete only the presets whose id is in the given list', async () => {
		const { loadBatchPresets, saveBatchPreset, deleteBatchPresets } = await import('../src/reminder/batchPresetStore');

		await saveBatchPreset('First', '', [{ offsetMs: 60000, label: 'After 1 minute' }]);
		await saveBatchPreset('Second', '', [{ offsetMs: 120000, label: 'After 2 minutes' }]);
		const [first, second] = await loadBatchPresets();

		await deleteBatchPresets([first.id]);

		const remaining = await loadBatchPresets();
		expect(remaining.map((preset) => preset.id)).toEqual([second.id]);
	});

	it('should be a no-op when deleting an id that does not exist', async () => {
		const { loadBatchPresets, saveBatchPreset, deleteBatchPresets } = await import('../src/reminder/batchPresetStore');

		await saveBatchPreset('First', '', [{ offsetMs: 60000, label: 'After 1 minute' }]);
		await deleteBatchPresets(['nonexistent-id']);

		expect(await loadBatchPresets()).toHaveLength(1);
	});
});
