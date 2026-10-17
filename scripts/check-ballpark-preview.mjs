import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const root = path.resolve('preview-artifacts/ballpark-motion-v6');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const bytes = fs.readFileSync(path.join(root, 'index.html'));
const html = bytes.toString('utf8');
const fail = message => { throw new Error(message); };
if (bytes.length !== manifest.bytes) fail('Preview byte count changed. Revalidate before publishing.');
if (crypto.createHash('sha256').update(bytes).digest('hex') !== manifest.sha256) fail('Preview differs from the reviewed artifact.');
if (/<(?:script|link)\b[^>]+(?:src|href)\s*=/i.test(html)) fail('External script or stylesheet dependency.');
if (/(?:https?:\/\/|file:\/\/|[A-Z]:[\\/]|localhost|127\.0\.0\.1|\.codex[\\/])/i.test(html)) fail('Remote URL or local host path in the public artifact.');
if (/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|showOpenFilePicker|showSaveFilePicker)\s*\(|serviceWorker\s*\./.test(html)) fail('Unexpected remote/host API.');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
if (scripts.length !== 11) fail('Expected eleven inline runtime scripts.');
scripts.forEach((match, i) => new vm.Script(match[1], {filename: `preview-inline-${i}.js`}));
const art = html.match(/window\.BALLPARK_INLINE_ART=(\{[\s\S]*?\});/);
if (!art) fail('Missing inline art registry.');
const images = JSON.parse(art[1]);
for (const [key, value] of Object.entries(images)) {
  if (!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(value)) fail(`Invalid embedded image: ${key}`);
}
for (const key of ['stadium-v1.png','pitcher-ready-v1.png','inbetweens/pitcher-landing-v5.png','inbetweens/pitcher-fielding-v5.png']) {
  if (!(key in images)) fail(`Missing required sprite: ${key}`);
}
if ('batter.png' in images || Object.keys(images).some(key=>/inbetweens\/batter-.*-v4\.png$/.test(key))) fail('Old front-view batter bundled.');
for (const key of ['ready','load','plant','entry','drive','contact','extend','finish','unwind','regrip','bunt']) {
  if (!(('inbetweens/batter-'+key+'-v6.png') in images)) fail('Missing rear-view batter '+key);
}
if (Object.keys(images).length !== manifest.embeddedImages) fail('Embedded image count mismatch.');
if (!('inbetweens/wooden-bat-v6.png' in images)) fail('Complete separate wooden bat missing.');
for (const asset of manifest.sourceSprites) {
  const source=fs.readFileSync(path.join(root,asset.file));
  if(source.length!==asset.bytes || crypto.createHash('sha256').update(source).digest('hex')!==asset.sha256) fail('Source sprite changed: '+asset.file);
  if(source.readUInt32BE(16)!==1024 || source.readUInt32BE(20)!==1536 || source[25]!==6) fail('Unexpected source sprite format: '+asset.file);
}
console.log(`Preview verified: ${bytes.length} bytes, ${scripts.length} inline scripts, ${Object.keys(images).length} embedded images, SHA-256 ${manifest.sha256}`);
