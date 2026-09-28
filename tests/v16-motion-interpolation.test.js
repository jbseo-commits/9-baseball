import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {
  computeBatterPoseTransition,
  computeBatterWeightShift,
  computePitcherWeightShift,
  BATTER_WEIGHT_PROFILES,
  PITCHER_KINETIC_KEYFRAMES,
} from '../src/duel/motion-interpolation.js';
import {batterMotionV3Timeline} from '../src/duel/batterMotionV3.js';

describe('V16 Motion Interpolation & Kinetic Weight Shift', () => {
  const actorsJsx = fs.readFileSync(new URL('../src/duel/BallparkActors.jsx', import.meta.url), 'utf8');

  it('BallparkActors.jsx integrates motion interpolation and in-between sprite', () => {
    expect(actorsJsx).toMatch(/computeBatterPoseTransition/);
    expect(actorsJsx).toMatch(/computeBatterWeightShift/);
    expect(actorsJsx).toMatch(/computePitcherWeightShift/);
    expect(actorsJsx).toMatch(/inBetweenBatter/);
  });

  describe('Batter Pose Transition & Weight Shift', () => {
    const shot = {
      grade: 'solid',
      motion: {duration: 1080, impactAt: 300, settleAt: 850, freeze: 50, slowmo: 0},
    };
    const timeline = batterMotionV3Timeline(shot);

    it('computeBatterPoseTransition calculates smooth normalized progress between keyframes', () => {
      const start = computeBatterPoseTransition(timeline, 0);
      expect(start.currentPose).toBe('ready');
      expect(start.progress).toBe(0);

      const midTime = (timeline[1].at + timeline[2].at) / 2;
      const trans = computeBatterPoseTransition(timeline, midTime);
      expect(trans.currentPose).toBe(timeline[1].pose);
      expect(trans.nextPose).toBe(timeline[2].pose);
      expect(trans.progress).toBeGreaterThan(0);
      expect(trans.progress).toBeLessThanOrEqual(1);
    });

    it('computeBatterWeightShift computes athletic forward drive and back-hip coil', () => {
      const readyShift = computeBatterWeightShift({currentPose: 'ready', nextPose: 'ready', progress: 0});
      expect(readyShift.dx).toBe(0);
      expect(readyShift.dy).toBe(0);

      const loadShift = computeBatterWeightShift({currentPose: 'load', nextPose: 'load', progress: 0});
      expect(loadShift.dx).toBeLessThan(0); // weight coiled into back hip
      expect(loadShift.dy).toBeGreaterThan(0); // lowered center of gravity

      const swingShift = computeBatterWeightShift({currentPose: 'swing-mid', nextPose: 'swing-mid', progress: 0});
      expect(swingShift.dx).toBeGreaterThan(0.05); // explosive forward drive
      expect(swingShift.rot).toBeLessThan(0); // aggressive rotational torque
    });

    it('applies contact micro-recoil during hit-stop', () => {
      const shockStart = computeBatterWeightShift({
        currentPose: 'contact',
        nextPose: 'contact',
        progress: 0,
        inStop: true,
        stopElapsed: 10,
        hit: true,
      });
      const shockEnd = computeBatterWeightShift({
        currentPose: 'contact',
        nextPose: 'contact',
        progress: 0,
        inStop: true,
        stopElapsed: 85,
        hit: true,
      });

      expect(Math.abs(shockStart.dx - BATTER_WEIGHT_PROFILES.contact.dx)).toBeGreaterThan(
        Math.abs(shockEnd.dx - BATTER_WEIGHT_PROFILES.contact.dx)
      );
    });
  });

  describe('Pitcher Kinetic Weight Shift Delivery', () => {
    it('PITCHER_KINETIC_KEYFRAMES covers all 7 pitching mechanics phases', () => {
      expect(PITCHER_KINETIC_KEYFRAMES.length).toBeGreaterThanOrEqual(7);
      expect(PITCHER_KINETIC_KEYFRAMES[0].f).toBe(0);
      expect(PITCHER_KINETIC_KEYFRAMES.at(-1).f).toBe(120);
    });

    it('computePitcherWeightShift models windup balance, forward stride, and follow-through recovery', () => {
      const windup = computePitcherWeightShift(20, false);
      expect(windup.dy).toBeLessThan(0); // high knee lift

      const stride = computePitcherWeightShift(60, false);
      expect(stride.dx).toBeLessThan(0); // driving forward toward plate
      expect(stride.dy).toBeGreaterThan(0); // lower body drop

      const release = computePitcherWeightShift(76, false);
      expect(release.dx).toBeLessThan(-0.07); // maximum forward extension
      expect(release.rot).toBeLessThan(-0.03); // chest whip tilt

      const finish = computePitcherWeightShift(120, false);
      expect(finish.dx).toBe(0); // return to balanced fielding stance
    });

    it('returns neutral shift during knockout so fall physics take precedence', () => {
      const koShift = computePitcherWeightShift(76, true);
      expect(koShift.dx).toBe(0);
      expect(koShift.dy).toBe(0);
      expect(koShift.rot).toBe(0);
    });
  });
});
