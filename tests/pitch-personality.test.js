import {it,expect} from 'vitest';
import {pitchPersonality as selectPersonality,personalityFlightAt} from '../src/duel/battle-vnext/pitch-personality.js';
import {foxFlightAt} from '../src/duel/battle-vnext/fox-flight.js';
import {sceneEffectAt} from '../src/duel/battle-vnext/scene-effects.js';
import {committedContact} from '../src/duel/battle-vnext/committed-flight.js';
const pitchPersonality=(cue,artId=cue?.id)=>selectPersonality(cue,artId);
const ids=['tide-vesper','gale-twister','elite-01-cobalt-impact'],R={x:860,y:260},C={x:818.75,y:450.104},release=917,impact=1217;
it('only matching public encounter identities select profiles; regular/missing fallback is identical',()=>{
 for(const id of ids){expect(selectPersonality({id})).toBeNull();expect(selectPersonality({id},undefined)).toBeNull();expect(selectPersonality({id},null)).toBeNull();expect(pitchPersonality({id},'wrong')).toBeNull();expect(pitchPersonality({id},id)).not.toBeNull();}
 expect(pitchPersonality(null)).toBeNull();expect(pitchPersonality({id:'regular-01-red-rush'})).toBeNull();
 for(const t of [0,917,1000,1217,1300])expect(personalityFlightAt(t,release,impact,R,C,null)).toEqual(foxFlightAt(t,release,impact,R,C));
});
for(const id of ids)it(`${id}: one ball, all10endpoints, same action, continuous pass and radius, no miss flash`,()=>{
 const profile=pitchPersonality({id,steps:{current:0},flightPreference:'low'}),composition={contact:C,release:R,personality:profile},timeline={duration:2000,impactAt:impact};
 for(let z=0;z<10;z++){
  const T=committedContact(z,C),at=t=>personalityFlightAt(t,release,impact,R,T,profile),e=.001;
  expect(at(release).ball).toEqual(R);expect(at(impact).ball).toEqual(T);expect(at(impact).radius).toBe(12);
  for(const key of ['x','y']){const left=(at(impact).ball[key]-at(impact-e).ball[key])/e,right=(at(impact+e).ball[key]-at(impact).ball[key])/e;expect(Math.abs(left-right)).toBeLessThan(.001);}
  expect(Math.abs((at(impact).radius-at(impact-e).radius)/e-(at(impact+e).radius-at(impact).radius)/e)).toBeLessThan(.001);
  for(const elapsed of [release,release+17,release+50,impact-1,impact+30]){
   const effects=['take','swing'].map(action=>sceneEffectAt({elapsed,phase:'flight',playback:{timeline,pitchReleaseAt:release,action,course:{getDestination:()=>z,getContact:()=>false}},composition}));expect(effects[0].ball).toEqual(effects[1].ball);expect(effects[0].radius).toBe(effects[1].radius);
  }
  for(const kind of ['called','whiff']){const fx=sceneEffectAt({elapsed:impact+30,phase:'result',result:{kind,actualZone:z},playback:{timeline,pitchReleaseAt:release,action:kind==='called'?'take':'swing',course:{getDestination:()=>z,getContact:()=>false}},composition});expect(fx.ball).toEqual(at(impact+30).ball);expect(fx.flash).toBe(0);expect(Number.isFinite(fx.radius)).toBe(true);}
  expect(at(impact+1000).hidden).toBe(true);expect(Number.isFinite(at(impact+1000).radius)).toBe(true);
 }
});
it('three shapes differ from straight at mobile scale, and high/low is public preference only',()=>{
 const straight=foxFlightAt(1117,release,impact,R,C),float=personalityFlightAt(1117,release,impact,R,C,pitchPersonality({id:ids[0],flightPreference:'low'})),sweep=personalityFlightAt(1117,release,impact,R,C,pitchPersonality({id:ids[1],steps:{current:0}})),rush=personalityFlightAt(1117,release,impact,R,C,pitchPersonality({id:ids[2]}));
 expect(float.ball.y).toBeLessThan(straight.ball.y-40);expect(sweep.ball.x).toBeGreaterThan(straight.ball.x+50);expect(rush.radius).toBeLessThan(straight.radius);expect(pitchPersonality({id:ids[0],flightPreference:'high'}).amplitude).toBe(260);
});
