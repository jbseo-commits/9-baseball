/* Runtime deformation of existing artwork. No new raster frames are invented.
 * Manual anatomical landmarks drive local bone skinning. Landmark vertices are
 * part of the mesh so a painted hand/barrel and its reported point agree.
 * WebGL draws one indexed mesh per actor; Canvas is the portable fallback. */
(function(global){
  'use strict';
  function circle(a,b,c){
    const ax=a[0],ay=a[1],bx=b[0],by=b[1],cx=c[0],cy=c[1],d=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by));
    if(Math.abs(d)<1e-10)return null;
    const aa=ax*ax+ay*ay,bb=bx*bx+by*by,cc=cx*cx+cy*cy,x=(aa*(by-cy)+bb*(cy-ay)+cc*(ay-by))/d,y=(aa*(cx-bx)+bb*(ax-cx)+cc*(bx-ax))/d;
    return{x,y,r:(x-ax)**2+(y-ay)**2};
  }
  function triangulate(points){
    const n=points.length,p=[...points,[-10,-10],[10,-10],[0,10]];
    let triangles=[{v:[n,n+1,n+2],c:circle(p[n],p[n+1],p[n+2])}];
    for(let i=0;i<n;i++){
      const edges=new Map(),keep=[];
      for(const t of triangles){if((p[i][0]-t.c.x)**2+(p[i][1]-t.c.y)**2>t.c.r+1e-10){keep.push(t);continue;}
        for(let j=0;j<3;j++){const a=t.v[j],b=t.v[(j+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);if(edges.has(key))edges.delete(key);else edges.set(key,[a,b]);}
      }
      for(const [a,b]of edges.values()){const c=circle(p[a],p[b],p[i]);if(c)keep.push({v:[a,b,i],c});}triangles=keep;
    }
    return triangles.filter(t=>t.v.every(i=>i<n)).flatMap(t=>t.v);
  }
  const cache=new Map();
  function inPolygon(point,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[j],b=polygon[i],dx=b[0]-a[0],dy=b[1]-a[1],cross=(point[0]-a[0])*dy-(point[1]-a[1])*dx;if(Math.abs(cross)<1e-6&&point[0]>=Math.min(a[0],b[0])-1e-6&&point[0]<=Math.max(a[0],b[0])+1e-6&&point[1]>=Math.min(a[1],b[1])-1e-6&&point[1]<=Math.max(a[1],b[1])+1e-6)return true;if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
  function boneList(pins){
    const pairs='shoulderThrow' in pins?
      [['pelvis','neck'],['shoulderThrow','shoulderGlove'],['neck','head'],['head','crown'],['shoulderThrow','elbowThrow'],['elbowThrow','wristThrow'],['wristThrow','handThrow'],['shoulderGlove','elbowGlove'],['elbowGlove','wristGlove'],['wristGlove','glove'],['hipDrive','kneeDrive'],['kneeDrive','ankleDrive'],['ankleDrive','rearFoot'],['hipLead','kneeLead'],['kneeLead','ankleLead'],['ankleLead','frontFoot'],['head','hairRoot'],['hairRoot','hairHigh'],['hairHigh','hairOuter'],['hairOuter','hairLow']]:
      [['pelvis','neck'],['shoulderRear','shoulderFront'],['neck','head'],['head','crown'],['shoulderRear','elbowRear'],['elbowRear','grip'],['shoulderFront','elbowFront'],['elbowFront','grip'],['hipRear','kneeRear'],['kneeRear','ankleRear'],['ankleRear','rearFoot'],['hipFront','kneeFront'],['kneeFront','ankleFront'],['ankleFront','frontFoot'],['grip','batTip'],['batKnob','grip']];
    return pairs.map(([a,b])=>({a,b,from:pins[a],to:pins[b]}));
  }
  function influences(vertices,bones,occludedPins=[],surfaceRegions={}){
    const smooth=p=>p*p*(3-2*p),clamp=p=>Math.max(0,Math.min(1,p));
    const hair=bone=>/hair/i.test(bone.a)||/hair/i.test(bone.b);
    const arm=bone=>['Throw','Glove'].some(side=>
      ['shoulder','elbow','wrist'].some(part=>bone.a===part+side)&&
      ['elbow','wrist','hand','glove'].some(part=>bone.b===part+(part==='glove'?'':side)));
    const joints=new Map();
    for(let i=0;i<bones.length;i++)for(const [name,point]of [[bones[i].a,bones[i].from],[bones[i].b,bones[i].to]]){
      if(!joints.has(name))joints.set(name,{name,point,incident:[]});joints.get(name).incident.push(i);
    }
    const jointList=Array.from(joints.values()).filter(j=>!occludedPins.includes(j.name));
    for(const joint of jointList){
      const spacing=Math.min(...jointList.filter(other=>other!==joint).map(other=>Math.hypot(joint.point[0]-other.point[0],joint.point[1]-other.point[1])));
      joint.radius=Math.min(18,spacing*.45);
    }
    const point=name=>joints.get(name)?.point,pitcher=joints.has('shoulderThrow');
    const leadThigh=bones.findIndex(b=>b.a==='hipLead'&&b.b==='kneeLead'),
      leadShin=bones.findIndex(b=>b.a==='kneeLead'&&b.b==='ankleLead'),
      crossedLead=pitcher&&point('kneeLead')[0]<point('hipLead')[0]&&point('kneeLead')[1]<point('kneeDrive')[1];
    const headBone=bone=>bone.a==='neck'&&bone.b==='head';
    const bodyBone=bone=>bone.a==='pelvis'&&bone.b==='neck';
    let face=null,body=[];
    if(pitcher){
      const h=point('head'),n=point('neck'),c=point('crown'),dx=n[0]-c[0],dy=n[1]-c[1],length=Math.hypot(dx,dy),
        shoulders=Math.hypot(point('shoulderThrow')[0]-point('shoulderGlove')[0],point('shoulderThrow')[1]-point('shoulderGlove')[1]);
      face={h,vertical:[dx/length,dy/length],rx:Math.max(36,shoulders*.36),ry:Math.max(Math.hypot(h[0]-c[0],h[1]-c[1]),Math.hypot(h[0]-n[0],h[1]-n[1]))*1.08};
      const corners=['shoulderThrow','shoulderGlove','hipDrive','hipLead'].map(point).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lower=[],upper=[];
      for(const p of corners){while(lower.length>1&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);}
      for(const p of corners.slice().reverse()){while(upper.length>1&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}
      body=lower.slice(0,-1).concat(upper.slice(0,-1));
    }
    if(!pitcher){const h=point('head'),n=point('neck'),c=point('crown'),dx=n[0]-c[0],dy=n[1]-c[1],length=Math.hypot(dx,dy);face={h,vertical:[dx/length,dy/length],rx:Math.max(45,Math.hypot(h[0]-c[0],h[1]-c[1])*1.05),ry:Math.max(Math.hypot(h[0]-c[0],h[1]-c[1]),Math.hypot(h[0]-n[0],h[1]-n[1]))*1.1};}
    const ownedSurfaces=Object.values(surfaceRegions).map(region=>({...region,index:bones.findIndex(b=>b.a===region.bone[0]&&b.b===region.bone[1])})).filter(region=>region.index>=0);
    function surfaceOwnership(p,poly,feather=6){
      let inside=false,distance=Infinity;
      for(let i=0,j=poly.length-1;i<poly.length;j=i++){
        const a=poly[j],b=poly[i],dx=b[0]-a[0],dy=b[1]-a[1],q=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy));
        distance=Math.min(distance,Math.hypot(p[0]-a[0]-q*dx,p[1]-a[1]-q*dy));
        if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
      }
      return inside||distance<1e-6?1:feather>0?1-smooth(clamp(distance/feather)):0;
    }
    function torsoOwnership(p){
      if(body.length<3)return 0;
      let edgeDistance=Infinity;
      for(let i=0;i<body.length;i++){
        const a=body[i],b=body[(i+1)%body.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),signed=((p[0]-a[0])*dy-(p[1]-a[1])*dx)/length;
        if(signed>0)return 0;edgeDistance=Math.min(edgeDistance,-signed);
      }
      return smooth(clamp(edgeDistance/12));
    }
    const normalize=choices=>{const total=choices.reduce((s,c)=>s+c.score,0);return choices.map(c=>({index:c.index,weight:c.score/total}));};
    return vertices.map(p=>{
      const choices=bones.map((bone,index)=>{
        const a=bone.from,b=bone.to,dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy,
          q=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)),
          distance=(p[0]-a[0]-q*dx)**2+(p[1]-a[1]-q*dy)**2;
        return{index,distance,score:1/(distance+36)};
      });
      // Hair and a throwing forearm overlap in the painted projection. Their
      // screen distance alone cannot assign skin to the hair chain: protect
      // each arm's 18px core, with an 8px feather back to ordinary weighting.
      const armDistance=Math.sqrt(Math.min(...choices.filter(c=>arm(bones[c.index])).map(c=>c.distance)));
      const hairWeight=smooth(clamp((armDistance-18)/8));
      for(const choice of choices)if(hair(bones[choice.index]))choice.score*=hairWeight;
      if(face){
        const dx=p[0]-face.h[0],dy=p[1]-face.h[1],v=face.vertical,
          radius=Math.hypot((dx*v[1]-dy*v[0])/face.rx,(dx*v[0]+dy*v[1])/face.ry),
          headOwnership=1-smooth(clamp((radius-.82)/.24)),bodyOwnership=torsoOwnership(p)*hairWeight;
        // A face and jersey panel each follow one bone so a turn cannot mix
        // opposing bone rotations into a squeezed outline. Nearby ponytails
        // and crossing arms retain their own ownership outside these surfaces.
        for(const choice of choices){const bone=bones[choice.index];
          if(!headBone(bone))choice.score*=1-headOwnership;
          if(!bodyBone(bone))choice.score*=1-bodyOwnership;
        }
      }
      let result=normalize(choices.filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,2));
      // A hard landmark and its adjacent regular grid vertex must approach the
      // same transform. Around a joint, smoothly use its incident bones, all
      // of which map the joint itself to exactly the same target point.
      let nearest=null,distance=Infinity;
      for(const joint of jointList){const d=Math.hypot(p[0]-joint.point[0],p[1]-joint.point[1]);if(d<distance){nearest=joint;distance=d;}}
      if(nearest&&distance<nearest.radius){
        const selected=nearest.incident.map(index=>({index,score:choices[index].score})).filter(c=>c.score>0);
        if(selected.length){
          const w=1-smooth(distance/nearest.radius),local=normalize(selected),combined=new Map();
          for(const influence of result)combined.set(influence.index,influence.weight*(1-w));
          for(const influence of local)combined.set(influence.index,(combined.get(influence.index)||0)+influence.weight*w);
          result=Array.from(combined,([index,weight])=>({index,weight}));
        }
      }
      // A lifted thigh is painted in front of the standing leg. Nearest-bone
      // blending alone assigns its cloth to the hidden drive thigh, tearing
      // the pants when the knee opens. Give the visible crossed thigh its own
      // capsule, while its nearer shin keeps the black stocking underneath.
      if(crossedLead){
        const thigh=choices[leadThigh],shin=choices[leadShin],d=Math.sqrt(thigh.distance),
          a=bones[leadThigh].from,b=bones[leadThigh].to,dx=b[0]-a[0],dy=b[1]-a[1],
          q=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy),
          cloth=1-smooth(clamp((d-42)/13)),stocking=smooth(clamp((Math.sqrt(shin.distance)-26)/10)),
          ownership=q<.08||q>1.05?0:cloth*stocking;
        if(ownership>0){
          const combined=new Map(result.map(i=>[i.index,i.weight*(1-ownership)]));
          combined.set(leadThigh,(combined.get(leadThigh)||0)+ownership);
          result=Array.from(combined,([index,weight])=>({index,weight}));
        }
        const s=bones[leadShin].from,e=bones[leadShin].to,sx=e[0]-s[0],sy=e[1]-s[1],
          shinQ=((p[0]-s[0])*sx+(p[1]-s[1])*sy)/(sx*sx+sy*sy),
          shinOwnership=shinQ<0||shinQ>1?0:1-stocking;
        if(shinOwnership>0){
          const combined=new Map(result.map(i=>[i.index,i.weight*(1-shinOwnership)]));
          combined.set(leadShin,(combined.get(leadShin)||0)+shinOwnership);
          result=Array.from(combined,([index,weight])=>({index,weight}));
        }
      }
      // Painted back panels and shoes have known foreground ownership.
      // A swinging bat or neighboring shin cannot pull those pixels with it.
      for(const region of ownedSurfaces){const w=surfaceOwnership(p,region.polygon,region.feather??6);if(w>0){const combined=new Map(result.map(influence=>[influence.index,influence.weight*(1-w)]));combined.set(region.index,(combined.get(region.index)||0)+w);result=Array.from(combined,([index,weight])=>({index,weight})).filter(influence=>influence.weight>0);}}
      return result;
    });
  }
  function compile(pins,width=512,height=768){
    const occludedPins=pins.occludedPins||[],surfaceRegions=pins.surfaceRegions||{},key=JSON.stringify([pins,width,height,occludedPins,surfaceRegions]);if(cache.has(key))return cache.get(key);
    const names=[],controls=[];
    for(const [name,point]of Object.entries(pins)){if(controls.some(p=>Math.hypot(p[0]-point[0]/768,p[1]-point[1]/768)<1e-5))continue;names.push(name);controls.push([point[0]/768,point[1]/768]);}
    const vertices=[];
    for(let y=0;y<=24;y++)for(let x=0;x<=16;x++)vertices.push([x*width/16,y*height/24]);
    for(const p of controls){const q=[p[0]*768,p[1]*768];if(!vertices.some(v=>Math.hypot(v[0]-q[0],v[1]-q[1])<1e-5))vertices.push(q);}
    // Explicit painted boundaries are mesh vertices too. Thin rigid bats
    // cannot rely on the coarse body grid to keep their straight silhouette.
    for(const region of Object.values(surfaceRegions))for(const point of region.polygon){if(!vertices.some(v=>Math.hypot(v[0]-point[0],v[1]-point[1])<1e-5))vertices.push(point.slice());}
    const bones=boneList(pins),weights=influences(vertices,bones,occludedPins,surfaceRegions),landmarks=vertices.map(v=>names.find(name=>!occludedPins.includes(name)&&Math.hypot(pins[name][0]-v[0],pins[name][1]-v[1])<1e-5&&!Object.values(surfaceRegions).some(region=>inPolygon(v,region.polygon)&&!region.bone.includes(name)))||null);
    const rawIndices=triangulate(vertices.map(v=>[v[0]/768,v[1]/768]));
    // The ponytail turns behind the head in depth. Paint its triangles first,
    // so a foreshortened tail can pass behind the face/jersey instead of being
    // stretched upward just to keep every projected hair segment long.
    const triangles=[];
    for(let i=0;i<rawIndices.length;i+=3){const ids=rawIndices.slice(i,i+3),hair=ids.reduce((sum,id)=>sum+weights[id].reduce((w,influence)=>w+(/hair/i.test(bones[influence.index].a+' '+bones[influence.index].b)?influence.weight:0),0),0)>1.25;triangles.push({ids,hair});}
    triangles.sort((a,b)=>Number(b.hair)-Number(a.hair));
    const indices=Uint16Array.from(triangles.flatMap(t=>t.ids)),data={names,vertices,weights,bones,landmarks,pins,occludedPins,surfaceRegions,indices,width,height};cache.set(key,data);return data;
  }
  function deform(mesh,target){
    const result=new Float32Array(mesh.vertices.length*2);
    const transforms=mesh.bones.map(b=>{const a=b.from,s=b.to,A=target[b.a],B=target[b.b],dx=s[0]-a[0],dy=s[1]-a[1],length=Math.hypot(dx,dy),u=[dx/length,dy/length],tx=B[0]-A[0],ty=B[1]-A[1],tLength=Math.max(.001,Math.hypot(tx,ty)),v=[tx/tLength,ty/tLength],ratio=tLength/length,width=Math.max(.85,Math.min(1.12,Math.sqrt(ratio)));return{a,A,u,v,ratio,width};});
    for(let i=0;i<mesh.vertices.length;i++){
      const mark=mesh.landmarks[i];if(mark){result[i*2]=target[mark][0];result[i*2+1]=target[mark][1];continue;}
      const p=mesh.vertices[i];let x=0,y=0;
      for(const influence of mesh.weights[i]){const b=transforms[influence.index],dx=p[0]-b.a[0],dy=p[1]-b.a[1],along=(dx*b.u[0]+dy*b.u[1])*b.ratio,across=(-dx*b.u[1]+dy*b.u[0])*b.width;x+=(b.A[0]+along*b.v[0]-across*b.v[1])*influence.weight;y+=(b.A[1]+along*b.v[1]+across*b.v[0])*influence.weight;}
      result[i*2]=x;result[i*2+1]=y;
    }
    return result;
  }
  function mapPoint(pins,target,p){
    const mesh=compile(pins),index=mesh.vertices.findIndex(v=>Math.hypot(v[0]-p[0],v[1]-p[1])<1e-5);
    if(index>=0){const out=deform(mesh,target);return[out[index*2],out[index*2+1]];}
    const pointMesh={...mesh,vertices:[p],weights:influences([p],mesh.bones,mesh.occludedPins,mesh.surfaceRegions),landmarks:[null]},out=deform(pointMesh,target);return[out[0],out[1]];
  }
  class Painter{
    constructor(canvas){
      this.layer=(canvas.ownerDocument||global.document)?.createElement('canvas');this.gl=null;this.textures=new Map();
      if(this.layer){try{this.gl=this.layer.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:false,preserveDrawingBuffer:false});}catch(_){}}
      if(!this.gl)return;
      const gl=this.gl,shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
      const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 position; attribute vec2 uv; uniform vec2 size; varying vec2 tex; void main(){gl_Position=vec4(position.x/size.x*2.0-1.0,1.0-position.y/size.y*2.0,0.0,1.0);tex=uv;}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float; varying vec2 tex; uniform sampler2D art; void main(){gl_FragColor=texture2D(art,tex);}'));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
      this.program=program;this.position=gl.getAttribLocation(program,'position');this.uv=gl.getAttribLocation(program,'uv');this.size=gl.getUniformLocation(program,'size');this.buffer=gl.createBuffer();this.indexBuffer=gl.createBuffer();gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.uniform1i(gl.getUniformLocation(program,'art'),0);
    }
    begin(width,height,dpr=1){
      this.width=width;this.height=height;if(!this.gl)return;
      const gl=this.gl,w=Math.round(width*dpr),h=Math.round(height*dpr);if(this.layer.width!==w||this.layer.height!==h){this.layer.width=w;this.layer.height=h;}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.uniform2f(this.size,width,height);
    }
    texture(image){
      const gl=this.gl;if(this.textures.has(image))return this.textures.get(image);
      const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);this.textures.set(image,t);return t;
    }
    draw(ctx,image,rect,sourcePins,targetPins,placement){
      // Registration coordinates stay in a 512x768 plane even when a new
      // painted sprite is delivered at a higher native raster resolution.
      const mesh=compile(sourcePins,rect.nativeW||rect.w,rect.nativeH||rect.h),points=deform(mesh,targetPins),s=placement.scale;
      if(!this.gl){this.canvasDraw(ctx,image,rect,mesh,points,placement);return;}
      const gl=this.gl,data=new Float32Array(mesh.vertices.length*4);
      for(let i=0;i<mesh.vertices.length;i++){data[i*4]=placement.x+points[i*2]*s;data[i*4+1]=placement.y+points[i*2+1]*s;data[i*4+2]=(rect.x+mesh.vertices[i][0]*rect.w/mesh.width)/image.width;data[i*4+3]=(rect.y+mesh.vertices[i][1]*rect.h/mesh.height)/image.height;}
      gl.bindTexture(gl.TEXTURE_2D,this.texture(image));gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(this.position);gl.vertexAttribPointer(this.position,2,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(this.uv);gl.vertexAttribPointer(this.uv,2,gl.FLOAT,false,16,8);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);
    }
    canvasDraw(ctx,image,rect,mesh,points,placement){
      const s=placement.scale,ids=mesh.indices;
      for(let i=0;i<ids.length;i+=3){const idx=[ids[i],ids[i+1],ids[i+2]],src=idx.map(j=>mesh.vertices[j]),dst=idx.map(j=>[placement.x+points[j*2]*s,placement.y+points[j*2+1]*s]),[a,b,c]=src,[u,v,w]=dst,det=a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);if(Math.abs(det)<1e-8)continue;
        const coeff=axis=>[(u[axis]*(b[1]-c[1])+v[axis]*(c[1]-a[1])+w[axis]*(a[1]-b[1]))/det,(u[axis]*(c[0]-b[0])+v[axis]*(a[0]-c[0])+w[axis]*(b[0]-a[0]))/det,(u[axis]*(b[0]*c[1]-c[0]*b[1])+v[axis]*(c[0]*a[1]-a[0]*c[1])+w[axis]*(a[0]*b[1]-b[0]*a[1]))/det],x=coeff(0),y=coeff(1);
        ctx.save();ctx.beginPath();ctx.moveTo(...u);ctx.lineTo(...v);ctx.lineTo(...w);ctx.closePath();ctx.clip();ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h,0,0,mesh.width,mesh.height);ctx.restore();
      }
    }
    flush(ctx){if(this.gl)ctx.drawImage(this.layer,0,0,this.width,this.height);}
    destroy(){if(!this.gl)return;for(const t of this.textures.values())this.gl.deleteTexture(t);this.gl.deleteBuffer(this.buffer);this.gl.deleteBuffer(this.indexBuffer);this.gl.deleteProgram(this.program);}
  }
  global.BallparkDeform=Object.freeze({compile,deform,mapPoint,Painter});
})(window);
