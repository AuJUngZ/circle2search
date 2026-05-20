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
  it('draws the requested crop to a canvas and returns a png blob', async () => {
    const blob = new Blob(['crop'], { type: 'image/png' });
    const drawImage = vi.fn();
    const decode = vi.fn().mockResolvedValue(undefined);

    class FakeImage {
      src = '';
      decode = decode;
    }

    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toBlob: vi.fn((callback: (value: Blob | null) => void) => callback(blob))
    };

    vi.stubGlobal('Image', FakeImage);
    vi.stubGlobal('document', {
      createElement: vi.fn((tagName: string) => {
        if (tagName !== 'canvas') {
          throw new Error(`Unexpected element: ${tagName}`);
        }

        return canvas;
      })
    });

    const result = await cropImageDataUrl('data:image/png;base64,abc', {
      sourceX: 12,
      sourceY: 18,
      sourceWidth: 30,
      sourceHeight: 40
    });

    expect(result).toBe(blob);
    expect(decode).toHaveBeenCalledTimes(1);
    expect(canvas.width).toBe(30);
    expect(canvas.height).toBe(40);
    expect(drawImage).toHaveBeenCalledWith(expect.any(FakeImage), 12, 18, 30, 40, 0, 0, 30, 40);
    expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
  });
});
