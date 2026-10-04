import {describe,it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';

// INBOX 7: 변형별 측정 스크립트의 구조 회귀. 수치는 봇 베이스라인이며
// 인간 재미·밸런스 주장이 아니다 (0승도 합법 결과).
describe('v10-bot-report structure',()=>{
  // 8 headless full runs via child process; slows past the 5s default under
  // parallel workers (2.7s solo). Structural assertions only, not timing.
  it('emits terminal-only rows for every variant',{timeout:30000},()=>{
    const out=execFileSync('node',['scripts/v10-bot-report.mjs','2'],{encoding:'utf8',timeout:120000});
    const {rows}=JSON.parse(out);
    expect(Object.keys(rows).sort()).toEqual(['base','relic','remove','support','upgrade']);
    for(const r of Object.values(rows)){
      expect(r.seeds).toBe(2);
      expect(r.won+r.lost+r.unfinished).toBe(2);
      expect(r.avgNodes).toBeGreaterThan(0);
      expect(r.avgPitches).toBeGreaterThan(0);
      expect(r.forcedRuns).toBeLessThanOrEqual(2);
    }
  });
});
