import type { DragRectInput, ImageScaleContext, Point, Rect, ViewportSize } from './types';

export function normalizeRect(input: DragRectInput): Rect {
  const left = Math.min(input.x1, input.x2);
  const top = Math.min(input.y1, input.y2);
  const width = Math.abs(input.x2 - input.x1);
  const height = Math.abs(input.y2 - input.y1);

  return { left, top, width, height };
}

export function getBoundsFromPoints(points: Point[]): Rect {
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
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(viewport.width, rect.left + rect.width);
  const bottom = Math.min(viewport.height, rect.top + rect.height);

  return {
    left,
    top,
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
