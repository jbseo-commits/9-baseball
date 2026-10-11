import {describe,expect,it} from 'vitest';
import {
  createV10Duel,enterV10Node,playV10Action,
} from '../src/duel/engine.js';
import {EVENT_DEFS,eventForNode,eventOfferForNode,resolveEventChoice} from '../src/duel/events.js';
import {CARDS} from '../src/duel/cards.js';
import {validateV10State} from '../src/duel/v10-storage.js';
import {DECK_MAX} from '../src/duel/cards.js';

// Road events (analysis follow-up): seeded per node, existing currencies only.
function eventState(seed,eventId){
  for(let sd=seed;sd<seed+1200;sd++){
    const s=createV10Duel(sd);
    const n=s.runMap.nodes.find(x=>x.type==='event'&&(!eventId||eventForNode(x)?.id===eventId));
    if(!n)continue;
    const entered=enterV10Node({...s,runMap:{...s.runMap,reachableIds:[n.id]}},n.id);
    if(entered.phase==='event')return entered;
  }
  throw new Error('no event node found near seed '+seed+(eventId?' for '+eventId:''));
}

describe('V10 road events',()=>{
  it('derives the same event from the same node on every load',()=>{
    const s=createV10Duel(9);
    const nodes=s.runMap.nodes.filter(n=>n.type==='event');
    expect(nodes.length).toBeGreaterThan(0);
    for(const n of nodes){
      expect(eventForNode(n)?.id).toBe(eventForNode({...n})?.id);
      expect(EVENT_DEFS.some(d=>d.id===eventForNode(n)?.id)).toBe(true);
    }
    expect(eventForNode({type:'battle',act:1,seed:1})).toBeNull();
  });

  it('names concrete seeded params and guards illegal picks',()=>{
    const s=eventState(4,'dugout-cache');
    const offer=eventOfferForNode(s);
    expect(offer.event).toBe('dugout-cache');
    expect(offer.choices.map(c=>c.id)).toEqual(['rummage','delve','leave']);
    // Fresh 9-deck is at the floor: digging deeper is refused, the rest is open.
    const problem=id=>offer.choices.find(c=>c.id===id)?.problem;
    expect(problem('delve')).toContain('얇다');
    expect(problem('rummage')).toBeNull();
    expect(problem('leave')).toBeNull();
  });

  it('rummage adds the seeded card and completes the node',()=>{
    const s=eventState(4,'dugout-cache');
    const before=s.deck.length;
    const {state:t,event,outcome}=resolveEventChoice(s,'rummage');
    expect(event).toBe('dugout-cache');
    expect(t.deck).toHaveLength(before+1);
    expect(outcome).toContain('덱에 넣었다');
    expect(t.phase).toBe('map');
    expect(t.runMap.completedNodeIds).toContain(s.runMap.currentNodeId);
    expect(t.v10.utilityHistory.at(-1)).toMatchObject({kind:'event'});
    expect(validateV10State(t)).toBe(true);
  });

  it('delve trades a random card out once the deck can spare one',()=>{
    let s=eventState(4,'dugout-cache');
    s={...s,deck:[...s.deck,{id:'c9',kind:'slug'},{id:'c10',kind:'rally'}],nextId:11};
    const {state:t,outcome}=resolveEventChoice(s,'delve');
    expect(t.deck).toHaveLength(s.deck.length);
    expect(outcome).toContain('잃었다');
    expect(validateV10State(t)).toBe(true);
  });

  it('drill upgrades and advice arms the next battle',()=>{
    const a=resolveEventChoice(eventState(5,'veteran-coach'),'drill');
    expect(a.state.deck.some(c=>c.plus)).toBe(true);
    expect(a.outcome).toContain('+');
    const b=resolveEventChoice(eventState(5,'veteran-coach'),'advice');
    expect(b.state.v10.nextBattleBonus).toMatchObject({technique:8});
  });

  it('rain respects the outs caps both ways',()=>{
    let s=eventState(6,'rain-delay');
    expect(eventOfferForNode({...s,runOuts:0}).choices.find(c=>c.id==='rest')?.problem).toContain('줄일');
    expect(eventOfferForNode({...s,runOuts:2}).choices.find(c=>c.id==='train')?.problem).toContain('가득');
    const rested=resolveEventChoice({...s,runOuts:1},'rest');
    expect(rested.state.runOuts).toBe(0);
    const trained=resolveEventChoice({...s,runOuts:1},'train');
    expect(trained.state.runOuts).toBe(2);
    expect(trained.state.deck.some(c=>c.plus)).toBe(true);
  });

  it('rejects bad choices, illegal picks, and wrong phases without changing state',()=>{
    const s=eventState(4,'dugout-cache');
    expect(resolveEventChoice(s,'nope').state).toBe(s);
    expect(resolveEventChoice(s,'delve').state).toBe(s);
    expect(resolveEventChoice(createV10Duel(4),'leave').state.phase).toBe('map');
  });

  it('an event-phase save validates',()=>{
    expect(validateV10State(eventState(4))).toBe(true);
  });

  it('a full deck refuses new cards with a reason',()=>{
    let s=eventState(4,'dugout-cache');
    const kinds=['slug','rally','flow','defend','lure','strike','place','finisher','wall'];
    while(s.deck.length<DECK_MAX)s.deck.push({id:'x'+s.deck.length,kind:kinds[s.deck.length%kinds.length]});
    expect(eventOfferForNode(s).choices.find(c=>c.id==='rummage')?.problem).toContain('가득');
  });

  it('every event definition honors the table contract',()=>{
    // Guards the event table as it grows: structure, known ops, real pools,
    // valid acts, a leave in every event, distinct titles, honest gambles.
    const OPS=new Set(['addRandom','sacrificeRandom','upgradeRandom','upgradeAll','bonus8','outsUp','outsDown','gainRelic','transformRandom','duplicateRandom','gamble']);
    const titles=new Set();
    expect(EVENT_DEFS.length).toBeGreaterThanOrEqual(100);
    for(const d of EVENT_DEFS){
      expect(typeof d.id).toBe('string');
      expect(typeof d.title).toBe('string');
      expect(titles.has(d.title)).toBe(false);titles.add(d.title);
      expect(typeof d.text).toBe('string');
      expect(d.text.length).toBeGreaterThan(0);
      expect(d.acts.every(a=>[1,2,3].includes(a))).toBe(true);
      expect(d.choices.some(c=>c.ops.length===0)).toBe(true);
      for(const c of d.choices){
        // A choice that only raises the carried-out count is pure cost: leaving is always
        // free, so nobody would ever click it. Thinning the deck (sacrificeRandom)
        // counts as a gain — that is what DECK_MIN is for.
        if(c.ops.length){
          const leaves=[...c.ops.flatMap(o=>o.op==='gamble'?o.win:[]),...c.ops];
          const pays=leaves.some(o=>['addRandom','upgradeRandom','upgradeAll','bonus8','gainRelic','transformRandom','duplicateRandom','outsDown','sacrificeRandom'].includes(o.op));
          expect(pays,`${d.id}/${c.id} only raises the carried-out count`).toBe(true);
        }
        expect(typeof c.label).toBe('string');
        expect(typeof c.desc).toBe('string');
        for(const o of c.ops){
          expect(OPS.has(o.op)).toBe(true);
          if(o.op==='gamble'){
            expect(o.p).toBeGreaterThan(0);expect(o.p).toBeLessThan(1);
            for(const sub of [...o.win,...o.lose])expect(OPS.has(sub.op)).toBe(true);
            // The label must state the real odds: a 0.4 gamble written as a coin
            // flip (앞면/뒷면) would promise 50/50 the engine does not give.
            expect(c.desc).toContain(`${Math.round(o.p*100)}%`);
            expect(c.desc).toContain(`${Math.round((1-o.p)*100)}%`);
            expect(c.desc).not.toMatch(/앞면|뒷면/);
          }
        }
      }
      for(const kind of (d.addPool||[]))expect(Object.hasOwn(CARDS,kind)).toBe(true);
      /* Any op that adds a random card needs a concrete pool: with none, the
         offer would apply `kind:null` and write a card that fails validation. */
      const needsPool=[...d.choices.flatMap(c=>c.ops.flatMap(o=>o.op==='gamble'?[...o.win,...o.lose]:[o]))]
        .filter(o=>o.op==='addRandom'||o.op==='transformRandom');
      if(needsPool.length)expect(d.addPool?.length).toBeGreaterThan(0);
      for(const t of [d.title,d.text,...d.choices.flatMap(c=>[c.label,c.desc])]){
        expect(t).not.toMatch(/[぀-ヿ一-鿿]/);
      }
    }
  });

  it('relic, transform, duplicate, and gamble ops resolve deterministically',()=>{
    const find=(eventId,choiceId,minDeck=0)=>{
      for(let sd=4;sd<1200;sd++){
        const s0=createV10Duel(sd);
        const n=s0.runMap.nodes.find(x=>x.type==='event'&&eventForNode(x)?.id===eventId);
        if(!n)continue;
        let s=enterV10Node({...s0,runMap:{...s0.runMap,reachableIds:[n.id]}},n.id);
        if(s.phase!=='event')continue;
        while(s.deck.length<minDeck){s.deck.push({id:'z'+s.deck.length,kind:'strike'});s.nextId++;}
        const offer=eventOfferForNode(s);
        const c=offer?.choices.find(x=>x.id===choiceId);
        if(c&&!c.problem)return {s,offer};
      }
      throw new Error('no state for '+eventId+'/'+choiceId);
    };
    // gainRelic via lucky-ball sign (deck grows first so sacrifice stays legal)
    {
      const {s}=find('lucky-ball','sign',10);
      const t=resolveEventChoice(s,'sign').state;
      expect(t.relics.length).toBe(s.relics.length+1);
      expect(t.deck.length).toBe(s.deck.length-1);
    }
    // transform keeps deck size, duplicate grows it
    {
      const {s}=find('groundskeeper','reshape',10);
      const t=resolveEventChoice(s,'reshape').state;
      expect(t.deck.length).toBe(s.deck.length);
    }
    {
      const {s}=find('lucky-ball','keep',9);
      const t=resolveEventChoice(s,'keep').state;
      expect(t.deck.length).toBe(s.deck.length+1);
    }
    // gamble is deterministic per node and states its odds outcome
    {
      const {s}=find('night-game','bet');
      const a=resolveEventChoice(s,'bet'),b=resolveEventChoice(s,'bet');
      expect(a.outcome).toBe(b.outcome);
      expect(a.outcome).toMatch(/동전은 (앞면|뒷면)\./);
      expect(a.state.phase).toBe('map');
    }
    // a winning gamble resolves without throwing and names its gains
    {
      let won=null;
      for(let sd=4;sd<3000&&!won;sd++){
        const s0=createV10Duel(sd);
        const n=s0.runMap.nodes.find(x=>x.type==='event'&&eventForNode(x)?.id==='night-game');
        if(!n)continue;
        let s=enterV10Node({...s0,runMap:{...s0.runMap,reachableIds:[n.id]}},n.id);
        if(s.phase!=='event')continue;
        const r=resolveEventChoice(s,'bet');
        if(r.outcome.startsWith('동전은 앞면'))won=r;
      }
      expect(won).toBeTruthy();
      expect(won.outcome).toContain('다음 전투 타격 +8');
    }
    // seeded targets are named up front instead of staying blind
    {
      const s=eventState(4,'dugout-cache');
      const rummage=eventOfferForNode(s).choices.find(c=>c.id==='rummage');
      expect(rummage.desc).toMatch(/획득$/);
      expect(rummage.desc).not.toBe('무작위 카드 1장을 덱에 넣는다');
    }
  });

  it('repeated targets read once, and a full upgrade stays on one short line',()=>{
    const find=(eventId,choiceId,deckSize)=>{
      for(let sd=4;sd<1200;sd++){
        const s0=createV10Duel(sd);
        const n=s0.runMap.nodes.find(x=>x.type==='event'&&eventForNode(x)?.id===eventId);
        if(!n)continue;
        let s=enterV10Node({...s0,runMap:{...s0.runMap,reachableIds:[n.id]}},n.id);
        if(s.phase!=='event')continue;
        const kinds=['slug','rally','flow','defend','lure','strike','place','finisher','wall','bunt'];
        s={...s,deck:Array.from({length:deckSize},(_,i)=>({id:'d'+i,kind:kinds[i%kinds.length]})),nextId:deckSize};
        const c=eventOfferForNode(s)?.choices.find(x=>x.id===choiceId);
        if(c&&!c.problem)return {s,desc:c.desc};
      }
      throw new Error('no state for '+eventId+'/'+choiceId);
    };
    // Two duplicateRandom ops share one seeded card: name it once with a count,
    // not twice (it read as "푸근 노트빨 복제 · 푸근 노트빨 복제").
    {
      const {s,desc}=find('phantom-fan','accept',10);
      expect(desc.match(/복제/g)).toHaveLength(1);
      expect(desc).toMatch(/복제 ×2$/);
      expect(resolveEventChoice(s,'accept').state.deck).toHaveLength(12);
    }
    // walkoff-dream costs one card first, then upgrades what is left: the list is
    // capped at four names plus a count so an 18-card deck cannot print one wall of text
    {
      const {s}=find('walkoff-dream','chase',12);
      const {outcome,state}=resolveEventChoice(s,'chase');
      expect(state.deck).toHaveLength(11);
      expect(outcome).toMatch(/카드 11장 강화:/);
      expect(outcome).toContain('외 7장');
      expect(outcome.length).toBeLessThan(120);
    }
  });

  it('every legal choice of every generated event keeps the save valid',()=>{
    // Walks real map seeds instead of hand-picked fixtures: a gamble loss branch
    // or a rarely derived event used to slip through with no coverage at all.
    let resolved=0;
    for(let sd=4;sd<70;sd++){
      const s0=createV10Duel(sd);
      for(const n of s0.runMap.nodes.filter(x=>x.type==='event')){
        const entered=enterV10Node({...s0,runMap:{...s0.runMap,reachableIds:[n.id]}},n.id);
        if(entered.phase!=='event')continue;
        // one deck per size band so caps (DECK_MIN/MAX), plus cards, and outs
        // extremes are all exercised on the same offer
        for(const [deckSize,outs,plusAll] of [[0,0,false],[9,1,false],[12,2,true],[18,0,false]]){
          const kinds=['slug','rally','flow','defend','lure','strike','place','finisher','wall','bunt'];
          const s={...entered,runOuts:outs,deck:Array.from({length:deckSize},(_,i)=>({id:'d'+i,kind:kinds[i%kinds.length],...(plusAll?{plus:true}:{})})),nextId:deckSize};
          const offer=eventOfferForNode(s);
          expect(offer).toBeTruthy();
          expect(offer.choices.some(c=>!c.problem)).toBe(true);
          for(const c of offer.choices.filter(c=>!c.problem)){
            const r=resolveEventChoice(s,c.id);
            expect(r.state).not.toBe(s);
            expect(validateV10State(r.state)).toBe(true);
            expect(r.state.deck.every(x=>Object.hasOwn(CARDS,x.kind))).toBe(true);
            expect(r.state.deck.every(x=>typeof x.id==='string')).toBe(true);
            expect(r.outcome).not.toMatch(/null|undefined|NaN/);
            resolved++;
          }
        }
      }
    }
    expect(resolved).toBeGreaterThan(400);
  });

  it('no event greys out every real option at the starting deck size',()=>{
    // A fresh run starts at exactly DECK_MIN (9 cards) with 0 carried outs, so a
    // pure-sacrifice event would otherwise show one enabled button ("떠난다").
    const seen=new Set(),blocked=[];
    for(let sd=4;sd<3000&&seen.size<EVENT_DEFS.length;sd++){
      const s0=createV10Duel(sd);
      for(const n of s0.runMap.nodes.filter(x=>x.type==='event')){
        const entered=enterV10Node({...s0,runMap:{...s0.runMap,reachableIds:[n.id]}},n.id);
        if(entered.phase!=='event')continue;
        const offer=eventOfferForNode({...entered,runOuts:0});
        if(!offer||seen.has(offer.event))continue;
        seen.add(offer.event);
        if(!offer.choices.some(c=>c.ops.length&&!c.problem))blocked.push(offer.event);
      }
    }
    expect(blocked).toEqual([]);
    expect(seen.size).toBe(EVENT_DEFS.length);
  });
});
