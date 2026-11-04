const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const dist = path.resolve(__dirname, '../dist');
const indexPath = path.join(dist, 'index.html');
const budgets = {
  initialRawKiB: 310,
  initialGzipKiB: 100,
  asyncChunkRawKiB: 55,
};

if (!fs.existsSync(indexPath)) {
  console.error('Missing dist/index.html. Run the production build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const initialPaths = new Set();
for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/g)) {
  const tag = match[0];
  const asset = match[1];
  if (tag.startsWith('<script') || (tag.startsWith('<link') && /rel="stylesheet"/.test(tag))) {
    initialPaths.add(path.join(dist, asset.replace(/^\/+/, '').split(/[?#]/)[0]));
  }
}

const initialAssets = [...initialPaths].filter(file => fs.existsSync(file));
if (initialAssets.length === 0) {
  console.error('Could not find initial JS/CSS assets referenced by dist/index.html.');
  process.exit(1);
}

const rawBytes = initialAssets.reduce((sum, file) => sum + fs.statSync(file).size, 0);
const gzipBytes = initialAssets.reduce((sum, file) => sum + zlib.gzipSync(fs.readFileSync(file)).length, 0);
const kib = bytes => (bytes / 1024).toFixed(1);
console.log(`Initial assets: ${kib(rawBytes)} KiB raw / ${kib(gzipBytes)} KiB gzip (${initialAssets.length} files)`);

const failures = [];
if (rawBytes > budgets.initialRawKiB * 1024) failures.push(`initial raw assets exceed ${budgets.initialRawKiB} KiB`);
if (gzipBytes > budgets.initialGzipKiB * 1024) failures.push(`initial gzip assets exceed ${budgets.initialGzipKiB} KiB`);

const jsDir = path.join(dist, 'js');
const initialSet = new Set(initialAssets.map(file => path.resolve(file)));
for (const name of fs.readdirSync(jsDir)) {
  if (!/^chunk-.*\.js$/.test(name)) continue;
  const file = path.resolve(jsDir, name);
  const size = fs.statSync(file).size;
  if (!initialSet.has(file) && size > budgets.asyncChunkRawKiB * 1024) {
    failures.push(`${name} is ${kib(size)} KiB; async chunk limit is ${budgets.asyncChunkRawKiB} KiB`);
  }
}

if (failures.length) {
  console.error('Performance budget failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Performance budgets passed (async JS chunks <= ${budgets.asyncChunkRawKiB} KiB).`);
