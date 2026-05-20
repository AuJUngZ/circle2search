import browser from 'webextension-polyfill';

export function getGoogleLensUploadUrl(): string {
  return 'https://lens.google.com/v3/upload';
}

export function getSearchFormFields(): {
  encodedImageField: string;
  imageContentField: string;
} {
  return {
    encodedImageField: 'encoded_image',
    imageContentField: 'image_content'
  };
}

export function buildGoogleLensForm(file: File): HTMLFormElement {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = getGoogleLensUploadUrl();
  form.enctype = 'multipart/form-data';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.name = getSearchFormFields().encodedImageField;

  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;

  const imageContent = document.createElement('input');
  imageContent.type = 'hidden';
  imageContent.name = getSearchFormFields().imageContentField;
  imageContent.value = '';

  form.append(fileInput, imageContent);
  return form;
}

const STORAGE_KEY = 'crop2search:pending-image';

export async function openGoogleLensResults(file: File): Promise<void> {
  const serialized = {
    name: file.name,
    type: file.type,
    base64: await fileToBase64(file)
  };

  await browser.storage.local.set({ [STORAGE_KEY]: serialized });

  const searchPage = browser.runtime.getURL('search/index.html');
  await browser.tabs.create({ url: searchPage, active: false });
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
