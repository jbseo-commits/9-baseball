// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import CardDetailSheet,{cardDetailOf,installCardDetailGestures,LONG_PRESS_MS,NO_SELECT_CLASS} from '../src/duel/CardDetailSheet.jsx';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,enterV10Node,saveV10Duel} from '../src/duel/engine.js';
import {BUILDS,CARDS} from '../src/duel/cards.js';
import {cardArtFor,cardArtFocusFor,coverPositionY,ART_FOCUS_Y,CARD_ART_FOCUS_Y,DEFAULT_ART_FOCUS_Y} from '../src/duel/card-art.js';

// #103 M06 — a long-press on a hand card opened the detail sheet under the still-down finger, and
// Android Chrome's own long-press then selected the sheet's rule text ("뽑기") with the copy/share
// menu and Touch to Search on top of the game. #103 M07 — the wide detail crop cut the faces off.
beforeEach(()=>{localStorage.clear();vi.useFakeTimers()});
afterEach(()=>{cleanup();vi.useRealTimers();window.getSelection()?.removeAllRanges();document.body.innerHTML='';});

const policyCss=fs.readFileSync(path.resolve(process.cwd(),'src/duel/touch-policy.css'),'utf8');
const detailCss=fs.readFileSync(path.resolve(process.cwd(),'src/duel/card-detail.css'),'utf8');
const policyRule=policyCss.replace(/\/\*[\s\S]*?\*\//g,'').match(/([^{}]+)\{([^}]*user-select:none[^}]*)\}/);
const policySelectors=policyRule[1].split(',').map(s=>s.trim()).filter(Boolean);

describe('#103 M06 no-select policy',()=>{
  it('declares one no-select rule: no selection, no callout, scoped to game surfaces only',()=>{
    expect(policyRule[2]).toMatch(/-webkit-user-select:none/);
    expect(policyRule[2]).toMatch(/(^|;)\s*user-select:none/);
    expect(policyRule[2]).toMatch(/-webkit-touch-callout:none/);
    expect(policySelectors).toContain('.'+NO_SELECT_CLASS);
    for(const sel of policySelectors)expect(sel).not.toMatch(/^(html|body|#root|\.duel-app|\*)\b/);
    // it never blocks gestures: scrolling and taps are not the policy's business
    expect(policyCss.replace(/\/\*[\s\S]*?\*\//g,'')).not.toMatch(/touch-action|pointer-events|overflow/);
  });
  it('the detail sheet carries the policy class and stays readable to screen readers',()=>{
    render(<CardDetailSheet detail={cardDetailOf('scout',false)} onClose={()=>{}}/>);
    const backdrop=document.querySelector('.card-detail-backdrop');
    expect(backdrop.classList.contains(NO_SELECT_CLASS)).toBe(true);
    const dialog=screen.getByRole('dialog',{name:CARDS.scout.name+' 카드 설명'});
    expect(dialog.getAttribute('aria-hidden')).toBeNull();
    expect(dialog.textContent).toContain(CARDS.scout.text);
    expect(screen.getByRole('button',{name:'닫기'})).toBe(document.activeElement);
  });
  it('the ballpark hand cards and the info button match the policy selectors',()=>{
    let s=createV10Duel(1);
    s.build='away';s.deck=BUILDS.away.cards.map((kind,i)=>({id:'c'+i,kind}));s.nextId=BUILDS.away.cards.length;
    s=enterV10Node(s,'a1-entry');saveV10Duel(localStorage,s);
    render(<Duel/>);fireEvent.click(screen.getByRole('button',{name:'MAIN RUN 이어하기',exact:true}));
    const cards=[...document.querySelectorAll('.bp-hand [data-card-kind]')];
    expect(cards.length).toBeGreaterThan(1);
    const covered=el=>policySelectors.some(sel=>el.matches(sel));
    for(const card of cards)expect(covered(card),card.dataset.cardKind).toBe(true);
    fireEvent.click(document.querySelector('.bp-hand .bp-card:not(.basic)'));
    const info=document.querySelector('.bp-info');
    if(info)expect(covered(info)).toBe(true);
  });
  it('covers the legacy (tutorial) hand cards too',()=>{
    document.body.innerHTML='<div class="duel-hand"><button class="duel-card" data-card-kind="bunt">x</button></div>';
    const card=document.querySelector('.duel-card');
    expect(policySelectors.some(sel=>card.matches(sel))).toBe(true);
  });
});

function setup(){
  document.body.innerHTML=`<div class="bp-hand"><button class="bp-card" data-card-kind="scout"><strong>${CARDS.scout.name}</strong></button></div>
  <div class="card-detail-backdrop"><section class="card-detail-sheet"><p class="card-detail-rule">카드 1장 뽑기.</p><button class="card-detail-close">닫기</button></section></div>`;
  return {card:document.querySelector('.bp-card'),rule:document.querySelector('.card-detail-rule'),backdrop:document.querySelector('.card-detail-backdrop'),close:document.querySelector('.card-detail-close')};
}
const pointer=(type,el,id=1)=>el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,clientX:10,clientY:10}));
const fire=(el,type,Ctor=Event)=>{const e=new Ctor(type,{bubbles:true,cancelable:true});el.dispatchEvent(e);return e;};
const selectText=el=>{const r=document.createRange();r.selectNodeContents(el);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);return sel;};

describe('#103 M06 the opening long-press never selects the sheet text',()=>{
  it('clears the selection when a long-press opens the sheet and again when the finger lifts',()=>{
    const {card,rule}=setup(),open=vi.fn(),off=installCardDetailGestures(window,open);
    const sel=selectText(rule);
    expect(sel.rangeCount).toBe(1);
    pointer('pointerdown',card);vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(open).toHaveBeenCalledWith({kind:'scout',plus:false,problem:null},card);
    expect(sel.rangeCount).toBe(0);
    selectText(rule);                           // the browser's own long-press lands on the sheet text
    pointer('pointerup',rule);
    expect(window.getSelection().rangeCount).toBe(0);
    off();
  });
  it('refuses selectstart and the native long-press menu on the sheet while the opening press is held',()=>{
    const {card,rule}=setup(),off=installCardDetailGestures(window,vi.fn());
    pointer('pointerdown',card);vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(fire(rule,'selectstart').defaultPrevented).toBe(true);
    expect(fire(rule,'contextmenu',MouseEvent).defaultPrevented).toBe(true);
    pointer('pointercancel',rule);              // Chrome cancels the pointer when its long-press starts
    expect(fire(rule,'contextmenu',MouseEvent).defaultPrevented).toBe(true);   // grace covers the late menu
    vi.advanceTimersByTime(400);
    // afterwards nothing is blocked: selection and the context menu are the browser's again
    expect(fire(rule,'selectstart').defaultPrevented).toBe(false);
    expect(fire(rule,'contextmenu',MouseEvent).defaultPrevented).toBe(false);
    off();
  });
  it('swallows the ghost click that ends the press, so the backdrop does not close the sheet at once',()=>{
    const {card,backdrop}=setup(),close=vi.fn(),off=installCardDetailGestures(window,vi.fn());
    backdrop.addEventListener('click',close);
    pointer('pointerdown',card);vi.advanceTimersByTime(LONG_PRESS_MS);pointer('pointerup',backdrop);
    backdrop.click();
    expect(close).not.toHaveBeenCalled();
    backdrop.click();
    expect(close).toHaveBeenCalledTimes(1);
    off();
  });
  it('never eats the player\'s own quick tap on 닫기 or the backdrop after the press',()=>{
    const {card,backdrop,close:closeBtn}=setup(),close=vi.fn(),off=installCardDetailGestures(window,vi.fn());
    closeBtn.addEventListener('click',close);backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();});
    // no ghost click arrives (Android after a long-press), the player taps 닫기 right away
    pointer('pointerdown',card);vi.advanceTimersByTime(LONG_PRESS_MS);pointer('pointerup',card);
    vi.advanceTimersByTime(120);pointer('pointerdown',closeBtn);pointer('pointerup',closeBtn);closeBtn.click();
    expect(close).toHaveBeenCalledTimes(1);
    // or taps the backdrop well after the grace
    pointer('pointerdown',card);vi.advanceTimersByTime(LONG_PRESS_MS);pointer('pointerup',card);
    vi.advanceTimersByTime(1000);backdrop.click();
    expect(close).toHaveBeenCalledTimes(2);
    off();
  });
  it('a mouse right-click opens the detail without guarding anything afterwards',()=>{
    const {card,backdrop,rule}=setup(),open=vi.fn(),close=vi.fn(),off=installCardDetailGestures(window,open);
    backdrop.addEventListener('click',close);
    expect(fire(card,'contextmenu',MouseEvent).defaultPrevented).toBe(true);
    expect(open).toHaveBeenCalledTimes(1);
    expect(fire(rule,'selectstart').defaultPrevented).toBe(false);
    backdrop.click();
    expect(close).toHaveBeenCalledTimes(1);
    off();
  });
  it('a touch long-press whose contextmenu beats the timer is guarded the same way',()=>{
    const {card,rule}=setup(),open=vi.fn(),off=installCardDetailGestures(window,open);
    pointer('pointerdown',card);vi.advanceTimersByTime(300);
    expect(fire(card,'contextmenu',MouseEvent).defaultPrevented).toBe(true);
    expect(open).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(open).toHaveBeenCalledTimes(1);      // the timer was cancelled: one sheet, not two
    expect(fire(rule,'selectstart').defaultPrevented).toBe(true);
    pointer('pointerup',rule);vi.advanceTimersByTime(400);
    expect(fire(rule,'selectstart').defaultPrevented).toBe(false);
    off();
  });
  it('the sheet clears a selection left over from the opening press when it mounts',()=>{
    document.body.innerHTML='<p id="t">카드 1장 뽑기.</p>';
    const sel=selectText(document.getElementById('t'));
    render(<CardDetailSheet detail={cardDetailOf('scout',false)} onClose={()=>{}}/>);
    expect(sel.rangeCount).toBe(0);
  });
});

describe('#103 M07 the detail art frames the face',()=>{
  const pct=s=>Number(s.match(/50% ([\d.]+)%/)[1])/100;
  it('applies the per-illustration focal point to the image',()=>{
    render(<CardDetailSheet detail={cardDetailOf('scout',false)} onClose={()=>{}}/>);
    const img=document.querySelector('.card-detail-art img');
    const focus=cardArtFocusFor('scout');
    expect(img.style.objectPosition).toBe(focus.objectPosition);
    expect(pct(focus.objectPosition)).toBeLessThan(.3);   // the old centred crop (50%) showed the chest
  });
  it('keeps every card\'s subject inside the visible strip on 360–440px sheets',()=>{
    for(const kind of Object.keys(CARDS)){
      if(!cardArtFor(kind))continue;
      const {focusY}=cardArtFocusFor(kind);
      for(const frame of [1.6,1.9,2.2]){
        const visible=(1024/1536)/frame,top=coverPositionY(focusY,1024/1536,frame)*(1-visible);
        expect(focusY,kind+'@'+frame).toBeGreaterThan(top+visible*.12);
        expect(focusY,kind+'@'+frame).toBeLessThan(top+visible*.75);
      }
    }
  });
  it('has a measured focal point for every shipped illustration and a head-height default',()=>{
    const files=fs.readdirSync(path.resolve(process.cwd(),'assets/cards-v15')).filter(f=>f.endsWith('.png')&&f!=='deck-dex-backdrop.png');
    /* Codex keeps landing card-<key>.png files: an unmeasured one frames on the head-height default
       until it gets its own value, so only the measured values are held to the head band here */
    for(const f of files){const y=ART_FOCUS_Y[f]??DEFAULT_ART_FOCUS_Y;expect(y,f).toBeGreaterThan(.1);expect(y,f).toBeLessThan(.5);}
    expect(files.filter(f=>ART_FOCUS_Y[f]!=null).length).toBeGreaterThan(files.length*.8);
    expect(DEFAULT_ART_FOCUS_Y).toBeGreaterThanOrEqual(.16);
    expect(DEFAULT_ART_FOCUS_Y).toBeLessThanOrEqual(.32);
  });
  it('lets one card key override the file default',()=>{
    const before=cardArtFocusFor('scout').objectPosition;
    CARD_ART_FOCUS_Y.scout=.5;
    try{expect(cardArtFocusFor('scout')).toEqual({focusY:.5,objectPosition:expect.any(String)});expect(cardArtFocusFor('scout').objectPosition).not.toBe(before);}
    finally{delete CARD_ART_FOCUS_Y.scout;}
    expect(cardArtFocusFor('scout').objectPosition).toBe(before);
  });
  it('gives the art a taller, viewport-bound frame and keeps 닫기 pinned while the sheet scrolls',()=>{
    expect(detailCss).toMatch(/\.card-detail-art\{[^}]*height:clamp\(120px,23dvh,188px\)/);
    expect(detailCss).toMatch(/\.card-detail-art img\{[^}]*object-fit:cover[^}]*object-position:50% 12%/);
    expect(detailCss).toMatch(/\.card-detail-head\{[^}]*position:sticky;top:0/);
    expect(detailCss).toMatch(/\.card-detail-sheet\{[^}]*max-height:min\(86dvh,640px\);overflow:auto/);
  });
});
