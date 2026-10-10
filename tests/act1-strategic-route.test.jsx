// @vitest-environment happy-dom
import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {createRunMap,validateRunMap} from '../src/duel/run-map.js';
import BallparkMap from '../src/duel/BallparkMap.jsx';
import BallparkEvent from '../src/duel/BallparkEvent.jsx';
import {pitcherFigures,pitcherPortraits} from '../src/duel/pitcher-visuals.js';
import roster from '../assets/pitcher-mobs-v1/roster.json' with {type:'json'};

// 1막 전략 경로: 일곱 줄, 필수 칸(강적·상점·휴식·사건·정비) 보장, 같은 정비·강적은 한 길에서 연달아 붙지 않는다.
const act1=map=>map.nodes.filter(n=>n.act===1);
function pathsToBoss(map){
  const by=new Map(map.nodes.map(n=>[n.id,n])),memo=new Map();
  const count=id=>{if(id==='a1-boss')return 1;if(memo.has(id))return memo.get(id);
    const v=map.edges.filter(e=>e.from===id&&by.get(e.to)?.act===1).reduce((s,e)=>s+count(e.to),0);memo.set(id,v);return v;};
  return count('a1-entry');
}

beforeEach(()=>{globalThis.matchMedia=vi.fn(q=>({matches:false,media:q,addEventListener(){},removeEventListener(){}}));});
afterEach(()=>cleanup());

describe('act 1 strategic route',()=>{
  it('is seven rows deep with every strategic stop and real branching',()=>{
    let total=0;
    for(let seed=0;seed<400;seed++){
      const map=createRunMap(seed*7919+3);
      expect(validateRunMap(map)).toBe(true);
      const a=act1(map);
      expect(Math.max(...a.map(n=>n.row))).toBe(6);
      for(const t of ['elite','shop','rest','event'])expect(a.some(n=>n.type===t)).toBe(true);
      expect(a.some(n=>n.type==='training'||n.type==='locker')).toBe(true);
      // the first fork always offers a non-fight, and elites wait until the third row
      expect(a.filter(n=>n.row===1).some(n=>n.type!=='battle')).toBe(true);
      expect(a.filter(n=>n.type==='elite').every(n=>n.row>=3)).toBe(true);
      const paths=pathsToBoss(map);expect(paths).toBeGreaterThanOrEqual(4);total+=paths;
    }
    expect(total/400).toBeGreaterThan(12);
  });
  it('never chains the same elite / shop / rest along one line in act 1',()=>{
    for(let seed=0;seed<400;seed++){
      const map=createRunMap(seed*31+1),by=new Map(map.nodes.map(n=>[n.id,n]));
      for(const e of map.edges){const a=by.get(e.from),b=by.get(e.to);
        if(a.act===1&&b.act===1&&['elite','shop','rest'].includes(a.type))expect(b.type).not.toBe(a.type);}
    }
  });
  it('keeps acts 2 and 3 on their earlier shape',()=>{
    const map=createRunMap(77);
    expect(Math.max(...map.nodes.filter(n=>n.act===2).map(n=>n.row))).toBe(5);
    expect(Math.max(...map.nodes.filter(n=>n.act===3).map(n=>n.row))).toBe(4);
  });
});

describe('map route preview',()=>{
  it('lights what the chosen stop still leads to and counts it',()=>{
    const map=createRunMap(4242),nodes=act1(map),edges=map.edges.filter(e=>e.from.startsWith('a1-')&&e.to.startsWith('a1-'));
    const first=map.edges.filter(e=>e.from==='a1-entry').map(e=>e.to);
    render(<BallparkMap nodes={nodes} edges={edges} currentNodeId="a1-entry" reachableIds={first} completedIds={['a1-entry']} onEnter={()=>{}} onInspect={()=>{}}/>);
    const target=first[0];
    fireEvent.click(document.querySelector(`[data-node="${target}"]`));
    const ahead=new Set(),walk=[target];
    while(walk.length){const id=walk.pop();for(const e of edges)if(e.from===id&&!ahead.has(e.to)){ahead.add(e.to);walk.push(e.to);}}
    const lit=[...document.querySelectorAll('.bp-node.ahead')].map(b=>b.dataset.node).sort();
    expect(lit).toEqual([...ahead].sort());
    expect(screen.getByTestId('bp-map-ahead').textContent).toContain('이 길 너머');
    const elites=nodes.filter(n=>n.type==='elite'&&ahead.has(n.id)).length;
    if(elites)expect(screen.getByTestId('bp-map-ahead').textContent).toContain('강적 '+elites);
  });
  it('shows a road event with its own marker and line',()=>{
    const map=createRunMap(4242),ev=act1(map).find(n=>n.type==='event');
    render(<BallparkMap nodes={[ev]} edges={[]} reachableIds={[ev.id]} completedIds={[]} onEnter={()=>{}} onInspect={()=>{}}/>);
    expect(document.querySelector('.bp-node.event .bp-mglyph')).not.toBeNull();
    expect(document.querySelector('.bp-mline').textContent).toContain('길 위의 사건');
  });
});

describe('road event screen',()=>{
  const offer={title:'버려진 더그아웃',text:'장비 가방이 있다.',choices:[
    {id:'rummage',label:'뒤진다',desc:'무작위 카드 1장을 덱에 넣는다 · 강타 획득',ops:[{op:'addRandom'}]},
    {id:'delve',label:'깊이 판다',desc:'무작위 1장을 얻고, 무작위 1장을 잃는다 · 강타 획득 · 번트 상실',ops:[{op:'addRandom'},{op:'sacrificeRandom'}],problem:'덱이 가장 얇다'},
    {id:'bet',label:'내기',desc:'앞면/뒷면',ops:[{op:'gamble'}]},
    {id:'leave',label:'떠난다',desc:'아무 일도 없었다',ops:[]},
  ]};
  it('tags each choice by its cost and names the concrete cards',()=>{
    const pick=vi.fn();
    render(<BallparkEvent offer={offer} onPick={pick}/>);
    const [gain,trade,gamble,leave]=screen.getAllByTestId('event-choice');
    expect(gain.className).toContain('t-gain');expect(trade.className).toContain('t-trade');
    expect(gamble.className).toContain('t-gamble');expect(leave.className).toContain('t-leave');
    expect(trade.disabled).toBe(true);expect(trade.textContent).toContain('얇다');
    expect(trade.querySelector('.ev-chips i.loss').textContent).toBe('번트 상실');
    fireEvent.click(gain);expect(pick).toHaveBeenCalledWith('rummage');
  });
  it('reads the outcome line by line and leaves to the map',()=>{
    const leave=vi.fn();
    render(<BallparkEvent result={{title:'버려진 더그아웃',outcome:'강타를 덱에 넣었다. 번트를 잃었다.'}} onLeave={leave}/>);
    expect(document.querySelectorAll('.ev-outcome p')).toHaveLength(2);
    fireEvent.click(screen.getByTestId('event-leave'));expect(leave).toHaveBeenCalled();
  });
});

describe('map faces',()=>{
  it('every rostered pitcher has a figure, so no fight renders as a place glyph',()=>{
    for(const p of roster){expect(pitcherFigures[p.id],p.id).toBeTruthy();expect(pitcherPortraits[p.id],p.id).toBeTruthy();}
  });
});
