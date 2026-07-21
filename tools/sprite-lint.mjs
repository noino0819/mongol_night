/* 스프라이트 린트 — index.html의 SPR 전 항목 검사 (도트 가이드 3장).
   실행: node tools/sprite-lint.mjs
   에러: 16행 아님 / 행이 16자 아님 / 유효문자(0-7,.) 외 사용
   경고: 고아 픽셀(상하좌우 이웃 없는 단독 색픽셀) — 의도적 텍스처면 무시 가능 */
import fs from "fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const m = html.match(/const SPR=\{([\s\S]*?)\n\};/);
if (!m){ console.error("SPR 블록을 못 찾음"); process.exit(1); }
const SPR = new Function("return {" + m[1] + "\n}")();

let errs = 0, warns = 0;
for (const [name, rows] of Object.entries(SPR)){
  if (rows.length !== 16){ console.error(`✗ ${name}: ${rows.length}행 (16이어야)`); errs++; continue; }
  rows.forEach((r, y) => {
    if (r.length !== 16){ console.error(`✗ ${name} ${y}행: ${r.length}자 (16이어야)`); errs++; }
    if (/[^0-7.]/.test(r)){ console.error(`✗ ${name} ${y}행: 유효문자(0-7,.) 외 사용 → "${r}"`); errs++; }
  });
  /* 고아 픽셀: 4방 이웃이 전부 투명인 색픽셀 */
  const at = (x, y) => (y >= 0 && y < 16 && x >= 0 && x < 16) ? rows[y][x] : ".";
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++){
    if (at(x, y) === ".") continue;
    if (at(x-1,y) === "." && at(x+1,y) === "." && at(x,y-1) === "." && at(x,y+1) === "."){
      console.warn(`⚠ ${name}: 고아 픽셀 (${x},${y})='${at(x,y)}'`); warns++;
    }
  }
}
console.log(`sprite-lint: ${Object.keys(SPR).length}개 검사 — 에러 ${errs} · 경고 ${warns}`);
process.exit(errs ? 1 : 0);
