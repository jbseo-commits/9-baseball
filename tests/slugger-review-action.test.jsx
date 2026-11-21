// @vitest-environment happy-dom
import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,fireEvent,screen,cleanup} from '@testing-library/react';
vi.mock('../src/duel/StartPackPick.jsx',()=>({default:({onPick})=><button onClick={()=>onPick('contact-v1')}>forged locked selection</button>}));
import Duel from '../src/duel/App.jsx';
import {readV10Duel} from '../src/duel/engine.js';
afterEach(()=>{cleanup();localStorage.clear();vi.unstubAllEnvs();});
it('actual callback rejects a forged locked class without creating a run or changing achievements',()=>{
 vi.stubEnv('VITE_NORMAL_REVIEW','1');localStorage.setItem('9zone-hitter-career-v1','{"version":1,"runs":{}}');const before=localStorage.getItem('9zone-hitter-career-v1');render(<Duel reviewRun/>);fireEvent.click(screen.getByRole('button',{name:'새로운 게임',exact:true}));fireEvent.click(screen.getByText('forged locked selection'));expect(readV10Duel(localStorage)).toBeNull();expect(localStorage.getItem('9zone-hitter-career-v1')).toBe(before);
});
