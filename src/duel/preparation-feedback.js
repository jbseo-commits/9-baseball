import {CARDS} from './cards.js';
import {HAND_MAX} from './engine.js';

/* Predict only counts from the current public piles. The used preparation is
   included because playCard moves it to discard before drawing. */
export function preparationDrawPreview(state,id){
  const battle=state?.battle,card=state?.deck?.find(x=>x.id===id);
  if(!battle||!Array.isArray(battle.hand)||!battle.hand.includes(id)||!card||CARDS[card.kind]?.type!=='skill')return null;
  const fx=(card.plus&&CARDS[card.kind].plusFx)||CARDS[card.kind].fx||{};
  const requested=Number.isFinite(fx.draw)?Math.max(0,Math.floor(fx.draw)):0;
  if(!requested)return null;
  const slots=Math.max(0,HAND_MAX-(battle.hand.length-1));
  const stock=(Array.isArray(battle.draw)?battle.draw.length:0)+(Array.isArray(battle.discard)?battle.discard.length:0)+1;
  const count=Math.min(requested,slots,stock);
  return {requested,count,reason:count<requested?(stock<slots?'stock':'hand'):null};
}

export function activePreparationFeedback(battle,phase){
  if(!battle||!['battle','pitch'].includes(phase))return [];
  const out=[];
  if(battle.aim>0)out.push(`집중 +${battle.aim}`);
  if(battle.runSignal)out.push(`안타 시 주자 +${battle.runSignalPlus?2:1}루`);
  if(battle.expanded)out.push(`범위 +1 · ${battle.expandedPlus?'타석 유지':'다음 스윙'}`);
  if(battle.bonusPower>0)out.push(`파워 +${battle.bonusPower*18}`);
  if(battle.bonusDmg>0)out.push(`안타 HP +${battle.bonusDmg}`);
  if(battle.bonusPressure>0)out.push(`정타 HP +${Math.round(battle.bonusPressure*100)}%`);
  if(battle.bonusBall>0)out.push(`볼 HP +${battle.bonusBall}`);
  if(battle.bonusWalk>0)out.push(`볼넷 HP +${battle.bonusWalk}`);
  if(battle.bonusFoul>0)out.push(`파울 HP +${battle.bonusFoul}`);
  if(battle.patient)out.push('존 안 미적중 파울 확률↑');
  if(battle.scouted){
    const clue=battle.scoutPlus?'높이·안팎':battle.scoutBall?'볼 여부':'높이·볼';
    out.push(`이번 공 간파: ${clue}`);
  }
  return out;
}
