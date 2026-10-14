import {describe,expect,it} from 'vitest';
import fs from 'node:fs';
import {createRunMap} from '../src/duel/run-map.js';
import {GIMMICKS,gimmickFor} from '../src/duel/gimmick.js';
import {pitcherAtlases,pitcherFigures,pitcherPortraits} from '../src/duel/pitcher-visuals.js';
import {pitcherLine} from '../src/duel/pitcher-voice.js';

/* 2026-10-14: four catcher-cam pitchers join as elites/bosses on existing gimmicks; Red Rush is tutorial-only. */
const roster=JSON.parse(fs.readFileSync(new URL('../assets/pitcher-mobs-v1/roster.json',import.meta.url),'utf8'));
const JOINED={
  'jade-viper':{tier:'elite',gimmick:'trick'},
  'copper-sirocco':{tier:'elite',gimmick:'bluff'},
  'emerald-tempest':{tier:'boss',act:2,gimmick:'halo'},
  'onyx-eclipse':{tier:'boss',act:3,gimmick:'eclipse'},
};
const header=file=>{
  const data=Buffer.alloc(26),fd=fs.openSync(file,'r');
  try{fs.readSync(fd,data,0,26,0);}finally{fs.closeSync(fd);}
  return [data.readUInt32BE(16),data.readUInt32BE(20),data[25]];
};

describe('2026-10-14 roster',()=>{
  it('registers each new pitcher with a tier, an existing gimmick, art and a voice',()=>{
    const existing=new Set(['pressure','trick','bluff','tyrant','halo','eclipse']);
    for(const [id,want] of Object.entries(JOINED)){
      const entry=roster.find(p=>p.id===id);
      expect(entry?.tier,id).toBe(want.tier);
      expect(entry.age,id).toBeGreaterThanOrEqual(25);
      if(want.act)expect(entry.act,id).toBe(want.act);
      expect(gimmickFor(id)?.id,id).toBe(want.gimmick);
      expect(existing.has(GIMMICKS[id].id),id).toBe(true);
      for(const table of [pitcherAtlases,pitcherFigures,pitcherPortraits])expect(table[id],id).toBeTruthy();
      expect(pitcherLine(id,'entry'),id).not.toBe('');
      expect(pitcherLine(id,'knockout'),id).not.toBe('');
    }
  });

  it('ships 2560x3072 RGBA atlases; the outside-generated two run on a retimed copy',()=>{
    for(const file of ['pitcher-study-jade-viper/atlases/jade-viper-pitch-120-atlas.png',
      'pitcher-study-copper-sirocco/v2/atlases/copper-sirocco-pitch-120-atlas.png',
      'pitcher-study-onyx-eclipse/runtime/onyx-eclipse-pitch-120-atlas.png',
      'pitcher-study-emerald-tempest/runtime/emerald-tempest-pitch-120-atlas.png'])
      expect(header(new URL('../assets/'+file,import.meta.url)),file).toEqual([2560,3072,6]);
    const script=fs.readFileSync('scripts/build-runtime-pitchers-1014.py','utf8');
    expect(script).toContain('source_release=96');
    expect(script).toContain('source_release=87');
  });

  it('meets the new elites and bosses in main runs, never Red Rush',()=>{
    const seen=new Set();
    for(let seed=1;seed<=80;seed++)for(const node of createRunMap(seed).nodes){
      if(!node.opponent)continue;
      expect(node.opponent.artId).not.toBe('regular-01-red-rush');
      if(JOINED[node.opponent.artId]){
        seen.add(node.opponent.artId);
        expect(node.type).toBe(JOINED[node.opponent.artId].tier);
        expect(node.opponent.gimmick?.id).toBe(JOINED[node.opponent.artId].gimmick);
      }
    }
    expect(seen).toEqual(new Set(Object.keys(JOINED)));
  });
});
