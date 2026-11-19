import {it,expect} from 'vitest';
import * as E from '../src/duel/engine.js';
import {buildBattleViewModel} from '../src/duel/battle-vnext/view-model.js';
it('does not disclose an outside pitch until a legal scout earns the public singleton [9]',()=>{
 const s=E.enterV10Node(E.createV10Duel(20261119),'a1-entry');
 // Deterministic engine fixture only: runtime badge never receives this field.
 s.battle.pending={...s.battle.pending,zone:9};
 expect(buildBattleViewModel({s}).zones.band.confirmedOutside).toBe(false);
 const id=s.battle.hand.find(id=>s.deck.find(c=>c.id===id)?.kind==='scout');
 expect(E.cardProblem(s,id)).toBeNull();
 const next=E.playV10Action(s,{type:'card',id});expect(E.knownPitchZones(next)).toEqual([9]);
 expect(buildBattleViewModel({s:next}).zones.band.confirmedOutside).toBe(true);
 expect(buildBattleViewModel({s:next,fxStage:'flight',locked:true}).zones.band.confirmedOutside).toBe(false);
});
