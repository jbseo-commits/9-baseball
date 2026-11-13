import url from '../../../assets/production-art/batter-course-v2/batter-course-4x4.webp';
import registry from '../../../assets/production-art/batter-course-v2/contact-registry.json';
import {courseTarget} from './course-presentation.js';
export const COURSE_BATTER_ATLAS_URL=url;
export const COURSE_BATTER_META=Object.freeze({sourceWidth:1024,sourceHeight:768,columns:4,rows:4,
  worldHeight:1200,anchor:Object.freeze({x:210,y:700}),worldFoot:Object.freeze({x:200,y:960}),
  frameCount:12,registrationId:registry.id,atlasSha256:registry.atlasSha256});
let decodedImage=null;
export async function decodeCourseBatterAtlas(createImage=()=>new Image()){
  const image=createImage();image.src=url;
  try{await image.decode();if(image.naturalWidth!==4096||image.naturalHeight!==3072)return false;decodedImage=image;return true;}
  catch{return false;}
}
export const retainedCourseImage=()=>decodedImage;
/* This capability belongs to one compiled, lossless source and exact world mapping.
   Nominal diagnostics in courseRenderModel never grant this capability. */
export function registeredCourseContact(atlas,zone){
  const m=atlas?.meta;
  if(atlas?.url!==url||m?.registrationId!==registry.id||m.atlasSha256!==registry.atlasSha256
    ||m.frameCount!==12||m.sourceWidth!==1024||m.sourceHeight!==768||m.worldHeight!==1200||m.columns!==4||m.rows!==4
    ||m.anchor?.x!==210||m.anchor?.y!==700||m.worldFoot?.x!==200||m.worldFoot?.y!==960)return null;
  if(!Number.isInteger(zone)||zone<0||zone>9)return null;
  const frame=zone===9?10:Math.floor(zone/3)*3+1;
  if(frame<0||frame>=m.frameCount)return null;
  const record=registry.contacts.find(x=>x.frame===frame),target=courseTarget(zone);
  const check=record?.targets.find(x=>x.zone===zone);
  return check&&check.distance<=8&&check.point[0]===target.x&&check.point[1]===target.y
    ?Object.freeze({frame,zone,point:target,sourceSha256:registry.atlasSha256,maskSha256:record.maskSha256,registrationId:registry.id}):null;
}
