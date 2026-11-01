// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,cleanup,act} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import BattleScene,{SAMPLE_ACTORS,approvedPitcherArt,STADIUM_URL} from '../src/duel/battle-vnext/BattleScene.jsx';
import {PILOT_MOTION} from '../src/duel/battle-vnext/motion-timeline.js';
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
      const el=world.querySelector('.bv-actor-'+name),b=actorBox(PILOT_MOTION[name]);
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
    expect(root.dataset).toMatchObject({phase:'flight',fxStage:'windup',motion:'authored'});
    expect(root.dataset.playToken).toBe(String(vm.scene.playToken));
    expect(container.querySelector('.bv-scene-notice').textContent).toMatch(/포즈 모션 검수.*샘플 투수/);
  });

  it('화면 좌표를 CSS 변수로 넘긴다 (C04/C05 오버레이용)',()=>{
    const {container}=render(<BattleScene size={{width:1440,height:900}} actors={{}}/>);
    const st=container.querySelector('.bv-scene').style;
    for(const k of ['--bv-home-x','--bv-home-y','--bv-release-x','--bv-contact-y'])expect(st.getPropertyValue(k)).toMatch(/px$/);
  });
});

it('keeps the light pass on the actor projection and jitter, above result grading, including resize',()=>{
  const playback={action:'swing',startedAt:performance.now()-270,timeline:{impactAt:240,freeze:60,releaseAt:370,settleAt:720,duration:1040}};
  const props={actors:SAMPLE_ACTORS,phase:'result',framing:'atbat',playback,result:{kind:'hit',exact:true,actualZone:2,coverage:[2],call:'안타'}};
  const view=render(<BattleScene {...props} size={{width:844,height:390}}/>);
  for(const size of [{width:844,height:390},{width:1672,height:941}]){
    view.rerender(<BattleScene {...props} size={size}/>);
    const root=view.container.querySelector('.bv-scene'),pass=root.querySelector('.bv-effect-pass');
    expect(pass.querySelector('.bv-effect-world').style.transform).toBe(root.querySelector('.bv-world').style.transform);
    expect(pass.style.transform).toBe(root.querySelector('.bv-world-camera').style.transform);
    expect([...root.children].indexOf(pass)).toBeGreaterThan([...root.children].indexOf(root.querySelector('.bv-scene-shade')));
    expect(pass.querySelector('.bv-contact-burst')).not.toBeNull();
  }
});
