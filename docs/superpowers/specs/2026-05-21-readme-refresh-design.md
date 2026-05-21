# Crop2Search README Refresh Design

## Goal

Rewrite the root README so first-time users can understand what the extension does, see it in action quickly, and load it into Chrome or Firefox with minimal scrolling.

## Audience

- People evaluating the extension from the repository page
- Users who want to build and load the unpacked extension locally
- Contributors who still need a compact development reference lower in the file

## Chosen Approach

Use a user-first README structure:

1. Title and short product description
2. Embedded overview GIF from `public/overview.gif`
3. Key benefits and selection modes
4. Quick install/build/load instructions for Chrome and Firefox
5. Short usage guide with shortcut, cancel behavior, and options note
6. Compressed development and architecture notes below the user-facing content

## Notes

- Use the product name `Crop2Search` consistently
- Keep claims grounded in the current codebase and manifests
- Preserve contributor information, but move it below the primary user journey
