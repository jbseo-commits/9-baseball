// @vitest-environment happy-dom
import React,{useState} from 'react';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import RunMap from '../src/duel/RunMap.jsx';
import PitcherPortraitDialog from '../src/duel/PitcherPortraitDialog.jsx';
import {createV10Duel,selectV10Map} from '../src/duel/engine.js';

afterEach(()=>cleanup());

function InspectionHarness(){
  const map=selectV10Map(createV10Duel(17));
  const first=map.nodes.find(node=>node.opponent?.artId);
  const portraits=Object.fromEntries(map.nodes.filter(node=>node.opponent?.artId).map(node=>[node.opponent.artId,`/portrait/${node.opponent.artId}.png`]));
  const [picked,setPicked]=useState(null);
  return <>
    <RunMap {...map} reachableIds={[first.id]} pitcherPortraits={portraits} onInspectPitcher={opponent=>setPicked(opponent)}/>
    {picked&&<PitcherPortraitDialog opponent={picked} src={portraits[picked.artId]} onClose={()=>setPicked(null)}/>}
  </>;
}

describe('pitcher portrait inspection',()=>{
  it('opens the selected pitcher at full size without selecting a route',()=>{
    const onSelect=vi.fn();
    const map=selectV10Map(createV10Duel(17));
    const first=map.nodes.find(node=>node.opponent?.artId);
    const second=map.nodes.find(node=>node.act===first.act&&node.opponent?.artId&&node.opponent.artId!==first.opponent.artId);
    const onInspectPitcher=vi.fn();
    render(<RunMap {...map} reachableIds={[first.id]} pitcherPortraits={{[first.opponent.artId]:'/first.png',[second.opponent.artId]:'/second.png'}} onInspectPitcher={onInspectPitcher} onSelect={onSelect}/>);
    const button=screen.getByRole('button',{name:`${first.opponent.name} 투수 큰 그림 보기`});
    expect(button.querySelector('img').getAttribute('src')).toBe('/first.png');
    fireEvent.click(button);
    expect(onInspectPitcher).toHaveBeenCalledWith(first.opponent,expect.anything());
    fireEvent.click(screen.getByTestId(`v10-node-${second.id}`));
    const next=screen.getByRole('button',{name:`${second.opponent.name} 투수 큰 그림 보기`});
    expect(next.querySelector('img').getAttribute('src')).toBe('/second.png');
    fireEvent.click(next);
    expect(onInspectPitcher).toHaveBeenLastCalledWith(second.opponent,expect.anything());
    expect(onSelect).not.toHaveBeenCalled();
  });
  it('shows matching full-size art and closes with Escape or backdrop',()=>{
    render(<InspectionHarness/>);
    const opener=screen.getByRole('button',{name:/투수 큰 그림 보기/});
    fireEvent.click(opener);
    const dialog=screen.getByRole('dialog',{name:/투수 큰 그림/});
    const img=dialog.querySelector('img');
    expect(img.getAttribute('src')).toBe(opener.querySelector('img').getAttribute('src'));
    const close=screen.getByRole('button',{name:'큰 그림 닫기'});
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close,{key:'Escape'});
    expect(screen.queryByRole('dialog',{name:/투수 큰 그림/})).toBeNull();
    fireEvent.click(opener);
    fireEvent.click(document.querySelector('.pitcher-portrait-backdrop'));
    expect(screen.queryByRole('dialog',{name:/투수 큰 그림/})).toBeNull();
  });

  it('traps only at the active controls’ Tab boundaries and lets roster selection use its native button behavior',()=>{
    render(<InspectionHarness/>);
    fireEvent.click(screen.getByRole('button',{name:/투수 큰 그림 보기/}));
    const dialog=screen.getByRole('dialog',{name:/투수 큰 그림/});
    const controls=[...dialog.querySelectorAll('button:not([disabled])')];
    const close=screen.getByRole('button',{name:'큰 그림 닫기'});
    const roster=controls.filter(button=>button!==close);
    expect(roster.length).toBeGreaterThan(1);

    close.focus();
    const forwardFromClose=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});
    close.dispatchEvent(forwardFromClose);
    expect(forwardFromClose.defaultPrevented).toBe(false);

    const middle=roster[Math.floor(roster.length/2)];
    middle.focus();
    const middleForward=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});
    middle.dispatchEvent(middleForward);
    expect(middleForward.defaultPrevented).toBe(false);
    const middleBackward=new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true});
    middle.dispatchEvent(middleBackward);
    expect(middleBackward.defaultPrevented).toBe(false);

    const last=roster.at(-1);
    last.focus();
    const forwardAtEnd=new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true});
    last.dispatchEvent(forwardAtEnd);
    expect(forwardAtEnd.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(close);

    close.focus();
    const backwardAtStart=new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true});
    close.dispatchEvent(backwardAtStart);
    expect(backwardAtStart.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);

    const selected=roster[1];
    selected.focus();
    fireEvent.click(selected);
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(selected.querySelector('.dex-card-name').textContent).toContain(dialog.querySelector('.pitcher-portrait-frame img').alt.replace(' 투수 전신 원화',''));
    expect(document.activeElement).toBe(selected);
  });
});
