import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCropPlan, cropImageDataUrl } from '../../src/capture/crop';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createCropPlan', () => {
  it('maps viewport selection bounds into screenshot coordinates', () => {
    expect(
      createCropPlan(
        { left: 25, top: 10, width: 100, height: 40 },
        { viewportWidth: 250, viewportHeight: 100, imageWidth: 500, imageHeight: 200 }
      )
    ).toEqual({
      sourceX: 50,
      sourceY: 20,
      sourceWidth: 200,
      sourceHeight: 80
    });
  });
});

describe('cropImageDataUrl', () => {
  it('uses OffscreenCanvas and createImageBitmap to crop and return a png blob', async () => {
    const inputBlob = new Blob(['fake-png'], { type: 'image/png' });
    const outputBlob = new Blob(['cropped'], { type: 'image/png' });

    const bitmap = { width: 500, height: 300, close: vi.fn() };
    const drawImage = vi.fn();
    const convertToBlob = vi.fn().mockResolvedValue(outputBlob);

    const canvasCtx = { drawImage };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => canvasCtx),
      convertToBlob
    };

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    vi.stubGlobal('OffscreenCanvas', vi.fn((w: number, h: number) => {
      canvas.width = w;
      canvas.height = h;
      return canvas;
    }));

    const result = await cropImageDataUrl(inputBlob, {
      sourceX: 12,
      sourceY: 18,
      sourceWidth: 30,
      sourceHeight: 40
    });

    expect(result).toBe(outputBlob);
    expect(createImageBitmap).toHaveBeenCalledWith(inputBlob);
    expect(canvas.width).toBe(30);
    expect(canvas.height).toBe(40);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 12, 18, 30, 40, 0, 0, 30, 40);
    expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/png' });
    expect(bitmap.close).toHaveBeenCalledOnce();
  });
});
