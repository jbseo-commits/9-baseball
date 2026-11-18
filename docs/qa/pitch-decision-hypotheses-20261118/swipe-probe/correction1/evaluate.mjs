import fs from 'node:fs';
import crypto from 'node:crypto';
import { pitchDescriptor, samplePitchFlight } from '../src/duel/battle-vnext/pitch-trajectory.js';
import { judgePrototypeContact, scorePrototypeResult, SWIPE_MULTIPLIER, SWING_LEAD_MS, CONTACT_RADIUS } from '../src/duel/battle-vnext/pitch-swing-prototype.js';

const start = 1317;
const impact = 1617;
const base = pitchDescriptor({ profile: 'fastball', release: { x: 800, y: 350 }, target: { x: 550, y: 700 }, releaseAt: start, impactAt: impact, seed: 23 });
const sizes = ['small', 'medium', 'large'];
const profiles = ['fastball', 'slider', 'curve'];
const initialStrikesValues = [0, 1, 2];
const rows = [];
let comparisonCount = 0;
let geometryChecks = 0;

for (const profile of profiles) {
  const descriptor = pitchDescriptor({ ...base, profile });
  const row = { profile, integerContactSamples: 0, windows: {}, outcomesByStartingStrikes: {}, atInputDeadline: null };
  const contactTimes = Object.fromEntries(sizes.map(size => [size, []]));
  const sizeCounts = Object.fromEntries(initialStrikesValues.map(strikes => [strikes,
    Object.fromEntries(sizes.map(size => [size, { contact: 0, 'cut-foul': 0, miss: 0 }]))]));
  const atDeadline = samplePitchFlight(descriptor, start + (impact - start - SWING_LEAD_MS));
  const fastAtDeadline = samplePitchFlight(pitchDescriptor({ ...base, profile: 'fastball' }), start + (impact - start - SWING_LEAD_MS));
  row.atInputDeadline = {
    inputMsAfterRelease: impact - start - SWING_LEAD_MS,
    inputMsBeforeContact: SWING_LEAD_MS,
    profilePositionDeltaFromFastball: { x: atDeadline.position.x - fastAtDeadline.position.x, y: atDeadline.position.y - fastAtDeadline.position.y },
  };

  for (let contactAt = start; contactAt <= impact + 700; contactAt++) {
    row.integerContactSamples++;
    const outcomes = sizes.map(swipe => judgePrototypeContact({ descriptor, contactAt, target: descriptor.target, swipe }));
    comparisonCount += outcomes.length;
    const geometrySignatures = outcomes.map(o => JSON.stringify({ position: o.position, distance: o.distance, timingErrorMs: o.timingErrorMs }));
    if (new Set(geometrySignatures).size !== 1) throw new Error(`Swipe sizes changed geometry: ${profile} at ${contactAt}`);
    geometryChecks++;
    for (let i = 0; i < sizes.length; i++) {
      if (outcomes[i].result === 'contact' || outcomes[i].result === 'cut-foul') contactTimes[sizes[i]].push(contactAt - impact);
    }
    for (const initialStrikes of initialStrikesValues) {
      const scored = outcomes.map((outcome, i) => {
        sizeCounts[initialStrikes][sizes[i]][outcome.result]++;
        return scorePrototypeResult({ score: 0, strikes: initialStrikes, result: outcome.result, multiplier: outcome.multiplier });
      });
      for (const [lower, higher] of [[0, 1], [1, 2], [0, 2]]) {
        if (scored[higher].score < scored[lower].score || scored[higher].strikes > scored[lower].strikes) {
          throw new Error(`Conditional weak-dominance violation: ${sizes[higher]} vs ${sizes[lower]}, ${profile}, t=${contactAt}, starting strikes=${initialStrikes}`);
        }
      }
    }
  }

  for (const size of sizes) {
    const xs = contactTimes[size];
    row.windows[size] = xs.length ? { firstMsFromImpact: Math.min(...xs), lastMsFromImpact: Math.max(...xs), integerSamples: xs.length } : null;
  }
  row.outcomesByStartingStrikes = sizeCounts;
  rows.push(row);
}

const sourcePaths = ['../src/duel/battle-vnext/pitch-swing-prototype.js', '../src/duel/battle-vnext/pitch-trajectory.js'];
const report = {
  candidateBranch: 'review/pitch-swing-prototype-20261118',
  sourceCommit: '06aa22d',
  branchHead: '92a583942eb07a1be13f124620dfdc52af13561c',
  sourceIdentity: sourcePaths.map(path => {
    const bytes = fs.readFileSync(new URL(path, import.meta.url));
    return { path: path.replace('../', ''), gitBlobSha1: crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), sha256: crypto.createHash('sha256').update(bytes).digest('hex') };
  }),
  descriptor: { release: base.release, target: base.target, releaseAt: start, impactAt: impact, flightMs: impact - start, seed: base.seed, targetQualification: 'synthetic registered-T descriptor for this sampler probe; not a calibrated current UI/batter target' },
  model: { leadMs: SWING_LEAD_MS, inputTimeAfterReleaseMs: impact - start - SWING_LEAD_MS, inputTimeBeforeContactMs: SWING_LEAD_MS, contactRadiusWorldUnits: CONTACT_RADIUS, swipeMultipliers: SWIPE_MULTIPLIER, grid: 'each integer contactAt from release through impact+700ms; all swipe classes share profile, descriptor, target, and contactAt' },
  sampleCounts: { timeSamplesPerProfile: rows[0].integerContactSamples, profileTimeSamples: rows.reduce((n, r) => n + r.integerContactSamples, 0), geometricSizeComparisons: geometryChecks, outcomesEvaluatedAcrossThreeStartingStrikeCounts: comparisonCount * initialStrikesValues.length },
  findings: { geometryDependsOnSwipeSize: false, conditionalWeakDominanceViolations: 0, result: 'For this fixed-target, fixed-time rule comparison, increasing swipe size is weakly better on prototype score and strikes: misses tie; contacts give large > medium > small in points, while small overlap is a cut-foul. This is not strict dominance at every sample, does not model gesture cost/error, and says nothing about human preferences or engine rewards.' },
  profiles: rows,
};
fs.writeFileSync(new URL('./result.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
