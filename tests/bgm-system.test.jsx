// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
  BGM_TRACKS,
  getBgmTracks,
  getCurrentTrackIndex,
  getBgmVolume,
  setBgmVolume,
  playBgm,
  stopBgm,
  isBgmPlaying,
  onBgmProgress
} from '../src/duel/bgm.js';
import { BgmJukebox } from '../src/duel/BgmJukebox.jsx';

describe('9ZONE BGM System & 10 Tracks', () => {
  afterEach(cleanup);

  it('defines exactly 10 distinct arcade loop tracks', () => {
    const tracks = getBgmTracks();
    expect(tracks).toHaveLength(10);
    expect(BGM_TRACKS).toHaveLength(10);

    const ids = new Set(tracks.map(t => t.id));
    expect(ids.size).toBe(10);
  });

  it('all 10 tracks have exactly 30.0s seamless loop durations', () => {
    for (const track of BGM_TRACKS) {
      expect(track.durationSec).toBe(30.0);
      expect(track.bars).toBeGreaterThanOrEqual(12);
      expect(track.bpm).toBeGreaterThanOrEqual(90);

      // Verify the bar/beat math: bars * 4 * (60 / bpm) == durationSec
      const beats = track.bars * 4;
      const beatDur = 60 / track.bpm;
      const totalLoopSec = beats * beatDur;
      expect(Math.abs(totalLoopSec - 30.0)).toBeLessThan(0.001);

      // Verify rich musical data
      expect(track.chords.length).toBeGreaterThan(0);
      expect(track.bassNotes.length).toBeGreaterThan(0);
      expect(track.leadMotif.length).toBeGreaterThan(0);
      expect(track.titleKo).toBeTruthy();
      expect(track.titleEn).toBeTruthy();
      expect(track.genre).toBeTruthy();
      expect(track.desc).toBeTruthy();
    }
  });

  it('controls volume and clamps within [0, 1]', () => {
    setBgmVolume(0.5);
    expect(getBgmVolume()).toBe(0.5);

    setBgmVolume(1.8);
    expect(getBgmVolume()).toBe(1.0);

    setBgmVolume(-0.4);
    expect(getBgmVolume()).toBe(0.0);

    setBgmVolume(0.32);
    expect(getBgmVolume()).toBe(0.32);
  });

  it('safely handles playBgm and stopBgm calls in non-audio/headless environments', () => {
    expect(() => playBgm(0)).not.toThrow();
    expect(() => playBgm(4)).not.toThrow();
    expect(() => stopBgm(true)).not.toThrow();
  });

  it('registers and unregisters progress callbacks', () => {
    const cb = vi.fn();
    const unsub = onBgmProgress(cb);
    expect(typeof unsub).toBe('function');
    unsub();
  });
});

describe('BgmJukebox UI Component', () => {
  afterEach(cleanup);

  it('renders all 10 tracks with Korean titles, BPM, and descriptions', () => {
    render(<BgmJukebox sound={true} onToggleSound={() => {}} onClose={() => {}} />);

    // Check header
    expect(screen.getByText('9ZONE BGM 주크박스')).toBeTruthy();
    expect(screen.getByText(/각 30.0초 완전 무한 루프로 설계된/)).toBeTruthy();

    // Verify all 10 tracks appear
    for (const track of BGM_TRACKS) {
      expect(screen.getAllByText(track.titleKo).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(`(${track.titleEn})`)).toBeTruthy();
    }
  });

  it('allows clicking track preview buttons', () => {
    const toggleSoundMock = vi.fn();
    render(<BgmJukebox sound={false} onToggleSound={toggleSoundMock} onClose={() => {}} />);

    const playButtons = screen.getAllByRole('button', { name: /재생/ });
    expect(playButtons.length).toBe(10);

    // Clicking first track button
    fireEvent.click(playButtons[0]);
    // Sound was off, so onToggleSound should be invoked
    expect(toggleSoundMock).toHaveBeenCalled();
  });

  it('allows adjusting volume slider', () => {
    render(<BgmJukebox sound={true} onToggleSound={() => {}} onClose={() => {}} />);
    const slider = screen.getByLabelText('BGM 음량');
    expect(slider).toBeTruthy();

    fireEvent.change(slider, { target: { value: '65' } });
    expect(screen.getByText('VOL 65%')).toBeTruthy();
    expect(getBgmVolume()).toBe(0.65);
  });
});
