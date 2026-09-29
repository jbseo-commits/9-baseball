import redRushAtlas from '../../assets/pitcher-sd-v1/red-rush-pitch-120-atlas.png';
import redRushPortrait from '../../assets/pitcher-mobs-v1/regular-01-red-rush.png';

// V15 & V16 Masterpiece Dex portraits (verified via DEX_QA_V16.md)
import dexRedRush from '../../assets/production-art/mockup-world-v15/dex-red-rush.png';
import dexTealMirage from '../../assets/production-art/mockup-world-v15/dex-teal-mirage.png';
import dexAmberSinker from '../../assets/production-art/mockup-world-v15/dex-amber-sinker.png';
import dexIvoryAce from '../../assets/production-art/mockup-world-v15/dex-ivory-ace-v2.png';
import dexVioletSting from '../../assets/production-art/mockup-world-v15/dex-violet-sting.png';
import dexRosePaint from '../../assets/production-art/mockup-world-v15/dex-rose-paint-v2.png';
import dexCobaltImpact from '../../assets/production-art/mockup-world-v15/dex-cobalt-impact-v2.png';
import dexNeonTrick from '../../assets/production-art/mockup-world-v15/dex-neon-trick-v2.png';
import dexWineBluff from '../../assets/production-art/mockup-world-v15/dex-wine-bluff-v2.png';
import dexEmeraldTyrant from '../../assets/production-art/mockup-world-v15/dex-emerald-tyrant-v2.png';
import dexPlatinumHalo from '../../assets/production-art/mockup-world-v15/dex-platinum-halo-v2.png';
import dexBlackEclipse from '../../assets/production-art/mockup-world-v15/dex-black-eclipse-v2.png';

// V16 Battle Polish keyposes & animatics
import redRushAnimaticWebp from '../../assets/production-art/battle-polish-v16/red-rush-keypose-animatic.webp';
import redRushCoilBreak from '../../assets/production-art/battle-polish-v16/red-rush-coil-break.png';
import redRushLateCocking from '../../assets/production-art/battle-polish-v16/red-rush-late-cocking.png';
import redRushArmWhip from '../../assets/production-art/battle-polish-v16/red-rush-arm-whip.png';
import redRushReleaseNoBall from '../../assets/production-art/battle-polish-v16/red-rush-release-no-ball.png';
import redRushFollowThrough from '../../assets/production-art/battle-polish-v16/red-rush-follow-through.png';
import impactSlashVfx from '../../assets/production-art/battle-polish-v16/impact-slash.png';

/* PixelLab pitch animations drawn from the pitcher-mobs-v1 designs (assets/pitcher-pixellab-v1): same 120-frame
   atlas contract, so each one replaces that pitcher's SD atlas as it lands. The replaced SD atlas is excluded
   below as well, or the eager glob would still ship it (~1.1MB each) unused. */
const pixellabAtlases=import.meta.glob('../../assets/pitcher-pixellab-v1/atlases/*-pitch-120-atlas.png',{eager:true,query:'?url',import:'default'});
const rosterAtlases=import.meta.glob([
  '../../assets/pitcher-sd-v2/atlases/*-pitch-120-atlas.png',
  '!../../assets/pitcher-sd-v2/atlases/regular-02-teal-mirage-pitch-120-atlas.png',
  '!../../assets/pitcher-sd-v2/atlases/regular-03-amber-sinker-pitch-120-atlas.png',
],{eager:true,query:'?url',import:'default'});
const rosterPortraits=import.meta.glob('../../assets/pitcher-mobs-v1/*.png',{eager:true,query:'?url',import:'default'});
const idFrom=(path,suffix)=>path.split('/').pop().replace(suffix,'');
const byId=atlases=>Object.fromEntries(Object.entries(atlases).map(([path,url])=>[idFrom(path,'-pitch-120-atlas.png'),url]));

export const pitcherAtlases={
  'regular-01-red-rush':redRushAtlas,
  ...byId(rosterAtlases),
  ...byId(pixellabAtlases),
};

/* transparent roster cutouts: for silhouettes and anything drawn over a scene (map nodes use brightness(0)) */
export const pitcherFigures=Object.fromEntries(Object.entries(rosterPortraits).map(([path,url])=>[idFrom(path,'.png'),url]));

/* opaque dex portraits: framed views only (map preview, reward, ending, portrait dialog) */
export const pitcherPortraits={
  ...pitcherFigures,
  'regular-01-red-rush':dexRedRush,
  'regular-02-teal-mirage':dexTealMirage,
  'regular-03-amber-sinker':dexAmberSinker,
  'regular-04-ivory-ace':dexIvoryAce,
  'regular-05-violet-sting':dexVioletSting,
  'regular-06-rose-paint':dexRosePaint,
  'elite-01-cobalt-impact':dexCobaltImpact,
  'elite-02-neon-trick':dexNeonTrick,
  'elite-03-wine-bluff':dexWineBluff,
  'boss-01-emerald-tyrant':dexEmeraldTyrant,
  'boss-02-platinum-halo':dexPlatinumHalo,
  'boss-03-black-eclipse':dexBlackEclipse,
};

export const RED_RUSH_V16_ANIMATIC = redRushAnimaticWebp;
export const RED_RUSH_V16_KEYPOSES = {
  coilBreak: redRushCoilBreak,
  lateCocking: redRushLateCocking,
  armWhip: redRushArmWhip,
  release: redRushReleaseNoBall,
  followThrough: redRushFollowThrough,
};
export const IMPACT_SLASH_VFX = impactSlashVfx;

