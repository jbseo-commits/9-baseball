/* Mechanical alpha-preserving encode of the delivered articulated rig export.
   Usage: PITCHER_SHARP_MODULE=/path/to/sharp node scripts/build-pitcher-rig-runtime.cjs SOURCE_KIT
   The source kit contains the original parts, skeletal renderer and120-frame exports.
   Encoding does not redraw or anatomically edit artwork. */
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require(process.env.PITCHER_SHARP_MODULE||'sharp');
const source=path.resolve(process.argv[2]||'../9zone-full-roster-rig-20261030');
const out=path.resolve('assets/pitcher-rig-v1');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 await fs.mkdir(out+'/atlases',{recursive:true});
 const roster=JSON.parse(await fs.readFile(source+'/roster.json','utf8')).characters;
 const entries=[];
 // Sequential encodes avoid20 large decoded atlases competing for memory.
 sharp.concurrency(2);sharp.cache({memory:64});
 for(const c of roster){
  const rig=JSON.parse(await fs.readFile(`${source}/characters/${c.id}/rig.json`,'utf8'));
  const png=await fs.readFile(`${source}/atlases/${c.id}.png`),file=`atlases/${c.id}.avif`;
  const encoded=await sharp(png).avif({quality:70,effort:4,chromaSubsampling:'4:4:4'}).toBuffer();
  const meta=await sharp(encoded).metadata();
  if(meta.width!==2560||meta.height!==3072||!meta.hasAlpha)throw Error(c.id+' invalid alpha atlas');
  await fs.writeFile(out+'/'+file,encoded);
  const a=rig.atlas.anchor,s=rig.atlas.rendered_scale,p=rig.frames[76].releasePoint;
  const project=p=>({x:a[0]+p.x*s,y:a[1]+(p.y+.24*(p.z||0)-1)*s});
  const engineFiles=['rig.mjs','motion.mjs','calibration.mjs'];
  const engineHashes={};for(const name of engineFiles)engineHashes[name]=hash(await fs.readFile(source+'/engine/'+name));
  entries.push({id:c.id,name:c.name,adultAge:c.age,hand:c.hand,style:c.style,styleStatus:c.styleStatus,rhythm:c.rhythm,
   file:'assets/pitcher-rig-v1/'+file,frames:120,fps:60,columns:10,rows:12,cell:[256,256],releaseFrame:76,
   anchor:{x:a[0],y:a[1]},renderedScale:s,release:project(p),release3D:p,
   stride:{frame:55,...project(rig.frames[55].joints.leadFoot)},
   ball:'Held in cells0..75 only; cells76..119 have no projectile. Game owns flight after release.',
   source:{kit:'9ZONE-20-pitcher-rig-source-kit.zip',atlasSha256:hash(png),rigSha256:hash(await fs.readFile(`${source}/characters/${c.id}/rig.json`)),engineSha256:engineHashes},
   runtimeSha256:hash(encoded),runtimeBytes:encoded.length,
   status:'integrated_candidate',artAcceptance:false,knownVisualLimitations:['joint seams','release grip','weight transfer']});
  console.log(c.id,Math.round(encoded.length/1024)+'KiB');
 }
 await fs.writeFile(out+'/manifest.json',JSON.stringify({revision:'full-roster-articulated-20261030',integrationAuthorization:'User: 게임에 적용해줘 (2026-10-31 KST)',representation:'120 frames baked from24 independent cutout parts per character; not a runtime skinned mesh',projection:'x=anchor.x+x3D*scale; y=anchor.y+(y3D+0.24*z3D-1)*scale',sourceKit:'9ZONE-20-pitcher-rig-source-kit.zip (delivered separately; masters are not runtime imports)',encoder:{sharp:sharp.versions.sharp,format:'AVIF',quality:70,chromaSubsampling:'4:4:4',alpha:true},characters:entries},null,2)+'\n');
 console.log('Total',entries.reduce((n,c)=>n+c.runtimeBytes,0));
})().catch(e=>{console.error(e);process.exit(1)});
