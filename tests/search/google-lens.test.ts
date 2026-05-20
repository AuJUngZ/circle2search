import { describe, expect, it } from 'vitest';
import { getGoogleLensUploadUrl, getSearchFormFields } from '../../src/search/google-lens';

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
