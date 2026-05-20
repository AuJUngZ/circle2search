import { clampRectToViewport, normalizeRect } from '../shared/geometry';
import type { RectangleSelection, SelectionMode } from '../shared/types';
import { createOverlayRoot } from '../overlay/overlay-root';

export async function runSelectionSession(mode: SelectionMode): Promise<RectangleSelection> {
  if (mode !== 'rectangle') {
    throw new Error('Freeform mode is not implemented yet');
  }

  const overlay = createOverlayRoot();

  return await new Promise<RectangleSelection>((resolve, reject) => {
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let activePointerId: number | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || dragging) {
        return;
      }

      dragging = true;
      activePointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      overlay.rect.hidden = false;
      overlay.root.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      const rect = clampRectToViewport(
        normalizeRect({ x1: startX, y1: startY, x2: event.clientX, y2: event.clientY }),
        { width: window.innerWidth, height: window.innerHeight }
      );

      Object.assign(overlay.rect.style, {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      });
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      dragging = false;

      const rect = clampRectToViewport(
        normalizeRect({ x1: startX, y1: startY, x2: event.clientX, y2: event.clientY }),
        { width: window.innerWidth, height: window.innerHeight }
      );

      cleanup();

      if (rect.width === 0 || rect.height === 0) {
        reject(new Error('Selection requires a non-zero area'));
        return;
      }

      resolve({ kind: 'rectangle', rect });
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      cleanup();
      reject(new Error('Selection cancelled'));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      cleanup();
      reject(new Error('Selection cancelled'));
    };

    const cleanup = () => {
      if (activePointerId !== null && overlay.root.hasPointerCapture(activePointerId)) {
        overlay.root.releasePointerCapture(activePointerId);
      }

      activePointerId = null;
      overlay.root.removeEventListener('pointerdown', onPointerDown);
      overlay.root.removeEventListener('pointermove', onPointerMove);
      overlay.root.removeEventListener('pointerup', onPointerUp);
      overlay.root.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('keydown', onKeyDown, true);
      overlay.destroy();
    };

    overlay.root.addEventListener('pointerdown', onPointerDown);
    overlay.root.addEventListener('pointermove', onPointerMove);
    overlay.root.addEventListener('pointerup', onPointerUp);
    overlay.root.addEventListener('pointercancel', onPointerCancel);
    window.addEventListener('keydown', onKeyDown, true);
  });
}
