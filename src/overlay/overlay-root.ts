export interface OverlayRoot {
  root: HTMLDivElement;
  rect: HTMLDivElement;
  hint: HTMLDivElement;
  destroy: () => void;
}

export function createOverlayRoot(): OverlayRoot {
  const root = document.createElement('div');
  root.id = 'crop2search-root';

  const backdrop = document.createElement('div');
  backdrop.className = 'crop2search-backdrop';

  const rect = document.createElement('div');
  rect.className = 'crop2search-rect';
  rect.hidden = true;

  const hint = document.createElement('div');
  hint.className = 'crop2search-hint';
  hint.textContent = 'Drag to select • Esc to cancel';

  root.append(backdrop, rect, hint);
  document.documentElement.append(root);

  return {
    root,
    rect,
    hint,
    destroy: () => root.remove()
  };
}
