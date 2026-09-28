// @vitest-environment happy-dom
import React from 'react';
import fs from 'node:fs';
import {render,fireEvent,cleanup,screen} from '@testing-library/react';
import {afterEach,describe,it,expect} from 'vitest';
import BallparkStop from '../src/duel/BallparkStop.jsx';
import {CARDS} from '../src/duel/cards.js';
import {V10_RELICS} from '../src/duel/v10-relics.js';

// Issue #103 (mobile playtest 2026-09-28): M01 shop offers unreadable, M02 blank go button, M05 cut reward text.
afterEach(()=>cleanup());
const css=fs.readFileSync('src/duel/stop-readability.css','utf8');
const stopJsx=fs.readFileSync('src/duel/BallparkStop.jsx','utf8');
const go=()=>screen.getByTestId('bp-stop-go');
const offers=()=>[...document.querySelectorAll('.bp-offer')];
const rule=sel=>{const i=css.indexOf(sel+'{');expect(i,sel).toBeGreaterThan(-1);return css.slice(i,css.indexOf('}',i));};

const STOPS={
  reward:{go:'챙긴다',opts:[{type:'add',kind:'scoreSheet'},{type:'add',kind:'chokeUp'},{type:'add',kind:'chainSign'}]},
  shop:{go:'들인다',opts:[{type:'add',kind:'twoStrikeApproach'},{type:'add',kind:'discipline'},{type:'add',kind:'crossLane'},{type:'relic',relic:'twoStack'},{type:'relic',relic:'firstPitch'}]},
  locker:{go:'뺀다',opts:[{type:'remove',id:1,kind:'slug'},{type:'remove',id:2,kind:'watch'}]},
  training:{go:'단련한다',opts:[{type:'upgrade',id:1,kind:'strike'},{type:'upgrade',id:2,kind:'setup'}]},
  rest:{go:'쉰다',opts:[{type:'rest',technique:8}]},
};

describe('M02 — the go button always carries a visible label',()=>{
  for(const [kind,{go:verb,opts}] of Object.entries(STOPS)){
    it(`${kind}: verb + guide before a pick, verb + item name after`,()=>{
      render(<BallparkStop kind={kind} options={opts} deckCount={10}/>);
      const b=go();
      expect(b.disabled).toBe(true);
      expect(b.querySelector('.bp-go-verb').textContent).toBe(verb);
      const guide=b.querySelector('.bp-go-sub').textContent;
      expect(guide.trim().length).toBeGreaterThan(0);
      expect(guide).toMatch(/고르세요$/);
      expect(b.getAttribute('aria-label')).toBe(verb+' · '+guide);
      fireEvent.click(offers()[0]);
      expect(b.disabled).toBe(false);
      const name=b.querySelector('.bp-go-sub').textContent;
      const o=opts[0];
      const expected=o.type==='relic'?V10_RELICS[o.relic].name:o.type==='rest'?'컨디션 회복':CARDS[o.kind].name+(o.type==='upgrade'?'+':'');
      expect(name).toBe(expected);
      expect(b.getAttribute('aria-label')).toBe(verb+' · '+expected);
      expect(b.querySelector('.bp-go-verb').textContent).toBe(verb);
      // unpick -> back to the guide, never blank
      fireEvent.click(offers()[0]);
      expect(b.disabled).toBe(true);
      expect(b.querySelector('.bp-go-sub').textContent).toBe(guide);
    });
  }
  it('the disabled slot cancels the global disabled fade and never paints slate on the lavender plate',()=>{
    const d=rule('main.bp-stop.bp-choice .bp-verb.go:disabled');
    expect(d).toMatch(/opacity:1/);expect(d).toMatch(/filter:none/);expect(d).toMatch(/border-image:none/);
    expect(d).not.toMatch(/var\(--bp-slate\)/);
    expect(rule('main.bp-stop.bp-choice .bp-verb.go:disabled .bp-go-sub')).toMatch(/color:#ece4cf/);
    // the item name is ellipsis-safe on narrow phones
    expect(rule('main.bp-stop.bp-choice .bp-go-sub')).toMatch(/text-overflow:ellipsis/);
  });
  it('an empty stop still shows only the map button',()=>{
    render(<BallparkStop kind="shop" options={[]}/>);
    expect(document.querySelector('[data-testid=bp-stop-go]')).toBeNull();
    expect(screen.getByTestId('bp-stop-skip').textContent).toBe('지도로');
  });
});

describe('M01 — shop offers are readable dark tiles and cards',()=>{
  it('relic offers render mark, name and the full effect text',()=>{
    render(<BallparkStop kind="shop" options={STOPS.shop.opts}/>);
    const relics=[...document.querySelectorAll('.bp-offer.relic')];
    expect(relics).toHaveLength(2);
    relics.forEach(el=>{
      const r=V10_RELICS[el.dataset.relic];
      expect(el.querySelector('.bp-mark').textContent).toBe(r.mark);
      expect(el.querySelector('.bp-offer-name').textContent).toBe(r.name);
      expect(el.querySelector('.bp-offer-desc').textContent).toBe(r.text);
    });
    // selection state is exposed, and only one offer is on
    fireEvent.click(relics[1]);
    expect(relics[1].getAttribute('aria-pressed')).toBe('true');
    expect(offers().filter(o=>o.classList.contains('on'))).toHaveLength(1);
  });
  it('shop card offers get the dark reward-card face, not the cream A6 fill',()=>{
    const card=rule('main.bp-stop.bp-choice .bp-offer.reward-card');
    expect(card).toMatch(/border-image:none/);expect(card).toMatch(/background:linear-gradient\(180deg,#161c35/);
    const tile=rule('main.bp-stop.bp-choice .bp-offer.bp-tile');
    expect(tile).toMatch(/border-image:none/);expect(tile).toMatch(/background:linear-gradient/);
    expect(rule('main.bp-stop.bp-choice .bp-offer.bp-tile .bp-offer-desc')).toMatch(/color:#cdd6ee/);
  });
  it('facility offers lay out as a grid that starts at the top and scrolls (no clipped first row)',()=>{
    const g=rule('main.bp-stop.bp-choice:not(.stop-reward) .bp-offers');
    expect(g).toMatch(/display:grid/);expect(g).toMatch(/align-content:start/);expect(g).toMatch(/overflow-y:auto/);
    expect(g).toMatch(/overflow-x:hidden/);
    render(<BallparkStop kind="shop" options={STOPS.shop.opts}/>);
    expect(document.querySelector('.bp-offers').dataset.cards).toBe('3');
  });
  it('rest renders as a readable tile too',()=>{
    render(<BallparkStop kind="rest" options={STOPS.rest.opts}/>);
    const t=document.querySelector('.bp-offer.rest');
    expect(t.classList.contains('bp-tile')).toBe(true);
    expect(t.querySelector('.bp-offer-name').textContent).toBe('컨디션 회복');
  });
});

describe('M05 — reward cards show their full text on an equal-height row',()=>{
  it('every gives line is rendered whole (no slice, no truncation in markup)',()=>{
    const kinds=['twoStrikeApproach','walkOff','defend'];
    render(<BallparkStop kind="reward" options={kinds.map(kind=>({type:'add',kind}))}/>);
    offers().forEach((el,i)=>{
      const lines=[...el.querySelectorAll('.bp-offer-line')].map(x=>x.textContent);
      expect(lines).toEqual(CARDS[kinds[i]].gives);
      expect(el.querySelector('.bp-offer-name').textContent).toBe(CARDS[kinds[i]].name);
    });
    expect(stopJsx).not.toMatch(/gives\|\|\[\]\)\.slice\(/);
  });
  it('effect lines and names wrap with kept words instead of ellipsis',()=>{
    const line=rule('main.bp-stop.bp-choice .bp-offer.reward-card .bp-offer-line');
    expect(line).toMatch(/white-space:normal/);expect(line).toMatch(/word-break:keep-all/);expect(line).toMatch(/text-overflow:clip/);
    expect(rule('main.bp-stop.bp-choice .bp-offer.reward-card .bp-offer-name')).toMatch(/white-space:normal/);
  });
  it('the row is a stretch grid and the rarity badge is pinned to the bottom edge',()=>{
    const row=rule('main.bp-stop.bp-choice.stop-reward .bp-offers');
    expect(row).toMatch(/display:grid/);expect(row).toMatch(/align-items:stretch/);
    expect(rule('main.bp-stop.bp-choice .bp-offer.reward-card .bp-reward-rarity')).toMatch(/margin:auto 0 0/);
    render(<BallparkStop kind="reward" options={STOPS.reward.opts}/>);
    const box=document.querySelector('.bp-offers');
    expect(box.style.getPropertyValue('--n')).toBe('3');
    expect(box.hasAttribute('data-many')).toBe(false);
    // family and rarity stay one badge
    expect(offers()[0].querySelector('.bp-reward-rarity').textContent).toBe('선구안 · COMMON');
  });
  it('a fourth (elite/boss) card turns the row into a snapping strip, not an off-screen overflow',()=>{
    render(<BallparkStop kind="reward" options={[...STOPS.reward.opts,{type:'add',kind:'wall'}]}/>);
    expect(document.querySelector('.bp-offers').hasAttribute('data-many')).toBe(true);
    expect(rule('main.bp-stop.bp-choice.stop-reward .bp-offers[data-many]')).toMatch(/scroll-snap-type:x mandatory/);
  });
});

describe('scope',()=>{
  it('every rule is scoped to the choice stops (never the battle or the run end)',()=>{
    const selectors=css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g,'')
      .split('}').map(b=>b.split('{').slice(-2,-1)[0]).filter(Boolean).flatMap(s=>s.split(',')).map(s=>s.trim()).filter(s=>s&&!s.startsWith('@'));
    expect(selectors.length).toBeGreaterThan(20);
    selectors.forEach(s=>expect(s,s).toMatch(/^main\.bp-stop\.bp-choice/));
    expect(stopJsx).toContain("'bp-stop bp-choice stop-'+kind");
  });
});
