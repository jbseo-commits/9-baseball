import {describe,it,expect} from 'vitest';
import {drawGimmickVfx,VFX_IDS,VFX_SIZE,phaseLevel,inBody} from '../src/duel/gimmick-vfx.js';
import {GIMMICKS} from '../src/duel/gimmick.js';

/* 캔버스 없이 그리기 호출만 센다: 모든 기믹이 그림을 가지고, 단계가 오를수록 더 많이 그리며, 범위를 벗어나지 않는다. */
function fakeCtx(){
  const c={rects:0,out:0,fillStyle:'',globalAlpha:1,imageSmoothingEnabled:true,
    clearRect(){},save(){},restore(){},
    fillRect(x,y,w,h){c.rects++;if(x+w<0||y+h<0||x>VFX_SIZE+80||y>VFX_SIZE+80)c.out++;}};
  return c;
}
describe('엘리트·보스 도트 VFX',()=>{
  it('모든 기믹 id가 그림 함수를 가진다',()=>{
    expect([...VFX_IDS].sort()).toEqual([...new Set(Object.values(GIMMICKS).map(g=>g.id))].sort());
    expect(drawGimmickVfx(fakeCtx(),'nope',0)).toBe(false);
  });
  it('각 캐릭터는 그림을 그리고 화면 밖으로 크게 새지 않는다',()=>{
    for(const id of VFX_IDS)for(const t of [0,.7,1.9]){
      const c=fakeCtx();expect(drawGimmickVfx(c,id,t,{level:1})).toBe(true);
      expect(c.rects).toBeGreaterThan(300);expect(c.out/c.rects).toBeLessThan(.05);
    }
  });
  it('HP 단계가 내려가고 보스일수록 더 많이 그린다',()=>{
    expect(phaseLevel('steady')).toBe(0);expect(phaseLevel('pressured')).toBe(1);expect(phaseLevel('critical')).toBe(2);
    for(const id of VFX_IDS){
      const n=(level,boss)=>{const c=fakeCtx();drawGimmickVfx(c,id,1.3,{level,boss});return c.rects;};
      expect(n(2,false)).toBeGreaterThan(n(0,false));
      expect(n(1,true)).toBeGreaterThanOrEqual(n(1,false));
    }
  });
  it('같은 시간이면 같은 그림이다(정지 프레임 안전)',()=>{
    for(const id of VFX_IDS){const a=fakeCtx(),b=fakeCtx();drawGimmickVfx(a,id,2.2,{level:2,boss:true});drawGimmickVfx(b,id,2.2,{level:2,boss:true});expect(a.rects).toBe(b.rects);}
  });
});

describe('투수 몸통은 가리지 않는다',()=>{
  it('면(빛·원판)은 몸통 자리를 비운다',async()=>{
    const {inBody}=await import('../src/duel/gimmick-vfx.js');
    expect(inBody(60,60)).toBe(true);expect(inBody(2,2)).toBe(false);
    for(const id of ['eclipse','halo','tyrant']){
      const filled=new Set(),ctx={clearRect(){},save(){},restore(){},fillStyle:'',globalAlpha:1,imageSmoothingEnabled:true,
        fillRect(x,y,w,h){if(w===1&&h===1&&inBody(x,y)&&ctx.globalAlpha>=.9)filled.add(x+','+y);}};
      drawGimmickVfx(ctx,id,1.3,{level:2,boss:true});
      /* 몸통 안에는 빛 점이 거의 없어야 한다(선·입자는 허용) */
      expect(filled.size).toBeLessThan(400);
    }
  });
});
