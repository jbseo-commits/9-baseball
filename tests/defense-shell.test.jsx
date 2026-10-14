// @vitest-environment happy-dom
import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import fs from 'node:fs';
import DefenseExperiment from '../src/duel/DefenseExperiment.jsx';
import {DEFENSE_VERSION} from '../src/duel/defense-stance.js';

const setQuery=q=>window.happyDOM.setURL('http://localhost/'+q);
beforeEach(()=>{localStorage.clear();try{sessionStorage.clear();}catch{}setQuery('?experiment=defense-v1');});
afterEach(()=>{cleanup();localStorage.clear();setQuery('/');});
const battle=()=>document.querySelector('.bp-battle');

describe('experiment isolation',()=>{
  it('mounts the battle without touching real saves or settings',()=>{
    localStorage.setItem('9zone-v10-run','SENTINEL');
    const setSpy=vi.spyOn(Storage.prototype,'setItem');
    render(<DefenseExperiment/>);
    expect(battle()).not.toBeNull();
    expect(localStorage.getItem('9zone-v10-run')).toBe('SENTINEL');
    expect(setSpy.mock.calls.filter(([k])=>k==='9zone-v10-run')).toHaveLength(0);
    expect(sessionStorage.length).toBe(0);
    setSpy.mockRestore();
  });
  it('reads no save on action either (memory state only)',()=>{
    const getSpy=vi.spyOn(Storage.prototype,'getItem');
    render(<DefenseExperiment/>);
    fireEvent.click(screen.getByTestId('bp-take'));
    expect(getSpy.mock.calls.filter(([k])=>k==='9zone-v10-run')).toHaveLength(0);
    getSpy.mockRestore();
  });
  it('production gate: DEV-only lazy entry, no static import in the main tree',()=>{
    const main=fs.readFileSync('src/main.jsx','utf8');
    expect(main).toMatch(/import\.meta\.env\.DEV&&[^]*experiment.*defense-v1/);
    expect(main).toMatch(/lazy\(\(\)=>import\(['"]\.\/duel\/DefenseExperiment\.jsx['"]\)\)/);
    expect(main).not.toMatch(/import .* from ['"]\.\/duel\/DefenseExperiment(\.jsx)?['"]/);
    const app=fs.readFileSync('src/duel/App.jsx','utf8');
    expect(app).not.toContain('DefenseExperiment');
    expect(app).not.toContain('defense-stance');
  });
  it('stays an A-only experiment (no B/C code paths)',()=>{
    expect(DEFENSE_VERSION).toBe('A-v1');
    for(const f of ['src/duel/defense-stance.js','src/duel/DefenseExperiment.jsx','src/duel/engine.js']){
      const t=fs.readFileSync(f,'utf8');
      expect(t).not.toMatch(/carryover|startingShift|experiment B|experiment C/i);
    }
  });
});

describe('experiment battle chrome',()=>{
  it('shows depth, case-agnostic fixed slots and no new buttons',()=>{
    render(<DefenseExperiment/>);
    expect(screen.getByTestId('defense-experiment')).not.toBeNull();
    const chip=document.querySelector('[data-testid="bp-defense"]');
    expect(chip.textContent).toContain('기본');
    expect(chip.textContent).toContain('공간 효과 없음');
    expect(document.querySelectorAll('.bp-defense-dots i')).toHaveLength(3);
    expect(document.querySelector('.bp-battle').textContent).not.toContain('BATTING PLAN LOCKED');
  });
  it('off mode renders the main-line UI with no defense chrome',()=>{
    setQuery('?experiment=defense-v1&off=1');
    render(<DefenseExperiment/>);
    expect(document.querySelector('[data-testid="bp-defense"]')).toBeNull();
    expect(document.querySelector('.bp-defense-effect')).toBeNull();
    expect(battle()).not.toBeNull();
  });
  it('diagnostic case preset pins hand, depth and runners',()=>{
    setQuery('?experiment=defense-v1&case=D5');
    render(<DefenseExperiment/>);
    expect(document.querySelector('[data-card-kind="squeeze"]')).not.toBeNull();
    expect(document.querySelector('[data-card-kind="slug"]')).not.toBeNull();
    expect(document.querySelector('[data-testid="bp-defense"]').textContent).toContain('후퇴');
    expect(document.querySelector('.bp-bases').getAttribute('aria-label')).toContain('1루');
  });
});

describe('experiment play with depth',()=>{
  it('advances the defense at the next batter and shows the reservation',()=>{
    setQuery('?experiment=defense-v1&case=D2&pending=1,0.5,0.9');
    render(<DefenseExperiment/>);
    fireEvent.click(document.querySelector('[data-card-kind="strike"]'));
    fireEvent.click([...document.querySelectorAll('.bp-cell')][1]); // aim high row
    fireEvent.click(screen.getByTestId('bp-swing'));
    const strip=screen.getByTestId('bp-result');
    expect(strip.textContent).toContain('다음 수비');
    expect(strip.textContent).toContain('후퇴');
    // Next batter applies the reservation.
    fireEvent.click(screen.getByTestId('bp-next'));
    expect(document.querySelector('[data-testid="bp-defense"]').textContent).toContain('후퇴');
  });
  it('conditional reactions never fix a future in the summary',()=>{
    setQuery('?experiment=defense-v1&case=D2');
    render(<DefenseExperiment/>);
    fireEvent.click(document.querySelector('[data-card-kind="strike"]'));
    expect(screen.getByTestId('bp-plan').textContent).toContain('높이에 따라 다음 수비 조정');
  });
  it('inspector shows current depth, never a reserved future before landing',()=>{
    render(<DefenseExperiment/>);
    fireEvent.click(screen.getByTestId('bp-inspect-open'));
    const body=screen.getByTestId('bp-inspect').textContent;
    expect(body).not.toContain('다음 수비');
  });
});
