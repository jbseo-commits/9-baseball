import redRushAtlas from '../../assets/pitcher-mobs-v1/atlases/regular-01-red-rush-pitch-120-atlas.png';
import redRushPortrait from '../../assets/pitcher-mobs-v1/portraits/regular-01-red-rush-portrait.png';
import tealMirageAtlas from '../../assets/pitcher-mobs-v1/atlases/regular-02-teal-mirage-pitch-120-atlas.png';
import tealMiragePortrait from '../../assets/pitcher-mobs-v1/portraits/regular-02-teal-mirage-portrait.png';
import amberSinkerAtlas from '../../assets/pitcher-mobs-v1/atlases/regular-03-amber-sinker-pitch-120-atlas.png';
import amberSinkerPortrait from '../../assets/pitcher-mobs-v1/portraits/regular-03-amber-sinker-portrait.png';
import ivoryAceAtlas from '../../assets/pitcher-mobs-v1/atlases/regular-04-ivory-ace-pitch-120-atlas.png';
import ivoryAcePortrait from '../../assets/pitcher-mobs-v1/portraits/regular-04-ivory-ace-portrait.png';
import cobaltImpactAtlas from '../../assets/pitcher-mobs-v1/atlases/elite-01-cobalt-impact-pitch-120-atlas.png';
import cobaltImpactPortrait from '../../assets/pitcher-mobs-v1/portraits/elite-01-cobalt-impact-portrait.png';
import emeraldTyrantAtlas from '../../assets/pitcher-mobs-v1/atlases/boss-01-emerald-tyrant-pitch-120-atlas.png';
import emeraldTyrantPortrait from '../../assets/pitcher-mobs-v1/portraits/boss-01-emerald-tyrant-portrait.png';
import skyPhantomAtlas from '../../assets/pitcher-study-v3/atlases/sky-phantom-pitch-120-atlas.png';
import galeTwisterAtlas from '../../assets/pitcher-study-v4/atlases/gale-twister-pitch-120-atlas.png';
import vulcanBlazeAtlas from '../../assets/pitcher-study-v5/atlases/vulcan-blaze-pitch-120-atlas.png';

export const PITCHER_VISUALS = {
  'regular-01-red-rush': { atlas: redRushAtlas, portrait: redRushPortrait, frames: 120, cols: 10, rows: 12, fps: 60 },
  'regular-02-teal-mirage': { atlas: tealMirageAtlas, portrait: tealMiragePortrait, frames: 120, cols: 10, rows: 12, fps: 60 },
  'regular-03-amber-sinker': { atlas: amberSinkerAtlas, portrait: amberSinkerPortrait, frames: 120, cols: 10, rows: 12, fps: 60 },
  'regular-04-ivory-ace': { atlas: ivoryAceAtlas, portrait: ivoryAcePortrait, frames: 120, cols: 10, rows: 12, fps: 60 },
  'elite-01-cobalt-impact': { atlas: cobaltImpactAtlas, portrait: cobaltImpactPortrait, frames: 120, cols: 10, rows: 12, fps: 60 },
  'boss-01-emerald-tyrant': { atlas: emeraldTyrantAtlas, portrait: emeraldTyrantPortrait, frames: 120, cols: 10, rows: 12, fps: 60 },
  'sky-phantom': { atlas: skyPhantomAtlas, portrait: null, frames: 120, cols: 10, rows: 12, fps: 60 },
  'gale-twister': { atlas: galeTwisterAtlas, portrait: null, frames: 120, cols: 10, rows: 12, fps: 60 },
  'vulcan-blaze': { atlas: vulcanBlazeAtlas, portrait: null, frames: 120, cols: 10, rows: 12, fps: 60 },
};

export function getPitcherVisual(artId) {
  return PITCHER_VISUALS[artId] || PITCHER_VISUALS['regular-01-red-rush'];
}
