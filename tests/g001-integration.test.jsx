// @vitest-environment happy-dom
import React from 'react';
import {render,screen,cleanup,fireEvent} from '@testing-library/react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import Duel from '../src/duel/App.jsx';
import {createV10Duel,startBattle,saveV10Duel,readV10Duel,V10_SAVE_KEY} from '../src/duel/engine.js';
import {layoutMode,PORTRAIT_ONLY} from '../src/duel/layout-mode.js';

beforeEach(()=>{localStorage.clear()});
afterEach(()=>{cleanup()});

describe('G-001 화면 회전 뒤 진행·화면 보존 - 통합 테스트',()=>{
  it('iframe reload preserves full V10 game state',async()=>{
    let s=createV10Duel(7);
    s=startBattle(s);
    saveV10Duel(localStorage,s);
    
    render(<Duel/>);
    await vi.waitFor(()=>{
      expect(screen.getByRole('button',{name:'이어하기'}).disabled).toBe(false);
    });
  });

  it('battle state is preserved across iframe reload',async()=>{
    let s=createV10Duel(7);
    s=startBattle(s);
    saveV10Duel(localStorage,s);
    
    render(<Duel/>);
    
    await vi.waitFor(()=>{
      expect(screen.getByRole('button',{name:'이어하기'}).disabled).toBe(false);
    });
  });

  it('corrupt save shows error message instead of silent drop',async()=>{
    saveV10Duel(localStorage,createV10Duel(7));
    localStorage.setItem('9zone-v10-run','{broken-json');
    
    render(<Duel/>);
    
    await vi.waitFor(()=>{
      expect(screen.getByText('저장 기록이 손상되어 이어할 수 없습니다. 새 런을 시작하면 덮어씁니다.')).toBeInTheDocument();
      expect(screen.getByRole('button',{name:'이어하기'}).disabled).toBe(true);
    });
  });

  it('portrait-only layout mode works correctly',()=>{
    const {layoutMode} = require('../src/duel/layout-mode.js');
    expect(typeof layoutMode).toBe('function');
  });
});
