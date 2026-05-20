# Browser Image Search Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only Chrome and Firefox extension that lets the user start selection mode from the toolbar or a keyboard shortcut, drag around an item on the current webpage, crop the captured region locally, and open Google Lens results in a new tab automatically.

**Architecture:** Use a shared vanilla TypeScript codebase with small browser-specific manifests. Put the selection overlay, geometry, crop logic, and search handoff in focused modules, then keep browser-specific behavior limited to manifest wiring and API adapters in the background script. Build with a small Node script that emits `dist/chrome` and `dist/firefox`, and verify critical geometry/cropping logic with Vitest before wiring the full flow.

**Tech Stack:** TypeScript, DOM APIs, Canvas API, WebExtension APIs, `webextension-polyfill`, Vitest, Node build scripts

---

## Planned File Structure

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `scripts/build.mjs`
- Create: `manifests/chrome/manifest.json`
- Create: `manifests/firefox/manifest.json`
- Create: `src/background/index.ts`
- Create: `src/content/index.ts`
- Create: `src/content/selection-session.ts`
- Create: `src/overlay/overlay-root.ts`
- Create: `src/overlay/overlay.css`
- Create: `src/capture/crop.ts`
- Create: `src/search/google-lens.ts`
- Create: `src/options/index.html`
- Create: `src/options/index.ts`
- Create: `src/options/options.css`
- Create: `src/shared/types.ts`
- Create: `src/shared/geometry.ts`
- Create: `src/shared/storage.ts`
- Create: `tests/shared/geometry.test.ts`
- Create: `tests/capture/crop.test.ts`
- Create: `tests/search/google-lens.test.ts`
- Create: `README.md`

## Task 1: Scaffold the Extension Workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `README.md`

- [ ] **Step 1: Create the initial `package.json`**

```json
{
  "name": "browser-image-search-extension",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node scripts/build.mjs",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  },
  "dependencies": {
    "webextension-polyfill": "^0.12.0"
  }
}
```

- [ ] **Step 2: Add TypeScript compiler settings in `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node", "webextension-polyfill"]
  },
  "include": ["src", "tests", "scripts", "manifests"]
}
```

- [ ] **Step 3: Add a minimal Vitest configuration in `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
```

- [ ] **Step 4: Add a concise setup guide in `README.md`**

```md
# Browser Image Search Extension

Local-only browser extension for Chrome and Firefox that captures a user-selected region from the active webpage and opens Google Lens results in a new tab.

## Commands

- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Output

Builds should emit unpacked extensions to:

- `dist/chrome`
- `dist/firefox`
```

- [ ] **Step 5: Install dependencies**

Run: `npm install`  
Expected: packages installed and `package-lock.json` created

- [ ] **Step 6: Verify the empty scaffold compiles**

Run: `npm run typecheck`  
Expected: PASS with no TypeScript errors

- [ ] **Step 7: Commit the scaffold**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts README.md
git commit -m "chore: scaffold extension workspace"
```

## Task 2: Build Shared Types and Geometry Utilities with Tests First

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/geometry.ts`
- Create: `tests/shared/geometry.test.ts`

- [ ] **Step 1: Write the failing geometry tests in `tests/shared/geometry.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import {
  clampRectToViewport,
  closeFreeformPath,
  getBoundsFromPoints,
  normalizeRect,
  scaleRectToImage
} from '../../src/shared/geometry';

describe('normalizeRect', () => {
  it('normalizes reverse drag coordinates into positive width and height', () => {
    expect(normalizeRect({ x1: 150, y1: 120, x2: 30, y2: 20 })).toEqual({
      left: 30,
      top: 20,
      width: 120,
      height: 100
    });
  });
});

describe('getBoundsFromPoints', () => {
  it('returns the smallest bounding rectangle for a freeform path', () => {
    expect(
      getBoundsFromPoints([
        { x: 10, y: 15 },
        { x: 80, y: 25 },
        { x: 30, y: 95 }
      ])
    ).toEqual({
      left: 10,
      top: 15,
      width: 70,
      height: 80
    });
  });
});

describe('closeFreeformPath', () => {
  it('appends the first point when the path is not closed yet', () => {
    expect(
      closeFreeformPath([
        { x: 10, y: 10 },
        { x: 20, y: 20 }
      ])
    ).toEqual([
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 10, y: 10 }
    ]);
  });
});

describe('clampRectToViewport', () => {
  it('clamps the selection rectangle to the current viewport', () => {
    expect(
      clampRectToViewport(
        { left: -5, top: 8, width: 40, height: 50 },
        { width: 30, height: 40 }
      )
    ).toEqual({
      left: 0,
      top: 8,
      width: 30,
      height: 32
    });
  });
});

describe('scaleRectToImage', () => {
  it('maps viewport coordinates to screenshot coordinates using device pixel ratio', () => {
    expect(
      scaleRectToImage(
        { left: 20, top: 30, width: 50, height: 40 },
        { viewportWidth: 200, viewportHeight: 100, imageWidth: 400, imageHeight: 200 }
      )
    ).toEqual({
      left: 40,
      top: 60,
      width: 100,
      height: 80
    });
  });
});
```

- [ ] **Step 2: Run the geometry tests to verify they fail**

Run: `npm test -- tests/shared/geometry.test.ts`  
Expected: FAIL with module-not-found or export-not-found errors for `../../src/shared/geometry`

- [ ] **Step 3: Define shared selection types in `src/shared/types.ts`**

```ts
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
```

- [ ] **Step 4: Implement the geometry utilities in `src/shared/geometry.ts`**

```ts
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
```

- [ ] **Step 5: Run geometry tests again**

Run: `npm test -- tests/shared/geometry.test.ts`  
Expected: PASS with 5 passing tests

- [ ] **Step 6: Verify the project still typechecks**

Run: `npm run typecheck`  
Expected: PASS with no TypeScript errors

- [ ] **Step 7: Commit the shared geometry layer**

```bash
git add src/shared/types.ts src/shared/geometry.ts tests/shared/geometry.test.ts
git commit -m "feat: add shared selection geometry utilities"
```

## Task 3: Add Local Crop Logic and Search Handoff Tests

**Files:**
- Create: `src/capture/crop.ts`
- Create: `src/search/google-lens.ts`
- Create: `tests/capture/crop.test.ts`
- Create: `tests/search/google-lens.test.ts`

- [ ] **Step 1: Write the failing crop tests in `tests/capture/crop.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { createCropPlan } from '../../src/capture/crop';

describe('createCropPlan', () => {
  it('maps viewport selection bounds into screenshot coordinates', () => {
    expect(
      createCropPlan(
        { left: 25, top: 10, width: 100, height: 40 },
        { viewportWidth: 250, viewportHeight: 100, imageWidth: 500, imageHeight: 200 }
      )
    ).toEqual({
      sourceX: 50,
      sourceY: 20,
      sourceWidth: 200,
      sourceHeight: 80
    });
  });
});
```

- [ ] **Step 2: Write the failing search handoff tests in `tests/search/google-lens.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { getGoogleLensUploadUrl, getSearchFormFields } from '../../src/search/google-lens';

describe('getGoogleLensUploadUrl', () => {
  it('uses the isolated Google Lens upload endpoint', () => {
    expect(getGoogleLensUploadUrl()).toBe('https://lens.google.com/v3/upload');
  });
});

describe('getSearchFormFields', () => {
  it('returns the multipart field names used by the upload form', () => {
    expect(getSearchFormFields()).toEqual({
      encodedImageField: 'encoded_image',
      imageContentField: 'image_content'
    });
  });
});
```

- [ ] **Step 3: Run the new tests to verify they fail**

Run: `npm test -- tests/capture/crop.test.ts tests/search/google-lens.test.ts`  
Expected: FAIL with missing module errors for `src/capture/crop` and `src/search/google-lens`

- [ ] **Step 4: Implement crop planning in `src/capture/crop.ts`**

```ts
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
```

- [ ] **Step 5: Implement the isolated search gateway in `src/search/google-lens.ts`**

```ts
export function getGoogleLensUploadUrl(): string {
  return 'https://lens.google.com/v3/upload';
}

export function getSearchFormFields(): {
  encodedImageField: string;
  imageContentField: string;
} {
  return {
    encodedImageField: 'encoded_image',
    imageContentField: 'image_content'
  };
}

export function buildGoogleLensForm(file: File): HTMLFormElement {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = getGoogleLensUploadUrl();
  form.enctype = 'multipart/form-data';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.name = getSearchFormFields().encodedImageField;

  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;

  const imageContent = document.createElement('input');
  imageContent.type = 'hidden';
  imageContent.name = getSearchFormFields().imageContentField;
  imageContent.value = '';

  form.append(fileInput, imageContent);
  return form;
}
```

- [ ] **Step 6: Re-run crop and search tests**

Run: `npm test -- tests/capture/crop.test.ts tests/search/google-lens.test.ts`  
Expected: PASS with 3 passing tests

- [ ] **Step 7: Commit crop and search foundations**

```bash
git add src/capture/crop.ts src/search/google-lens.ts tests/capture/crop.test.ts tests/search/google-lens.test.ts
git commit -m "feat: add crop planning and search gateway"
```

## Task 4: Implement Storage and the Rectangle Selection Overlay

**Files:**
- Create: `src/shared/storage.ts`
- Create: `src/overlay/overlay-root.ts`
- Create: `src/overlay/overlay.css`
- Create: `src/content/selection-session.ts`
- Create: `src/content/index.ts`

- [ ] **Step 1: Add persistent selection-mode storage in `src/shared/storage.ts`**

```ts
import browser from 'webextension-polyfill';
import type { SelectionMode } from './types';

const DEFAULT_MODE: SelectionMode = 'rectangle';
const STORAGE_KEY = 'defaultSelectionMode';

export async function getDefaultSelectionMode(): Promise<SelectionMode> {
  const result = await browser.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as SelectionMode | undefined) ?? DEFAULT_MODE;
}

export async function setDefaultSelectionMode(mode: SelectionMode): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: mode });
}
```

- [ ] **Step 2: Add the overlay stylesheet in `src/overlay/overlay.css`**

```css
#crop2search-root {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  cursor: crosshair;
}

.crop2search-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.32);
}

.crop2search-rect {
  position: absolute;
  border: 2px solid #f8fafc;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.32);
  background: rgba(255, 255, 255, 0.08);
}

.crop2search-hint {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
  color: #f8fafc;
  font: 12px/1.2 system-ui, sans-serif;
}
```

- [ ] **Step 3: Add the overlay root helper in `src/overlay/overlay-root.ts`**

```ts
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
```

- [ ] **Step 4: Implement rectangle selection first in `src/content/selection-session.ts`**

```ts
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
```

- [ ] **Step 5: Wire the content entrypoint in `src/content/index.ts`**

```ts
import browser from 'webextension-polyfill';
import { getDefaultSelectionMode } from '../shared/storage';
import { runSelectionSession } from './selection-session';

browser.runtime.onMessage.addListener(async (message) => {
  if (message?.type !== 'crop2search:start-selection') {
    return undefined;
  }

  const mode = message.mode ?? (await getDefaultSelectionMode());
  const selection = await runSelectionSession(mode);
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    selection
  };
});
```

- [ ] **Step 6: Verify typechecking before adding freeform**

Run: `npm run typecheck`  
Expected: PASS with rectangle-only content flow compiling cleanly

- [ ] **Step 7: Commit the rectangle overlay milestone**

```bash
git add src/shared/storage.ts src/overlay/overlay.css src/overlay/overlay-root.ts src/content/selection-session.ts src/content/index.ts
git commit -m "feat: add rectangle selection overlay"
```

## Task 5: Extend the Overlay to Support Freeform Selection

**Files:**
- Modify: `src/content/selection-session.ts`
- Modify: `src/overlay/overlay-root.ts`
- Modify: `src/overlay/overlay.css`
- Modify: `src/shared/types.ts`

- [ ] **Step 1: Extend the overlay helper to render a freeform SVG path**

```ts
// inside src/overlay/overlay-root.ts
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('class', 'crop2search-path-layer');
svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
path.setAttribute('class', 'crop2search-path');
svg.append(path);

root.append(backdrop, svg, rect, hint);

return {
  root,
  rect,
  hint,
  path,
  destroy: () => root.remove()
};
```

- [ ] **Step 2: Add freeform path styles in `src/overlay/overlay.css`**

```css
.crop2search-path-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.crop2search-path {
  fill: rgba(255, 255, 255, 0.14);
  stroke: #f8fafc;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

- [ ] **Step 3: Update the selection session to support freeform mode**

```ts
import { clampRectToViewport, closeFreeformPath, getBoundsFromPoints, normalizeRect } from '../shared/geometry';
import type { FreeformSelection, RectangleSelection, SelectionMode, SelectionPayload } from '../shared/types';

export async function runSelectionSession(mode: SelectionMode): Promise<SelectionPayload> {
  const overlay = createOverlayRoot();

  return await new Promise<SelectionPayload>((resolve, reject) => {
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let points: Array<{ x: number; y: number }> = [];

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      points = [{ x: startX, y: startY }];
      overlay.rect.hidden = mode !== 'rectangle';
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;

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
        return;
      }

      points.push({ x: event.clientX, y: event.clientY });
      const d = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
      overlay.path.setAttribute('d', d);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;

      if (mode === 'rectangle') {
        const rect = clampRectToViewport(
          normalizeRect({ x1: startX, y1: startY, x2: event.clientX, y2: event.clientY }),
          { width: window.innerWidth, height: window.innerHeight }
        );
        cleanup();
        resolve({ kind: 'rectangle', rect } satisfies RectangleSelection);
        return;
      }

      const closedPoints = closeFreeformPath([...points, { x: event.clientX, y: event.clientY }]);
      const bounds = clampRectToViewport(getBoundsFromPoints(closedPoints), {
        width: window.innerWidth,
        height: window.innerHeight
      });
      cleanup();
      resolve({ kind: 'freeform', points: closedPoints, bounds } satisfies FreeformSelection);
    };
```

- [ ] **Step 4: Update the freeform selection type if needed**

```ts
export interface FreeformSelection {
  kind: 'freeform';
  points: Point[];
  bounds: Rect;
}
```

- [ ] **Step 5: Verify freeform compiles**

Run: `npm run typecheck`  
Expected: PASS with `runSelectionSession` returning `SelectionPayload`

- [ ] **Step 6: Commit freeform support**

```bash
git add src/content/selection-session.ts src/overlay/overlay-root.ts src/overlay/overlay.css src/shared/types.ts
git commit -m "feat: add freeform selection mode"
```

## Task 6: Wire Background Capture, Local Crop, and New-Tab Search

**Files:**
- Create: `src/background/index.ts`
- Modify: `src/content/index.ts`
- Modify: `src/capture/crop.ts`
- Modify: `src/search/google-lens.ts`

- [ ] **Step 1: Add a submission helper that posts the file from a temporary tab in `src/search/google-lens.ts`**

```ts
import browser from 'webextension-polyfill';

export async function openGoogleLensResults(file: File): Promise<void> {
  const tab = await browser.tabs.create({ url: 'about:blank', active: true });
  if (!tab.id) {
    throw new Error('Failed to open search tab');
  }

  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (uploadUrl, fieldNames, serializedFile) => {
      const bytes = Uint8Array.from(atob(serializedFile.base64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: serializedFile.type });
      const file = new File([blob], serializedFile.name, { type: serializedFile.type });

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = uploadUrl;
      form.enctype = 'multipart/form-data';

      const input = document.createElement('input');
      input.type = 'file';
      input.name = fieldNames.encodedImageField;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;

      const imageContent = document.createElement('input');
      imageContent.type = 'hidden';
      imageContent.name = fieldNames.imageContentField;
      imageContent.value = '';

      form.append(input, imageContent);
      document.body.append(form);
      form.submit();
    },
    args: [
      getGoogleLensUploadUrl(),
      getSearchFormFields(),
      {
        name: file.name,
        type: file.type,
        base64: await fileToBase64(file)
      }
    ]
  });
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
```

- [ ] **Step 2: Create the background orchestrator in `src/background/index.ts`**

```ts
import browser from 'webextension-polyfill';
import { createCropPlan, cropImageDataUrl } from '../capture/crop';
import { getDefaultSelectionMode } from '../shared/storage';
import type { SelectionPayload } from '../shared/types';
import { openGoogleLensResults } from '../search/google-lens';

interface SelectionResponse {
  viewportWidth: number;
  viewportHeight: number;
  selection: SelectionPayload;
}

async function startSelection(tabId: number): Promise<void> {
  const mode = await getDefaultSelectionMode();
  const response = (await browser.tabs.sendMessage(tabId, {
    type: 'crop2search:start-selection',
    mode
  })) as SelectionResponse;

  const imageDataUrl = await browser.tabs.captureVisibleTab(undefined, { format: 'png' });
  const bounds = response.selection.kind === 'rectangle' ? response.selection.rect : response.selection.bounds;
  const image = new Image();
  image.src = imageDataUrl;
  await image.decode();

  const plan = createCropPlan(bounds, {
    viewportWidth: response.viewportWidth,
    viewportHeight: response.viewportHeight,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight
  });

  const blob = await cropImageDataUrl(imageDataUrl, plan);
  const file = new File([blob], 'crop2search.png', { type: 'image/png' });
  await openGoogleLensResults(file);
}

browser.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  await startSelection(tab.id);
});

browser.commands.onCommand.addListener(async (command) => {
  if (command !== 'start-selection') return;
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;
  await startSelection(activeTab.id);
});
```

- [ ] **Step 3: Add a defensive unsupported-context guard to `src/content/index.ts`**

```ts
browser.runtime.onMessage.addListener(async (message) => {
  if (window.top !== window.self) {
    throw new Error('Selection only runs in the top-level page');
  }

  if (message?.type !== 'crop2search:start-selection') {
    return undefined;
  }

  const mode = message.mode ?? (await getDefaultSelectionMode());
  const selection = await runSelectionSession(mode);
  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    selection
  };
});
```

- [ ] **Step 4: Run the full automated checks**

Run: `npm test && npm run typecheck`  
Expected: PASS with all shared, crop, and search tests green plus no TypeScript errors

- [ ] **Step 5: Commit the end-to-end search flow**

```bash
git add src/background/index.ts src/content/index.ts src/capture/crop.ts src/search/google-lens.ts
git commit -m "feat: wire capture flow to Google Lens"
```

## Task 7: Add Options UI, Browser Manifests, and Build Output Assembly

**Files:**
- Create: `src/options/index.html`
- Create: `src/options/index.ts`
- Create: `src/options/options.css`
- Create: `scripts/build.mjs`
- Create: `manifests/chrome/manifest.json`
- Create: `manifests/firefox/manifest.json`

- [ ] **Step 1: Create the options page markup in `src/options/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Crop2Search Options</title>
    <link rel="stylesheet" href="./options.css" />
  </head>
  <body>
    <main class="page">
      <h1>Crop2Search</h1>
      <p>Choose which selection mode opens by default.</p>
      <form id="options-form">
        <label>
          <input type="radio" name="mode" value="rectangle" />
          Rectangle
        </label>
        <label>
          <input type="radio" name="mode" value="freeform" />
          Freeform
        </label>
      </form>
      <p class="hint">Keyboard shortcut: configure the browser command for <code>start-selection</code>.</p>
      <script type="module" src="./index.js"></script>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Style the options page in `src/options/options.css`**

```css
body {
  margin: 0;
  font: 16px/1.5 system-ui, sans-serif;
  background: #f8fafc;
  color: #0f172a;
}

.page {
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 20px;
}

form {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.hint {
  margin-top: 24px;
  color: #475569;
}
```

- [ ] **Step 3: Wire the options page logic in `src/options/index.ts`**

```ts
import { getDefaultSelectionMode, setDefaultSelectionMode } from '../shared/storage';
import type { SelectionMode } from '../shared/types';

const form = document.querySelector<HTMLFormElement>('#options-form');

if (!form) {
  throw new Error('Options form not found');
}

const currentMode = await getDefaultSelectionMode();
const currentInput = form.querySelector<HTMLInputElement>(`input[value="${currentMode}"]`);
if (currentInput) {
  currentInput.checked = true;
}

form.addEventListener('change', async (event) => {
  const target = event.target as HTMLInputElement;
  if (target.name !== 'mode') return;
  await setDefaultSelectionMode(target.value as SelectionMode);
});
```

- [ ] **Step 4: Add the Chrome manifest in `manifests/chrome/manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "Crop2Search",
  "version": "0.1.0",
  "description": "Select part of a webpage and search it with Google Lens.",
  "permissions": ["activeTab", "scripting", "storage", "tabs"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },
  "action": {
    "default_title": "Start Crop2Search"
  },
  "commands": {
    "start-selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y"
      },
      "description": "Start selection mode"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "css": ["overlay/overlay.css"],
      "run_at": "document_idle"
    }
  ],
  "options_page": "options/index.html"
}
```

- [ ] **Step 5: Add the Firefox manifest in `manifests/firefox/manifest.json`**

```json
{
  "manifest_version": 3,
  "name": "Crop2Search",
  "version": "0.1.0",
  "description": "Select part of a webpage and search it with Google Lens.",
  "permissions": ["activeTab", "scripting", "storage", "tabs"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "scripts": ["background/index.js"],
    "type": "module"
  },
  "action": {
    "default_title": "Start Crop2Search"
  },
  "commands": {
    "start-selection": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y"
      },
      "description": "Start selection mode"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "css": ["overlay/overlay.css"],
      "run_at": "document_idle"
    }
  ],
  "options_ui": {
    "page": "options/index.html",
    "open_in_tab": true
  }
}
```

- [ ] **Step 6: Add the missing build dependency**

```json
"devDependencies": {
  "@types/node": "^24.0.0",
  "esbuild": "^0.25.0",
  "typescript": "^5.8.0",
  "vitest": "^3.0.0"
}
```

- [ ] **Step 7: Refresh installed packages**

Run: `npm install`  
Expected: `package-lock.json` updated with `esbuild`

- [ ] **Step 8: Implement the build script in `scripts/build.mjs`**

```js
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const distRoot = path.join(root, 'dist');

await rm(distRoot, { recursive: true, force: true });
await mkdir(path.join(distRoot, 'chrome'), { recursive: true });
await mkdir(path.join(distRoot, 'firefox'), { recursive: true });

const entryPoints = {
  'background/index': 'src/background/index.ts',
  'content/index': 'src/content/index.ts',
  'options/index': 'src/options/index.ts'
};

for (const browser of ['chrome', 'firefox']) {
  await mkdir(path.join(distRoot, browser, 'options'), { recursive: true });
  await mkdir(path.join(distRoot, browser, 'overlay'), { recursive: true });

  await build({
    entryPoints,
    bundle: true,
    format: 'esm',
    outdir: path.join(distRoot, browser),
    platform: 'browser'
  });

  await cp('src/options/index.html', path.join(distRoot, browser, 'options', 'index.html'), { recursive: false });
  await cp('src/options/options.css', path.join(distRoot, browser, 'options', 'options.css'), { recursive: false });
  await cp('src/overlay/overlay.css', path.join(distRoot, browser, 'overlay', 'overlay.css'), { recursive: false });

  const manifest = await readFile(path.join('manifests', browser, 'manifest.json'), 'utf8');
  await writeFile(path.join(distRoot, browser, 'manifest.json'), manifest);
}
```

- [ ] **Step 9: Run the full build**

Run: `npm run build`  
Expected: PASS with unpacked extension files emitted under both `dist/chrome` and `dist/firefox`

- [ ] **Step 10: Perform final browser verification**

Manual verification:
- load `dist/chrome` and verify toolbar + shortcut + rectangle + freeform
- load `dist/firefox` and verify toolbar + shortcut + rectangle + freeform
- confirm options page changes the default mode
- confirm `Esc` cancels cleanly
- confirm unsupported pages fail without leaving the tab stuck

- [ ] **Step 11: Commit the packaging layer**

```bash
git add src/options/index.html src/options/index.ts src/options/options.css scripts/build.mjs manifests/chrome/manifest.json manifests/firefox/manifest.json package.json package-lock.json
git commit -m "feat: package Chrome and Firefox extension builds"
```

## Spec Coverage Check

- Chrome and Firefox support: covered by Task 7 manifests and build output assembly.
- Local-only processing: covered by Tasks 3 and 6 crop/search flow.
- Toolbar and keyboard activation: covered by Task 6 background orchestration and Task 7 manifest commands.
- Rectangle and freeform selection: covered by Tasks 4 and 5.
- Automatic new-tab search: covered by Task 6.
- Options for default mode: covered by Task 7.
- Error and cancel handling: covered by Tasks 4, 5, and 6.

## Placeholder Scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- The riskiest area is Google Lens upload behavior, but it is intentionally isolated in `src/search/google-lens.ts` so that verification and future fixes stay contained.

## Type Consistency Check

- Shared selection types are introduced in Task 2 and reused consistently in Tasks 4, 5, and 6.
- Rectangle and freeform both flow through `SelectionPayload`.
- Geometry, crop planning, and background orchestration use the same `Rect` and viewport naming throughout.
