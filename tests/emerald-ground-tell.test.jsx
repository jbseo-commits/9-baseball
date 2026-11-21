// @vitest-environment happy-dom
import React from 'react';import {it,expect,afterEach,vi} from 'vitest';import {render,cleanup} from '@testing-library/react';
import EmeraldGroundTell from '../src/duel/battle-vnext/EmeraldGroundTell.jsx';import {pitchPersonality} from '../src/duel/battle-vnext/pitch-personality.js';
import BattleScene,{SAMPLE_ACTORS} from '../src/duel/battle-vnext/BattleScene.jsx';import {rosterPitcherActor} from '../src/duel/battle-vnext/roster-actor.js';
vi.mock('../src/duel/battle-vnext/use-scene-clock.js',()=>({default:()=>0}));
afterEach(cleanup);
it('same public personality yields identical art regardless of private/aim extras; no target or input surface',()=>{
 const id='boss-01-emerald-tyrant',foot={x:834,y:534.692},cue={id};const v=render(<EmeraldGroundTell profile={pitchPersonality(cue,id)} foot={foot} visible/>),html=v.container.innerHTML;
 for(const zone of [0,4,8,9]){v.rerender(<EmeraldGroundTell profile={pitchPersonality({...cue,pending:{zone},aimZone:zone},id)} foot={foot} visible/>);expect(v.container.innerHTML).toBe(html);}
 expect(v.container.querySelector('button,input,svg,circle')).toBeNull();expect(v.container.querySelector('[tabindex]')).toBeNull();v.rerender(<EmeraldGroundTell profile={pitchPersonality(cue,'sky-phantom')} foot={foot} visible/>);expect(v.container.innerHTML).toBe('');
});
it('shows decision/prep only, retains one node on return, hides commitment/throw/result/KO and leaves HP-only',()=>{
 const pitcher=rosterPitcherActor('boss-01-emerald-tyrant','/original.webp'),props={size:{width:667,height:375},framing:'atbat',onPitcherInfo:()=>{},pitcherHud:{name:'Emerald',hp:112,maxHp:112},publicEncounterCue:{id:pitcher.artId},actors:{pitcher,batter:SAMPLE_ACTORS.batter}};const v=render(<BattleScene {...props}/>),tell=v.getByTestId('emerald-ground-tell');expect(tell.style.visibility).toBe('visible');expect(v.getByTestId('pitcher-health')).toBeTruthy();expect(v.container.querySelector('.bv-intent-badge')).toBeNull();
 for(const phase of ['committing','flight','result']){v.rerender(<BattleScene {...props} phase={phase}/>);expect(tell.style.visibility).toBe('hidden');for(const duration of [60,500]){v.rerender(<BattleScene {...props} phase={phase} playback={{action:'prepare',timeline:{duration,impactAt:1250,releaseAt:1370,freeze:120,settleAt:2100,delivery:{pitchReleaseAt:950}}}}/>);expect(tell.style.visibility).toBe('visible');v.rerender(<BattleScene {...props} phase={phase} playback={{action:'swing',timeline:{duration,impactAt:1250,releaseAt:1370,freeze:120,settleAt:2100,delivery:{pitchReleaseAt:950}}}}/>);expect(tell.style.visibility).toBe('hidden');}}
 v.rerender(<BattleScene {...props}/>);expect(v.getByTestId('emerald-ground-tell')).toBe(tell);expect(tell.style.visibility).toBe('visible');v.rerender(<BattleScene {...props} result={{knockedOut:true}}/>);expect(tell.style.visibility).toBe('hidden');
});
