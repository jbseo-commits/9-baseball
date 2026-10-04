import fs from 'node:fs';
import {describe,it,expect} from 'vitest';

// INBOX 6 셋째 줄: 읽기 등급 명암(shade)은 텍스트 단서와 함께 제공되지만,
// 저시력 변별을 위해 WCAG AA(본문 4.5, 큰 글자 3.0)를 만족해야 한다.
// duel.css의 실제 출하값을 파싱하므로 색 변경 시 이 검사가 먼저 깨진다.
const css=fs.readFileSync('src/duel/duel.css','utf8');
const pick=(re,name)=>{const m=css.match(re);if(!m)throw new Error('missing '+name);return m[1];};
const lum=h=>{const c=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255)
  .map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));
  return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];};
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};

const fg={
  span:pick(/\.zone-cell span\{[^}]*color:(#[0-9a-f]{6})/,'zone span'),
  strong:pick(/\.zone-cell strong\{[^}]*color:(#[0-9a-f]{6})/,'zone strong'),
  small:pick(/\.zone-cell small\{[^}]*color:(#[0-9a-f]{6})/,'zone small'),
};
const bg={
  base:pick(/\.zone-cell\{[^}]*background:(#[0-9a-f]{6})/,'zone base'),
  'shade-1':pick(/\.zone-cell\.shade-1\{background:(#[0-9a-f]{6})\}/,'shade-1'),
  'shade-2':pick(/\.zone-cell\.shade-2\{background:(#[0-9a-f]{6})\}/,'shade-2'),
  'shade-3':pick(/\.zone-cell\.shade-3\{background:(#[0-9a-f]{6})\}/,'shade-3'),
  covered:pick(/\.zone-cell\.covered\{background:(#[0-9a-f]{6})/,'covered'),
  actual:pick(/\.zone-cell\.actual\{background:(#[0-9a-f]{6})/,'actual'),
};

describe('zone shade text contrast (WCAG AA)',()=>{
  for(const [name,color] of Object.entries(bg)){
    it(`${name} keeps name/small readable at 4.5`,()=>{
      expect(ratio(fg.span,color)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(fg.small,color)).toBeGreaterThanOrEqual(4.5);
    });
    it(`${name} keeps the figure readable at 3.0 (large bold)`,()=>{
      expect(ratio(fg.strong,color)).toBeGreaterThanOrEqual(3.0);
    });
  }
});
