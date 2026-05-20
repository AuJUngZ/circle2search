import { scaleRectToImage } from '../shared/geometry';
import type { ImageScaleContext, Rect } from '../shared/types';

export interface CropPlan {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

export function createCropPlan(bounds: Rect, context: ImageScaleContext): CropPlan {
  const scaled = scaleRectToImage(bounds, context);
  return {
    sourceX: scaled.left,
    sourceY: scaled.top,
    sourceWidth: scaled.width,
    sourceHeight: scaled.height
  };
}

export async function cropImageDataUrl(blob: Blob, plan: CropPlan): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(plan.sourceWidth, plan.sourceHeight);
  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    throw new Error('2D canvas context unavailable');
  }

  context.drawImage(
    bitmap,
    plan.sourceX,
    plan.sourceY,
    plan.sourceWidth,
    plan.sourceHeight,
    0,
    0,
    plan.sourceWidth,
    plan.sourceHeight
  );

  const resultBlob = await canvas.convertToBlob({ type: 'image/png' });
  bitmap.close();
  if (!resultBlob) {
    throw new Error('Failed to create crop blob');
  }
  return resultBlob;
}
