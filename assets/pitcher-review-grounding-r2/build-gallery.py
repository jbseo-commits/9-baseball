#!/usr/bin/env python3
"""Build a self-contained 12-pose inspection gallery from the external manifest."""
import base64, io, json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parent
MANIFEST=ROOT/'manifest.json'
CAMERA=ROOT/'references'/'game-camera.json'
SKILLS=ROOT/'skills'/'roster-skills.json'
FXMAP=ROOT/'skills'/'effects-map.json'
TEMPLATE=ROOT/'gallery-template.html'
OUT=ROOT/'gallery.html'
PHASES=['set','gather','leg-lift','hand-break-stride','foot-plant','arm-whip','release','early-follow','follow-through','recovery-step','recover','settle']
CAPTURES={'desktop':'desktop-game-plate.png','phone':'phone-landscape-game-plate.png'}

def die(msg): raise SystemExit('build-gallery: '+msg)
def uri(raw, mime): return f'data:{mime};base64,'+base64.b64encode(raw).decode()
def embedded(path,mime):
    if not path.is_file(): die(f'missing {path.relative_to(ROOT)}')
    return uri(path.read_bytes(),mime)
def embedded_webp(path,lossless=True):
    try:
        with Image.open(path) as im:
            b=io.BytesIO()
            im.convert('RGBA').save(b,'WEBP',lossless=lossless,quality=94,method=5)
            return uri(b.getvalue(),'image/webp')
    except Exception as e: die(f'cannot embed image {path}: {e}')
def image_uri(path, resize=None):
    try:
        with Image.open(path) as im:
            im=im.convert('RGBA')
            if resize: im=im.resize(resize,Image.Resampling.NEAREST)
            b=io.BytesIO();im.save(b,'WEBP',quality=94,method=4,exact=False)
            return uri(b.getvalue(),'image/webp')
    except Exception as e: die(f'cannot encode {path}: {e}')
def inside(rel):
    p=(ROOT/rel).resolve()
    if ROOT.resolve() not in p.parents: die(f'asset path escapes production package: {rel}')
    return p

def main():
    for p in (MANIFEST,CAMERA,SKILLS,FXMAP,TEMPLATE):
        if not p.is_file(): die(f'missing {p.name}')
    manifest=json.loads(MANIFEST.read_text()); cam=json.loads(CAMERA.read_text()); skills=json.loads(SKILLS.read_text()); fxmap=json.loads(FXMAP.read_text())
    chars=manifest.get('characters')
    if not isinstance(chars,list) or not chars: die('manifest.characters must contain candidates')
    def ready(ch):
        if ch.get('status')!='motion_candidate': return False
        poses=ch.get('poses') or ch.get('pose_files') or []
        previews=ch.get('preview_frames') or []
        prior=ch.get('prior_preview_frames') or []
        return len(poses)==12 and len(previews)==12 and len(prior)==12 and all((ROOT/p).is_file() for p in poses+previews+prior)
    chars=[c for c in chars if ready(c)]
    if not chars: die('no complete motion_candidate characters with 12 source and preview files')
    captures={}
    for key,filename in CAPTURES.items():
        row=next((x for x in cam.get('captures',[]) if x.get('capture')==('phone-landscape' if key=='phone' else key)),None)
        if not row: die(f'missing capture metadata: {key}')
        plate=embedded_webp(ROOT/'references'/filename,lossless=False)
        captures[key]={**row,'plate':plate}
    skill_by_id={x['artId']:x for x in skills['entries']}
    compiled=[]
    for ch in chars:
        slug=ch.get('slug') or ch.get('artId')
        # Accept the production schema and the earlier five-pose package names, without inventing data.
        pose_paths=ch.get('poses') or ch.get('pose_files')
        preview_paths=ch.get('preview_frames')
        if len(pose_paths or [])!=12 or len(preview_paths or [])!=12: die(f'{slug}: poses and preview_frames must each contain 12 files')
        times=ch.get('phase_ms')
        if len(times or [])!=12: die(f'{slug}: phase_ms must contain 12 timestamps')
        reg=ch.get('registration') or {}
        anchor=ch.get('anchor') or reg.get('anchor')
        if isinstance(anchor,dict): anchor=[anchor.get('x'),anchor.get('y')]
        if not anchor or len(anchor)!=2 or any(not isinstance(v,(int,float)) for v in anchor): die(f'{slug}: anchor with numeric x/y required')
        relpt=ch.get('release_point') or reg.get('release_point') or ch.get('release')
        if isinstance(relpt,dict): relpt=[relpt.get('x'),relpt.get('y')]
        if not relpt or len(relpt)!=2: die(f'{slug}: release_point required')
        landing=ch.get('landing_point')
        if isinstance(landing,dict): landing=[landing.get('x'),landing.get('y')]
        if landing is not None and (len(landing)!=2 or any(not isinstance(v,(int,float)) for v in landing)): die(f'{slug}: landing_point must be numeric x/y')
        duration=ch.get('duration_ms')
        if not isinstance(duration,(int,float)) or duration<max(times): die(f'{slug}: invalid duration_ms')
        height=ch.get('scale_basis_height')
        if not isinstance(height,(int,float)) or height<=0: die(f'{slug}: positive scale_basis_height (alpha bbox) required')
        pose_data=[]
        for i,(raw,preview) in enumerate(zip(pose_paths,preview_paths)):
            p=inside(raw); v=inside(preview)
            if not p.is_file() or not v.is_file(): die(f'{slug} pose {i}: missing source or preview file')
            before_paths=ch.get('prior_preview_frames') or []
            pose_data.append({'src':embedded_webp(v,lossless=True),'before':embedded_webp(inside(before_paths[i]),lossless=True) if before_paths else None,'label':PHASES[i],'time':times[i]})
        artid=ch.get('artId',slug)
        prior_anchor=ch.get('prior_anchor',anchor); prior_height=ch.get('prior_scale_basis_height',height); prior_release=ch.get('prior_release_point',relpt)
        if isinstance(prior_anchor,dict): prior_anchor=[prior_anchor.get('x'),prior_anchor.get('y')]
        if isinstance(prior_release,dict): prior_release=[prior_release.get('x'),prior_release.get('y')]
        compiled.append({**ch,'slug':slug,'artId':artid,'anchor':anchor,'release_point':relpt,'landing_point':landing,'prior_anchor':prior_anchor,'prior_scale_basis_height':prior_height,'prior_release_point':prior_release,'poses':pose_data,'skill':skill_by_id.get(artid)})
    effects=[]
    for fx in fxmap.get('effects',[]):
        sheet=inside(fx['sheet']); meta=inside(fx['metadata'])
        if not sheet.is_file() or not meta.is_file(): die(f"missing effect pair {fx['slot']}")
        effects.append({**fx,'sheet':embedded_webp(sheet,lossless=True),'meta':json.loads(meta.read_text())})
    payload={'captures':captures,'characters':compiled,'phases':PHASES,'effects':effects,'effectContract':fxmap.get('placementContract',{})}
    js=r'''const D=__PAYLOAD__;const $=s=>document.querySelector(s),fmt=n=>Number(n).toFixed(2)+'px';let ci=0,idx=0,reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches,playing=!reduceMotion,speed=1,timer=null,start=performance.now(),offset=0,lastFx=-1;const names={'set':'Set','gather':'Gather','leg-lift':'Leg lift','hand-break-stride':'Hand break / stride','foot-plant':'Foot plant','arm-whip':'Arm whip','release':'Release','early-follow':'Early follow','follow-through':'Follow-through','recovery-step':'Recovery step','recover':'Recover','settle':'Settle'};const char=()=>D.characters[ci],layout=()=>D.captures[$('#layout').value];
const urls=new Map();function sheetFrame(fx,n){let key=fx.slot+':'+n;if(urls.has(key))return urls.get(key);const meta=fx.meta.frames[n%fx.meta.frames.length].frame;const cv=document.createElement('canvas');cv.width=meta.w;cv.height=meta.h;const c=cv.getContext('2d'),im=new Image();im.src=fx.sheet;const pending=new Promise(resolve=>{im.onload=()=>{c.drawImage(im,meta.x,meta.y,meta.w,meta.h,0,0,meta.w,meta.h);cv.toBlob(b=>{let u=URL.createObjectURL(b);resolve(u)},'image/png')};im.onerror=()=>resolve('')});urls.set(key,pending);return pending}
function setCharacter(){const c=char();$('#who').textContent=`${c.name} · ${c.slug}`;$('#skillName').textContent=c.skill?.gimmick?.label||'캐릭터 고유 기믹 없음';$('#skillSummary').textContent=c.skill?.gimmick?.summary||'현재 데이터에 등록된 캐릭터 고유 스킬/기믹이 없습니다.';syncPhaseFromHp();updatePhase();$('#metadata').textContent=`${c.tier||'roster'} · ${c.slug} · ${c.throwing_hand||'hand unspecified'} hand · ${c.status||'motion candidate'} · ${c.poses.length} authored stills`;renderTiles();render();}
function syncPhaseFromHp(){const hp=+$('#hp').value;$('#phase').value=hp<=.3?'critical':hp<=.6?'pressured':'steady'}
function updatePhase(){const c=char(),g=c.skill?.gimmick,ph=$('#phase').value,lines=[];if(g&&ph!=='steady'&&g.phases?.pressured)lines.push(`압박 단계 공개 효과(위기 단계에도 유지): ${g.phases.pressured}`);if(g&&ph==='critical'&&g.phases?.critical)lines.push(`위기 단계 추가 효과: ${g.phases.critical}`);if(g&&ph==='pressured'&&g.phases?.pressured)lines.splice(0,1,`압박 단계 공개 효과: ${g.phases.pressured}`);$('#phaseSummary').textContent=g?[g.summary,...(lines.length?lines:[g.phaseRules?.[ph]||'현재 HP 단계에서 추가 공개 단계 효과가 없습니다.'])].join(' '):'이 투수에는 기존 gimmickFor 매핑이 없습니다.';document.querySelectorAll('[data-phase]').forEach(b=>b.classList.toggle('active',b.dataset.phase===ph));}
function renderTiles(){const host=$('#poses');host.replaceChildren();char().poses.forEach((p,i)=>{let b=document.createElement('button');b.className='pose'+(i===idx?' selected':'');b.innerHTML=`<img alt="${p.label}" src="${p.src}"><small>${String(i+1).padStart(2,'0')} ${p.label}</small>`;b.onclick=()=>{playing=false;$('#play').textContent='재생';idx=i;offset=char().phase_ms[i];start=performance.now();render()};host.append(b)})}
function groundingPoint(x,y,cls,label){const svg=$('#contactPoints'),actor=$('#pitcher'),p=document.createElementNS('http://www.w3.org/2000/svg','circle');p.setAttribute('cx',actor.offsetLeft+x*actor.offsetWidth/512);p.setAttribute('cy',actor.offsetTop+y*actor.offsetHeight/512);p.setAttribute('r',4);p.setAttribute('fill',cls);p.setAttribute('stroke','#071017');p.setAttribute('stroke-width','1.5');p.dataset.label=label;svg.append(p)}
function frameAt(ms){let p=char().phase_ms;let i=0;for(let n=0;n<p.length;n++)if(ms>=p[n])i=n;return Math.min(i,p.length-1)}
function render(){const c=char(),cap=layout(),screen=$('#screen'),plate=$('#plate'),viewport=cap.viewport;screen.style.aspectRatio=viewport.width+'/'+viewport.height;plate.src=cap.plate;const k=screen.getBoundingClientRect().width/viewport.width,mode=$('#comparison').value,after=mode==='after',m=after?(cap.rubberScreen?.contact||cap.moundScreen):cap.moundScreen,anchor=after?c.anchor:c.prior_anchor,reference=cap.actorHeightReference||0,capKey=$('#layout').value;const visibleHeight=reference*342/640;const scale=visibleHeight/(after?c.scale_basis_height:c.prior_scale_basis_height||c.scale_basis_height||512)*k;const im=c.poses[idx];const actor=$('#pitcher');actor.src=after?im.src:(im.before||im.src);actor.style.width=fmt(512*scale);actor.style.height=fmt(512*scale);actor.style.left=fmt(m.x*k-anchor[0]*scale);actor.style.top=fmt(m.y*k-anchor[1]*scale);$('#foot').style.left=fmt(m.x*k);$('#foot').style.top=fmt(m.y*k);$('#groundSvg').classList.toggle('hidden',!$('#groundGuide').checked||!cap.rubberScreen?.polygon);if(cap.rubberScreen?.polygon)$('#rubberOutline').setAttribute('points',cap.rubberScreen.polygon.map(p=>`${p[0]*k},${p[1]*k}`).join(' '));$('#contactPoints').replaceChildren();if($('#groundGuide').checked){const prep=after?(c.grounding?.preparation_contacts||{}):(c.prior_grounding?.preparation_contacts||{}),landing=after?c.landing_point:c.prior_landing_point;['0','1','2'].forEach(key=>{const q=prep[key];if(q)groundingPoint(q.x,q.y,'#58e0c2',`prep-${key}`)});if(idx===4&&landing)groundingPoint(Array.isArray(landing)?landing[0]:landing.x,Array.isArray(landing)?landing[1]:landing.y,'#ff9d77','landing')}const zb=$('#zoneBounds'),z=cap.zone;zb.style.left=fmt(z.x*k);zb.style.top=fmt(z.y*k);zb.style.width=fmt(z.width*k);zb.style.height=fmt(z.height*k);zb.classList.toggle('hidden',!$('#zoneToggle').checked);$('#mound').textContent=`${after?'러버 접점':'기존 마운드점'} ${m.x.toFixed(1)}, ${m.y.toFixed(1)} · ${capKey}`;$('#size').textContent=`alpha bbox 기준 표시 높이 ${Math.round((after?c.scale_basis_height:c.prior_scale_basis_height||c.scale_basis_height)*scale)}px`;$('#release').textContent=`릴리스 ${c.release_ms}ms · frame ${c.release_frame_contract??'—'}`;$('#poseLabel').textContent=`${String(idx+1).padStart(2,'0')}/12 · ${names[im.label]} · ${im.time}ms`;document.querySelectorAll('.pose').forEach((b,i)=>b.classList.toggle('selected',i===idx));renderFX(k,m,c);renderBall(k,m,c);}
let fxSeq=0;async function renderFX(k,m,c){const seq=++fxSeq,on=$('#effects').checked,map=D.effects,g=c.skill?.gimmick?.id,target=map.find(x=>x.slot===g)||null,landing=map.find(x=>x.slot==='landing-dust'),release=map.find(x=>x.slot==='release-flash'),phase=idx,fx=$('#fx'),dust=$('#dust'),tm=playing?offset+(performance.now()-start)*speed:offset,after=$('#comparison').value==='after',scale=(layout().actorHeightReference*342/640)/(after?c.scale_basis_height:(c.prior_scale_basis_height||c.scale_basis_height||512))*k;if(!on){fx.classList.add('hidden');dust.classList.add('hidden');return}const releaseStart=c.release_ms-(release?.previewStartOffsetMs||0),releaseDuration=release?release.meta.frames.length*1000/(release.meta.meta?.pixelfx?.fps||30):0;if(release&&phase===6&&tm>=releaseStart&&tm<releaseStart+releaseDuration){const n=effectFrame(release,tm-releaseStart),u=await sheetFrame(release,n);if(seq!==fxSeq)return;if(u){const after=$('#comparison').value==='after',a=after?c.anchor:c.prior_anchor,r=after?c.release_point:c.prior_release_point,b=effectBox(release,32,24,scale),x=m.x*k+(r[0]-a[0])*scale,y=m.y*k+(r[1]-a[1])*scale;fx.src=u;fx.dataset.slot=release.slot;fx.style.left=fmt(x-b.px);fx.style.top=fmt(y-b.py);fx.style.width=fmt(b.w);fx.style.height=fmt(b.h);fx.classList.remove('hidden')}}else if(target&&phase>=2&&phase<6){const n=effectFrame(target,tm-c.phase_ms[2]),u=await sheetFrame(target,n);if(seq!==fxSeq)return;if(u){const b=effectBox(target,58,46,scale);fx.src=u;fx.dataset.slot=target.slot;fx.style.left=fmt(m.x*k-b.px);fx.style.top=fmt(m.y*k-b.py);fx.style.width=fmt(b.w);fx.style.height=fmt(b.h);fx.classList.remove('hidden')}}else fx.classList.add('hidden');if(phase===4&&landing){const n=effectFrame(landing,tm-c.phase_ms[4]);if(n!==lastFx){lastFx=n;const u=await sheetFrame(landing,n);if(seq!==fxSeq)return;if(u)dust.src=u}const b=effectBox(landing,48,26,scale),after=$('#comparison').value==='after',lp=c.landing_point,a=after?c.anchor:c.prior_anchor,x=after&&lp?m.x*k+(lp[0]-a[0])*scale:m.x*k,y=after&&lp?m.y*k+(lp[1]-a[1])*scale:(m.y+3)*k;dust.dataset.slot=landing.slot;dust.style.left=fmt(x-b.px);dust.style.top=fmt(y-b.py);dust.style.width=fmt(b.w);dust.style.height=fmt(b.h);dust.classList.remove('hidden')}else dust.classList.add('hidden')}
function effectFrame(fx,elapsed){const meta=fx.meta.meta?.pixelfx||{},len=fx.meta.frames.length,raw=Math.max(0,Math.floor(elapsed*(meta.fps||30)/1000));return meta.loop?raw%len:Math.min(len-1,raw)}
function effectBox(fx,maxW,maxH,scale){const meta=fx.meta.meta?.pixelfx||{},size=meta.frameSize||[64,64],pivot=meta.pivot||[size[0]/2,size[1]/2],s=Math.min(scale,maxW/size[0],maxH/size[1]);return {w:size[0]*s,h:size[1]*s,px:pivot[0]*s,py:pivot[1]*s}}
function renderBall(k,m,c){let t=playing?offset+(performance.now()-start)*speed:offset;const ball=$('#ball'),dt=t-c.release_ms;if(dt<0||dt>300){ball.classList.add('hidden');return}ball.classList.remove('hidden');const p=dt/300,after=$('#comparison').value==='after',r=after?c.release_point:c.prior_release_point,anchor=after?c.anchor:c.prior_anchor,cap=layout(),home=cap.homeScreen||m,s=(cap.actorHeightReference*342/640)/(after?c.scale_basis_height:c.prior_scale_basis_height||c.scale_basis_height||512);const x0=m.x+(r[0]-anchor[0])*s,y0=m.y+(r[1]-anchor[1])*s;ball.style.left=fmt((x0+(home.x-x0)*p)*k);ball.style.top=fmt((y0+(home.y-y0)*p)*k);ball.style.width=fmt((3+7*p)*k);ball.style.height=fmt((3+7*p)*k);}
function tick(){if(playing&&!reduceMotion){const now=performance.now(),t=offset+(now-start)*speed;if(t>=char().duration_ms){offset=0;start=now;idx=0;renderTiles();render()}else{let next=frameAt(t);if(next!==idx){idx=next;renderTiles();render()}else render()}}requestAnimationFrame(tick)}
function setTime(v){playing=false;$('#play').textContent='재생';offset=Math.max(0,Math.min(char().duration_ms,v));start=performance.now();idx=frameAt(offset);renderTiles();render()}
 D.characters.forEach((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${c.name} · ${c.tier||''}`;$('#character').append(o)});$('#character').onchange=e=>{ci=+e.target.value;idx=0;offset=0;start=performance.now();setCharacter()};$('#layout').onchange=render;$('#comparison').onchange=render;$('#groundGuide').onchange=render;$('#effects').onchange=render;$('#zoneToggle').onchange=render;$('#phase').onchange=()=>{updatePhase();render()};$('#hp').onchange=()=>{syncPhaseFromHp();updatePhase();render()};document.querySelectorAll('[data-phase]').forEach(b=>b.onclick=()=>{$('#phase').value=b.dataset.phase;$('#hp').value=b.dataset.phase==='steady'?'.95':b.dataset.phase==='pressured'?'.5':'.2';updatePhase()});$('#speed').onchange=e=>{const now=performance.now();offset+=playing?(now-start)*speed:0;speed=+e.target.value;start=now;render()};$('#reduce').checked=reduceMotion;$('#play').textContent=playing?'일시정지':'재생';$('#reduce').onchange=e=>{reduceMotion=e.target.checked;const now=performance.now();if(reduceMotion){if(playing)offset+=(now-start)*speed;playing=false;start=now;$('#play').textContent='재생'}else{playing=true;start=now;$('#play').textContent='일시정지'}render()};$('#play').onclick=e=>{if(reduceMotion){reduceMotion=false;$('#reduce').checked=false}playing=!playing;offset+=playing?0:(performance.now()-start)*speed;start=performance.now();e.target.textContent=playing?'일시정지':'재생'};$('#stepBack').onclick=()=>setTime(char().phase_ms[Math.max(0,idx-1)]);$('#stepNext').onclick=()=>setTime(char().phase_ms[Math.min(11,idx+1)]);$('#character').value='0';$('#status').textContent=`검수 후보 ${D.characters.length}명 · 본게임 미적용`;setCharacter();window.__galleryReview={time:()=>playing?offset+(performance.now()-start)*speed:offset,playing:()=>playing,speed:()=>speed,duration:()=>char().duration_ms,setTime,snapshot:()=>({character:char(),capture:layout()}),effect:slot=>D.effects.find(x=>x.slot===slot)};window.addEventListener('resize',render);requestAnimationFrame(tick);'''
    template=TEMPLATE.read_text()
    page=template.replace('__DATA__','{}').replace('__SCRIPT__',js.replace('__PAYLOAD__',json.dumps(payload,ensure_ascii=False,separators=(',',':'))))
    OUT.write_text(page)
    print(f'Wrote {OUT} ({OUT.stat().st_size:,} bytes; {len(compiled)} characters; {sum(len(c["poses"]) for c in compiled)} pose previews)')

if __name__=='__main__': main()
