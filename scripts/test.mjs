import { build } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const ziel = await mkdtemp(join(tmpdir(), 'kaplan-tests-'));
try {
  await build({
    configFile: false,
    logLevel: 'error',
    build: {
      lib: {
        entry: resolve('tests/projektsteuerung.test.ts'),
        formats: ['es'],
        fileName: () => 'tests.mjs',
      },
      outDir: ziel,
      emptyOutDir: true,
      minify: false,
      rollupOptions: { external: /^node:/ },
    },
  });
  await import(pathToFileURL(join(ziel, 'tests.mjs')).href);
} finally {
  await rm(ziel, { recursive: true, force: true });
}
