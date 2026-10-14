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
  it('shuffles every face of a main run, Red Rush only opens the tutorial',()=>{
    const first=new Set(),second=new Set(),bosses={1:new Set(),2:new Set(),3:new Set()};
    for(let seed=1;seed<=60;seed++){
      const fights=createRunMap(seed*31).nodes.filter(n=>n.opponent);
      expect(fights.filter(n=>n.opponent.artId==='regular-01-red-rush')).toHaveLength(0);
      first.add(fights[0].opponent.artId);
      second.add(fights[1].opponent.artId);
      for(const act of [1,2,3])bosses[act].add(fights.find(n=>n.act===act&&n.type==='boss').opponent.artId);
      const lesson=createRunMap(seed*31,{tutorial:true}).nodes.filter(n=>n.opponent);
      expect(lesson[0].opponent.artId).toBe('regular-01-red-rush');
      expect(lesson.filter(n=>n.opponent.artId==='regular-01-red-rush')).toHaveLength(1);
    }
    expect(first.size).toBeGreaterThan(3);
    expect(second.size).toBeGreaterThan(3);
    // 막 보스: 1막은 한 명, 2·3막은 기존 보스와 새 보스 중 무작위
    expect([...bosses[1]]).toEqual(['boss-01-emerald-tyrant']);
    expect(bosses[2]).toEqual(new Set(['boss-02-platinum-halo','emerald-tempest']));
    expect(bosses[3]).toEqual(new Set(['boss-03-black-eclipse','onyx-eclipse']));
  });
});
