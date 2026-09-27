import React, { useState, useEffect } from 'react';
import {
  BGM_TRACKS,
  playBgm,
  stopBgm,
  isBgmPlaying,
  getCurrentTrackIndex,
  getBgmVolume,
  setBgmVolume,
  onBgmProgress
} from './bgm.js';

export function BgmJukebox({ sound, onToggleSound, onClose }) {
  const [playingIdx, setPlayingIdx] = useState(getCurrentTrackIndex());
  const [isPlaying, setIsPlaying] = useState(isBgmPlaying());
  const [volume, setVol] = useState(Math.round(getBgmVolume() * 100));
  const [progress, setProgress] = useState({ currentTime: 0, duration: 30.0, step: 0 });

  useEffect(() => {
    const unsub = onBgmProgress(data => {
      setPlayingIdx(data.trackIndex);
      setIsPlaying(data.isPlaying);
      setProgress({
        currentTime: data.currentTime,
        duration: data.duration,
        step: data.step
      });
    });
    return unsub;
  }, []);

  function handlePlayTrack(idx) {
    if (!sound) {
      onToggleSound?.();
    }
    if (isPlaying && playingIdx === idx) {
      stopBgm();
      setIsPlaying(false);
    } else {
      playBgm(idx);
      setPlayingIdx(idx);
      setIsPlaying(true);
    }
  }

  function handleVolumeChange(e) {
    const v = parseInt(e.target.value, 10);
    setVol(v);
    setBgmVolume(v / 100);
  }

  const activeTrack = BGM_TRACKS[playingIdx] || BGM_TRACKS[0];
  const progressPercent = Math.min(100, Math.max(0, (progress.currentTime / (progress.duration || 30)) * 100));
  const formatTime = (sec) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec - s) * 10);
    return `00:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bgm-jukebox-container" role="region" aria-label="BGM 주크박스">
      <div className="jukebox-header">
        <div className="jukebox-title-group">
          <span className="jukebox-tag">16-BIT RETRO ARCADE SOUNDTRACK</span>
          <h2 className="jukebox-title">9ZONE BGM 주크박스</h2>
          <p className="jukebox-sub">각 30.0초 완전 무한 루프로 설계된 오리지널 아케이드 신디사이저 10곡입니다.</p>
        </div>
        <div className="jukebox-controls-top">
          <button
            type="button"
            className={'jukebox-sound-toggle' + (sound ? ' sound-on' : '')}
            onClick={onToggleSound}
            aria-label={'사운드 ' + (sound ? '켜짐' : '꺼짐')}
          >
            {sound ? '♪ SOUND ON' : '♩ SOUND OFF'}
          </button>
          <div className="jukebox-vol-box" aria-label="BGM 볼륨 조절">
            <span className="vol-label">VOL {volume}%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="jukebox-vol-slider"
              aria-label="BGM 음량"
            />
          </div>
        </div>
      </div>

      <div className="jukebox-track-list" role="list">
        {BGM_TRACKS.map((track, idx) => {
          const isThisPlaying = isPlaying && playingIdx === idx;
          const isSelected = playingIdx === idx;

          return (
            <div
              key={track.id}
              className={'jukebox-track-card' + (isSelected ? ' selected' : '') + (isThisPlaying ? ' playing' : '')}
              role="listitem"
            >
              <div className="track-left">
                <div className="track-num-badge">
                  {isThisPlaying ? (
                    <span className="track-eq-anim" aria-label="재생 중">
                      <i className="eq-bar eq-1" />
                      <i className="eq-bar eq-2" />
                      <i className="eq-bar eq-3" />
                    </span>
                  ) : (
                    <span>{(idx + 1).toString().padStart(2, '0')}</span>
                  )}
                </div>
                <div className="track-info">
                  <div className="track-headline">
                    <strong className="track-name-ko">{track.titleKo}</strong>
                    <span className="track-name-en">({track.titleEn})</span>
                    {isSelected && <span className="track-current-badge">선택됨</span>}
                  </div>
                  <div className="track-meta">
                    <span className="meta-genre">{track.genre}</span>
                    <span className="meta-sep">·</span>
                    <span className="meta-bpm">{track.bpm} BPM</span>
                    <span className="meta-sep">·</span>
                    <span className="meta-dur">{track.durationSec.toFixed(1)}s Loop</span>
                    <span className="meta-sep">·</span>
                    <span className="meta-key">{track.key}</span>
                  </div>
                  <p className="track-desc">{track.desc}</p>
                </div>
              </div>

              <div className="track-actions">
                <button
                  type="button"
                  className={'track-play-btn' + (isThisPlaying ? ' btn-active' : '')}
                  onClick={() => handlePlayTrack(idx)}
                  aria-label={track.titleKo + (isThisPlaying ? ' 일시정지' : ' 재생')}
                >
                  {isThisPlaying ? '■ 정지' : '▶ 들어보기'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="jukebox-now-playing" aria-live="polite">
        <div className="np-visualizer">
          <div className="np-track-name">
            <span className="np-label">{isPlaying ? 'NOW PLAYING' : 'READY TO PLAY'}</span>
            <strong>{activeTrack.titleKo}</strong>
            <small>{activeTrack.genre}</small>
          </div>
          <div className="np-time-box">
            <span className="np-time">{formatTime(isPlaying ? progress.currentTime : 0)} / 00:30.0</span>
            <span className="np-loop-badge">🔁 30.0s Seamless Loop</span>
          </div>
        </div>
        <div className="np-progress-bar-bg" aria-hidden="true">
          <div className="np-progress-fill" style={{ width: `${isPlaying ? progressPercent : 0}%` }} />
        </div>
      </div>
    </div>
  );
}
