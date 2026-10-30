import cardsSheetUrl from '../../../assets/production-art/mockup-v1-intake/cards.webp';

/* A01 선정 6칸 시트. kind 매핑은 승인되지 않았다(scene-layout cards.cardKindMapping=null).
   검토 화면에서 명시적으로 칸을 고를 때만 쓴다. 0 접촉 · 1 주루 · 2 라인드라이브 · 3 눈 · 4 임팩트 · 5 타격 자세 */
export const MOCKUP_CARD_SHEET=Object.freeze({url:cardsSheetUrl,columns:3,rows:2});
export function mockupSheetArt(cell){
  const c=cell%3,r=Math.floor(cell/3)%2;
  return {url:cardsSheetUrl,position:`${c*50}% ${r*100}%`,size:'300% 200%'};
}
