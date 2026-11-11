import fs from'node:fs/promises';
import{chromium}from'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const root='/workspace/9zone-contact-sequence-20261111',raw='/workspace/9zone-next-20261111/batter-contact-experiment/candidate2-unpacked/frames/row-0/frame-1.png';
const bytes=await fs.readFile(raw),src='data:image/png;base64,'+bytes.toString('base64');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),report=[];
for(const[name,color]of[['dark','#0c1520'],['light','#f4f4f0'],['checker','repeating-conic-gradient(#d1d6db 0% 25%,#f4f4f0 0% 50%) 0 0/32px 32px']]){
 for(const[label,scale]of[['native',1],['game844x390',(1200/724)*(844/1672)]]){
  const p=await browser.newPage({viewport:{width:760,height:760}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.setContent(`<style>body{margin:0;background:${color}}img{display:block;width:${724*scale}px;height:${724*scale}px}</style><img src="${src}" alt="unaltered candidate2 contact source">`);
  await p.locator('img').evaluate(i=>i.decode());await p.screenshot({path:`${root}/browser-${name}-${label}.png`});
  report.push({background:name,label,scale,source:'original candidate2 middle frame unchanged',errors});await p.close();
 }
}
await browser.close();await fs.writeFile(root+'/browser-composites.json',JSON.stringify({method:'Chromium normal DOM img source-over; game label uses bitmap scale from844×390 world camera only, not full gameplay QA',report},null,2));
console.log(`${report.length} browser source-over views, ${report.reduce((n,r)=>n+r.errors.length,0)} page errors`);
