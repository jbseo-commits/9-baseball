/* Cinematic vertical-slice director.
   Pure timing only: no gameplay decisions live here. BallparkActors/Battle can consume the same
   semantic phase instead of inventing independent CSS/renderer clocks. */

export const CINEMATIC_PHASES=Object.freeze({
  HOLD:'hold',
  COIL:'coil',
  RELEASE:'release',
  ANTICIPATION:'anticipation',
  CONTACT:'contact',
  EXIT:'exit',
  RECOVERY:'recovery',
});

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

/**
 * Maps the existing presentation/motion timeline onto one authored scene clock.
 * All values are presentation milliseconds. This never changes engine state or result timing.
 */
export function cinematicPhaseAt({
  t=0,
  duration=850,
  releaseAt=180,
  swingStartAt=null,
  contactAt=240,
  freeze=0,
  settleAt=570,
}={}){
  const end=Math.max(1,duration);
  const release=clamp(releaseAt,0,end);
  const contact=clamp(contactAt,release,end);
  const swingStart=clamp(swingStartAt??Math.max(release,contact-150),release,contact);
  const contactEnd=clamp(contact+Math.max(70,freeze),contact,end);
  const settle=clamp(Math.max(settleAt,contactEnd),contactEnd,end);
  const holdEnd=Math.min(release,Math.max(0,release*.28));

  if(t<holdEnd)return CINEMATIC_PHASES.HOLD;
  if(t<release)return CINEMATIC_PHASES.COIL;
  if(t<swingStart)return CINEMATIC_PHASES.RELEASE;
  if(t<contact)return CINEMATIC_PHASES.ANTICIPATION;
  if(t<contactEnd)return CINEMATIC_PHASES.CONTACT;
  if(t<settle)return CINEMATIC_PHASES.EXIT;
  return CINEMATIC_PHASES.RECOVERY;
}

export function cinematicEmphasis(phase){
  switch(phase){
    case CINEMATIC_PHASES.HOLD:return {owner:'decision',field:0.72,ui:1,impact:0};
    case CINEMATIC_PHASES.COIL:return {owner:'pitcher',field:1,ui:0.58,impact:0};
    case CINEMATIC_PHASES.RELEASE:return {owner:'ball',field:1,ui:0.42,impact:0};
    case CINEMATIC_PHASES.ANTICIPATION:return {owner:'batter',field:1,ui:0.34,impact:0.15};
    case CINEMATIC_PHASES.CONTACT:return {owner:'contact',field:1,ui:0.22,impact:1};
    case CINEMATIC_PHASES.EXIT:return {owner:'ball',field:1,ui:0.38,impact:0.55};
    default:return {owner:'result',field:0.86,ui:0.82,impact:0};
  }
}

/** Stable class/data token for DOM and QA. */
export const cinematicPhaseToken=phase=>`cinema-${Object.values(CINEMATIC_PHASES).includes(phase)?phase:CINEMATIC_PHASES.RECOVERY}`;
