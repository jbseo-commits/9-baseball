const {chromium}=require('playwright');const fs=require('node:fs');
const base='http://127.0.0.1:5199/?battleUi=vnext&battleFixture=cinema-homer';const out='/tmp/audio-lifecycle-5199';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const cases=[];
for(const reduced of [false,true])for(const stopMode of ['mute','reset']){
 const p=await b.newPage({viewport:{width:1280,height:720},reducedMotion:reduced?'reduce':'no-preference'});
 await p.addInitScript(()=>{window.__audioLog=[];window.__audioNodeId=0;for(const C of [window.AudioBufferSourceNode,window.OscillatorNode])if(C)for(const method of ['start','stop','disconnect']){const orig=C.prototype[method];C.prototype[method]=function(...args){this.__qaId??=++window.__audioNodeId;window.__audioLog.push({t:performance.now(),id:this.__qaId,k:this.constructor.name,m:method,a:Array.from(args),ct:this.context?.currentTime??null});return orig.apply(this,args)}}});
 await p.goto(base);await p.getByRole('button',{name:/소리 꺼짐/}).click();await p.getByRole('button',{name:'다시 시작'}).click();
 await p.waitForFunction(()=>window.__audioLog.filter(x=>x.m==='start').length>=10,null,{timeout:5000});
 const before=await p.evaluate(()=>({starts:window.__audioLog.filter(x=>x.m==='start').length,ctx:window.__audioLog.at(-1)?.ct,events:window.__audioLog.length,tail:window.__audioLog.slice(-12)}));
 if(stopMode==='mute')await p.getByRole('button',{name:/소리 켜짐/}).click();else await p.getByRole('button',{name:'다시 시작'}).click();
 const immediately=await p.evaluate(()=>({ctx:window.__audioLog.at(-1)?.ct,events:window.__audioLog.length,abortStops:window.__audioLog.filter(x=>x.m==='stop'&&!x.a.length).length,disconnects:window.__audioLog.filter(x=>x.m==='disconnect').length,tail:window.__audioLog.slice(-20)}));
 cases.push({reduced,stopMode,before,immediately});await p.close();
}
fs.writeFileSync(out+'/long-report.json',JSON.stringify({base,method:'Instrumented native WebAudio node start/stop/disconnect calls in Chromium. No listening judgment.',cases},null,2));console.log(JSON.stringify(cases.map(c=>({reduced:c.reduced,stopMode:c.stopMode,before:{starts:c.before.starts,ctx:c.before.ctx},after:{ctx:c.immediately.ctx,abortStops:c.immediately.abortStops,disconnects:c.immediately.disconnects,events:c.immediately.events}})),null,2));await b.close()})().catch(e=>{console.error(e);process.exit(1)});
