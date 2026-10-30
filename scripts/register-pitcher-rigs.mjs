import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/pitcher-rig-v1/manifest.json'),'utf8'));
const round=n=>Math.round(n*1e6)/1e6;
const registrations={},stance={},release={},stride={};
for(const c of manifest.characters){
  if(c.frames!==120||c.fps!==60||c.columns!==10||c.rows!==12||c.releaseFrame!==76)throw new Error(`${c.id}: unexpected runtime atlas contract`);
  const provenance={revision:manifest.revision,sourceKit:manifest.sourceKit,...c.source,runtimeSha256:c.runtimeSha256};
  registrations[c.id]={
    id:c.id,file:c.file,releaseFrame:c.releaseFrame,manifest:'assets/pitcher-rig-v1/manifest.json',
    anchor:c.anchor,visibleHeight:c.renderedScale,release:c.release,release3D:c.release3D,
    stride:c.stride,hand:c.hand,style:c.style,styleStatus:c.styleStatus,status:c.status,
    artAcceptance:c.artAcceptance,knownVisualLimitations:c.knownVisualLimitations,provenance,
    registration:'rig manifest projection; release socket frame 76; lead foot frame 55',
  };
  stance[c.id]=[round(c.anchor.x/256),round(c.anchor.y/256)];
  release[c.id]=[round(c.release.x/256),round(c.release.y/256)];
  stride[c.id]=[c.stride.frame,round(c.stride.x/256),round(c.stride.y/256)];
}
const write=(rel,value)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(value,null,2)+'\n');
write('src/duel/battle-vnext/roster-registration.json',registrations);
write('src/duel/pitcher-stance.json',stance);
write('src/duel/pitcher-release.json',release);
write('src/duel/pitcher-stride.json',stride);
