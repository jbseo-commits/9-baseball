import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../assets/pitcher-review-grounding-r2/',import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const manifest=read('manifest.json'),annotations=read('grounding-annotations.json');
const captures=read('references/game-camera.json').captures;
const registration=JSON.parse(fs.readFileSync(new URL('../src/duel/battle-vnext/roster-registration.json',import.meta.url),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const inside=(p,poly)=>{
 const sides=poly.map((a,i)=>{const b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1];return (dx*(p[1]-a[1])-dy*(p[0]-a[0]))/Math.hypot(dx,dy)});
 return Math.min(...sides)>=-.6||Math.max(...sides)<=.6;
};

describe('R2 pitcher source and grounding regression contracts',()=>{
 it('uses reviewed anatomical pivot soles instead of the former two-boot median',()=>{
  expect(manifest.characters).toHaveLength(20);expect(annotations.manual_review_complete).toBe(true);
  for(const c of manifest.characters){
   const record=annotations.characters.find(a=>a.slug===c.slug);
   expect(record.manually_reviewed,c.slug).toBe(true);
   expect(Object.keys(record.source_pose_pixel_sha256),c.slug).toHaveLength(12);
   expect(c.anchor,c.slug).toEqual(record.anchor);
   expect(c.anchor,c.slug).toEqual({x:record.preparation_contacts['0'].x,y:record.preparation_contacts['0'].y});
   expect(c.grounding.pivot_foot,c.slug).toBe(c.throwing_hand);
   expect(c.anchor,c.slug).not.toEqual(c.prior_anchor);
  }
  const onyx=manifest.characters.find(c=>c.slug==='onyx-eclipse');
  expect(onyx.throwing_hand).toBe('left');expect(onyx.grounding.pivot_screen_side).toBe('right');
 });
 it('keeps SET, gather and lift boot contacts inside the independently photographed rubber',()=>{
  let checks=0;
  for(const c of manifest.characters)for(const cap of captures){
   expect(cap.rubberScreen.annotations_verified).toBe(true);
   const scale=cap.actorHeightReference*342/640/c.scale_basis_height,target=cap.rubberScreen.contact;
   for(const phase of ['0','1','2']){
    const p=c.grounding.preparation_contacts[phase],world=[target.x+(p.x-c.anchor.x)*scale,target.y+(p.y-c.anchor.y)*scale];
    expect(inside(world,cap.rubberScreen.polygon),`${c.slug}/${cap.capture}/${phase}`).toBe(true);checks++;
   }
   expect(c.landing_point,c.slug).not.toEqual(c.anchor);
  }
  expect(checks).toBe(120);
 });
 /* Hashes every preserved source PNG. Alone it runs in well under a second, but inside the full parallel
    suite it has exceeded the default 5s limit and failed intermittently. Same assertions, longer limit. */
 it('preserves 20 approved identities and the native original source bytes',()=>{
  for(const c of manifest.characters)expect(sha(fs.readFileSync(path.join(root,c.master_png))),c.slug).toBe(c.master_sha256);
  const preservation=read('reports/source-preservation.json');
  for(const f of preservation.files)expect(sha(fs.readFileSync(path.join(root,f.path))),f.path).toBe(f.sha256);
  const selected=new Set(manifest.characters.flatMap(c=>Object.values(c.source_sheets)));
  expect(selected.size).toBe(40);
  expect(preservation.files.filter(f=>f.current_selected).map(f=>f.path).sort()).toEqual([...selected].sort());
  const amber=manifest.characters.find(c=>c.slug==='regular-03-amber-sinker');
  expect(amber.source_sheets.keys).toBe('source/regular-03-amber-sinker-keys-G3.png');
  expect(selected.has('source/regular-03-amber-sinker-keys-G2.png')).toBe(false);
  expect(preservation.files.find(f=>f.path==='source/regular-03-amber-sinker-keys-G2.png').current_selected).toBe(false);
 },30_000);
 it('publishes real 12-pose RGBA files, before images, and the existing release event contracts',()=>{
  for(const c of manifest.characters){
   expect(c.poses,c.slug).toHaveLength(12);expect(c.preview_frames).toHaveLength(12);expect(c.prior_preview_frames).toHaveLength(12);
   expect(c.phase_ms[6],c.slug).toBe(c.release_ms);expect(c.release_ms).toBe(Math.round(registration[c.slug].releaseFrame*1000/60));
   expect(c.phase_ms.every((t,i,a)=>i===0||t>a[i-1])).toBe(true);
   expect(c.release_point.x).toBeGreaterThan(0);expect(c.release_point.y).toBeGreaterThan(0);
   for(const rel of c.poses){
    const png=fs.readFileSync(path.join(root,rel));expect(png.subarray(1,4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(512);expect(png.readUInt32BE(20)).toBe(512);expect(png[25]).toBe(6);
   }
   for(const rel of [...c.preview_frames,...c.prior_preview_frames])expect(fs.existsSync(path.join(root,rel)),rel).toBe(true);
  }
 });
 it('redraws the five diagnosed deliveries and retains the other fifteen drawings',()=>{
  expect(manifest.redrawn_characters).toHaveLength(5);
  for(const c of manifest.characters){
   const different=c.preview_frames.filter((p,i)=>!fs.readFileSync(path.join(root,p)).equals(fs.readFileSync(path.join(root,c.prior_preview_frames[i])))).length;
   if(manifest.redrawn_characters.includes(c.slug)){
    expect(different,c.slug).toBe(12);expect(c.packing.scale).toBe(.9375);expect(c.packing.pad).toBe(16);
   }else expect(different,c.slug).toBe(0);
  }
 });
 it('keeps this publication a review candidate with no production atlas or runtime mapping',()=>{
  expect(manifest.production_atlas_generated).toBe(false);expect(manifest.production_imported).toBe(false);
  expect(manifest.game_runtime_changed).toBe(false);expect(manifest.motion_approved).toBe(false);
 });
 it('keeps the independently published review document outside the production game public payload',()=>{
  expect(fs.existsSync(new URL('../public/art-review/pitcher-grounding-r2/index.html',import.meta.url))).toBe(false);
  const published=read('reports/live-publication.json');
  expect(sha(fs.readFileSync(path.join(root,'gallery.html')))).toBe(published.sha256);
 });
});
