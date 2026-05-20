import browser from 'webextension-polyfill';
import { getDefaultSelectionMode } from '../shared/storage';
import type { SelectionMode } from '../shared/types';
import { runSelectionSession } from './selection-session';

interface StartSelectionMessage {
  type?: string;
  mode?: SelectionMode;
}

function isStartSelectionMessage(message: unknown): message is StartSelectionMessage {
  return typeof message === 'object' && message !== null;
}

browser.runtime.onMessage.addListener(async (message: unknown) => {
  if (!isStartSelectionMessage(message)) {
    return undefined;
  }

  if (message?.type !== 'crop2search:start-selection') {
    return undefined;
  }

  const mode = message.mode ?? (await getDefaultSelectionMode());
  const selection = await runSelectionSession(mode);
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    selection
  };
});
