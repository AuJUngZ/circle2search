# Browser Image Search Extension

A lightweight, local-only browser extension for Chrome and Firefox that lets you select any region on a webpage and instantly search for it using Google Lens.

## Features

- **Quick Image Search**: Select any area of a webpage with your mouse or draw a freeform selection
- **Multiple Selection Modes**:
  - Rectangle selection for precise areas
  - Freeform selection for irregular shapes
- **Multiple Activation Methods**:
  - Click the toolbar button
  - Use a keyboard shortcut
- **Instant Results**: Opens Google image search results in a new tab automatically
- **Privacy-Focused**: All image capture and processing happens locally in your browser—no cloud uploads or external services
- **Cross-Browser**: Works seamlessly on both Chrome and Firefox

## Quick Start

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Building the Extension

Build unpacked extensions for both Chrome and Firefox:

```bash
npm run build
```

The built extensions will be available in:

- `dist/chrome` (Chrome extension)
- `dist/firefox` (Firefox extension)

### Loading into Your Browser

**Chrome:**

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/chrome` folder

**Firefox:**

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file from the `dist/firefox` folder

## Usage

1. **Activate the Extension**:
   - Click the extension icon in your toolbar, or
   - Use the keyboard shortcut (configurable in your browser settings)

2. **Select an Area**:
   - For rectangle: Click and drag to draw a rectangle around the item
   - For freeform: Click points to draw around the item, then double-click to finish

3. **View Results**:
   - A new tab opens automatically with Google Lens results for your selection

## Development

### Available Commands

- `npm install` — Install dependencies
- `npm run typecheck` — Type check with TypeScript
- `npm test` — Run unit tests
- `npm test:watch` — Run tests in watch mode
- `npm run build` — Build for Chrome and Firefox

### Project Structure

- `src/background/` — Background script that coordinates the extension
- `src/content/` — Content scripts injected into webpages
- `src/overlay/` — Selection overlay UI
- `src/capture/` — Image capture and crop logic
- `src/search/` — Google Lens search integration
- `src/shared/` — Shared utilities and types
- `tests/` — Unit tests
- `manifests/` — Browser manifest files

### Browser Support

- Chrome 90+
- Firefox 88+

## Architecture

The extension follows a modular architecture across multiple script contexts:

- **Background Script**: Listens for activation, manages the capture flow, and opens search results
- **Content Script**: Injects the selection UI into webpages and captures user selection coordinates
- **Overlay UI**: Renders the selection interface with visual feedback
- **Capture Module**: Handles image capture and cropping locally

## Contributing

This is a browser extension project built with TypeScript and Vitest. Contributions should:

- Follow the existing code structure
- Include tests for new functionality
- Pass type checking and tests before submission

## License

See LICENSE file for details.
