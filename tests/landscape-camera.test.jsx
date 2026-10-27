// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {cameraGeometry,FIELD,projectField,targetPoint,moundHeight,castShadowEnd} from '../src/duel/landscape-camera.js';
import {LANDSCAPE_BATTER} from '../src/duel/landscape-batter.js';
import {BATTER_MOTION_V3_SEQUENCE} from '../src/duel/batterMotionV3.js';
import {sheetCellStyle} from '../src/duel/batter-v15.js';
import LandscapeField from '../src/duel/LandscapeField.jsx';
import {contactPoint} from '../src/duel/ImpactFx.jsx';
import {actorDrawScale} from '../src/duel/BallparkActors.jsx';
import {pitcherReleasePoint} from '../src/duel/actor-anchors.js';
import RELEASE from '../src/duel/pitcher-release.json';
import STANCE from '../src/duel/pitcher-stance.json';
describe('one ground camera for the opt-in wide battle',()=>{
  it('preserves camera-projected actor height at large PC sizes and every DPR; portrait retains its old crisp scale',()=>{
    for(const height of [104,540,767,2048])for(const dpr of [1,2,3])expect(actorDrawScale(height,512,dpr,true)*512).toBeCloseTo(height);
    expect(actorDrawScale(767,512,2,false)).toBe(1);
  });
  it.each([[400,104],[664,125],[1020,420]])('keeps batter feet in the left box and rubber beyond plate at %s×%s',(w,h)=>{
    const g=cameraGeometry(w,h),inner=projectField(w,h,-FIELD.plate/2-FIELD.boxGap,-.25),outer=projectField(w,h,-FIELD.plate/2-FIELD.boxGap-FIELD.boxWidth,-.25);
    expect(g.feet.x).toBeGreaterThan(outer.x);expect(g.feet.x).toBeLessThan(inner.x);
    expect(g.rubber.x).toBeGreaterThan(g.plate.x);expect(g.rubber.y).toBeLessThan(g.plate.y);
    expect(g.pitcher.y+g.pitcher.h).toBeCloseTo(g.rubber.y);
    expect(g.batter.y+g.batter.h).toBeCloseTo(g.feet.y);
    expect(targetPoint(g.target,4).x).toBeCloseTo(g.contact.x);
    expect(targetPoint(g.target,4).y).toBeCloseTo(g.contact.y);
    for(const b of [g.batter,g.pitcher,g.target]){expect(b.w).toBeGreaterThan(0);expect(b.h).toBeGreaterThan(0);}
  });
  it('keeps the complete oblique actor envelope in the field at phone, PC and ultrawide sizes',()=>{
    for(const [w,h] of [[400,104],[664,125],[1180,574],[1800,200]]){
      const g=cameraGeometry(w,h);
      for(const b of [g.batter,g.pitcher]){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(w);expect(b.y+b.h).toBeLessThan(h);}
    }
  });
  it('uses the same measured stance/release point for DOM flight and the wide square atlas',()=>{
    const box={x:50,y:20,w:100,h:100};
    for(const id of Object.keys(RELEASE)){
      const [sx,sy]=STANCE[id]||[.5,1],[rx,ry]=RELEASE[id];
      const p=pitcherReleasePoint(box,id);
      expect(p.x).toBeCloseTo(box.x+box.w/2+(rx-sx)*box.h);
      expect(p.y).toBeCloseTo(box.y+box.h+(ry-sy)*box.h);
    }
  });
  it('projects one plate, two boxes, and a separate rubber without baking duplicate ground in art',()=>{
    render(<LandscapeField width={664} height={125}/>);
    expect(screen.getByTestId('camera-plate').tagName.toLowerCase()).toBe('polygon');
    expect(screen.getByTestId('camera-box-left').getAttribute('points').split(' ')).toHaveLength(4);
    expect(screen.getByTestId('camera-rubber')).toBeTruthy();cleanup();
  });
  it('grounds the rubber and pitcher at the same raised plateau and sends their shared shadow away from the key light',()=>{
    expect(moundHeight(0,FIELD.rubberDistance)).toBe(.254);
    expect(moundHeight(0,FIELD.rubberDistance-.4572)).toBe(.254);
    expect(moundHeight(FIELD.moundRadius,FIELD.rubberDistance-.4572)).toBe(0);
    expect(moundHeight(1.5,FIELD.rubberDistance-.4572)).toBeGreaterThan(0);
    expect(moundHeight(1.5,FIELD.rubberDistance-.4572)).toBeLessThan(.254);
    const end=castShadowEnd(-.96,-.25,1.8);expect(end[0]).toBeGreaterThan(-.96);expect(end[1]).toBeLessThan(-.25);
    render(<LandscapeField width={664} height={202}/>);
    expect(screen.getByTestId('camera-mound').querySelectorAll('polygon')).toHaveLength(17);
    const foot=screen.getByTestId('ground-shadow-pitcher').dataset.foot.split(',').map(Number),g=cameraGeometry(664,202);
    expect(foot[0]).toBeCloseTo(g.rubber.x);expect(foot[1]).toBeCloseTo(g.rubber.y);cleanup();
  });
  it('has a new frame and measured anchor for every timeline pose; DOM uses same anchors',()=>{
    for(const pose of BATTER_MOTION_V3_SEQUENCE){
      expect(LANDSCAPE_BATTER.order[pose]).toBeGreaterThanOrEqual(0);
      expect(LANDSCAPE_BATTER.order[pose]).toBeLessThan(LANDSCAPE_BATTER.rects.length);
      const anchor=LANDSCAPE_BATTER.anchors[pose];expect(anchor.baseline).toBeGreaterThan(.9);
      expect(sheetCellStyle(LANDSCAPE_BATTER,pose)['--baseline']).toBe(anchor.baseline);
      expect(sheetCellStyle(LANDSCAPE_BATTER,pose)['--pose-x']).toBe(anchor.x);
    }
  });
  it('makes outside pitches miss the proxy instead of snapping to the centre',()=>{
    const box={x:10,y:20,w:30,h:30};expect(targetPoint(box,9)).toEqual({x:45.4,y:35});
  });
  it('starts impact at the visible field proxy, while a hidden proxy leaves portrait contact unchanged',()=>{
    const scene=document.createElement('div');scene.innerHTML='<div class="bp-field-target"></div><div class="bp-zone"></div>';
    const field=scene.children[0],board=scene.children[1];let fieldWidth=24;
    Object.defineProperty(field,'offsetWidth',{get:()=>fieldWidth});
    scene.getBoundingClientRect=()=>({left:50,top:100,width:400,height:120});
    field.getBoundingClientRect=()=>({left:240,top:140,width:24,height:24});
    board.getBoundingClientRect=()=>({left:500,top:130,width:132,height:132,bottom:262});
    expect(contactPoint(scene,4)).toEqual({x:202,y:52,sw:400,sh:120});
    expect(contactPoint(scene,9).x).toBeCloseTo(218.32);
    fieldWidth=0;expect(contactPoint(scene,4)).toEqual({x:516,y:96,sw:400,sh:120});
  });
});
