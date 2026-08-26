export type NoticeTone = 'success' | 'error' | 'neutral';
export type ConfirmTone = 'danger' | 'success' | 'neutral';

let resolveConfirm: ((confirmed: boolean) => void) | null = null;

const getElements = () => ({
	notice: document.getElementById('dialog-notice'),
	message: document.getElementById('dialog-notice-message'),
	actions: document.getElementById('dialog-notice-actions'),
	confirmButton: document.getElementById('dialog-notice-confirm'),
});

// Resolves any confirm still waiting on a click as "cancelled" before a new
// notice takes over the same banner — otherwise an abandoned confirm's
// promise would just hang forever.
const settleAnyPendingConfirm = (): void => {
	resolveConfirm?.(false);
	resolveConfirm = null;
};

export const initDialogNotice = (): void => {
	const { notice, actions, confirmButton } = getElements();
	const cancelButton = document.getElementById('dialog-notice-cancel');
	const dismissButton = document.getElementById('dialog-notice-dismiss');
	if (!notice || !actions || !confirmButton || !cancelButton || !dismissButton) return;

	confirmButton.addEventListener('click', () => {
		notice.hidden = true;
		resolveConfirm?.(true);
		resolveConfirm = null;
	});
	cancelButton.addEventListener('click', () => {
		notice.hidden = true;
		settleAnyPendingConfirm();
	});
	dismissButton.addEventListener('click', () => {
		notice.hidden = true;
		settleAnyPendingConfirm();
	});
};

export const showNotice = (message: string, tone: NoticeTone): void => {
	const { notice, message: messageEl, actions } = getElements();
	if (!notice || !messageEl || !actions) return;

	settleAnyPendingConfirm();
	messageEl.textContent = message;
	notice.className = `dialog-notice dialog-notice-${tone}`;
	actions.hidden = true;
	notice.hidden = false;
};

// The confirm button's color follows what's actually being confirmed —
// Reset is destructive (danger), but "Add all quick presets?" is a
// positive/additive action and showing it in alarming red would
// misrepresent it, so the color isn't hardcoded.
export const showConfirmNotice = (message: string, tone: ConfirmTone = 'neutral'): Promise<boolean> => {
	const { notice, message: messageEl, actions, confirmButton } = getElements();
	if (!notice || !messageEl || !actions || !confirmButton) return Promise.resolve(false);

	settleAnyPendingConfirm();
	messageEl.textContent = message;
	notice.className = 'dialog-notice dialog-notice-neutral';
	confirmButton.className = `btn btn-${tone} btn-filled`;
	actions.hidden = false;
	notice.hidden = false;
	return new Promise((resolve) => { resolveConfirm = resolve; });
};
