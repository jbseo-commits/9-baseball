import {describe,it,expect} from 'vitest';
import {DEFENSE_DEPTH_MIN,DEFENSE_DEPTH_MAX,DEFENSE_DEPTH_START,DEFENSE_SPACE_BONUS,DEFENSE_SPACE_PENALTY,
  defenseStance,defenseDepthName,defenseTransition,defenseSpace,defenseSacrificeValid,defenseCauseText} from '../src/duel/defense-stance.js';

describe('defense stance map (explicit, never role-guessed)',()=>{
  it('maps the 12 whitelist kinds',()=>{
    expect(defenseStance('place')).toBe('contact');
    expect(defenseStance('strike')).toBe('contact'); // role is 범위, stance is 정타
    expect(defenseStance('tableSetter')).toBe('advance');
    expect(defenseStance('rally')).toBe('advance');
    expect(defenseStance('slug')).toBe('power');
    expect(defenseStance('finisher')).toBe('power'); // name suggests relay, stance is power
    expect(defenseStance('bunt')).toBe('sacrifice');
    expect(defenseStance('squeeze')).toBe('sacrifice');
    expect(defenseStance('setup')).toBe('prep');
    expect(defenseStance('watch')).toBe('prep');
    expect(defenseStance('scout')).toBe('prep');
    expect(defenseStance('flow')).toBe('prep');
  });
  it('leaves BASIC and unlisted cards without stance',()=>{
    expect(defenseStance('basic')).toBe('none');
    expect(defenseStance('moonshot')).toBe('none');
    expect(defenseStance(undefined)).toBe('none');
  });
  it('names depths 0/1/2',()=>{
    expect([DEFENSE_DEPTH_MIN,DEFENSE_DEPTH_START,DEFENSE_DEPTH_MAX]).toEqual([0,1,2]);
    expect(defenseDepthName(0)).toBe('전진');
    expect(defenseDepthName(1)).toBe('기본');
    expect(defenseDepthName(2)).toBe('후퇴');
  });
});

describe('defenseTransition (§7)',()=>{
  const t=(o)=>defenseTransition({depth:1,stance:'power',hit:true,direct:true,zone:4,sacrificeValid:false,...o});
  it('contact follows the actual pitch height, not the aim anchor',()=>{
    expect(t({stance:'contact',zone:1}).nextDepth).toBe(2); // high row
    expect(t({stance:'contact',zone:4}).nextDepth).toBe(1); // mid row holds
    expect(t({stance:'contact',zone:7}).nextDepth).toBe(0); // low row steps down
    expect(t({depth:2,stance:'contact',zone:7})).toEqual({nextDepth:1,cause:'contact-low'});
    expect(t({depth:0,stance:'contact',zone:0})).toEqual({nextDepth:1,cause:'contact-high'});
  });
  it('advance/power move one step and clamp at the ends',()=>{
    expect(t({depth:2,stance:'advance'})).toEqual({nextDepth:1,cause:'advance'});
    expect(t({depth:0,stance:'advance'})).toEqual({nextDepth:0,cause:'hold'});
    expect(t({depth:0,stance:'power'})).toEqual({nextDepth:1,cause:'power'});
    expect(t({depth:2,stance:'power'})).toEqual({nextDepth:2,cause:'hold'});
  });
  it('valid sacrifice jumps straight to 0',()=>{
    expect(t({stance:'sacrifice',sacrificeValid:true})).toEqual({nextDepth:0,cause:'sacrifice'});
  });
  it('never moves on assist-only, misses, prep or the boundary floor',()=>{
    expect(t({direct:false})).toEqual({nextDepth:1,cause:'hold'});
    expect(t({hit:false})).toEqual({nextDepth:1,cause:'hold'});
    expect(t({stance:'prep'})).toEqual({nextDepth:1,cause:'hold'});
    expect(t({stance:'none'})).toEqual({nextDepth:1,cause:'hold'});
    expect(t({stance:'sacrifice',sacrificeValid:false})).toEqual({nextDepth:1,cause:'hold'});
  });
  it('never produces an illegal depth',()=>{
    for(let d=-1;d<=3;d++)for(const stance of ['contact','advance','power','sacrifice','prep','none'])
      for(const zone of [0,4,8,9]){
        const {nextDepth}=t({depth:d,stance,zone,sacrificeValid:stance==='sacrifice'});
        expect(nextDepth).toBeGreaterThanOrEqual(0);
        expect(nextDepth).toBeLessThanOrEqual(2);
      }
  });
});

describe('defenseSpace (§8 candidate values)',()=>{
  const s=(o)=>defenseSpace({depth:1,stance:'power',hit:true,direct:true,homer:false,...o});
  it('applies the table: 0/power +8, 0/advance −4, 2/advance +1 runner, 2/power −4, 1 nothing',()=>{
    expect(s({depth:0,stance:'power'})).toEqual({delta:DEFENSE_SPACE_BONUS,extraAdvance:0});
    expect(s({depth:0,stance:'advance'})).toEqual({delta:DEFENSE_SPACE_PENALTY,extraAdvance:0});
    expect(s({depth:2,stance:'advance'})).toEqual({delta:0,extraAdvance:1});
    expect(s({depth:2,stance:'power'})).toEqual({delta:DEFENSE_SPACE_PENALTY,extraAdvance:0});
    expect(s({depth:1,stance:'advance'})).toEqual({delta:0,extraAdvance:0});
    expect(s({depth:1,stance:'power'})).toEqual({delta:0,extraAdvance:0});
    expect(s({depth:1,stance:'contact'})).toEqual({delta:0,extraAdvance:0});
  });
  it('homers are immune, non-hits and indirect hits do nothing',()=>{
    expect(s({homer:true})).toEqual({delta:0,extraAdvance:0});
    expect(s({hit:false})).toEqual({delta:0,extraAdvance:0});
    expect(s({direct:false})).toEqual({delta:0,extraAdvance:0});
    expect(s({stance:'prep'})).toEqual({delta:0,extraAdvance:0});
    expect(s({stance:'sacrifice'})).toEqual({delta:0,extraAdvance:0});
  });
  it('candidate values are +8/−4',()=>{
    expect(DEFENSE_SPACE_BONUS).toBe(8);
    expect(DEFENSE_SPACE_PENALTY).toBe(-4);
  });
});

describe('defenseSacrificeValid (§7 conditions 1-4)',()=>{
  const v=(o)=>defenseSacrificeValid({isSacrifice:true,hadRunner:true,advanced:true,outsAfter:1,isBuntFamily:true,...o});
  it('needs all four conditions',()=>{
    expect(v({})).toBe(true);
    expect(v({isSacrifice:false})).toBe(false); // bunt foul / strikeout
    expect(v({hadRunner:false})).toBe(false); // empty-base bunt
    expect(v({advanced:false})).toBe(false);
    expect(v({outsAfter:3})).toBe(false); // third out
    expect(v({isBuntFamily:false})).toBe(false);
  });
});

describe('defenseCauseText',()=>{
  it('explains the reason without inventing rules',()=>{
    expect(defenseCauseText('power')).toContain('후퇴');
    expect(defenseCauseText('sacrifice')).toContain('전진');
    expect(defenseCauseText('hold')).toContain('유지');
    expect(defenseCauseText('contact-high')).toContain('후퇴');
    expect(defenseCauseText('contact-low')).toContain('전진');
  });
});
