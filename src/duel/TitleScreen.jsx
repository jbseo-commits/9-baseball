import React,{useRef} from 'react';
import plate from '../../assets/production-art/phone-assets-v18/A06-title-stadium-plate.png';
import {pitcherFigures} from './pitcher-visuals.js';
import './title-screen.css';

/* Game entry (docs/art/benchmark/target/title.png): the target's layered cast — here the female pitchers
   (Red Rush in front, three rivals dimmed behind her) on the A06 sunset stadium, the 9ZONE wordmark with a
   baseball for its O, and one vertical menu — 새로운 게임 · 이어하기 · 덱 관리 · 도감 · 설정.
   The tutorials, seed and sound controls live under 설정 so the entry reads like a game, not a form.
   `run` is the live main-run save summary (null = none): {act, deck} */
const Ball=()=><svg className="ts-ball" viewBox="0 0 64 64" aria-hidden="true">
  <defs><radialGradient id="ts-ball-shade" cx="38%" cy="32%" r="70%"><stop offset="0" stopColor="#fff"/><stop offset=".62" stopColor="#ece6da"/><stop offset="1" stopColor="#a99f8e"/></radialGradient></defs>
  <circle cx="32" cy="32" r="29" fill="url(#ts-ball-shade)" stroke="#1b2140" strokeWidth="4"/>
  <path d="M15 11c7 6 10 13 10 21s-3 15-10 21M49 11c-7 6-10 13-10 21s3 15 10 21" fill="none" stroke="#d2342c" strokeWidth="2.6" strokeLinecap="round"/>
  <path d="M17.5 17l4-1.5M20.5 23.5l4-.8M22 30.5h4M21 37.5l4 .8M18.5 44l4 1.5M46.5 17l-4-1.5M43.5 23.5l-4-.8M42 30.5h-4M43 37.5l-4 .8M45.5 44l-4 1.5" stroke="#d2342c" strokeWidth="2" strokeLinecap="round"/>
</svg>;

/* back to front; `hero` is lit, the rest sit in the stadium's shadow */
export const TITLE_CAST=[
  {id:'regular-04-ivory-ace',slot:'back-l'},
  {id:'regular-05-violet-sting',slot:'back-r'},
  {id:'regular-02-teal-mirage',slot:'mid'},
  {id:'regular-01-red-rush',slot:'hero'},
];

export default function TitleScreen({run=null,onNew,onContinue,onDeck,onDex,onSettings}){
  const listRef=useRef(null);
  const items=[
    {key:'new',label:'새로운 게임',sub:'투수를 끌어내리는 3막 원정',on:onNew},
    {key:'continue',label:'이어하기',sub:run?(run.ended?'지난 런 결과 보기':run.tutorial?`튜토리얼 · 덱 ${run.deck}장`:`${run.act}막 · 덱 ${run.deck}장`):'진행 중인 런 없음',on:onContinue,off:!run},
    {key:'deck',label:'덱 관리',sub:run?`현재 덱 ${run.deck}장`:'런을 시작하면 열립니다',on:onDeck,off:!run},
    {key:'dex',label:'도감',sub:'만난 투수와 카드',on:onDex},
    {key:'settings',label:'설정',sub:'사운드 · 도움말 · 튜토리얼',on:onSettings},
  ];
  /* the item a returning player wants lights up first: continue when a run exists, else new game */
  const lead=run&&!run.ended?'continue':'new';
  /* arrow keys walk the menu like a console title */
  const onKeyDown=e=>{
    if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
    const bs=[...listRef.current.querySelectorAll('button:not(:disabled)')];
    const i=bs.indexOf(document.activeElement);
    const n=e.key==='ArrowDown'?(i+1)%bs.length:(i<=0?bs.length-1:i-1);
    bs[n]?.focus();e.preventDefault();
  };
  return <main className="title-screen" aria-label="타이틀" style={{'--ts-art':`url(${plate})`}}>
    <i className="ts-art" aria-hidden="true"/>
    <div className="ts-cast" aria-hidden="true">{TITLE_CAST.map(c=>pitcherFigures[c.id]&&<img key={c.id} className={'ts-fig '+c.slot} alt="" src={pitcherFigures[c.id]}/>)}</div>
    <i className="ts-shade" aria-hidden="true"/>
    <header className="ts-brand">
      <h1 className="ts-logo" aria-label="9ZONE HOMEBOUND"><span className="ts-nine" aria-hidden="true">9</span><span className="ts-zone" aria-hidden="true">Z<Ball/>NE</span></h1>
      <p className="ts-sub">BASEBALL ROGUELIKE</p>
    </header>
    <nav className="ts-menu" aria-label="메인 메뉴" ref={listRef} onKeyDown={onKeyDown}>
      <ul>{items.map((it,i)=><li key={it.key} style={{'--i':i}}>
        <button type="button" className={'ts-item'+(it.key===lead?' lead':'')} data-item={it.key} aria-label={it.label} aria-describedby={'ts-sub-'+it.key} disabled={!!it.off} onClick={it.on}>
          <b>{it.label}</b><small id={'ts-sub-'+it.key}>{it.sub}</small>
        </button>
      </li>)}</ul>
    </nav>
  </main>;
}
