import { nextReminderFieldName, buildReminderRow } from '../reminderRow';
import { formatLocalDateTime } from '../../../utils/dateTime';
import { addRelativeDuration, formatRelativeDuration, isZeroDuration, RelativeDuration } from '../../../utils/relativeDuration';
import { isTimestampAlreadyListed } from '../dedupCheck';
import { BATCH_STAGED_FIELD_NAME } from '../../../constants';
import { showNotice } from '../notice';

interface StagedItem {
	at: number;
	duration: RelativeDuration;
}

const DURATION_UNITS: (keyof RelativeDuration)[] = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];

// Six digits already overflows Date math for the years field long before
// this limit matters (see the Number.isFinite(at) check below) — this
// just keeps the field from accumulating an arbitrarily long digit string.
const MAX_DURATION_DIGITS = 6;

const summarizeBatchResult = (createdCount: number, skippedCount: number): string => {
	const created = `Added ${createdCount} reminder${createdCount === 1 ? '' : 's'}.`;
	if (skippedCount === 0) return created;
	return `${created} Skipped ${skippedCount} duplicate${skippedCount === 1 ? '' : 's'} already in your list.`;
};

const getDurationField = (unit: keyof RelativeDuration): HTMLInputElement | null =>
	document.getElementById(`ad-hoc-batch-${unit}`) as HTMLInputElement | null;

// type="number" natively accepts "e", "+", "-", and "." as valid partial
// input (scientific notation support) even with min="0" — so "1e10" types
// cleanly despite looking nothing like a plain whole number. Stripping to
// digits-only on every keystroke (and on paste, which also fires "input")
// is the only way to actually block that at entry, rather than catching it
// downstream after the fact.
const sanitizeDurationField = (field: HTMLInputElement): void => {
	const digitsOnly = field.value.replace(/[^0-9]/g, '').slice(0, MAX_DURATION_DIGITS);
	if (digitsOnly !== field.value) field.value = digitsOnly;
};

const readDurationInputs = (): RelativeDuration | null => {
	const duration = {} as RelativeDuration;

	for (const unit of DURATION_UNITS) {
		const field = getDurationField(unit);
		if (!field) return null;
		const value = Number(field.value);
		duration[unit] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
	}

	return duration;
};

const resetDurationInputs = (): void => {
	DURATION_UNITS.forEach((unit) => {
		const field = getDurationField(unit);
		if (field) field.value = '0';
	});
};

export const initAdHocBatch = (mainList: HTMLElement): void => {
	const stageButton = document.getElementById('ad-hoc-batch-stage');
	const stagingList = document.getElementById('batch-staging-list');
	const actions = document.getElementById('batch-staging-actions') as HTMLElement | null;
	const acceptButton = document.getElementById('accept-batch');
	const cancelButton = document.getElementById('cancel-batch');
	if (!stageButton || !stagingList || !actions || !acceptButton || !cancelButton) return;

	DURATION_UNITS.forEach((unit) => {
		const field = getDurationField(unit);
		field?.addEventListener('input', () => sanitizeDurationField(field));
	});

	// Staged items only ever live in this closure's array and are rendered
	// as plain (non-form) divs below — Joplin's dialog formData is scraped
	// once from the DOM when the dialog closes, so without this hidden
	// input "Save as preset" would have no way to see what was staged.
	const hiddenTimestampsInput = document.createElement('input');
	hiddenTimestampsInput.type = 'hidden';
	hiddenTimestampsInput.name = BATCH_STAGED_FIELD_NAME;
	stagingList.insertAdjacentElement('afterend', hiddenTimestampsInput);

	let stagedItems: StagedItem[] = [];

	const renderStagingList = (): void => {
		stagingList.innerHTML = '';
		stagedItems.forEach((item, index) => {
			const row = document.createElement('div');
			row.className = 'staged-item';
			row.textContent = formatRelativeDuration(item.duration);

			const removeButton = document.createElement('button');
			removeButton.type = 'button';
			removeButton.className = 'remove-staged-item';
			removeButton.textContent = 'Remove';
			removeButton.addEventListener('click', () => {
				stagedItems.splice(index, 1);
				renderStagingList();
			});
			row.appendChild(removeButton);
			stagingList.appendChild(row);
		});
		actions.hidden = stagedItems.length === 0;
		hiddenTimestampsInput.value = JSON.stringify(
			stagedItems.map((item) => ({ at: item.at, label: formatRelativeDuration(item.duration) })),
		);
	};

	stageButton.addEventListener('click', () => {
		const duration = readDurationInputs();
		if (duration === null || isZeroDuration(duration)) {
			showNotice('Enter at least one value (years, months, days, hours, minutes, or seconds) — everything is 0 right now.', 'error');
			return;
		}

		const at = addRelativeDuration(Date.now(), duration);
		if (!Number.isFinite(at)) {
			showNotice('That duration is too large to compute a date. Try a smaller number in one of the fields.', 'error');
			return;
		}
		if (isTimestampAlreadyListed(mainList, at) || stagedItems.some((item) => item.at === at)) {
			showNotice('That time is already in your reminders or already staged below.', 'error');
			return;
		}

		stagedItems.push({ at, duration });
		resetDurationInputs();
		renderStagingList();
	});

	acceptButton.addEventListener('click', () => {
		let createdCount = 0;
		let skippedCount = 0;
		stagedItems.forEach((item) => {
			if (isTimestampAlreadyListed(mainList, item.at)) {
				skippedCount += 1;
				return;
			}
			mainList.appendChild(buildReminderRow(nextReminderFieldName(mainList), formatLocalDateTime(item.at)));
			createdCount += 1;
		});
		stagedItems = [];
		renderStagingList();
		showNotice(summarizeBatchResult(createdCount, skippedCount), 'success');
	});

	cancelButton.addEventListener('click', () => {
		stagedItems = [];
		renderStagingList();
	});
};
