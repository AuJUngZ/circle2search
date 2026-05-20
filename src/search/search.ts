import browser from 'webextension-polyfill';
import { buildGoogleLensForm } from './google-lens';

const STORAGE_KEY = 'crop2search:pending-image';

interface StoredImage {
  name: string;
  type: string;
  base64: string;
}

async function submitStoredImage(): Promise<void> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as StoredImage | undefined;

  if (!stored) {
    document.body.textContent = 'No image to search.';
    return;
  }

  await browser.storage.local.remove(STORAGE_KEY);

  const bytes = Uint8Array.from(atob(stored.base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: stored.type });
  const file = new File([blob], stored.name, { type: stored.type });

  const form = buildGoogleLensForm(file);
  document.body.append(form);
  form.submit();
}

submitStoredImage().catch((err) => {
  document.body.textContent = `Search failed: ${err instanceof Error ? err.message : String(err)}`;
});
