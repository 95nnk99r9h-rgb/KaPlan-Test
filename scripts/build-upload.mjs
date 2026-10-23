/** Erstellt den mitlieferbaren Build für statische Hosts und Pages aus einem Branch. */
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const app = path.join(root, 'app');
// Vor dem Entfernen des alten Builds sicherstellen, dass der neue vorhanden ist.
await readFile(path.join(dist, 'index.html'));
await rm(app, { recursive: true, force: true });
await mkdir(app, { recursive: true });
await cp(dist, app, { recursive: true });
await writeFile(path.join(app, '.nojekyll'), '');
await writeFile(path.join(root, '.nojekyll'), '');
console.log('Fertige Anwendung unter app/. Der gesamte Repository-Ordner kann hochgeladen werden.');
