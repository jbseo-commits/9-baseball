import {CARDS,AXIS_NAMES,cardPower} from './cards.js';

const REQUIREMENTS={runner:'주자 필요',twoStrike:'2스트라이크 전용',strike:'스트라이크 필요',first:'초구 전용',empty:'주자 없을 때'};
export const ROLE_MARKS={'정타':'◎','장타':'↗','범위':'▦','진루':'◇','생존':'⊥','집중':'＋','수급':'↻','관찰':'◉','기본':'·'};

/* One public payoff on the small face; coverage has its own glyph. Conditions and
   costs are separate, so reducing prose never hides what makes a card unusable. */
export function cardFaceOf(entry,{strikes=0}={}){
  const kind=entry?.kind;
  if(kind==='basic')return {summary:'카드 소모 없음',condition:'',axis:'1존'};
  const d=CARDS[kind];if(!d)return {summary:'',condition:'',axis:''};
  const fx=(entry.plus&&d.plusFx)||d.fx||{};
  const core={
    place:()=>`정타 HP +${Math.round(d.pressure*100)}%`,
    strike:()=> '적중하면 안타',
    slug:()=>`파워 +${cardPower(entry)*18}`,
    rally:()=>`안타 → 주자 +${d.advance}루`,
    defend:()=> '단타 · 파울 생존',
    bunt:()=> '진루 +1 · 아웃 +1',
    finisher:()=>`파워 +${cardPower(entry)*18}`,
    wall:()=> '상하좌우 커버',
    laser:()=>`파워 +${cardPower(entry)*18}`,
    commit:()=>`파워 +${cardPower(entry)*18}`,
    setup:()=>`집중 +${fx.aim}`,
    watch:()=>`카드 ${fx.draw}장 뽑기`,
    scout:()=>fx.scout==='full'?'높이·안팎 간파':'높이·볼 간파',
    lure:()=>entry.plus?'타석 내 범위 +1':'다음 스윙 범위 +1',
    flow:()=>`안타 → 주자 +${fx.run}루`,
    calm:()=>`생존 · 카드 +${fx.draw}`,
  };
  const payoffs=(d.gives||[]).flatMap(g=>g.split(' · ')).filter(g=>
    !/커버$|^(?:가로 |세로 |십자 |주변 |X )?\d존$|^대각선$|^네 모서리 \+ 선택 존$/.test(g));
  // Keep every non-coverage payoff on one line: base power plus the lane/fx
  // condition (e.g. pullHook '파워 +18 · 몸쪽 공 파워 +18', readStrike
  // '파워 +18 · 간파한 공 안타 +6 HP'). payoffs[0]-only dropped the lane.
  let summary=d.bunt?'진루 +1 · 아웃 +1':core[kind]?.()||payoffs.join(' · ')||AXIS_NAMES[d.axis]||'타석 준비';
  // The + marker already identifies an upgrade. Update a displayed power/draw
  // number from its definition; never invent power upgrades for singles/bunts.
  // Plus adds base power even when the face leads with a lane/pressure payoff
  // (highLane, pinpoint); a plus that erases a power penalty (needle, wideNet)
  // drops the '파워 +0' noise instead of printing it.
  if(d.type==='attack'&&!d.singles&&!d.bunt){
    const p=cardPower(entry)*18;
    const livePowerCore=kind==='slug'||kind==='finisher'||kind==='laser'||kind==='commit';
    if(!livePowerCore){
      if(/^파워 [+-]\d+/.test(summary)){
        summary=p===0
          ?summary.replace(/^파워 [+-]\d+( · )?/,'')
          :summary.replace(/^파워 [+-]\d+/,`파워 ${p>=0?'+':''}${p}`);
      }else if(entry.plus&&p>0){
        summary=`파워 +${p} · ${summary}`;
      }
    }
  }
  summary=summary.replace(/정확 적중/g,'정타').replace(/이번 타석 /g,'').replace(/베이스/g,'루');
  const condition=d.bunt?`희생 ${Math.round((entry.plus?d.bunt.plusSac:d.bunt.sac)*100)}%${strikes===2?' · 파울도 삼진':''}`:REQUIREMENTS[d.requires]||'';
  return {summary,condition,axis:AXIS_NAMES[d.axis]||'준비'};
}

export function shortCardProblem(problem){
  if(!problem)return '';
  if(problem.includes('주자가 필요'))return '주자 필요';
  if(problem.includes('투스트라이크에서만'))return '2스트라이크 전용';
  if(problem.includes('스트라이크가 있을'))return '스트라이크 필요';
  if(problem.includes('타석 첫 공'))return '초구 전용';
  if(problem.includes('주자가 없을'))return '주자 없을 때';
  if(problem.includes('준비')&&problem.includes('모두 사용'))return '준비 횟수 소진';
  /* Face keeps the short cause; the exact cost math lives in the plan summary.
     The over-budget exact sum is built by the caller, never here. */
  if(problem.includes('에너지'))return '에너지 부족';
  return problem;
}
