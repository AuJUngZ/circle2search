export interface OverlayRoot {
  root: HTMLDivElement;
  rect: HTMLDivElement;
  path: SVGPathElement;
  hint: HTMLDivElement;
  destroy: () => void;
}

export function createOverlayRoot(): OverlayRoot {
  const root = document.createElement('div');
  root.id = 'crop2search-root';

  const backdrop = document.createElement('div');
  backdrop.className = 'crop2search-backdrop';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'crop2search-path-layer');
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'crop2search-path');
  svg.append(path);

  const rect = document.createElement('div');
  rect.className = 'crop2search-rect';
  rect.hidden = true;

  const hint = document.createElement('div');
  hint.className = 'crop2search-hint';
  hint.textContent = 'Drag to select • Esc to cancel';

  root.append(backdrop, svg, rect, hint);
  document.documentElement.append(root);

  return {
    root,
    rect,
    path,
    hint,
    destroy: () => root.remove()
  };
}
