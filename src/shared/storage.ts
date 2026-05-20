import browser from 'webextension-polyfill';
import type { SelectionMode } from './types';

const DEFAULT_MODE: SelectionMode = 'rectangle';
const STORAGE_KEY = 'defaultSelectionMode';
const SELECTION_MODES: SelectionMode[] = ['rectangle', 'freeform'];

function isSelectionMode(value: unknown): value is SelectionMode {
  return typeof value === 'string' && SELECTION_MODES.includes(value as SelectionMode);
}

export async function getDefaultSelectionMode(): Promise<SelectionMode> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const storedMode = result[STORAGE_KEY];
  return isSelectionMode(storedMode) ? storedMode : DEFAULT_MODE;
}

export async function setDefaultSelectionMode(mode: SelectionMode): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: mode });
}
