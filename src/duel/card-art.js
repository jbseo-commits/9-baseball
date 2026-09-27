import cardMap from '../../assets/cards-v15/card-map.json';

const cardFiles = import.meta.glob('../../assets/cards-v15/*.png', { eager: true, query: '?url', import: 'default' });

export function cardArtFor(kind) {
  if (!kind) return null;
  const filename = cardMap[kind];
  if (filename) {
    const fullPath = `../../assets/cards-v15/${filename}`;
    if (cardFiles[fullPath]) return cardFiles[fullPath];
  }
  return null;
}
