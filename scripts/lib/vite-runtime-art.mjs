/* Build-time swap of heavy PNGs for their runtime WebP derivatives (scripts/optimize-runtime-art.py).
   An emitted PNG is swapped only when its bytes' sha1 is in assets/runtime-opt/manifest.json, so a
   changed master ships as-is instead of shipping stale art. Every reference in JS/CSS/HTML is
   rewritten to the new file name. Dev server and tests are untouched (build only).
   Set RUNTIME_ART=off to build with the masters (needed before re-running the optimizer). */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export default function runtimeArt({root=process.cwd()}={}){
  const dir=path.join(root,'assets','runtime-opt');
  return {
    name:'9zone-runtime-art',
    apply:'build',
    generateBundle(_opts,bundle){
      if(process.env.RUNTIME_ART==='off')return;
      let manifest;
      try{manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));}catch{return;}
      const renames=new Map();
      for(const [name,out] of Object.entries(bundle)){
        if(out.type!=='asset'||!name.endsWith('.png'))continue;
        const hit=manifest[crypto.createHash('sha1').update(out.source).digest('hex')];
        if(!hit)continue;
        const webp=path.join(dir,hit.file);
        if(!fs.existsSync(webp))continue;
        const next=name.replace(/\.png$/,'.webp');
        delete bundle[name];
        this.emitFile({type:'asset',fileName:next,source:fs.readFileSync(webp)});
        renames.set(path.posix.basename(name),path.posix.basename(next));
      }
      if(!renames.size)return;
      const swap=s=>{for(const [a,b] of renames)s=s.split(a).join(b);return s;};
      for(const out of Object.values(bundle)){
        if(out.type==='chunk')out.code=swap(out.code);
        else if(/\.(css|html|js|json)$/.test(out.fileName)&&typeof out.source==='string')out.source=swap(out.source);
        else if(/\.(css|html)$/.test(out.fileName)&&out.source instanceof Uint8Array)out.source=swap(Buffer.from(out.source).toString('utf8'));
      }
    },
  };
}
