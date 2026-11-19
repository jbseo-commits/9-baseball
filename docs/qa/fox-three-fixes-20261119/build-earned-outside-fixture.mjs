import * as E from '../../../src/duel/engine.js';
import fs from 'node:fs';
// Test-only controlled draw; no shipped runtime file reads or sets hidden targets.
let s=E.enterV10Node(E.createV10Duel(20261119),'a1-entry');
s.battle.pending={...s.battle.pending,zone:9};
const id=s.battle.hand.find(id=>s.deck.find(c=>c.id===id)?.kind==='scout');
s=E.playV10Action(s,{type:'card',id});
if(E.knownPitchZones(s).join()!=='9')throw Error('public clue not earned');
fs.writeFileSync('/tmp/earned-outside.json',JSON.stringify(s));
