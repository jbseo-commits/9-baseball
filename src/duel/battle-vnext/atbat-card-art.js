import {CARDS} from '../cards.js';
const images=import.meta.glob('../../../assets/production-art/mockup-rebuild/cards/*.webp',{eager:true,query:'?url',import:'default'});
/* Exact kind first, then explicit family scenes. The glyph alone defines range.
   Costs, coverage glyphs and copy remain live view-model data, never painted. */
export function atbatCardArt(item){
  const family={precision:'place',power:'slug',relay:'rally',grind:'defend',eye:'watch',clutch:'place',tempo:'laser',stack:'wall',intel:'scout',mental:'watch',lane:'strike'};
  const exact=images[`../../../assets/production-art/mockup-rebuild/cards/${item.kind}.webp`];
  const kind=family[CARDS[item.kind]?.family]||(item.type==='prepare'?'scout':item.coverage?.length>=5?'wall':item.coverage?.length>=3?'strike':'place');
  const url=exact||images[`../../../assets/production-art/mockup-rebuild/cards/${kind}.webp`];
  const focus={strike:'78% 50%',defend:'65% 50%',scout:'60% 50%',watch:'65% 50%'};
  return {url,position:focus[exact?item.kind:kind]||'50% 50%',size:'cover'};
}
