#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, openSync, closeSync, unlinkSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import { appendEvent, normalizeCodex } from './lib/loop-events.mjs';
import { codexCommand } from './lib/codex-command.mjs';
const codex=codexCommand();
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const project=JSON.parse(readFileSync(join(root,'tools/agent-dashboard/project.json'),'utf8'));
const argv=process.argv.slice(2),mode=argv[0]||'--check';
if(argv.length>1||!['--check','--dry-run','--run'].includes(mode)){console.error('Usage: node scripts/codex-loop.mjs [--check | --dry-run | --run]');process.exit(2);}
const cmd=(name,args)=>spawnSync(name==='codex'?codex.file:name,name==='codex'?[...codex.prefix,...args]:args,{cwd:root,encoding:'utf8',timeout:10000,windowsHide:true});
const git=args=>{const r=cmd('git',args);return r.status===0?r.stdout.trim():'';};
const branch=git(['branch','--show-current']),origin=git(['config','--get','remote.origin.url']);
const repository=origin.match(/^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+\/[^/]+?)(?:\.git)?\/?$/)?.[1];
const blockers=[];
if(repository!==project.repository)blockers.push('origin must be '+project.repository);
if(!branch||['main','master'].includes(branch))blockers.push('Select an attached work branch');
const version=cmd('codex',['--version']);
if(version.status!==0)blockers.push('Codex CLI unavailable');
const help=cmd('codex',['exec','--help']);
if(help.status!==0||!['--json','--sandbox','--model'].every(flag=>help.stdout.includes(flag)))blockers.push('Installed CLI does not advertise required exec flags');
for(const path of ['.codex/config.toml','loop/codex-prompt.md',...['explorer','worker','researcher','reviewer'].map(role=>'.codex/agents/'+role+'.toml')])if(!existsSync(join(root,path)))blockers.push('Missing '+path);
console.log('Repository: '+(repository||'unrecognized')+'; branch: '+(branch||'detached'));
console.log('Profile: '+project.models.codex.main+'; lighter roles: '+project.models.codex.worker);
console.log('Account/model access and loaded custom agents must be confirmed in Codex. No automatic model fallback.');
if(blockers.length){blockers.forEach(b=>console.error('BLOCKED: '+b));process.exit(1);}
const model=project.models.codex.main.split(' / ')[0];
const invocation=['exec','--json','--sandbox','workspace-write','--model',model,'-c','model_reasoning_effort="high"','-'];
console.log('Launch: codex '+invocation.join(' '));
if(mode!=='--run')process.exit(0);
const runId=randomUUID();
mkdirSync(join(root,'loop/.runtime'),{recursive:true});
const lockPath=join(root,'loop/.runtime/codex.lock');
let lock;
try{lock=openSync(lockPath,'wx',0o600);}catch{console.error('BLOCKED: another run or stale codex.lock. Confirm no session is running before removing it.');process.exit(1);}
let child,finished=false,interrupted=false,streamError=false,fatalError=false;
const finish=(code,signal)=>{
 if(finished)return;finished=true;
 try{appendEvent(root,{engine:'codex',role:'main',status:interrupted?'blocked':code===0&&!streamError&&!fatalError?'done':'failed',runId,model,summary:interrupted?'사용자가 세션을 중단했습니다':code===0&&!streamError&&!fatalError?'세션 종료 · 테스트/검토 기록을 따로 확인하세요':'세션 실패 · 터미널 확인 필요',source:'launcher'});}catch{console.error('상태 기록 실패 · 세션 결과를 확인하세요');code=1;}finally{try{closeSync(lock);}catch{}try{unlinkSync(lockPath);}catch{console.error('잠금 정리 실패 · 실행 중인 세션을 확인하세요');code=1;}}
 process.exitCode=code===0&&!streamError&&!fatalError&&!interrupted?0:1;
};
try{
 appendEvent(root,{engine:'codex',role:'main',status:'running',stage:'plan',runId,model,summary:'런처 시작 · 작업 브랜치 확인 완료',source:'launcher'});
 child=spawn(codex.file,[...codex.prefix,...invocation],{cwd:root,stdio:['pipe','pipe','inherit'],shell:false});
 child.on('error',()=>{console.error('Codex launch failed');finish(1);});
 child.on('close',finish);
 const lines=createInterface({input:child.stdout,crlfDelay:Infinity});
 lines.on('line',line=>{try{const raw=JSON.parse(line);if(['turn.failed','error'].includes(raw.type))fatalError=true;const e=normalizeCodex(raw,runId,model);if(e){appendEvent(root,e);console.log(e.summary);}}catch{streamError=true;console.error('Unreadable CLI event (contents not printed)');}});
 const prompt=readFileSync(join(root,'loop/codex-prompt.md'),'utf8')+'\n상태 기록 runId: '+runId+'\n';
 child.stdin.on('error',()=>{});child.stdin.end(prompt);
 console.log('진행 화면: node scripts/agent-dashboard.mjs → http://127.0.0.1:4317');
 const stop=()=>{interrupted=true;child.kill('SIGTERM');};
 process.once('SIGINT',stop);process.once('SIGTERM',stop);
}catch{streamError=true;if(child&&!finished){child.stdin?.destroy();child.kill('SIGTERM');}else if(!child){finish(1);}}
