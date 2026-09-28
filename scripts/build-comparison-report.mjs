import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG } from './lib/png.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET_DIR = path.join(ROOT, 'docs/art/benchmark/target');
const RUNTIME_DIR = path.join(ROOT, 'work/audit-10');
const OUT_DIR = path.join(ROOT, 'work/audit-fidelity-10');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SCREENS = [
  { id: 'title', target: 'title.png', runtime: 'runtime-title.png', name: '7. 타이틀 화면 (Title Screen)' },
  { id: 'battle-portrait', target: 'battle-portrait.png', runtime: 'runtime-battle-portrait-720.png', name: '1. 세로 전투 (Battle Portrait)' },
  { id: 'battle-landscape', target: 'battle-landscape.png', runtime: 'runtime-battle-landscape-612.png', name: '2. 가로 전투 (Battle Landscape)' },
  { id: 'map', target: 'map.png', runtime: 'runtime-map-611.png', name: '3. 월드 지도 (Map Screen)' },
  { id: 'reward', target: 'reward.png', runtime: 'runtime-reward-612.png', name: '4. 보상 화면 (Reward Screen)' },
  { id: 'deck', target: 'deck.png', runtime: 'runtime-deck-613.png', name: '5. 덱 모달 (Deck Modal)' },
  { id: 'dex', target: 'dex.png', runtime: 'runtime-dex-611.png', name: '6. 도감 모달 (Dex Modal)' },
  { id: 'homerun', target: 'homerun.png', runtime: 'runtime-homerun-613.png', name: '8. 홈런 시네마틱 스플래시 (Homerun Splash)' },
  { id: 'knockout', target: 'knockout.png', runtime: 'runtime-knockout-611.png', name: '9. 강판 시네마틱 스플래시 (Knockout Splash)' },
  { id: 'ending', target: 'ending.png', runtime: 'runtime-ending-612.png', name: '10. 엔딩 화면 (Ending Screen)' },
];

function resize(img, h) {
  const s = img.height / h;
  const w = Math.max(1, Math.round(img.width / s));
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * s);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * s));
      const y0 = Math.floor(y * s);
      const y1 = Math.max(y0 + 1, Math.floor((y + 1) * s));
      const acc = [0, 0, 0, 0];
      let n = 0;
      for (let yy = y0; yy < y1 && yy < img.height; yy++) {
        for (let xx = x0; xx < x1 && xx < img.width; xx++) {
          const o = (yy * img.width + xx) * 4;
          for (let c = 0; c < 4; c++) acc[c] += img.data[o + c];
          n++;
        }
      }
      out.set(acc.map(v => Math.round(v / Math.max(1, n))), (y * w + x) * 4);
    }
  }
  return { width: w, height: h, data: out };
}

function sideBySide(imgA, imgB, gap = 20) {
  const H = Math.max(imgA.height, imgB.height);
  const rA = imgA.height === H ? imgA : resize(imgA, H);
  const rB = imgB.height === H ? imgB : resize(imgB, H);
  const W = rA.width + rB.width + gap * 3;
  const outH = H + gap * 2;
  const out = new Uint8Array(W * outH * 4);

  // Background #0d131a
  for (let i = 0; i < W * outH; i++) {
    out.set([13, 19, 26, 255], i * 4);
  }

  // Draw A
  let x0 = gap;
  for (let y = 0; y < rA.height; y++) {
    out.set(rA.data.subarray(y * rA.width * 4, (y + 1) * rA.width * 4), ((y + gap) * W + x0) * 4);
  }

  // Draw B
  x0 = gap * 2 + rA.width;
  for (let y = 0; y < rB.height; y++) {
    out.set(rB.data.subarray(y * rB.width * 4, (y + 1) * rB.width * 4), ((y + gap) * W + x0) * 4);
  }

  return { width: W, height: outH, data: out };
}

console.log('Generating side-by-side comparisons...');
const reportItems = [];

for (const s of SCREENS) {
  const targetP = path.join(TARGET_DIR, s.target);
  const runtimeP = path.join(RUNTIME_DIR, s.runtime);

  if (!fs.existsSync(targetP) || !fs.existsSync(runtimeP)) {
    console.warn('Missing file for', s.id, { target: fs.existsSync(targetP), runtime: fs.existsSync(runtimeP) });
    continue;
  }

  const tBuf = fs.readFileSync(targetP);
  const rBuf = fs.readFileSync(runtimeP);
  const tImg = decodePNG(tBuf);
  const rImg = decodePNG(rBuf);

  const stitched = sideBySide(tImg, rImg);
  const stitchedFile = `compare-${s.id}.png`;
  fs.writeFileSync(path.join(OUT_DIR, stitchedFile), encodePNG(stitched));

  reportItems.push({
    ...s,
    targetDims: `${tImg.width}x${tImg.height}`,
    runtimeDims: `${rImg.width}x${rImg.height}`,
    targetB64: tBuf.toString('base64'),
    runtimeB64: rBuf.toString('base64'),
    stitchedFile,
  });
  console.log(`Saved ${stitchedFile} (${stitched.width}x${stitched.height})`);
}

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>9ZONE 10대 핵심 화면 1:1 목업 피델리티 정밀 감사</title>
  <style>
    :root {
      --bg: #090d12;
      --card-bg: #121922;
      --border: #233244;
      --gold: #f6d288;
      --accent: #38bdf8;
      --text: #e2e8f0;
      --subtext: #94a3b8;
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
      margin: 0;
      padding: 32px 24px;
    }
    header {
      max-width: 1400px;
      margin: 0 auto 32px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
    }
    h1 {
      color: var(--gold);
      font-size: 26px;
      margin: 0 0 8px;
    }
    .lead {
      color: var(--subtext);
      font-size: 14px;
      line-height: 1.6;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 40px;
    }
    .screen-panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      padding: 24px;
    }
    .screen-panel h2 {
      margin: 0 0 6px;
      font-size: 19px;
      color: var(--gold);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .screen-panel .specs {
      font-size: 12px;
      color: var(--accent);
      margin-bottom: 16px;
    }
    .side-by-side {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #06090d;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #1a2533;
    }
    .shot-box {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .shot-box .label {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--gold);
      letter-spacing: 1px;
    }
    .shot-box .label.rt {
      color: var(--accent);
    }
    .shot-box img {
      max-width: 100%;
      height: auto;
      border: 1px solid #233244;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      background: #000;
    }
    .audit-notes {
      margin-top: 18px;
      background: #0e151e;
      border-left: 3px solid var(--gold);
      padding: 14px 18px;
      border-radius: 0 6px 6px 0;
      font-size: 13px;
      line-height: 1.7;
    }
    .audit-notes strong {
      color: #fff;
    }
    .audit-notes ul {
      margin: 6px 0 0;
      padding-left: 20px;
    }
    .status-tag {
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .status-tag.match {
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
      border: 1px solid #22c55e;
    }
    .status-tag.gap {
      background: rgba(234, 179, 8, 0.2);
      color: #facc15;
      border: 1px solid #eab308;
    }
  </style>
</head>
<body>
  <header>
    <h1>9ZONE HOMEBOUND — 10대 핵심 화면 1:1 목업 피델리티 정밀 감사</h1>
    <div class="lead">
      목표 목업(<code>docs/art/benchmark/target/*.png</code>)과 실제 런타임 렌더링 화면의 픽셀 단위 일치 검수.<br>
      미세 타이포그래피, 패딩, 마진, 요소 간격, 시각적 위계 및 배치 오차 정밀 분석.
    </div>
  </header>
  <div class="container">
    ${reportItems.map(item => `
    <section class="screen-panel" id="panel-${item.id}">
      <h2>
        <span>${item.name}</span>
        <span class="status-tag gap">FIDELITY AUDIT</span>
      </h2>
      <div class="specs">
        목표 목업 규격: <code>${item.target}</code> (${item.targetDims}) | 실제 런타임: <code>${item.runtime}</code> (${item.runtimeDims})
      </div>
      <div class="side-by-side">
        <div class="shot-box">
          <div class="label">★ BENCHMARK TARGET MOCKUP</div>
          <img src="data:image/png;base64,${item.targetB64}" alt="${item.target}">
        </div>
        <div class="shot-box">
          <div class="label rt">● CURRENT IN-GAME RUNTIME</div>
          <img src="data:image/png;base64,${item.runtimeB64}" alt="${item.runtime}">
        </div>
      </div>
    </section>
    `).join('\n')}
  </div>
</body>
</html>`;

const reportHtmlPath = path.join(OUT_DIR, 'index.html');
fs.writeFileSync(reportHtmlPath, html, 'utf8');
console.log('Saved 1:1 fidelity audit report to', reportHtmlPath);
