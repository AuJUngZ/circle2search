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
  'options/index': 'src/options/index.ts',
  'search/index': 'src/search/search.ts'
};

for (const browser of ['chrome', 'firefox']) {
  await mkdir(path.join(distRoot, browser, 'options'), { recursive: true });
  await mkdir(path.join(distRoot, browser, 'overlay'), { recursive: true });
  await mkdir(path.join(distRoot, browser, 'search'), { recursive: true });

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
  await cp('src/search/search.html', path.join(distRoot, browser, 'search', 'index.html'), { recursive: false });

  const manifest = await readFile(path.join('manifests', browser, 'manifest.json'), 'utf8');
  await writeFile(path.join(distRoot, browser, 'manifest.json'), manifest);
}