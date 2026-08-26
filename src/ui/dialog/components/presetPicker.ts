import { nextReminderFieldName, buildReminderRow } from '../reminderRow';
import { formatLocalDateTime, roundToMinute } from '../../../utils/dateTime';
import { isTimestampAlreadyListed } from '../dedupCheck';
import { showNotice, showConfirmNotice } from '../notice';

const summarizeApplyResult = (createdCount: number, skippedCount: number): string => {
	const created = `Added ${createdCount} reminder${createdCount === 1 ? '' : 's'} from the preset.`;
	if (skippedCount === 0) return created;
	return `${created} Skipped ${skippedCount} duplicate${skippedCount === 1 ? '' : 's'} already in your list.`;
};

const addPresetEntryRow = (mainList: HTMLElement, offsetMs: number): boolean => {
	const at = roundToMinute(Date.now() + offsetMs);
	if (isTimestampAlreadyListed(mainList, at)) return false;
	mainList.appendChild(buildReminderRow(nextReminderFieldName(mainList), formatLocalDateTime(at)));
	return true;
};

export const initSavedPresets = (mainList: HTMLElement): void => {
	const container = document.getElementById('saved-presets');
	if (!container) return;

	const deleteIdsInput = document.getElementById('delete-preset-ids') as HTMLInputElement | null;
	let markedForDeletion: string[] = [];

	container.addEventListener('click', async (event) => {
		const target = event.target as HTMLElement;

		if (target.dataset.presetRemove) {
			const presetId = target.dataset.presetId;
			if (!presetId || !deleteIdsInput) return;

			const presetBlock = target.closest('.saved-preset');
			if (markedForDeletion.includes(presetId)) {
				markedForDeletion = markedForDeletion.filter((id) => id !== presetId);
				presetBlock?.classList.remove('marked-for-deletion');
				target.textContent = 'Remove preset';
			} else {
				markedForDeletion.push(presetId);
				presetBlock?.classList.add('marked-for-deletion');
				target.textContent = 'Undo remove';
			}
			deleteIdsInput.value = JSON.stringify(markedForDeletion);
			return;
		}

		if (target.dataset.presetAddAll) {
			const offsetsJson = target.dataset.offsets;
			if (!offsetsJson) return;
			const offsetsMs: number[] = JSON.parse(offsetsJson);
			const presetName = target.dataset.presetName ?? 'this preset';
			const confirmed = await showConfirmNotice(
				`Add all ${offsetsMs.length} times from "${presetName}" to this note?`,
				'success',
			);
			if (!confirmed) return;

			let createdCount = 0;
			offsetsMs.forEach((offsetMs) => {
				if (addPresetEntryRow(mainList, offsetMs)) createdCount += 1;
			});
			showNotice(summarizeApplyResult(createdCount, offsetsMs.length - createdCount), 'success');
			return;
		}

		if (target.dataset.presetEntry) {
			const offsetMs = Number(target.dataset.offsetMs);
			if (!addPresetEntryRow(mainList, offsetMs)) {
				showNotice('That time is already in your reminders — pick a different one or check the list below.', 'error');
			}
		}
	});
};
