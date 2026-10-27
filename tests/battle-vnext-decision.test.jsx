// @vitest-environment happy-dom
import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,cleanup,fireEvent} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import * as E from '../src/duel/engine.js';
import {presentationFor} from '../src/duel/presentation.js';
import {resultExplanation} from '../src/duel/zone-first-model.js';
import DecisionPanel,{faceDensity,planCaption,planSummary} from '../src/duel/battle-vnext/DecisionPanel.jsx';
import BattleHud,{hpForecastBand} from '../src/duel/battle-vnext/BattleHud.jsx';
import ResultReadout,{resultTone,damageText} from '../src/duel/battle-vnext/ResultReadout.jsx';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {buildFixture,appInputs,FIXTURE_SEED,FIXTURE_NODE,handId} from '../src/duel/battle-vnext/fixtures.js';

afterEach(cleanup);

const vmFor=(id,extra={})=>buildBattleViewModel({...buildFixture(id),...extra});
const panel=(vm,props={})=>render(<DecisionPanel zones={vm.zones} forecast={vm.forecast} input={vm.input} hand={vm.hand} energy={vm.energy}
  result={vm.result} phase={vm.phase} effects={vm.effects} shotGrade={vm.scene?.shotGrade} onZoneTap={()=>{}} {...props}/>);

/* 결과 상태: seed 20261027 · a1-entry에서 본편 엔진 행동으로 만든다. 첫 공은 바깥쪽 높게(2)로 온다.
   엔진 밖 조정은 tweak으로만 적는다(희생타용 번트·주자, 강판용 HP 1). */
const open=()=>E.enterV10Node(E.createV10Duel(FIXTURE_SEED),FIXTURE_NODE);
const step=(s,op)=>op==='take'?E.playV10Action(s,{type:'take'}):op==='next'?E.advanceV10Pitch(s):E.advanceV10Batter(s);
const swing=(s,aim,kind,supports=[])=>{s=E.setAimZone(s,aim);return E.playV10Action(s,{type:'card',id:handId(s,kind),
  ...(supports.length?{supports:supports.map(x=>({id:handId(s,x.kind),aimZone:x.aimZone}))}:{})});};
const RESULTS={
  exact:()=>swing(open(),2,'strike'),                                   // 세로 3존, 노림=실제
  range:()=>swing(open(),5,'strike'),                                   // 세로 3존 안, 노림≠실제
  assist:()=>swing(['take','next'].reduce(step,open()),4,'place',[{kind:'strike',aimZone:2}]), // 메인 1존 빗나감, 지원이 막음
  near:()=>swing(open(),1,'strike'),                                    // 한 칸 옆 헛스윙
  ball:()=>['take','next','take','next','take','batter','take','next','take','next','take'].reduce(step,open()),
  called:()=>step(open(),'take'),
  sacrifice:()=>{const s=structuredClone(['take','next'].reduce(step,open()));const c=s.deck.find(x=>x.id===handId(s,'place'));
    c.kind='bunt';s.battle.bases=['p2',null,null];return E.playV10Action(s,{type:'card',id:c.id});},
  knockout:()=>{const s=structuredClone(E.setAimZone(open(),2));s.pitcher.hp=1;return E.playV10Action(s,{type:'card',id:handId(s,'strike')});},
};
const resultVm=key=>{
  const s=RESULTS[key](),fxStage=key==='knockout'?'settle':null;
  const hand=s.battle&&['battle','pitch','between'].includes(s.phase)?appInputs(s).hand:[];
  return {s,vm:buildBattleViewModel({s,hand,fxStage,shot:presentationFor(s),hasNext:['pitch','between'].includes(s.phase),
    nextLabel:s.phase==='pitch'?'다음 공':'다음 타자'})};
};

describe('C04 단일 행동 — 문구와 실제 콜백이 같다',()=>{
  const cbs=()=>({onTake:vi.fn(),onSwing:vi.fn(),onNext:vi.fn()});
  const only=(c,name)=>{for(const k of ['onTake','onSwing','onNext'])expect(c[k].mock.calls.length,k).toBe(k===name?1:0);};
  for(const [id,label,cb] of [['watch-read0','지켜보기','onTake'],['swing-main','타격','onSwing'],['basic-swing','타격','onSwing'],['prepare','준비 사용','onSwing']]){
    it(`${id}: ${label} → ${cb}`,()=>{
      const c=cbs(),vm=vmFor(id),{container}=panel(vm,c);
      const btns=container.querySelectorAll('button.bv-action');
      expect(btns.length).toBe(1);
      const b=container.querySelector('[data-testid=bp-swing]');
      expect(b.querySelector('b').textContent).toBe(label);
      expect(b.dataset.actionKind).toBe(vm.input.actionKind);
      expect(b.getAttribute('aria-label')).toBe(vm.input.ariaLabel);
      expect(b.getAttribute('aria-label').startsWith(label)).toBe(true);
      fireEvent.click(b);fireEvent.click(b);
      only(c,cb);
    });
  }
  it('결과: 기존 다음 흐름 onNext, testid bp-next',()=>{
    const c=cbs(),vm=vmFor('result-take'),{container}=panel(vm,c);
    const b=container.querySelector('[data-testid=bp-next]');
    expect(b.querySelector('b').textContent).toBe('다음 공');
    fireEvent.click(b);only(c,'onNext');
  });
  it('지원 대기 · 비용 부족 · 정보창 · 투구 중에는 실행되지 않는다',()=>{
    for(const [id,extra] of [['support-armed',{}],['cost-short',{}],['inspector-open',{}],['flight',{}],['swing-main',{commitBeat:{}}]]){
      const c=cbs(),vm=vmFor(id,extra),{container}=panel(vm,c);
      const b=container.querySelector('button.bv-action');
      expect(b.disabled,id).toBe(true);
      fireEvent.click(b);only(c,null);
      cleanup();
    }
    expect(vmFor('support-armed').input.actionLabel).toBe('코스를 고르세요');
    expect(vmFor('flight').input.actionLabel).toBe('투구 중…');
  });
  it('비용 부족: 이유와 해제 방법을 요약에 보인다',()=>{
    const {container}=panel(vmFor('cost-short'));
    expect(container.querySelector('.bv-plan-problem').textContent).toBe('에너지 부족');
    expect(container.querySelector('.bv-plan-hint').textContent).toMatch(/다시 누르면 지켜보기/);
  });
  it('키 반복으로 두 번 실행되지 않는다',()=>{
    const c=cbs(),{container}=panel(vmFor('swing-main'),c);
    const b=container.querySelector('button.bv-action'),ev=new KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true,cancelable:true});
    b.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });
});

describe('9존 — 공개 수준·노림·커버·지원 순서',()=>{
  const zoneText=vm=>{const {container}=panel(vm);const t=[...container.querySelectorAll('.bv-cell-face')].map(e=>e.textContent);
    const band=container.querySelector('[data-testid=bv-band]').textContent;cleanup();return {t,band};};
  it('읽기 0: 칸에 숫자 %가 없다 · 1: 5%p 구간 · 2: 정확 %',()=>{
    const r0=zoneText(vmFor('watch-read0'));
    expect(r0.t.join(' ')).not.toMatch(/\d/);expect(r0.band).not.toMatch(/\d/);
    const r1=zoneText(vmFor('read1'));
    expect(r1.t.filter(x=>x!=='안 던짐').every(x=>/^\d+~\d+%$|^100%$/.test(x))).toBe(true);
    const r2=zoneText(vmFor('read2'));
    expect(r2.t.filter(x=>x!=='안 던짐').every(x=>/^\d+%$/.test(x))).toBe(true);
  });
  it('칸 농도는 공개 표면 문자열에서만',()=>{
    expect(faceDensity('드묾')).toBeLessThan(faceDensity('자주'));
    expect(faceDensity('10~15%')).toBe(faceDensity('10%'));
    expect(faceDensity(null)).toBeNull();
  });
  it('메인(①)·지원(②) 토큰과 커버/지원 칸, 순서 캡션',()=>{
    const vm=vmFor('support-stacked'),{container}=panel(vm);
    const cell=z=>container.querySelector(`[data-zone="${z}"]`);
    expect(cell(4).querySelector('.bv-token.n1')).not.toBeNull();
    expect(cell(4).className).toMatch(/is-aim/);
    expect(cell(8).querySelector('.bv-token.n2')).not.toBeNull();
    for(const c of vm.zones.cells)expect(cell(c.zone).className.includes('is-support'),'z'+c.zone).toBe(c.support);
    expect(container.querySelector('.bv-zone-caption span').textContent).toBe(planCaption(vm.zones));
    expect(planCaption(vm.zones)).toBe('① 가운데 → ② 바깥쪽 낮게');
  });
  it('칸 탭 → 부모 onZoneTap(z), 잠금이면 비활성',()=>{
    const tap=vi.fn(),{container}=panel(vmFor('swing-main'),{onZoneTap:tap});
    fireEvent.click(container.querySelector('[data-zone="6"]'));
    expect(tap).toHaveBeenCalledWith(6);
    cleanup();
    const locked=panel(vmFor('inspector-open'));
    expect([...locked.container.querySelectorAll('.bv-cell')].every(b=>b.disabled)).toBe(true);
  });
});

describe('선택 요약 — 공개 적중과 조건부 피해',()=>{
  it('적중 구간과 “안타 시” 피해, 비용',()=>{
    const vm=vmFor('swing-main'),{container}=panel(vm);
    const m=container.querySelector('.bv-plan-metrics');
    expect(m.querySelector('strong').textContent).toBe('적중 '+vm.forecast.chanceText);
    expect(m.querySelector('span').textContent).toMatch(/^안타 시 −/);
    expect(container.querySelector('.bv-plan-title').textContent).toContain('⚡2');
  });
  it('희생타 시를 생략하지 않는다',()=>{
    const input=buildFixture('swing-main'),s=structuredClone(input.s);
    s.deck.find(c=>c.id===input.selected).kind='bunt';s.battle.bases=['p2',null,null];
    const vm=buildBattleViewModel({...input,s,...appInputs(s,{selected:input.selected})});
    const sum=planSummary(vm);
    expect(sum.chance).toMatch(/^희생타 /);
    if(vm.forecast.damageMax>0)expect(sum.damage).toMatch(/^희생타 시 −/);
  });
  it('준비 사용: 준비 전 → 후 적중',()=>{
    const vm=vmFor('prepare'),sum=planSummary(vm);
    expect(vm.input.actionKind).toBe('prepare');
    if(vm.forecast.before&&vm.forecast.before.chanceText!==vm.forecast.chanceText)expect(sum.chance).toContain('→');
    else expect(sum.chance).toContain(vm.forecast.chanceText);
  });
  it('무선택: 지켜보기 설명과 다음 공 보상/2S 위험',()=>{
    const sum=planSummary(vmFor('watch-read0'));
    expect(sum).toMatchObject({title:'지켜보기',detail:'다음 공 ⚡+1'});
  });
});

describe('HUD — 에너지 중복 없음 · 단서 한 줄 · 예상 피해는 조건부',()=>{
  it('에너지·⚡를 그리지 않는다',()=>{
    const vm=vmFor('swing-main'),{container}=render(<BattleHud hud={vm.hud} forecast={vm.forecast} sources={vm.zones.sources} phase={vm.phase}/>);
    expect(container.textContent).not.toMatch(/에너지|⚡/);
    expect(container.querySelector('[data-testid=bv-tell]').textContent).toContain(vm.hud.tell);
  });
  it('HP 예상 띠는 선택 중에만, “안타 시” 조건과 빗금',()=>{
    const vm=vmFor('swing-main'),band=hpForecastBand(vm.hud,vm.forecast);
    expect(band.label).toMatch(/^안타 시 −/);
    const {container}=render(<BattleHud hud={vm.hud} forecast={vm.forecast} phase={vm.phase}/>);
    expect(container.querySelector('[data-testid=bv-hp-forecast]').getAttribute('title')).toBe(band.label+' 예상');
    cleanup();
    const res=resultVm('exact').vm,r=render(<BattleHud hud={res.hud} forecast={res.forecast} phase={res.phase}/>);
    expect(r.container.querySelector('[data-testid=bv-hp-forecast]')).toBeNull();
  });
  it('공이 날아오는 동안은 던지기 전 HP·카운트',()=>{
    const vm=vmFor('flight'),{container}=render(<BattleHud hud={vm.hud} phase={vm.phase}/>);
    expect(container.querySelector('.bv-hud-opponent small').textContent).toBe(`${vm.hud.pitcher.hp} / ${vm.hud.pitcher.maxHp}`);
    expect(vm.hud.pitcher.hp).toBe(buildFixture('flight').s.v10.lastCombat.hpBefore);
  });
});

describe('결과 — 실제 상태 8종',()=>{
  const want={exact:'정확 적중',range:'범위 적중',assist:'지원 적중',near:'한 칸 차이',ball:'볼',called:'루킹',sacrifice:'희생타',knockout:'강판'};
  for(const [key,label] of Object.entries(want))it(`${key} → ${label}`,()=>{
    const {s,vm}=resultVm(key),r=s.battle.revealed;
    expect(vm.phase,key).toBe('result');
    expect(resultTone(vm.result,vm.scene.shotGrade).label).toBe(label);
    expect(vm.result.explanation).toBe(resultExplanation(s));
    expect(vm.result.damage).toBe(s.v10.lastCombat.damage);
    const {container}=render(<ResultReadout result={vm.result} shotGrade={vm.scene.shotGrade}/>);
    expect(container.querySelector('[data-testid=bv-result]').dataset.tone).toBe(resultTone(vm.result,vm.scene.shotGrade).key);
    expect(container.querySelector('.bv-result-copy').textContent).toContain(vm.result.explanation);
    cleanup();
    /* 같은 9존에서 실제 공 강조 (볼은 바깥 띠) */
    const p=panel(vm);
    const marks=[...p.container.querySelectorAll('[data-testid=bv-pitch-mark]')];
    expect(marks.length).toBe(1);
    expect(r.zone===9?marks[0].closest('[data-testid=bv-band]'):marks[0].closest(`[data-zone="${r.zone}"]`)).not.toBeNull();
  });
  it('실패 피해는 안타 피해와 따로: 한 칸 차이 압박',()=>{
    const {vm}=resultVm('near');
    expect(vm.result.kind).toBe('whiff');
    const t=damageText(vm.result,resultTone(vm.result,vm.scene.shotGrade));
    if(vm.result.damage>0)expect(t).toMatch(/한 칸 차이 압박$/);
  });
  it('결과 한 줄은 요약 자리에서 선택 요약을 대신한다(겹치지 않음)',()=>{
    const {vm}=resultVm('exact'),{container}=panel(vm);
    expect(container.querySelector('[data-testid=bv-result-line]')).not.toBeNull();
    expect(container.querySelector('.bv-plan-metrics')).toBeNull();
  });
});

describe('최근 결과 한 줄 — 수명은 부모가 정한다',()=>{
  it('recent를 받을 때만, 타이머를 만들지 않는다',()=>{
    const spy=vi.spyOn(globalThis,'setTimeout'),spyI=vi.spyOn(globalThis,'setInterval');
    const vm=vmFor('watch-read0');
    const a=panel(vm);
    expect(a.container.querySelector('[data-testid=bv-result-recent]')).toBeNull();
    cleanup();
    const b=panel(vm,{recent:'가운데 노림 → 실제 바깥쪽 높게 → 범위 밖 · 헛스윙'});
    expect(b.container.querySelector('[data-testid=bv-result-recent]').textContent).toMatch(/^가운데 노림/);
    expect(spy).not.toHaveBeenCalled();expect(spyI).not.toHaveBeenCalled();
    spy.mockRestore();spyI.mockRestore();
  });
});

describe('CSS 범위',()=>{
  it('전역 셀렉터를 건드리지 않는다',()=>{
    const css=readFileSync('src/duel/battle-vnext/decision.css','utf8').replace(/\/\*[\s\S]*?\*\//g,'');
    for(const rule of css.split('}').filter(r=>r.includes('{'))){
      const sel=rule.split('{')[0].trim();
      if(sel.startsWith('@'))continue;
      for(const part of sel.split(','))expect(part.trim(),sel).toMatch(/^\.bv-/);
    }
  });
});
