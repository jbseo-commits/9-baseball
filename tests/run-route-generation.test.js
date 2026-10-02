import {describe,it,expect} from 'vitest';
import {createRunMap,validateRunMap,everyNodeReachesBoss} from '../src/duel/run-map.js';

// 슬더스식 길: 새 런마다 칸 수·자리·연결·종류·상대 얼굴이 시드로 바뀐다.
describe('generated run route',()=>{
  const act1=map=>map.nodes.filter(n=>n.act===1);
  it('is deterministic per seed and always a valid forward-only map',()=>{
    expect(createRunMap(321)).toEqual(createRunMap(321));
    for(let seed=0;seed<300;seed++){
      const map=createRunMap(seed);
      expect(validateRunMap(map)).toBe(true);
      for(let act=1;act<=3;act++)expect(everyNodeReachesBoss(map,act)).toBe(true);
      expect(map.nodes.filter(n=>n.type==='elite').length).toBeLessThanOrEqual(6);
    }
  });
  it('changes layout, node kinds and edges between seeds',()=>{
    const layouts=new Set(),edges=new Set();
    for(let seed=1;seed<=60;seed++){
      const map=createRunMap(seed*977);
      layouts.add(act1(map).map(n=>`${n.id}:${n.type}`).join());
      edges.add(map.edges.map(e=>e.from+'>'+e.to).join());
    }
    expect(layouts.size).toBeGreaterThan(50);
    expect(edges.size).toBeGreaterThan(50);
  });
  it('offers a choice at the start and never puts an elite on the first row',()=>{
    for(let seed=0;seed<100;seed++){
      const map=createRunMap(seed);
      for(let act=1;act<=3;act++){
        expect(map.edges.filter(e=>e.from===`a${act}-entry`).length).toBeGreaterThanOrEqual(2);
        expect(map.nodes.filter(n=>n.act===act&&n.row===1).every(n=>n.type!=='elite')).toBe(true);
      }
    }
  });
  it('keeps the first fight a Red Rush intro but shuffles every other face',()=>{
    const second=new Set(),bosses=new Set();
    for(let seed=1;seed<=60;seed++){
      const fights=createRunMap(seed*31).nodes.filter(n=>n.opponent);
      expect(fights[0].opponent.artId).toBe('regular-01-red-rush');
      expect(fights.filter(n=>n.opponent.artId==='regular-01-red-rush')).toHaveLength(1);
      second.add(fights[1].opponent.artId);
      bosses.add(fights.find(n=>n.act===1&&n.type==='boss').opponent.artId);
    }
    expect(second.size).toBeGreaterThan(3);
    expect(bosses.size).toBe(1); // 막 보스는 막마다 한 명
  });
});
