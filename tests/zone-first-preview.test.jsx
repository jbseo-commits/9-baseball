// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {act} from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import ZoneFirstPreview,{PREVIEW_IMPACT_MS} from '../src/duel/ZoneFirstPreview.jsx';
import {createPreviewBattle,resultFeedback,publicZoneFaces,publicCoverText} from '../src/duel/zone-first-model.js';
import {setAimZone,playV10Action,coverageAt,publicProbabilities,readLevel} from '../src/duel/engine.js';

afterEach(()=>{cleanup();vi.useRealTimers();localStorage.clear();});
const zones=()=>[...document.querySelectorAll('.zf-zone')];
const card=kind=>document.querySelector(`.zf-card[data-kind="${kind}"]`);
const stage=()=>document.querySelector('.zf-preview').dataset.step;
const fixture=()=>{
  const s=createPreviewBattle();
  s.battle.hand=['c0','c1','c2','c3','c4'];
  s.battle.draw=s.deck.filter(c=>!s.battle.hand.includes(c.id)).map(c=>c.id);s.battle.discard=[];
  return s;
};
const start=()=>{const s=fixture();render(<ZoneFirstPreview initialState={s}/>);return s;};
const aimAndPick=kind=>{fireEvent.click(zones()[4]);fireEvent.click(card(kind));};

describe('zone-first preview interaction',()=>{
  it('starts with nine zones and a collapsed hand, without touching production saves',()=>{
    localStorage.setItem('9zone-v10-run','existing-run');start();
    expect(zones()).toHaveLength(9);expect(document.querySelector('.zf-hand')).toBeNull();
    expect(screen.getByRole('button',{name:/지켜보기/}).disabled).toBe(false);
    expect(localStorage.getItem('9zone-v10-run')).toBe('existing-run');
  });
  it('opens cards on a zone tap, folds them after selection, and re-aims without reopening',()=>{
    const s=start();aimAndPick('strike');
    expect(stage()).toBe('ready');expect(document.querySelector('.zf-hand')).toBeNull();
    fireEvent.click(zones()[2]);
    expect(stage()).toBe('ready');expect(zones()[2].getAttribute('aria-pressed')).toBe('true');
    expect(zones().flatMap((el,z)=>el.classList.contains('covered')?[z]:[])).toEqual(coverageAt(s,'c1',2));
  });
  it('allows returning from the hand with the current plan preserved',()=>{
    start();aimAndPick('strike');fireEvent.click(screen.getByRole('button',{name:'카드 바꾸기'}));
    fireEvent.click(screen.getByRole('button',{name:'선택으로 돌아가기'}));
    expect(stage()).toBe('ready');expect(document.querySelector('.zf-main-card').textContent).toContain('밀어치기');
  });
  it('places and removes support without moving the main aim',()=>{
    start();aimAndPick('place');fireEvent.click(screen.getByRole('button',{name:'＋ 지원 추가'}));
    fireEvent.click(card('strike'));expect(stage()).toBe('ready');
    expect(screen.getByRole('button',{name:/^타격!/}).disabled).toBe(true);
    fireEvent.click(zones()[2]);
    expect(zones()[4].getAttribute('aria-pressed')).toBe('true');
    expect(zones()[2].querySelector('[aria-label="지원 위치"]')).not.toBeNull();
    expect(document.querySelector('.zf-plan').textContent).toContain('비용 2/3');
    fireEvent.click(screen.getByRole('button',{name:'밀어치기 지원 제거'}));
    expect(document.querySelector('.zf-plan').textContent).toContain('비용 1/3');
  });
  it('cancels an armed support on mobile without consuming anything',()=>{
    start();aimAndPick('place');fireEvent.click(screen.getByRole('button',{name:'＋ 지원 추가'}));fireEvent.click(card('strike'));
    fireEvent.click(screen.getByRole('button',{name:'배치 취소'}));
    expect(zones()[4].getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('.zf-plan').textContent).toContain('비용 1/3');
  });
  it('keeps unsupported basic attacks and preparation out of support selection',()=>{
    start();aimAndPick('basic');expect(screen.queryByRole('button',{name:'＋ 지원 추가'})).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'카드 바꾸기'}));fireEvent.click(card('place'));
    fireEvent.click(screen.getByRole('button',{name:'＋ 지원 추가'}));
    expect(card('basic')).toBeNull();expect(card('setup')).toBeNull();expect(card('place')).toBeNull();
  });
  it('rejects an over-budget support with the real engine reason',()=>{
    const s=fixture();s.battle.energy=2;render(<ZoneFirstPreview initialState={s}/>);
    aimAndPick('slug');fireEvent.click(screen.getByRole('button',{name:'＋ 지원 추가'}));fireEvent.click(card('strike'));
    expect(stage()).toBe('hand');expect(document.querySelector('.zf-notice').textContent).toContain('에너지가 부족');
    expect(document.querySelector('.zf-notice').textContent).toContain('3/2');
  });
  it('uses a preparation without pitching and retains its active effect',()=>{
    start();aimAndPick('setup');fireEvent.click(screen.getByRole('button',{name:'준비 사용 에너지 0'}));
    expect(stage()).toBe('hand');expect(card('setup')).toBeNull();
    expect(document.querySelector('.zf-notice').textContent).toContain('준비 1/2');
    fireEvent.click(card('place'));expect(document.querySelector('.zf-notice').textContent).toContain('집중 +1');
    fireEvent.click(screen.getByRole('button',{name:'전투 정보'}));
    expect(document.querySelector('.zf-dialog').textContent).toContain('집중 1');
  });
  it('blocks exhausted preparations before use',()=>{
    const s=fixture();s.battle.preparations=2;render(<ZoneFirstPreview initialState={s}/>);fireEvent.click(zones()[4]);fireEvent.click(card('setup'));
    expect(stage()).toBe('hand');expect(document.querySelector('.zf-notice').textContent).toContain('준비 2회');
  });
  it('shows a scouted outside ball beside the board, without opening information',()=>{
    const s=fixture();s.battle.hand[4]='c5';s.battle.draw=s.deck.filter(c=>!s.battle.hand.includes(c.id)).map(c=>c.id);
    s.battle.pending={zone:9,roll:.5,powerRoll:.1};render(<ZoneFirstPreview initialState={s}/>);
    aimAndPick('scout');fireEvent.click(screen.getByRole('button',{name:'준비 사용 에너지 1'}));
    expect(document.querySelector('.zf-board-caption').textContent).toBe('존 밖 볼 확인');
    expect(stage()).toBe('hand');expect(screen.getByRole('button',{name:/지켜보기/}).disabled).toBe(false);
  });
  it('freezes HP/count/reveal during flight and applies the actual action once at impact',()=>{
    vi.useFakeTimers();const s=fixture();s.battle.pending={zone:4,roll:.5,powerRoll:.1};
    render(<ZoneFirstPreview initialState={s}/>);aimAndPick('place');
    const expected=playV10Action(setAimZone(s,4),{type:'card',id:'c0',supports:[]});
    fireEvent.click(screen.getByRole('button',{name:'타격! 에너지 1'}));
    expect(stage()).toBe('flight');expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe(String(s.pitcher.hp));
    expect(document.querySelector('.zf-zone.landed')).toBeNull();expect(document.querySelector('.zf-result-card')).toBeNull();
    expect(screen.getByRole('button',{name:/지켜보기/}).disabled).toBe(true);
    act(()=>vi.advanceTimersByTime(PREVIEW_IMPACT_MS-1));expect(stage()).toBe('flight');
    act(()=>vi.advanceTimersByTime(1));expect(stage()).toBe('result');
    expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe(String(expected.pitcher.hp));
    expect(document.querySelector('.zf-zone.landed')).toBe(zones()[4]);
    expect(document.querySelector('.zf-prompt').textContent).toContain(resultFeedback(expected).title);
    act(()=>vi.advanceTimersByTime(2000));expect(screen.getByRole('meter').getAttribute('aria-valuenow')).toBe(String(expected.pitcher.hp));
  });
  it('supports taking a pitch without selecting a zone and advances into a fresh aim step',()=>{
    vi.useFakeTimers();start();fireEvent.click(screen.getByRole('button',{name:/지켜보기/}));
    act(()=>vi.advanceTimersByTime(PREVIEW_IMPACT_MS));expect(stage()).toBe('result');
    fireEvent.click(screen.getByRole('button',{name:/다음 공/}));
    expect(stage()).toBe('aim');expect(document.querySelector('.zf-hand')).toBeNull();
    expect(zones().some(x=>x.getAttribute('aria-pressed')==='true')).toBe(false);
  });
});

describe('truthful result interpretation and public information',()=>{
  const state=(r,extra={})=>({pitcher:{hp:30},battle:{outs:0,revealed:r},v10:{lastCombat:{damage:3}},...extra});
  it('calls only actual orthogonally adjacent misses a one-cell miss',()=>{
    expect(resultFeedback(state({kind:'whiff',zone:5,coverage:[4],label:'헛스윙'})).tone).toBe('near');
    for(const zone of [2,9])expect(resultFeedback(state({kind:'whiff',zone,coverage:[4],label:'헛스윙'})).tone).not.toBe('near');
    expect(resultFeedback(state({kind:'whiff',zone:3,coverage:[2],label:'헛스윙'})).tone).not.toBe('near');
  });
  it('treats a support hit as success and includes the full coverage when measuring a miss',()=>{
    expect(resultFeedback(state({kind:'hit',zone:2,aimZone:4,primaryCoverage:[4],coverage:[4,2],label:'단타'})).title).toBe('지원이 받쳤다!');
    expect(resultFeedback(state({kind:'whiff',zone:2,coverage:[6,5],label:'헛스윙'})).tone).toBe('near');
  });
  it('does not call taking a strike a near miss or a good read',()=>{
    expect(resultFeedback(state({kind:'called',zone:4,coverage:[],label:'스트라이크'})).tone).toBe('quiet');
  });
  it('uses a quiet foul reaction and preserves strikeout consequences',()=>{
    expect(resultFeedback(state({kind:'foul',zone:8,coverage:[0],label:'파울'})).title).toBe('아직 승부 중.');
    const s=state({kind:'foul',zone:5,coverage:[4],label:'번트 파울 삼진',outsBefore:0});s.battle.outs=1;
    expect(resultFeedback(s).detail).toContain('삼진');
  });
  it('recognizes walks and knockouts from real outcome fields',()=>{
    expect(resultFeedback(state({kind:'ball',zone:9,label:'볼넷'})).title).toBe('끝까지 잘 참았다!');
    expect(resultFeedback(state({kind:'hit',zone:4,label:'안타'},{pitcher:{hp:0}})).title).toBe('강판!');
  });
  it('never changes public cells or coverage information based on the hidden sampled pitch',()=>{
    const a=fixture(),b=structuredClone(a);a.battle.pending={zone:2,roll:.01};b.battle.pending={zone:8,roll:.99};
    expect(publicZoneFaces(a)).toEqual(publicZoneFaces(b));
    expect(publicCoverText(a,[2,4,5])).toEqual(publicCoverText(b,[2,4,5]));
    expect(readLevel(a)).toBe(0);expect(publicCoverText(a,[2,4,5])).toBe('');
    expect(publicCoverText(a,[0,1,2,3,4,5,6,7,8])).not.toMatch(/1[1-9]\d%/);
    expect(publicProbabilities(a)).toEqual(publicProbabilities(b));
  });
  it('keeps identical level-zero cells identical when hidden outside probability differs',()=>{
    const a=fixture(),b=structuredClone(a);
    for(const s of [a,b])s.battle.intent.repertoire=[0,1,2];
    a.battle.intent.probabilities=[.1,.1,.1,0,0,0,0,0,0,.7];
    b.battle.intent.probabilities=[.3,.3,.3,0,0,0,0,0,0,.1];
    expect(publicZoneFaces(a)).toEqual(publicZoneFaces(b));
    expect(publicCoverText(a,[0])).toBe(publicCoverText(b,[0]));
    expect(publicCoverText(a,[0])).toBe('');
  });
});
