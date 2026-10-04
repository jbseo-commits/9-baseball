import { appendFileSync, mkdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
export const roles = ['main', 'explorer', 'worker', 'researcher', 'reviewer', 'continuity_reviewer', 'editorial_reviewer'];
export const statuses = ['waiting', 'running', 'done', 'failed', 'blocked'];
export const stages = ['plan', 'build', 'review', 'verify', 'report'];
export function validateEvent(e) {
  if (!e || !['codex', 'claude'].includes(e.engine) || !roles.includes(e.role) || !statuses.includes(e.status)) throw new Error('Invalid engine, role or status');
  if (e.stage && !stages.includes(e.stage)) throw new Error('Invalid stage');
  if (e.checkpoint && !['before-plan', 'repeat-error', 'before-done'].includes(e.checkpoint)) throw new Error('Invalid checkpoint');
  if (e.test && (!['passed', 'failed', 'blocked'].includes(e.test.status) || typeof e.test.name !== 'string' || e.test.name.length > 120)) throw new Error('Invalid test');
  for (const k of ['summary','model','runId','eventId']) if (e[k] !== undefined && (typeof e[k] !== 'string' || e[k].length > (k === 'summary' ? 500 : 120))) throw new Error('Invalid ' + k);
  if (e.usage) for (const k of ['input_tokens','cached_input_tokens','output_tokens']) if (e.usage[k] !== undefined && (!Number.isSafeInteger(e.usage[k]) || e.usage[k] < 0)) throw new Error('Invalid usage');
  if (e.at && !Number.isFinite(Date.parse(e.at))) throw new Error('Invalid timestamp');
  return e;
}
export function eventPath(root) { return join(root, 'loop', '.runtime', 'events.jsonl'); }
export function appendEvent(root, event) {
  const e = validateEvent({ ...event, at: event.at || new Date().toISOString() });
  mkdirSync(join(root, 'loop', '.runtime'), { recursive: true });
  appendFileSync(eventPath(root), JSON.stringify(e) + '\n', { mode: 0o600 });
  return e;
}
// Bounded replay: never load arbitrary session transcripts or home credentials.
export function readEvents(root) {
  const path = eventPath(root);
  if (!existsSync(path)) return { events: [], invalid: 0 };
  if (statSync(path).size > 16 * 1024 * 1024) throw new Error('Event log exceeds 16 MiB; archive it before continuing');
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  if (!text.endsWith('\n')) lines.pop(); // a writer may be halfway through the last line
  let invalid = 0;
  const events = [];
  for (const line of lines.slice(-10000)) {
    if (!line.trim()) continue;
    try { events.push(validateEvent(JSON.parse(line))); } catch { invalid++; }
  }
  return { events, invalid };
}
export function reduceEvents(events, engine) {
  const selected = events.filter(e => e.engine === engine);
  const seenRuns = new Set();
  const starts = selected.filter(e => e.role === 'main' && e.runId && !seenRuns.has(e.runId) && seenRuns.add(e.runId));
  const lastRun = starts.at(-1)?.runId || selected.at(-1)?.runId;
  const current = selected.filter(e => e.runId === lastRun);
  const agents = Object.fromEntries(roles.map(role => [role, { role, status: 'waiting', summary: '기록을 기다리고 있습니다' }]));
  const checkpoints = {};
  const tests = {};
  let stage = 'plan', usage = null, session = 'waiting';
  const seen = new Set();
  for (const e of current) {
    if (e.eventId && seen.has(e.eventId)) continue;
    if (e.eventId) seen.add(e.eventId);
    agents[e.role] = { ...agents[e.role], ...e };
    if (e.stage) stage = e.stage;
    if (e.checkpoint) checkpoints[e.checkpoint] = e;
    if (e.test) tests[e.test.name] = e.test;
    if (e.usage) usage = e.usage; // latest reported turn, not a fabricated all-agent total
    if (e.role === 'main') session = e.status;
  }
  return { engine, runId: lastRun || null, session, stage, agents: Object.values(agents), checkpoints, tests: Object.values(tests), usage, recent: current.slice(-40).reverse(), lastAt: current.at(-1)?.at || null };
}
export function normalizeCodex(raw, runId, model) {
  const base = {engine:'codex',role:'main',runId,model,source:'cli',status:'running'};
  if (raw.type === 'turn.completed') return {...base,status:'running',summary:'Codex 한 턴 종료 · 검증 완료와는 별개',usage:raw.usage};
  if (['turn.failed','error'].includes(raw.type)) return {...base,status:'failed',summary:'Codex 오류 · 터미널 출력을 확인하세요'};
  if (raw.type === 'thread.started') return {...base,summary:'Codex 세션 연결'};
  if (raw.type === 'turn.started') return {...base,summary:'Codex 작업 시작'};
  if (raw.type?.startsWith('item.') && raw.item) {
    const item=raw.item;
    const failed=item.status==='failed' || (typeof item.exit_code === 'number' && item.exit_code !== 0);
    const labels={command_execution:'명령',file_change:'파일 변경',mcp_tool_call:'도구 호출',web_search:'문서 검색',agent_message:'메인 응답',reasoning:'추론',plan_update:'계획 변경'};
    return {...base,status:failed?'failed':'running',summary:(labels[item.type] || 'CLI 활동')+' · '+(raw.type==='item.completed'?(failed?'실패':'종료'):'진행'),eventId:runId+':'+raw.type+':'+(item.id||'unknown')};
  }
  return null;
}
