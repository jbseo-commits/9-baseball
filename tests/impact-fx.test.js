import {describe,it,expect} from 'vitest';
import {IMPACT_GRADES,impactProfile,impactDuration,createImpactState,drawImpactFx} from '../src/duel/impact-fx.js';

/* 캔버스 없이 호출만 센다. */
function fakeCtx(){
  const c={rects:0,flashes:0,fillStyle:'',globalAlpha:1,imageSmoothingEnabled:true,
    save(){},restore(){},clearRect(){},createRadialGradient(){return {addColorStop(){}}},
    fillRect(x,y,w,h){c.rects++;if(w>50&&h>50)c.flashes++;}};
  return c;
}
const W=130,H=176;
const frame=(grade,t,seed=5)=>{const c=fakeCtx();drawImpactFx(c,createImpactState({W,H,px:70,py:110,grade,seed}),t);return c;};

describe('타격감 임팩트 연출',()=>{
  it('모든 판정 등급이 프로필과 길이를 가진다',()=>{
    for(const g of IMPACT_GRADES){expect(impactProfile(g)).toBeTruthy();expect(impactDuration(g)).toBeGreaterThan(.5);}
    expect(impactProfile('read')).toBeNull();expect(createImpactState({W,H,px:1,py:1,grade:'ball'})).toBeNull();
  });
  it('세기가 홈런 > 장타 > 정타 > 빗맞음 순이다',()=>{
    const p=g=>impactProfile(g).power;
    expect(p('grand-slam')).toBeGreaterThan(p('homer'));expect(p('homer')).toBeGreaterThan(p('extra'));
    expect(p('extra')).toBeGreaterThan(p('dead-center'));expect(p('dead-center')).toBeGreaterThan(p('solid'));expect(p('solid')).toBeGreaterThan(p('jammed'));
  });
  it('접점 순간(t≈0)에는 전체 화면 플래시가 있고 센 타격일수록 많이 그린다',()=>{
    for(const g of ['solid','homer','foul','strikeout'])expect(frame(g,.02).flashes).toBeGreaterThan(0);
    expect(frame('homer',.05).rects).toBeGreaterThan(frame('solid',.05).rects);
    expect(frame('solid',.05).rects).toBeGreaterThan(frame('foul',.05).rects);
  });
  it('끝난 뒤에는 거의 그리지 않는다',()=>{
    for(const g of IMPACT_GRADES)expect(frame(g,impactDuration(g)+.3).rects).toBeLessThan(frame(g,.05).rects);
  });
  it('같은 시드·시간이면 같은 프레임이다',()=>{
    for(const g of IMPACT_GRADES)expect(frame(g,.12,9).rects).toBe(frame(g,.12,9).rects);
  });
  it('모든 등급·시점에서 예외 없이 그려진다',()=>{
    for(const g of IMPACT_GRADES)for(const t of [0,.03,.1,.25,.5,1,2])expect(()=>frame(g,t)).not.toThrow();
  });
});
