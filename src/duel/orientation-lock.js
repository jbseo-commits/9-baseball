/* 휴대폰 가로 전용(2026-11-04). 모바일 브라우저의 주소창이 가로 화면 높이를 크게 먹어 화면이 잘리므로,
   터치 기기에서 첫 탭(사용자 제스처)에 전체화면을 요청하고 가로로 고정한다. 지원하지 않는 브라우저
   (iPhone Safari 등)는 아무 일도 하지 않고, 실패해도 게임 입력에는 영향이 없다. 전체화면에서 빠져나오면
   다음 탭에서 다시 요청한다. */
export function installOrientationLock(win=typeof window!=='undefined'?window:null){
  const doc=win?.document;
  if(!doc||!win.matchMedia?.('(pointer: coarse)')?.matches)return ()=>{};
  const el=doc.documentElement;
  const request=el.requestFullscreen||el.webkitRequestFullscreen;
  if(!request)return ()=>{};
  const isFull=()=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
  const lock=()=>{try{const p=win.screen?.orientation?.lock?.('landscape');p?.catch?.(()=>{});}catch{}};
  const onTap=()=>{
    if(isFull())return;
    try{
      const p=request.call(el,{navigationUI:'hide'});
      if(p?.then)p.then(lock,()=>{});else lock();
    }catch{}
  };
  doc.addEventListener('pointerup',onTap,{passive:true});
  return ()=>doc.removeEventListener('pointerup',onTap);
}
