import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';

const base=new URL('./',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,base),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
function motionModules(){
  const w={};w.window=w;vm.createContext(w);
  for(const file of ['pitcher-art-v4.js','batter-art-v6.js','pitcher-art-v5.js','pitcher-motion.js','batter-motion.js'])vm.runInContext(read(file),w,{filename:file});
  return {pitcher:w.BallparkPitcherMotion,batter:w.BallparkBatterMotion,bat:w.BallparkBatArt};
}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function batMaterialPoint(source,target,point){
  const s=[source.tip[0]-source.grip[0],source.tip[1]-source.grip[1]],d=[target.batTip[0]-target.grip[0],target.batTip[1]-target.grip[1]],sl=Math.hypot(...s),dl=Math.hypot(...d),p=[point[0]-source.grip[0],point[1]-source.grip[1]],along=(p[0]*s[0]+p[1]*s[1])/(sl*sl),across=(-p[0]*s[1]+p[1]*s[0])/sl,width=source.acrossScale;
  return[target.grip[0]+along*d[0]-across*width*d[1]/dl,target.grip[1]+along*d[1]+across*width*d[0]/dl];
}
const insidePolygon=(p,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
function drawnImagePoint(draw,point){
  const a=draw.args,image=a[0],raw=[point[0]*image.width/512,point[1]*image.height/768],p=a.length===9?[a[5]+(raw[0]-a[1])*a[7]/a[3],a[6]+(raw[1]-a[2])*a[8]/a[4]]:raw,m=draw.matrix;
  return[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
}
function rasterPoint(mesh,deformed,point){
  // WebGL interpolates texture coordinates over the actual indexed triangle.
  // Recomputing skin weights with mapPoint can miss a surface distortion
  // caused by an indexed neighboring hard point, so inspect the drawn triangle.
  for(let i=0;i<mesh.indices.length;i+=3){
    const ids=[mesh.indices[i],mesh.indices[i+1],mesh.indices[i+2]],a=mesh.vertices[ids[0]],b=mesh.vertices[ids[1]],c=mesh.vertices[ids[2]],den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if(Math.abs(den)<1e-9)continue;
    const u=((b[1]-c[1])*(point[0]-c[0])+(c[0]-b[0])*(point[1]-c[1]))/den,v=((c[1]-a[1])*(point[0]-c[0])+(a[0]-c[0])*(point[1]-c[1]))/den,w=1-u-v;
    if(Math.min(u,v,w)>=-1e-7)return[0,1].map(axis=>u*deformed[ids[0]*2+axis]+v*deformed[ids[1]*2+axis]+w*deformed[ids[2]*2+axis]);
  }
  assert.fail('the actual indexed texture mesh covers the observed source point '+JSON.stringify(point));
}
function articulatedSpeedBounds(a,b,chain,duration){
  let path=distance(a[chain[0]],b[chain[0]]);const bounds={};
  for(let i=1;i<chain.length;i++){
    const parent=chain[i-1],child=chain[i],A=[a[child][0]-a[parent][0],a[child][1]-a[parent][1]],B=[b[child][0]-b[parent][0],b[child][1]-b[parent][1]],difference=Math.atan2(B[1],B[0])-Math.atan2(A[1],A[0]);
    const angle=Math.abs(Math.atan2(Math.sin(difference),Math.cos(difference)));
    path+=Math.abs(Math.hypot(...B)-Math.hypot(...A))+Math.max(Math.hypot(...A),Math.hypot(...B))*angle;
    bounds[child]=path*1.5/duration;
  }
  return bounds;
}
function finitePins(sample){
  assert.ok(sample&&sample.pins&&Object.keys(sample.pins).length>=10);
  for(const [name,point]of Object.entries(sample.pins)){
    assert.equal(point.length,2,name+' has an x/y point');
    assert.ok(point.every(Number.isFinite),name+' is finite');
  }
}
function pngCutout(file,pins={}){
  const bytes=fs.readFileSync(new URL('assets/inbetweens/'+file,base));
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],'new artwork is an actual PNG');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),channels=bytes[25]===6?4:bytes[25]===4?2:0;
  assert.equal(bytes[24],8,'cutout uses eight-bit channels');assert.ok(channels,'cutout carries an actual alpha channel');
  assert.equal(bytes[28],0,'noninterlaced alpha scan');
  const chunks=[];for(let at=8;at<bytes.length;){const length=bytes.readUInt32BE(at),kind=bytes.toString('ascii',at+4,at+8);if(kind==='IDAT')chunks.push(bytes.subarray(at+8,at+8+length));at+=length+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=width*channels;
  assert.equal(raw.length,(stride+1)*height,'all PNG rows decode');
  const locations=new Map(),pinAlpha={};
  for(const [name,p]of Object.entries(pins)){
    const x=Math.round(p[0]*width/512),y=Math.round(p[1]*height/768);
    assert.ok(x>=0&&x<width&&y>=0&&y<height,'source pin is within the PNG');
    if(!locations.has(y))locations.set(y,new Map());const row=locations.get(y);
    if(!row.has(x))row.set(x,[]);row.get(x).push(name);
  }
  let previous=Buffer.alloc(stride),at=0,minAlpha=255,maxAlpha=0,transparent=0,opaque=0;
  const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
  for(let y=0;y<height;y++){
    const filter=raw[at++],row=Buffer.allocUnsafe(stride);assert.ok(filter<=4,'supported PNG row filter');
    for(let x=0;x<stride;x++){
      const left=x>=channels?row[x-channels]:0,up=previous[x],corner=x>=channels?previous[x-channels]:0;
      const predict=filter===0?0:filter===1?left:filter===2?up:filter===3?Math.floor((left+up)/2):paeth(left,up,corner);
      row[x]=(raw[at++]+predict)&255;
      if(x%channels===channels-1){
        const alpha=row[x];minAlpha=Math.min(minAlpha,alpha);maxAlpha=Math.max(maxAlpha,alpha);if(alpha===0)transparent++;if(alpha>=250)opaque++;
        for(const name of locations.get(y)?.get(Math.floor(x/channels))||[])pinAlpha[name]=alpha;
      }
    }
    previous=row;
  }
  return{width,height,minAlpha,maxAlpha,transparent,opaque,pinAlpha,sha256:createHash('sha256').update(bytes).digest('hex')};
}
function webpCutout(file){
  const bytes=fs.readFileSync(new URL(file,base));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  for(let at=12;at+8<=bytes.length;){
    const kind=bytes.toString('ascii',at,at+4),length=bytes.readUInt32LE(at+4),start=at+8;
    if(kind==='VP8X')return{width:1+bytes.readUIntLE(start+4,3),height:1+bytes.readUIntLE(start+7,3),alpha:!!(bytes[start]&16)};
    if(kind==='VP8L'){assert.equal(bytes[start],47);const bits=bytes.readUInt32LE(start+1);return{width:1+(bits&16383),height:1+((bits>>>14)&16383),alpha:!!((bits>>>28)&1)};}
    at+=8+length+(length&1);
  }
  assert.fail('the optimized cutout keeps a WebP alpha-capable header');
}
const drawnAsset=(draw,art)=>draw.image.endsWith('/'+art.file)||draw.image.endsWith('/'+art.file.replace(/\.png$/,'.webp'));
async function fixture(t,{width=960,height=720,reduced=false}={}){
  let now=0;
  const noop=()=>{},gradient={addColorStop:noop};
  const calls=[],painted=[],frames=[],shadows=[],loadedImages=[],maskCanvases=[],events=[];
  function context(log,main=false){
    let matrix=[1,0,0,1,0,0],path=[];const stack=[];
    const multiply=n=>{const m=matrix;matrix=[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];};
    const mapped=(x,y)=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]];
    const record=(method,args)=>{const call={method,args,matrix:matrix.slice(),path:path.map(p=>p.slice()),composite:ctx.globalCompositeOperation,lineWidth:ctx.lineWidth};log.push(call);if(main)events.push(call);};
    const ctx=new Proxy({globalCompositeOperation:'source-over',lineWidth:1,createLinearGradient:()=>gradient,
      __matrix:()=>matrix.slice(),
      save:()=>stack.push({matrix:matrix.slice(),composite:ctx.globalCompositeOperation}),restore:()=>{const s=stack.pop();if(s){matrix=s.matrix;ctx.globalCompositeOperation=s.composite;}},
      setTransform:(...m)=>{matrix=m.slice();},transform:(...m)=>multiply(m),translate:(x,y)=>multiply([1,0,0,1,x,y]),scale:(x,y)=>multiply([x,0,0,y,0,0]),rotate:a=>multiply([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0]),
      beginPath:()=>{path=[];},moveTo:(x,y)=>path.push(mapped(x,y)),lineTo:(x,y)=>path.push(mapped(x,y)),
      drawImage:(...args)=>record('drawImage',args),fill:(...args)=>record('fill',args),stroke:(...args)=>record('stroke',args),
      strokeRect:(...args)=>record('strokeRect',args),strokeText:(...args)=>record('strokeText',args),fillText:(...args)=>record('fillText',args)
    },{get:(obj,key)=>key in obj?obj[key]:noop});return ctx;
  }
  const ctx=context(calls,true),document={createElement:tag=>{assert.equal(tag,'canvas');const log=[],maskContext=context(log),canvas={width:0,height:0,calls:log,getContext:()=>maskContext};maskCanvases.push(canvas);return canvas;}};
  const label={style:{},dataset:{}};
  const canvas={width:0,height:0,ownerDocument:document,getContext:()=>ctx,getBoundingClientRect:()=>({width,height}),parentElement:{querySelector:q=>q==='.opponent'?label:null}};
  class Image{constructor(){this.width=512;this.height=768;}set src(value){
    this.url=value;
    loadedImages.push(value);
    if(value.startsWith('assets/inbetweens/')){
      if(value.endsWith('.webp')){const info=webpCutout(value);this.width=info.width;this.height=info.height;}
      else{const png=fs.readFileSync(new URL(value,base));this.width=png.readUInt32BE(16);this.height=png.readUInt32BE(20);}
    }else if(value.endsWith('/batter.webp')){throw new Error('The frontal batter atlas must not be loaded.');}
    queueMicrotask(()=>this.onload());
  }}
  class ResizeObserver{observe(){}disconnect(){}}
  const w={console,document,Image,ResizeObserver,performance:{now:()=>now},devicePixelRatio:1,matchMedia:()=>({matches:reduced}),requestAnimationFrame:()=>1,cancelAnimationFrame:noop};
  w.window=w;vm.createContext(w);w.globalThis=w;
  // The actual WebGL mesh is inspected in-browser. This fixture isolates the
  // motion/ball/result contracts without pretending a fake canvas proves art.
  w.BallparkDeform={compile:noop,Painter:class{
    constructor(){this.pending=[];}begin(){}flush(){events.push({method:'painterFlush',images:this.pending.slice()});this.pending=[];}destroy(){}
    draw(context,image,rect,sourcePins,pins,placement){painted.push({image:image.url,rect:plain(rect),pins:plain(pins),placement:plain(placement)});this.pending.push(image.url);}
  }};
  for(const file of ['director-engine.js','game-adapter.js','pitcher-art-v4.js','batter-art-v6.js','pitcher-art-v5.js','pitcher-motion.js','batter-motion.js','scene-renderer.js'])vm.runInContext(read(file),w,{filename:file});
  const scene=new w.BallparkScene(canvas);await scene.loaded;const balls=[];
  scene.ball=(x,y,r,alpha,trail)=>{const m=ctx.__matrix();balls.push({x,y,rendered:[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]],r,alpha,trail});};
  const drawPitcher=scene.drawPitcher.bind(scene),shadow=scene.shadow.bind(scene);
  scene.drawPitcher=(...args)=>{frames.push(args[5]);return drawPitcher(...args);};
  scene.shadow=(...args)=>{shadows.push(args);return shadow(...args);};
  t.after(()=>scene.destroy());
  const draw=time=>{now=time;balls.length=0;frames.length=0;shadows.length=0;scene.draw(time);return balls.at(-1);};
  const resize=(nextWidth,nextHeight)=>{width=nextWidth;height=nextHeight;scene.resize();};
  return{w,scene,balls,draw,calls,label,resize,painted,frames,shadows,loadedImages,maskCanvases,events};
}

const offset=(zone,p)=>{const k=Math.max(0,Math.min(1,p))**2;return zone===9?{x:(1+35/18)*k,y:k}:Number.isInteger(zone)&&zone>=0&&zone<9?{x:(zone%3-1)*k,y:(Math.floor(zone/3)-1)*k}:{x:0,y:0};};
const resultFor=(zone,reaction='hit',kind=reaction==='home-run'?'hit':reaction==='miss'?'whiff':reaction)=>({zone,reaction,kind,damage:reaction==='hit'?15:0,homeRun:reaction==='home-run'});

for(const [width,height] of [[960,720],[375,380],[568,276]]){
  test('incoming and outgoing balls meet for every actual zone at '+width+'×'+height,async t=>{
    for(const zone of [0,1,2,3,4,5,6,7,8,9,null]){
      const v=await fixture(t,{width,height});let contacts=0;
      const promise=v.scene.play({aimZone:4,take:false,flightOffset:p=>offset(zone,p),onContact:()=>{contacts++;return resultFor(zone);}});
      const flight=v.draw(1340-1e-6);assert.ok(flight,'incoming ball for '+zone);assert.equal(contacts,0);
      const contact=v.draw(1340);assert.ok(contact,'outgoing ball for '+zone);assert.equal(contacts,1);
      assert.ok(Math.hypot(flight.x-contact.x,flight.y-contact.y)<.001,'no contact teleport for actual zone '+zone);
      const g=v.scene.geometry(),point=v.scene.contactPoint(zone,g);
      assert.ok(Math.abs(contact.x-point[0])<1e-8);assert.ok(Math.abs(contact.y-point[1])<1e-8);
      v.draw(2400);await promise;
    }
  });
}
test('real engine flight reaches its actual miss location while state resolves exactly once at contact',async t=>{
  const v=await fixture(t),game=v.w.BallparkGame.create({seed:90210,autoSelect:true});game.setAim(4);const before=plain(game.snapshot()),tx=game.beginSwing();
  assert.equal(tx.ok,true);assert.equal(Object.hasOwn(tx,'result'),false);v.scene.update(before);let count=0,result;
  const promise=v.scene.play({...tx.animation,flightOffset:p=>game.flightOffset(tx.token,p),onContact:()=>{count++;const out=game.finishPitch(tx.token);assert.equal(out.ok,true);result=out.result;v.scene.update(out.snapshot);return out.result;}});
  for(const time of [0,1000,1080,1200,1339])v.draw(time);
  assert.equal(count,0);assert.equal(game.snapshot().stats.pitches,0);assert.equal(game.snapshot().result,null);
  const incoming=v.draw(1340-1e-6),contact=v.draw(1340);assert.equal(count,1);assert.equal(game.snapshot().stats.pitches,1);assert.equal(result.zone,6);assert.equal(result.reaction,'miss');
  assert.ok(Math.hypot(incoming.x-contact.x,incoming.y-contact.y)<.001);v.draw(1341);v.draw(1500);v.draw(2400);await promise;
  assert.equal(count,1);assert.deepEqual(plain(v.scene.trace),['windup','release','flight','contact','reaction','settled']);assert.equal(v.scene.shot,null);
});
test('taking and reduced motion preserve contact sequencing without an accidental swing pose',async t=>{
  const v=await fixture(t,{reduced:true});const cells=[],real=v.scene.drawBatter.bind(v.scene);v.scene.drawBatter=(cell,...args)=>{cells.push(cell);return real(cell,...args);};
  let contacts=0;const promise=v.scene.play({take:true,aimZone:null,flightOffset:p=>offset(9,p),onContact:()=>{contacts++;return resultFor(9,'ball');}});
  for(const time of [0,1040*.55,1200*.55,1350*.55,1600*.55,2400*.55])v.draw(time);
  await promise;assert.equal(contacts,1);assert.ok(cells.every(cell=>cell==='ready'));assert.deepEqual(plain(v.scene.trace),['windup','release','flight','contact','reaction','settled']);
});

test('the field does not draw a second aiming grid while a card is selected',async t=>{
  const v=await fixture(t,{width:375,height:380});
  v.scene.update({plan:{mainId:'c1',aimZone:4,coverage:[4]}});
  for(const time of [0,100,900])v.draw(time);
  assert.equal(v.scene.targetGuide,undefined);
  assert.equal(v.calls.filter(x=>x.method==='strokeRect').length,0);
});

test('real engine whiff lowers HP through effort while the ball visibly misses the bat',async t=>{
  const v=await fixture(t),game=v.w.BallparkGame.create({seed:90210});game.setAim(4);
  const tx=game.beginSwing(),keys=[],real=v.scene.drawPitcher.bind(v.scene);
  v.scene.drawPitcher=(key,...args)=>{keys.push(key);return real(key,...args);};
  let result;
  const promise=v.scene.play({...tx.animation,flightOffset:p=>game.flightOffset(tx.token,p),onContact:()=>{
    const out=game.finishPitch(tx.token);result=out.result;v.scene.update(out.snapshot);return result;
  }});
  for(const time of [0,1000,1339,1340,1500,1630,1800,2150,2400])v.draw(time);
  await promise;
  assert.equal(result.kind,'whiff');assert.equal(result.pressure.source,'effort');
  assert.equal(result.pressure.hpLost,1);assert.equal(game.snapshot().pitcher.hp,59);
  assert.equal(keys.includes('stagger'),false);
  assert.equal(v.calls.filter(x=>x.method==='fillText'||x.method==='strokeText').length,0);
  const frame=v.scene.motionSample(1340,{...tx.animation,result,flightOffset:p=>offset(result.zone,p)});
  assert.equal(frame.physicalContact,false);
  assert.ok(distance(frame.ball,frame.batBarrel)>25*frame.g.a,'a whiff cannot appear as solid contact');
});

test('foul, watched, and missed pitches preserve pitcher scale and avoid attack numbers',async t=>{
  for(const [reaction,take] of [['foul',false],['ball',true],['called',true],['miss',false]]){
    const v=await fixture(t),keys=[],real=v.scene.drawPitcher.bind(v.scene);
    v.scene.drawPitcher=(key,...args)=>{keys.push(key);return real(key,...args);};
    const promise=v.scene.play({take,aimZone:4,flightOffset:p=>offset(6,p),
      onContact:()=>({zone:6,reaction,take,damage:2,pressure:{hpLost:2}})});
    for(const time of [0,1340,1500,1630,1800,2150,2400])v.draw(time);
    await promise;
    assert.equal(keys.includes('stagger'),false,reaction+' does not stagger');
    assert.equal(v.calls.filter(x=>x.method==='fillText'||x.method==='strokeText').length,0,reaction+' has no attack number');
    assert.ok(v.painted.every(p=>!p.image.includes('stagger')));
    const pitcher=v.painted.filter(p=>!p.image.includes('batter'));
    assert.equal(new Set(pitcher.map(p=>p.placement.h)).size,1,'reaction keeps the same character scale');
  }
});

test('a real home run meets the barrel, starts its outgoing flight immediately, and preserves character scale',async t=>{
  const v=await fixture(t),game=v.w.BallparkGame.create({seed:90210});game.setAim(6);
  const tx=game.beginSwing();let result;
  const promise=v.scene.play({...tx.animation,flightOffset:p=>game.flightOffset(tx.token,p),onContact:()=>{
    const out=game.finishPitch(tx.token);result=out.result;v.scene.update(out.snapshot);return result;
  }});
  for(const value of [0,1000,1339])v.draw(value);
  const contact=v.draw(1340),moving=v.draw(1341);
  assert.equal(result.reaction,'home-run');assert.equal(result.pressure.hpLost,45);
  const frame=v.scene.motionSample(1340,{...tx.animation,result});
  assert.ok(distance([contact.x,contact.y],frame.batBarrel)<1e-8);
  assert.ok(distance([contact.x,contact.y],[moving.x,moving.y])>.01,'outgoing ball does not pause after contact');
  for(const value of [1500,1630,2220,2400])v.draw(value);await promise;
  assert.ok(v.calls.some(x=>x.method==='fillText'&&x.args[0]==='−45'));
  assert.ok(v.painted.every(p=>!p.image.includes('stagger')));
  const pitcher=v.painted.filter(p=>!p.image.includes('batter'));
  assert.equal(new Set(pitcher.map(p=>p.placement.h)).size,1);
});

test('pressure impact numbers respect overkill, zero loss, and legacy HP deltas',async t=>{
  const v=await fixture(t),g=v.scene.geometry();
  const text=()=>v.calls.filter(x=>x.method==='fillText').map(x=>x.args[0]);
  v.scene.damage(g,1700,{reaction:'hit',damage:159,hpBefore:5,hpAfter:0,pressure:{amount:159,hpLost:5}});
  assert.deepEqual(text(),['−5']);v.calls.length=0;
  v.scene.damage(g,1700,{reaction:'hit',damage:159,hpBefore:5,hpAfter:0,pressure:{hpLost:0}});
  assert.deepEqual(text(),[]); // An explicit zero takes precedence over fallbacks.
  v.scene.damage(g,1700,{reaction:'hit',damage:999,hpBefore:3,hpAfter:1});
  assert.deepEqual(text(),['−2']);v.calls.length=0;
  v.scene.damage(g,1700,{reaction:'home-run',damage:8});
  assert.deepEqual(text(),['−8']);v.calls.length=0;
  v.scene.damage(g,1700,{reaction:'hit',take:true,damage:8});
  assert.deepEqual(text(),[]);
});

test('zero HP loss never displays damage despite a positive pressure amount',async t=>{
  const v=await fixture(t),keys=[],real=v.scene.drawPitcher.bind(v.scene);
  v.scene.drawPitcher=(key,...args)=>{keys.push(key);return real(key,...args);};
  const promise=v.scene.play({take:false,aimZone:4,flightOffset:p=>offset(6,p),
    onContact:()=>({zone:6,reaction:'hit',damage:30,pressure:{amount:30,hpLost:0}})});
  for(const time of [0,1340,1630,1800,2400])v.draw(time);
  await promise;assert.equal(keys.includes('stagger'),false);
  assert.equal(v.calls.filter(x=>x.method==='fillText'||x.method==='strokeText').length,0);
});

test('short fields move the HP label to the upper right with an eight-pixel edge inset',async t=>{
  for(const [width,height] of [[320,130],[375,130],[568,152]]){
    const v=await fixture(t,{width,height}),style=v.label.style;
    assert.equal(v.label.dataset.compact,'true');
    assert.equal(style.width,'110px');
    assert.equal(style.top,'6px');
    const center=parseFloat(style.left),right=center+110/2,left=center-110/2;
    assert.equal(width-right,8);
    assert.ok(left>=0);
    const pitcher=v.scene.actorPlacement('ready',v.scene.geometry());
    assert.ok(left>pitcher.x+pitcher.w,'the compact label is horizontally clear of the pitcher');
  }
});

test('tall fields retain the pitcher-relative HP anchor and resizing clears compact width',async t=>{
  const v=await fixture(t,{width:320,height:130});
  assert.equal(v.label.dataset.compact,'true');
  for(const [width,height] of [[320,180],[375,210],[960,720]]){
    v.resize(width,height);
    const g=v.scene.geometry(),p=v.scene.actorPlacement('ready',g);
    assert.equal(v.label.dataset.compact,'false');
    assert.equal(v.label.style.width,'');
    assert.equal(parseFloat(v.label.style.left),g.x(492));
    assert.equal(parseFloat(v.label.style.top),Math.max(9,p.y-24));
  }
  v.resize(375,179);
  assert.equal(v.label.dataset.compact,'true');
  assert.equal(v.label.style.width,'110px');
  assert.equal(v.label.style.left,'312px');
  v.resize(375,180);
  assert.equal(v.label.dataset.compact,'false');
  assert.equal(v.label.style.width,'');
});

for(const [width,height]of [[960,720],[375,380],[568,152]]){
  test('visible release and covered contact share the hand, ball, and barrel at '+width+'×'+height,async t=>{
    const v=await fixture(t,{width,height}),allZones=[0,1,2,3,4,5,6,7,8];
    for(const zone of allZones){
      const options={aimZone:4,coverage:allZones,flightOffset:p=>offset(zone,p)},g=v.scene.geometry();
      const release=v.scene.motionSample(1000,options);
      assert.ok(distance(release.ball,release.releaseHand)<1e-8,'ball leaves hand at release');
      assert.ok(distance(release.ball,v.scene.point(release.pitcher.releaseHand,release.pitcherPlacement))<1e-8,'reported hand is the drawn hand');
      const before=v.scene.motionSample(1340-1e-6,options),at=v.scene.motionSample(1340,{...options,result:resultFor(zone)});
      assert.ok(distance(before.ball,before.batBarrel)<.001*g.a,'covered pitch reaches the moving barrel before result '+zone);
      assert.ok(distance(at.ball,at.batBarrel)<1e-8,'actual contact meets the barrel '+zone);
      assert.ok(distance(before.batBarrel,at.batBarrel)<.001*g.a,'resolution does not teleport the bat '+zone);
      const planted=v.scene.motionSample(850,options).pitcherFrontFoot;
      for(const time of [850,1000,1200,1340,1700,1970,2240,2400]){
        const frame=v.scene.motionSample(time,options);
        assert.ok(distance(frame.pitcherFrontFoot,planted)<1e-8,'pitcher lead foot stays on the same dirt');
      }
    }
  });
}

test('in-play outs and sacrifice contact the bat, while whiffs and takes have no impact flash',async t=>{
  const v=await fixture(t),g=v.scene.geometry();
  for(const kind of ['hit','foul','out','sacrifice']){
    const result=resultFor(4,kind==='hit'?'hit':kind==='foul'?'foul':'out',kind),options={aimZone:4,result};
    assert.equal(v.scene.motionSample(1340,options).physicalContact,true,kind+' is bat contact');
    v.calls.length=0;v.scene.impact([40,40],g,10,result);
    assert.ok(v.calls.some(x=>x.method==='stroke'),kind+' has a contact flash');
    const promise=v.scene.play({aimZone:4,coverage:[4],flightOffset:p=>offset(4,p),onContact:()=>result});
    const start=v.scene.shot.start,contact=v.draw(start+1340),moving=v.draw(start+1341);
    assert.ok(moving.y<contact.y,kind+' ball immediately travels into the field');
    v.draw(start+2400);await promise;
  }
  for(const result of [resultFor(6,'miss'),resultFor(9,'ball'),{...resultFor(4),take:true}]){
    assert.equal(v.scene.motionSample(1340,{aimZone:4,result,take:!!result.take}).physicalContact,false);
    v.calls.length=0;v.scene.impact([40,40],g,10,result);
    assert.equal(v.calls.filter(x=>x.method==='stroke').length,0,'no false bat impact');
  }
});

test('replay, reduced motion, and mid-flight resizing do not change the delivery or resolve twice',async t=>{
  const v=await fixture(t),result=resultFor(6),options={aimZone:6,coverage:[6],flightOffset:p=>offset(6,p)};
  const before=plain(v.scene.motionSample(1200,options));let contacts=0;
  const promise=v.scene.play({...options,onContact:()=>{contacts++;return result;}});
  v.draw(1200);v.resize(375,380);
  const resized=v.scene.motionSample(1200,options);
  assert.deepEqual(plain(resized.batter.pins),before.batter.pins,'viewport keeps the same anatomical pose');
  assert.ok(resized.ball.every(Number.isFinite));
  v.draw(1340);v.resize(568,152);v.draw(1600);v.draw(2400);await promise;assert.equal(contacts,1);
  v.resize(960,720);
  assert.deepEqual(plain(v.scene.motionSample(1200,options)),before,'replay yields the same delivery');
  const reduced=await fixture(t,{reduced:true});
  const second=reduced.scene.play({...options,onContact:()=>result});
  const normalBall=v.scene.motionSample(1200,options).ball,slowBall=reduced.draw(1200*.55);
  assert.ok(distance(normalBall,[slowBall.x,slowBall.y])<1e-8,'reduced clock keeps the same trajectory');
  reduced.draw(2400*.55);await second;
});

test('a real outside-coverage foul reaches the barrel continuously and replays without revealing its result early',async t=>{
  for(const [width,height]of [[960,720],[375,380],[568,152]]){
    const v=await fixture(t,{width,height}),game=v.w.BallparkGame.create({seed:3,autoSelect:true});game.setAim(4);
    const before=plain(game.snapshot()),tx=game.beginSwing();assert.equal(tx.ok,true);
    const options={...tx.animation,flightOffset:p=>game.flightOffset(tx.token,p),swingOffset:p=>game.swingOffset(tx.token,p)};
    const sampled=[1000,1120,1200,1300,1339].map(time=>({time,frame:plain(v.scene.motionSample(time,options))}));
    let result,contacts=0;
    const promise=v.scene.play({...options,onContact:()=>{contacts++;const out=game.finishPitch(tx.token);result=out.result;return result;}});
    for(const time of [0,1000,1120,1200,1300,1339])v.draw(time);
    assert.equal(contacts,0);const flying=plain(game.snapshot());assert.equal(flying.result,null);
    for(const key of ['energy','counts','pitcher','stats','bases'])assert.deepEqual(flying[key],before[key],'no early '+key+' change');
    assert.deepEqual(flying.cards.map(c=>c.id),before.cards.map(c=>c.id),'no early card consumption');
    const lastFrame=v.scene.motionSample(1340-1e-6,options),incoming=v.draw(1340-1e-6),contact=v.draw(1340);
    assert.equal(contacts,1);assert.equal(result.kind,'foul');assert.equal(result.zone,6);assert.equal(result.contact.mainCovered,false);
    const at=v.scene.motionSample(1340,{...options,result});
    assert.ok(distance(lastFrame.batBarrel,at.batBarrel)<.001*at.g.a,'foul resolution cannot teleport the bat');
    assert.ok(distance(at.batBarrel,[contact.x,contact.y])<1e-8,'the foul still contacts the painted barrel');
    assert.ok(distance([incoming.x,incoming.y],[contact.x,contact.y])<.001*at.g.a,'incoming and deflected ball share one contact point');
    for(const {time,frame}of sampled){
      const replay=v.scene.motionSample(time,{...tx.animation,flightOffset:p=>offset(result.zone,p),swingOffset:p=>v.w.BallparkGame.replaySwingOffset(result,p)});
      assert.deepEqual(plain(replay.batter.pins),frame.batter.pins,'replay keeps the same reserved swing at '+time);
      assert.ok(distance(replay.ball,frame.ball)<1e-8);
    }
    v.draw(2400);await promise;assert.equal(contacts,1);
  }
});

test('batter plants without sliding while the bat follows every playable height and width',()=>{
  const {batter}=motionModules();
  const rear=plain(batter.rearPlant),front=plain(batter.frontPlant),barrel=plain(batter.contactBarrel);
  for(const offset of [[0,0],[-49,-99],[49,-99],[-49,99],[49,99]]){
    for(let time=0;time<=2400;time+=8){
      const sample=batter.sample(time,{offset});finitePins(sample);
      assert.deepEqual(plain(sample.rearFoot),rear,'rear shoe stays registered at '+time);
      if(time<600||time>=1150)assert.deepEqual(plain(sample.frontFoot),front,'rear-camera lead shoe stays on its original dirt through finish/regrip at '+time);
    }
    const contact=batter.sample(1340,{offset,contact:true});
    assert.ok(distance(contact.barrel,[barrel[0]+offset[0],barrel[1]+offset[1]])<1e-8,'bat reaches supplied contact location');
    assert.ok(distance(contact.pins.pelvis,batter.sample(1340,{offset:[0,0]}).pins.pelvis)<1e-8,'aiming does not move the pelvis');
  }
});

test('all body and complete-bat material points remain continuous through every native source change',t=>{
  const {batter,bat}=motionModules(),offset=[49,99];
  const a=batter.sample(1270,{offset:[0,0]}).pins,b=batter.sample(1340,{offset:[0,0]}).pins;
  const A=[a.batTip[0]-a.grip[0],a.batTip[1]-a.grip[1]],B=[b.batTip[0]-b.grip[0],b.batTip[1]-b.grip[1]],lengthA=Math.hypot(...A),lengthB=Math.hypot(...B);
  const difference=Math.atan2(B[1],B[0])-Math.atan2(A[1],A[0]),angle=Math.abs(Math.atan2(Math.sin(difference),Math.cos(difference)));
  // The rear-camera drive/contact drawings define a fast 70 ms bat turn.
  // Projected lengths can change with perspective. The grip uses a
  // monotone cubic (component derivative <= 3 times its interval secant),
  // the shaft's smoothstep has derivative <= 1.5, and the aiming translation
  // has the same smoothstep over 220 ms. Only tip/barrel in this interval
  // use a physically derived path bound; ordinary body/feet keep 5.
  const gripBound=3*distance(a.grip,b.grip)/70;
  const local=(p,n)=>{const d=[p[n][0]-p.grip[0],p[n][1]-p.grip[1]],shaft=[p.batTip[0]-p.grip[0],p.batTip[1]-p.grip[1]],l=Math.hypot(...shaft);return[(d[0]*shaft[0]+d[1]*shaft[1])/l,(-d[0]*shaft[1]+d[1]*shaft[0])/l];};
  const aimBound=1.5*Math.hypot(...offset)/220;
  const fastBounds=Object.fromEntries(['batTip','barrel'].map(n=>{const x=local(a,n),y=local(b,n);return[n,gripBound+1.5*(distance(x,y)+Math.max(Math.hypot(...x),Math.hypot(...y))*angle)/70+aimBound];}));
  let previous=batter.sample(0,{offset});const sourceCuts=[];
  for(let time=1;time<=2400;time++){
    const current=batter.sample(time,{offset});
    for(const [name,point]of [['barrel',bat.barrel],['batKnob',bat.knob]])assert.ok(distance(current.pins[name],batMaterialPoint(bat,current.pins,point))<1e-8,'the complete bat '+name+' retains the same material point at '+time);
    for(const name of Object.keys(current.pins)){
      const bound=name in fastBounds&&time>1270&&time<=1340?fastBounds[name]+1e-6:['batTip','barrel'].includes(name)?12:5;
      assert.ok(distance(previous.pins[name],current.pins[name])<bound,'bounded one-millisecond motion in '+name+' at '+time);
    }
    if(previous.sourceKey!==current.sourceKey){
      let lo=time-1,hi=time;
      for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(batter.sample(mid,{offset}).sourceKey===previous.sourceKey)lo=mid;else hi=mid;}
      const left=batter.sample(hi-1e-6,{offset}),right=batter.sample(hi+1e-6,{offset});
      sourceCuts.push({time:hi,from:left.sourceKey,to:right.sourceKey,barrelNativePx:distance(left.pins.barrel,right.pins.barrel),knobNativePx:distance(left.pins.batKnob,right.pins.batKnob),knobOccluded:!!left.occludedPins?.includes('batKnob')||!!right.occludedPins?.includes('batKnob')});
      for(const name of Object.keys(right.pins))assert.ok(distance(left.pins[name],right.pins[name])<.001,'bat source switches without a target-joint jump in '+name);
    }
    previous=current;
  }
  assert.equal(previous.sourceKey,'ready');
  assert.deepEqual(plain(previous.pins),plain(batter.sample(0).pins));
  assert.deepEqual(plain(batter.sample(5000,{offset}).pins),plain(previous.pins));
  t.diagnostic('The single complete bat restores one material identity across every body-source cut; no wood continuity exceptions remain: '+JSON.stringify(sourceCuts));
});

test('watching does not swing, incoming options do not mutate assets, and a bunt meets the same ball',()=>{
  const {batter}=motionModules(),original=plain(batter.poses),offset=[49,99];
  for(let time=0;time<=2400;time+=10){
    const watch=batter.sample(time,{take:true,offset});finitePins(watch);assert.equal(watch.sourceKey,'ready');
    assert.ok(distance(watch.barrel,batter.sample(0).barrel)<4,'take keeps bat near the shoulder');
  }
  const bunt=batter.sample(1340,{kind:'bunt',offset,contact:true});
  const target=plain(batter.contactBarrel).map((n,i)=>n+offset[i]);
  assert.ok(distance(bunt.barrel,target)<1e-8);
  const returned=batter.sample(1340,{offset});returned.pins.barrel[0]=-999;
  assert.deepEqual(plain(batter.poses),original,'samples cannot mutate the original source registration');
  assert.ok(distance(batter.sample(1340,{offset}).barrel,target)<1e-8);
  assert.deepEqual(offset,[49,99]);
});

test('the dedicated rear-view bunt reaches the painted barrel in every playable zone without a contact snap',async t=>{
  for(const [width,height]of [[960,720],[375,380],[568,152]])for(const zone of [0,1,2,3,4,5,6,7,8]){
    const v=await fixture(t,{width,height});vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
    const options={kind:'bunt',aimZone:zone,coverage:[zone],flightOffset:p=>offset(zone,p)};let contacts=0;
    const promise=v.scene.play({...options,onContact:()=>{contacts++;return resultFor(zone,'out','sacrifice');}});
    const before=v.scene.motionSample(1340-1e-6,options),incoming=v.draw(1340-1e-6);assert.equal(contacts,0);
    const ball=v.draw(1340),frame=v.frames.at(-1),pose=frame.batter;
    assert.equal(contacts,1);assert.equal(pose.sourceKey,'bunt');
    assert.ok(distance(before.batBarrel,frame.batBarrel)<.001*frame.g.a,'bunt contact cannot add a last-frame reach jump');
    assert.ok(distance([incoming.x,incoming.y],[ball.x,ball.y])<.001*frame.g.a);
    const art=v.w.BallparkBatArt,draw=v.calls.findLast(c=>c.method==='drawImage'&&c.args[0]?.url.endsWith('/'+art.file.replace(/\.png$/,'.webp'))),painted=drawnImagePoint(draw,art.barrel);
    assert.ok(distance(painted,ball.rendered)<.001,'the actual source wood landmark meets the rendered ball under the same camera transform for zone '+zone);
    v.draw(2400);await promise;assert.equal(contacts,1);
  }
});

test('the projected bat retains its native perspective lengths through each interval instead of collapsing through the grip',()=>{
  const {batter}=motionModules(),times=[0,600,860,1000,1150,1210,1270,1340,1480,1565,1810,1940,2070,2310,2400];
  for(let i=1;i<times.length;i++){
    const a=batter.sample(times[i-1]).pins,b=batter.sample(times[i]).pins,min=Math.min(distance(a.grip,a.batTip),distance(b.grip,b.batTip)),max=Math.max(distance(a.grip,a.batTip),distance(b.grip,b.batTip));
    for(let time=times[i-1];time<=times[i];time+=5){
      const p=batter.sample(time).pins,length=distance(p.grip,p.batTip);
      assert.ok(length>=min-1e-8&&length<=max+1e-8,'perspective interpolation respects the actual endpoint lengths at '+time);
      const along=((p.barrel[0]-p.grip[0])*(p.batTip[0]-p.grip[0])+(p.barrel[1]-p.grip[1])*(p.batTip[1]-p.grip[1]))/(length*length);
      assert.ok(along>.6&&along<1.05,'the contact wood remains in the distal bat, not the grip or jersey');
    }
  }
});


test('one complete bat is drawn with a rigid continuous affine behind the body through every native source cut',async t=>{
  for(const [width,height]of [[960,720],[375,380],[568,152]]){
    const v=await fixture(t,{width,height}),art=v.w.BallparkBatArt,times=[...Object.values(v.w.BallparkBatterMotion.keyTimes),1305-1e-6,1305,1305+1e-6,1875-1e-6,1875,1875+1e-6,2005-1e-6,2005,2005+1e-6];
    for(let time=1780;time<=2100;time+=10)times.push(time);
    for(const options of [{},{take:true},{kind:'bunt'},{aimZone:8}])for(const time of times){
      const mark=v.events.length;v.scene.inspect(time,options);v.draw(time);const frame=v.frames.at(-1),events=v.events.slice(mark),draws=events.filter(c=>c.method==='drawImage'&&c.args[0]?.url.endsWith('/'+art.file.replace(/\.png$/,'.webp')));
      assert.equal(draws.length,1,'a frame has exactly one complete bat image, never independently warped shaft pieces');
      const draw=draws[0],woodIndex=events.indexOf(draw),bodyIndex=events.findIndex(c=>c.method==='painterFlush'&&c.images.some(url=>url.includes('batter-')));
      assert.ok(bodyIndex>woodIndex,'hands, helmet, and jersey occlude the complete bat');
      assert.ok(draw.matrix[0]*draw.matrix[3]-draw.matrix[1]*draw.matrix[2]>0,'the actual bat draw has a finite physical orientation');
      for(const [name,point]of [['grip',art.grip],['batTip',art.tip],['barrel',art.barrel],['batKnob',art.knob]]){
        assert.ok(distance(drawnImagePoint(draw,point),v.scene.point(frame.batter.pins[name],frame.batterPlacement))<1e-8,'the actual draw maps the same '+name+' material point at '+time);
      }
      for(const point of [[art.barrel[0]-20,art.barrel[1]],[art.barrel[0]+20,art.barrel[1]],[art.grip[0],(art.grip[1]+art.tip[1])/2]]){
        assert.ok(distance(drawnImagePoint(draw,point),v.scene.point(batMaterialPoint(art,frame.batter.pins,point),frame.batterPlacement))<1e-8,'wood interior and width use the same actual affine as its grip and tip');
      }
    }
    v.scene.clearInspection();
  }
});

test('actual body mask paths erase every old visible wood observation while preserving helmet and jersey interiors',async t=>{
  const v=await fixture(t);assert.equal(v.maskCanvases.length,11,'each accepted body is masked once in its own cached canvas');
  const edgeDistance=(p,poly)=>Math.min(...poly.map((a,i)=>{const b=poly[(i+1)%poly.length],d=[b[0]-a[0],b[1]-a[1]],q=Math.max(0,Math.min(1,((p[0]-a[0])*d[0]+(p[1]-a[1])*d[1])/(d[0]*d[0]+d[1]*d[1])));return distance(p,[a[0]+q*d[0],a[1]+q*d[1]]);}));
  for(const [key,art]of Object.entries(v.w.BallparkInbetweenArt.batter)){
    const body=v.scene.images['batter-'+key],fills=body.calls.filter(c=>c.method==='fill'&&c.composite==='destination-out'),strokes=body.calls.filter(c=>c.method==='stroke'&&c.composite==='destination-out'),source=body.calls.find(c=>c.method==='drawImage');
    assert.ok(source?.args[0]?.url.endsWith('/'+art.file.replace(/\.png$/,'.webp')),'the actual original body is copied before masking');
    assert.equal(fills.length,Object.keys(art.pins.surfaceRegions).filter(n=>n.startsWith('bat')).length,'all old visible wood regions reach actual destination-out paths');
    const scale=[body.width/512,body.height/768],covered=p=>fills.some(c=>insidePolygon(p,c.path))||strokes.some(c=>edgeDistance(p,c.path)<=c.lineWidth/2+1e-8);
    for(const [name,point]of Object.entries(art.surfaceChecks).filter(([name])=>name.startsWith('batWood')))assert.ok(covered(point.map((n,i)=>n*scale[i])),'actual '+key+' body mask removes old opaque '+name+' pixels');
    for(const name of ['headBack','jerseyBack'])assert.equal(covered(art.surfaceChecks[name].map((n,i)=>n*scale[i])),false,'actual old-wood mask preserves the observed '+key+' '+name);
  }
});

test('actual indexed jersey cores follow the torso bone instead of foreign anatomical hard landmarks',async t=>{
  const v=await fixture(t);vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
  const cases=Object.values(v.w.BallparkInbetweenArt.batter).map(art=>({time:art.keyTime,kind:art.file.includes('bunt')?'bunt':undefined}));
  for(const time of [1920,1960,2000,2010])cases.push({time});
  for(const options of cases){
    const pose=v.w.BallparkBatterMotion.sample(options.time,options),art=v.w.BallparkInbetweenArt.batter[pose.sourceKey],source=pose.sourcePins,mesh=v.w.BallparkDeform.compile(source),target=plain(pose.pins),foreign=plain(target),point=art.surfaceChecks.jerseyBack;
    for(const name of Object.keys(foreign))if(!['pelvis','neck'].includes(name)){foreign[name][0]+=117;foreign[name][1]-=93;}
    const base=rasterPoint(mesh,v.w.BallparkDeform.deform(mesh,target),point),stressed=rasterPoint(mesh,v.w.BallparkDeform.deform(mesh,foreign),point),ratio=distance(target.pelvis,target.neck)/distance(source.pelvis,source.neck),expected=batMaterialPoint({grip:source.pelvis,tip:source.neck,acrossScale:Math.max(.85,Math.min(1.12,Math.sqrt(ratio)))},{grip:target.pelvis,batTip:target.neck},point);
    assert.ok(distance(base,expected)<.05,'actual '+pose.sourceKey+' jersey triangles retain the torso surface at '+options.time);
    assert.ok(distance(base,stressed)<.05,'actual '+pose.sourceKey+' jersey pixels resist foreign shoulder/hip/arm hard-point compression');
  }
});

test('the actual outer helmet dome keeps its native head-bone surface under foreign crown, shoulder, and bat stress',async t=>{
  const v=await fixture(t);vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
  const art=v.w.BallparkInbetweenArt.batter.regrip,region=art.pins.surfaceRegions.helmet;
  assert.deepEqual(plain(region.bone),['neck','head']);assert.equal(region.feather,0);
  for(const time of [2005,2005+1e-6,2010,2070]){
    const pose=v.w.BallparkBatterMotion.sample(time);assert.equal(pose.sourceKey,'regrip');
    const source=pose.sourcePins,mesh=v.w.BallparkDeform.compile(source),target=plain(pose.pins),foreign=plain(target),follow=plain(target),ratio=distance(target.neck,target.head)/distance(source.neck,source.head),body={grip:source.neck,tip:source.head,acrossScale:Math.max(.85,Math.min(1.12,Math.sqrt(ratio)))},owner={grip:target.neck,batTip:target.head};
    for(const name of Object.keys(foreign))if(!['neck','head'].includes(name)){foreign[name][0]+=117;foreign[name][1]-=93;}
    for(const name of ['neck','head']){follow[name][0]+=7;follow[name][1]-=4;}
    const base=v.w.BallparkDeform.deform(mesh,target),stress=v.w.BallparkDeform.deform(mesh,foreign),moved=v.w.BallparkDeform.deform(mesh,follow);
    for(const name of ['headDomeTop','headDomeL','headDomeR']){
      const point=art.surfaceChecks[name];assert.ok(Math.min(...Object.values(source).map(p=>distance(p,point)))>5,'the blue dome observation is independent of hard joint pins');
      const pixel=rasterPoint(mesh,base,point),expected=batMaterialPoint(body,owner,point),stressed=rasterPoint(mesh,stress,point),following=rasterPoint(mesh,moved,point);
      assert.ok(distance(pixel,expected)<.05,'actual '+name+' keeps the native head-bone affine at '+time);
      assert.ok(distance(pixel,stressed)<.05,'actual '+name+' cannot flatten when foreign crown/shoulder/bat controls move');
      assert.ok(distance(following,[pixel[0]+7,pixel[1]-4])<.05,'the actual blue dome follows its head owner instead of freezing its pixels');
    }
  }
});

test('pitcher shifts weight around planted shoes and releases an empty hand exactly once',()=>{
  const {pitcher}=motionModules();
  for(const frontPlant of [[781.2857142857143,876.8571428571429],[740,860],[820,900]]){
    const ready=plain(pitcher.sample(0,{frontPlant}).pins),landing=plain(pitcher.sample(1850,{frontPlant}).pins),finish=plain(pitcher.sample(2400,{frontPlant}).pins);
    assert.ok(distance(finish.rearFoot,frontPlant)<distance([363,750],frontPlant),'right foot lands near the stride support instead of returning to the rubber');
    for(let time=0;time<=2400;time+=5){
      const sample=pitcher.sample(time,{frontPlant});finitePins(sample);
      assert.deepEqual(Object.keys(sample.pins),Object.keys(sample.sourcePins),'every source uses the same joint registration');
      if(time<=1000)assert.deepEqual(plain(sample.rearFoot),[363,750],'drive shoe holds the rubber before release at '+time);
      if(time>=1850&&time<=1970)assert.deepEqual(plain(sample.rearFoot),landing.rearFoot,'right shoe supports the first landing at '+time);
      if(time>=2140)assert.deepEqual(plain(sample.rearFoot),finish.rearFoot,'right shoe holds the final fielding ground point at '+time);
      if(time>=850)assert.deepEqual(plain(sample.frontFoot),frontPlant,'lead shoe supports the delivery and finish at '+time);
      assert.equal(sample.footContact.rear,time<=1000||(time>=1850&&time<=1970)||time>=2140,'right-foot contact excludes the follow-through and explicit forefoot reseat');
      assert.equal(sample.footContact.front,time<=160||time>=850,'the lead foot remains planted after its stride');
      if(time<=160)assert.deepEqual(plain(sample.frontFoot),ready.frontFoot,'initial ready stance holds its own ground point');
      assert.ok(distance(sample.releaseHand,sample.pins.handThrow)<1e-8);
      if(time>=1000)assert.ok(['release','decelerate','follow','balanced','turn','pivot','settle','ready','landing','fielding'].includes(sample.key),'no painted-ball source after release');
    }
    const release=pitcher.sample(1000,{frontPlant});
    assert.equal(release.key,'release');
    assert.deepEqual(plain(release.sourcePins.handThrow),[235,132]);
    assert.deepEqual(plain(pitcher.sample(5000,{frontPlant}).pins),finish,'fielding stance persists after the shot settles');
  }
});

test('the landing absorbs weight over fixed support shoes and settles into persistent fielding',()=>{
  const {pitcher}=motionModules();
  for(const frontPlant of [plain(pitcher.defaultFrontPlant),[740,860],[820,900]]){
    const opts={frontPlant},land=pitcher.sample(1850,opts),loaded=pitcher.sample(1970,opts),finish=pitcher.sample(2240,opts);
    assert.ok(loaded.pins.pelvis[1]>land.pins.pelvis[1]+1,'hips lower after the new right-foot landing');
    assert.ok(loaded.pins.kneeDrive[1]>land.pins.kneeDrive[1]+1,'the supporting knee absorbs the landing with the hips');
    for(let time=1850;time<=1970;time++){
      const p=pitcher.sample(time,opts);
      assert.equal(p.footContact.rear,true);assert.equal(p.footContact.front,true);
      assert.deepEqual(plain(p.rearFoot),plain(land.rearFoot));assert.deepEqual(plain(p.frontFoot),frontPlant);
    }
    let reseatLift=0;
    for(let time=1971;time<2140;time++){
      const p=pitcher.sample(time,opts);
      assert.equal(p.footContact.rear,false,'the measured forefoot reseat is not labelled a sliding planted foot');
      assert.equal(p.footContact.front,true);assert.deepEqual(plain(p.frontFoot),frontPlant);
      reseatLift=Math.max(reseatLift,p.ground.rear[1]-p.rearFoot[1]);
    }
    assert.ok(reseatLift>4&&reseatLift<12,'the small reseat lifts the right shoe above its ground projection');
    for(const time of [2240,2400,2401,3000,10000]){
      const p=pitcher.sample(time,opts);assert.deepEqual(plain(p.pins),plain(finish.pins));
      assert.equal(p.footContact.rear,true);assert.equal(p.footContact.front,true);
      assert.equal(p.persistentFinish,true);
    }
    assert.notDeepEqual(plain(finish.pins),plain(pitcher.sample(0,opts).pins),'defensive finish is not the ready pose on the rubber');
  }
});

test('the explicit walk back uses two lifted steps, fixed support feet, and continuous native joints',()=>{
  const {pitcher}=motionModules();assert.equal(pitcher.setupDuration,900);
  for(const frontPlant of [plain(pitcher.defaultFrontPlant),[740,860],[820,900]]){
    const opts={frontPlant},finish=pitcher.sample(2400,opts),ready=pitcher.sample(0,opts);
    assert.deepEqual(plain(pitcher.sampleSetup(0,900,opts).pins),plain(finish.pins));
    assert.deepEqual(plain(pitcher.sampleSetup(900,900,opts).pins),plain(ready.pins));
    assert.deepEqual(plain(pitcher.sampleSetup(5000,900,opts).pins),plain(ready.pins));
    let previous=pitcher.sampleSetup(0,900,opts),rearLift=0,frontLift=0;
    for(let time=1;time<=900;time++){
      const p=pitcher.sampleSetup(time,900,opts);finitePins(p);
      assert.ok(p.footContact.rear||p.footContact.front,'there is always a grounded support shoe');
      for(const name of Object.keys(p.pins))assert.ok(distance(previous.pins[name],p.pins[name])<5,'ordinary walk-back remains bounded in '+name+' at '+time);
      if(time<=72)assert.deepEqual(plain(p.rearFoot),plain(finish.rearFoot));
      if(time>=432)assert.deepEqual(plain(p.rearFoot),plain(ready.rearFoot));
      if(time<=468)assert.deepEqual(plain(p.frontFoot),frontPlant);
      if(time>=828)assert.deepEqual(plain(p.frontFoot),plain(ready.frontFoot));
      assert.equal(p.footContact.rear,!(time>72&&time<432));
      assert.equal(p.footContact.front,!(time>468&&time<828));
      for(const [role,foot]of [['rear',p.rearFoot],['front',p.frontFoot]]){
        if(p.footContact[role])assert.deepEqual(plain(p.ground[role]),plain(foot),'contact shadow is anchored to the supporting sole');
        else assert.ok(foot[1]<=p.ground[role][1]+1e-8,'an airborne shoe stays above its ground projection');
      }
      rearLift=Math.max(rearLift,p.ground.rear[1]-p.rearFoot[1]);frontLift=Math.max(frontLift,p.ground.front[1]-p.frontFoot[1]);
      if(previous.key!==p.key){
        let lo=time-1,hi=time;
        for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(pitcher.sampleSetup(mid,900,opts).key===previous.key)lo=mid;else hi=mid;}
        const left=pitcher.sampleSetup(hi-1e-6,900,opts),right=pitcher.sampleSetup(hi+1e-6,900,opts);
        for(const name of Object.keys(p.pins))assert.ok(distance(left.pins[name],right.pins[name])<.001,'source image selection cannot jump the walk-back pose');
      }
      previous=p;
    }
    assert.ok(rearLift>25&&frontLift>35,'both steps visibly clear the ground rather than skating');
    for(const boundary of [0,72,252,432,450,468,684,828,900]){
      const a=pitcher.sampleSetup(boundary-1e-6,900,opts),b=pitcher.sampleSetup(boundary+1e-6,900,opts);
      for(const name of Object.keys(a.pins))assert.ok(distance(a.pins[name],b.pins[name])<.001,'walk-back phase boundary is continuous in '+name+' at '+boundary);
    }
    for(const time of [0,72,252,432,450,468,684,828,900]){
      const a=pitcher.sampleSetup(time,900,opts),b=pitcher.sampleSetup(time*.55,495,opts);
      for(const name of Object.keys(a.pins))assert.ok(distance(a.pins[name],b.pins[name])<1e-8,'reduced duration preserves the same two-step pose');
    }
  }
});

test('the rendered finish persists and the next pitch or replay waits for the walk back without early resolution',async t=>{
  for(const reduced of [false,true]){
    const v=await fixture(t,{reduced}),s=reduced?.55:1,game=v.w.BallparkGame.create({seed:90210,autoSelect:true});
    let count=0,lastResult;v.scene.update(game.snapshot());
    const playGame=()=>{
      const tx=game.beginTake();assert.equal(tx.ok,true);
      return v.scene.play({...tx.animation,flightOffset:p=>game.flightOffset(tx.token,p),onContact:()=>{
        count++;const out=game.finishPitch(tx.token);assert.equal(out.ok,true);lastResult=out.result;v.scene.update(out.snapshot);return out.result;
      }});
    };
    const first=playGame();v.draw(1340*s);v.draw(2400*s);await first;
    const finish=plain(v.frames.at(-1).pitcher.pins);assert.equal(count,1);
    for(const time of [2401,2450,2500]){
      v.draw(time*s);assert.deepEqual(plain(v.frames.at(-1).pitcher.pins),finish,'actual idle drawing holds the fielding pose after shot removal');
      assert.equal(v.balls.length,0);
    }
    const next=game.advance();assert.equal(next.ok,true);v.scene.update(next.snapshot);v.draw(2500*s);
    assert.deepEqual(plain(v.frames.at(-1).pitcher.pins),finish,'next-pitch preparation begins exactly at the finish');
    const setupStart=v.scene.setup.start;v.scene.prepare();v.scene.update(game.snapshot());
    assert.equal(v.scene.setup.start,setupStart,'preparation feedback does not restart an active walk back');
    v.draw(2700*s);assert.notDeepEqual(plain(v.frames.at(-1).pitcher.pins),finish);
    const second=playGame(),pending=plain(game.snapshot());
    assert.ok(Math.abs(v.scene.shot.start-3400*s)<1e-8,'a pitch chosen during the walk back waits only its remaining duration');
    for(const time of [2700,3000,3399.999,3400,4399.999,4739.999]){
      v.draw(time*s);assert.equal(count,1);assert.deepEqual(plain(game.snapshot()),pending,'reset and flight do not publish the reserved result early');
      if(time<4400)assert.equal(v.balls.length,0,'no ball is launched during reset or the new windup');
    }
    assert.equal(v.scene.trace[0],'reset');v.draw(4740*s+1e-6);assert.equal(count,2);
    v.draw(5800*s+1e-6);await second;const secondFinish=plain(v.frames.at(-1).pitcher.pins);
    let replayContacts=0;
    const replay=v.scene.play({take:true,aimZone:null,flightOffset:p=>offset(lastResult.zone,p),onContact:()=>{replayContacts++;return lastResult;}});
    v.draw(5800*s+1e-6);assert.deepEqual(plain(v.frames.at(-1).pitcher.pins),secondFinish,'replay also begins with the current settled body');
    assert.ok(Math.abs(v.scene.shot.start-(6700*s+1e-6))<1e-8);
    v.draw(6699.999*s);assert.equal(v.balls.length,0);assert.equal(replayContacts,0);
    v.draw(8039.999*s);assert.equal(replayContacts,0);v.draw(8040*s+2e-6);assert.equal(replayContacts,1);
    v.draw(9100*s+2e-6);await replay;
  }
});

test('rendered shoe shadows distinguish planted soles from lifted follow-through, reseat, and walk-back feet',async t=>{
  const v=await fixture(t,{width:375,height:380});
  for(const options of [
    ...[0,600,860,1000,1150,1600,1850,1970,2020,2140,2400].map(time=>({time,options:{}})),
    ...[0,252,450,684,900].map(setupTime=>({time:0,options:{setupTime,setupDuration:900}}))
  ]){
    v.scene.inspect(options.time,options.options);v.draw(0);const f=v.frames.at(-1);
    assert.equal(v.shadows.length,4,'both actors keep exactly one shadow per shoe');
    for(const [i,role,foot]of [[0,'rear',f.pitcherRearFoot],[1,'front',f.pitcherFrontFoot]]){
      const shadow=v.shadows[i],contact=f.pitcher.footContact[role],ground=v.scene.point(f.pitcher.ground[role],f.pitcherPlacement);
      assert.ok(distance(shadow,contact?foot:ground)<1e-8,'pitcher '+role+' shadow follows its physical dirt point');
      assert.equal(shadow[4],contact?.28:.1,'grounded shoes receive a dense contact shadow');
      if(!contact)assert.ok(shadow[1]>=foot[1]-1e-8,'lifted-foot shadow remains on the dirt below the sole');
    }
    for(const [i,role,foot]of [[2,'rear',f.batterRearFoot],[3,'front',f.batterFrontFoot]]){
      const shadow=v.shadows[i],contact=f.batter.footContact[role],ground=v.scene.point(f.batter.ground[role],f.batterPlacement),centre=[ground[0],ground[1]+(role==='rear'?2*f.g.a:0)];
      assert.ok(distance(shadow,centre)<1e-8,'rear-camera batter '+role+' shadow uses its actual dirt projection');
      assert.equal(shadow[4],contact?.3:role==='rear'?.12:.1,'the batter lead-foot load cannot retain a grounded shadow');
      if(!contact)assert.ok(shadow[1]>=foot[1]-1e-8,'lifted batter shoe keeps its shadow beneath the ground projection');
    }
  }
  v.scene.clearInspection();
});

test('pitcher joints remain continuous through release, follow-through, reaction, and recovery',()=>{
  const {pitcher}=motionModules();
  for(const reaction of [undefined,'hit','home-run','foul','out']){
    // The freshly painted release/deceleration pair contains a deliberately
    // fast 125 ms throwing-arm arc. Bound that arc by its endpoint chain's
    // path length and the maximum smoothstep derivative, not an arbitrary
    // larger cap for the whole body or the rest of the delivery.
    const opts={reaction,terminal:true},a=pitcher.sample(1000,opts).pins,b=pitcher.sample(1125,opts).pins;
    const chain=['shoulderThrow','elbowThrow','wristThrow','handThrow'],fastBounds=articulatedSpeedBounds(a,b,chain,125);
    // The 650/700/745 native drawings contain a short glove extension.
    // The distal glove/wrist use independent articulated path bounds.
    // Its independent path bound uses the same articulated endpoint lengths
    // and angles; the shoulder/elbow/wrist still satisfy the original cap.
    const gloveCuts=[650,700,745],gloveChain=['shoulderGlove','elbowGlove','wristGlove','glove'];
    const gloveBounds=gloveCuts.slice(1).map((end,i)=>({start:gloveCuts[i],end,bounds:articulatedSpeedBounds(pitcher.sample(gloveCuts[i]).pins,pitcher.sample(end).pins,gloveChain,end-gloveCuts[i])}));
    const cuts=[0,160,500,560,650,700,745,850,920,970,1000,1125,1250,1600,1850,1970,2070,2155,2240,2400];
    const hairNames=['hairRoot','hairHigh','hairOuter','hairLow'];
    const hairBounds=cuts.slice(1).map((end,i)=>{
      const start=cuts[i],A=pitcher.sample(start).pins,B=pitcher.sample(end).pins;
      return{start,end,bounds:Object.fromEntries(hairNames.map(name=>[name,1.5*distance(A[name],B[name])/(end-start)]))};
    });
    const airCuts=[160,500,560,650,700,745,850],airChain=['hipLead','kneeLead','ankleLead','frontFoot'];
    const airBounds=airCuts.slice(1).map((end,i)=>({start:airCuts[i],end,bounds:articulatedSpeedBounds(pitcher.sample(airCuts[i]).pins,pitcher.sample(end).pins,airChain,end-airCuts[i])}));
    let previous=pitcher.sample(0,{reaction,terminal:true});
    for(let time=1;time<=2400;time++){
      const current=pitcher.sample(time,{reaction,terminal:true});
      for(const name of Object.keys(current.pins)){
        let bound=time>1000&&time<=1125&&name in fastBounds?fastBounds[name]+1e-6:5;
        if(['wristGlove','glove'].includes(name)&&time>650&&time<=745)bound=gloveBounds.find(w=>time>w.start&&time<=w.end).bounds[name]+1e-6;
        if(['kneeLead','ankleLead'].includes(name)&&time>160&&time<=850)bound=airBounds.find(w=>time>w.start&&time<=w.end).bounds[name]+1e-6;
        if(hairNames.includes(name)){
          const interval=hairBounds.find(w=>time>w.start&&time<=w.end);
          const anticipation=time<=160?Math.hypot(2,2.3)*Math.PI/160:0;
          const reacting=time>1420&&time<=1850&&['home-run','hit','foul','out'].includes(reaction);
          const reactionOffset=reacting?Math.hypot(reaction==='foul'?-2:2.5,reaction==='home-run'?-4:reaction==='foul'?1:-1.5)*Math.PI/430:0;
          bound=Math.max(5,interval.bounds[name]+anticipation+reactionOffset+1e-6);
        }
        assert.ok(distance(previous.pins[name],current.pins[name])<bound,'bounded one-millisecond motion in '+name+' at '+time+' for '+reaction);
      }
      if(previous.key!==current.key){
        let lo=time-1,hi=time;
        for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(pitcher.sample(mid,opts).key===previous.key)lo=mid;else hi=mid;}
        const left=pitcher.sample(hi-1e-6,opts),right=pitcher.sample(hi+1e-6,opts);
        for(const name of Object.keys(right.pins))assert.ok(distance(left.pins[name],right.pins[name])<.001,'source drawing switches without a target-joint jump in '+name);
      }
      previous=current;
    }
    assert.deepEqual(plain(previous.pins),plain(pitcher.sample(5000,{reaction,terminal:true}).pins),'settled motion holds the defensive finish');
  }
  const returned=pitcher.sample(1000);returned.pins.handThrow[0]=-999;
  assert.ok(pitcher.sample(1000).pins.handThrow[0]>0,'samples are independent');
  assert.deepEqual(plain(pitcher.sample(5000).pins),plain(pitcher.sample(2400).pins));
});

test('pitcher arms and airborne leg retain length while hips and hair respect projected source anatomy',()=>{
  const {pitcher}=motionModules();
  const chains=[
    {names:['shoulderThrow','elbowThrow','wristThrow','handThrow'],minimum:8},
    {names:['shoulderGlove','elbowGlove','wristGlove','glove'],minimum:8}
  ];
  // Hair changes screen sides because the figure turns in depth. Its projected
  // length may narrow, but it must not sweep out a new vertical spike that is
  // absent from every actual key drawing. Work in head-relative coordinates
  // so anticipation, body movement, and uniform registration remain allowed.
  const hairNames=['hairRoot','hairHigh','hairOuter','hairLow'];
  const sources=Object.values(pitcher.keyTimes).map(time=>pitcher.sample(time).pins);
  const envelopes=Object.fromEntries(hairNames.map(name=>[name,[0,1].map(axis=>({min:Math.min(...sources.map(p=>p[name][axis]-p.head[axis]))-8,max:Math.max(...sources.map(p=>p[name][axis]-p.head[axis]))+8}))]));
  const airChain=['hipLead','kneeLead','ankleLead','frontFoot'],airSources=[160,500,560,650,700,745,850].map(time=>pitcher.sample(time).pins);
  const airFloors=airChain.slice(1).map((name,i)=>Math.min(...airSources.map(p=>distance(p[airChain[i]],p[name])))*.95);
  for(let time=0;time<=2400;time++){
    const {pins}=pitcher.sample(time);
    for(const {names,minimum}of chains)for(let i=1;i<names.length;i++){
      assert.ok(distance(pins[names[i-1]],pins[names[i]])>minimum,names[i-1]+'→'+names[i]+' preserves visible length at '+time);
    }
    if(time>=160&&time<=850)for(let i=1;i<airChain.length;i++){
      assert.ok(distance(pins[airChain[i-1]],pins[airChain[i]])>=airFloors[i-1],'airborne lead-leg segment retains the native drawn length at '+time);
    }
    for(const hip of ['hipDrive','hipLead']){
      assert.ok(pins[hip].every(Number.isFinite),'projected hip is finite at '+time);
      assert.ok(distance(pins[hip],pins.pelvis)<100,'hip stays close to the pelvis at '+time);
    }
    assert.ok(Math.abs(pins.hipDrive[1]-pins.hipLead[1])<=80,'view yaw does not rotate the hip axis into an implausible vertical waist');
    for(const name of hairNames)for(const axis of [0,1]){
      const relative=pins[name][axis]-pins.head[axis],envelope=envelopes[name][axis];
      assert.ok(Number.isFinite(relative));
      assert.ok(relative>=envelope.min&&relative<=envelope.max,'projected '+name+' stays within the painted-view envelope at '+time);
    }
  }
});

test('the actual deformation mesh preserves artwork under identity and maps painted landmarks to reported targets',()=>{
  const w={};w.window=w;vm.createContext(w);
  for(const file of ['pitcher-art-v4.js','batter-art-v6.js','pitcher-art-v5.js','pitcher-motion.js','batter-motion.js','pose-deformer.js'])vm.runInContext(read(file),w,{filename:file});
  for(const source of [w.BallparkBatterMotion.poses.contact.pins,w.BallparkPitcherMotion.poses.release.pins]){
    const mesh=w.BallparkDeform.compile(source),identity=w.BallparkDeform.deform(mesh,source);
    assert.equal(mesh.indices.length%3,0);assert.ok(mesh.indices.length>0);
    for(const id of mesh.indices)assert.ok(id>=0&&id<mesh.vertices.length);
    for(let i=0;i<mesh.vertices.length;i++)assert.ok(distance([identity[i*2],identity[i*2+1]],mesh.vertices[i])<.001,'identity does not distort the existing drawing');
    const target=Object.fromEntries(Object.entries(source).map(([name,p])=>[name,[p[0]*1.05+17,p[1]*.95-12]]));
    const warped=w.BallparkDeform.deform(mesh,target);
    for(const [name,p]of Object.entries(source).filter(([name])=>!(source.occludedPins||[]).includes(name))){
      const i=mesh.vertices.findIndex(v=>distance(v,p)<1e-5);assert.ok(i>=0,'painted landmark is an actual vertex: '+name);
      if(mesh.landmarks[i]===name)assert.ok(distance([warped[i*2],warped[i*2+1]],target[name])<.001,'retained hard surface landmark agrees with reported target: '+name);
      else assert.ok(Object.values(source.surfaceRegions||{}).some(region=>insidePolygon(p,region.polygon)&&!region.bone.includes(name)),'a nonowner anatomical control inside an owned surface is not forced into the texture: '+name);
    }
  }
});

test('the historical stride-hand stress warp preserves its adjacent one-pixel artwork edge',async t=>{
  const v=await fixture(t,{width:960,height:720});
  vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
  const source=v.w.BallparkPitcherMotion.poses.stride.pins;
  const target=v.scene.motionSample(745).pitcher.pins;
  const mesh=v.w.BallparkDeform.compile(source),warped=v.w.BallparkDeform.deform(mesh,target);
  const vertex=point=>{const id=mesh.vertices.findIndex(v=>distance(v,point)<1e-5);assert.ok(id>=0,'the checked artwork point is part of the drawn mesh');return[warped[id*2],warped[id*2+1]];};
  const hand=vertex([97,160]),edge=vertex([96,160]);
  assert.ok(distance(hand,target.handThrow)<.001,'hand landmark still reaches its reported location');
  assert.ok(distance(hand,edge)<5,'a one-pixel hand edge cannot tear into a long strip');
});

test('hair and distal arm targets cannot drag the ready artwork face or jersey under the recovery stress warp',async t=>{
  const v=await fixture(t,{width:960,height:720});
  vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
  const source=v.w.BallparkPitcherMotion.poses.ready.pins,target=v.scene.motionSample(2210).pitcher.pins;
  const perturbed=plain(target);
  for(const name of ['hairRoot','hairHigh','hairOuter','hairLow']){
    perturbed[name][0]+=120;perturbed[name][1]-=150;
  }
  const map=(to,p)=>v.w.BallparkDeform.mapPoint(source,to,p);
  assert.ok(distance(map(target,[288,96]),map(perturbed,[288,96]))<.001,'hair cannot pull a cheek away from the head');
  for(const name of ['elbowThrow','wristThrow','handThrow']){
    perturbed[name][0]-=130;perturbed[name][1]+=100;
  }
  assert.ok(distance(map(target,[224,288]),map(perturbed,[224,288]))<.001,'crossing forearm and hair cannot pull a shirt panel away from the torso');
});

test('twenty-one body drawings and one complete bat are distinct alpha PNGs with measured source metadata',()=>{
  const w={};w.window=w;vm.createContext(w);
  for(const file of ['pitcher-art-v4.js','batter-art-v6.js','pitcher-art-v5.js'])vm.runInContext(read(file),w,{filename:file});
  const expected={pitcher:{unfold:650,lower:700,open:745,decelerate:1125,balanced:1850,turn:2070,pivot:2155,settle:2240,landing:1850,fielding:2240},batter:{ready:0,load:860,plant:1150,entry:1210,drive:1270,contact:1340,extend:1480,finish:1565,unwind:1940,regrip:2070,bunt:1340}},hashes=new Set();
  for(const [actor,keys]of Object.entries(expected))for(const [key,time]of Object.entries(keys)){
    const art=w.BallparkInbetweenArt[actor]?.[key];assert.ok(art,actor+' '+key+' has source-art registration');
    assert.equal(art.keyTime,time);assert.deepEqual(plain(art.normalizedPixels),[512,768]);
    const observed={...art.pins,...(art.surfaceChecks||{})},png=pngCutout(art.file,observed);assert.deepEqual([png.width,png.height],plain(art.sourcePixels),'metadata matches actual PNG dimensions');
    assert.ok(png.width>=512&&png.height>=768);assert.equal(png.minAlpha,0);assert.ok(png.maxAlpha>=250,'painted cutout contains substantially opaque pixels');
    assert.ok(png.transparent>png.width*png.height*.05,'actual transparent background');
    assert.ok(png.opaque>png.width*png.height*.02,'actual painted cutout content');
    assert.equal(Object.keys(png.pinAlpha).length,Object.keys(observed).length,'anatomical and independent surface observations are all sampled');
    const hidden=new Set(art.occludedPins||art.pins.occludedPins||[]);
    for(const [name,alpha]of Object.entries(png.pinAlpha))if(!hidden.has(name))assert.ok(alpha>=128,actor+' '+key+' '+name+' registers opaque source artwork');
    const optimized=webpCutout('assets/inbetweens/'+art.file.replace(/\.png$/,'.webp'));
    assert.deepEqual([optimized.width,optimized.height],[png.width,png.height],'runtime optimization keeps source resolution');
    assert.equal(optimized.alpha,true,'runtime optimization preserves alpha support');
    assert.equal(hashes.has(png.sha256),false,'the new poses are distinct PNG contents');hashes.add(png.sha256);
  }
  const bat=w.BallparkBatArt,batPNG=pngCutout(bat.file,{grip:bat.grip,tip:bat.tip,barrel:bat.barrel,knob:bat.knob,widthL:[bat.barrel[0]-20,bat.barrel[1]],widthR:[bat.barrel[0]+20,bat.barrel[1]]});
  assert.deepEqual([batPNG.width,batPNG.height],plain(bat.sourcePixels));assert.equal(batPNG.minAlpha,0);
  for(const [name,alpha]of Object.entries(batPNG.pinAlpha))assert.ok(alpha>=128,'the complete bat '+name+' anchor or width observation is actual opaque wood');
  assert.equal(hashes.has(batPNG.sha256),false);hashes.add(batPNG.sha256);
  const batRuntime=webpCutout('assets/inbetweens/'+bat.file.replace(/\.png$/,'.webp'));assert.equal(batRuntime.alpha,true);assert.deepEqual([batRuntime.width,batRuntime.height],plain(bat.sourcePixels));
  assert.equal(hashes.size,22);
});

test('pitcher native key drawings are selected and retain one uniform anatomical registration',async t=>{
  const v=await fixture(t),expected={unfold:650,lower:700,open:745,decelerate:1125,landing:1850,fielding:2240};
  const preserved=['crown','head','neck','shoulderThrow','elbowThrow','wristThrow','handThrow','shoulderGlove','elbowGlove','wristGlove','glove','pelvis','hipDrive','hipLead','hairRoot','hairHigh','hairOuter','hairLow'];
  for(const [key,time]of Object.entries(expected)){
    const sample=v.scene.motionSample(time).pitcher,art=v.w.BallparkInbetweenArt.pitcher[key];
    assert.equal(sample.sourceKey,key);assert.equal(sample.file,art.file);assert.equal(sample.usesInbetweens,true);
    const r=sample.registration,c=Math.cos(r.angle)*r.scale,s=Math.sin(r.angle)*r.scale;
    for(const name of preserved){const p=art.pins[name],x=p[0]-r.sourceAnchor[0],y=p[1]-r.sourceAnchor[1],registered=[r.targetAnchor[0]+x*c-y*s,r.targetAnchor[1]+x*s+y*c];assert.ok(distance(sample.pins[name],registered)<1e-6,'native '+key+' '+name+' is not replaced by a synthetic target');}
    v.painted.length=0;v.scene.inspect(time,{aimZone:4});v.draw(time);v.scene.clearInspection();
    const drawn=v.painted.find(p=>drawnAsset(p,art));assert.ok(drawn,'actual fresh '+key+' image reaches the painter');
    assert.equal(drawn.rect.nativeW,512);assert.equal(drawn.rect.nativeH,768);
    assert.deepEqual([drawn.rect.w,drawn.rect.h],plain(art.sourcePixels),'full high-resolution PNG is drawn in the normalized plane');
  }
});

test('every rear-camera batter key owns its source anatomy and uses the entire new image',async t=>{
  const v=await fixture(t),expected={ready:0,load:860,plant:1150,entry:1210,drive:1270,contact:1340,extend:1480,finish:1565,unwind:1940,regrip:2070};
  const preserved=['crown','head','neck','shoulderRear','shoulderFront','elbowRear','elbowFront','grip','pelvis','hipRear','hipFront','batTip'];
  for(const [key,time]of Object.entries(expected)){
    const sample=v.scene.motionSample(time).batter,art=v.w.BallparkInbetweenArt.batter[key];
    assert.equal(sample.sourceKey,key);assert.equal(sample.file,art.file);
    const rear=plain(v.w.BallparkBatterMotion.rearPlant),front=plain(v.w.BallparkBatterMotion.frontPlant),delta=[rear[0]-art.pins.rearFoot[0],rear[1]-art.pins.rearFoot[1]];
    for(const name of preserved)assert.ok(distance(sample.pins[name],[art.pins[name][0]+delta[0],art.pins[name][1]+delta[1]])<1e-6,'native '+key+' '+name+' remains the drawn anatomy');
    assert.deepEqual(plain(sample.rearFoot),rear);if(time<600||time>=1150)assert.deepEqual(plain(sample.frontFoot),front);
    v.painted.length=0;v.scene.inspect(time,{aimZone:4});v.draw(time);v.scene.clearInspection();
    const drawn=v.painted.find(p=>drawnAsset(p,art));assert.ok(drawn,'actual fresh '+key+' image reaches the painter');
    assert.equal(drawn.rect.nativeW,512);assert.equal(drawn.rect.nativeH,768);
    assert.deepEqual([drawn.rect.w,drawn.rect.h],plain(art.sourcePixels));
  }
});

test('idle, take, bunt, recovery, and pitcher reset use only accepted rear-camera batter sources',async t=>{
  const v=await fixture(t),keys=['ready','load','plant','entry','drive','contact','extend','finish','unwind','regrip','bunt'];
  const registered=v.w.BallparkInbetweenArt.batter;
  assert.deepEqual(Object.keys(registered).sort(),keys.slice().sort(),'the active registry contains the complete new set and no old front views');
  const allowed=new Set(keys.map(k=>registered[k].file.replace(/\.png$/,'.webp')));
  for(const image of v.loadedImages.filter(x=>x.includes('batter'))){
    assert.ok(allowed.has(image.split('/').at(-1)),'only an accepted new source is loaded: '+image);
    assert.ok(!/atlas|draft|-v4\.|runtime\/batter\./.test(image));
  }
  for(const options of [{},{take:true},{kind:'bunt'},{setupTime:450,setupDuration:900}]){
    for(const time of [-1,0,600,860,1000,1150,1210,1270,1340,1480,1565,1810,1940,2070,2310,2400,3000]){
      v.painted.length=0;v.scene.inspect(time,options);v.draw(0);
      const f=v.frames.at(-1).batter,drawn=v.painted.find(p=>p.image.includes('batter'));
      assert.ok(keys.includes(f.sourceKey));assert.ok(/-v6\.png$/.test(f.file));
      assert.ok(drawnAsset(drawn,registered[f.sourceKey]));
      assert.equal(drawn.rect.x,0);assert.equal(drawn.rect.y,0);
      assert.match(f.camera,/rear three-quarter/);
      if(options.take||Number.isFinite(options.setupTime))assert.equal(f.sourceKey,'ready','taking and resetting cannot turn into a frontal atlas pose');
    }
  }
  v.scene.clearInspection();
  const saved=registered.contact;delete registered.contact;
  assert.throws(()=>v.w.BallparkBatterMotion.sample(1340),/후면 타자 원화가 없습니다/,'missing contact art fails clearly instead of substituting a frontal pose');
  assert.throws(()=>v.w.BallparkBatterMotion.sample(1340,{kind:'bunt'}),/후면 타자 원화가 없습니다/);
  registered.contact=saved;
  const savedBunt=registered.bunt;delete registered.bunt;
  assert.throws(()=>v.w.BallparkBatterMotion.sample(1340,{kind:'bunt'}),/후면 타자 원화가 없습니다/,'missing dedicated bunt art cannot fall back to a normal or frontal pose');
  registered.bunt=savedBunt;
});

test('grounded rendered shoe contact outlines stay inside the independently measured left batter box',async t=>{
  // These chalk corners are measured from the stadium image in its 960x720
  // plane. They are independent of the actor's foot anchors and placement.
  const chalk=[[325,558],[443,558],[437,646],[282,646]],tolerance=3;
  const margin=p=>Math.min(...chalk.map((a,i)=>{const b=chalk[(i+1)%chalk.length],dx=b[0]-a[0],dy=b[1]-a[1];return(dx*(p[1]-a[1])-dy*(p[0]-a[0]))/Math.hypot(dx,dy);}));
  const times=[-1,0,600,860,1000,1150,1210,1270,1340,1480,1565,1810,1940,2070,2310,2400];
  for(let time=40;time<2400;time+=40)times.push(time);
  for(const [width,height]of [[960,720],[375,380],[568,152]]){
    const v=await fixture(t,{width,height});vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
    const samples=[];
    for(const options of [{},{take:true},{kind:'bunt'}])for(const time of times)samples.push({time,options});
    for(const zone of [0,1,2,3,4,5,6,7,8])for(const kind of ['basic','bunt'])samples.push({time:1340,options:{aimZone:zone,kind,result:resultFor(zone)}});
    for(const {time,options}of samples){
      const frame=v.scene.motionSample(time,options),pose=frame.batter,g=frame.g;
      for(const role of ['rear','front']){
        if(!pose.footContact[role])continue;
        const sole=pose.shoeContacts?.[role]?.contactHull;assert.ok(sole&&sole.length>=3,'ground contact has observed source-sole metadata');
        for(const sourcePoint of sole){
          const native=v.w.BallparkDeform.mapPoint(pose.sourcePins,pose.pins,sourcePoint),screen=v.scene.point(native,frame.batterPlacement),world=[(screen[0]-(g.offsetX||0))/g.sx+g.cropX,(screen[1]-(g.offsetY||0))/g.sy];
          assert.ok(margin(world)>=-tolerance,'grounded '+role+' source '+pose.sourceKey+' sole '+JSON.stringify(sourcePoint)+' maps outside chalk at '+width+'x'+height+'/'+time+': '+JSON.stringify(world));
        }
      }
    }
  }
});

test('actual rear helmet and jersey interiors remain attached to the head and torso when foreign joints move',async t=>{
  const v=await fixture(t);vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
  for(const [key,art]of Object.entries(v.w.BallparkInbetweenArt.batter)){
    const pose=v.scene.motionSample(art.keyTime,{kind:key==='bunt'?'bunt':undefined}).batter,source=art.pins,target=pose.pins;
    assert.ok(source.surfaceRegions?.jersey,'the actual white back panel has observed source ownership');
    for(const [label,point,protectedNames]of [
      ['headBack',art.surfaceChecks.headBack,['crown','head','neck']],
      ['jerseyBack',art.surfaceChecks.jerseyBack,['pelvis','neck']]
    ]){
      assert.ok(Math.min(...Object.values(source).map(p=>distance(p,point)))>5,'the inspected '+label+' point is independent of hard rig landmarks');
      const perturbed=plain(target);
      for(const name of Object.keys(perturbed))if(!protectedNames.includes(name)){
        perturbed[name][0]+=117;perturbed[name][1]-=93;
      }
      const a=v.w.BallparkDeform.mapPoint(source,target,point),b=v.w.BallparkDeform.mapPoint(source,perturbed,point);
      assert.ok(distance(a,b)<.001,'foreign bat/arm/leg targets cannot drag the painted '+key+' '+label+' surface');
    }
  }
});

test('the actual source contact soles move rigidly with their own ankle and foot instead of a neighboring shin',async t=>{
  const v=await fixture(t);vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
  for(const [key,art]of Object.entries(v.w.BallparkInbetweenArt.batter)){
    const pose=v.scene.motionSample(art.keyTime,{kind:key==='bunt'?'bunt':undefined}).batter;
    for(const [role,protectedNames]of [['rear',['ankleRear','rearFoot']],['front',['ankleFront','frontFoot']]]){
      assert.ok(art.pins.surfaceRegions?.[role+'Shoe'],'source '+key+' '+role+' shoe has independently observed texture ownership');
      const perturbed=plain(pose.pins);
      for(const name of Object.keys(perturbed))if(!protectedNames.includes(name)){
        perturbed[name][0]-=103;perturbed[name][1]+=87;
      }
      for(const point of art.shoeContacts[role].contactHull){
        const a=v.w.BallparkDeform.mapPoint(art.pins,pose.pins,point),b=v.w.BallparkDeform.mapPoint(art.pins,perturbed,point);
        assert.ok(distance(a,b)<.001,'painted '+key+' '+role+' contact sole '+JSON.stringify(point)+' is not pulled by the adjacent shin or other body parts');
      }
    }
  }
});

test('the actual field image, actors, and contact lane share a uniform camera above home plate at every aspect ratio',async t=>{
  for(const [width,height]of [[960,720],[375,380],[568,152]]){
    const v=await fixture(t,{width,height});v.draw(0);const g=v.scene.geometry(),draw=v.calls.find(c=>c.method==='drawImage'&&c.args.length===9&&c.args[0]?.url.includes('stadium'));
    assert.ok(draw,'the actual stadium image reaches the canvas');
    assert.ok(Math.abs(g.sx-g.sy)<1e-10,'the stadium perspective is not stretched independently of the player');
    assert.ok(Math.abs(draw.args[5]-g.x(g.cropX))<1e-8);assert.ok(Math.abs(draw.args[6]-g.y(0))<1e-8);
    assert.ok(Math.abs(draw.args[7]-g.cropW*g.sx)<1e-8);assert.ok(Math.abs(draw.args[8]-720*g.sy)<1e-8,'chalk and plate use the same drawn destination rectangle');
    const contact=v.scene.contactPoint(4,g),world=[(contact[0]-(g.offsetX||0))/g.sx+g.cropX,(contact[1]-(g.offsetY||0))/g.sy];
    assert.ok(Math.abs(world[0]-491)<12,'center contact stays above the independently observed plate center, not above the batter box');
    assert.ok(world[1]>440&&world[1]<550,'contact is at batting height above the ground plate');
    const left=v.scene.contactPoint(3,g),right=v.scene.contactPoint(5,g);
    assert.ok(left[0]<contact[0]&&right[0]>contact[0],'pitch width keeps its left-to-right camera ordering');
  }
});

test('viewport aspect ratio cannot change the native character anatomy or delivery scale',async t=>{
  const baseline=await fixture(t,{width:960,height:720});
  const times=[0,650,700,745,850,1000,1125,1210,1340,1565,1850,2070,2155,2240,2400];
  for(const [width,height]of [[375,380],[568,152]]){
    const v=await fixture(t,{width,height});
    for(const time of times){
      const expected=baseline.scene.motionSample(time,{aimZone:4}),actual=v.scene.motionSample(time,{aimZone:4});
      assert.equal(actual.pitcher.sourceKey,expected.pitcher.sourceKey);
      assert.ok(Math.abs(actual.pitcher.registration.scale-expected.pitcher.registration.scale)<1e-10,'registration uses uniform actor scale instead of field stretch');
      for(const actor of ['pitcher','batter'])for(const name of Object.keys(expected[actor].pins)){
        assert.ok(distance(actual[actor].pins[name],expected[actor].pins[name])<1e-8,actor+' '+name+' keeps its native anatomy at '+width+'×'+height+' / '+time);
      }
      if(time===850)assert.ok(distance(actual.pitcher.frontFoot,[781.2857142857143,876.8571428571429])<1e-8,'delivery plants in the same native plane');
    }
  }
});

test('crossed-leg paint follows its visible thigh and shin instead of an occluded driving hip',async t=>{
  const v=await fixture(t);
  vm.runInContext(read('pose-deformer.js'),v.w,{filename:'pose-deformer.js'});
  const source=v.w.BallparkInbetweenArt.pitcher.unfold.pins,target=v.scene.motionSample(690).pitcher.pins;
  assert.ok(source.occludedPins.includes('hipDrive'),'hidden anatomical hip is explicitly marked');
  const mesh=v.w.BallparkDeform.compile(source),hidden=mesh.vertices.findIndex(p=>distance(p,source.hipDrive)<1e-5);
  assert.ok(hidden>=0);assert.notEqual(mesh.landmarks[hidden],'hipDrive','a hidden hip cannot hard-pin the cloth painted in front');
  const map=(to,p)=>v.w.BallparkDeform.mapPoint(source,to,p),shift=[18,-12];
  const moved=(names)=>{const changed=plain(target);for(const name of names){changed[name][0]+=shift[0];changed[name][1]+=shift[1];}return changed;};
  const white=[320,384],black=[288,384],driveMoved=moved(['hipDrive','kneeDrive','ankleDrive','rearFoot']);
  assert.ok(distance(map(target,white),map(driveMoved,white))<.001,'visible white thigh cloth cannot follow the driving leg behind it');
  assert.ok(distance(map(target,black),map(driveMoved,black))<.001,'visible black stocking cannot follow the driving leg behind it');
  const thighMoved=moved(['hipLead','kneeLead']),shinMoved=moved(['kneeLead','ankleLead','frontFoot']);
  const delta=(next,previous)=>[next[0]-previous[0],next[1]-previous[1]];
  assert.ok(distance(delta(map(thighMoved,white),map(target,white)),shift)<.001,'white cloth follows its actual visible thigh');
  assert.ok(distance(delta(map(shinMoved,black),map(target,black)),shift)<.001,'stocking keeps the shin in front at the crossing');
  const uniform=Object.fromEntries(Object.entries(source).map(([name,p])=>[name,[p[0]+13,p[1]-7]]));
  for(const point of [white,black,source.hipDrive])assert.ok(distance(map(uniform,point),[point[0]+13,point[1]-7])<.001,'occlusion metadata preserves an untouched native drawing');
});
