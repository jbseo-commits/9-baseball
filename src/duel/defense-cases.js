/* Defense experiment A — shared diagnostic states (shell + tests, one source).
   Decks use real 9-card legal decks; fixed hands use real card IDs; the rest
   stays in the normal draw. Nothing here touches storage or the main run. */
import {createV10Duel,enterV10Node} from './engine.js';
import {DEFENSE_DEPTH_START} from './defense-stance.js';

export const DEFENSE_DECKS={
  P:['place','place','strike','setup','watch','scout','place','slug','finisher'],
  L:['place','place','strike','setup','watch','scout','tableSetter','rally','finisher'],
  S:['place','place','strike','setup','watch','scout','tableSetter','bunt','slug'],
};
const CORE6=['place','place','strike','setup','watch','scout'];

function assemble({seed=90211,kinds,hand,depth=DEFENSE_DEPTH_START,bases=null,outs=0,strikes=0,balls=0,energy=null,hp=null,note=''}){
  let s=createV10Duel(seed);
  s.deck=kinds.map((kind,i)=>({id:'e'+i,kind}));
  s.nextId=kinds.length;
  s=enterV10Node(s,'a1-entry');
  const pool=[...s.battle.hand,...s.battle.draw,...s.battle.discard].filter(id=>!hand.includes(id));
  s.battle.hand=[...hand];s.battle.draw=pool;s.battle.discard=[];
  if(energy!=null)s.battle.energy=energy;
  if(bases)s.battle.bases=[...bases];
  if(hp!=null)s.pitcher.hp=hp;
  s.battle.outs=outs;s.battle.strikes=strikes;s.battle.balls=balls;
  return {state:s,depth,note};
}
const D9=[...CORE6,'rally','flow','bunt'];

/* D1-D8 per PLAYTEST §3. Diagnostic FIXTURES, not natural games. */
export function buildDefenseCase(id,{seed=90211}={}){
  switch(id){
    case 'D1':return assemble({seed,kinds:[...CORE6,'slug','rally','flow'],hand:['e0','e6','e5','e1','e4'],depth:1,
      note:'place/slug/scout 손패: 높은 행 확정 vs 다음 장타 대비 낮은 행 조정.'});
    case 'D2':return assemble({seed,kinds:D9,hand:['e2','e0','e1','e5','e6'],depth:1,
      note:'strike 세로 커버: 앵커가 아닌 실제 적중 행이 전이를 정한다.'});
    case 'D3':return assemble({seed,kinds:['tableSetter','rally','finisher',...CORE6],hand:['e0','e1','e2','e3','e4'],depth:2,
      bases:['p5',null,null],note:'후퇴+1루: tableSetter/rally 추가 진루 회수.'});
    case 'D4':return assemble({seed,kinds:['rally','place','strike','setup','watch','scout','flow','bunt','slug'],hand:['e0','e1','e2','e3','e4'],depth:0,
      bases:['p5',null,null],note:'전진+1루: 진루 −4의 대가 vs finisher +8.'});
    case 'D5':return assemble({seed,kinds:['squeeze','slug','place','watch','strike','rally','setup','scout','flow'],hand:['e0','e1','e2','e3','e4'],depth:2,
      bases:['p5',null,null],outs:0,strikes:0,note:'후퇴+1루+0아웃/0S: 유효 희생 2→0, slug 미사용 유지.'});
    case 'D6':return assemble({seed,kinds:['squeeze','slug','place','watch','strike','rally','setup','scout','flow'],hand:['e0','e1','e2','e3','e4'],depth:2,
      bases:['p5',null,null],outs:2,strikes:0,note:'2아웃 변형: 희생 포기(무효) 또는 2S 파울 변형으로 전환.'});
    case 'D7':return assemble({seed,kinds:['place','rally','strike','setup','watch','scout','flow','bunt','slug'],hand:['e0','e1','e2','e3','e4'],depth:1,
      note:'지원만 적중: 메인 미스 + 지원 적중. stances 상이(place/rally).'});
    case 'D8':return assemble({seed,kinds:['slug','place','strike','setup','watch','scout','flow','rally','bunt'],hand:['e0','e1','e2','e3','e4'],depth:0,hp:12,
      note:'HP12에서 홈런: 공간 면역·1회 계산·종료 뒤 입력 없음.'});
    default:return assemble({seed,kinds:D9,hand:['e0','e1','e2','e3','e4'],depth:DEFENSE_DEPTH_START,note:'자연 관찰 시작'});
  }
}
