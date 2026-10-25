// Copies the tfjs WASM binaries and downloads the KataGo net into public/ so both are
// served same-origin. Adapted from web-katrain (MIT): scripts/copy-tfjs-wasm.mjs and
// scripts/fetch-katago-small-model.mjs.
import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');

const MODEL_URL =
  'https://raw.githubusercontent.com/lightvector/KataGo/master/cpp/tests/models/g170-b6c96-s175395328-d26788732.bin.gz';
const modelOut = path.join(projectRoot, 'public', 'models', 'g170-b6c96.bin.gz');

async function copyWasm() {
  const srcDir = path.join(projectRoot, 'node_modules', '@tensorflow', 'tfjs-backend-wasm', 'dist');
  const outDir = path.join(projectRoot, 'public', 'tfjs');
  await fs.mkdir(outDir, { recursive: true });
  const names = (await fs.readdir(srcDir)).filter((n) => n.endsWith('.wasm'));
  if (names.length === 0) throw new Error(`No .wasm files found in ${srcDir}`);
  await Promise.all(names.map((n) => fs.copyFile(path.join(srcDir, n), path.join(outDir, n))));
  console.log(`Copied ${names.length} wasm files to public/tfjs/`);
}

async function fetchModel() {
  try {
    await fs.stat(modelOut);
    console.log('Model already present: public/models/g170-b6c96.bin.gz');
    return;
  } catch {
    // not present yet
  }
  console.log(`Downloading model from ${MODEL_URL}`);
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`Failed to download model: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(modelOut), { recursive: true });
  await fs.writeFile(modelOut, buf);
  console.log(`Saved public/models/g170-b6c96.bin.gz (${buf.length} bytes)`);
}

await copyWasm();
await fetchModel();
