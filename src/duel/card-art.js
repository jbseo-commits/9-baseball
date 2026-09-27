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

export function cardArtFor(kind) {
  if (!kind) return null;
  // order: card-map.json → card-<kind>.png → family-<concept>.png (queue C01–C11) → the concept's borrowed V15 art.
  // Codex only drops a file into assets/cards-v15/; no code or map edit is needed.
  const fam = CARDS[kind]?.family;
  const has = name => !!cardFiles[`../../assets/cards-v15/${name}`];
  const filename = cardMap[kind] || (has(`card-${kind}.png`) && `card-${kind}.png`) || (fam && has(`family-${fam}.png`) && `family-${fam}.png`) || FAMILY_ART[fam];
  if (filename) {
    const fullPath = `../../assets/cards-v15/${filename}`;
    if (cardFiles[fullPath]) return cardFiles[fullPath];
  }
  return null;
}
