// @vitest-environment happy-dom
import React,{createRef} from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import BattleView from '../src/duel/battle-vnext/BattleView.jsx';
import HandDock from '../src/duel/battle-vnext/HandDock.jsx';
import SceneEffects from '../src/duel/battle-vnext/SceneEffects.jsx';
import {buildFixture} from '../src/duel/battle-vnext/fixtures.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {atbatCamera,actorBox,toScreen,SCENE} from '../src/duel/battle-vnext/scene-geometry.js';
import {ATBAT_COMPOSITION as C} from '../src/duel/battle-vnext/atbat-composition.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import {presentationFor,presentationTimeline} from '../src/duel/presentation.js';
const vm=id=>buildBattleViewModel(buildFixture(id));
afterEach(cleanup);

describe('at-bat registration preserves whole poses and follows the painted ground',()=>{
  for(const [w,h] of [[379,327],[451,312],[515,342],[625,720],[893,840],[1320,1080],[667,327],[740,312],[844,342],[1440,840]])it(`field ${w}x${h}: every pose inside one stable camera`,()=>{
    const camera=atbatCamera(w,h);
    expect(camera.x).toBeLessThanOrEqual(.01);expect(camera.y).toBeLessThanOrEqual(.01);
    expect(camera.x+SCENE.world.width*camera.scale).toBeGreaterThanOrEqual(w-.01);
    expect(camera.y+SCENE.world.height*camera.scale).toBeGreaterThanOrEqual(h-.01);
    for(const name of ['batter','pitcher']){
      const a=C[name],box=actorBox(a);
      for(const f of a.frames){const [l,t,r,b]=f.alphaBounds;
        const lo=toScreen(camera,{x:box.x+l*box.scale,y:box.y+t*box.scale});
        const hi=toScreen(camera,{x:box.x+r*box.scale,y:box.y+b*box.scale});
        expect(lo.x,`${name} ${f.name} left`).toBeGreaterThanOrEqual(-.01);
        expect(lo.y,`${name} ${f.name} top`).toBeGreaterThanOrEqual(-.01);
        expect(hi.x,`${name} ${f.name} right`).toBeLessThanOrEqual(w+.01);
        expect(hi.y,`${name} ${f.name} bottom`).toBeLessThanOrEqual(h+.01);
      }
      expect(toScreen(camera,{x:box.x+a.anchor.x*box.scale,y:box.y+a.anchor.y*box.scale})).toEqual(toScreen(camera,a.worldFoot));
    }
    expect(C.pitcher.worldFoot).toEqual(C.mound);
  });
  it('pitch flight starts at the new release; exact impact and flash land on the actual drawn bat',()=>{
    const f=buildFixture('cinema-exact'),model=buildBattleViewModel({...f,fxStage:'impact'}),timeline=presentationTimeline(presentationFor(f.s));
    const playback={action:'swing',timeline};
    const flight=sceneEffectAt({elapsed:timeline.impactAt*.54,playback,phase:'flight',composition:C});
    expect(flight.ball).toEqual(C.release);
    const impact=sceneEffectAt({elapsed:timeline.impactAt,playback,phase:'result',result:model.result,composition:C});
    expect(impact.ball).toEqual(C.contact);
    const {container}=render(<SceneEffects effect={impact} composition={C}/>);
    expect(Number(container.querySelector('.bv-contact-burst circle').getAttribute('cx'))).toBe(C.contact.x);
    expect(Number(container.querySelector('.bv-contact-burst circle').getAttribute('cy'))).toBe(C.contact.y);
  });
  it('knockout light follows the new mound, without a ball when none is flying',()=>{
    const {container}=render(<SceneEffects finale="knockout" composition={C}/>);
    const el=container.querySelector('.bv-mound-resolve ellipse');
    expect([Number(el.getAttribute('cx')),Number(el.getAttribute('cy'))]).toEqual([C.mound.x,C.mound.y]);
    expect(container.querySelector('image')).toBeNull();
  });
});

describe('one field target and one right-side action',()=>{
  it('moves existing controls without adding a hand-opening or execution step',()=>{
    const model=vm('swing-main'),onSwing=vi.fn();const {container}=render(<BattleView model={model} actors={{}} onSwing={onSwing}/>);
    expect(container.querySelectorAll('.bv-zone')).toHaveLength(1);
    expect(container.querySelectorAll('.bv-action')).toHaveLength(1);
    expect(container.querySelector('.bv-zone').closest('.bv-command-rail')).toBeNull();
    expect(container.querySelector('.bv-hand-grid').closest('.bv-command-rail')).not.toBeNull();
    expect(container.querySelector('.bv-plan').closest('.bv-command-rail')).not.toBeNull();
    expect(screen.getByTestId('bp-swing').getAttribute('aria-label')).toContain('밀어치기');
    expect(container.querySelector('.bv-field-choice').textContent).toContain('3존 커버');
    fireEvent.click(screen.getByTestId('bp-swing'));fireEvent.click(screen.getByTestId('bp-swing'));
    expect(onSwing).toHaveBeenCalledTimes(1);
  });
  it('keeps actual range glyph, cost, shortages and warnings from the real model',()=>{
    const model=vm('cost-short');render(<BattleView model={model} actors={{}}/>);
    const main=document.querySelector('.bv-card.is-main'),item=model.hand.find(c=>c.selectionRole==='main');
    expect([...main.querySelectorAll('.bv-glyph i')].flatMap((el,i)=>el.classList.contains('on')?[i]:[])).toEqual(item.coverage);
    expect(main.querySelector('.bv-card-cost').textContent).toContain(String(item.cost));
    expect(screen.getByTestId('bv-energy').dataset.energy).toBe('1');
    expect(document.querySelector('.bv-plan-problem').textContent).toBe('에너지 부족');
    expect(screen.getByTestId('bp-swing').disabled).toBe(true);
  });
});

describe('grid hand interaction and inspector return',()=>{
  it('restores both axes and scrolls keyboard focus by actual grid columns',()=>{
    const model=vm('watch-read0'),ref=createRef();
    render(<HandDock ref={ref} grid hand={model.hand} input={model.input} energy={model.energy}/>);
    const row=screen.getByTestId('bv-hand');row.style.gridTemplateColumns='120px 120px';
    ref.current.setScroll({x:12,y:180});expect(ref.current.getScroll()).toEqual({x:12,y:180});
    const cards=screen.getAllByTestId('bv-card');cards[0].focus();fireEvent.keyDown(cards[0],{key:'ArrowDown'});
    expect(document.activeElement).toBe(cards[2]);
    fireEvent.keyDown(cards[2],{key:'ArrowUp'});expect(document.activeElement).toBe(cards[0]);
  });
  it('a vertical swipe never selects the card on release, and the next real tap still works',()=>{
    const model=vm('watch-read0'),tap=vi.fn();render(<HandDock grid hand={model.hand} input={model.input} onCardTap={tap}/>);
    const card=screen.getAllByTestId('bv-card')[0];
    fireEvent.pointerDown(card,{pointerId:1,clientX:50,clientY:200});
    fireEvent.pointerMove(card,{pointerId:1,clientX:50,clientY:140});fireEvent.pointerUp(card,{pointerId:1});fireEvent.click(card);
    expect(tap).not.toHaveBeenCalled();
    fireEvent.pointerDown(card,{pointerId:2,clientX:50,clientY:160});fireEvent.pointerUp(card,{pointerId:2});fireEvent.click(card);
    expect(tap).toHaveBeenCalledTimes(1);
  });
});

describe('fan overflow counters use scroll layout, not transient animation transforms',()=>{
  it('never invents an upward hidden card at the top while the entry frame is translated',()=>{
    const model=vm('watch-read0');render(<HandDock grid="orbit" hand={model.hand} input={model.input}/>);
    const row=screen.getByTestId('bv-hand');row.style.display='grid';row.style.position='relative';
    Object.defineProperties(row,{clientWidth:{value:300},clientHeight:{value:200}});
    for(const [i,el]of [...row.querySelectorAll('.bv-card-slot')].entries()){
      Object.defineProperties(el,{offsetTop:{value:i*88},offsetHeight:{value:80}});
      vi.spyOn(el,'getBoundingClientRect').mockReturnValue({top:-1000,bottom:-900,left:0,right:300,width:300,height:100});
    }
    fireEvent.scroll(row);
    expect(document.querySelector('.bv-hand-more.left')).toBeNull();
    expect(screen.getByTestId('bv-hand-more').textContent).toBe('3 ↓');
  });
});
