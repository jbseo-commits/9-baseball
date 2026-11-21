export const SLUGGER_CARD_KINDS=Object.freeze(['slug','gapHunter','loadPower']);
const files=Object.freeze({slug:'slugger-cards-v1/slug.webp',gapHunter:'slugger-cards-v1/gapHunter.webp',loadPower:'slugger-cards-v1/loadPower.webp'});
export const sluggerCardPath=(kind,base='./')=>Object.hasOwn(files,kind)?base+files[kind]:null;
export const disposeCardArt=art=>{if(art?.url?.startsWith('blob:'))URL.revokeObjectURL(art.url);};
const decode=async url=>{const image=new Image();image.src=url;await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};};
// No redirects, candidate metadata or remote URLs. Original art stays visible
// until a bounded fetch+decode succeeds. Abort owns every temporary blob.
export async function loadSluggerCardArt(kind,{enabled=false,base='./',signal,timeout=1500,fetcher=globalThis.fetch,decoder=decode}={}){
 const path=enabled&&sluggerCardPath(kind,base);if(!path||signal?.aborted)return null;
 const controller=new AbortController(),abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});
 let url=null,timer;
 try{
  const cancelled=new Promise((_,reject)=>{controller.signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});});
  timer=setTimeout(abort,timeout);
  const task=async()=>{
   const response=await fetcher(path,{signal:controller.signal,redirect:'error',credentials:'same-origin'});
   if(!response.ok||response.redirected)throw Error('unavailable');
   const blob=await response.blob();if(controller.signal.aborted||blob.type!=='image/webp'||blob.size>1024*1024||blob.size===0)throw Error('format');
   url=URL.createObjectURL(blob);const size=await decoder(url);
   if(controller.signal.aborted||size.width!==384||size.height!==256)throw Error('dimensions');
   return {url,position:'50% 50%',size:'contain',privateSlugger:true};
  };
  return await Promise.race([task(),cancelled]);
 }catch{if(url)URL.revokeObjectURL(url);return null;}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
