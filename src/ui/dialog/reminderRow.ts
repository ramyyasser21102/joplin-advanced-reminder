import { REMINDER_FIELD_PREFIX } from '../../constants';

export const nextReminderFieldName = (list: HTMLElement): string => {
	const nextId = Number(list.dataset.nextId ?? '0');
	list.dataset.nextId = String(nextId + 1);
	return `${REMINDER_FIELD_PREFIX}${nextId}`;
};

export const buildReminderRow = (fieldName: string): HTMLDivElement => {
	const row = document.createElement('div');
	row.className = 'reminder-row';

	const input = document.createElement('input');
	input.type = 'datetime-local';
	input.name = fieldName;
	row.appendChild(input);

	const removeButton = document.createElement('button');
	removeButton.type = 'button';
	removeButton.className = 'remove-reminder';
	removeButton.textContent = 'Remove';
	row.appendChild(removeButton);

	return row;
};
