#!/usr/bin/env python3
"""Read-only offline geometry animatic. No engine or production assets are rewritten."""
import argparse, base64, html, json
from pathlib import Path
REPO = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--evidence', type=Path, default=REPO/'docs/qa/masterpiece-gap-20261110/pitch-contact-geometry.json')
p.add_argument('--out', type=Path, default=Path('/tmp/9zone-pitch-contact-audit'))
a = p.parse_args(); data = json.loads(a.evidence.read_text()); a.out.mkdir(parents=True, exist_ok=True)
poses = []
for pose in data['authoredPoseBarrelEstimates']:
    raw = (REPO/pose['sourcePath']).read_bytes()
    w,h = pose['sourceDimensionsPx']; ends=pose['barrelEstimate']['endpointEstimates']; q,r=[e['sourcePx']for e in ends]
    poses.append(f'''<article id="pose-{pose['frameId']}"><h2>{pose['frameId']} · {html.escape(pose['pose'])}</h2><svg viewBox="0 0 {w} {h}" role="img" aria-label="Original source with manually estimated bat centerline"><image href="data:image/png;base64,{base64.b64encode(raw).decode()}" width="{w}" height="{h}"/><line x1="{q['x']}" y1="{q['y']}" x2="{r['x']}" y2="{r['y']}" stroke="#53f1e3" stroke-width="3" stroke-dasharray="6 4"/></svg><p>원본 PNG 바이트 유지 · 중심선 수동 추정 좌표별 ±6px<br>실효 worldHeight 1200, 공통 발 기준(200,960)</p></article>''')
jsdata=json.dumps(data,ensure_ascii=False).replace('<',chr(92)+'u003c')
page='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>9ZONE 투구·배트 좌표 검증</title><style>
:root{color-scheme:dark;font:16px/1.55 system-ui,sans-serif;background:#0c1520;color:#e5edf5}body{max-width:1400px;margin:auto;padding:20px}h1{font-size:24px}h2{font-size:17px}p{color:#b9cad9}label{display:inline-grid;gap:4px;margin:6px 12px 6px 0}select,button,input{font:inherit;min-height:44px;background:#192c3e;color:#e5edf5;border:1px solid #62788b;border-radius:4px;padding:4px 8px}button{cursor:pointer}aside{padding:12px 16px;border-left:3px solid #efbd64;background:#192330}#world{width:100%;background:#101d2a;border:1px solid #61778b}#world text{font:13px system-ui;fill:#dce9f6}.poses{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.poses article{background:#172635;border:2px solid transparent;padding:10px}.poses svg{width:100%}.poses article.active{border-color:#f1c573}.poses p{font-size:12px}#status{min-height:2em;font-variant-numeric:tabular-nums}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}td,th{padding:8px;border-bottom:1px solid #36495b;text-align:left}.key{color:#f2cc7f}a{color:#8ed7ef}@media(max-width:700px){.poses{grid-template-columns:1fr}body{padding:10px}}
</style><body><h1>투구·배트 좌표 검증 — 미승인 기하 시뮬레이션</h1><aside>게임 구현·공개 룰렛·신규 모션이 아닙니다. 파란 그리드는 실제 브라우저의 선택 UI를 역투영한 위치이며, 주황 그리드는 접촉점 중심의 가설입니다. 어느 쪽도 물리 타격면으로 승인되지 않았습니다. 점선 직선 비행은 겹침을 확인하는 진단용이며 실제 투구 곡선이 아닙니다. 중심선 거리는 판정·적중 확률이 아닙니다.</aside>
<div><label>측정 뷰포트<select id="viewport"></select></label><label>투수 릴리스 출발점<select id="pitcher"></select></label><label>비교면<select id="plane"><option value="ui">측정된 선택 UI 역투영</option><option value="hypothesis">미승인: 접촉점 중심 300×300</option></select></label><label>진단 목적지<select id="zone"></select></label><label>원화 키포즈<select id="pose"><option value="7">7 다운스윙</option><option value="8" selected>8 등록 접촉</option><option value="9">9 초기 팔로스루</option></select></label><button id="play">진단 비행 재생</button></div>
<p id="status" role="status"></p><svg id="world" viewBox="450 250 800 730" role="img" aria-label="세계 좌표에서 20개 릴리스와 원화의 배트 중심선을 대조하는 기하 그래프"></svg><p>초록 점 20개 = 등록된 투수 릴리스 출발점 · 빨강 C = 등록된 유일 접촉점 · 청록 선 = 선택 키포즈 배트 중심선 추정 · 흰 원 = 진단 목적지. 흰 X는 실제 존 밖 목적지가 아니라 기존 결과 연출의 C+(95,75) 오프셋입니다.</p><table><thead><tr><th>선택면의 9칸 중심</th><th>등록 접촉 포즈8의 배트 선분까지 거리</th></tr></thead><tbody id="distances"></tbody></table><h2>실제 원화와 수동 계측 근거</h2><div class="poses">POSES</div><p>원본 이미지·변환·오차·릴리스 등록: <a href="geometry-audit.json">geometry-audit.json</a>. 자세를 늘리거나 배우를 이동해 가상의 접촉을 만들지 않습니다. 표의 거리는 분리된 키포즈의 선분과 점의 기하 거리일 뿐, 연속 스윙 또는 3D 접촉의 증명이 아닙니다.</p><script>
const DATA=JSDATA;
const $=id=>document.getElementById(id),planes=DATA.worldGraph.measuredUiPlanes,contact=DATA.registeredContactEvent.worldPx,releases=DATA.registeredReleaseOrigins,poses=DATA.authoredPoseBarrelEstimates;
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
planes.forEach((p,i)=>$('viewport').add(new Option(p.pageViewportPx.join('×'),i)));$('viewport').value=String(planes.length-1);
releases.forEach((p,i)=>$('pitcher').add(new Option(p.id,i)));for(let i=0;i<9;i++)$('zone').add(new Option(`${Math.floor(i/3)+1}행 ${i%3+1}열`,i));$('zone').value='4';
const segment=i=>poses.find(p=>p.frameId===i).barrelEstimate.endpointEstimates.map(e=>e.worldPx),dist=(p,[a,b])=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};
let progress=0,raf=0;
function render(){
 const measured=planes[+$('viewport').value],hyp=DATA.worldGraph.hypotheticalContactCentered300WorldBox,b=$('plane').value==='ui'?measured.worldBounds:hyp,dx=(b.xMax-b.xMin)/3,dy=(b.yMax-b.yMin)/3,targets=Array.from({length:9},(_,i)=>({x:b.xMin+dx*(i%3+.5),y:b.yMin+dy*(Math.floor(i/3)+.5)})),target=targets[+$('zone').value],release=releases[+$('pitcher').value].worldOriginPx,chosen=+$('pose').value,[s,e]=segment(chosen),outside=DATA.worldGraph.syntheticOutsideSentinelFromSceneEffects.worldPx;
 let markup='';for(let x=450;x<=1250;x+=100)markup+=`<path d="M${x} 250V980" stroke="#263c50"/><text x="${x+3}" y="970">${x}</text>`;for(let y=300;y<=900;y+=100)markup+=`<path d="M450 ${y}H1250" stroke="#263c50"/><text x="455" y="${y-5}">${y}</text>`;
 const color=$('plane').value==='ui'?'#71b6f0':'#f4be60';markup+=`<rect x="${b.xMin}" y="${b.yMin}" width="${dx*3}" height="${dy*3}" fill="${color}16" stroke="${color}"/>`;for(let i=1;i<3;i++)markup+=`<path d="M${b.xMin+dx*i} ${b.yMin}V${b.yMax}M${b.xMin} ${b.yMin+dy*i}H${b.xMax}" stroke="${color}"/>`;
 targets.forEach((p,i)=>markup+=`<circle cx="${p.x}" cy="${p.y}" r="${i===+$('zone').value?8:4}" fill="none" stroke="white"/><text x="${p.x+10}" y="${p.y-5}">${i+1}</text>`);
 releases.forEach(p=>markup+=`<circle cx="${p.worldOriginPx.x}" cy="${p.worldOriginPx.y}" r="4" fill="#82d79f"><title>${esc(p.id)}</title></circle>`);
 poses.forEach(p=>{const[a,b]=segment(p.frameId);markup+=`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="${p.frameId===chosen?'#5ce5e2':'#547086'}" stroke-width="${p.frameId===chosen?6:2}" stroke-dasharray="${p.frameId===chosen?'':'8 5'}"/>`});
 markup+=`<path d="M${release.x} ${release.y}L${target.x} ${target.y}" stroke="#f4e5bd" stroke-dasharray="6 6"/><circle cx="${contact.x}" cy="${contact.y}" r="7" fill="#ff778b"/><text x="${contact.x+10}" y="${contact.y}">C</text><path d="M${outside.x-7} ${outside.y-7}l14 14m0-14l-14 14" stroke="white"/><circle cx="${release.x+(target.x-release.x)*progress}" cy="${release.y+(target.y-release.y)*progress}" r="7" fill="#fff2cb"/>`;
 $('world').innerHTML=markup;document.querySelectorAll('.poses article').forEach(el=>el.classList.toggle('active',el.id===`pose-${chosen}`));$('status').textContent=`中心(${((b.xMin+b.xMax)/2).toFixed(1)}, ${((b.yMin+b.yMax)/2).toFixed(1)}) · C(${contact.x.toFixed(1)}, ${contact.y.toFixed(1)}) · 목적지와 포즈${chosen} 배트 선분 거리 ${dist(target,[s,e]).toFixed(1)} world px (거리 오차 상한 ±13.1px)`;
 $('distances').innerHTML=targets.map((p,i)=>`<tr><td>${i+1}: (${p.x.toFixed(1)}, ${p.y.toFixed(1)})</td><td>${dist(p,segment(8)).toFixed(1)} px ±13.1 · 미등록/미검증</td></tr>`).join('');
}
function reset(){cancelAnimationFrame(raf);progress=0;render()}document.querySelectorAll('select').forEach(el=>el.addEventListener('change',reset));$('play').onclick=()=>{cancelAnimationFrame(raf);const start=performance.now();function tick(t){progress=Math.min(1,(t-start)/1600);render();if(progress<1)raf=requestAnimationFrame(tick)}raf=requestAnimationFrame(tick)};render();
</script></body></html>'''.replace('POSES',''.join(poses)).replace('JSDATA',jsdata).replace('中心','선택면 중심')
(a.out/'index.html').write_text(page)
(a.out/'geometry-audit.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
print(f'Generated {a.out}/index.html — diagnostic only; {len(poses)} unchanged source PNGs, {len(data["registeredReleaseOrigins"])} release origins')
