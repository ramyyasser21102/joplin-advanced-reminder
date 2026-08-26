import joplin from 'api';
import {
	sanitizePresetName,
	sanitizePresetDescription,
	PRESET_NAME_MAX_LENGTH,
	PRESET_DESCRIPTION_MAX_LENGTH,
	INVALID_PRESET_NAME_MESSAGE,
} from '../reminder/presetNameValidation';

export interface PresetNameAndDescription {
	name: string;
	description: string;
}

let dialogHandle: string | null = null;

const getDialogHandle = async (): Promise<string> => {
	if (dialogHandle !== null) return dialogHandle;

	dialogHandle = await joplin.views.dialogs.create('advancedReminderPresetNameDialog');
	await joplin.views.dialogs.setButtons(dialogHandle, [
		{ id: 'ok', title: 'Save preset' },
		{ id: 'cancel', title: 'Cancel' },
	]);

	return dialogHandle;
};

export const promptForPresetName = async (): Promise<PresetNameAndDescription | null> => {
	const handle = await getDialogHandle();
	await joplin.views.dialogs.setHtml(handle, `
		<form name="presetName">
			<label for="preset-name-input">Preset name</label>
			<input type="text" id="preset-name-input" name="name" maxlength="${PRESET_NAME_MAX_LENGTH}" autofocus />
			<label for="preset-description-input">Description (optional)</label>
			<input type="text" id="preset-description-input" name="description" maxlength="${PRESET_DESCRIPTION_MAX_LENGTH}" />
		</form>
	`);

	const result = await joplin.views.dialogs.open(handle);
	if (result.id !== 'ok') return null;

	const rawName = result.formData?.presetName?.name ?? '';
	const sanitizedName = sanitizePresetName(rawName);
	if (sanitizedName === null && rawName.trim().length > 0) {
		await joplin.views.dialogs.showMessageBox(INVALID_PRESET_NAME_MESSAGE);
	}
	if (sanitizedName === null) return null;

	const description = sanitizePresetDescription(result.formData?.presetName?.description ?? '');
	return { name: sanitizedName, description };
};
