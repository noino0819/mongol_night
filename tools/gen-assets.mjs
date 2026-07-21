// 초원의 밤 — 브랜드 에셋 생성기 (아이콘 + OG)
// 원본: assets/sprites.js (디자인 프로젝트에서 임포트한 단일 소스)
// 사용: node tools/gen-assets.mjs   (OG 렌더에 Chrome 필요)
import { deflateSync } from "node:zlib";
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

/* ---------- sprites.js에서 SPR/PAL 추출 ---------- */
const spritesSrc = readFileSync("assets/sprites.js", "utf8");
const PAL = new Function("return " + spritesSrc.match(/const PAL=(\[[^\]]*\]);/)[1])();
const SPR = new Function("return " + spritesSrc.match(/const SPR=({[\s\S]*?});\n/)[1])();
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const NIGHT = hex("#0E1526");
const PALRGB = PAL.map(hex);

/* ---------- 최소 PNG 인코더 ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- 아이콘 렌더 (bor = 앱 아이콘, 스케일업기획서 2-6) ---------- */
const STARS = [[1, 1], [14, 2], [2, 7], [15, 10], [3, 14], [12, 15]];
function renderIcon(size, scale, spriteKey = "bor", { stars = true } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const put = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  };
  const rect = (x, y, w, h, c) => {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) put(x + dx, y + dy, c);
  };
  rect(0, 0, size, size, NIGHT);
  if (stars && size >= 48) {
    const s = Math.max(1, Math.round(scale / 5));
    for (const [gx, gy] of STARS) rect(Math.round((gx / 16) * size), Math.round((gy / 16) * size), s, s, PALRGB[6]);
  }
  /* 광학적 중앙 배치: 색 0(#1A1423)은 밤 배경에 묻혀 안 보이므로 바운딩박스에서 제외
     (bor 다리가 색 0 — 포함하면 흰 몸통이 위로 쏠려 보임). 그리기는 전체 픽셀 유지 */
  const rows = SPR[spriteKey];
  let minR = 16, maxR = -1, minC = 16, maxC = -1;
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === "." || ch === "0") return;
    minR = Math.min(minR, y); maxR = Math.max(maxR, y);
    minC = Math.min(minC, x); maxC = Math.max(maxC, x);
  }));
  const cw = maxC - minC + 1, chg = maxR - minR + 1;
  const ox = Math.round((size - cw * scale) / 2) - minC * scale;
  const oy = Math.round((size - chg * scale) / 2) - minR * scale;
  rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
    if (ch === ".") return;
    rect(ox + rx * scale, oy + ry * scale, scale, scale, PALRGB[+ch]);
  }));
  return encodePNG(size, size, px);
}

mkdirSync("icons", { recursive: true });
writeFileSync("icons/icon-192.png", renderIcon(192, 12));
writeFileSync("icons/icon-512.png", renderIcon(512, 32));
writeFileSync("icons/maskable-512.png", renderIcon(512, 25)); // 심볼 지름 80% 안전존
writeFileSync("icons/apple-touch-icon.png", renderIcon(180, 11));
writeFileSync("icons/favicon-48.png", renderIcon(48, 3));
writeFileSync("icons/favicon-32.png", renderIcon(32, 2));
writeFileSync("icons/favicon-16.png", renderIcon(16, 1, "bor", { stars: false }));
console.log("icons OK: 192/512/maskable/apple-touch/favicon 48·32·16");

/* ---------- OG 1200×630 (브랜드 에셋.dc.html 스펙 재현) ---------- */
// 시드 97 LCG — 브랜드 문서와 동일한 별 배치
let seed = 97;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
let starsHtml = "";
for (let i = 0; i < 46; i++) {
  const sz = rnd() < 0.3 ? 8 : 4;
  starsHtml += `<div style="position:absolute;left:${(rnd() * 97).toFixed(1)}%;top:${(rnd() * 94).toFixed(1)}%;width:${sz}px;height:${sz}px;background:#F4EEE0;opacity:${(0.35 + rnd() * 0.5).toFixed(2)}"></div>`;
}
const fontB64 = readFileSync("assets/fonts/Galmuri11-sub.woff2").toString("base64");
const ogHtml = `<!doctype html><meta charset="utf-8">
<style>
@font-face{font-family:'Galmuri11';src:url(data:font/woff2;base64,${fontB64}) format('woff2')}
body{margin:0;font-family:'Galmuri11',monospace;color:#F4EEE0}
canvas{image-rendering:pixelated;display:block}
</style>
<div id="og" style="position:relative;width:1200px;height:630px;background:#0E1526;overflow:hidden">
${starsHtml}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding-bottom:120px">
  <div style="display:flex;align-items:center;gap:36px">
    <px-sprite name="bormoon" scale="13"></px-sprite>
    <div style="display:flex;flex-direction:column;gap:18px">
      <div style="font-size:104px;letter-spacing:10px;white-space:nowrap;text-shadow:0 8px 0 #1A1423">초원의 밤</div>
      <div style="font-size:32px;color:#B9C1D6;letter-spacing:2px">인터넷 없는 밤, 게임은 여기 다 있어</div>
    </div>
  </div>
  <div style="background:#E8C170;color:#1A1423;font-size:28px;padding:14px 26px;box-shadow:0 6px 0 #1A1423;letter-spacing:2px">오프라인 파티게임 20종 · 비행기 모드 OK</div>
</div>
<div style="position:absolute;left:0;right:0;bottom:34px;display:flex;justify-content:center;align-items:flex-end;gap:56px">
  <px-sprite name="fox" scale="6"></px-sprite>
  <px-sprite name="bor" scale="6"></px-sprite>
  <px-sprite name="wolf" scale="6"></px-sprite>
  <px-sprite name="tengri" scale="6"></px-sprite>
</div>
</div>
<script>${spritesSrc}</script>`;

const CHROMES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
];
const chrome = CHROMES.find(existsSync);
if (!chrome) {
  console.log("OG SKIP: Chrome 없음 — tools/_og.html을 수동으로 1200x630 캡처하세요");
  writeFileSync("tools/_og.html", ogHtml);
} else {
  writeFileSync("tools/_og.html", ogHtml);
  mkdirSync("og", { recursive: true });
  execFileSync(chrome, [
    "--headless", "--disable-gpu", "--force-device-scale-factor=1",
    "--window-size=1200,630", "--hide-scrollbars", "--virtual-time-budget=3000",
    `--screenshot=${process.cwd()}/og/og-1200x630.png`,
    `file:///${process.cwd().replace(/\\/g, "/")}/tools/_og.html`,
  ], { stdio: "pipe" });
  rmSync("tools/_og.html");
  console.log("og OK: og/og-1200x630.png");
}
