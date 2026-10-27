import {describe,it,expect,vi,afterEach} from 'vitest';
import * as E from '../src/duel/engine.js';
import {probabilityBounds} from '../src/duel/information.js';
import {forecastFor} from '../src/duel/SwingForecast.jsx';
import {resultExplanation} from '../src/duel/zone-first-model.js';
import {buildBattleViewModel,publicForecast,zoneFace,battlePhase,ACTION_CALLBACKS} from '../src/duel/battle-vnext/view-model.js';
import {VNEXT_FIXTURES,buildFixture,appInputs,handId} from '../src/duel/battle-vnext/fixtures.js';

const vmOf=id=>{const input=buildFixture(id);return {input,vm:buildBattleViewModel(input)};};
const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))deepFreeze(v);}return o;};
const json=x=>JSON.stringify(x);
/* 숨은 판정 값의 이름: view model 어디에도 키로 나오면 안 된다 */
const HIDDEN_KEYS=['pending','roll','powerRoll','hitChance','expected','outcomes','missMin','missMax','probabilities'];
const keysOf=(o,out=new Set())=>{if(o&&typeof o==='object')for(const [k,v] of Object.entries(o)){out.add(k);keysOf(v,out);}return out;};

afterEach(()=>vi.unstubAllGlobals());

describe('battle-vnext fixtures — 본편 엔진으로 만든 고정 상태',()=>{
  it('모든 fixture가 기대 phase로 만들어지고 생산 세이브 저장소를 건드리지 않는다',()=>{
    const touch=()=>{throw new Error('fixture가 storage에 접근했다');};
    vi.stubGlobal('localStorage',{getItem:touch,setItem:touch,removeItem:touch,clear:touch,key:touch,length:0});
    const want={flight:'flight','result-swing':'result','result-hit':'result','result-take':'result'};
    for(const f of VNEXT_FIXTURES){
      const {vm}=vmOf(f.id);
      expect(vm.phase,f.id).toBe(want[f.id]||'deciding');
      expect(f.seed,f.id).toBeTypeOf('number');
      expect(f.steps.length,f.id).toBeGreaterThan(0);
    }
  });

  it('같은 seed·steps는 같은 상태를 다시 만든다',()=>{
    for(const f of VNEXT_FIXTURES)expect(json(buildFixture(f.id).s),f.id).toBe(json(buildFixture(f.id).s));
  });

  it('본 런과 방어 실험 규칙을 구별한다 (실험 기본 에너지 3, 본 런 2)',()=>{
    expect(vmOf('watch-read0').vm.energy).toMatchObject({base:2,current:2,cap:2});
    const lab=vmOf('defense-lab');
    expect(lab.input.s.defenseLab?.schema).toBe(1);
    expect(lab.vm.energy.base).toBe(3);
    expect(VNEXT_FIXTURES.find(f=>f.id==='defense-lab').rules).toBe('defense-lab');
    expect(VNEXT_FIXTURES.filter(f=>f.id!=='defense-lab').every(f=>f.rules==='main-run')).toBe(true);
  });
});

describe('view model은 순수 표시 변환이다',()=>{
  it('입력(엔진 상태·손패·선택)을 바꾸지 않는다',()=>{
    for(const f of VNEXT_FIXTURES){
      const input=buildFixture(f.id),before=json(input);
      deepFreeze(input);
      expect(()=>buildBattleViewModel(input),f.id).not.toThrow();
      expect(json(input),f.id).toBe(before);
    }
  });

  it('battle 상태가 없으면 transition과 빈 입력을 돌려준다',()=>{
    const vm=buildBattleViewModel({s:{phase:'reward',battle:null}});
    expect(vm.phase).toBe('transition');
    expect(vm.input).toMatchObject({canSelect:false,canExecute:false,callback:null});
    expect(battlePhase({s:{phase:'map'}})).toBe('transition');
  });
});

describe('정보 경계 — 읽기 단계 아래의 정답·정확 확률이 섞이지 않는다',()=>{
  const deciding=VNEXT_FIXTURES.filter(f=>f.id!=='defense-lab'&&!['flight','result-swing','result-hit','result-take'].includes(f.id));

  it('숨은 판정 값의 키가 view model에 없다',()=>{
    for(const f of VNEXT_FIXTURES){
      const keys=keysOf(vmOf(f.id).vm);
      for(const k of HIDDEN_KEYS)expect(keys.has(k),f.id+' · '+k).toBe(false);
    }
  });

  it('이미 정해진 다음 공(battle.pending)을 바꿔도 선택 중 view model은 같다',()=>{
    let checked=0;
    for(const f of deciding){
      const input=buildFixture(f.id);
      if(input.s.battle.scouted)continue; // 정찰 단서는 공개 정보다
      const base=json(buildBattleViewModel(input));
      for(let zone=0;zone<10;zone++){
        const s=structuredClone(input.s);s.battle.pending={zone,roll:(zone+1)/11,powerRoll:.5};
        expect(json(buildBattleViewModel({...input,s})),f.id+' zone '+zone).toBe(base);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(50);
  });

  /* 같은 공개 표면(명암/구간)을 유지하는 범위에서 두 칸의 실제 확률을 옮긴다.
     읽기 0·1에서 view model이 그대로면 정확한 칸 확률이 새지 않는 것이다. */
  function sameFacePerturbations(input,eps=.004){
    const out=[],s0=input.s,p=s0.battle.intent.probabilities,lv=E.readLevel(s0);
    const faces=s=>json([Array.from({length:9},(_,z)=>zoneFace(s,z)),probabilityBounds(s)]);
    for(let a=0;a<9;a++)for(let c=0;c<9;c++){
      if(a===c||p[a]<eps*2||!p[c])continue;
      const s=structuredClone(s0),q=s.battle.intent.probabilities;q[a]-=eps;q[c]+=eps;
      if(E.readLevel(s)===lv&&faces(s)===faces(s0))out.push(s);
    }
    return out;
  }
  for(const [id,level] of [['swing-main',0],['watch-read0',0],['support-stacked',0],['read1',1]]){
    it(`읽기 ${level} · ${id}: 같은 공개 표면 안에서 실제 확률이 달라도 view model이 같다`,()=>{
      const input=buildFixture(id);
      expect(E.readLevel(input.s)).toBe(level);
      const base=json(buildBattleViewModel(input)),variants=sameFacePerturbations(input);
      expect(variants.length).toBeGreaterThan(0);
      for(const s of variants){
        const again={...input,s,...appInputs(s,{selected:input.selected,swingStack:input.swingStack})};
        expect(json(buildBattleViewModel(again))).toBe(base);
      }
    });
  }

  it('읽기 2에서는 같은 변화가 정확한 %로 드러난다 (검사가 민감하다는 대조군)',()=>{
    const input=buildFixture('read2');
    expect(E.readLevel(input.s)).toBe(2);
    const s=structuredClone(input.s),q=s.battle.intent.probabilities;
    const a=q.findIndex((v,z)=>z<9&&v>=.05),c=q.findIndex((v,z)=>z<9&&z!==a&&v>0);
    q[a]-=.03;q[c]+=.03;
    const again={...input,s,...appInputs(s,{selected:input.selected,swingStack:input.swingStack})};
    expect(json(buildBattleViewModel(again).zones)).not.toBe(json(buildBattleViewModel(input).zones));
  });

  it('칸 표면은 읽기 0 = 낱말, 1 = 구간, 2 = 정확한 %',()=>{
    const faceKinds=id=>vmOf(id).vm.zones.cells.filter(c=>c.live).map(c=>c.face);
    expect(faceKinds('watch-read0').every(f=>['드묾','가끔','자주','단서 밖'].includes(f))).toBe(true);
    expect(faceKinds('read1').every(f=>/^\d+~\d+%$|^100%$/.test(f))).toBe(true);
    expect(faceKinds('read2').every(f=>/^\d+%$/.test(f))).toBe(true);
  });

  it('공이 날아오는 동안에는 결과·실제 코스·이후 HP/카운트를 보이지 않는다',()=>{
    const {input,vm}=vmOf('flight'),r=input.s.battle.revealed;
    expect(vm.result).toBeNull();
    expect(vm.zones.cells.some(c=>c.actual)).toBe(false);
    expect(vm.zones.band.actual).toBe(false);
    expect(vm.zones.cells.every(c=>c.face===null)).toBe(true);
    expect(vm.hud.count).toEqual({balls:r.ballsBefore,strikes:r.strikesBefore,outs:r.outsBefore});
    expect(vm.hud.pitcher.hp).toBe(input.s.v10.lastCombat.hpBefore);
    expect(vm.scene.pitchZone).toBe(r.zone); // 연출용: 이미 판정된 공의 도착 칸
  });
});

describe('선택·지원·에너지·피해 조건이 실제 selector 값과 같다',()=>{
  it('에너지: 현재/상한/선택 비용/남는 양',()=>{
    const {input,vm}=vmOf('swing-main');
    expect(vm.energy.current).toBe(E.v10Energy(input.s));
    expect(vm.energy.cap).toBe(E.v10EnergyCap(input.s));
    expect(vm.energy.selectedCost).toBe(input.choice.cost);
    expect(vm.energy.selectedCost).toBe(E.v10ActionCost(input.s,input.selected));
    expect(vm.energy.remainingIfExecuted).toBe(vm.energy.current-vm.energy.selectedCost);
    expect(vm.energy.nextTakeHint).toBe('다음 공 ⚡+1');
  });

  it('비용 부족: 행동 이름은 유지, 실행 잠금, 가까운 이유와 부족분',()=>{
    const {input,vm}=vmOf('cost-short');
    expect(vm.energy.current).toBe(1);
    expect(vm.energy.shortfall).toBe(1);
    expect(input.choice.problem).toMatch(/에너지/);
    expect(vm.input).toMatchObject({actionKind:'swing',actionLabel:'타격',canExecute:false,blockedReason:'에너지 부족'});
    const card=vm.hand.find(x=>x.id===input.selected);
    expect(card).toMatchObject({selectionRole:'main',unavailable:true,warning:'에너지 부족'});
  });

  it('메인 + 지원: 역할·순서·비용 합계가 기존 stack 계산과 같다',()=>{
    const {input,vm}=vmOf('support-stacked');
    expect(vm.energy.current).toBe(3);
    expect(vm.energy.selectedCost).toBe(E.v10ActionCost(input.s,input.selected,input.swingStack));
    const main=vm.hand.find(x=>x.selectionRole==='main'),sup=vm.hand.find(x=>x.selectionRole==='support');
    expect([main.id,main.order]).toEqual([input.selected,1]);
    expect([sup.id,sup.order]).toEqual([input.swingStack[0].id,2]);
    expect(vm.zones.cells[8].tokens).toEqual([2]);
    expect(vm.zones.cells[4].tokens).toEqual([1]);
    expect(vm.zones.cells.filter(c=>c.support).map(c=>c.zone)).toEqual(input.choice.supportCoverages.flatMap(x=>x.coverage).filter((z,i,a)=>a.indexOf(z)===i).sort((a,b)=>a-b));
    expect(vm.forecast.cardCount).toBe(2);
  });

  it('지원 코스 대기: 코스를 고르세요 · 실행 잠금 · 대기 카드 표시',()=>{
    const {input,vm}=vmOf('support-armed');
    expect(vm.input).toMatchObject({actionKind:'support-zone',actionLabel:'코스를 고르세요',canExecute:false,canSelect:true,callback:null});
    expect(vm.hand.find(x=>x.id===input.armed).selectionRole).toBe('armed');
    expect(vm.zones.targetingSupport).toBe(true);
    expect(vm.energy.armedCost).toBe(2);
  });

  it('예측은 forecastFor(실제 판정과 같은 함수)의 공개 구간만 옮긴다',()=>{
    for(const id of ['swing-main','basic-swing','support-stacked','read1','read2']){
      const {input,vm}=vmOf(id);
      const raw=forecastFor({s:input.s,selected:input.selected,stack:input.swingStack});
      const pub=publicForecast(raw);
      expect(vm.forecast,id).toEqual(pub);
      expect(vm.forecast.chance,id).toEqual(raw.now.hitBounds);
      expect([vm.forecast.damageMin,vm.forecast.damageMax],id).toEqual(raw.now.hitBounds[1]>0?[raw.now.dmgMin,raw.now.dmgMax]:[0,0]);
      if(vm.forecast.damageMax>0)expect(vm.forecast.damageLabel,id).toMatch(/^안타 시 −\d+(~\d+)?$/);
    }
  });

  it('희생타는 안타와 다른 조건으로 표시한다',()=>{
    const input=buildFixture('swing-main'),s=structuredClone(input.s);
    s.deck.find(c=>c.id===input.selected).kind='bunt';s.battle.bases=['p2',null,null];
    const again={...input,s,...appInputs(s,{selected:input.selected})};
    const f=buildBattleViewModel(again).forecast;
    expect(f.outcome).toBe('희생타');
    expect(f.runners).toBe(0);
    if(f.damageMax>0)expect(f.damageLabel).toMatch(/^희생타 시 −/);
  });

  it('준비 카드 선택: 준비 전→후 예측과 준비 사용 행동',()=>{
    const {input,vm}=vmOf('prepare');
    expect(vm.input).toMatchObject({actionKind:'prepare',actionLabel:'준비 사용',callback:'onSwing',canExecute:true});
    expect(vm.forecast.preparation).toBe(input.selected);
    expect(vm.hand.find(x=>x.id===input.selected)).toMatchObject({type:'prepare',coverage:null,selectionRole:'main'});
  });

  it('손패는 기본 칩 → 스윙 → 준비 순서이며 kind와 id를 구별한다',()=>{
    const {input,vm}=vmOf('watch-read0');
    expect(vm.hand[0]).toMatchObject({id:'basic',type:'basic',cost:0});
    const types=vm.hand.map(x=>x.type);
    expect(types.lastIndexOf('swing')).toBeLessThan(types.indexOf('prepare'));
    expect(vm.hand.length).toBe(input.hand.length+1);
    const strikes=vm.hand.filter(x=>x.kind==='strike');
    expect(strikes.length).toBe(2);
    expect(strikes[0].id).not.toBe(strikes[1].id);
    expect(strikes[0].id).toBe(handId(input.s,'strike'));
  });
});

describe('단일 행동 버튼 → 기존 콜백',()=>{
  it('콜백 이름은 기존 BallparkBattle props와 같다',()=>{
    expect(ACTION_CALLBACKS).toEqual({watch:'onTake',swing:'onSwing',prepare:'onSwing',next:'onNext'});
  });
  it('무선택 = 지켜보기 → onTake',()=>{
    const {vm}=vmOf('watch-read0');
    expect(vm.input).toMatchObject({actionKind:'watch',actionLabel:'지켜보기',callback:'onTake',canExecute:true,canSelect:true});
    expect(vm.input.ariaLabel).toBe('지켜보기 · 다음 공 ⚡+1');
  });
  it('공격/기본 선택 = 타격 → onSwing',()=>{
    for(const id of ['swing-main','basic-swing'])
      expect(vmOf(id).vm.input,id).toMatchObject({actionKind:'swing',actionLabel:'타격',callback:'onSwing',canExecute:true});
  });
  it('정보창 열림: 선택·실행 모두 잠금, 예측 숨김',()=>{
    const {vm}=vmOf('inspector-open');
    expect(vm.input).toMatchObject({canSelect:false,canExecute:false});
    expect(vm.forecast).toBeNull();
    expect(vm.hand.every(x=>x.disabled)).toBe(true);
  });
  it('공 진행 중: 투구 중… 이며 아무 콜백도 없다',()=>{
    const {vm}=vmOf('flight');
    expect(vm.input).toMatchObject({actionKind:'busy',actionLabel:'투구 중…',callback:null,canExecute:false,canSelect:false,autoNext:false});
    const beat=buildBattleViewModel({...buildFixture('swing-main'),commitBeat:{cards:['x']}});
    expect(beat.phase).toBe('committing');
    expect(beat.input).toMatchObject({actionKind:'busy',callback:null,canExecute:false});
  });
  it('결과: 기존 다음 흐름(onNext)과 자동 진행 조건을 유지하고, 정보창이 열리면 멈춘다',()=>{
    const {input,vm}=vmOf('result-take');
    expect(vm.input).toMatchObject({actionKind:'next',actionLabel:input.nextLabel,callback:'onNext',canExecute:true,autoNext:true});
    const paused=buildBattleViewModel({...input,inspectOpen:true});
    expect(paused.input).toMatchObject({canExecute:false,autoNext:false});
    const locked=buildBattleViewModel({...input,locked:true});
    expect(locked.input.autoNext).toBe(false);
  });
});

describe('결과 표시',()=>{
  it('노림 → 실제 → 판정과 실제 HP를 기존 설명 함수로 만든다',()=>{
    for(const id of ['result-swing','result-hit','result-take']){
      const {input,vm}=vmOf(id),r=input.s.battle.revealed,combat=input.s.v10.lastCombat;
      expect(vm.result.explanation,id).toBe(resultExplanation(input.s));
      expect(vm.result.actualZone,id).toBe(r.zone);
      expect(vm.result.damage,id).toBe(combat.damage);
      expect([vm.result.hpBefore,vm.result.hpAfter],id).toEqual([combat.hpBefore,input.s.pitcher.hp]);
      expect(vm.zones.cells.filter(c=>c.actual).map(c=>c.zone).concat(vm.zones.band.actual?[9]:[]),id).toEqual([r.zone]);
      expect(vm.hud.count,id).toEqual({balls:input.s.battle.balls,strikes:input.s.battle.strikes,outs:input.s.battle.outs});
    }
    expect(vmOf('result-take').vm.result.action).toBe('take');
    expect(vmOf('result-swing').vm.result.action).toBe('swing');
  });
  it('정확 적중은 good·exact이며 실패 피해와 섞이지 않는다',()=>{
    const hit=vmOf('result-hit').vm.result,miss=vmOf('result-swing').vm.result;
    expect(hit).toMatchObject({kind:'hit',good:true,exact:true,aimZone:2,actualZone:2});
    expect(hit.damage).toBeGreaterThan(0);
    expect(miss).toMatchObject({kind:'whiff',good:false,exact:false,call:'헛스윙'});
    expect(hit.explanation).toMatch(/정확 적중/);
  });
});
