#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEvents, reduceEvents } from './lib/loop-events.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
let port=4317,demo=false;
for(let i=0;i<argv.length;i++){if(argv[i]==='--demo')demo=true;else if(argv[i]==='--port'){port=Number(argv[++i]);}else{console.error('Usage: node scripts/agent-dashboard.mjs [--demo] [--port 4317]');process.exit(2);}}
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');
const project=JSON.parse(readFileSync(join(root,'tools/agent-dashboard/project.json'),'utf8'));
const assets={'/':['index.html','text/html; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8']};
const server=createServer((req,res)=>{
  const host=req.headers.host;
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(host)){res.writeHead(403);return res.end('Localhost only');}
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'");
  if(req.method!=='GET'){res.writeHead(405);return res.end('Read-only dashboard');}
  let url;
  try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400);return res.end('Invalid request URL');}
  try{
    if(url.pathname==='/api/state'){
      const read=demo?{events:JSON.parse(readFileSync(join(root,'tools/agent-dashboard/demo.json'),'utf8')),invalid:0}:readEvents(root);
      res.setHeader('Content-Type','application/json; charset=utf-8');
      return res.end(JSON.stringify({project,demo,invalid:read.invalid,engines:['codex','claude'].map(e=>reduceEvents(read.events,e)),updatedAt:new Date().toISOString()}));
    }
    const asset=assets[url.pathname];
    if(!asset){res.writeHead(404);return res.end('Not found');}
    res.setHeader('Content-Type',asset[1]);res.end(readFileSync(join(root,'tools/agent-dashboard',asset[0])));
  }catch{res.writeHead(500);res.end('상태 기록을 읽을 수 없습니다');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'포트 사용 중. --port로 다른 포트를 선택하세요.':'대시보드 시작 실패');process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Agent Loop: http://127.0.0.1:${port}${demo?' · DEMO 예시 데이터':''}\n화면 열기만으로 AI 작업은 실행되지 않습니다. 종료: Ctrl+C`));
