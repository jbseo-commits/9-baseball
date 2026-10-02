import {describe,it,expect} from 'vitest';
import {v16DraftChoices} from '../src/duel/engine.js';
import {CARDS} from '../src/duel/cards.js';

const share=(act,tier)=>{let sig=0,all=0;
  for(let seed=1;seed<=600;seed++)for(const k of v16DraftChoices({deck:[],act,tier,seed,count:3})){all++;if(CARDS[k].rarity==='signature')sig++;}
  return sig/all;};

describe('signature cards are scarce',()=>{
  it('thunder swing is a signature card',()=>expect(CARDS.thunder.rarity).toBe('signature'));
  it('never appear in act 1',()=>expect(share(1,1)).toBe(0));
  it('stay well under 10% of offers in act 2/3',()=>{expect(share(2,1)).toBeLessThan(.06);expect(share(3,1)).toBeLessThan(.1);});
});
