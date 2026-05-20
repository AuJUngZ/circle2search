import type { DragRectInput, ImageScaleContext, Point, Rect, ViewportSize } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeRect(input: DragRectInput): Rect {
  const left = Math.min(input.x1, input.x2);
  const top = Math.min(input.y1, input.y2);
  const width = Math.abs(input.x2 - input.x1);
  const height = Math.abs(input.y2 - input.y1);

  return { left, top, width, height };
}

export function getBoundsFromPoints(points: Point[]): Rect {
  if (points.length === 0) {
    throw new Error('getBoundsFromPoints requires at least one point');
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);

  return { left, top, width: right - left, height: bottom - top };
}

export function closeFreeformPath(points: Point[]): Point[] {
  if (points.length === 0) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];

  if (first.x === last.x && first.y === last.y) {
    return points;
  }

  return [...points, first];
}

export function clampRectToViewport(rect: Rect, viewport: ViewportSize): Rect {
  const left = clamp(rect.left, 0, viewport.width);
  const top = clamp(rect.top, 0, viewport.height);
  const right = clamp(rect.left + rect.width, 0, viewport.width);
  const bottom = clamp(rect.top + rect.height, 0, viewport.height);

  return {
    left: Math.min(left, right),
    top: Math.min(top, bottom),
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top)
  };
}

export function scaleRectToImage(rect: Rect, context: ImageScaleContext): Rect {
  const scaleX = context.imageWidth / context.viewportWidth;
  const scaleY = context.imageHeight / context.viewportHeight;

  return {
    left: Math.round(rect.left * scaleX),
    top: Math.round(rect.top * scaleY),
    width: Math.round(rect.width * scaleX),
    height: Math.round(rect.height * scaleY)
  };
}
