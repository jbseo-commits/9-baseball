import firstPitchSvg from '../../assets/relics-v16/relic-first-pitch.svg';
import twoStackSvg from '../../assets/relics-v16/relic-two-stack.svg';
import foulTapeSvg from '../../assets/relics-v16/relic-foul-tape.svg';
import awayBadgeSvg from '../../assets/relics-v16/relic-away-badge.svg';
import slugBandSvg from '../../assets/relics-v16/relic-slug-band.svg';
import scopeSvg from '../../assets/relics-v16/relic-scope.svg';
import ledgerSvg from '../../assets/relics-v16/relic-ledger.svg';
import radarSvg from '../../assets/relics-v16/relic-radar.svg';

export const RELIC_ARTS = Object.freeze({
  firstPitch: firstPitchSvg,
  twoStack: twoStackSvg,
  foulTape: foulTapeSvg,
  awayBadge: awayBadgeSvg,
  slugBand: slugBandSvg,
  scope: scopeSvg,
  ledger: ledgerSvg,
  radar: radarSvg,
});

export const RELIC_MASTERPIECE_META = Object.freeze({
  firstPitch: { act: 1, grade: '보스/런 유물', title: '초구 노림표', mark: '1ST', color: '#f59e0b' },
  twoStack: { act: 1, grade: '보스/런 유물', title: '더블 그립', mark: '2X', color: '#06b6d4' },
  foulTape: { act: 1, grade: '보스/런 유물', title: '커트 테이프', mark: 'CUT', color: '#ef4444' },
  awayBadge: { act: 2, grade: '보스/런 유물', title: '반대 방향 배지', mark: 'OUT', color: '#3b82f6' },
  slugBand: { act: 3, grade: '보스/런 유물', title: '클린업 손목밴드', mark: 'XBH', color: '#ea580c' },
  scope: { act: 1, grade: '시설/관찰 유물', title: '낡은 망원경', mark: 'SCOPE', color: '#0284c7' },
  ledger: { act: 2, grade: '시설/분석 유물', title: '투구 기록장', mark: 'LEDGER', color: '#d97706' },
  radar: { act: 3, grade: '시설/전술 유물', title: '구속 판독기', mark: 'RADAR', color: '#10b981' },
});

export function relicArtFor(id) {
  if (!id) return null;
  return RELIC_ARTS[id] || null;
}
