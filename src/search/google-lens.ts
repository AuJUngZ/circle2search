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
