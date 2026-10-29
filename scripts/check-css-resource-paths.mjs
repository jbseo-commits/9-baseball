/* Post-build regression for nested Pages CSS URLs. Run after a real VITE_BASE
   build. Every local resource must resolve from the emitted stylesheet. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('dist'),files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.css'))files.push(p)}}
walk(root);let images=0,fonts=0,total=0;
for(const file of files){for(const m of fs.readFileSync(file,'utf8').matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)){
 const url=m[1];if(/^(data:|https?:|#)/.test(url))continue;
 assert.ok(!url.startsWith('/'),`CSS resource still repeats absolute base: ${url}`);
 const target=path.resolve(path.dirname(file),decodeURIComponent(url.split(/[?#]/)[0]));
 assert.ok(target.startsWith(root+path.sep),`resource escapes dist: ${url}`);
 assert.ok(fs.existsSync(target),`missing CSS resource ${url} from ${path.relative(root,file)}`);
 total++;if(/\.(woff2?|ttf|otf)$/.test(target))fonts++;else if(/\.(webp|png|svg|jpe?g)$/.test(target))images++;
}}
assert.ok(fonts>0&&images>0,'must verify both fonts and image assets');
console.log(`CSS resource paths: ${total} resolved (${fonts} fonts, ${images} images), including nested Pages paths`);
