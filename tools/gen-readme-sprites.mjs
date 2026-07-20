// 초원의 밤 — README용 스프라이트 도감 이미지 생성기
// 원본: assets/sprites.js (단일 소스) → docs/img/sprites-all.png
// 사용: node tools/gen-readme-sprites.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const spritesSrc = readFileSync("assets/sprites.js", "utf8");
const PAL = new Function("return " + spritesSrc.match(/const PAL=(\[[^\]]*\]);/)[1])();
const SPR = new Function("return " + spritesSrc.match(/const SPR=({[\s\S]*?});\n/)[1])();
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const NIGHT = hex("#0E1526");
const STAR = hex("#F4EEE0");
const PALRGB = PAL.map(hex);

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

/* 7×4 그리드, 셀 = 16px 스프라이트 ×6 스케일 + 여백 */
const KEYS = Object.keys(SPR);
const SCALE = 6, CELL = 16 * SCALE + 24, COLS = 7;
const ROWS = Math.ceil(KEYS.length / COLS);
const W = COLS * CELL + 24, H = ROWS * CELL + 24;
const px = Buffer.alloc(W * H * 4);
const put = (x, y, [r, g, b]) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
};
const rect = (x, y, w, h, c) => {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) put(x + dx, y + dy, c);
};
rect(0, 0, W, H, NIGHT);

// 시드 LCG 별 — gen-assets.mjs OG와 같은 감성
let seed = 97;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
for (let i = 0; i < Math.round((W * H) / 6000); i++) {
  const sz = rnd() < 0.3 ? 3 : 2;
  rect(Math.floor(rnd() * W), Math.floor(rnd() * H), sz, sz, STAR);
}

KEYS.forEach((key, i) => {
  const cx = 24 + (i % COLS) * CELL;
  const cy = 24 + Math.floor(i / COLS) * CELL;
  SPR[key].forEach((row, ry) => [...row].forEach((ch, rx) => {
    if (ch === ".") return;
    rect(cx + rx * SCALE, cy + ry * SCALE, SCALE, SCALE, PALRGB[+ch]);
  }));
});

mkdirSync("docs/img", { recursive: true });
writeFileSync("docs/img/sprites-all.png", encodePNG(W, H, px));
console.log(`sprites-all OK: ${KEYS.length}종 → docs/img/sprites-all.png (${W}x${H})`);
