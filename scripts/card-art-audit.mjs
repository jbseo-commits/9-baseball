/* Audit source presence AND the actual runtime resolver. Missing dedicated art
   is a production queue item, not the same thing as a broken card image. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createServer} from 'vite';
const index=process.argv.indexOf('--out'),output=index<0?'/tmp/9zone-card-art-audit':process.argv[index+1];
if(!output)throw Error('--out requires a directory');
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try{
 const {CARDS,CORE_KINDS}=await server.ssrLoadModule('/src/duel/cards.js');
 const {cardArtFor}=await server.ssrLoadModule('/src/duel/card-art.js');
 const queueText=await fs.readFile('docs/art/V16-CARD-ART-QUEUE.md','utf8');
 const queue=[...queueText.matchAll(/^\| (C\d+) \| `([^`]+)` \|/gm)].map(([,code,kind])=>({code,kind}));
 const queued=new Map(queue.map(x=>[x.kind,x.code]));
 const files=new Set(await fs.readdir('assets/cards-v15'));
 const derivatives=JSON.parse(await fs.readFile('assets/runtime-opt/manifest.json','utf8'));
 const core=new Set(CORE_KINDS),rows=[];
 for(const [kind,card]of Object.entries(CARDS)){
  const url=cardArtFor(kind),resolved=url?path.basename(new URL(url,'http://localhost').pathname):null;
  const dedicatedFile=`card-${kind}.png`,dedicated=files.has(dedicatedFile),valid=!!resolved&&files.has(resolved);
  let sourceBytes=0,runtimeBytes=0,runtimeFile=null;
  if(valid){const bytes=await fs.readFile(path.join('assets/cards-v15',resolved));sourceBytes=bytes.length;const hash=crypto.createHash('sha1').update(bytes).digest('hex'),entry=derivatives[hash];runtimeFile=entry?.file||resolved;runtimeBytes=entry?(await fs.stat(path.join('assets/runtime-opt',entry.file))).size:sourceBytes;}
  rows.push({kind,name:card.name,code:queued.get(kind)||null,core:core.has(kind),dedicated,dedicatedFile:dedicated?dedicatedFile:null,resolved,valid,sourceBytes,runtimeFile,runtimeBytes});
 }
 const queuedRows=queue.map(({kind})=>rows.find(r=>r.kind===kind));
 if(queuedRows.some(r=>!r)||queued.size!==queue.length||queue.length!==rows.filter(r=>!r.core).length)throw Error('queue and current new-card catalog differ; update the audit contract');
 const missing=queuedRows.filter(r=>!r.dedicated),broken=rows.filter(r=>!r.valid);
 const report={total:rows.length,core:core.size,queued:queue.length,queuedDedicated:queuedRows.length-missing.length,queuedMissing:missing.length,totalDedicated:rows.filter(r=>r.dedicated).length,broken:broken.length,nextMissing:missing[0]||null,rows,pass:broken.length===0};
 await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 const md=['# 카드 아트 실제 연결 감사','',`신규 ${report.queued}장 중 전용 파일 ${report.queuedDedicated}장, 미제작 ${report.queuedMissing}장. 기본 카드 ${report.core}장을 포함한 ${report.total}장 모두 런타임 그림 연결 ${report.broken===0?'정상':'오류 '+report.broken+'건'}.`, '',`다음 확정 미완료: **${report.nextMissing?.code} ${report.nextMissing?.kind} — ${report.nextMissing?.name}**.`, '', '파일 존재·실제 resolver·derivative 용량의 기계적 감사다. 원본 미감·100px 판독·카드 창 크롭·모바일 최종 검수 합격을 뜻하지 않는다.','', '재현: `npm run report:art -- --out /tmp/9zone-card-art-audit`','', '| 번호 | 카드 | 전용 파일 | 현재 실제 그림 |','| --- | --- | --- | --- |',...queuedRows.map(r=>`| ${r.code} | ${r.name} (${r.kind}) | ${r.dedicated?'있음':'미제작'} | ${r.resolved?`[${r.resolved}](../../assets/cards-v15/${r.resolved})`:'연결 오류'} |`),''];
 await fs.writeFile(path.join(output,'report.md'),md.join('\n'));
 console.log(JSON.stringify({total:report.total,queued:report.queued,dedicated:report.queuedDedicated,missing:report.queuedMissing,broken:report.broken,next:report.nextMissing?.code,output,pass:report.pass}));
 if(!report.pass)process.exitCode=1;
}finally{await server.close();}
