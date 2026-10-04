#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendEvent, readEvents } from './lib/loop-events.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
try {
  const argv=process.argv.slice(2), options={};
  for(let i=0;i<argv.length;i+=2){if(!argv[i]?.startsWith('--') || argv[i+1]===undefined)throw Error('Expected --key value pairs');options[argv[i].slice(2)]=argv[i+1];}
  const allowed=['engine','role','status','stage','checkpoint','summary','model','run','test','result'];
  if(Object.keys(options).some(k=>!allowed.includes(k)))throw Error('Unknown option');
  const latest=readEvents(root).events.filter(e=>e.engine===options.engine).at(-1);
  const runId=options.run || latest?.runId;
  if(!runId)throw Error('No active run. Pass --run <id> for a new interactive session.');
  const event={engine:options.engine,role:options.role,status:options.status,runId,source:'reported'};
  for(const k of ['stage','checkpoint','summary','model'])if(options[k])event[k]=options[k];
  if(options.test){event.test={name:options.test.slice(0,120),status:options.result};}
  appendEvent(root,event);
  console.log('작업 상태 기록됨');
} catch(e){console.error(e.message);process.exitCode=1;}
