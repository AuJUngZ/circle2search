import { clampRectToViewport, closeFreeformPath, getBoundsFromPoints, normalizeRect } from '../shared/geometry';
import type { Point, SelectionMode, SelectionPayload } from '../shared/types';
import { createOverlayRoot } from '../overlay/overlay-root';

export async function runSelectionSession(mode: SelectionMode): Promise<SelectionPayload> {
  const overlay = createOverlayRoot();
  const points: Point[] = [];

  const originalBodyPointerEvents = document.body.style.pointerEvents;
  document.body.style.setProperty('pointer-events', 'none', 'important');

  return await new Promise<SelectionPayload>((resolve, reject) => {
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
      points.length = 0;
      points.push({ x: event.clientX, y: event.clientY });

      if (mode === 'rectangle') {
        overlay.rect.hidden = false;
      }

      overlay.root.setPointerCapture(event.pointerId);
      event.stopPropagation();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      event.stopPropagation();

      if (mode === 'rectangle') {
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
      } else {
        points.push({ x: event.clientX, y: event.clientY });
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        overlay.path.setAttribute('d', d);
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      event.stopPropagation();
      dragging = false;

      cleanup();

      if (mode === 'rectangle') {
        const rect = clampRectToViewport(
          normalizeRect({ x1: startX, y1: startY, x2: event.clientX, y2: event.clientY }),
          { width: window.innerWidth, height: window.innerHeight }
        );

        if (rect.width === 0 || rect.height === 0) {
          reject(new Error('Selection requires a non-zero area'));
          return;
        }

        resolve({ kind: 'rectangle', rect });
      } else {
        const closed = closeFreeformPath(points);
        if (closed.length < 3) {
          reject(new Error('Freeform selection requires at least 3 points'));
          return;
        }
        const bounds = getBoundsFromPoints(closed);
        resolve({ kind: 'freeform', points: closed, bounds });
      }
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== activePointerId) return;
      cleanup();
      reject(new Error('Selection cancelled'));
    };

    const onClick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
    };

    const onContextMenu = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
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
      overlay.root.removeEventListener('click', onClick);
      overlay.root.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.style.setProperty('pointer-events', originalBodyPointerEvents);
      overlay.destroy();
    };

    overlay.root.addEventListener('pointerdown', onPointerDown);
    overlay.root.addEventListener('pointermove', onPointerMove);
    overlay.root.addEventListener('pointerup', onPointerUp);
    overlay.root.addEventListener('pointercancel', onPointerCancel);
    overlay.root.addEventListener('click', onClick, true);
    overlay.root.addEventListener('contextmenu', onContextMenu, true);
    window.addEventListener('keydown', onKeyDown, true);
  });
}
