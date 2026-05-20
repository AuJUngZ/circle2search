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

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      overlay.rect.hidden = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
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
      if (!dragging) return;
      dragging = false;

      const rect = clampRectToViewport(
        normalizeRect({ x1: startX, y1: startY, x2: event.clientX, y2: event.clientY }),
        { width: window.innerWidth, height: window.innerHeight }
      );

      cleanup();
      resolve({ kind: 'rectangle', rect });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      cleanup();
      reject(new Error('Selection cancelled'));
    };

    const cleanup = () => {
      overlay.root.removeEventListener('pointerdown', onPointerDown);
      overlay.root.removeEventListener('pointermove', onPointerMove);
      overlay.root.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown, true);
      overlay.destroy();
    };

    overlay.root.addEventListener('pointerdown', onPointerDown);
    overlay.root.addEventListener('pointermove', onPointerMove);
    overlay.root.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKeyDown, true);
  });
}
