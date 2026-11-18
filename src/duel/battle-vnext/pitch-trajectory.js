/** Render-only, stateless world-coordinate sampler. No engine, RNG or storage imports. */
export const PITCH_PROFILES=Object.freeze({
  fastball:Object.freeze({label:'직구',bend:0,lift:0,wakeMs:18}),
  slider:Object.freeze({label:'슬라이더',bend:68,lift:0,wakeMs:30}),
  curve:Object.freeze({label:'커브',bend:0,lift:106,wakeMs:38}),
});
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const point=p=>Object.freeze({x:p.x,y:p.y});
export function pitchDescriptor({profile='fastball',release,target,releaseAt=0,impactAt=releaseAt+300,seed=0}){
  if(!PITCH_PROFILES[profile]||![release?.x,release?.y,target?.x,target?.y,releaseAt,impactAt,seed].every(Number.isFinite)||impactAt<=releaseAt)throw new TypeError('Invalid public pitch descriptor');
  return Object.freeze({version:1,profile,release:point(release),target:point(target),releaseAt,impactAt,seed});
}
export function samplePitchFlight(d,elapsed){
  if(!Number.isFinite(elapsed))throw new TypeError('Finite elapsed required');
  const duration=d.impactAt-d.releaseAt,u=clamp((elapsed-d.releaseAt)/duration),p=u*u;
  const {bend,lift}=PITCH_PROFILES[d.profile],dx=d.target.x-d.release.x,dy=d.target.y-d.release.y;
  // Slider peaks at 75% of flight. Curve rises above the chord then drops into T.
  const side=bend*(256/27)*u*u*u*(1-u),arc=-lift*4*u*(1-u);
  const vx=(2*u*dx+bend*(256/27)*(3*u*u-4*u*u*u))/duration;
  const vy=(2*u*dy-lift*4*(1-2*u))/duration;
  return {u,position:{x:d.release.x+dx*p+side,y:d.release.y+dy*p+arc},
    tangent:{x:vx,y:vy},radius:3+9*p,rotation:(d.seed%360)*Math.PI/180+4*Math.PI*u};
}
/** Diagnostic outcomes only. The caller reveals result at impact, never feeds it into flight. */
export function samplePitchScene(d,elapsed,{result='hit',trail=true}={}){
  if(elapsed<d.releaseAt)return null;
  const sampleAt=time=>{
    const end=samplePitchFlight(d,d.impactAt);
    if(time<=d.impactAt)return samplePitchFlight(d,time);
    const age=time-d.impactAt;
    if(result==='take')return {...end,position:{x:end.position.x+end.tangent.x*age,y:end.position.y+end.tangent.y*age},radius:end.radius+18*age/(d.impactAt-d.releaseAt),rotation:end.rotation+4*Math.PI*age/(d.impactAt-d.releaseAt)};
    const t=Math.max(0,age-80),p=clamp(t/560),foul=result==='foul';
    const control=foul?{x:-155,y:-70}:{x:145,y:-290},finish=foul?{x:-260,y:90}:{x:280,y:-230};
    return {u:1,position:{x:end.position.x+2*(1-p)*p*control.x+p*p*finish.x,y:end.position.y+2*(1-p)*p*control.y+p*p*finish.y},
      tangent:t===0?{x:0,y:0}:{x:(2*(1-2*p)*control.x+2*p*finish.x)/560,y:(2*(1-2*p)*control.y+2*p*finish.y)/560},radius:12-10*p,rotation:end.rotation+t*.025};
  };
  const current=sampleAt(elapsed),age=elapsed-d.impactAt;
  const wake=trail?Array.from({length:6},(_,i)=>sampleAt(Math.max(d.releaseAt,elapsed-PITCH_PROFILES[d.profile].wakeMs*(5-i)/5)).position):[];
  return {...current,wake,contact:age>=0&&age<80&&result!=='take',age,
    hidden:age>(result==='take'?240:640),result:age>=0?result:null};
}
