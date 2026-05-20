import browser from 'webextension-polyfill';
import type { SelectionMode } from './types';

const DEFAULT_MODE: SelectionMode = 'rectangle';
const STORAGE_KEY = 'defaultSelectionMode';

export async function getDefaultSelectionMode(): Promise<SelectionMode> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as SelectionMode | undefined) ?? DEFAULT_MODE;
}

export async function setDefaultSelectionMode(mode: SelectionMode): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: mode });
}
