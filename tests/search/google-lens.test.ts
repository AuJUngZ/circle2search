import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('webextension-polyfill', () => ({
  default: {
    tabs: {
      create: vi.fn()
    },
    runtime: {
      getURL: vi.fn(() => 'moz-extension://search/index.html')
    },
    storage: {
      local: {
        set: vi.fn()
      }
    },
    scripting: {
      executeScript: vi.fn()
    }
  }
}));

import browser from 'webextension-polyfill';
import {
  buildGoogleLensForm,
  getGoogleLensUploadUrl,
  getSearchFormFields,
  openGoogleLensResults
} from '../../src/search/google-lens';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('getGoogleLensUploadUrl', () => {
  it('uses the isolated Google Lens upload endpoint', () => {
    expect(getGoogleLensUploadUrl()).toBe('https://lens.google.com/v3/upload');
  });
});

describe('getSearchFormFields', () => {
  it('returns the multipart field names used by the upload form', () => {
    expect(getSearchFormFields()).toEqual({
      encodedImageField: 'encoded_image',
      imageContentField: 'image_content'
    });
  });
});

describe('buildGoogleLensForm', () => {
  it('creates a multipart form with the upload file and image content fields', () => {
    const form = {
      method: '',
      action: '',
      enctype: '',
      children: [] as unknown[],
      append(...nodes: unknown[]) {
        this.children.push(...nodes);
      }
    };
    const fileInput = {
      type: '',
      name: '',
      files: undefined as File[] | undefined
    };
    const imageContent = {
      type: '',
      name: '',
      value: ''
    };

    class FakeDataTransfer {
      files: File[] = [];
      items = {
        add: (file: File) => {
          this.files.push(file);
        }
      };
    }

    vi.stubGlobal('DataTransfer', FakeDataTransfer);
    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'form') {
          return form;
        }

        if (tagName === 'input' && fileInput.type === '') {
          return fileInput;
        }

        if (tagName === 'input') {
          return imageContent;
        }

        throw new Error(`Unexpected element: ${tagName}`);
      })
    });

    const file = new File(['image-bytes'], 'crop.png', { type: 'image/png' });
    const builtForm = buildGoogleLensForm(file);

    expect(builtForm).toBe(form);
    expect(form.method).toBe('POST');
    expect(form.action).toBe('https://lens.google.com/v3/upload');
    expect(form.enctype).toBe('multipart/form-data');
    expect(fileInput).toEqual({
      type: 'file',
      name: 'encoded_image',
      files: [file]
    });
    expect(imageContent).toEqual({
      type: 'hidden',
      name: 'image_content',
      value: ''
    });
    expect(form.children).toEqual([fileInput, imageContent]);
  });
});

describe('openGoogleLensResults', () => {
  it('stores large images without overflowing the call stack', async () => {
    vi.mocked(browser.storage.local.set).mockResolvedValue(undefined);
    vi.mocked(browser.tabs.create).mockResolvedValue(undefined as never);

    const file = new File([new Uint8Array(256 * 1024)], 'large-crop.png', {
      type: 'image/png'
    });

    await expect(openGoogleLensResults(file)).resolves.toBeUndefined();

    expect(browser.storage.local.set).toHaveBeenCalledOnce();
    expect(browser.tabs.create).toHaveBeenCalledWith({
      url: 'moz-extension://search/index.html',
      active: false
    });
  });
});
