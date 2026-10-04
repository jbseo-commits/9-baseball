let engine='codex',data=null;
const $=id=>document.getElementById(id);
const status={waiting:'대기',running:'진행 중',done:'종료',failed:'실패',blocked:'차단'};
const roleNames={main:'메인',explorer:'explorer',worker:'worker',researcher:'researcher',reviewer:'reviewer',continuity_reviewer:'설정 검수',editorial_reviewer:'문학 검수'};
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function badge(value){return node('span',status[value]||value,'badge '+value);}
function time(value,short=false){return value?new Date(value).toLocaleString('ko-KR',short?{hour:'2-digit',minute:'2-digit',second:'2-digit'}:{}):'—';}
function render(){
  if(!data)return;
  const s=data.engines.find(x=>x.engine===engine),p=data.project,config=p.models[engine];
  $('project').textContent=p.title;$('repo').textContent=p.repository+' · '+(engine==='codex'?'Codex':'Claude Code');
  $('notice').textContent=data.demo?'DEMO · 화면 확인용 예시 데이터입니다. 실제 실행·검증·사용량이 아닙니다.':data.invalid?'일부 상태 기록을 읽지 못했습니다. 표시된 활동은 불완전할 수 있습니다.':!s.runId?'실행 기록이 없습니다. 아래 명령으로 시작하면 이 화면이 갱신됩니다.':'실제 CLI 활동과 에이전트 보고를 표시합니다. 모델 이름은 실행 설정이며 모든 작업자의 실사용 확인을 뜻하지 않습니다.';
  $('notice').className='notice'+(data.demo?' demo':'');$('mode').textContent=data.demo?'DEMO / SAMPLE DATA':'LIVE RECORDS';
  $('session').textContent=s.session==='done'?'세션 종료':status[s.session];$('run').textContent=s.runId||'아직 실행 기록 없음';
  $('checks').textContent=s.tests.length?s.tests.filter(t=>t.status==='passed').length+' / '+s.tests.length:'미검증';
  $('tokens').textContent=s.usage?(s.usage.input_tokens??0).toLocaleString()+' / '+(s.usage.output_tokens??0).toLocaleString():'미집계';
  const main=s.agents.find(a=>a.role==='main');$('main-status').replaceWith(Object.assign(badge(main.status),{id:'main-status'}));
  $('main-model').textContent=(config.main||'상속')+' · 설정';$('main-summary').textContent=main.summary||'메인 활동 기록 대기';$('last-at').textContent=time(s.lastAt);
  $('pipeline').replaceChildren(...['plan','build','review','verify','report'].map((stage,i)=>{const n=node('div',undefined,'step'+(s.stage===stage?' current':''));n.append(node('small','0'+(i+1)),node('span',['계획','작업','검토','검증','보고'][i]));return n;}));
  $('checkpoints').replaceChildren(...[['before-plan','계획 전에','접근법과 변경 범위'],['repeat-error','오류가 반복될 때','가설과 탐색 방향'],['before-done','완료를 보고하기 전에','빠진 검증과 남은 결함']].map(([key,title,desc])=>{const n=node('div'),label=node('div');label.append(node('strong',title),node('small',desc));n.append(label,badge(s.checkpoints[key]?.status||'waiting'));return n;}));
  const visible=['explorer','worker','researcher','reviewer',...(p.novel?['continuity_reviewer','editorial_reviewer']:[])];
  $('agents').replaceChildren(...visible.map(role=>{const a=s.agents.find(x=>x.role===role),n=node('article',undefined,'agent'),head=node('div',undefined,'agent-head');head.append(node('h3',roleNames[role]),badge(a.status));n.append(head,node('p',(config[role]||config.worker)+' · 설정','model'),node('p',a.summary));return n;}));
  $('activity').replaceChildren(...(s.recent.length?s.recent.map(e=>{const n=node('div',undefined,'event');n.append(node('time',time(e.at,true)),node('span',roleNames[e.role],'event-role'),node('span',e.summary||status[e.status],'event-text'));return n;}):[node('div','첫 활동을 기다리고 있습니다.','empty')]));
  $('tests').replaceChildren(...(s.tests.length?s.tests.map(t=>{const n=node('div',undefined,'test');n.append(node('span',t.name),node('span',{passed:'통과',failed:'실패',blocked:'미검증'}[t.status],t.status));return n;}):[node('div','검증 결과가 아직 없습니다.','empty')]));
  $('command').textContent='node scripts/'+(engine==='codex'?'codex':'claude')+'-loop.mjs --check\nnode scripts/'+(engine==='codex'?'codex':'claude')+'-loop.mjs --run';
}
async function refresh(){try{const response=await fetch('/api/state',{cache:'no-store'});if(!response.ok)throw Error();data=await response.json();$('connection').textContent='● 연결됨 · 2초 갱신';render();}catch{$('connection').textContent='● 연결 끊김';$('notice').textContent='대시보드 연결이 끊겼습니다. 마지막 기록을 표시 중입니다.';}}
document.querySelectorAll('[data-engine]').forEach(b=>b.addEventListener('click',()=>{engine=b.dataset.engine;document.querySelectorAll('[data-engine]').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-pressed',String(t===b));});$('copy-status').textContent='';render();}));
$('refresh').addEventListener('click',refresh);
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('command').textContent);$('copy-status').textContent='명령을 복사했습니다.';}catch{$('copy-status').textContent='복사를 사용할 수 없습니다. 표시된 명령을 선택해 복사하세요.';}});
refresh();setInterval(refresh,2000);
