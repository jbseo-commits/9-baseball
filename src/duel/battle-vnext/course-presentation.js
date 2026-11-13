/*
 * Pure course-presentation contract. The host constructs this data after the
 * durable-save barrier, but no renderer consumes it yet. It describes public
 * candidate zones, but it
 * cannot read a pending engine roll, judge contact, or mutate game state.
 */

export const COURSE_LOCK_LEAD_MS = 260;

/* Diagnostic coordinates only. The plane has not been registered or approved
 * for runtime targeting. */
export const PROPOSED_COURSE_PLANE = Object.freeze({
  xMin: 729,
  xMax: 939,
  yMin: 449.0625,
  yMax: 772.5,
  approved: false,
});

const frozenFrame = (stage, fields = {}) => Object.freeze({ stage, ...fields });
const finite = Number.isFinite;
const validZone = zone => Number.isInteger(zone) && zone >= 0 && zone <= 9;
const validPoint = point => point != null && finite(point.x) && finite(point.y);

function visualRandom(seed) {
  const token = typeof seed === 'string' ? seed : String(seed);
  let state = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    state ^= token.charCodeAt(i);
    state = Math.imul(state, 16777619) >>> 0;
  }
  if (state === 0) state = 0x6d2b79f5;
  return () => {
    // xorshift32 is local visual sequencing only; no platform RNG is consulted.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

function validSeed(seed) {
  return (typeof seed === 'string' && seed.length > 0)
    || (typeof seed === 'number' && finite(seed));
}

/**
 * Freeze a sorted pool of public candidate zones and a deterministic weighted
 * scan order. Only each candidate's public `zone` and `weight` are read; extra
 * fields (including any private probability) are ignored.
 */
export function createCoursePlan(candidates, options = {}) {
  const visualSeed = options && typeof options === 'object' ? options.visualSeed : undefined;
  if (!Array.isArray(candidates) || !validSeed(visualSeed)) {
    return Object.freeze({ valid: false, pool: Object.freeze([]), scanSequence: Object.freeze([]) });
  }

  const byZone = new Map();
  for (const candidate of candidates) {
    if (!candidate || !validZone(candidate.zone) || !finite(candidate.weight) || candidate.weight <= 0) continue;
    // A public zone occurs at most once. The first valid public entry owns it.
    if (!byZone.has(candidate.zone)) byZone.set(candidate.zone, Object.freeze({ zone: candidate.zone, weight: candidate.weight }));
  }
  const pool = Object.freeze([...byZone.values()].sort((a, b) => a.zone - b.zone));
  if (pool.length === 0) return Object.freeze({ valid: false, pool, scanSequence: Object.freeze([]) });

  const random = visualRandom(visualSeed);
  const remaining = [...pool];
  const scanSequence = [];
  while (remaining.length) {
    const maxWeight = Math.max(...remaining.map(item => item.weight));
    const scaled = remaining.map(item => item.weight / maxWeight);
    const total = scaled.reduce((sum, weight) => sum + weight, 0);
    let draw = random() * total;
    let selected = scaled.length - 1;
    for (let i = 0; i < scaled.length; i += 1) {
      draw -= scaled[i];
      if (draw < 0) { selected = i; break; }
    }
    scanSequence.push(remaining[selected].zone);
    remaining.splice(selected, 1);
  }

  return Object.freeze({ valid: true, pool, scanSequence: Object.freeze(scanSequence) });
}

/** Add the public lock point to an existing host timeline. */
export function courseTimeline(base) {
  if (!base || !finite(base.pitchReleaseAt) || base.pitchReleaseAt < 0
      || !finite(base.impactAt) || base.impactAt < base.pitchReleaseAt) return null;
  return Object.freeze({ ...base, courseLockAt: Math.max(0, base.pitchReleaseAt - COURSE_LOCK_LEAD_MS) });
}

function acceptedDestination(plan, getDestination) {
  if (typeof getDestination !== 'function') return null;
  let zone;
  try { zone = getDestination(); } catch { return null; }
  if (!validZone(zone) || !plan.pool.some(candidate => candidate.zone === zone)) return null;
  return zone;
}

function validPlan(plan) {
  if (!plan?.valid || !Array.isArray(plan.pool) || plan.pool.length === 0
      || !plan.pool.every(candidate => candidate && validZone(candidate.zone) && finite(candidate.weight) && candidate.weight > 0)
      || !Array.isArray(plan.scanSequence) || plan.scanSequence.length !== plan.pool.length) return false;
  const sequence = new Set(plan.scanSequence);
  return sequence.size === plan.pool.length && plan.scanSequence.every(zone => plan.pool.some(candidate => candidate.zone === zone));
}

/** Public-only rhythm. Increasing dwell creates anticipation without steering
 * toward the private destination or changing a single host boundary. */
export function courseScanSchedule(plan, timeline) {
  const end=timeline?.courseLockAt;
  if(!validPlan(plan)||!finite(end)||end<=0)return Object.freeze([]);
  const sequence=plan.scanSequence;
  const count=sequence.length===1?1:Math.max(1,Math.min(18,Math.floor(end/85)));
  const weights=Array.from({length:count},(_,i)=>1+3*(i/Math.max(1,count-1))**2);
  const total=weights.reduce((a,b)=>a+b,0);let at=0;
  return Object.freeze(weights.map((weight,i)=>{
    const step=Object.freeze({at,zone:sequence[i%sequence.length]});
    at+=end*weight/total;return step;
  }));
}
const schedules=new WeakMap();
function scanSchedule(plan,timeline){
  const end=timeline.courseLockAt,cached=schedules.get(plan);
  if(cached?.end===end)return cached.schedule;
  const schedule=courseScanSchedule(plan,timeline);schedules.set(plan,{end,schedule});return schedule;
}

/**
 * Before the public lock, return scan-only information and never call the
 * destination getter. After lock, reveal only an accepted durable destination
 * that belongs to the frozen public candidate pool.
 */
export function courseFrameAt(input = {}) {
  if (!input || typeof input !== 'object') return frozenFrame('hidden', { scanZone: null, targetZone: null, progress: 0 });
  const { elapsed, timeline, plan, getDestination, reduced = false } = input;
  if (!finite(elapsed) || elapsed < 0 || !timeline || !finite(timeline.impactAt)
      || timeline.impactAt < 0 || !validPlan(plan)) {
    return frozenFrame('hidden', { scanZone: null, targetZone: null, progress: 0 });
  }

  const impactAt = timeline.impactAt;
  const lockAt = finite(timeline.courseLockAt) && timeline.courseLockAt >= 0
    ? timeline.courseLockAt
    : null;
  if (lockAt == null || lockAt > impactAt) return frozenFrame('hidden', { scanZone: null, targetZone: null, progress: 0 });
  if (reduced) {
    if (elapsed < impactAt) return frozenFrame('hold', { scanZone: null, targetZone: null, progress: 0 });
    const targetZone = acceptedDestination(plan, getDestination);
    return targetZone == null
      ? frozenFrame('unresolved', { scanZone: null, targetZone: null, progress: 1 })
      : frozenFrame('impact', { scanZone: null, targetZone, progress: 1 });
  }

  if (elapsed < lockAt) {
    const end = lockAt;
    const progress = end > 0 ? Math.min(1, elapsed / end) : 0;
    const schedule=scanSchedule(plan,timeline);
    let index=0;
    while(index+1<schedule.length&&schedule[index+1].at<=elapsed)index++;
    return frozenFrame('scan', {scanZone:schedule[index]?.zone??null,targetZone:null,progress,
      scanIndex:index,scanCount:schedule.length,scanAge:elapsed-(schedule[index]?.at??0),
      previousZone:index?schedule[index-1].zone:null});
  }

  const targetZone = acceptedDestination(plan, getDestination);
  return targetZone == null
    ? frozenFrame('unresolved', { scanZone: null, targetZone: null, progress: 1 })
    : frozenFrame(elapsed >= impactAt ? 'impact' : 'locked', { scanZone: null, targetZone, progress: 1, lockAge:Math.max(0,elapsed-lockAt) });
}

/** Map a public zone onto the explicitly unapproved diagnostic plane. */
export function courseTarget(zone, plane = PROPOSED_COURSE_PLANE) {
  if (!validZone(zone) || !plane || !finite(plane.xMin) || !finite(plane.xMax)
      || !finite(plane.yMin) || !finite(plane.yMax)
      || plane.xMax <= plane.xMin || plane.yMax <= plane.yMin) return null;
  const u = zone === 9 ? 1.5 : (zone % 3 + 0.5) / 3;
  const v = zone === 9 ? 0.5 : (Math.floor(zone / 3) + 0.5) / 3;
  return Object.freeze({ zone, u, v, x: plane.xMin + u * (plane.xMax - plane.xMin), y: plane.yMin + v * (plane.yMax - plane.yMin) });
}

/**
 * Pure incoming-ball interpolation from a registered release point to the
 * selected target. At and after impact it holds exactly at T; the host owns any
 * existing post-impact/contact presentation.
 */
export function courseFlightAt(input = {}) {
  if (!input || typeof input !== 'object') return frozenFrame('hidden', { ball: null, progress: 0 });
  const { elapsed, timeline, origin, target } = input;
  if (!finite(elapsed) || elapsed < 0 || !timeline || !finite(timeline.pitchReleaseAt)
      || timeline.pitchReleaseAt < 0 || !finite(timeline.impactAt) || timeline.impactAt < timeline.pitchReleaseAt
      || !validPoint(origin) || !validPoint(target)) {
    return frozenFrame('hidden', { ball: null, progress: 0 });
  }
  if (elapsed < timeline.pitchReleaseAt) return frozenFrame('waiting', { ball: null, progress: 0 });
  if (elapsed >= timeline.impactAt || timeline.impactAt === timeline.pitchReleaseAt) {
    return frozenFrame('impact', { ball: Object.freeze({ x: target.x, y: target.y }), progress: 1 });
  }
  const progress = Math.max(0, Math.min(1,
    (elapsed - timeline.pitchReleaseAt) / (timeline.impactAt - timeline.pitchReleaseAt)));
  return frozenFrame('flight', { ball: Object.freeze({
    x: origin.x + (target.x - origin.x) * progress,
    y: origin.y + (target.y - origin.y) * progress,
  }), progress });
}
