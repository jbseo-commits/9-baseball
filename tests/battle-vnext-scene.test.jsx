// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,cleanup,act} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import BattleScene,{SAMPLE_ACTORS,approvedPitcherArt,STADIUM_URL} from '../src/duel/battle-vnext/BattleScene.jsx';
import {worldCamera,cameraMatrix,actorBox,SCENE} from '../src/duel/battle-vnext/scene-geometry.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';

afterEach(()=>{cleanup();vi.unstubAllGlobals();});

describe('BattleScene — 정지 원화 Scene',()=>{
  it('구장·배우를 같은 world transform 안에 배치한다',()=>{
    const {container}=render(<BattleScene size={{width:844,height:390}} actors={SAMPLE_ACTORS}/>);
    const world=container.querySelector('.bv-world');
    expect(world.style.transform).toBe(cameraMatrix(worldCamera(844,390)));
    expect(world.querySelector('.bv-stadium').getAttribute('src')).toBe(STADIUM_URL);
    for(const name of ['batter','pitcher']){
      const el=world.querySelector('.bv-actor-'+name),b=actorBox(SCENE[name]);
      const px=v=>parseFloat(v);
      expect(px(el.style.left)).toBeCloseTo(b.x,4);expect(px(el.style.top)).toBeCloseTo(b.y,4);
      expect(px(el.style.width)).toBeCloseTo(b.width,4);expect(px(el.style.height)).toBeCloseTo(b.height,4);
      expect(el.querySelector('img').getAttribute('src')).toBe(SAMPLE_ACTORS[name]);
    }
    expect(world.querySelectorAll('.bv-ground-shadow').length).toBe(3);
  });

  it('승인된 상대 그림이 없으면 투수 자리를 비운다 (샘플로 대체하지 않음)',()=>{
    expect(approvedPitcherArt('red-rush')).toBeNull();
    expect(approvedPitcherArt(null)).toBeNull();
    const {container}=render(<BattleScene size={{width:844,height:390}} actors={{batter:SAMPLE_ACTORS.batter,pitcher:approvedPitcherArt('red-rush')}}/>);
    const p=container.querySelector('.bv-actor-pitcher');
    expect(p.dataset.actorMissing).toBe('true');
    expect(p.querySelector('img')).toBeNull();
    expect(container.querySelector('.bv-actor-batter img')).not.toBeNull();
  });

  it('좌우 반전·배우 단독 확대가 없다',()=>{
    const css=readFileSync('src/duel/battle-vnext/scene.css','utf8'),jsx=readFileSync('src/duel/battle-vnext/BattleScene.jsx','utf8');
    for(const src of [css,jsx]){expect(src).not.toMatch(/scaleX\(\s*-1|scale\(\s*-1|rotateY\(\s*180/);}
    expect(css).not.toMatch(/\.bv-actor[^{]*\{[^}]*(transform|scale)/);
    expect(css).not.toMatch(/(^|[,\s])(html|body|#root|\.duel-app)\s*[,{]/m);
  });

  it('ResizeObserver로 크기를 따라가고 언마운트 때 해제한다',()=>{
    const observers=[];
    class RO{constructor(cb){this.cb=cb;this.disconnect=vi.fn();observers.push(this);}observe(el){this.el=el;}}
    vi.stubGlobal('ResizeObserver',RO);
    let w=1440,h=900;
    const ow=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'clientWidth'),oh=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'clientHeight');
    Object.defineProperty(HTMLElement.prototype,'clientWidth',{configurable:true,get(){return this.classList?.contains('bv-scene')?w:0;}});
    Object.defineProperty(HTMLElement.prototype,'clientHeight',{configurable:true,get(){return this.classList?.contains('bv-scene')?h:0;}});
    try{
      const layouts=[];
      const {container,unmount}=render(<BattleScene actors={SAMPLE_ACTORS} onLayout={s=>layouts.push(s)}/>);
      const world=container.querySelector('.bv-world');
      expect(world.style.transform).toBe(cameraMatrix(worldCamera(1440,900)));
      w=844;h=390;act(()=>observers[0].cb([]));
      expect(world.style.transform).toBe(cameraMatrix(worldCamera(844,390)));
      expect(container.querySelector('.bv-scene').dataset.cameraAlign).toBe('1');
      expect(layouts.at(-1).width).toBe(844);
      unmount();
      expect(observers[0].disconnect).toHaveBeenCalled();
    }finally{
      if(ow)Object.defineProperty(HTMLElement.prototype,'clientWidth',ow);
      if(oh)Object.defineProperty(HTMLElement.prototype,'clientHeight',oh);
    }
  });

  it('view model scene을 data 속성으로만 읽고 모션 미구현을 표시한다',()=>{
    const vm=buildBattleViewModel(buildFixture('flight'));
    const {container}=render(<BattleScene scene={vm.scene} phase={vm.phase} size={{width:844,height:390}} actors={SAMPLE_ACTORS} reviewNotice/>);
    const root=container.querySelector('.bv-scene');
    expect(root.dataset).toMatchObject({phase:'flight',fxStage:'windup',motion:'static'});
    expect(root.dataset.playToken).toBe(String(vm.scene.playToken));
    expect(container.querySelector('.bv-scene-notice').textContent).toMatch(/동작은 아직 없음.*샘플 투수/);
  });

  it('화면 좌표를 CSS 변수로 넘긴다 (C04/C05 오버레이용)',()=>{
    const {container}=render(<BattleScene size={{width:1440,height:900}} actors={{}}/>);
    const st=container.querySelector('.bv-scene').style;
    for(const k of ['--bv-home-x','--bv-home-y','--bv-release-x','--bv-contact-y'])expect(st.getPropertyValue(k)).toMatch(/px$/);
  });
});
