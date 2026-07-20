// 초원의 밤 — PWA 아이콘 생성기 (의존성 0, node tools/gen-icons.mjs)
// 16×16 스프라이트 원본 하나에서 모든 사이즈를 정수배 nearest-neighbor로 생성한다.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

// 도트 팔레트 (스케일업기획서 2-2)
const PAL = {
  0: [0x1a, 0x14, 0x23], // --px-black
  1: [0x2a, 0x24, 0x40], // --px-navy
  2: [0xe8, 0xc1, 0x70], // --px-sand
  3: [0x5f, 0xa0, 0x52], // --px-grass
  4: [0x6f, 0xb8, 0xd6], // --px-sky
  5: [0xd9, 0x57, 0x63], // --px-red
  6: [0xf4, 0xee, 0xe0], // --px-white
  7: [0x8a, 0x60, 0x44], // --px-brown
};
const NIGHT = [0x0e, 0x15, 0x26]; // --night 배경

// 메인 마스코트 '보르' (염소) 16×16 — index.html SPR.bor 와 동일해야 함
const BOR = [
  "................",
  "..7..........7..",
  "..77........77..",
  "...77......77...",
  ".2..22222222..2.",
  ".22222222222222.",
  ".22222222222222.",
  ".22200222200222.",
  ".22222222222222.",
  ".22226666662222.",
  ".22226066062222.",
  ".22226600662222.",
  "..222266662222..",
  "....22666622....",
  "......6666......",
  ".......66.......",
];

// 아이콘 배경 별 (16×16 그리드 좌표, 스프라이트 바깥 여백에 배치)
const STARS = [[1, 0], [14, 1], [0, 6], [15, 9], [2, 14], [13, 15]];

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
function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
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
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- 렌더 ---------- */
// size 캔버스에 배경 채우고, 스프라이트를 scale 배율로 (ox,oy)에 그림
function render(size, scale, ox, oy, { stars = true } = {}) {
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
  if (stars) {
    const s = Math.max(1, Math.round(scale / 6));
    for (const [gx, gy] of STARS) {
      rect(Math.round((gx / 16) * size), Math.round((gy / 16) * size), s, s, PAL[6]);
    }
  }
  BOR.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch === ".") return;
      rect(ox + rx * scale, oy + ry * scale, scale, scale, PAL[+ch]);
    });
  });
  return encodePNG(size, size, px);
}

function centered(size, scale) {
  const off = Math.floor((size - 16 * scale) / 2);
  return render(size, scale, off, off);
}

/* ---------- ICO (PNG 임베드) ---------- */
function encodeICO(pngs /* [{size, buf}] */) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type icon
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
}

mkdirSync("icons", { recursive: true });
writeFileSync("icons/icon-192.png", centered(192, 12));
writeFileSync("icons/icon-512.png", centered(512, 32));
// maskable: 심볼을 지름 80% 안전존(410px) 안에 → scale 25 = 400px
writeFileSync("icons/maskable-512.png", centered(512, 25));
// iOS: 라운딩은 OS 몫, 176px 심볼 + 2px 여백
writeFileSync("icons/apple-touch-icon.png", centered(180, 11));
writeFileSync(
  "icons/favicon.ico",
  encodeICO([16, 32, 48].map((s) => ({ size: s, buf: centered(s, s / 16) })))
);
console.log("icons OK: 192/512/maskable/apple-touch/favicon");
