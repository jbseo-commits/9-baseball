import {describe,expect,it} from 'vitest';
import {CINEMATIC_PHASES,cinematicEmphasis,cinematicPhaseAt,cinematicPhaseToken} from '../src/duel/cinematic-director.js';

describe('cinematic vertical-slice director',()=>{
  const shot={duration:1040,releaseAt:150,swingStartAt:185,contactAt:240,freeze:60,settleAt:720};

  it('moves through the authored exchange in order',()=>{
    expect(cinematicPhaseAt({...shot,t:0})).toBe(CINEMATIC_PHASES.HOLD);
    expect(cinematicPhaseAt({...shot,t:80})).toBe(CINEMATIC_PHASES.COIL);
    expect(cinematicPhaseAt({...shot,t:160})).toBe(CINEMATIC_PHASES.RELEASE);
    expect(cinematicPhaseAt({...shot,t:210})).toBe(CINEMATIC_PHASES.ANTICIPATION);
    expect(cinematicPhaseAt({...shot,t:240})).toBe(CINEMATIC_PHASES.CONTACT);
    expect(cinematicPhaseAt({...shot,t:340})).toBe(CINEMATIC_PHASES.EXIT);
    expect(cinematicPhaseAt({...shot,t:720})).toBe(CINEMATIC_PHASES.RECOVERY);
  });

  it('makes contact the single strongest visual apex',()=>{
    const phases=Object.values(CINEMATIC_PHASES);
    const ranked=phases.map(p=>[p,cinematicEmphasis(p).impact]).sort((a,b)=>b[1]-a[1]);
    expect(ranked[0]).toEqual([CINEMATIC_PHASES.CONTACT,1]);
    expect(cinemaUi(CINEMATIC_PHASES.CONTACT)).toBeLessThan(cinemaUi(CINEMATIC_PHASES.HOLD));
  });

  it('never changes the requested duration and safely clamps malformed marks',()=>{
    expect(cinematicPhaseAt({t:999,duration:300,releaseAt:500,contactAt:700,settleAt:900})).toBe(CINEMATIC_PHASES.RECOVERY);
    expect(cinematicPhaseToken('bad-phase')).toBe('cinema-recovery');
  });
});

const cinemaUi=phase=>cinematicEmphasis(phase).ui;
