// 9ZONE HOMEBOUND - 16-Bit Arcade Retro Synthesizer BGM Engine
// Pure Web Audio API: 10 distinct 30.0-second seamless loop tracks.
// Zero external network assets, zero latency, perfect tempo accuracy.

import { getAudioContext, getMasterNode } from './audio.js';

// Convert MIDI note number to Hz frequency (A4 = 69 = 440Hz)
function m2f(note) {
  if (!note || note <= 0) return 0;
  return 440 * Math.pow(2, (note - 69) / 12);
}

// Global BGM State
let bgmGain = null;
let currentTrackIdx = 0;
let isPlaying = false;
let userVolume = 0.32;
let schedulerTimer = null;
let currentStep = 0;
let nextStepTime = 0;
let activeTrack = null;
let progressListeners = new Set();
let loopStartTime = 0;

// Track Definitions (All calibrated to exactly 30.00 seconds loops)
export const BGM_TRACKS = [
  {
    id: 'homebound-neon',
    titleKo: '01. 홈바운드 네온',
    titleEn: 'Homebound Neon',
    genre: 'CPS2/Neo-Geo 아케이드 스타디움 앤섬',
    bpm: 128,
    bars: 16,
    durationSec: 30.0,
    mood: '열정적 · 영웅적 · 메인 스타디움',
    desc: '강렬한 4-on-the-floor 비트와 16비트 롤링 베이스, 시그니처 신스 브라스 팡파르로 9ZONE의 상징적인 승부 분위기를 연출합니다.',
    key: 'A Minor / C Major',
    // 16 bars = 64 beats = 256 16th-note steps = exactly 30.0s at 128 BPM
    chords: [
      // 4 bars Am - F - C - G repeated 4 times with variations
      [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62],
      [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62],
      [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62],
      [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 64]
    ],
    bassNotes: [
      45, 45, 45, 45,  41, 41, 41, 41,  36, 36, 36, 36,  43, 43, 43, 43,
      45, 45, 45, 45,  41, 41, 41, 41,  36, 36, 36, 36,  43, 43, 43, 43,
      45, 48, 45, 48,  41, 45, 41, 45,  36, 40, 36, 40,  43, 47, 43, 47,
      45, 45, 45, 48,  41, 41, 41, 45,  36, 36, 36, 40,  43, 43, 45, 47
    ],
    // Melody notes mapped to 16th steps [step, note, durationInSteps]
    leadMotif: [
      // Part A: Main Stadium Hook (Bars 1-4)
      [0, 69, 3], [4, 72, 3], [8, 74, 2], [10, 76, 4], [16, 76, 3], [20, 74, 2], [22, 72, 3], [26, 69, 4],
      [32, 67, 3], [36, 69, 3], [40, 72, 4], [48, 71, 3], [52, 69, 3], [56, 67, 4],
      // Part B: Rising Tension Drive (Bars 5-8)
      [64, 69, 3], [68, 72, 3], [72, 74, 2], [74, 76, 4], [80, 79, 3], [84, 76, 3], [88, 74, 2], [90, 72, 4],
      [96, 74, 4], [102, 76, 4], [108, 79, 4], [114, 81, 6],
      // Part C: High Octave Climax (Bars 9-12)
      [128, 81, 4], [134, 79, 3], [138, 76, 3], [142, 74, 4], [148, 76, 4], [154, 79, 4], [160, 81, 6],
      [168, 84, 4], [174, 83, 3], [178, 81, 3], [182, 79, 4], [186, 76, 4],
      // Part D: Loop Turnaround Fanfare (Bars 13-16)
      [192, 72, 3], [196, 74, 3], [200, 76, 4], [208, 79, 4], [214, 81, 4], [220, 84, 6],
      [228, 83, 3], [232, 81, 3], [236, 79, 3], [240, 76, 4], [248, 74, 4], [252, 71, 4]
    ],
    drumStyle: 'arcade-dance'
  },
  {
    id: 'red-rush-duel',
    titleKo: '02. 레드 러시 듀얼',
    titleEn: 'Red Rush Duel',
    genre: '하이텐션 라이벌 투수 결전 (Boss Battle)',
    bpm: 128,
    bars: 16,
    durationSec: 30.0,
    mood: '긴장감 · 위기감 · 투수 강판 압박',
    desc: '어둡고 저돌적인 16비트 톱니파 베이스 아르페지오와 채찍질하는 스네어 비트로 에이스 투수와의 숨 막히는 진검승부를 그립니다.',
    key: 'D Minor',
    chords: [
      [50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52],
      [50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52],
      [50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52],
      [50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 57]
    ],
    bassNotes: [
      38, 38, 50, 38,  34, 34, 46, 34,  31, 31, 43, 31,  33, 33, 45, 33,
      38, 38, 50, 38,  34, 34, 46, 34,  31, 31, 43, 31,  33, 33, 45, 33,
      38, 41, 50, 38,  34, 38, 46, 34,  31, 34, 43, 31,  33, 37, 45, 33,
      38, 38, 50, 53,  34, 34, 46, 50,  31, 31, 43, 46,  33, 33, 45, 49
    ],
    leadMotif: [
      [0, 62, 2], [3, 65, 2], [6, 69, 2], [9, 74, 4], [16, 73, 2], [19, 70, 2], [22, 69, 4],
      [32, 67, 2], [35, 70, 2], [38, 74, 3], [44, 73, 2], [47, 69, 2], [50, 67, 3], [56, 65, 4],
      [64, 74, 3], [68, 72, 2], [71, 70, 2], [74, 69, 4], [80, 70, 3], [84, 72, 3], [88, 74, 4],
      [96, 77, 4], [102, 76, 3], [106, 74, 3], [110, 73, 4], [116, 74, 6],
      [128, 74, 2], [130, 74, 2], [134, 77, 3], [138, 81, 4], [146, 82, 3], [150, 81, 3], [154, 77, 4],
      [160, 76, 3], [164, 74, 3], [168, 73, 4], [176, 69, 3], [180, 70, 3], [184, 73, 4],
      [192, 74, 4], [198, 77, 4], [204, 81, 4], [210, 85, 4], [216, 86, 4], [222, 85, 4],
      [228, 81, 4], [234, 77, 4], [240, 74, 4], [246, 73, 4], [250, 69, 4]
    ],
    drumStyle: 'rush-metal'
  },
  {
    id: 'midnight-dugout',
    titleKo: '03. 미드나잇 더그아웃',
    titleEn: 'Midnight Dugout',
    genre: '칠 신스웨이브 / 노을 스타디움 감성',
    bpm: 96,
    bars: 12,
    durationSec: 30.0,
    mood: '차분함 · 전략적 숙고 · 서정적 휴식',
    desc: '따뜻한 FM 일렉트릭 피아노 코드와 부드러운 서브베이스, 밤하늘 조명 아래 차분히 수 싸움을 정리하는 감성 테마입니다.',
    key: 'F Major / D Minor',
    chords: [
      [50, 57, 60, 64], [46, 53, 57, 62], [43, 50, 55, 58], [48, 55, 58, 62],
      [50, 57, 60, 64], [46, 53, 57, 62], [43, 50, 55, 58], [48, 55, 58, 62],
      [50, 57, 60, 64], [46, 53, 57, 62], [43, 50, 55, 58], [48, 55, 60, 64]
    ],
    bassNotes: [
      38, 38, 38, 38,  34, 34, 34, 34,  31, 31, 31, 31,  36, 36, 36, 36,
      38, 38, 38, 38,  34, 34, 34, 34,  31, 31, 31, 31,  36, 36, 36, 36,
      38, 41, 38, 41,  34, 38, 34, 38,  31, 34, 31, 34,  36, 40, 36, 40
    ],
    leadMotif: [
      [0, 65, 4], [6, 69, 4], [12, 72, 6], [20, 69, 3], [24, 67, 4],
      [32, 65, 4], [38, 62, 4], [44, 60, 6], [52, 62, 4],
      [64, 69, 4], [70, 72, 4], [76, 76, 6], [84, 74, 4], [90, 72, 4],
      [96, 69, 4], [102, 67, 4], [108, 65, 6], [116, 64, 4],
      [128, 65, 4], [134, 69, 4], [140, 72, 4], [146, 77, 6],
      [154, 76, 4], [160, 74, 4], [166, 72, 4], [172, 69, 6], [182, 65, 4]
    ],
    drumStyle: 'chill-downtempo'
  },
  {
    id: 'cyber-diamond',
    titleKo: '04. 사이버 다이아몬드',
    titleEn: 'Cyber Diamond',
    genre: '하이테크 사이버 아케이드 비트',
    bpm: 128,
    bars: 16,
    durationSec: 30.0,
    mood: '날카로움 · 미래지향적 · 정밀한 타격감',
    desc: '빛나는 아르페지오 매트릭스와 펑키한 신스 베이스 슬랩으로 하이테크 미래 스타디움의 정밀 승부를 그립니다.',
    key: 'E Minor',
    chords: [
      [52, 55, 59], [48, 52, 55], [50, 54, 57], [52, 55, 59],
      [52, 55, 59], [48, 52, 55], [50, 54, 57], [52, 55, 59],
      [52, 55, 59], [48, 52, 55], [50, 54, 57], [52, 55, 59],
      [52, 55, 59], [48, 52, 55], [50, 54, 57], [55, 59, 64]
    ],
    bassNotes: [
      40, 40, 52, 40,  36, 36, 48, 36,  38, 38, 50, 38,  40, 40, 52, 40,
      40, 40, 52, 40,  36, 36, 48, 36,  38, 38, 50, 38,  40, 40, 52, 40,
      40, 43, 52, 40,  36, 40, 48, 36,  38, 42, 50, 38,  40, 43, 52, 40,
      40, 40, 43, 47,  36, 36, 40, 43,  38, 38, 42, 45,  40, 43, 47, 52
    ],
    leadMotif: [
      [0, 64, 2], [4, 67, 2], [8, 71, 3], [12, 74, 2], [16, 76, 4], [22, 74, 2], [26, 71, 2],
      [32, 67, 3], [36, 69, 2], [40, 71, 4], [46, 67, 2], [50, 64, 4],
      [64, 76, 2], [68, 79, 3], [74, 83, 4], [80, 81, 2], [84, 79, 2], [88, 76, 4],
      [96, 74, 3], [100, 76, 2], [104, 79, 4], [110, 83, 4], [116, 84, 6],
      [128, 83, 2], [132, 81, 2], [136, 79, 2], [140, 76, 3], [144, 79, 2], [148, 81, 2], [152, 83, 4],
      [160, 79, 2], [164, 76, 2], [168, 74, 2], [172, 71, 3], [176, 74, 2], [180, 76, 4],
      [192, 76, 3], [196, 79, 3], [200, 83, 4], [208, 84, 4], [214, 83, 3], [218, 81, 3],
      [224, 79, 4], [230, 76, 4], [236, 74, 4], [242, 71, 4], [248, 67, 4]
    ],
    drumStyle: 'cyber-break'
  },
  {
    id: 'full-count-drama',
    titleKo: '05. 풀카운트 드라마',
    titleEn: 'Full Count Drama',
    genre: '풀카운트 2스트라이크 긴장감 서스펜스',
    bpm: 112,
    bars: 14,
    durationSec: 30.0,
    mood: '서스펜스 · 심장 박동 · 외줄타기 승부',
    desc: '시계 초침처럼 째깍이는 하이햇과 심장 박동 서브 킥, 서서히 고조되는 스트링 패드로 3볼 2스트라이크 절체절명의 순간을 나타냅니다.',
    key: 'B Minor',
    chords: [
      [47, 50, 54], [43, 47, 50], [40, 43, 47], [42, 46, 49],
      [47, 50, 54], [43, 47, 50], [40, 43, 47], [42, 46, 49],
      [47, 50, 54], [43, 47, 50], [40, 43, 47], [42, 46, 49],
      [47, 50, 54], [47, 54, 59]
    ],
    bassNotes: [
      35, 35, 35, 35,  31, 31, 31, 31,  28, 28, 28, 28,  30, 30, 30, 30,
      35, 35, 35, 35,  31, 31, 31, 31,  28, 28, 28, 28,  30, 30, 30, 30,
      35, 38, 35, 38,  31, 35, 31, 35,  28, 31, 28, 31,  30, 34, 30, 34,
      35, 35, 38, 42,  35, 35, 42, 47
    ],
    leadMotif: [
      [0, 59, 3], [6, 62, 3], [12, 66, 4], [20, 69, 4], [26, 66, 3], [30, 62, 4],
      [36, 59, 4], [44, 61, 4], [52, 62, 6],
      [64, 66, 3], [70, 69, 3], [76, 71, 4], [84, 74, 4], [90, 71, 3], [94, 69, 4],
      [100, 67, 4], [108, 66, 4], [116, 64, 6],
      [128, 71, 4], [134, 74, 4], [140, 78, 6], [148, 77, 4], [154, 74, 4],
      [160, 73, 4], [166, 71, 4], [172, 69, 6],
      [180, 66, 4], [186, 69, 4], [192, 71, 4], [198, 74, 4], [204, 78, 6], [214, 71, 6]
    ],
    drumStyle: 'suspense-tick'
  },
  {
    id: 'victory-drive',
    titleKo: '06. 빅토리 드라이브',
    titleEn: 'Victory Drive',
    genre: '80년대 시티팝 펑크 그루브',
    bpm: 120,
    bars: 15,
    durationSec: 30.0,
    mood: '경쾌함 · 승리의 예감 · 세련된 그루브',
    desc: '톡톡 튀는 슬랩 베이스 라인과 상쾌한 시티팝 브라스 리프로 끝내기 역전 홈런을 향해 질주하는 흥겨운 드라이브감입니다.',
    key: 'Eb Major / C Minor',
    chords: [
      [51, 55, 58, 62], [48, 51, 55, 58], [44, 48, 51, 55], [46, 50, 53, 56],
      [51, 55, 58, 62], [48, 51, 55, 58], [44, 48, 51, 55], [46, 50, 53, 56],
      [51, 55, 58, 62], [48, 51, 55, 58], [44, 48, 51, 55], [46, 50, 53, 56],
      [51, 55, 58, 62], [48, 51, 55, 58], [46, 50, 55, 58]
    ],
    bassNotes: [
      39, 51, 39, 51,  36, 48, 36, 48,  32, 44, 32, 44,  34, 46, 34, 46,
      39, 51, 39, 51,  36, 48, 36, 48,  32, 44, 32, 44,  34, 46, 34, 46,
      39, 42, 51, 39,  36, 39, 48, 36,  32, 36, 44, 32,  34, 38, 46, 34,
      39, 51, 39, 51,  36, 48, 36, 48,  34, 46, 48, 50
    ],
    leadMotif: [
      [0, 67, 3], [4, 70, 3], [8, 72, 4], [14, 75, 4], [20, 74, 3], [24, 72, 3], [28, 70, 4],
      [34, 67, 3], [38, 70, 3], [42, 72, 4], [48, 70, 4], [54, 67, 6],
      [64, 72, 3], [68, 75, 3], [72, 77, 4], [78, 82, 4], [84, 80, 3], [88, 79, 3], [92, 77, 4],
      [98, 75, 3], [102, 74, 3], [106, 72, 4], [112, 70, 4], [116, 72, 6],
      [128, 75, 3], [132, 77, 3], [136, 79, 4], [142, 82, 4], [148, 84, 3], [152, 82, 3], [156, 79, 4],
      [162, 77, 3], [166, 75, 3], [170, 74, 4], [176, 72, 4], [182, 70, 6],
      [192, 72, 4], [198, 75, 4], [204, 79, 4], [210, 82, 6], [220, 79, 4], [226, 75, 4], [232, 72, 6]
    ],
    drumStyle: 'disco-funk'
  },
  {
    id: 'island-city-night',
    titleKo: '07. 아일랜드 시티 나이트',
    titleEn: 'Island City Night',
    genre: '다크신스 아웃런 사이버 고속도로',
    bpm: 128,
    bars: 16,
    durationSec: 30.0,
    mood: '스피드 · 질주감 · 네온 야경의 추격',
    desc: '말발굽처럼 질주하는 트리플릿 베이스와 사이버펑크 리드 멜로디로 도심의 불빛 사이를 가로지르는 맹렬한 스피드감을 전달합니다.',
    key: 'F# Minor',
    chords: [
      [42, 45, 49], [38, 42, 45], [35, 38, 42], [37, 40, 44],
      [42, 45, 49], [38, 42, 45], [35, 38, 42], [37, 40, 44],
      [42, 45, 49], [38, 42, 45], [35, 38, 42], [37, 40, 44],
      [42, 45, 49], [38, 42, 45], [35, 38, 42], [42, 49, 54]
    ],
    bassNotes: [
      30, 30, 30, 30,  26, 26, 26, 26,  23, 23, 23, 23,  25, 25, 25, 25,
      30, 30, 30, 30,  26, 26, 26, 26,  23, 23, 23, 23,  25, 25, 25, 25,
      30, 33, 30, 33,  26, 30, 26, 30,  23, 26, 23, 26,  25, 29, 25, 29,
      30, 30, 33, 37,  26, 26, 30, 33,  23, 23, 26, 30,  25, 25, 30, 37
    ],
    leadMotif: [
      [0, 66, 3], [4, 69, 3], [8, 73, 4], [14, 76, 4], [20, 74, 3], [24, 73, 3], [28, 69, 4],
      [34, 66, 4], [40, 64, 4], [46, 66, 6],
      [64, 73, 3], [68, 76, 3], [72, 78, 4], [78, 81, 4], [84, 80, 3], [88, 78, 3], [92, 76, 4],
      [98, 74, 4], [104, 73, 4], [110, 69, 6],
      [128, 78, 3], [132, 81, 3], [136, 85, 4], [142, 86, 4], [148, 85, 3], [152, 81, 3], [156, 78, 4],
      [162, 76, 3], [166, 74, 3], [170, 73, 4], [176, 69, 4], [182, 66, 6],
      [192, 73, 4], [198, 76, 4], [204, 78, 4], [210, 81, 4], [216, 85, 6], [226, 81, 4], [232, 78, 4], [238, 73, 6]
    ],
    drumStyle: 'outrun-drive'
  },
  {
    id: 'rookies-ambition',
    titleKo: '08. 루키의 야망',
    titleEn: "Rookie's Ambition",
    genre: '클래식 8비트/16비트 칩튠 아케이드 록',
    bpm: 128,
    bars: 16,
    durationSec: 30.0,
    mood: '도전적 · 경쾌함 · 레트로 명작 향수',
    desc: '청명한 펄스파 멜로디와 경쾌한 칩 드럼으로 고전 오락실 야구 명작 카트리지를 틀었을 때의 첫 도전 설렘을 재현합니다.',
    key: 'G Major',
    chords: [
      [43, 47, 50], [40, 43, 47], [36, 40, 43], [38, 42, 45],
      [43, 47, 50], [40, 43, 47], [36, 40, 43], [38, 42, 45],
      [43, 47, 50], [40, 43, 47], [36, 40, 43], [38, 42, 45],
      [43, 47, 50], [40, 43, 47], [36, 40, 43], [43, 50, 55]
    ],
    bassNotes: [
      31, 31, 43, 31,  28, 28, 40, 28,  24, 24, 36, 24,  26, 26, 38, 26,
      31, 31, 43, 31,  28, 28, 40, 28,  24, 24, 36, 24,  26, 26, 38, 26,
      31, 35, 43, 31,  28, 31, 40, 28,  24, 28, 36, 24,  26, 30, 38, 26,
      31, 31, 35, 38,  28, 28, 31, 35,  24, 24, 28, 31,  26, 26, 31, 35
    ],
    leadMotif: [
      [0, 67, 3], [4, 71, 3], [8, 74, 4], [14, 76, 3], [18, 74, 3], [22, 71, 4],
      [28, 67, 3], [32, 69, 3], [36, 71, 4], [42, 69, 4], [48, 67, 6],
      [64, 71, 3], [68, 74, 3], [72, 76, 4], [78, 79, 3], [82, 76, 3], [86, 74, 4],
      [92, 76, 3], [96, 79, 3], [100, 83, 4], [106, 81, 4], [112, 79, 6],
      [128, 83, 3], [132, 81, 3], [136, 79, 4], [142, 76, 3], [146, 74, 3], [150, 71, 4],
      [156, 74, 3], [160, 76, 3], [164, 79, 4], [170, 74, 4], [176, 71, 6],
      [192, 67, 3], [196, 71, 3], [200, 74, 4], [206, 79, 4], [212, 83, 4], [218, 86, 6],
      [226, 83, 3], [230, 79, 3], [234, 76, 3], [238, 74, 4], [244, 71, 4]
    ],
    drumStyle: 'chiptune-rock'
  },
  {
    id: 'bottom-of-the-9th',
    titleKo: '09. 9회말 2아웃',
    titleEn: 'Bottom of the 9th',
    genre: '오케스트랄 신스 웅장한 클라이맥스',
    bpm: 120,
    bars: 15,
    durationSec: 30.0,
    mood: '비장함 · 영웅적 환희 · 마지막 승부',
    desc: '팀파니급 묵직한 킥과 마칭 롤, 웅장한 금관 트리오 팡파르로 9회말 마지막 타석의 숙명과 반격 드라마를 연출합니다.',
    key: 'Bb Major / G Minor',
    chords: [
      [38, 43, 46], [34, 38, 43], [36, 41, 45], [34, 38, 41],
      [38, 43, 46], [34, 38, 43], [36, 41, 45], [34, 38, 41],
      [38, 43, 46], [34, 38, 43], [36, 41, 45], [34, 38, 41],
      [38, 43, 46], [34, 38, 43], [38, 45, 50]
    ],
    bassNotes: [
      31, 31, 31, 31,  27, 27, 27, 27,  29, 29, 29, 29,  27, 27, 27, 27,
      31, 31, 31, 31,  27, 27, 27, 27,  29, 29, 29, 29,  27, 27, 27, 27,
      31, 34, 31, 34,  27, 31, 27, 31,  29, 33, 29, 33,  27, 31, 27, 31,
      31, 31, 34, 38,  27, 27, 31, 34,  29, 31, 34, 38
    ],
    leadMotif: [
      [0, 58, 4], [6, 62, 4], [12, 65, 6], [20, 67, 4], [26, 65, 4], [32, 62, 6],
      [40, 60, 4], [46, 62, 4], [52, 65, 8],
      [64, 65, 4], [70, 67, 4], [76, 70, 6], [84, 72, 4], [90, 70, 4], [96, 67, 6],
      [104, 65, 4], [110, 67, 4], [116, 70, 8],
      [128, 70, 4], [134, 74, 4], [140, 77, 6], [148, 79, 4], [154, 77, 4], [160, 74, 6],
      [168, 72, 4], [174, 74, 4], [180, 77, 8],
      [192, 79, 4], [198, 82, 4], [204, 84, 6], [212, 82, 4], [218, 79, 4], [224, 77, 8]
    ],
    drumStyle: 'heroic-march'
  },
  {
    id: 'grand-slam-fever',
    titleKo: '10. 그랜드 슬램 피버',
    titleEn: 'Grand Slam Fever',
    genre: '아케이드 일렉트로 디스코 파티',
    bpm: 128,
    bars: 16,
    durationSec: 30.0,
    mood: '축제 · 만루 홈런 환호 · 흥분의 도가니',
    desc: '옥타브를 넘나드는 디스코 베이스와 싱코페이션 피아노, 스타디움 전체가 들썩이는 만루 홈런 축제 댄스 플로어 사운드입니다.',
    key: 'A Major',
    chords: [
      [45, 49, 52], [42, 45, 49], [38, 42, 45], [40, 44, 47],
      [45, 49, 52], [42, 45, 49], [38, 42, 45], [40, 44, 47],
      [45, 49, 52], [42, 45, 49], [38, 42, 45], [40, 44, 47],
      [45, 49, 52], [42, 45, 49], [38, 42, 45], [45, 52, 57]
    ],
    bassNotes: [
      33, 45, 33, 45,  30, 42, 30, 42,  26, 38, 26, 38,  28, 40, 28, 40,
      33, 45, 33, 45,  30, 42, 30, 42,  26, 38, 26, 38,  28, 40, 28, 40,
      33, 37, 45, 33,  30, 33, 42, 30,  26, 30, 38, 26,  28, 32, 40, 28,
      33, 45, 33, 45,  30, 42, 30, 42,  28, 40, 42, 44
    ],
    leadMotif: [
      [0, 69, 3], [4, 73, 3], [8, 76, 4], [14, 81, 4], [20, 78, 3], [24, 76, 3], [28, 73, 4],
      [34, 69, 3], [38, 73, 3], [42, 76, 4], [48, 74, 4], [54, 71, 6],
      [64, 73, 3], [68, 76, 3], [72, 78, 4], [78, 81, 4], [84, 85, 3], [88, 81, 3], [92, 78, 4],
      [98, 76, 3], [102, 73, 3], [106, 76, 4], [112, 78, 4], [118, 81, 6],
      [128, 81, 3], [132, 85, 3], [136, 88, 4], [142, 85, 3], [146, 81, 3], [150, 78, 4],
      [156, 76, 3], [160, 73, 3], [164, 76, 4], [170, 78, 4], [176, 81, 6],
      [192, 73, 3], [196, 76, 3], [200, 81, 4], [206, 85, 4], [212, 88, 6], [220, 85, 4], [226, 81, 4], [232, 76, 6]
    ],
    drumStyle: 'disco-funk'
  }
];

// Synth Voice Generators

// 1. Kick Drum
function playKick(ctx, outNode, time, velocity = 1.0) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.09);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.38 * velocity, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(outNode);
    osc.start(time);
    osc.stop(time + 0.16);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  } catch {}
}

// 2. Snare Drum
function playSnare(ctx, outNode, time, velocity = 1.0, isRim = false) {
  try {
    // Noise snap
    const dur = isRim ? 0.05 : 0.12;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = isRim ? 'highpass' : 'bandpass';
    filter.frequency.value = isRim ? 2400 : 1600;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22 * velocity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(outNode);
    noise.start(time);
    noise.stop(time + dur + 0.01);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); noiseGain.disconnect(); };

    // Tonal body
    if (!isRim) {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(185, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.06);

      oscGain.gain.setValueAtTime(0.18 * velocity, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

      osc.connect(oscGain);
      oscGain.connect(outNode);
      osc.start(time);
      osc.stop(time + 0.08);
      osc.onended = () => { osc.disconnect(); oscGain.disconnect(); };
    }
  } catch {}
}

// 3. Hi-Hat
function playHiHat(ctx, outNode, time, velocity = 1.0, isOpen = false) {
  try {
    const dur = isOpen ? 0.22 : 0.045;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1);

    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0005, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(outNode);
    noise.start(time);
    noise.stop(time + dur + 0.01);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
  } catch {}
}

// 4. Bass Voice
function playBass(ctx, outNode, time, midiNote, duration = 0.12, type = 'sawtooth', filterCutoff = 1200) {
  try {
    const freq = m2f(midiNote);
    if (!freq) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, filterCutoff * 0.25), time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.24, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outNode);

    osc.start(time);
    osc.stop(time + duration + 0.02);
    osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
  } catch {}
}

// 5. Synth Chord / Pad Voice
function playChord(ctx, outNode, time, midiNotes, duration = 0.45, type = 'sawtooth') {
  try {
    if (!midiNotes || !midiNotes.length) return;
    for (const note of midiNotes) {
      const freq = m2f(note);
      if (!freq) continue;

      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      // Subtle detune for lush thickness
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(outNode);

      osc.start(time);
      osc.stop(time + duration + 0.04);
      osc.onended = () => { osc.disconnect(); filter.disconnect(); gain.disconnect(); };
    }
  } catch {}
}

// 6. Lead Melody Voice (Dual detuned pulse/saw with subtle vibrato)
function playLead(ctx, outNode, time, midiNote, duration = 0.25, type = 'square') {
  try {
    const freq = m2f(midiNote);
    if (!freq) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = type;
    osc2.type = type === 'square' ? 'sawtooth' : 'square';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq, time);
    osc2.detune.setValueAtTime(7, time); // 7 cents warm chorus

    // Vibrato after 0.1s
    if (duration > 0.18) {
      osc1.frequency.setValueAtTime(freq, time + 0.1);
      osc1.frequency.linearRampToValueAtTime(freq * 1.01, time + 0.15);
      osc1.frequency.linearRampToValueAtTime(freq * 0.99, time + 0.22);
      osc1.frequency.linearRampToValueAtTime(freq, time + duration);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.14, time + 0.008);
    gain.gain.setValueAtTime(0.12, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(outNode);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.03);
    osc2.stop(time + duration + 0.03);
    osc1.onended = () => { osc1.disconnect(); osc2.disconnect(); filter.disconnect(); gain.disconnect(); };
  } catch {}
}

// Lookahead Scheduler
function scheduleStep(ctx, track, step, time) {
  const stepsPerBeat = 4;
  const beat = Math.floor(step / stepsPerBeat);
  const beatSub = step % stepsPerBeat;
  const bar = Math.floor(beat / 4);
  const stepDur = (60 / track.bpm) / stepsPerBeat;

  // 1. Drums Scheduling
  switch (track.drumStyle) {
    case 'arcade-dance':
    case 'disco-funk': {
      // 4-on-the-floor kick
      if (beatSub === 0) playKick(ctx, bgmGain, time, 1.0);
      // Snare on 2 and 4
      if ((beat % 4 === 1 || beat % 4 === 3) && beatSub === 0) playSnare(ctx, bgmGain, time, 1.0);
      // HiHat on every 16th, open hat on offbeat
      if (beatSub === 2) playHiHat(ctx, bgmGain, time, 0.9, true);
      else playHiHat(ctx, bgmGain, time, 0.5, false);
      break;
    }
    case 'rush-metal': {
      // Driving double kick patterns
      if (beatSub === 0 || (step % 8 === 2) || (step % 8 === 6)) playKick(ctx, bgmGain, time, 1.0);
      // Heavy snare on 2 and 4
      if ((beat % 4 === 1 || beat % 4 === 3) && beatSub === 0) playSnare(ctx, bgmGain, time, 1.2);
      // Constant 16th hats
      playHiHat(ctx, bgmGain, time, 0.6, beatSub === 2);
      break;
    }
    case 'chill-downtempo': {
      // Halftime kick and soft rimshot
      if ((beat % 4 === 0) && beatSub === 0) playKick(ctx, bgmGain, time, 0.9);
      if ((beat % 4 === 2) && beatSub === 0) playSnare(ctx, bgmGain, time, 0.7, true);
      if (beatSub === 0 || beatSub === 2) playHiHat(ctx, bgmGain, time, 0.4, false);
      break;
    }
    case 'cyber-break': {
      // Syncopated breakbeat
      if ((beat % 4 === 0 && beatSub === 0) || (beat % 4 === 2 && beatSub === 2)) playKick(ctx, bgmGain, time, 1.0);
      if ((beat % 4 === 1 || beat % 4 === 3) && beatSub === 0) playSnare(ctx, bgmGain, time, 1.0);
      playHiHat(ctx, bgmGain, time, 0.5, beatSub === 2);
      break;
    }
    case 'suspense-tick': {
      // Sparse heartbeat kick and clock ticking
      if (beat % 2 === 0 && beatSub === 0) playKick(ctx, bgmGain, time, 0.8);
      // Clock ticking hi-hat
      playHiHat(ctx, bgmGain, time, beatSub === 0 ? 0.7 : 0.35, false);
      if (beat % 4 === 3 && beatSub === 0) playSnare(ctx, bgmGain, time, 0.4, true);
      break;
    }
    case 'heroic-march': {
      // Timpani boom and marching snare roll
      if (beat % 4 === 0 && beatSub === 0) playKick(ctx, bgmGain, time, 1.2);
      if ((beat % 4 === 1 || beat % 4 === 3) && beatSub === 0) playSnare(ctx, bgmGain, time, 1.0);
      if (beatSub === 0 || beatSub === 2 || (beat % 4 === 3 && beatSub === 3)) playSnare(ctx, bgmGain, time, 0.35, true);
      playHiHat(ctx, bgmGain, time, 0.4, false);
      break;
    }
    case 'chiptune-rock':
    default: {
      if (beatSub === 0 && (beat % 2 === 0)) playKick(ctx, bgmGain, time, 0.9);
      if (beatSub === 0 && (beat % 2 === 1)) playSnare(ctx, bgmGain, time, 0.9);
      playHiHat(ctx, bgmGain, time, 0.45, beatSub === 2);
      break;
    }
  }

  // 2. Chords Scheduling (At the start of each bar or beat 1 & 3)
  if (beatSub === 0 && (beat % 2 === 0)) {
    const chordIdx = Math.min(bar, track.chords.length - 1);
    const chordNotes = track.chords[chordIdx];
    const chordDur = stepDur * 7;
    playChord(ctx, bgmGain, time, chordNotes, chordDur, track.id === 'midnight-dugout' ? 'triangle' : 'sawtooth');
  }

  // 3. Bass Scheduling (Every 8th note or 16th note)
  if (beatSub === 0 || beatSub === 2) {
    const bassIdx = (beat * 2 + Math.floor(beatSub / 2)) % track.bassNotes.length;
    const bassNote = track.bassNotes[bassIdx];
    const bassDur = stepDur * 1.8;
    playBass(ctx, bgmGain, time, bassNote, bassDur, track.id === 'midnight-dugout' ? 'sine' : 'sawtooth', track.id === 'red-rush-duel' ? 2200 : 1200);
  }

  // 4. Lead Melody Scheduling
  if (track.leadMotif) {
    const leadEvent = track.leadMotif.find(m => m[0] === step);
    if (leadEvent) {
      const [, note, durSteps] = leadEvent;
      const leadDur = stepDur * (durSteps || 3);
      playLead(ctx, bgmGain, time, note, leadDur, track.id === 'rookies-ambition' ? 'square' : 'sawtooth');
    }
  }
}

// Scheduler Tick
function onSchedulerTick() {
  if (!isPlaying || !activeTrack) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const stepsPerBeat = 4;
  const totalSteps = activeTrack.bars * 4 * stepsPerBeat;
  const stepDur = (60 / activeTrack.bpm) / stepsPerBeat;
  const scheduleAhead = 0.12; // 120ms lookahead

  while (nextStepTime < ctx.currentTime + scheduleAhead) {
    scheduleStep(ctx, activeTrack, currentStep, nextStepTime);
    currentStep = (currentStep + 1) % totalSteps;
    nextStepTime += stepDur;

    // Reset loop start time on loop wrap
    if (currentStep === 0) {
      loopStartTime = nextStepTime;
    }
  }

  // Notify listeners of playback progress
  const elapsed = (ctx.currentTime - loopStartTime) % activeTrack.durationSec;
  const normalizedTime = Math.max(0, elapsed);
  for (const listener of progressListeners) {
    try {
      listener({
        trackIndex: currentTrackIdx,
        track: activeTrack,
        isPlaying: true,
        currentTime: normalizedTime,
        duration: activeTrack.durationSec,
        step: currentStep,
        volume: userVolume
      });
    } catch {}
  }
}

// Ensure BGM Bus Master Gain
function ensureBgmBus() {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (!bgmGain) {
    bgmGain = ctx.createGain();
    bgmGain.gain.setValueAtTime(userVolume, ctx.currentTime);
    const master = getMasterNode();
    if (master) {
      bgmGain.connect(master);
    } else {
      bgmGain.connect(ctx.destination);
    }
  }
  return bgmGain;
}

// Public API

export function getBgmTracks() {
  return BGM_TRACKS;
}

export function getCurrentTrackIndex() {
  return currentTrackIdx;
}

export function isBgmPlaying() {
  return isPlaying;
}

export function getBgmVolume() {
  return userVolume;
}

export function setBgmVolume(val) {
  userVolume = Math.max(0, Math.min(1, val));
  if (bgmGain) {
    const ctx = getAudioContext();
    if (ctx) {
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, ctx.currentTime);
      bgmGain.gain.linearRampToValueAtTime(userVolume, ctx.currentTime + 0.05);
    }
  }
}

export function playBgm(trackIndex = 0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const bus = ensureBgmBus();
    if (!bus) return;

    const clampedIdx = Math.max(0, Math.min(BGM_TRACKS.length - 1, trackIndex));
    currentTrackIdx = clampedIdx;
    activeTrack = BGM_TRACKS[clampedIdx];

    // Persist choice in localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('9zone-bgm-track', String(clampedIdx));
      }
    } catch {}

    // Reset loop clocks
    currentStep = 0;
    loopStartTime = ctx.currentTime + 0.02;
    nextStepTime = loopStartTime;

    // Smooth volume fade in
    bus.gain.setValueAtTime(0.001, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(userVolume, ctx.currentTime + 0.25);

    isPlaying = true;

    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = setInterval(onSchedulerTick, 25);
  } catch (err) {
    // Audio failure must never interrupt gameplay
  }
}

export function stopBgm(immediate = false) {
  try {
    if (!isPlaying) return;
    const ctx = getAudioContext();
    if (bgmGain && ctx && !immediate) {
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, ctx.currentTime);
      bgmGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    }
    setTimeout(() => {
      if (schedulerTimer) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
      }
      isPlaying = false;
      for (const listener of progressListeners) {
        try {
          listener({
            trackIndex: currentTrackIdx,
            track: activeTrack,
            isPlaying: false,
            currentTime: 0,
            duration: activeTrack?.durationSec || 30.0,
            step: 0,
            volume: userVolume
          });
        } catch {}
      }
    }, immediate ? 0 : 200);
  } catch {}
}

export function onBgmProgress(callback) {
  progressListeners.add(callback);
  return () => progressListeners.delete(callback);
}

// Initialize persisted track preference if available
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('9zone-bgm-track');
    if (saved != null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx < BGM_TRACKS.length) {
        currentTrackIdx = idx;
      }
    }
  }
} catch {}
