import {defaultCardArt} from './BattleCard.jsx';
const images=import.meta.glob('../../../assets/production-art/atbat-cards/*.webp',{eager:true,query:'?url',import:'default'});
/* Exact kind mapping only. No misleading borrowed art for unrelated mechanics.
   Costs, coverage glyphs and copy remain live view-model data, never painted. */
export function atbatCardArt(item){
  const url=images[`../../../assets/production-art/atbat-cards/${item.kind}.webp`];
  return url?{url,position:'50% 50%',size:'contain'}:defaultCardArt(item);
}
