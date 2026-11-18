// @vitest-environment happy-dom
import {afterEach,describe,it,expect,vi} from 'vitest';

const SAVE='9zone-v10-run';
const savedObserver=globalThis.MutationObserver;
const savedRaf=globalThis.requestAnimationFrame;

async function loadRelicUi(search){
  vi.resetModules();
  window.history.replaceState({},'',`/${search}`);
  document.body.innerHTML='<main class="duel-combat"></main><section class="reward-screen"></section>';
  const observe=vi.fn();
  vi.stubGlobal('MutationObserver',class{constructor(callback){this.callback=callback;}observe(...args){observe(...args);}disconnect(){}});
  vi.stubGlobal('requestAnimationFrame',callback=>{callback(0);return 1;});
  const read=vi.spyOn(window.Storage.prototype,'getItem');
  await import('../src/duel/v10-relic-ui.js');
  return {observe,read};
}

afterEach(()=>{
  vi.restoreAllMocks();vi.unstubAllGlobals();
  if(savedObserver)globalThis.MutationObserver=savedObserver;
  if(savedRaf)globalThis.requestAnimationFrame=savedRaf;
  window.localStorage.clear();document.body.innerHTML='';window.history.replaceState({},'','/');
});

describe('v10 relic decoration storage boundary',()=>{
  it.each([
    ['?showcase=card-decision&battleUi=vnext','card-decision memory lab'],
    ['?battleUi=vnext&battlePlay=1','playable memory run'],
  ])('does not observe or read the production save for the %s',async search=>{
    window.localStorage.setItem(SAVE,JSON.stringify({relics:['firstPitch']}));
    const {observe,read}=await loadRelicUi(search);
    expect(observe).not.toHaveBeenCalled();
    expect(read.mock.calls.filter(([key])=>key===SAVE)).toHaveLength(0);
    expect(document.querySelector('.v10-relic-rack')).toBeNull();
  });
  it('keeps observer decoration and save reads on the ordinary game route',async()=>{
    window.localStorage.setItem(SAVE,JSON.stringify({relics:['firstPitch']}));
    const {observe,read}=await loadRelicUi('?battleUi=vnext');
    expect(observe).toHaveBeenCalledWith(document.documentElement,{subtree:true,childList:true,characterData:true});
    expect(read.mock.calls.filter(([key])=>key===SAVE).length).toBeGreaterThan(0);
    expect(document.querySelector('.v10-relic-rack')).not.toBeNull();
  });
});
