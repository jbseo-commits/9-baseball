/* Reproducible, product-neutral Node/Chromium checks for seeded run-map output. */
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {createServer} from 'vite';
import {createRunMap,validateRunMap} from '../src/duel/run-map.js';

const require=createRequire(import.meta.url),{chromium}=require('playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const seeds=[...Array.from({length:100},(_,i)=>i),100,2147483647,2147483648,4294967295,4294967296,-1,'3',3.5];
const options=[{}, {tutorial:true}, {encounters:false}, {tutorial:true,encounters:false}];
const repeatedSeeds=[0,1,2,3,10,100],repeatCount=5;
const stable=JSON.stringify;
const hash=value=>createHash('sha256').update(stable(value)).digest('hex');

function createSamples(){
  return options.flatMap(option=>seeds.map(seed=>{const map=createRunMap(seed,option);return {seed,option,map,valid:validateRunMap(map)};}));
}
function withInsertionSort(callback){
  const native=Array.prototype.sort;let intercepted=0;
  Array.prototype.sort=function(compare){
    if(this.length&&this.every(x=>x&&typeof x==='object'&&Number.isInteger(x.lane)&&Number.isInteger(x.row))){
      intercepted++;
      for(let i=1;i<this.length;i++){const item=this[i];let j=i-1;while(j>=0&&compare(this[j],item)>0){this[j+1]=this[j];j--;}this[j+1]=item;}
      return this;
    }
    return native.call(this,compare);
  };
  try{return {value:callback(),intercepted};}
  finally{Array.prototype.sort=native;}
}
const nodeSamples=createSamples();
const nodeRepeats=Object.fromEntries(repeatedSeeds.map(seed=>[seed,Array.from({length:repeatCount},()=>{const map=createRunMap(seed,{});return {map,valid:validateRunMap(map)};})]));
const nodeAlternative=withInsertionSort(()=>options.flatMap(option=>seeds.map(seed=>createRunMap(seed,option))));
function compareMaps(before,after){
  const edgeKeys=map=>new Set(map.edges.map(e=>`${e.from}>${e.to}`));
  const a=edgeKeys(before),b=edgeKeys(after);
  const edgeSymDiff=[...a].filter(x=>!b.has(x)).length+[...b].filter(x=>!a.has(x)).length;
  const project=(map,fn)=>map.nodes.map(fn);
  const ids=map=>map.nodes.map(n=>n.id);
  const positions=map=>project(map,n=>[n.id,n.row,n.lane]);
  const types=map=>project(map,n=>[n.id,n.type]);
  const act1=map=>project(map,n=>n.act===1?[n.id,n.type]:null).filter(Boolean);
  const routes=map=>project(map,n=>[n.id,n.route,n.routeLabel]);
  const opponents=map=>project(map,n=>[n.id,n.type,n.opponent?.artId||null,n.opponent?.name||null]);
  return {
    fullMapSame:stable(before)===stable(after),
    edgesSame:edgeSymDiff===0,edgeSymDiff,
    nodeIdsSame:stable(ids(before))===stable(ids(after)),
    positionsSame:stable(positions(before))===stable(positions(after)),
    allTypesSame:stable(types(before))===stable(types(after)),
    act1TypesSame:stable(act1(before))===stable(act1(after)),
    routesSame:stable(routes(before))===stable(routes(after)),
    opponentsSame:stable(opponents(before))===stable(opponents(after)),
  };
}

const server=await createServer({configFile:false,root,server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error'});
let browser;
try{
  await server.listen();
  const port=server.httpServer.address().port;
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
  const chromiumVersion=await browser.version(),page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/`);
  const browserData=await page.evaluate(async({seeds,options,repeatedSeeds,repeatCount})=>{
    const {createRunMap,validateRunMap}=await import('/src/duel/run-map.js');
    const samples=options.flatMap(option=>seeds.map(seed=>{const map=createRunMap(seed,option);return {seed,option,map,valid:validateRunMap(map)};}));
    const repeats=Object.fromEntries(repeatedSeeds.map(seed=>[seed,Array.from({length:repeatCount},()=>{const map=createRunMap(seed,{});return {map,valid:validateRunMap(map)};})]));
    const nativeSort=Array.prototype.sort;let intercepted=0;
    Array.prototype.sort=function(compare){
      if(this.length&&this.every(x=>x&&typeof x==='object'&&Number.isInteger(x.lane)&&Number.isInteger(x.row))){
        intercepted++;
        for(let i=1;i<this.length;i++){const item=this[i];let j=i-1;while(j>=0&&compare(this[j],item)>0){this[j+1]=this[j];j--;}this[j+1]=item;}
        return this;
      }
      return nativeSort.call(this,compare);
    };
    let alternativeSortMaps;
    try{alternativeSortMaps=options.flatMap(option=>seeds.map(seed=>createRunMap(seed,option)));}
    finally{Array.prototype.sort=nativeSort;}
    return {samples,repeats,alternativeSortMaps,alternativeSortCalls:intercepted,userAgent:navigator.userAgent};
  },{seeds,options,repeatedSeeds,repeatCount});

  const parity=nodeSamples.map((item,i)=>({seed:item.seed,option:item.option,nodeHash:hash(item.map),chromiumHash:hash(browserData.samples[i].map),same:stable(item.map)===stable(browserData.samples[i].map),nodeValid:item.valid,chromiumValid:browserData.samples[i].valid}));
  const repeatStability=Object.fromEntries(repeatedSeeds.map(seed=>{
    const node=nodeRepeats[seed].map(x=>stable(x.map)),chrome=browserData.repeats[seed].map(x=>stable(x.map));
    return [seed,{nodeStable:node.every(v=>v===node[0]),chromiumStable:chrome.every(v=>v===chrome[0]),crossRuntimeSame:node[0]===chrome[0],allValid:nodeRepeats[seed].every(x=>x.valid)&&browserData.repeats[seed].every(x=>x.valid)}];
  }));
  const metamorphic=nodeSamples.map((item,i)=>({seed:item.seed,option:item.option,nodeSame:stable(item.map)===stable(nodeAlternative.value[i]),chromiumSame:stable(browserData.samples[i].map)===stable(browserData.alternativeSortMaps[i]),crossRuntimeSame:stable(nodeAlternative.value[i])===stable(browserData.alternativeSortMaps[i])}));

  let baselineImpact=null;
  if(process.env.MAP_BASELINE){
    const baseline=JSON.parse(await readFile(process.env.MAP_BASELINE,'utf8'));
    const priorNode=baseline.sampleMaps?.node,priorChromium=baseline.sampleMaps?.chromium;
    if(!priorNode||!priorChromium)throw Error('MAP_BASELINE must include sampleMaps.node and sampleMaps.chromium');
    const currentNode=Object.fromEntries(nodeSamples.filter(x=>!x.option.tutorial&&!Object.hasOwn(x.option,'encounters')).map(x=>[x.seed,x.map]));
    const currentChromium=Object.fromEntries(browserData.samples.filter(x=>!x.option.tutorial&&!Object.hasOwn(x.option,'encounters')).map(x=>[x.seed,x.map]));
    const deltasFor=(prior,current)=>Object.keys(prior).map(seed=>({seed:Number(seed),...compareMaps(prior[seed],current[seed])}));
    const deltasNode=deltasFor(priorNode,currentNode),deltasChromium=deltasFor(priorChromium,currentChromium);
    const fields=['fullMapSame','edgesSame','nodeIdsSame','positionsSame','allTypesSame','act1TypesSame','routesSame','opponentsSame'];
    const summarize=deltas=>({sampleCount:deltas.length,changeRates:Object.fromEntries(fields.map(field=>[field,{changed:deltas.filter(x=>!x[field]).length,unchanged:deltas.filter(x=>x[field]).length}])),edgeSymDiffTotal:deltas.reduce((a,x)=>a+x.edgeSymDiff,0),maxEdgeSymDiff:Math.max(0,...deltas.map(x=>x.edgeSymDiff)),details:deltas});
    baselineImpact={nodeVsNodeOld:summarize(deltasNode),chromiumVsChromiumOld:summarize(deltasChromium)};
  }

  const failures=parity.filter(x=>!x.same||!x.nodeValid||!x.chromiumValid);
  const metamorphicFailures=metamorphic.filter(x=>!x.nodeSame||!x.chromiumSame||!x.crossRuntimeSame);
  const unstable=Object.entries(repeatStability).filter(([,x])=>!x.nodeStable||!x.chromiumStable||!x.crossRuntimeSame||!x.allValid);
  const result={runtime:{node:process.version,chromium:chromiumVersion,browserUserAgent:browserData.userAgent},source:{path:'src/duel/run-map.js',sha256:createHash('sha256').update(await readFile(resolve(root,'src/duel/run-map.js'))).digest('hex')},inputs:{seedCount:seeds.length,optionCount:options.length,totalComparisons:parity.length,seeds,options,repeatedSeeds,repeatCount},parity:{equal:parity.length-failures.length,different:failures.length,failures},validity:{nodeValid:nodeSamples.filter(x=>x.valid).length,chromiumValid:browserData.samples.filter(x=>x.valid).length,total:parity.length,invalid:failures.filter(x=>!x.nodeValid||!x.chromiumValid)},repeatStability,unstable,metamorphic:{total:metamorphic.length,nodeInsertionSortCalls:nodeAlternative.intercepted,chromiumInsertionSortCalls:browserData.alternativeSortCalls,equal:metamorphic.length-metamorphicFailures.length,different:metamorphicFailures.length,failures:metamorphicFailures},baselineImpact};
  const out=process.env.QA_OUT||'/tmp/map-determinism-20261118/qa-map-determinism.json';
  await writeFile(out,JSON.stringify(result,null,2));
  console.log(JSON.stringify({runtime:result.runtime,source:result.source,inputs:result.inputs,parity:{equal:result.parity.equal,different:result.parity.different},validity:result.validity,repeatStability,unstable,metamorphic:result.metamorphic,baselineImpact:baselineImpact&&Object.fromEntries(Object.entries(baselineImpact).map(([k,v])=>[k,{sampleCount:v.sampleCount,changeRates:v.changeRates,edgeSymDiffTotal:v.edgeSymDiffTotal,maxEdgeSymDiff:v.maxEdgeSymDiff}])),output:out},null,2));
  if(failures.length||unstable.length||metamorphicFailures.length)process.exitCode=1;
}finally{
  await browser?.close();
  await server.close();
}
