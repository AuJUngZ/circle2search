# Browser Image Search Extension Design

## Overview

This project will create a local-only browser extension for Chrome and Firefox that lets a user select part of a webpage, capture that selected area, and automatically open a new Google image search tab using the captured image.

The primary workflow is:

1. The user finds an item on any webpage.
2. The user activates the extension from either the toolbar button or a keyboard shortcut.
3. The cursor enters selection mode.
4. The user drags around the target item using either rectangle selection or freeform selection.
5. The extension captures the visible browser tab, crops the selected area locally, and opens a new Google image search tab automatically.

The extension only needs to work inside browser webpages. It does not need to capture the desktop or other applications.

## Goals

- Support both Chrome and Firefox from one shared codebase.
- Keep all capture and cropping logic local to the extension.
- Support two activation methods: toolbar click and keyboard shortcut.
- Support two selection modes: rectangle and freeform.
- Open a new Google search tab automatically after selection without a confirmation step.
- Keep the interaction lightweight and fast enough for repeated use on sites such as Facebook and shopping pages.

## Non-Goals

- Desktop-wide capture outside the browser.
- Cloud processing, external backend services, or user accounts.
- Persistent history, saved captures, or gallery features.
- Advanced image editing after selection.
- Multi-step confirmation flows before search.

## Product Decisions

### Activation

The extension must support:

- Toolbar button activation
- Keyboard shortcut activation

Both activation methods start the same selection mode immediately on the active tab.

### Search Behavior

After the user completes selection, the extension automatically opens a new Google image search tab. There is no preview or confirmation step in version 1.

### Selection Modes

The extension will support:

- Rectangle selection
- Freeform selection

Because freeform support is important to the user, it is included in version 1 instead of being deferred.

### Browser Scope

The extension only targets browser webpages. Browser internal pages, restricted pages, or non-web surfaces may be excluded where the browser platform does not permit injection or capture.

## Architecture

The extension will use a shared browser-extension architecture with minimal browser-specific differences.

### Core Modules

#### Background Script

Responsibilities:

- Listen for toolbar clicks
- Listen for keyboard shortcut commands
- Coordinate capture and search flow
- Receive selection results from the content script
- Capture the visible tab
- Open the Google image search tab

#### Content Script

Responsibilities:

- Inject the selection overlay into the current webpage
- Manage user interaction during rectangle or freeform selection
- Block page interaction while selection mode is active
- Return selection geometry to the background script

#### Overlay UI

Responsibilities:

- Render a dimmed backdrop over the page
- Show highlighted selection feedback
- Display outline/path visuals during drag
- Handle cancel actions such as `Esc`

#### Capture and Crop Module

Responsibilities:

- Convert page-space selection coordinates into screenshot pixel coordinates
- Crop the visible-tab screenshot locally
- Produce the final image blob or file for upload

#### Search Handoff Module

Responsibilities:

- Encapsulate Google image-search upload/open behavior
- Open a new tab automatically
- Contain fallback behavior if the Google handoff changes or fails

#### Options Page

Responsibilities:

- Let the user choose the default selection mode
- Document the available shortcut and usage behavior
- Provide simple toggles for future preferences if needed

## User Experience

### Start of Flow

When the user activates the extension:

- The page enters selection mode immediately.
- The cursor changes to a selection tool.
- A lightweight hint may appear briefly with actions such as drag to select, `Esc` to cancel, and mode information.

### Rectangle Mode

In rectangle mode:

- The user clicks and drags to define a rectangular capture region.
- The overlay shows a live box while dragging.
- The final selection is captured on mouse release.

Rectangle mode should be the most stable fallback mode and the easiest to maintain.

### Freeform Mode

In freeform mode:

- The user clicks and drags to trace around the object.
- The overlay renders a live path while the pointer moves.
- On release, the extension closes the path and computes selection bounds.

For version 1, the extension may crop based on the freeform path's bounding region rather than a true transparent cutout. This preserves the desired interaction while keeping cross-browser behavior more reliable.

### Cancellation and Blocking

While selection mode is active:

- Underlying page clicks should be blocked.
- Scrolling should be prevented where practical.
- `Esc` cancels immediately.
- Failed or cancelled sessions should cleanly remove the overlay and return the page to normal.

## End-to-End Data Flow

1. The user activates the extension from the toolbar or keyboard shortcut.
2. The background script signals the content script to start selection mode.
3. The content script collects rectangle coordinates or freeform points.
4. The content script returns normalized geometry to the background script.
5. The background script captures the visible tab.
6. The crop module maps viewport coordinates to image pixel coordinates.
7. The crop module produces a cropped image file locally.
8. The search handoff module opens a new Google image search tab using that image.
9. Temporary in-memory image data is discarded after the handoff completes.

## Cross-Browser Strategy

The project should maintain one shared implementation where possible.

### Shared

- Overlay logic
- Selection behavior
- Coordinate conversion
- Crop logic
- Search handoff logic

### Browser-Specific

- Manifest details
- Permission declarations
- API compatibility shims for Chrome and Firefox where extension APIs differ

The initial code layout should isolate browser-specific code into thin adapters instead of forking the core implementation.

## Reliability Risks and Mitigations

### Coordinate Mapping

Risk:
Selection geometry may not align with the captured screenshot due to zoom, scroll state, or device pixel ratio.

Mitigation:
Create a dedicated geometry conversion utility that explicitly accounts for viewport size, page offsets, zoom, and device pixel ratio. This module should be unit tested.

### Overlay Leaking Into Capture

Risk:
The selection overlay may appear in the captured image if the screenshot is taken before the overlay is hidden.

Mitigation:
Hide the overlay immediately before capture and wait one render tick before invoking tab capture.

### Freeform Complexity

Risk:
True freeform cutout behavior adds complexity and may behave inconsistently across browsers.

Mitigation:
Support freeform drawing in version 1 but permit the crop result to use the freeform selection's bounding region rather than a masked cutout.

### Google Search Endpoint Changes

Risk:
Google's upload/search flow may change over time.

Mitigation:
Keep search handoff isolated in its own module so only one component needs updating if Google changes the workflow.

### Restricted Pages

Risk:
Some pages may not allow content script injection or capture.

Mitigation:
Detect unsupported contexts and show a clear extension message instead of failing silently.

## Error Handling

The extension must fail clearly and recover cleanly.

Expected cases:

- Selection mode injection fails
- Visible tab capture fails
- Crop generation fails
- Search handoff fails
- The active page is unsupported

For each case, the extension should:

- Remove active overlay state if present
- Avoid leaving the tab in a broken interaction state
- Show a concise, actionable error message
- Allow the user to retry immediately

## Permissions and Privacy

The extension should request the minimum permissions required to:

- Activate on webpages
- Capture the visible tab
- Run keyboard shortcut commands
- Open the Google result tab

All image processing should remain local to the browser extension. No custom backend or third-party service should store captured images.

The only external handoff is the intentional search request sent to Google when the user completes a selection.

## Testing Strategy

### Manual Testing

Manual validation should cover:

- Chrome toolbar activation
- Chrome keyboard shortcut activation
- Firefox toolbar activation
- Firefox keyboard shortcut activation
- Rectangle selection on typical webpages
- Freeform selection on typical webpages
- High-DPI screens
- Browser zoom changes
- Pages with sticky headers and overlays
- Social and commerce sites with dense layouts

### Unit Testing

Unit tests should cover:

- Rectangle coordinate normalization
- Freeform path bounds calculation
- Viewport-to-screenshot coordinate conversion
- Crop size validation
- Search handoff request construction where practical

### Later Automation

If the project grows, browser automation can be added for basic activation and capture regression tests, but this is not required for the first build.

## Suggested Initial File Structure

The codebase should be organized around shared logic first:

```text
src/
  background/
  content/
  overlay/
  capture/
  search/
  options/
  shared/
manifests/
  chrome/
  firefox/
tests/
docs/
```

This keeps product behavior separated by responsibility and makes it easier to adapt browser-specific packaging later.

## Delivery Scope for Version 1

Version 1 should include:

- Chrome extension build
- Firefox extension build
- Toolbar activation
- Keyboard shortcut activation
- Rectangle selection
- Freeform selection
- Local screenshot crop
- Automatic new-tab Google image search
- Options for default selection mode
- Clear handling for cancel and error states

Version 1 does not need:

- Desktop capture
- Post-capture editing
- Search history
- Cloud sync
- Multi-engine search support

## Open Implementation Constraint

The current workspace is not a git repository, so the design document can be written locally but cannot be committed until the project is placed inside a git repo or initialized as one.
