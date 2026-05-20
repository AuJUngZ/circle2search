import browser from 'webextension-polyfill';
import { createCropPlan, cropImageDataUrl } from '../capture/crop';
import { getDefaultSelectionMode } from '../shared/storage';
import type { SelectionPayload } from '../shared/types';
import { openGoogleLensResults } from '../search/google-lens';

interface SelectionResponse {
  viewportWidth: number;
  viewportHeight: number;
  selection: SelectionPayload;
}

async function startSelection(tabId: number, tabUrl?: string): Promise<void> {
  if (tabUrl && !tabUrl.startsWith('http')) {
    console.warn('Crop2Search: content scripts cannot run on', tabUrl);
    return;
  }

  const mode = await getDefaultSelectionMode();
  let response: SelectionResponse;

  try {
    response = (await browser.tabs.sendMessage(tabId, {
      type: 'crop2search:start-selection',
      mode
    })) as SelectionResponse;
  } catch {
    console.warn('Crop2Search: content script not available in tab', tabId);
    return;
  }

  const imageDataUrl = await browser.tabs.captureVisibleTab(undefined, { format: 'png' });
  const bounds = response.selection.kind === 'rectangle' ? response.selection.rect : response.selection.bounds;

  const res = await fetch(imageDataUrl);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const imageWidth = bitmap.width;
  const imageHeight = bitmap.height;
  bitmap.close();

  const plan = createCropPlan(bounds, {
    viewportWidth: response.viewportWidth,
    viewportHeight: response.viewportHeight,
    imageWidth,
    imageHeight
  });

  const croppedBlob = await cropImageDataUrl(blob, plan);
  const file = new File([croppedBlob], 'crop2search.png', { type: 'image/png' });
  await openGoogleLensResults(file);
}

browser.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await startSelection(tab.id, tab.url);
});

browser.commands.onCommand.addListener(async (command) => {
  if (command !== 'start-selection') return;
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;
  await startSelection(activeTab.id, activeTab.url);
});