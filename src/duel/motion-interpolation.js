/*
 * V16 Kinetic Motion Interpolation & Weight-Shift Engine
 * Provides sub-pixel athletic weight transfer and in-between pose transitions
 * for both batter (9 authored poses) and pitcher (120-frame / 7-phase delivery).
 */

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const lerp = (a, b, t) => a + (b - a) * t;

// 1. BATTER WEIGHT SHIFT PROFILE (normalised to box dimensions)
export const BATTER_WEIGHT_PROFILES = Object.freeze({
  ready: { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 },
  load: { dx: -0.032, dy: 0.012, rot: -0.016, sx: 0.99, sy: 1.012 },
  trigger: { dx: 0.024, dy: -0.008, rot: 0.010, sx: 1.01, sy: 0.995 },
  'swing-start': { dx: 0.052, dy: 0.016, rot: -0.032, sx: 1.02, sy: 0.982 },
  'swing-mid': { dx: 0.072, dy: 0.022, rot: -0.048, sx: 1.028, sy: 0.974 },
  contact: { dx: 0.058, dy: 0.014, rot: -0.028, sx: 1.016, sy: 0.986 },
  'follow-through-early': { dx: 0.042, dy: -0.012, rot: 0.022, sx: 0.99, sy: 1.018 },
  'follow-through-late': { dx: 0.022, dy: -0.018, rot: 0.032, sx: 0.982, sy: 1.024 },
  finish: { dx: 0.008, dy: -0.006, rot: 0.014, sx: 0.996, sy: 1.008 },
  settle: { dx: 0.002, dy: 0.002, rot: 0.002, sx: 1, sy: 1 },
});

// 2. PITCHER DELIVERY PHASES (120 frames at 60 FPS = 2000 ms)
export const PITCHER_KINETIC_KEYFRAMES = Object.freeze([
  { f: 0, dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 },
  { f: 20, dx: 0.012, dy: -0.015, rot: 0.008, sx: 0.995, sy: 1.012 }, // Balance point / high knee
  { f: 40, dx: 0.018, dy: -0.018, rot: 0.012, sx: 0.992, sy: 1.016 }, // Top of windup coil
  { f: 55, dx: -0.035, dy: 0.022, rot: -0.018, sx: 1.015, sy: 0.982 }, // Stride drive
  { f: 68, dx: -0.065, dy: 0.014, rot: -0.035, sx: 1.022, sy: 0.978 }, // Foot plant & max shoulder cocking
  { f: 74, dx: -0.082, dy: 0.006, rot: -0.052, sx: 1.028, sy: 0.972 }, // Arm acceleration
  { f: 76, dx: -0.086, dy: 0, rot: -0.050, sx: 1.022, sy: 0.980 }, // Release point
  { f: 85, dx: -0.065, dy: 0.012, rot: -0.034, sx: 1.012, sy: 0.988 }, // Follow-through deceleration
  { f: 100, dx: -0.032, dy: 0.006, rot: -0.016, sx: 1.005, sy: 0.995 }, // Rebound recovery
  { f: 120, dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 }, // Ready fielding stance
]);

/**
 * Computes batter in-between pose progress and adjacent keyframes
 */
export function computeBatterPoseTransition(timeline, t) {
  if (!timeline || !timeline.length) {
    return {
      currentPose: 'ready',
      nextPose: 'ready',
      progress: 0,
      rawProgress: 0,
      index: 0,
    };
  }

  let idx = 0;
  for (let j = 0; j < timeline.length; j++) {
    if (timeline[j].at > t) break;
    idx = j;
  }

  const current = timeline[idx];
  const next = timeline[idx + 1] || current;
  const span = Math.max(1, next.at - current.at);
  const rawProgress = clamp((t - current.at) / span, 0, 1);
  // Smooth cubic S-curve easing
  const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);

  return {
    currentPose: current.pose,
    nextPose: next.pose,
    progress,
    rawProgress,
    index: idx,
    at: current.at,
    nextAt: next.at,
  };
}

/**
 * Computes sub-pixel athletic weight shift for batter
 */
export function computeBatterWeightShift({
  currentPose = 'ready',
  nextPose = 'ready',
  progress = 0,
  inStop = false,
  stopElapsed = 0,
  hit = false,
} = {}) {
  const pA = BATTER_WEIGHT_PROFILES[currentPose] || BATTER_WEIGHT_PROFILES.ready;
  const pB = BATTER_WEIGHT_PROFILES[nextPose] || pA;

  let dx = lerp(pA.dx, pB.dx, progress);
  let dy = lerp(pA.dy, pB.dy, progress);
  let rot = lerp(pA.rot, pB.rot, progress);
  let sx = lerp(pA.sx, pB.sx, progress);
  let sy = lerp(pA.sy, pB.sy, progress);

  // High-impact contact shudder / micro recoil (decays over hit-stop duration)
  if (inStop && hit && stopElapsed >= 0 && stopElapsed < 90) {
    const shockDecay = 1 - stopElapsed / 90;
    const vibration = Math.sin(stopElapsed * 0.45) * 0.012 * shockDecay;
    dx -= 0.016 * shockDecay;
    dy += vibration;
    sx *= 1 + 0.02 * shockDecay;
    sy *= 1 - 0.015 * shockDecay;
  }

  return { dx, dy, rot, sx, sy };
}

/**
 * Computes sub-pixel athletic weight shift for pitcher delivery
 */
export function computePitcherWeightShift(fi = 0, knockedOut = false) {
  if (knockedOut) {
    return { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
  }

  const frames = PITCHER_KINETIC_KEYFRAMES;
  const f = clamp(fi, 0, 120);

  let idx = 0;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].f > f) break;
    idx = i;
  }

  const kA = frames[idx];
  const kB = frames[idx + 1] || kA;
  const span = Math.max(1, kB.f - kA.f);
  const rawT = clamp((f - kA.f) / span, 0, 1);
  const t = rawT * rawT * (3 - 2 * rawT);

  return {
    dx: lerp(kA.dx, kB.dx, t),
    dy: lerp(kA.dy, kB.dy, t),
    rot: lerp(kA.rot, kB.rot, t),
    sx: lerp(kA.sx, kB.sx, t),
    sy: lerp(kA.sy, kB.sy, t),
  };
}
