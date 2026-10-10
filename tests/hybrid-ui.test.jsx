// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
const renderer=vi.hoisted(()=>({props:null}));
vi.mock('../src/duel/BallparkActors.jsx',()=>({pixiAvailable:()=>false,default:props=>{
  renderer.props=props;React.useEffect(()=>{props.onReady({batter:true,pitcher:true})},[]);return <div className="mock-actors"/>;
}}));
import {HybridApp} from '../src/hybrid/main.jsx';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
const hp=()=>screen.getByRole('progressbar',{name:'투수 HP'}).getAttribute('aria-valuenow');
const event=type=>act(()=>renderer.props.onTimeline({type,token:renderer.props.playToken}));

describe('hybrid action and reveal lifecycle',()=>{
  it('edits support aim in a compact dialog and preserves the plan through rotation',()=>{
    vi.stubGlobal('innerWidth',390);
    const {container}=render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'준비 실행 PREPARE'}));
    expect(screen.getByLabelText('에너지 2/3, 선택 비용 1')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'밀어치기 · 세로 3존 · 바깥 공 보너스'}));
    fireEvent.click(screen.getByRole('button',{name:'＋ 지원 카드 추가'}));
    fireEvent.click(screen.getByRole('button',{name:'커트 스윙 · 십자 커버 · 적중 단타 · 파울 생존'}));
    fireEvent.click(screen.getByRole('button',{name:'코스 8 · 지원 ▦'}));
    const dialog=screen.getByRole('dialog',{name:'코스 선택'});
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain('SUPPORT · 커트 스윙');
    fireEvent.click(dialog.querySelectorAll('.zone-grid>button')[8]);
    expect(dialog.open).toBe(false);
    expect(container.querySelector('.order-list').textContent).toContain('MAIN밀어치기8번 존');
    expect(container.querySelector('.order-list').textContent).toContain('커트 스윙9번 존');
    expect(screen.getByLabelText('에너지 2/3, 선택 비용 2')).toBeTruthy();
    expect(screen.getByLabelText('선택 비용과 효과').textContent).toContain('2장 · HP');
    fireEvent.click(screen.getByRole('button',{name:'코스 9 · 지원 ▦'}));
    fireEvent(dialog,new Event('cancel',{bubbles:false,cancelable:true}));
    expect(dialog.open).toBe(false);
    vi.stubGlobal('innerWidth',844);fireEvent(window,new Event('resize'));
    expect(container.querySelector('dialog')).toBeNull();
    expect(container.querySelector('.order-list').textContent).toContain('커트 스윙9번 존');
    fireEvent.click(screen.getByRole('button',{name:'2장으로 스윙 COMMIT TO YOUR READ'}));
    expect(renderer.props.shot).toBeTruthy();event('impact');event('settled');
    expect(screen.getByRole('button',{name:'다음 공 →'}).disabled).toBe(false);
  });
  it('prepares without a pitch; commits a real hit only at contact and unlocks at settle',()=>{
    const {container}=render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'준비 실행 PREPARE'}));
    expect(hp()).toBe('60');expect(container.querySelector('.score-counts').textContent).toContain('1구');
    fireEvent.click(screen.getByRole('button',{name:'커트 스윙 · 십자 커버 · 적중 단타 · 파울 생존'}));
    const swing=screen.getByRole('button',{name:'스윙 COMMIT TO YOUR READ'});
    fireEvent.click(swing);fireEvent.click(swing);
    expect(hp()).toBe('60');expect(container.querySelector('.result-call')).toBeNull();
    event('release');expect(hp()).toBe('60');
    event('impact');expect(Number(hp())).toBeLessThan(60);expect(container.querySelector('.result-call')).not.toBeNull();
    const afterImpact=hp();event('impact');expect(hp()).toBe(afterImpact);
    expect(screen.getByRole('button',{name:'타구를 지켜보는 중…'}).disabled).toBe(true);
    event('settled');expect(screen.getByRole('button',{name:'다음 타자 →'}).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button',{name:'다음 타자 →'}));
    expect(container.querySelector('.score-counts').textContent).toContain('2번 타자');
  });
  it('ignores an old pitch after changing packs and starts an ordinary relay PA',()=>{
    const {container}=render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'지켜보기'}));
    const oldToken=renderer.props.playToken,oldCallback=renderer.props.onTimeline;
    fireEvent.click(screen.getByRole('button',{name:/↗ 주자 연결/}));
    act(()=>oldCallback({type:'impact',token:oldToken}));
    act(()=>oldCallback({type:'settled',token:oldToken}));
    expect(hp()).toBe('60');expect(container.querySelector('.result-call')).toBeNull();
    expect(screen.getByLabelText('주자 없음')).toBeTruthy();expect(screen.getByLabelText('0볼 0스트라이크 0아웃')).toBeTruthy();
    expect(container.querySelector('.order-list').textContent).toContain('주자 연결');
  });
  it('takes with no swing or card consumption and can advance to the next pitch',()=>{
    const {container}=render(<HybridApp initialSeed={90210}/>);
    const hand=container.querySelectorAll('.game-card').length;
    fireEvent.click(screen.getByRole('button',{name:'지켜보기'}));
    expect(renderer.props.shot.motion.swing).toBe(false);event('impact');event('settled');
    expect(container.querySelectorAll('.game-card').length).toBe(hand);
    expect(container.querySelector('.result-summary').textContent).toContain('소비 0장');
    fireEvent.click(screen.getByRole('button',{name:'다음 공 →'}));
    expect(container.querySelector('.score-counts').textContent).toContain('2구');
    expect(screen.getByRole('button',{name:'지켜보기'}).disabled).toBe(false);
  });
  it('reports zero cards consumed for the basic swing as well',()=>{
    const {container}=render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'기본 스윙'}));
    fireEvent.click(screen.getByRole('button',{name:'스윙 COMMIT TO YOUR READ'}));
    event('impact');event('settled');
    expect(container.querySelector('.result-summary').textContent).toContain('소비 0장');
  });
});
