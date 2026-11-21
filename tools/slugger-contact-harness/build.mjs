// Opt-in local build only. Default Vite entry and production routes are untouched.
import fs from 'node:fs';import {createHash} from 'node:crypto';import path from 'node:path';import {build} from 'vite';import config from '../../vite.config.js';
import * as E from '../../src/duel/engine.js';
const destination=path.resolve(process.env.HARNESS_OUT||'/workspace/slugger-contact-harness-dist');
if([path.resolve('.'),path.resolve('dist')].includes(destination))throw Error('Use a separate local harness output directory, never the normal dist');
const fixtures={},evidence={};
for(const [key,seed,zone,aim,kind] of [['upper',43446964,0,0,'hit'],['centre',21723482,4,4,'hit'],['whiff',21723482,4,8,'whiff']]){
 const s=E.enterV10Node(E.applyHitterClass(E.createV10Duel(seed),'slugger-v1',{buildVersion:1}),'a1-entry');
 const before=JSON.stringify(s),after=E.playV10Action(E.setAimZone(s,aim),{type:'card',id:'basic'});
 if(before!==JSON.stringify(s))throw Error('fixture validation mutated input');
 if(s.v10.opponent.artId!=='sky-phantom'||after.battle.revealed?.zone!==zone||after.battle.revealed.kind!==kind)throw Error('pinned real outcome changed: '+key);
 fixtures[key]=s;evidence[key]={seed,opponent:s.v10.opponent.artId,aim,zone,kind,hpBefore:s.pitcher.hp,hpAfter:after.pitcher.hp,stateSha256:createHash('sha256').update(before).digest('hex')};
}
const dir='tools/slugger-contact-harness',html='.qa-slugger-contact.html',entry='.qa-slugger-contact.jsx';
const sideEffects=[...fs.readFileSync('src/main.jsx','utf8').matchAll(/^import ["'](\.\/[^"']+)["'];/gm)].map(m=>`import ${JSON.stringify(m[1].replace('./','./src/'))};`).join('\n');
try{
 fs.writeFileSync(entry,sideEffects+'\n'+fs.readFileSync(dir+'/entry.jsx','utf8').replace('__FIXTURES__',JSON.stringify(fixtures)));
 fs.writeFileSync(html,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/duel/fonts.css"><title>검수 경기 · 로컬 전용</title></head><body><div id="root"></div><script type="module" src="/'+entry+'"></script></body></html>');
 await build({...config,configFile:false,base:'./',define:{'import.meta.env.VITE_NORMAL_REVIEW':'"1"','import.meta.env.VITE_FIELD_HARNESS':'"1"'},build:{...config.build,outDir:destination,emptyOutDir:true,rolldownOptions:{...config.build.rolldownOptions,input:path.resolve(html)}}});
 const out=destination;fs.renameSync(out+'/'+html,out+'/slugger-contact.html');
 fs.writeFileSync(out+'/slugger-contact-cases.json',JSON.stringify(evidence,null,2));console.log('LOCAL ONLY: slugger-contact.html',evidence);
}finally{fs.rmSync(html,{force:true});fs.rmSync(entry,{force:true});}
