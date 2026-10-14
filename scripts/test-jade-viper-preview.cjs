// Executes the actual delivered HTML script with a deterministic animation clock.
// This checks playback controls, not browser rendering or visual anatomy.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'assets/pitcher-study-jade-viper/previews/jade-viper-atlas-r1.html'),'utf8');
const json=html.match(/<script id="jade-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
const code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
const data=JSON.parse(json),elements=new Map(),queue=new Map();let now=0,id=0;
function element(name){if(!elements.has(name))elements.set(name,{value:name==='speed'?'0.5':'0',textContent:name==='jade-data'?json:'',width:512,height:512,listeners:{},attrs:{},addEventListener(event,fn){this.listeners[event]=fn},setAttribute(k,v){this.attrs[k]=v},getContext(){return{clearRect(){},fillRect(){},drawImage(){}}}});return elements.get(name)}
const document={hidden:false,listeners:{},getElementById:element,addEventListener(event,fn){this.listeners[event]=fn}};
const ctx=vm.createContext({document,Image:class{set src(v){this.value=v;this.onload()}},performance:{now:()=>now},requestAnimationFrame:fn=>{queue.set(++id,fn);return id},cancelAnimationFrame:i=>queue.delete(i),console});
vm.runInContext(code,ctx);
const click=name=>element(name).listeners.click();
function step(ms){now+=ms;const callbacks=[...queue.values()];queue.clear();callbacks.forEach(fn=>fn(now))}
const current=()=>Number(element('frame').value);
assert.equal(current(),0);
click('next');assert.equal(current(),12);click('prev');assert.equal(current(),0);
element('frame').value=75;element('frame').listeners.input();assert.equal(element('ball').textContent,'오른손에 공');
click('release');assert.equal(current(),76);assert.match(element('ball').textContent,/오른손 비움/);
click('restart');click('play');step(1000);assert.ok(current()>=29&&current()<=30,'0.5x advances about30frames per second');
click('play');const paused=current();step(600);assert.equal(current(),paused);assert.equal(queue.size,0);
element('speed').value='1';click('play');step(3000);assert.equal(current(),119);assert.equal(element('play').attrs['aria-pressed'],'false');assert.equal(queue.size,0);
click('play');assert.equal(current(),0);document.hidden=true;document.listeners.visibilitychange();assert.equal(queue.size,0);
click('release');click('next');assert.equal(current(),78);click('prev');assert.equal(current(),76);
element('frame').value=119;element('frame').listeners.input();click('next');assert.equal(current(),119);
assert.equal(data.poses.length,30);assert.equal(data.mapping.length,120);
const report={status:'passed',method:'Actual embedded script executed in Node VM with DOM/canvas stubs',checks:['drawing-step navigation','frame slider','release76 ball-state display','half-speed clock','pause/resume','finite stop at119','restart after end','pause on hidden document'],browserUIAutomation:false};
fs.writeFileSync(path.join(root,'assets/pitcher-study-jade-viper/qa/player-check.json'),JSON.stringify(report,null,2)+'\n');
console.log('Preview controls and finite playback: passed (Node VM; not browser UI automation).');
