import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {SCENE,worldCamera,cameraYAlign,actorBox,toScreen,sceneSnapshot,cameraMatrix} from '../src/duel/battle-vnext/scene-geometry.js';

const close=(a,b,eps=1e-9)=>expect(Math.abs(a-b)).toBeLessThan(eps);

describe('C02 구장 좌표 — CONTRACTS §5 값과 같다',()=>{
  it('구장·홈·마운드·배우 원본/앵커/세계 발 위치',()=>{
    expect(SCENE.world).toEqual({width:1672,height:941});
    expect(SCENE.home).toEqual({x:815,y:824});
    expect(SCENE.mound).toEqual({x:832,y:580});
    expect(SCENE.batter).toMatchObject({sourceWidth:1024,sourceHeight:1536,worldHeight:670,anchor:{x:470,y:1485},worldFoot:{x:520,y:909},handedness:'right'});
    expect(SCENE.pitcher).toMatchObject({sourceWidth:1024,sourceHeight:1536,worldHeight:310,anchor:{x:595,y:1495},worldFoot:{x:832,y:580},handedness:'right'});
    expect(SCENE.sampleFlight).toEqual({release:{x:790,y:361},contact:{x:760,y:653},productionEventsVerified:false});
    expect(SCENE.animationReady).toBe(false);
  });
  it('목업 reference/scene.js의 DIAMOND와 숫자가 일치한다',()=>{
    const src=readFileSync('docs/design/mockup-v1/reference/scene.js','utf8');
    for(const n of ['width:1672','height:941','home:{x:815,y:824}','mound:{x:832,y:580}','height:670','anchor:{x:470,y:1485}','foot:{x:520,y:909}',
      'height:310','anchor:{x:595,y:1495}','foot:{x:832,y:580}','{x:790,y:361}','{x:760,y:653}'])expect(src,n).toContain(n);
  });
});

describe('공유 카메라',()=>{
  it('정렬: 짧은 가로 = 아래, PC = .42, 세로 = .4',()=>{
    expect(cameraYAlign(844,390)).toBe(1);
    expect(cameraYAlign(667,375)).toBe(1);
    expect(cameraYAlign(1440,900)).toBe(.42);
    expect(cameraYAlign(390,844)).toBe(.4);
    expect(cameraYAlign(320,568)).toBe(.4);
  });
  it('cover 배율로 빈틈 없이 덮고 가로 중앙 정렬',()=>{
    for(const [w,h] of [[844,390],[667,375],[740,360],[1440,900],[1920,1080],[390,844],[320,568]]){
      const c=worldCamera(w,h);
      expect(1672*c.scale).toBeGreaterThanOrEqual(w-1e-9);
      expect(941*c.scale).toBeGreaterThanOrEqual(h-1e-9);
      expect(c.x).toBeLessThanOrEqual(1e-9);expect(c.y).toBeLessThanOrEqual(1e-9);
      expect(c.x+1672*c.scale).toBeGreaterThanOrEqual(w-1e-9);
      expect(c.y+941*c.scale).toBeGreaterThanOrEqual(h-1e-9);
      close(c.x,(w-1672*c.scale)/2);
    }
  });
  it('크기 0은 숨김 카메라 (NaN 없음)',()=>{
    expect(worldCamera(0,0)).toMatchObject({scale:0,x:0,y:0});
    expect(cameraMatrix(worldCamera(0,300))).not.toMatch(/NaN|Infinity/);
  });
  it('844×390 기준 캡처의 카메라 값',()=>{
    const c=worldCamera(844,390);
    close(c.scale,844/1672);
    close(c.y,390-941*844/1672);
  });
});

describe('배우 배치 — 앵커가 세계 발 위치에 정확히 놓인다',()=>{
  for(const name of ['batter','pitcher'])it(name,()=>{
    const a=SCENE[name],b=actorBox(a);
    close(b.scale,a.worldHeight/a.sourceHeight);
    close(b.x+a.anchor.x*b.scale,a.worldFoot.x);
    close(b.y+a.anchor.y*b.scale,a.worldFoot.y);
    close(b.width/b.height,a.sourceWidth/a.sourceHeight); // 비율 유지, 늘이지 않음
    expect(b.width).toBeGreaterThan(0); // 음수 폭 = 좌우 반전 금지
  });
  it('원근: 투수는 타자보다 멀고(위) 작다. 투수 발은 마운드',()=>{
    const bat=actorBox(SCENE.batter),pit=actorBox(SCENE.pitcher);
    expect(pit.height).toBeLessThan(bat.height);
    expect(SCENE.pitcher.worldFoot.y).toBeLessThan(SCENE.batter.worldFoot.y);
    expect(SCENE.pitcher.worldFoot).toEqual(SCENE.mound);
    expect(SCENE.batter.worldFoot.x).toBeLessThan(SCENE.home.x); // 왼쪽 타석의 우타자
  });
  it('화면 좌표: 같은 카메라라 배우·구장 상대 위치가 화면 크기와 무관하다',()=>{
    const rel=(w,h)=>{const s=sceneSnapshot(w,h),k=s.camera.scale;
      return [(s.batterFoot.x-s.home.x)/k,(s.batterFoot.y-s.home.y)/k,(s.pitcherFoot.x-s.mound.x)/k,(s.pitcherFoot.y-s.mound.y)/k];};
    const base=rel(1440,900);
    for(const [w,h] of [[844,390],[390,844],[667,375]])rel(w,h).forEach((v,i)=>close(v,base[i],1e-6));
    const s=sceneSnapshot(844,390);
    expect(s.release).toEqual(toScreen(s.camera,SCENE.sampleFlight.release));
  });
});
