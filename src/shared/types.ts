export type SelectionMode = 'rectangle' | 'freeform';

export interface Point {
  x: number;
  y: number;
}

export interface DragRectInput {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ImageScaleContext {
  viewportWidth: number;
  viewportHeight: number;
  imageWidth: number;
  imageHeight: number;
}

export interface RectangleSelection {
  kind: 'rectangle';
  rect: Rect;
}

export interface FreeformSelection {
  kind: 'freeform';
  points: Point[];
  bounds: Rect;
}

export type SelectionPayload = RectangleSelection | FreeformSelection;
