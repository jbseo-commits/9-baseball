// @vitest-environment happy-dom
import {afterEach,describe,it,expect,vi} from 'vitest';

const originalGlobals=new Map();
function replaceGlobal(name,value){
  if(!originalGlobals.has(name))originalGlobals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
  Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
}
function restoreGlobals(){
  for(const [name,descriptor] of originalGlobals){
    if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];
  }
  originalGlobals.clear();
}
async function observeRoute(search){
  vi.resetModules();let observerCount=0,saveReads=0,mutationCallback;const frames=[],listeners={};
  const location={search};replaceGlobal('location',location);
  replaceGlobal('localStorage',{getItem:key=>{if(key==='9zone-v10-run')saveReads++;return JSON.stringify({relics:['firstPitch']});}});
  replaceGlobal('document',{
    documentElement:{},
    querySelector:()=>null,
    querySelectorAll:()=>[],
  });
  replaceGlobal('window',{addEventListener:(name,callback)=>{listeners[name]=callback;}});
  replaceGlobal('MutationObserver',class{constructor(callback){mutationCallback=callback;}observe(){observerCount++;}});
  replaceGlobal('requestAnimationFrame',callback=>{frames.push(callback);return frames.length;});
  await import('../src/duel/v10-relic-ui.js');
  return {observerCount,get saveReads(){return saveReads;},setSearch:value=>{location.search=value;},flush:()=>frames.shift()?.(),fireStorage:()=>listeners.storage?.(),notifyMutation:()=>mutationCallback?.()};
}
afterEach(()=>{restoreGlobals();vi.resetModules();});

describe('relic UI ignores memory-only VNext previews',()=>{
  it.each([
    ['playable memory run','?battleUi=vnext&battlePlay=1'],
    ['standalone fixture','?battleUi=vnext&battleFixture=cinema-homer'],
    ['unknown nonempty fixture fallback','?battleUi=vnext&battleFixture=unknown-preview'],
    ['comparison page','?battleUi=vnext&battleCompare=1'],
    ['embedded legacy child','?battleUi=vnext&battleCompareChild=legacy'],
    ['embedded VNext child','?battleUi=vnext&battleCompareChild=vnext'],
    ['standalone legacy child','?battleUi=vnext&battleFixture=cinema-homer&battleCompareVariant=legacy'],
  ])('does not install the relic observer or read the main save on %s',async(_name,search)=>{
    const probe=await observeRoute(search);expect(probe.observerCount).toBe(0);expect(probe.saveReads).toBe(0);expect(probe.flush()).toBeUndefined();
  });

  it.each([
    ['ordinary legacy app','?battleUi=legacy'],
    ['ordinary VNext app','?battleUi=vnext'],
    ['empty fixture query','?battleUi=vnext&battleFixture='],
    ['invalid compare child without fixture','?battleUi=vnext&battleCompareChild=other'],
    ['automatic-layout comparison flag','?battleCompare=1'],
    ['legacy UI with the pre-existing raw playable flag','?battleUi=legacy&battlePlay=1'],
  ])('keeps relic save observation on %s',async(_name,search)=>{
    const probe=await observeRoute(search);
    if(search.includes('battlePlay=1')){
      expect(probe.observerCount).toBe(0);expect(probe.saveReads).toBe(0);return;
    }
    expect(probe.observerCount).toBe(1);expect(probe.saveReads).toBe(0);probe.flush();expect(probe.saveReads).toBe(1);
  });

  it('checks the memory route again before reading when a queued observer refresh runs after URL change',async()=>{
    const probe=await observeRoute('?battleUi=legacy');expect(probe.observerCount).toBe(1);
    probe.flush();const readsBeforeQueuedRefresh=probe.saveReads;expect(readsBeforeQueuedRefresh).toBe(1);
    probe.notifyMutation();probe.setSearch('?battleUi=vnext&battleFixture=cinema-homer');probe.flush();
    expect(probe.saveReads).toBe(readsBeforeQueuedRefresh);
    probe.fireStorage();probe.flush();expect(probe.saveReads).toBe(readsBeforeQueuedRefresh);
  });

  it('still decorates a real ordinary-game relic rack from the saved V10 relic state',async()=>{
    vi.resetModules();window.history.replaceState({},'','/?battleUi=legacy');
    document.body.innerHTML='<main class="duel-combat"></main><section class="reward-screen"></section>';
    localStorage.setItem('9zone-v10-run',JSON.stringify({relics:['firstPitch'],stats:{pitches:1},v10:{lastCombat:{relicEvents:['firstPitch']}}}));
    const observe=vi.fn();vi.stubGlobal('MutationObserver',class{constructor(callback){this.callback=callback;}observe(...args){observe(...args);}disconnect(){}});
    vi.stubGlobal('requestAnimationFrame',callback=>{callback(0);return 1;});
    const read=vi.spyOn(window.Storage.prototype,'getItem');
    await import('../src/duel/v10-relic-ui.js');
    expect(observe).toHaveBeenCalledWith(document.documentElement,{subtree:true,childList:true,characterData:true});
    expect(read.mock.calls.filter(([key])=>key==='9zone-v10-run').length).toBeGreaterThan(0);
    expect(document.querySelector('.v10-relic-rack')?.textContent).toContain('초구 노림표');
    expect(document.querySelector('.v10-relic-trigger')?.textContent).toContain('firstPitch');
  });
});
