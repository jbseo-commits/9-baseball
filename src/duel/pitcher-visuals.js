import tideVesperPortrait from '../../assets/pitcher-study-v2/source/tide-vesper-release.png';
/* set-pose cutouts (frame 0 of each atlas, trimmed): the new pitchers have no roster portrait yet, so the map
   silhouette and framed views use their own approved battle frame instead of a place glyph */
import skyPhantomFigure from '../../assets/pitcher-study-v3/sky-phantom-figure.png';
import galeTwisterFigure from '../../assets/pitcher-study-v4/gale-twister-figure.png';
import vulcanBlazeFigure from '../../assets/pitcher-study-v5/vulcan-blaze-figure.png';
/* 2026-10-14 roster: catcher-cam studies. Onyx/Emerald use the retimed, ball-free runtime atlas
   (scripts/build-runtime-pitchers-1014.py); figures are trimmed frame-0 cutouts, portraits the master art. */
import jadeViperFigure from '../../assets/pitcher-study-jade-viper/runtime/jade-viper-figure.png';
import copperSiroccoFigure from '../../assets/pitcher-study-copper-sirocco/runtime/copper-sirocco-figure.png';
import onyxEclipseFigure from '../../assets/pitcher-study-onyx-eclipse/runtime/onyx-eclipse-figure.png';
import emeraldTempestFigure from '../../assets/pitcher-study-emerald-tempest/runtime/emerald-tempest-figure.png';
import jadeViperPortrait from '../../assets/pitcher-study-jade-viper/runtime/jade-viper-portrait.webp';
import copperSiroccoPortrait from '../../assets/pitcher-study-copper-sirocco/runtime/copper-sirocco-portrait.webp';
import onyxEclipsePortrait from '../../assets/pitcher-study-onyx-eclipse/runtime/onyx-eclipse-portrait.webp';
import emeraldTempestPortrait from '../../assets/pitcher-study-emerald-tempest/runtime/emerald-tempest-portrait.webp';

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

/* The compact, alpha runtime derivatives are the only pitcher atlases in the game import graph. */
const rigAtlases=import.meta.glob('../../assets/pitcher-rig-v1/atlases/*.avif',{eager:true,query:'?url',import:'default'});
const rosterPortraits=import.meta.glob('../../assets/pitcher-mobs-v1/*.png',{eager:true,query:'?url',import:'default'});
const idFrom=(path,suffix)=>path.split('/').pop().replace(suffix,'');
const byId=atlases=>Object.fromEntries(Object.entries(atlases).map(([path,url])=>[idFrom(path,'.avif'),url]));

export const pitcherAtlases=byId(rigAtlases);

/* transparent roster cutouts: for silhouettes and anything drawn over a scene (map nodes use brightness(0)) */
export const pitcherFigures={
  ...Object.fromEntries(Object.entries(rosterPortraits).map(([path,url])=>[idFrom(path,'.png'),url])),
  'tide-vesper':tideVesperPortrait,
  'sky-phantom':skyPhantomFigure,
  'gale-twister':galeTwisterFigure,
  'vulcan-blaze':vulcanBlazeFigure,
  'jade-viper':jadeViperFigure,
  'copper-sirocco':copperSiroccoFigure,
  'onyx-eclipse':onyxEclipseFigure,
  'emerald-tempest':emeraldTempestFigure,
};

/* opaque dex portraits: framed views only (map preview, reward, ending, portrait dialog) */
export const pitcherPortraits={
  ...pitcherFigures,
  'tide-vesper':tideVesperPortrait,
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
  'jade-viper':jadeViperPortrait,
  'copper-sirocco':copperSiroccoPortrait,
  'onyx-eclipse':onyxEclipsePortrait,
  'emerald-tempest':emeraldTempestPortrait,
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
