import { getDefaultSelectionMode, setDefaultSelectionMode } from '../shared/storage';
import type { SelectionMode } from '../shared/types';

const form = document.querySelector<HTMLFormElement>('#options-form');

if (!form) {
  throw new Error('Options form not found');
}

const currentMode = await getDefaultSelectionMode();
const currentInput = form.querySelector<HTMLInputElement>(`input[value="${currentMode}"]`);
if (currentInput) {
  currentInput.checked = true;
}

form.addEventListener('change', async (event) => {
  const target = event.target as HTMLInputElement;
  if (target.name !== 'mode') return;
  await setDefaultSelectionMode(target.value as SelectionMode);
});