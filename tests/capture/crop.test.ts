import { describe, expect, it } from 'vitest';
import { createCropPlan } from '../../src/capture/crop';

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
