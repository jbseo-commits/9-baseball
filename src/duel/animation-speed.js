export const ANIMATION_RATES=Object.freeze([.25,.5,.75,1,1.5,2]);
export const ANIMATION_RATE_KEY='9zone-animation-rate';
export function animationRate(value){const n=Number(value);return ANIMATION_RATES.includes(n)?n:1;}
export function readAnimationRate(){
  try{const p=new URLSearchParams(window.location.search);if(p.has('battleSpeed'))return animationRate(p.get('battleSpeed'));return animationRate(window.sessionStorage.getItem(ANIMATION_RATE_KEY));}catch{return 1;}
}
export function rememberAnimationRate(value){
  const rate=animationRate(value);
  try{window.sessionStorage.setItem(ANIMATION_RATE_KEY,String(rate));}catch{}
  try{const url=new URL(window.location.href);url.searchParams.set('battleSpeed',String(rate));window.history.replaceState(window.history.state,'',url.pathname+url.search+url.hash);}catch{}
  return rate;
}
export function presentationElapsed(playback,now){return playback?Math.max(0,Math.min(playback.timeline.duration,(now-playback.startedAt)*animationRate(playback.rate))):0;}
