// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import fs from 'node:fs';
import BallparkBattle from '../src/duel/BallparkBattle.jsx';
import {createV10Duel,enterV10Node} from '../src/duel/engine.js';
import {CARDS} from '../src/duel/cards.js';
import {cardFaceOf} from '../src/duel/card-face.js';
import {cardDetailOf} from '../src/duel/CardDetailSheet.jsx';
import {COACH_KEY} from '../src/duel/BallparkCoach.jsx';

beforeEach(()=>{localStorage.clear();localStorage.setItem(COACH_KEY,'done');});
afterEach(cleanup);
function open({kinds=['place','watch','flow','bunt'],strikes=0,momentum=0,shaken=0,pre=false,gimmick=null,problems=null,preparations=0,energy=null,phase='steady'}={}){
  const s=enterV10Node(createV10Duel(90211),'a1-entry');
  s.battle.strikes=strikes;s.battle.momentum=momentum;s.battle.shaken=shaken;
  s.battle.preparations=preparations;
  if(Number.isInteger(energy))s.battle.energy=energy;
  if(gimmick)s.v10.opponent.gimmick=gimmick;
  const pitcher={name:'레드 러시',hp:phase==='critical'?10:phase==='pressured'?30:60,maxHp:60,phase};
  if(pre){
    s.phase='pitch';s.last={kind:'swing'};
    s.battle.revealed={kind:'hit',zone:5,coverage:[5],aimZone:5,basesBefore:[null,null,null]};
    s.v10.lastCombat={hpBefore:60,momentumBefore:0,momentumAfter:momentum,shakenBefore:0,shakenAfter:shaken};
    pitcher.hp=10;pitcher.phase='critical';
  }
  const hand=kinds.map((kind,i)=>({id:'c'+i,entry:{kind},preview:{coverage:[4],problem:problems?.[i]||null}}));
  const onSelect=vi.fn(),onStack=vi.fn();
  const props={s,hand,pitcher,label:'1막',selected:null,swingStack:[],choice:null,onSelect,onStack,
    ...(pre?{fxStage:'windup',shot:{grade:'dead-center',kind:'hit',title:'안타'}}:{})};
  const result=render(<BallparkBattle {...props}/>);
  return {...result,props,onSelect,onStack};
}

describe('original battle readability',()=>{
  it('shows one payoff while retaining illustrations, coverage and separate use conditions',()=>{
    open();
    const attack=document.querySelector('[data-card-kind="place"]');
    expect(attack.querySelectorAll('.bp-card-desc p')).toHaveLength(1);
    expect(attack.textContent).toContain('정타 HP +50%');
    expect(attack.querySelector('.bp-card-art').style.backgroundImage).toContain('url(');
    expect(attack.querySelectorAll('.bp-glyph i')).toHaveLength(9);
    const flow=document.querySelector('[data-card-kind="flow"]');
    expect(flow.querySelector('.bp-card-condition').textContent).toBe('주자 필요');
    expect(flow.querySelector('.bp-role-mark')).not.toBeNull();
    fireEvent.click(attack);expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('keeps bunt outs and two-strike risk visible on its small face',()=>{
    open({kinds:['bunt'],strikes:2});
    const bunt=document.querySelector('[data-card-kind="bunt"]');
    expect(bunt.textContent).toContain('아웃 +1');
    expect(bunt.textContent).toContain('진루 +1');
    expect(bunt.textContent).toContain('희생 70% · 파울도 삼진');
    expect(cardFaceOf({kind:'bunt',plus:true},{strikes:2}).condition).toContain('85%');
    const squeeze=cardFaceOf({kind:'squeeze',plus:true},{strikes:2});
    expect(squeeze.summary).toBe('진루 +1 · 아웃 +1');
    expect(squeeze.condition).toBe('희생 92% · 파울도 삼진');
  });
  it('uses real upgraded effects without changing conditional lane power into base power',()=>{
    expect(cardFaceOf({kind:'watch',plus:true}).summary).toBe('카드 3장 뽑기');
    expect(cardFaceOf({kind:'scout'}).summary).toBe('높이·볼 간파');
    expect(cardFaceOf({kind:'scout',plus:true}).summary).toBe('높이·안팎 간파');
    expect(cardFaceOf({kind:'slug',plus:true}).summary).toBe('파워 +54');
    expect(cardFaceOf({kind:'highLane',plus:true}).summary).toBe('파워 +18 · 높은 공 파워 +18');
    expect(cardFaceOf({kind:'tableSetter',plus:true}).summary).not.toContain('파워');
    for(const kind of Object.keys(CARDS))expect(cardFaceOf({kind}).summary,kind).toBeTruthy();
  });
  it('shows the actual post-play draw count on preparation cards and in the selected plan',()=>{
    expect(cardFaceOf({kind:'watch'},{drawPreview:{requested:2,count:0,reason:'hand'}}).summary).toBe('뽑기 0장');
    expect(cardFaceOf({kind:'watch',plus:true},{drawPreview:{requested:3,count:1,reason:'hand'}}).drawNote).toBe('손패 5장 한도');
    expect(cardFaceOf({kind:'scout'},{drawPreview:{requested:1,count:1,reason:null}}).summary).toBe('뽑기 1장 · 높이·볼 간파');
    expect(cardFaceOf({kind:'calm'}).summary).toBe('생존 · 카드 +1');
    expect(cardFaceOf({kind:'calm',plus:true},{drawPreview:{requested:2,count:0,reason:'stock'}})).toMatchObject({summary:'뽑기 0장 · 생존',drawNote:'뽑을 카드 부족'});
    const view=open({kinds:['watch']});
    const s={...view.props.s,deck:view.props.s.deck.map((c,i)=>i===0?{...c,kind:'watch',plus:true}:c),
      battle:{...view.props.s.battle,hand:['c0','c1','c2','c3','c4'],draw:[],discard:[]}};
    const hand=[{id:'c0',entry:{kind:'watch',plus:true},preview:{problem:null}}];
    view.rerender(<BallparkBattle {...view.props} s={s} hand={hand} selected="c0"/>);
    expect(document.querySelector('[data-card-kind="watch"]').textContent).toContain('뽑기 1장');
    expect(document.querySelector('.bp-plan-predict').textContent).toBe('뽑기 1장');
    expect(document.querySelector('.bp-plan-input').textContent).toContain('손패 5장 한도');
    const blocked=[{...hand[0],preview:{problem:'이번 타석의 준비 2회를 모두 사용했습니다.'}}];
    view.rerender(<BallparkBattle {...view.props} s={s} hand={blocked} selected="c0"/>);
    expect(document.querySelector('.bp-plan-input').textContent).toBe('준비 횟수 소진');
  });
  it('shows active preparation effects from battle state and hides them after the plate appearance',()=>{
    const view=open({kinds:['watch','flow']});
    const active={...view.props.s,battle:{...view.props.s.battle,aim:2,runSignal:true,runSignalPlus:true,
      expanded:true,expandedPlus:true,bonusPower:3,bonusDmg:2,bonusPressure:.25,bonusBall:4,bonusWalk:5,bonusFoul:6,
      patient:true,scouted:true,scoutPlus:true,scoutBall:true}};
    view.rerender(<BallparkBattle {...view.props} s={active}/>);
    const effects=screen.getByTestId('bp-plan-effects');
    for(const phrase of ['준비 유지','집중 +2','안타 시 주자 +2루','범위 +1 · 타석 유지','파워 +54','안타 HP +2','정타 HP +25%','볼 HP +4','볼넷 HP +5','파울 HP +6','존 안 미적중 파울 확률↑','이번 공 간파: 높이·안팎'])expect(effects.textContent).toContain(phrase);
    view.rerender(<BallparkBattle {...view.props} s={{...active,phase:'pitch'}} fxStage="windup"/>);
    expect(screen.queryByTestId('bp-plan-effects')).toBeNull();
    view.rerender(<BallparkBattle {...view.props} s={{...active,phase:'pitch'}}/>);
    expect(screen.getByTestId('bp-plan-effects').textContent).toContain('준비 유지');
    const between={...active,phase:'between'};
    view.rerender(<BallparkBattle {...view.props} s={between}/>);
    expect(screen.queryByTestId('bp-plan-effects')).toBeNull();
  });
  it('keeps the same tap for selection and the second tap arms a support without a dialog',()=>{
    const view=open({kinds:['place','strike']});
    fireEvent.click(document.querySelector('[data-card-kind="place"]'));
    expect(view.onSelect).toHaveBeenCalledWith('c0');
    view.rerender(<BallparkBattle {...view.props} selected="c0"/>);
    fireEvent.click(document.querySelector('[data-card-kind="strike"]'));
    expect(document.querySelector('[data-card-kind="strike"]').classList.contains('armed')).toBe(true);
    fireEvent.click(document.querySelectorAll('.bp-cell')[8]);
    expect(view.onStack).toHaveBeenCalledWith([{id:'c1',aimZone:8}]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('removes the zero gauges and spells out active effects',()=>{
    const view=open();
    // At 0 there is no dedicated instrument; the values live in the inspector.
    expect(screen.queryByTestId('bp-mental')).toBeNull();
    expect(screen.queryByTestId('bp-momentum')).toBeNull();
    view.unmount();open({momentum:3,shaken:1});
    expect(screen.getByTestId('bp-mental').textContent).toContain('1/3');
    expect(screen.getByTestId('bp-mental').textContent).toContain('볼 증가 · 읽기 +1');
    expect(screen.getByTestId('bp-momentum').textContent).toContain('×1.3');
  });
  it('does not expose the next gauge values or HP phase before the ball lands',()=>{
    open({pre:true,momentum:3,shaken:1,gimmick:{id:'tyrant',label:'낮은 벽',summary:'낮은 3코스 비중 +10%p.',phases:{critical:'낮은 3코스 +20%p'}}});
    // Frozen pre-pitch values with no zero instruments on the field.
    expect(screen.queryByTestId('bp-mental')).toBeNull();
    expect(screen.queryByTestId('bp-momentum')).toBeNull();
    expect(screen.getByTestId('bp-gimmick').textContent).not.toContain('+20%p');
    // Frozen pre-pitch HP/phase: the live pitcher is already critical (10/60)
    // but gauges, labels and scene effects must still show the thrown-into state.
    expect(document.querySelector('.bp-scene').dataset.gphase).toBe('steady');
    expect(document.querySelector('.bp-ptag').getAttribute('aria-label')).toContain('HP 60 / 60');
  });
  it('moves long gimmick rules to the inspector while the field keeps numbers',()=>{
    open({gimmick:{id:'trick',label:'속임수 코스',summary:'첫 공은 60% 확률로 예고 옆 칸으로 이동합니다.'}});
    const panel=screen.getByTestId('bp-gimmick');
    expect(panel.querySelector('.bp-gimmick-current').textContent).toContain('60%');
    expect(panel.querySelector('details')).toBeNull();
    fireEvent.click(screen.getByTestId('bp-inspect-open'));
    const body=screen.getByTestId('bp-inspect').textContent;
    expect(body).toContain('60%');
  });
  it('shows condition and warning together instead of letting one hide the other',()=>{
    // Prep: flow needs a runner (condition) while prep count is exhausted (warning).
    let view=open({kinds:['flow'],preparations:99});
    const flow=document.querySelector('[data-card-kind="flow"]');
    expect(flow.querySelector('.bp-card-condition')?.textContent).toBe('주자 필요');
    expect(flow.querySelector('.bp-card-warning')?.textContent).toBe('준비 횟수 소진');
    view.unmount();
    // Attack: 2S bunt keeps its foul-strikeout condition even with an energy problem.
    view=open({kinds:['bunt'],strikes:2,problems:['에너지가 부족합니다 · 1/0 필요']});
    const bunt=document.querySelector('[data-card-kind="bunt"]');
    expect(bunt.querySelector('.bp-card-condition')?.textContent).toContain('파울도 삼진');
    expect(bunt.querySelector('.bp-card-warning')?.textContent).toBe('에너지 부족');
  });
  it('keeps a support budget marker and an accessible cause on an over-budget face',()=>{
    const view=open({kinds:['slug','laser']});
    view.rerender(<BallparkBattle {...view.props} selected="c0"/>);
    const laser=document.querySelector('[data-card-kind="laser"]');
    // Face: marker only — the exact sum would assume a support join that
    // pickSwing may turn into a main replacement.
    expect(laser.querySelector('.bp-card-warning')).toBeNull();
    expect(laser.querySelector('.bp-card-support-limit')).not.toBeNull();
    expect(laser.getAttribute('aria-label')).toContain('지원 비용 초과');
    expect(laser.textContent).not.toContain('합치면');
    expect(laser.textContent).toContain('파워 +18');
  });
  it('never offers squeeze as a stackable support (bunt family, not kind string)',()=>{
    const view=open({kinds:['place','squeeze']});
    view.rerender(<BallparkBattle {...view.props} selected="c0"/>);
    const squeeze=document.querySelector('[data-card-kind="squeeze"]');
    expect(squeeze.classList.contains('armed')).toBe(false);
    fireEvent.click(squeeze);
    expect(view.onSelect).toHaveBeenCalledWith('c1');
    expect(cardDetailOf('squeeze').stack).toContain('겹치기 불가');
  });
  it('keeps lane and fx conditions in V16 summaries instead of flattening to base power',()=>{
    expect(cardFaceOf({kind:'pullHook'}).summary).toContain('몸쪽');
    expect(cardFaceOf({kind:'oppoPower'}).summary).toContain('바깥');
    expect(cardFaceOf({kind:'highLane'}).summary).toContain('높은 공');
    expect(cardFaceOf({kind:'middleMash'}).summary).toContain('한가운데');
    expect(cardFaceOf({kind:'readStrike'}).summary).toContain('간파');
    expect(cardFaceOf({kind:'focusBreath'}).summary).toContain('집중 +1');
    expect(cardFaceOf({kind:'focusBreath'}).summary).toContain('정확 HP +40%');
    expect(cardFaceOf({kind:'squeeze',plus:true}).summary).toBe('진루 +1 · 아웃 +1');
  });
  it('keeps collapsed gimmick numbers and current phase limits',()=>{
    // Pressure at 0S0B applies nothing yet: honest, no invented reduction.
    let view=open({gimmick:{id:'pressure',label:'압박 투구',summary:'1스트라이크부터 코스가 1개.'}});
    expect(screen.getByTestId('bp-gimmick').textContent).toContain('이번 카운트 적용 없음');
    view.unmount();view=open({strikes:2,gimmick:{id:'pressure',label:'압박 투구',summary:'1스트라이크부터 코스가 1개.'}});
    expect(screen.getByTestId('bp-gimmick').textContent).toContain('코스 +3 · 볼 감소');
    view.unmount();view=open({gimmick:{id:'trick',label:'속임수 코스',summary:'첫 공은 60% 확률로 예고 옆 칸으로 이동합니다.'}});
    // First pitch (0S0B): only the actually-applying 60% shows.
    expect(screen.getByTestId('bp-gimmick').textContent).toContain('옆 칸 이동 60%');
    expect(screen.getByTestId('bp-gimmick').textContent).not.toContain('25%');
    view.unmount();view=open({strikes:1,gimmick:{id:'trick',label:'속임수 코스',summary:'첫 공은 60% 확률로 예고 옆 칸으로 이동합니다.'}});
    expect(screen.getByTestId('bp-gimmick').textContent).toContain('옆 칸 이동 25%');
    view.unmount();view=open({gimmick:{id:'bluff',label:'볼 유인',summary:'존 밖 볼이 평소보다 35%p 늘어난다.'}});
    expect(screen.getByTestId('bp-gimmick').textContent).toContain('+35%p');
    view.unmount();view=open({gimmick:{id:'tyrant',label:'낮은 벽',summary:'낮은 3코스 비중 +10%p.'}});
    expect(screen.getByTestId('bp-gimmick').textContent).toContain('+10%p');
    expect(screen.getByTestId('bp-gimmick').textContent).not.toContain('+20%p');
  });
  it('scopes refinement CSS to the battle and preserves the original readability file',()=>{
    const css=fs.readFileSync('src/duel/original-ui-refinement.css','utf8');
    expect(css).not.toMatch(/^html|^\s*body|^#root|\.duel-app/m);
    expect(css).toMatch(/\.bp-battle\.bp-readable/);
    const legacy=fs.readFileSync('src/duel/battle-readability.css','utf8');
    expect(legacy).toContain('안 던짐');
    expect(legacy).toContain('.v14-battle-portrait .bp-battle');
  });
});
