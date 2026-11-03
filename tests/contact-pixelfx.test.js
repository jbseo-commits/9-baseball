import {describe,it,expect} from 'vitest';
import {contactPixelPlan,contactHitstop,createContactPixelFx,fullImpactFrame,CONTACT_PALETTES} from '../src/duel/contact-pixelfx.js';
import {IMPACT_GRADES} from '../src/duel/impact-fx.js';
import {createFrame,createFx} from '../src/vendor/pixelfx/core/index.js';

/* 캔버스 없이: 효과 목록·히트스톱 순서·진행·종료만 확인한다 */
const run=(grade,W=130,H=176)=>{
  const fx=createContactPixelFx({W,H,px:70,py:110,grade,seed:5,doc:null});
  let t=0,max=0;if(!fx)return {fx,max,t};
  while(t<4&&!fx.done()){t+=1/60;max=Math.max(max,fx.draw({},t));}
  return {fx,max,t};
};

describe('타격감 · pixelfx 접점 레이어',()=>{
  it('안타·파울·아웃 계열은 pixelfx를 얹고, 헛스윙·루킹은 기존 연출만 쓴다',()=>{
    for(const g of ['grand-slam','homer','extra','dead-center','solid','lucky','jammed','out','foul','battle-foul'])expect(contactPixelPlan(g).length).toBeGreaterThan(0);
    for(const g of ['near-miss','fooled','chase','strikeout','called','called-k','ball','read'])expect(contactPixelPlan(g)).toEqual([]);
  });
  it('홈런·만루홈런만 장면 전체 impact-frame 컷을 쓴다',()=>{
    const hasFrame=g=>contactPixelPlan(g).some(p=>p.fx==='frame');
    expect(hasFrame('homer')).toBe(true);expect(hasFrame('grand-slam')).toBe(true);
    for(const g of IMPACT_GRADES.filter(g=>!['homer','grand-slam'].includes(g)))expect(hasFrame(g)).toBe(false);
  });
  it('히트스톱은 만루홈런 > 홈런 > 장타 > 정중앙 > 정타 > 파울 순이고 0.2초를 넘지 않는다',()=>{
    const h=contactHitstop;
    expect(h('grand-slam')).toBeGreaterThan(h('homer'));expect(h('homer')).toBeGreaterThan(h('extra'));
    expect(h('extra')).toBeGreaterThan(h('dead-center'));expect(h('dead-center')).toBeGreaterThan(h('solid'));expect(h('solid')).toBeGreaterThan(h('foul'));
    for(const g of IMPACT_GRADES)expect(h(g)).toBeLessThanOrEqual(200);
    expect(h('ball')).toBe(0);
  });
  it('모든 등급이 예외 없이 진행되고 4초 안에 끝난다',()=>{
    for(const g of [...IMPACT_GRADES,'out','sacrifice']){
      const {fx,max,t}=run(g);
      if(contactPixelPlan(g).length){expect(max).toBeGreaterThan(0);expect(fx.done()).toBe(true);expect(t).toBeLessThan(4);}
      else expect(fx).toBeNull();
    }
  });
  it('impact-frame의 첫 박은 레이어 전체를 종이색으로 덮고, 넷째 박 이후엔 덮지 않는다',()=>{
    const W=600,H=400,count=t=>{const f=createFrame(W,H),fx=createFx(fullImpactFrame,{palette:CONTACT_PALETTES.frame,x:300,y:200,seed:1});fx.update(t);fx.draw(f);
      let n=0;for(let i=0;i<W*H;i++)if(f.color[i])n++;return n;};
    expect(count(.01)).toBe(600*400);
    expect(count(.2)).toBeLessThan(600*400*.5);
  });
});
