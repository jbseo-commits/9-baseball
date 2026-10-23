// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import {createV10Duel,enterV10Node,readLevel,previewCard,setAimZone,playV10Action} from '../src/duel/engine.js';
import {createLessonBattle} from '../src/duel/zone-first-model.js';
import {COACH_KEY} from '../src/duel/BallparkCoach.jsx';

afterEach(()=>{cleanup();localStorage.clear();});
function props(s,extra={}){
  localStorage.setItem(COACH_KEY,'done');
  return {s,hand:s.battle.hand.map(id=>({id,entry:s.deck.find(c=>c.id===id),preview:previewCard(s,id)})),
    selected:null,swingStack:[],choice:null,pitcher:s.pitcher,label:'1막',onAim:vi.fn(),onSelect:vi.fn(),onStack:vi.fn(),...extra};
}
const courseSnapshot=()=>[...document.querySelectorAll('.bp-cell')].map(e=>({
  face:e.getAttribute('aria-description'),mark:e.querySelector('[data-course-mark]')?.dataset.courseMark,
  style:e.getAttribute('style'),words:e.querySelector('.bp-pct')?.textContent,classes:e.querySelector('.bp-pct')?.className,
}));

it('communicates public bands with illustrated marks, a legend and accessible words, independent of the hidden pitch',()=>{
  const s=enterV10Node(createV10Duel(1),'a1-entry');expect(readLevel(s)).toBe(0);
  const p=props(s);const view=render(<BallparkBattle {...p}/>);
  const before=courseSnapshot();
  expect(before.some(c=>c.mark==='some'||c.mark==='rare')).toBe(true);
  expect(before.every(c=>!c.face?.includes('%'))).toBe(true);
  expect(screen.getByLabelText(/코스 표식:/).textContent).toContain('안 던짐');
  expect(document.querySelector('.bp-pct.top')).toBeNull();
  for(const c of before){
    if(c.mark==='rare')expect(c.style).toContain('0.15');
    if(c.mark==='some')expect(c.style).toContain('0.4');
  }
  view.rerender(<BallparkBattle {...p} s={{...s,battle:{...s.battle,pending:{...s.battle.pending,zone:9,roll:.999}}}}/>);
  expect(courseSnapshot()).toEqual(before);
  expect(document.querySelector('.ba-verdict-icon')).toBeNull();
});

it('keeps earned range and exact numbers visible instead of replacing them with coarse art',()=>{
  for(const count of [2,4]){
    let s=createV10Duel(1);
    s.deck=[...Array(count).fill('scout'),...Array(9-count).fill('place')].map((kind,i)=>({id:'r'+i,kind}));
    s.nextId=9;s=enterV10Node(s,'a1-entry');expect(readLevel(s)).toBe(count===2?1:2);
    render(<BallparkBattle {...props(s)}/>);
    const faces=[...document.querySelectorAll('.bp-cell:not(.dead) .bp-pct')];
    expect(faces.length).toBeGreaterThan(0);
    expect(faces.every(e=>!e.classList.contains('ba-word'))).toBe(true);
    expect(faces.some(e=>count===2?/\d+~\d+%/.test(e.textContent):/^\d+%$/.test(e.textContent))).toBe(true);
    expect(document.querySelector('.ba-legend').textContent).toBe('안 던짐');cleanup();
  }
});

it('retains main/support order and native zone input while the selected card remains named at the action',()=>{
  let s=enterV10Node(createV10Duel(31),'a1-entry');
  s.deck=[{id:'main',kind:'place'},{id:'support',kind:'place'}];s.battle.hand=['main','support'];s=setAimZone(s,4);
  const p=props(s,{selected:'main',swingStack:[{id:'support',aimZone:5}],choice:{coverage:[4,5],primaryCoverage:[4],supportCoverages:[{coverage:[5]}],cost:2}});
  render(<BallparkBattle {...p}/>);
  expect(document.querySelector('.bp-cell.aim .ba-aim-marker')).toBeTruthy();
  expect([...document.querySelectorAll('.bp-token')].map(e=>e.textContent)).toEqual(['1','2']);
  expect(document.querySelector('.bp-cell.assist')).toBeTruthy();
  expect(document.querySelector('.ba-action-caption').textContent).toBe('정타 노림');
  const cells=document.querySelectorAll('.bp-cell');fireEvent.click(cells[7]);expect(p.onAim).toHaveBeenCalledWith(7);
  expect(document.querySelectorAll('.bp-hand button')).toHaveLength(3);
});

it('shows the exact-read seal only after real contact and uses a watch icon for a taken pitch',()=>{
  const initial=createLessonBattle();
  const hit=playV10Action(setAimZone(initial,5),{type:'card',id:'basic'});
  const shot={kind:'hit',grade:'dead-center',title:'안타'};
  const view=render(<BallparkBattle {...props(hit,{fxStage:'windup',shot})}/>);
  expect(document.querySelector('.ba-verdict-icon')).toBeNull();expect(screen.queryByText('읽었다!')).toBeNull();
  view.rerender(<BallparkBattle {...props(hit,{fxStage:'impact',shot})}/>);
  expect(screen.getByText('읽었다!')).toBeTruthy();expect(document.querySelector('.ba-verdict-icon.ba-exact')).toBeTruthy();
  const taken=playV10Action(initial,{type:'take'});
  view.rerender(<BallparkBattle {...props(taken,{fxStage:'impact',shot:{kind:'called',grade:'called',title:'스트라이크'}})}/>);
  expect(screen.queryByText('읽었다!')).toBeNull();expect(document.querySelector('.ba-verdict-icon.ba-watch')).toBeTruthy();
  expect(document.querySelector('.bp-exact-read')).toBeNull();
});

it('leaves the separate autobattle HUD on its original presentation',()=>{
  render(<BallparkBattle {...props(createLessonBattle(),{autoLesson:true})}/>);
  expect(document.querySelector('.bp-asset-led')).toBeNull();
  expect(document.querySelector('.ba-legend')).toBeNull();
  expect(document.querySelector('.ba-action-caption')).toBeNull();
  expect(screen.getByTestId('bp-auto-lesson')).toBeTruthy();
});
