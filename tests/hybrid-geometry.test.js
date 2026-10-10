import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {decodePNG} from '../scripts/lib/png.mjs';
import {FIELD,GROUND,projectGround,ACTOR_GEOMETRY} from '../src/hybrid/geometry.js';
import {actorContactPoint} from '../src/duel/actorContact.js';
import {fallbackBall,fallbackElapsed} from '../src/hybrid/model.js';

const sheet=decodePNG(fs.readFileSync('assets/production-art/battle-portrait-v15/batter-sheet-runtime.png'));
const baseline=1527/1536;
function inside([x,y],vertices){
  let value=false;
  for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
    const [xi,yi]=vertices[i],[xj,yj]=vertices[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)value=!value;
  }
  return value;
}
const placedPixel=(x,y)=>[FIELD.batter.x+x/768*FIELD.batter.h,FIELD.batter.y+(y/768+1-baseline)*FIELD.batter.h];

describe('authored field geometry',()=>{
  it('projects equal regulation boxes, plate and mound through one ground camera',()=>{
    const inner=GROUND.halfPlate+GROUND.gap,outer=inner+GROUND.boxWidth;
    const depths=[GROUND.halfPlate-3,GROUND.halfPlate+3];
    for(const [side,box] of [[-1,FIELD.batterBox],[1,FIELD.oppositeBox]]){
      expect(box).toEqual([[side*outer,depths[0]],[side*inner,depths[0]],[side*inner,depths[1]],[side*outer,depths[1]]].map(([u,v])=>projectGround(u,v)));
      const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
      expect(length(box[0],box[1])).toBeGreaterThan(length(box[2],box[3]));
    }
    const mound=projectGround(0,GROUND.moundDistance);
    expect(mound[0]).toBeCloseTo(FIELD.rubber.x);expect(mound[1]).toBeCloseTo(FIELD.rubber.y);
    for(const line of FIELD.foulLines)for(const point of line){expect(inside(point,FIELD.batterBox)||inside(point,FIELD.oppositeBox)).toBe(false)}
  });
  it('keeps actual opaque shoe pixels inside the batting box through every key pose',()=>{
    for(let frame=0;frame<7;frame++){
      const violations=[];let shoePixels=0;
      for(let y=720;y<768;y++)for(let x=0;x<512;x++){
        const i=(((frame>>2)*768+y)*sheet.width+(frame%4)*512+x)*4;
        if(sheet.data[i+3]<200)continue;
        shoePixels++;
        if(!inside(placedPixel(x,y),FIELD.batterBox))violations.push([x,y]);
      }
      expect(shoePixels,`pose ${frame} must have a planted shoe`).toBeGreaterThan(200);
      expect(violations.slice(0,5),`pose ${frame}: shoe crossed chalk`).toEqual([]);
    }
  });
  it('places the plate outside the batter box and the pitcher stance on the rubber',()=>{
    expect(FIELD.plate.some(point=>inside(point,FIELD.batterBox))).toBe(false);
    expect({x:FIELD.pitcher.x+FIELD.pitcher.w/2,y:FIELD.pitcher.y+FIELD.pitcher.h}).toEqual(FIELD.rubber);
    const contacts=Array.from({length:9},(_,z)=>actorContactPoint(FIELD.batter,z,ACTOR_GEOMETRY.contactAnchor));
    expect(Math.min(...contacts.map(p=>p.x))+FIELD.batter.h*.017).toBeGreaterThanOrEqual(Math.min(...FIELD.plate.map(p=>p[0])));
  });
  it('touches the actual orange barrel rather than an empty point outside the sprite',()=>{
    const ball=actorContactPoint(FIELD.batter,4,ACTOR_GEOMETRY.contactAnchor),radius=FIELD.batter.h*.017;
    const wood=placedPixel(503,405);
    for(let z=0;z<9;z++){
      const at=actorContactPoint(FIELD.batter,z,ACTOR_GEOMETRY.contactAnchor);
      expect(Math.hypot(at.x-wood[0],at.y-wood[1])).toBeLessThanOrEqual(radius);
    }
    const i=((768+405)*sheet.width+503)*4;
    expect(sheet.data[i+3]).toBeGreaterThan(200);
    expect(sheet.data[i]).toBeGreaterThan(sheet.data[i+2]*1.2);
    const fallback=fallbackBall({grade:'solid',motion:{impactAt:1567}},1567,4,{b:FIELD.batter,p:FIELD.pitcher,geometry:ACTOR_GEOMETRY});
    expect(fallback.x).toBeCloseTo(ball.x);expect(fallback.y).toBeCloseTo(ball.y);
  });
  it('retains legacy contact unless a caller opts into measured sprite geometry',()=>{
    expect(actorContactPoint({x:40,y:100,w:200,h:300},4)).toEqual({x:257,y:262});
    const atRelease=fallbackBall({grade:'solid',motion:{impactAt:1567}},1267,4,{b:FIELD.batter,p:FIELD.pitcher,geometry:ACTOR_GEOMETRY});
    expect(atRelease.x).toBeCloseTo(FIELD.pitcher.x+FIELD.pitcher.w*.119);
  });
  it('holds the actual fallback ball and bat on contact for the same 90ms as Pixi',()=>{
    const shot={grade:'solid',motion:{impactAt:1567,swing:true}},boxes={b:FIELD.batter,p:FIELD.pitcher,geometry:ACTOR_GEOMETRY};
    const contact=fallbackBall(shot,1567,4,boxes);
    expect(contact.r).toBeCloseTo(FIELD.batter.h*.017);
    for(const wallTime of [1567,1587,1657])expect(fallbackBall(shot,fallbackElapsed(shot,wallTime),4,boxes)).toEqual(contact);
    expect(fallbackElapsed(shot,1677)).toBe(1587);
    expect(fallbackElapsed({...shot,grade:'near-miss'},1587)).toBe(1587);
    expect(fallbackElapsed({...shot,motion:{...shot.motion,swing:false}},1587)).toBe(1587);
    expect(fallbackElapsed(shot,1587,true)).toBe(1587);
  });
});
