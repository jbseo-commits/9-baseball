// Opt-in local build only. Default Vite entry and production routes are untouched.
import fs from 'node:fs';import path from 'node:path';import {build} from 'vite';import config from '../../vite.config.js';
import * as E from '../../src/duel/engine.js';
const destination=path.resolve(process.env.HARNESS_OUT||'/workspace/field-harness-dist');
if([path.resolve('.'),path.resolve('dist')].includes(destination))throw Error('Use a separate local harness output directory, never the normal dist');
const fixtures={};for(const id of ['slugger-v1','contact-v1'])for(let seed=1;seed<2000;seed++){
 let s=E.applyHitterClass(E.createV10Duel(seed*987431),id,{buildVersion:1});const boss=s.runMap.nodes.find(n=>n.opponent?.artId==='boss-01-emerald-tyrant');s.runMap.reachableIds=[boss.id];s=E.enterV10Node(s,boss.id);
 const after=E.playV10Action(E.setAimZone(s,4),{type:'card',id:'basic'});
 if(after.battle.revealed?.zone===4&&after.battle.revealed.kind==='hit'){fixtures[id]=s;break;}
}
if(Object.keys(fixtures).length!==2)throw Error('centre fixture unavailable');
const dir='tools/private-field-harness',html='.qa-field-harness.html',entry='.qa-field-harness.jsx';
const sideEffects=[...fs.readFileSync('src/main.jsx','utf8').matchAll(/^import ["'](\.\/[^"']+)["'];/gm)].map(m=>`import ${JSON.stringify(m[1].replace('./','./src/'))};`).join('\n');
try{
 fs.writeFileSync(entry,sideEffects+'\n'+fs.readFileSync(dir+'/entry.jsx','utf8').replace('__FIXTURES__',JSON.stringify(fixtures)));
 fs.writeFileSync(html,'<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/duel/fonts.css"><title>검수 경기 · 로컬 전용</title></head><body><div id="root"></div><script type="module" src="/'+entry+'"></script></body></html>');
 await build({...config,configFile:false,base:'./',define:{'import.meta.env.VITE_NORMAL_REVIEW':'"1"','import.meta.env.VITE_FIELD_HARNESS':'"1"'},build:{...config.build,outDir:destination,emptyOutDir:true,rolldownOptions:{...config.build.rolldownOptions,input:path.resolve(html)}}});
 const out=destination;fs.renameSync(out+'/'+html,out+'/field-harness.html');
 console.log('LOCAL ONLY: field-harness.html; fixtures',Object.fromEntries(Object.entries(fixtures).map(([k,s])=>[k,s.initialSeed])));
}finally{fs.rmSync(html,{force:true});fs.rmSync(entry,{force:true});}
