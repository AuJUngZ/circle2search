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

let activeSelectionSession: Promise<{
  viewportWidth: number;
  viewportHeight: number;
  selection: Awaited<ReturnType<typeof runSelectionSession>>;
}> | null = null;

browser.runtime.onMessage.addListener(async (message: unknown) => {
  if (window.top !== window.self) {
    throw new Error('Selection only runs in the top-level page');
  }

  if (!isStartSelectionMessage(message)) {
    return undefined;
  }

  if (message?.type !== 'crop2search:start-selection') {
    return undefined;
  }

  if (activeSelectionSession) {
    throw new Error('Selection session already in progress');
  }

  activeSelectionSession = (async () => {
    const mode = message.mode ?? (await getDefaultSelectionMode());
    const selection = await runSelectionSession(mode);
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      selection
    };
  })();

  try {
    return await activeSelectionSession;
  } finally {
    activeSelectionSession = null;
  }
});
