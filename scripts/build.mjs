import { mkdir } from 'node:fs/promises';

await mkdir('dist/chrome', { recursive: true });
await mkdir('dist/firefox', { recursive: true });
