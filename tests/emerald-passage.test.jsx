// @vitest-environment happy-dom
import React from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,cleanup} from '@testing-library/react';
import EmeraldPassage,{emeraldEcho,EMERALD,isEmeraldPassage} from '../src/duel/EmeraldPassage.jsx';
import * as E from '../src/duel/engine.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
afterEach(cleanup);
it('only the real narrow-low encounter bonus lights the closed lantern',()=>{
 for(const kind of ['whiff','foul','take','sacrifice'])expect(emeraldEcho(EMERALD,{kind,encounterBonus:8})).toBe(false);
 expect(emeraldEcho(EMERALD,{kind:'hit',encounterBonus:0})).toBe(false);
 expect(emeraldEcho('emerald-tempest',{kind:'hit',encounterBonus:8})).toBe(false);
 expect(emeraldEcho(EMERALD,null)).toBe(false);
 const r=render(<EmeraldPassage field echo={emeraldEcho(EMERALD,{kind:'hit',encounterBonus:8})}/>);
 expect(r.getByTestId('emerald-passage').dataset.open).toBe('false');
 expect(r.getByTestId('emerald-passage').dataset.echo).toBe('true');
 r.rerender(<EmeraldPassage open/>);expect(r.getByTestId('emerald-passage').dataset.open).toBe('true');expect(r.getByTestId('emerald-passage').dataset.echo).toBe('false');
});
it('encounter bonus is result-only; presentation leaves the engine state untouched',()=>{
 let s=E.applyHitterClass(E.createV10Duel(23),'slugger-v1');const n=s.runMap.nodes.find(n=>n.opponent?.artId===EMERALD);s.runMap.reachableIds=[n.id];s=E.enterV10Node(s,n.id);
 const before=JSON.stringify(s);expect(buildBattleViewModel({s}).result).toBeNull();expect(JSON.stringify(s)).toBe(before);
 const next=E.playV10Action(E.setAimZone(s,6),{type:'card',id:'basic'});expect(next.v10.lastCombat.encounter.bonus).toBe(8);
 expect(buildBattleViewModel({s:next,fxStage:'windup'}).result).toBeNull();
 const r=buildBattleViewModel({s:next}).result;expect(r.encounterBonus).toBe(8);expect(emeraldEcho(EMERALD,r)).toBe(true);
});

it('passage belongs only to public Act I Emerald identity',()=>{expect(isEmeraldPassage(EMERALD,1)).toBe(true);for(const act of [undefined,0,2,3])expect(isEmeraldPassage(EMERALD,act)).toBe(false);expect(isEmeraldPassage('emerald-tempest',1)).toBe(false);});
