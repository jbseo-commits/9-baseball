import assert from 'node:assert/strict';
import {shotAt} from './shot.js';
for(const t of [0,500,850,1100,1260,1600,2200]){const s=shotAt(t);assert.deepEqual(s.origin.map((v,i)=>v+s.anchor[i]),s.destination);assert.equal(s.done,t>=2200)}
assert.equal(shotAt(1099).ball,null);assert.deepEqual(shotAt(1100).ball,{x:189,y:91,r:1.5});assert.equal(shotAt(1580).ball,null);assert.equal(shotAt(2200).pose,'recover');assert.equal(shotAt(2200).preparing,false);
console.log('PASS anchors, release ownership, arrival removal, recovery');
