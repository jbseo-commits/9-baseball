import {ATBAT_COMPOSITION as C} from './atbat-composition.js';
export const privateFieldReview=review=>import.meta.env.VITE_NORMAL_REVIEW==='1'&&review===true;
export const contactMotionEligible=(review,hitter)=>privateFieldReview(review)&&hitter?.version===1&&hitter.id==='contact-v1';
export const privateFieldPaths=(kind,base='./')=>kind==='contact'?{json:base+'contact-motion-v1/contact.json',texture:base+'contact-motion-v1/contact.webp'}:kind==='emerald'?{texture:base+'emerald-ready-v1/ready.png'}:null;
const point=p=>p&&typeof p==='object'&&!Array.isArray(p)&&['x','y'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=192);
export function validateContactMotion(raw){
 if(!raw||raw.sourceWidth!==192||raw.sourceHeight!==192||raw.columns!==4||raw.rows!==4||raw.anchor?.x!==65||raw.anchor?.y!==175||!Array.isArray(raw.frames)||raw.frames.length!==14)return null;
 if(raw.event!==undefined&&!point(raw.event))return null;
 if(!raw.frames.every((f,i)=>f&&typeof f==='object'&&!Array.isArray(f)&&(f.id===undefined||f.id===i)&&(f.contact===undefined||point(f.contact))))return null;
 // Private metadata is a registration gate, never authority for gameplay/world geometry.
 return {...C.batter,sourceWidth:192,sourceHeight:192,columns:4,rows:4,anchor:{x:65,y:175},worldFoot:{...C.batter.worldFoot},worldHeight:1100,event:{x:173,y:86},readyImage:null,frames:C.batter.frames.map(f=>({name:f.name}))};
}
export const isReviewContactActor=a=>a?.kind==='review-contact-atlas'&&a.classId==='contact-v1';
export const disposePrivateFieldArt=a=>{if(a?.url?.startsWith('blob:'))URL.revokeObjectURL(a.url);};
export async function decodePrivateTexture(url,signal,mime='image/webp'){
 const response=await fetch(url,{signal,credentials:'same-origin',redirect:'error'});
 if(!response.ok||response.redirected)throw Error('texture unavailable');
 const blob=await response.blob();if(blob.type!==mime||blob.size>8*1024*1024)throw Error('texture format');
 const objectUrl=URL.createObjectURL(blob);
 let onAbort;
 try{
  const image=new Image();
  const aborted=new Promise((_,reject)=>{onAbort=()=>{image.removeAttribute('src');reject(Error('texture aborted'));};if(signal?.aborted)onAbort();else signal?.addEventListener('abort',onAbort,{once:true});});
  if(signal?.aborted)await aborted;
  image.src=objectUrl;
  await Promise.race([image.decode(),aborted]);
  if(signal?.aborted)throw Error('texture aborted');
  return {width:image.naturalWidth,height:image.naturalHeight,url:objectUrl};
 }catch(e){URL.revokeObjectURL(objectUrl);throw e;}
 finally{signal?.removeEventListener('abort',onAbort);}
}
export async function loadPrivateFieldArt({kind,base='./',signal,fetcher=globalThis.fetch,decode=decodePrivateTexture}={}){
 const paths=privateFieldPaths(kind,base);if(!paths)return null;
 let texture=null;
 try{
  let meta=null;
  if(kind==='contact'){
   const response=await fetcher(paths.json,{signal,credentials:'same-origin',redirect:'error'});
   if(!response.ok||response.redirected)return null;
   const text=await response.text();if(text.length>32768)return null;
   meta=validateContactMotion(JSON.parse(text));if(!meta||signal?.aborted)return null;
  }
  texture=await decode(paths.texture,signal,kind==='emerald'?'image/png':'image/webp');
  const dim=kind==='contact'?768:256;
  if(signal?.aborted||texture.width!==dim||texture.height!==dim||!texture.url?.startsWith('blob:')){disposePrivateFieldArt(texture);return null;}
  return kind==='contact'?{kind:'review-contact-atlas',classId:'contact-v1',url:texture.url,meta}:{kind:'review-emerald-ready',artId:'boss-01-emerald-tyrant',url:texture.url};
 }catch{disposePrivateFieldArt(texture);return null;}
}
