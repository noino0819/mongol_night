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

/* 소스: index.html 공용 SPR + 각 games/*.js의 SPR_BEGIN/END 등록 블록 (병렬 세션 충돌 방지 구조) */
import path from "path";
const root = new URL("..", import.meta.url);
const html = fs.readFileSync(new URL("index.html", root), "utf8");
const m = html.match(/const SPR=\{([\s\S]*?)\n\};/);
if (!m){ console.error("SPR 블록을 못 찾음"); process.exit(1); }
const sources = { "index.html": new Function("return {" + m[1] + "\n}")() };
for (const f of fs.readdirSync(new URL("games", root)).filter((f) => f.endsWith(".js"))){
  const src = fs.readFileSync(new URL("games/" + f, root), "utf8");
  const blocks = [...src.matchAll(/\/\*SPR_BEGIN\*\/([\s\S]*?)\/\*SPR_END\*\//g)];
  if (!blocks.length) continue;
  const merged = {};
  for (const b of blocks){
    const obj = b[1].match(/snAddSprites\(\{([\s\S]*?)\}\);/);
    if (!obj){ console.error(`✗ games/${f}: SPR 블록에 snAddSprites({...}); 형식이 아님`); process.exit(1); }
    Object.assign(merged, new Function("return {" + obj[1] + "}")());
  }
  sources["games/" + f] = merged;
}
/* 파일 간 중복 이름 = 한쪽이 덮어씀 → 에러 */
const owner = {};
let dup = 0;
for (const [src, map] of Object.entries(sources)) for (const name of Object.keys(map)){
  if (owner[name]){ console.error(`✗ 중복 스프라이트 "${name}": ${owner[name]} ↔ ${src}`); dup++; }
  owner[name] = src;
}
const SPR = Object.assign({}, ...Object.values(sources));

let errs = dup, warns = 0;
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
console.log(`sprite-lint: ${Object.keys(SPR).length}개 검사 (${Object.entries(sources).map(([k,v])=>k+" "+Object.keys(v).length).join(" · ")}) — 에러 ${errs} · 경고 ${warns}`);
process.exit(errs ? 1 : 0);
