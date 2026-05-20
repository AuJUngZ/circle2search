import { describe, expect, it } from 'vitest';
import {
  clampRectToViewport,
  closeFreeformPath,
  getBoundsFromPoints,
  normalizeRect,
  scaleRectToImage
} from '../../src/shared/geometry';

describe('normalizeRect', () => {
  it('normalizes reverse drag coordinates into positive width and height', () => {
    expect(normalizeRect({ x1: 150, y1: 120, x2: 30, y2: 20 })).toEqual({
      left: 30,
      top: 20,
      width: 120,
      height: 100
    });
  });
});

describe('getBoundsFromPoints', () => {
  it('returns the smallest bounding rectangle for a freeform path', () => {
    expect(
      getBoundsFromPoints([
        { x: 10, y: 15 },
        { x: 80, y: 25 },
        { x: 30, y: 95 }
      ])
    ).toEqual({
      left: 10,
      top: 15,
      width: 70,
      height: 80
    });
  });
});

describe('closeFreeformPath', () => {
  it('appends the first point when the path is not closed yet', () => {
    expect(
      closeFreeformPath([
        { x: 10, y: 10 },
        { x: 20, y: 20 }
      ])
    ).toEqual([
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 10, y: 10 }
    ]);
  });
});

describe('clampRectToViewport', () => {
  it('clamps the selection rectangle to the current viewport', () => {
    expect(
      clampRectToViewport(
        { left: -5, top: 8, width: 40, height: 50 },
        { width: 30, height: 40 }
      )
    ).toEqual({
      left: 0,
      top: 8,
      width: 30,
      height: 32
    });
  });
});

describe('scaleRectToImage', () => {
  it('maps viewport coordinates to screenshot coordinates using device pixel ratio', () => {
    expect(
      scaleRectToImage(
        { left: 20, top: 30, width: 50, height: 40 },
        { viewportWidth: 200, viewportHeight: 100, imageWidth: 400, imageHeight: 200 }
      )
    ).toEqual({
      left: 40,
      top: 60,
      width: 100,
      height: 80
    });
  });
});
