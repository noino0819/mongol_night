/* 스프라이트 린트 — index.html의 SPR 전 항목 검사 (도트 가이드 3장).
   실행: node tools/sprite-lint.mjs
   에러: 16행 아님 / 행이 16자 아님 / 유효문자(0-7,.) 외 사용 / SYM 등록 스프라이트의 실루엣 비대칭
   경고: 고아 픽셀(상하좌우 이웃 없는 단독 색픽셀) — 의도적 텍스처면 무시 가능 */
import fs from "fs";

/* 대칭 검사 대상 (도트 가이드 2-12) — 개념이 대칭인 오브젝트는 신규 제작 시 여기 등록.
   실루엣(채움/투명)만 본다 — 광원 셰이딩(색)은 비대칭이어도 됨.
   H=좌우 미러 · V=상하 미러 · R=90° 회전 불변(기어·주사위 같은 방사형 — 상하와 좌우
   돌출부 모양이 다르면 눌려 보이는 걸 잡는다. v2.6.1 기어 사고의 재발 방지) */
const SYM = {
  gear: "HVR", boom: "HVR", heart: "H", bell: "H", airag: "H", trash: "H",
  die1: "HVR", die2: "HVR", die3: "HVR", die4: "HVR", die5: "HVR", die6: "HVR",
};

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
  /* 대칭 검사 — SYM 등록 스프라이트만, 실루엣 기준 */
  const spec = SYM[name];
  if (spec){
    const sil = rows.map((r) => r.replace(/[^.]/g, "#"));
    const rev = (s) => [...s].reverse().join("");
    const rot = sil.map((_, y) => sil.map((__, x) => sil[15 - x][y]).join("")); /* 90° 회전 */
    if (spec.includes("H") && !sil.every((r) => r === rev(r))){ console.error(`✗ ${name}: 실루엣 좌우 비대칭 (SYM=H)`); errs++; }
    if (spec.includes("V") && !sil.every((r, y) => r === sil[15 - y])){ console.error(`✗ ${name}: 실루엣 상하 비대칭 (SYM=V)`); errs++; }
    if (spec.includes("R") && !sil.every((r, y) => r === rot[y])){ console.error(`✗ ${name}: 90° 회전 비대칭 — 상하·좌우 돌출부 모양을 통일해야 안 눌려 보임 (SYM=R)`); errs++; }
  }
}
console.log(`sprite-lint: ${Object.keys(SPR).length}개 검사 — 에러 ${errs} · 경고 ${warns}`);
process.exit(errs ? 1 : 0);
