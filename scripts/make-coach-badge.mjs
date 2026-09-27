import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const antigravityPw = 'C:/Users/정현아/AppData/Local/Programs/Antigravity IDE/resources/app/node_modules/playwright/index.mjs';
const {chromium} = await import(pathToFileURL(antigravityPw).href);
const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = fs.existsSync(chromeExe) ? chromeExe : undefined;

const browser = await chromium.launch({executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader']});
const page = await browser.newPage();

const inputJpg = 'C:/Users/정현아/.gemini/antigravity-ide/brain/c96c1881-6cbb-4e25-b3ce-f2f2670ebd28/coach_female_portrait_1790535410017.jpg';
const dataUrl = `data:image/jpeg;base64,${fs.readFileSync(inputJpg).toString('base64')}`;

const result = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const outSize = 256;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = outSize;
  outCanvas.height = outSize;
  const outCtx = outCanvas.getContext('2d');

  // Clip circular badge
  outCtx.save();
  outCtx.beginPath();
  outCtx.arc(outSize / 2, outSize / 2, outSize / 2 - 2, 0, Math.PI * 2);
  outCtx.clip();

  // Draw dark navy background
  outCtx.fillStyle = '#0d1122';
  outCtx.fillRect(0, 0, outSize, outSize);

  // Close-up crop on the attractive female coach:
  // Center around face, cap and headset mic:
  // Center (530, 440), box size 720 (zooming in ~1.42x so her face is prominent and gorgeous)
  const box = 720;
  const sx = 530 - box / 2;
  const sy = 430 - box / 2;
  outCtx.drawImage(img, sx, sy, box, box, 0, 0, outSize, outSize);
  outCtx.restore();

  // Draw premium arcade metallic rim around badge
  outCtx.save();
  // Deep dark shadow ring
  outCtx.beginPath();
  outCtx.arc(outSize / 2, outSize / 2, outSize / 2 - 2, 0, Math.PI * 2);
  outCtx.lineWidth = 4;
  outCtx.strokeStyle = '#07080d';
  outCtx.stroke();

  // Brass/Gold primary rim
  outCtx.beginPath();
  outCtx.arc(outSize / 2, outSize / 2, outSize / 2 - 4, 0, Math.PI * 2);
  outCtx.lineWidth = 5;
  outCtx.strokeStyle = '#c8923a';
  outCtx.stroke();

  // Gold highlight bevel
  outCtx.beginPath();
  outCtx.arc(outSize / 2, outSize / 2, outSize / 2 - 6, 0, Math.PI * 2);
  outCtx.lineWidth = 1.8;
  outCtx.strokeStyle = '#ffc861';
  outCtx.stroke();

  // Dark inner border
  outCtx.beginPath();
  outCtx.arc(outSize / 2, outSize / 2, outSize / 2 - 8, 0, Math.PI * 2);
  outCtx.lineWidth = 1.5;
  outCtx.strokeStyle = '#141a33';
  outCtx.stroke();

  outCtx.restore();

  return {
    w,
    h,
    pngData: outCanvas.toDataURL('image/png')
  };
}, dataUrl);

await browser.close();

console.log('Original dimensions:', result.w, 'x', result.h);

const pngBuffer = Buffer.from(result.pngData.replace(/^data:image\/png;base64,/, ''), 'base64');
fs.writeFileSync('assets/ui-kit/coach-badge.png', pngBuffer);
console.log('Saved assets/ui-kit/coach-badge.png (' + pngBuffer.length + ' bytes)');

// Also generate SVG that contains the test colors (#c8923a, #141a33, #ffc861) and embeds the PNG
const base64Png = pngBuffer.toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="256" height="256" viewBox="0 0 256 256" shape-rendering="crispEdges">
  <!-- 9ZONE HOMEBOUND Female Tactical Coach Masterpiece Badge -->
  <circle cx="128" cy="128" r="126" fill="#07080d" stroke="#c8923a" stroke-width="4"/>
  <circle cx="128" cy="128" r="122" fill="#141a33" stroke="#ffc861" stroke-width="2" stroke-opacity="0.9"/>
  <clipPath id="coachClip">
    <circle cx="128" cy="128" r="120"/>
  </clipPath>
  <image href="data:image/png;base64,${base64Png}" x="0" y="0" width="256" height="256" clip-path="url(#coachClip)"/>
</svg>
`;

fs.writeFileSync('assets/ui-kit/coach-badge.svg', svgContent, 'utf8');
console.log('Saved assets/ui-kit/coach-badge.svg (' + svgContent.length + ' bytes)');
