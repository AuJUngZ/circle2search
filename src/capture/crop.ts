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

export async function cropImageDataUrl(imageDataUrl: string, plan: CropPlan): Promise<Blob> {
  const image = new Image();
  image.src = imageDataUrl;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = plan.sourceWidth;
  canvas.height = plan.sourceHeight;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('2D canvas context unavailable');
  }

  context.drawImage(
    image,
    plan.sourceX,
    plan.sourceY,
    plan.sourceWidth,
    plan.sourceHeight,
    0,
    0,
    plan.sourceWidth,
    plan.sourceHeight
  );

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    throw new Error('Failed to create crop blob');
  }
  return blob;
}
