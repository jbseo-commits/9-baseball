// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {act} from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import ZoneFirstPreview,{PREVIEW_IMPACT_MS} from '../src/duel/ZoneFirstPreview.jsx';
import {createLessonBattle,isExactRead,resultExplanation} from '../src/duel/zone-first-model.js';
import {playV10Action,setAimZone} from '../src/duel/engine.js';

const root=()=>document.querySelector('.zf-preview');
const zones=()=>document.querySelectorAll('.zf-zone');
const current=()=>document.querySelector('.zf-steps [aria-current="step"]').textContent;
const swing=(z=5)=>{fireEvent.click(zones()[z]);fireEvent.click(screen.getByRole('button',{name:'타격!',exact:true}));};
const impact=()=>act(()=>vi.advanceTimersByTime(PREVIEW_IMPACT_MS));
const next=()=>fireEvent.click(document.querySelector('[data-zf-next]'));
afterEach(()=>{cleanup();vi.useRealTimers();localStorage.clear();history.replaceState({},'','/');});

it('opens with only aiming and one attack action; hidden systems are absent, not invisible controls',()=>{
  render(<ZoneFirstPreview/>);
  expect(root().dataset.lesson).toBe('0');expect(zones().length).toBe(9);
  expect(screen.queryByRole('meter')).toBeNull();expect(document.querySelector('.zf-card')).toBeNull();
  expect(document.querySelector('.zf-counts')).toBeNull();expect(document.querySelector('.zf-basic')).toBeNull();
  expect(document.querySelector('.zf-take')).toBeNull();expect(document.querySelectorAll('.zf-actions button').length).toBe(1);
  expect(current()).toContain('코스 노리기');expect(document.querySelector('.zf-go').disabled).toBe(true);
});

it('completes the three real-engine lessons, introduces HP then preparation, and opens the actual hand',()=>{
  vi.useFakeTimers();localStorage.setItem('9zone-v10-run','keep-this-run');render(<ZoneFirstPreview/>);
  fireEvent.click(screen.getByRole('button',{name:'소리 켜기'}));
  swing();expect(current()).toContain('공 날아옴');expect(document.querySelector('.zf-explanation')).toBeNull();
  expect(document.querySelector('.zf-read-hit')).toBeNull();expect(screen.queryByRole('meter')).toBeNull();
  impact();expect(current()).toContain('결과');expect(document.querySelector('.zf-read-hit')).not.toBeNull();
  expect(document.querySelector('.zf-explanation').textContent).toBe('바깥쪽 노림 → 실제 바깥쪽 → 정확 적중 · 중전안타');
  expect(document.querySelector('.zf-result-card').textContent).not.toContain('HP');
  next();expect(root().dataset.lesson).toBe('1');expect(screen.getByRole('button',{name:'소리 끄기'})).toBeTruthy();
  const hp=Number(screen.getByRole('meter').getAttribute('aria-valuenow'));swing();
  expect(Number(screen.getByRole('meter').getAttribute('aria-valuenow'))).toBe(hp);
  impact();expect(Number(screen.getByRole('meter').getAttribute('aria-valuenow'))).toBeLessThan(hp);
  next();expect(root().dataset.lesson).toBe('2');expect(document.querySelectorAll('.zf-card').length).toBe(1);
  fireEvent.click(zones()[5]);expect(document.querySelector('.zf-go').disabled).toBe(true);
  fireEvent.click(document.querySelector('[data-kind="setup"]'));
  fireEvent.click(screen.getByRole('button',{name:'준비 사용',exact:true}));
  expect(current()).toContain('코스 노리기');expect(document.querySelector('.zf-prepared').textContent).toContain('집중 +1');
  expect(document.querySelector('.zf-card')).toBeNull();
  swing();impact();next();expect(root().dataset.lesson).toBeUndefined();
  expect(document.querySelectorAll('.zf-hand .zf-card').length).toBe(5);
  expect(document.querySelector('.zf-counts')).not.toBeNull();expect(document.querySelector('.zf-take')).not.toBeNull();
  expect(document.querySelector('.zf-go').disabled).toBe(true);expect(localStorage.getItem('9zone-v10-run')).toBe('keep-this-run');
});

it('does not award a lesson for missing, and retries the same fair setup without an auto-selected aim',()=>{
  vi.useFakeTimers();render(<ZoneFirstPreview/>);swing(4);impact();
  expect(document.querySelector('.zf-read-hit')).toBeNull();
  expect(document.querySelector('.zf-explanation').textContent).toContain('범위 밖');
  expect(screen.queryByRole('button',{name:/다음 · 투수 HP/})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:/같은 공 다시 도전/}));
  expect(root().dataset.lesson).toBe('0');expect(root().dataset.step).toBe('plan');
  expect([...zones()].some(z=>z.getAttribute('aria-pressed')==='true')).toBe(false);
  swing();impact();expect(screen.getByRole('button',{name:/다음 · 투수 HP/})).toBeTruthy();
});

it('skips safely during flight, cancels the old result, and can restart learning from battle information',()=>{
  vi.useFakeTimers();render(<ZoneFirstPreview/>);swing();
  fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));impact();
  expect(root().dataset.lesson).toBeUndefined();expect(root().dataset.step).toBe('plan');
  expect(document.querySelector('.zf-explanation')).toBeNull();expect(document.querySelectorAll('.zf-card').length).toBe(5);
  fireEvent.click(screen.getByRole('button',{name:'전투 정보'}));
  fireEvent.click(screen.getByRole('button',{name:'처음부터 배우기'}));
  expect(root().dataset.lesson).toBe('0');expect(screen.queryByRole('dialog')).toBeNull();
});

it('supports a direct battle link without storing or forgetting tutorial flags',()=>{
  history.replaceState({},'','/?showcase=zone-first&learn=0');render(<ZoneFirstPreview/>);
  expect(root().dataset.lesson).toBeUndefined();expect(document.querySelectorAll('.zf-card').length).toBe(5);
  expect(localStorage.length).toBe(0);
});

it('uses honest deterministic practice outcomes and the real preparation without changing the pending pitch',()=>{
  const s=createLessonBattle(),before=JSON.stringify(s.battle.pending);
  const prepared=playV10Action(s,{type:'card',id:'lesson-setup'});
  expect(JSON.stringify(prepared.battle.pending)).toBe(before);expect(prepared.stats.pitches).toBe(0);
  expect(prepared.battle.aim).toBe(1);expect(s.battle.aim).toBe(0);
  for(const state of [s,prepared]){
    const hit=playV10Action(setAimZone(state,5),{type:'card',id:'basic'});
    expect(hit.battle.revealed.kind).toBe('hit');expect(isExactRead(hit)).toBe(true);
    const miss=playV10Action(setAimZone(state,4),{type:'card',id:'basic'});
    expect(miss.battle.revealed.kind).not.toBe('hit');expect(isExactRead(miss)).toBe(false);
  }
});

it('explains only revealed results and distinguishes balls, missed swings and support hits',()=>{
  const s=createLessonBattle();expect(resultExplanation(s)).toBe('');expect(isExactRead(s)).toBe(false);
  const described=r=>({...s,battle:{...s.battle,revealed:r}});
  const take=described({action:'take',zone:9,kind:'ball',label:'볼',aimZone:null});
  expect(resultExplanation(take)).toBe('지켜봄 → 실제 존 밖 → 볼');
  expect(resultExplanation(described({...take.battle.revealed,zone:2,kind:'called',label:'루킹 스트라이크'}))).toContain('실제 바깥쪽 높게 → 스트라이크 · 루킹 스트라이크');
  expect(resultExplanation(described({action:'basic',zone:9,kind:'whiff',label:'헛스윙',aimZone:5,coverage:[5]}))).toContain('유인구에 스윙 · 헛스윙');
  const support=described({action:'place',zone:5,kind:'hit',label:'겹친 카드 단타',aimZone:4,primaryCoverage:[4],coverage:[4,5],assistOnly:true});
  expect(resultExplanation(support)).toContain('지원 적중');expect(isExactRead(support)).toBe(false);
  const covered=described({action:'strike',zone:2,kind:'hit',label:'중전안타',aimZone:5,primaryCoverage:[2,5,8],coverage:[2,5,8]});
  expect(resultExplanation(covered)).toContain('범위 적중');expect(isExactRead(covered)).toBe(false);
  expect(isExactRead(described({...covered.battle.revealed,kind:'foul',zone:5}))).toBe(false);
});

it('uses the host sound state in integrated practice while standalone practice keeps its own preference',()=>{
  const toggle=vi.fn(),finish=vi.fn();
  const view=render(<ZoneFirstPreview onFinish={finish} sound={true} onToggleSound={toggle}/>);
  fireEvent.click(screen.getByRole('button',{name:'소리 끄기'}));expect(toggle).toHaveBeenCalledOnce();
  expect(screen.getByRole('button',{name:'소리 끄기'})).toBeTruthy();
  view.rerender(<ZoneFirstPreview onFinish={finish} sound={false} onToggleSound={toggle}/>);
  expect(screen.getByRole('button',{name:'소리 켜기'})).toBeTruthy();
});
