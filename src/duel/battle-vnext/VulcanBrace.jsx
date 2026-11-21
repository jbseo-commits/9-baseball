import React from 'react';
/* Review-only equipment study on the existing ready drawing's 256px grid.
   No actor deformation, atlas replacement, hand/sole or release adjustment. */
export default function VulcanBrace({profile,frame,phase,action}){
 if(!profile?.id?.startsWith('vulcan-')||frame!==0||phase!=='deciding'&&action!=='prepare')return null;
 const open=profile.id==='vulcan-vent';
 return <svg className="bv-vulcan-brace" viewBox="0 0 256 256" aria-hidden="true" data-mode={open?'vent':'brace'} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} shapeRendering="crispEdges">
  {/* Both shells attach to the orange jersey shoulder seam, behind the hands. */}
  <g stroke="#231d24" strokeWidth="2" strokeLinejoin="miter">
   <path d={open?'M101 58L89 49 84 53 87 67 98 73 104 67Z':'M101 58L94 61 94 70 101 74 106 67Z'} fill="#a8532d"/>
   <path d={open?'M157 57L171 48 177 53 174 67 162 73 154 66Z':'M157 57L166 61 168 70 161 74 154 66Z'} fill="#a8532d"/>
   <path d={open?'M90 54L94 67M95 54L99 66M168 54L164 66M173 54L169 66':'M97 63L102 64M160 63L165 64'} fill="none" stroke="#f0cb86" strokeWidth="3"/>
  </g>
 </svg>;
}
