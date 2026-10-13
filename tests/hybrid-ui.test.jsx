// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
const renderer=vi.hoisted(()=>({props:null}));
vi.mock('../src/duel/BallparkActors.jsx',()=>({pixiAvailable:()=>false,default:props=>{
  renderer.props=props;React.useEffect(()=>{props.onReady({batter:true,pitcher:true})},[]);return <div className="mock-actors"/>;
}}));
import {HybridApp} from '../src/hybrid/main.jsx';
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.useRealTimers()});
const hp=()=>screen.getByRole('progressbar',{name:'투수 HP'}).getAttribute('aria-valuenow');
const event=type=>act(()=>renderer.props.onTimeline({type,token:renderer.props.playToken}));

describe('hybrid action and reveal lifecycle',()=>{
  it('keeps nine portrait aim targets inline and stops autoplay on direct manual aim',()=>{
    vi.useFakeTimers();vi.stubGlobal('innerWidth',390);
    const {container}=render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'자동 플레이'}));
    const forecast=screen.getByRole('region',{name:'코스 선택'});
    expect(forecast.querySelectorAll('.zone-grid>button')).toHaveLength(9);
    fireEvent.click(screen.getByRole('button',{name:/^몸쪽 낮음/}));
    act(()=>vi.advanceTimersByTime(3000));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelector('.course-editor').textContent).toContain('7번');
    expect(screen.getByRole('button',{name:'자동 플레이'}).getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('.score-counts').textContent).toContain('1구');
    expect(renderer.props.shot).toBeNull();expect(hp()).toBe('60');
  });
  it('edits support inline, keeps the board open and preserves the plan through rotation',()=>{
    vi.stubGlobal('innerWidth',390);
    const {container}=render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'준비 실행 PREPARE'}));
    expect(screen.getByLabelText('에너지 2/3, 선택 비용 1')).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'핀포인트 · 1존 커버 · 정확 적중 HP +70%'}));
    fireEvent.click(screen.getByRole('button',{name:'＋ 지원 카드 추가'}));
    fireEvent.click(screen.getByRole('button',{name:'눈높이 컨택 · 가로 2존 커버 · 정확 적중 HP +35%'}));
    const forecast=screen.getByRole('region',{name:'코스 선택'});
    expect(forecast.textContent).toContain('지원 · 눈높이 컨택');
    fireEvent.click(forecast.querySelectorAll('.zone-grid>button')[8]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('region',{name:'코스 선택'})).toBe(forecast);
    expect(container.querySelector('.order-list').textContent).toContain('MAIN핀포인트8번 존');
    expect(container.querySelector('.order-list').textContent).toContain('눈높이 컨택9번 존');
    expect(screen.getByLabelText('에너지 2/3, 선택 비용 2')).toBeTruthy();
    expect(screen.getByLabelText('선택 비용과 효과').textContent).toContain('2장 · HP');
    vi.stubGlobal('innerWidth',844);fireEvent(window,new Event('resize'));
    expect(container.querySelector('dialog')).toBeNull();
    expect(screen.getByRole('region',{name:'코스 선택'})).toBe(forecast);
    vi.stubGlobal('innerWidth',390);fireEvent(window,new Event('resize'));
    expect(forecast.textContent).toContain('지원 · 눈높이 컨택 9번');
    expect(container.querySelector('.order-list').textContent).toContain('눈높이 컨택9번 존');
    fireEvent.click(screen.getByRole('button',{name:'2장으로 스윙 COMMIT TO YOUR READ'}));
    expect(renderer.props.shot).toBeTruthy();event('impact');event('settled');
    expect(screen.getByRole('button',{name:'다음 공 →'}).disabled).toBe(false);
  });
  it('keeps spectator mode active through its own preparations and pitch',()=>{
    vi.useFakeTimers();
    render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'자동 플레이'}));
    for(let n=0;n<5&&!renderer.props.shot;n++)act(()=>vi.advanceTimersByTime(700));
    expect(renderer.props.shot).toBeTruthy();
    expect(screen.getByRole('button',{name:'자동 플레이 중지'}).getAttribute('aria-pressed')).toBe('true');
  });
  it('manual card selection cancels a queued spectator action without consuming a pitch',()=>{
    vi.useFakeTimers();
    render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'자동 플레이'}));
    fireEvent.click(screen.getByRole('button',{name:'눈높이 컨택 · 가로 2존 커버 · 정확 적중 HP +35%'}));
    expect(screen.getByRole('button',{name:'자동 플레이'}).getAttribute('aria-pressed')).toBe('false');
    expect(renderer.props.shot).toBeNull();
    act(()=>vi.advanceTimersByTime(3000));expect(renderer.props.shot).toBeNull();
  });
  it('prepares without a pitch; commits a real hit only at contact and unlocks at settle',()=>{
    const {container}=render(<HybridApp initialSeed={90210}/>);
    fireEvent.click(screen.getByRole('button',{name:'준비 실행 PREPARE'}));
    expect(hp()).toBe('60');expect(container.querySelector('.score-counts').textContent).toContain('1구');
    fireEvent.click(screen.getByRole('button',{name:'눈높이 컨택 · 가로 2존 커버 · 정확 적중 HP +35%'}));
    fireEvent.click(screen.getByRole('button',{name:/몸쪽 낮음/}));
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
    expect(container.querySelector('.order-list').textContent).toContain('테이블 세터');
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
