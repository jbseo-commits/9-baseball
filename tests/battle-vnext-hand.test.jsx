// @vitest-environment happy-dom
import React,{createRef} from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,cleanup,fireEvent,screen,within} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {CARDS} from '../src/duel/cards.js';
import {cardArtFor} from '../src/duel/card-art.js';
import HandDock,{energyLine,energyPips,SWIPE_SLOP_PX} from '../src/duel/battle-vnext/HandDock.jsx';
import {defaultCardArt,selectionTag} from '../src/duel/battle-vnext/BattleCard.jsx';
import {mockupSheetArt,MOCKUP_CARD_SHEET} from '../src/duel/battle-vnext/sample-card-art.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
import {buildFixture,appInputs} from '../src/duel/battle-vnext/fixtures.js';

afterEach(cleanup);
const vmFor=(id,extra={})=>buildBattleViewModel({...buildFixture(id),...extra});
const dock=(vm,props={})=>render(<HandDock hand={vm.hand} energy={vm.energy} input={vm.input} phase={vm.phase} piles={{draw:4,discard:0}} onCardTap={()=>{}} {...props}/>);
const cardsIn=c=>[...c.querySelectorAll('[data-testid=bv-card]')];

/* 긴 이름 · 강화 · 조건부 카드를 본편 엔진 상태에 넣어 본다 */
function edgeHand(){
  const input=buildFixture('watch-read0'),s=structuredClone(input.s),hand=s.battle.hand;
  const set=(i,kind,plus=false)=>{const c=s.deck.find(x=>x.id===hand[i]);c.kind=kind;c.plus=plus;};
  set(0,'twoStrikeApproach');set(1,'strike',true);set(2,'nerveOfSteel');
  return buildBattleViewModel({...input,s,...appInputs(s)});
}

describe('C03 손패 — 여는 단계 없음 · 에너지 한 곳',()=>{
  it('에너지 표시와 손패 줄이 각각 하나이고 손패를 여는 버튼이 없다',()=>{
    const {container}=dock(vmFor('watch-read0'));
    expect(container.querySelectorAll('[data-testid=bv-energy]').length).toBe(1);
    expect(container.querySelectorAll('[data-testid=bv-hand]').length).toBe(1);
    expect(container.querySelectorAll('[aria-expanded]').length).toBe(0);
    expect(container.textContent).not.toMatch(/손패 보기|손패 열기/);
    const dockEl=container.querySelector('.bv-hand-dock'),head=dockEl.querySelector('.bv-hand-head');
    expect(head.compareDocumentPosition(dockEl.querySelector('.bv-hand-row'))&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('카드 id·순서·선택이 view model(부모 상태)과 같다',()=>{
    const vm=vmFor('support-stacked'),{container}=dock(vm);
    const cards=cardsIn(container),want=vm.hand.filter(x=>x.type!=='basic');
    expect(cards.map(el=>el.closest('[data-card-id]').dataset.cardId)).toEqual(want.map(x=>x.id));
    expect(cards.map(el=>el.dataset.selection||null)).toEqual(want.map(x=>x.selectionRole));
    expect(container.querySelector('[data-selection=main] .bv-card-tag').textContent).toBe('① 메인');
    expect(container.querySelector('[data-selection=support] .bv-card-tag').textContent).toBe('② 지원');
    expect(container.querySelector('[data-selection=main]').getAttribute('aria-pressed')).toBe('true');
  });

  it('지원 코스 대기 카드는 문구로도 구별된다',()=>{
    const {container}=dock(vmFor('support-armed'));
    const el=container.querySelector('[data-selection=armed]');
    expect(el.querySelector('.bv-card-tag').textContent).toBe('코스 선택 대기');
    expect(el.className).toMatch(/is-armed/);
  });
});

describe('에너지 — 실제 current/cap · 선택 비용 · 실행 후 잔여',()=>{
  it('선택 없음 → 숫자만, 2코스트 선택 → −2 → 0 남음',()=>{
    const idle=vmFor('watch-read0'),pick=vmFor('swing-main');
    expect(energyLine(idle.energy,idle.phase)).toBe('');
    expect(energyLine(pick.energy,pick.phase)).toBe('−2 → 0 남음');
    expect(energyPips(pick.energy)).toEqual(['spend','spend']);
    const {container}=dock(pick);
    const e=container.querySelector('[data-testid=bv-energy]');
    expect([e.dataset.energy,e.dataset.cap]).toEqual(['2','2']);
    expect(e.getAttribute('aria-label')).toBe('에너지 2/2 · −2 → 0 남음');
  });
  it('비용 부족: 부족분과 빨간 칸, 카드는 탭 가능하고 이유가 보인다',()=>{
    const vm=vmFor('cost-short');
    expect(energyLine(vm.energy,vm.phase)).toBe('1 부족');
    expect(energyPips(vm.energy)).toEqual(['spend','short']);
    const tap=vi.fn(),{container}=dock(vm,{onCardTap:tap});
    const main=container.querySelector('[data-selection=main]');
    expect(main.disabled).toBe(false);
    expect(main.querySelector('.bv-card-warning').textContent).toBe('에너지 부족');
    fireEvent.click(main);
    expect(tap).toHaveBeenCalledWith(main.closest('[data-card-id]').dataset.cardId);
    expect(container.querySelector('.bv-hand-lock')).toBeNull(); // 잠금이 아니라 비용 문제
  });
  it('에너지 0 (스윙 직후 결과): 같은 자리에서 다음 공 충전을 알린다',()=>{
    const vm=vmFor('result-swing'),{container}=dock(vm);
    const e=container.querySelector('[data-testid=bv-energy]');
    expect(e.dataset.energy).toBe('0');
    expect(e.textContent).toMatch(/다음 공에 2 충전/);
  });
  it('조건부 3 (지켜보기 다음 공): cap 3과 지원 대기 비용',()=>{
    const vm=vmFor('support-armed'),{container}=dock(vm);
    expect(container.querySelector('[data-testid=bv-energy]').dataset.cap).toBe('3');
    expect(energyLine(vm.energy,vm.phase)).toBe('−1 → 2 남음');
    expect(energyPips(vm.energy)).toEqual(['on','on','spend']);
  });
});

describe('카드 면',()=>{
  it('긴 한글 이름·강화·조건부: 이름 전체가 접근성 이름에 있고 조건은 잘리지 않는 줄에 있다',()=>{
    const vm=edgeHand(),{container}=dock(vm);
    const long=container.querySelector('[data-card-kind=twoStrikeApproach]');
    expect(long.getAttribute('title')).toBe(CARDS.twoStrikeApproach.name);
    expect(long.getAttribute('aria-label')).toContain(CARDS.twoStrikeApproach.name);
    const cond=vm.hand.find(x=>x.kind==='nerveOfSteel').condition;
    expect(cond).toBeTruthy();
    expect(cond).toBe('2스트라이크 전용');
    expect(container.querySelector('[data-card-kind=nerveOfSteel] .bv-card-condition').textContent).toBe(cond);
    const plus=container.querySelector('[data-card-kind=strike].is-plus');
    expect(plus.querySelector('.bv-card-name').textContent).toBe(CARDS.strike.name+'+');
    const css=readFileSync('src/duel/battle-vnext/hand.css','utf8');
    const notesRule=css.match(/\.bv-card-notes\{[^}]*\}/)[0];
    expect(notesRule).not.toMatch(/line-clamp|ellipsis|max-height/);
  });
  it('기존 kind별 원화를 기본으로 쓰고, A01 6칸 시트는 명시할 때만',()=>{
    expect(defaultCardArt({kind:'strike'}).url).toBe(cardArtFor('strike'));
    expect(mockupSheetArt(5)).toEqual({url:MOCKUP_CARD_SHEET.url,position:'100% 100%',size:'300% 200%'});
    const {container}=dock(vmFor('watch-read0'));
    const art=container.querySelector('[data-card-kind=strike] .bv-card-art');
    expect(art.style.backgroundImage).toContain(cardArtFor('strike'));
  });
  it('준비 카드는 범위 glyph 대신 준비 표시',()=>{
    const {container}=dock(vmFor('watch-read0'));
    const prep=container.querySelector('[data-card-kind=scout]');
    expect(prep.querySelector('.bv-prep-glyph')).not.toBeNull();
    expect(prep.querySelector('.bv-glyph')).toBeNull();
  });
});

describe('입력',()=>{
  it('탭 → 기존 선택 콜백(id), 기본 스윙 칩 → basic',()=>{
    const vm=vmFor('watch-read0'),tap=vi.fn(),{container}=dock(vm,{onCardTap:tap});
    fireEvent.click(cardsIn(container)[0]);
    expect(tap).toHaveBeenLastCalledWith(vm.hand[1].id);
    fireEvent.click(container.querySelector('[data-testid=bv-basic-chip]'));
    expect(tap).toHaveBeenLastCalledWith('basic');
  });
  it('기본 스윙 선택 상태를 칩에 표시한다',()=>{
    const {container}=dock(vmFor('basic-swing'));
    const chip=container.querySelector('[data-testid=bv-basic-chip]');
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(chip.getAttribute('aria-label')).toMatch(/선택됨/);expect(chip.getAttribute('aria-label')).not.toMatch(/다시 누르면 해제/);
  });
  it('가로 스와이프 뒤 click은 선택을 바꾸지 않는다',()=>{
    const tap=vi.fn(),{container}=dock(vmFor('watch-read0'),{onCardTap:tap});
    const row=container.querySelector('[data-testid=bv-hand]'),card=cardsIn(container)[1];
    fireEvent.pointerDown(card,{clientX:200,clientY:50,pointerId:1});
    fireEvent.pointerMove(card,{clientX:200-SWIPE_SLOP_PX-5,clientY:52,pointerId:1});
    fireEvent.pointerUp(card,{pointerId:1});
    fireEvent.click(card);
    expect(tap).not.toHaveBeenCalled();
    fireEvent.pointerDown(card,{clientX:200,clientY:50,pointerId:2});
    fireEvent.pointerUp(card,{pointerId:2});
    fireEvent.click(card);
    expect(tap).toHaveBeenCalledTimes(1);
    expect(row).toBeTruthy();
  });
  it('입력 잠금(정보창·투구 중)은 비용 부족과 다른 이유로 보인다',()=>{
    const inspect=dock(vmFor('inspector-open'));
    expect(cardsIn(inspect.container).every(b=>b.disabled)).toBe(true);
    expect(inspect.container.querySelector('[data-testid=bv-basic-chip]').disabled).toBe(true);
    expect(inspect.container.querySelector('.bv-hand-lock').textContent).toMatch(/정보창/);
    cleanup();
    const flight=dock(vmFor('flight'),{onCardDetail:()=>{}});
    expect(flight.container.querySelector('.bv-hand-lock').textContent).toBe('투구 중 · 손패 잠금');
    expect([...flight.container.querySelectorAll('.bv-card-detail')].every(b=>b.disabled)).toBe(true);
  });
  it('상세: hover 없이 ⓘ 버튼과 길게 누르기(contextmenu)로 연다',()=>{
    const det=vi.fn(),vm=vmFor('watch-read0'),{container}=dock(vm,{onCardDetail:det});
    const id=vm.hand[1].id;
    fireEvent.click(within(container.querySelector(`[data-card-id="${id}"]`)).getByRole('button',{name:/자세히$/}));
    expect(det).toHaveBeenLastCalledWith(id,expect.any(HTMLElement));
    fireEvent.contextMenu(cardsIn(container)[0]);
    expect(det).toHaveBeenCalledTimes(2);
  });
  it('화살표 키로 카드 사이 포커스 이동',()=>{
    const {container}=dock(vmFor('watch-read0'));
    const cards=cardsIn(container);cards[0].focus();
    fireEvent.keyDown(cards[0],{key:'ArrowRight'});
    expect(document.activeElement).toBe(cards[1]);
    fireEvent.keyDown(cards[1],{key:'ArrowLeft'});
    expect(document.activeElement).toBe(cards[0]);
  });
  it('부모가 정보창을 닫은 뒤 스크롤·포커스를 되돌릴 수 있다',()=>{
    const ref=createRef(),vm=vmFor('swing-main');
    render(<HandDock ref={ref} hand={vm.hand} energy={vm.energy} input={vm.input} phase={vm.phase} onCardTap={()=>{}}/>);
    ref.current.setScroll(120);
    expect(typeof ref.current.getScroll()).toBe('number');
    expect(ref.current.focusCard(buildFixture('swing-main').selected)).toBe(true);
    expect(document.activeElement.dataset.selection).toBe('main');
    expect(ref.current.focusCard('missing')).toBe(false);
  });
});

describe('CSS 범위',()=>{
  it('전역 셀렉터·overflow 정책을 건드리지 않는다',()=>{
    const css=readFileSync('src/duel/battle-vnext/hand.css','utf8').replace(/\/\*[\s\S]*?\*\//g,'');
    expect(css).not.toMatch(/(^|[,\s}])(html|body|:root|#root|\.duel-app)\s*[,{]/m);
    for(const rule of css.split('}').filter(r=>r.includes('{'))){
      const sel=rule.split('{')[0].trim();
      if(sel.startsWith('@')||sel.startsWith('50%'))continue;
      expect(sel,sel).toMatch(/^\.bv-/);
    }
  });
  it('selectionTag는 순서 번호를 붙인다',()=>{
    expect(selectionTag({selectionRole:'support',order:3})).toBe('③ 지원');
  });
});
