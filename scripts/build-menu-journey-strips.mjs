// Pack already-rendered pixelfx/Pixelbolt cells without resizing or alpha edits.
// node scripts/build-menu-journey-strips.mjs COLLECT_ATLAS_JSON SETTLE_ATLAS_JSON [OUT]
import fs from 'node:fs';
import path from 'node:path';
import {decodePNG,encodePNG} from './lib/png.mjs';
const [collect,settle,out='assets/menu-journey']=process.argv.slice(2);
if(!collect||!settle)throw new Error('Provide the pixelfx collect and Pixelbolt settle atlas JSON paths.');
fs.mkdirSync(out,{recursive:true});
const manifest={};
for(const [name,file] of [['collect',collect],['settle',settle]]){
  const atlas=JSON.parse(fs.readFileSync(file,'utf8'));
  const frames=Array.isArray(atlas.frames)?atlas.frames:Object.values(atlas.frames);
  const image=decodePNG(fs.readFileSync(path.resolve(path.dirname(file),atlas.meta.image)));
  const {w:width,h:height}=frames[0].frame;
  const data=new Uint8Array(width*frames.length*height*4);
  for(const [i,{frame:r}] of frames.entries()){
    if(r.w!==width||r.h!==height)throw new Error('Unequal cells must not be resized to fit a strip.');
    for(let y=0;y<height;y++){
      const start=((r.y+y)*image.width+r.x)*4;
      data.set(image.data.subarray(start,start+width*4),(y*width*frames.length+i*width)*4);
    }
  }
  fs.writeFileSync(path.join(out,name+'.png'),encodePNG({width:width*frames.length,height,data}));
  manifest[name]={frames:frames.length,width,height,durationMs:frames.reduce((sum,f)=>sum+f.duration,0),loop:false,
    pivot:name==='collect'?[56,94]:[32,40],
    origin:name==='collect'?'pixelfx pickups/collect-burst; custom gold palette; light=.45':'Pixelbolt holy-spells impact adaptation'};
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
