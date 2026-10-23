import {CARDS,cardPower} from './cards.js';
import {defenseLabThreat} from './engine.js';

export const LAB_PACK_NAMES={link:'연결 야구',hold:'버티기',power:'한 방 승부'};
export const LAB_RULES={
  link:'기존 주자 한 명을 2루 이상 보내면 봉쇄 · 다음 타자 보호',
  hold:'첫 메인 커트 파울 → 봉쇄·다음 안타 +8 · 2S 헛스윙 구제만 보호 소진',
  power:'힘 투자 유지 → 1~2존 강타 메인 적중으로 봉쇄',
};
const threatText=t=>t?.key==='stack'?'다음 공 스택 최대 2장':t?.key==='pressure'?'다음 공 에너지 −1':'추가 위협 없음';

// Only public fields. In flight, freeze every status along with the old count/HP.
export function defenseLabDisplay(s,before=false){
  const lab=s?.defenseLab;if(!lab)return null;
  const frozen=before?s.battle?.revealed?.defenseLabBefore:null;
  const flags=frozen||lab,threat=frozen?.threat||defenseLabThreat(s);
  const active=flags.activeConstraint;
  const status=[flags.protectionUsed?'2S 커트 보호 소진':flags.transferredProtection?'연결 보호 1 · 2S 메인':'2S 커트 보호 1회 남음'];
  if(flags.counterReady)status.push('다음 안타 +8');
  const counterEarned=flags.counterEarned===true||(flags.counterEarned===undefined&&(flags.counterReady||flags.protectionUsed));
  if(lab.pack==='hold'&&counterEarned&&!flags.counterReady)
    status.push('이번 타석 추가 대응 획득 완료');
  if(flags.powerInvested)status.push('힘 투자 유지');
  const event=before?null:lab.lastEvent;
  let result='';
  if(event){
    const parts=[];
    if(event.responseEarned)parts.push('첫 파울 대응 획득');
    if(event.protected)parts.push(event.savedStrikeout?'삼진 방어':'보호 파울');
    if(event.blocked)parts.push('예고 봉쇄');
    if(event.transferred)parts.push('다음 타자 보호');
    if(event.counterDamage)parts.push('반격 +8 적용');
    if(!parts.length)parts.push(event.threat==='rest'?'숨 고르기':'예고 발동');
    result='지난 공: '+parts.join(' · ');
  }
  return {packName:LAB_PACK_NAMES[lab.pack],rule:LAB_RULES[lab.pack],
    active:active?.key==='stack'?'스택 최대 2장':active?.key==='pressure'?'에너지 −1 적용':'제약 없음',
    threat:threatText(threat),rest:threat.key==='rest',status:status.join(' · '),result};
}

export function defenseLabCardLabel(pack,entry){
  const def=CARDS[entry?.kind];if(!def)return '';
  if(pack==='hold'&&['defend','cutMaster','foulTip','fightOff'].includes(entry.kind))return '메인 실제 파울 첫 1회 · 봉쇄/+8';
  if(entry.kind==='defend')return '2S 커트 보호 · 타석당 1회';
  if(pack==='link'&&(def.advance>=2||def.fx?.run))return '진루 → 봉쇄·전달';
  if(pack==='power'&&['loadPower','sluggerInstinct','calledShot'].includes(entry.kind))return '힘 투자 · 봉쇄 준비';
  if(pack==='power'&&['point','pairH','pairV'].includes(def.shape)&&cardPower(entry)>=2)return '힘 투자 후 봉쇄';
  return '';
}
