import cardMap from '../../assets/cards-v15/card-map.json';
import {CARDS} from './cards.js';

const cardFiles = import.meta.glob('../../assets/cards-v15/*.png', { eager: true, query: '?url', import: 'default' });

/* V16 keyword cards have no illustration of their own yet (docs/art/V16-CARD-ART-QUEUE.md):
   each concept borrows one V15 illustration, a different one per concept. */
export const FAMILY_ART = {
  precision: 'reward-precision-blue.png', power: 'deck-pull-gold.png', relay: 'reward-relay-cyan.png',
  grind: 'card-defend.png', eye: 'card-watch.png', clutch: 'card-commit.png', tempo: 'reward-flame-red.png',
  stack: 'card-wall.png', intel: 'card-scout.png', mental: 'deck-combo-blue.png', lane: 'card-laser.png',
};

function artFileFor(kind) {
  if (!kind) return null;
  // order: card-map.json → card-<kind>.png → family-<concept>.png (queue C01–C11) → the concept's borrowed V15 art.
  // Codex only drops a file into assets/cards-v15/; no code or map edit is needed.
  const fam = CARDS[kind]?.family;
  const has = name => !!cardFiles[`../../assets/cards-v15/${name}`];
  const filename = cardMap[kind] || (has(`card-${kind}.png`) && `card-${kind}.png`) || (fam && has(`family-${fam}.png`) && `family-${fam}.png`) || FAMILY_ART[fam];
  return filename && cardFiles[`../../assets/cards-v15/${filename}`] ? filename : null;
}

export function cardArtFor(kind) {
  const filename = artFileFor(kind);
  return filename ? cardFiles[`../../assets/cards-v15/${filename}`] : null;
}

/*
 * #103 M07 — focal points for the wide detail-sheet crop.
 * The illustrations are tall (mostly 1024×1536) but the detail sheet shows a wide strip of them, so a
 * centred cover crop lands on the chest and cuts the head off. Each entry is the vertical centre of the
 * subject (the face, or the play element when there is none) as a fraction of the image height, read
 * off a tick-marked contact sheet of every file. The art itself is untouched.
 * A file without an entry (a new Codex drop) uses DEFAULT_ART_FOCUS_Y: every batter/pitcher portrait
 * in the set has the head between 16% and 32% of the height.
 */
export const DEFAULT_ART_FOCUS_Y = 0.22;
export const ART_FOCUS_Y = {
  'card-bunt.png': 0.22, 'card-calm.png': 0.20, 'card-commit.png': 0.17, 'card-defend.png': 0.22,
  'card-laser.png': 0.31, 'card-lure.png': 0.28, 'card-scout.png': 0.22, 'card-setup.png': 0.32,
  'card-wall.png': 0.20, 'card-watch.png': 0.23, 'deck-combo-blue.png': 0.20, 'deck-ground-hit.png': 0.18,
  'deck-pull-gold.png': 0.20, 'family-clutch.png': 0.22, 'family-eye.png': 0.19, 'family-grind.png': 0.19,
  'family-intel.png': 0.27, 'family-lane.png': 0.36, 'family-mental.png': 0.21, 'family-power.png': 0.27,
  'family-precision.png': 0.26, 'family-relay.png': 0.42, 'family-stack.png': 0.30, 'family-tempo.png': 0.18,
  'reward-flame-red.png': 0.20, 'reward-precision-blue.png': 0.16, 'reward-relay-cyan.png': 0.19,
  // C101–C104 (Codex, 2026-09-28): the face, with the eye-level pair / the swing's hands inside the frame
  'card-pinpoint.png': 0.24, 'card-eyeLevel.png': 0.26, 'card-verticalRead.png': 0.28, 'card-readStrike.png': 0.22,
};
/* per card key, for a card that should frame a shared illustration differently from the file default */
export const CARD_ART_FOCUS_Y = {};
/* width / height; every file not listed is the 1024×1536 house format */
const ART_ASPECT = { 'deck-combo-blue.png': 1156 / 1361, 'deck-ground-hit.png': 1102 / 1428, 'reward-precision-blue.png': 1122 / 1402 };
const HOUSE_ASPECT = 1024 / 1536;
/* the detail frame is ~352×170 at 412×740 and ~300×170 at 360×740 (card-detail.css) */
export const DETAIL_ART_FRAME_ASPECT = 1.9;
/* the subject sits a little above the middle of the frame: tight headroom, hands and bat stay in */
const SUBJECT_ANCHOR = 0.4;

/* object-position y (0–1) that puts a subject at `focusY` of the image at SUBJECT_ANCHOR of a cover frame */
export function coverPositionY(focusY, imageAspect = HOUSE_ASPECT, frameAspect = DETAIL_ART_FRAME_ASPECT) {
  const visible = Math.min(1, imageAspect / frameAspect);   // share of the image height the frame shows
  if (visible >= 1) return 0.5;
  const top = Math.min(Math.max(focusY - SUBJECT_ANCHOR * visible, 0), 1 - visible);
  return top / (1 - visible);
}

export function cardArtFocusFor(kind) {
  const filename = artFileFor(kind);
  if (!filename) return null;
  const focusY = CARD_ART_FOCUS_Y[kind] ?? ART_FOCUS_Y[filename] ?? DEFAULT_ART_FOCUS_Y;
  const y = coverPositionY(focusY, ART_ASPECT[filename] ?? HOUSE_ASPECT);
  return { focusY, objectPosition: `50% ${Math.round(y * 1000) / 10}%` };
}
