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
const base = fs.readFileSync(new URL("assets/sprites.js", root), "utf8");
const m = base.match(/const SPR=\{([\s\S]*?)\n\};/);
if (!m){ console.error("SPR 블록을 못 찾음"); process.exit(1); }
const sources = { "assets/sprites.js": new Function("return {" + m[1] + "\n}")() };
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

/* 허용 해상도 티어(도트 가이드): 16×16 기본 · 32×32 클로즈업 쇼피스. 정사각만. 64+는 툴 파이프라인 도입 시 열 것 */
const SIZES = new Set([16, 32]);
let errs = dup, warns = 0;
for (const [name, rows] of Object.entries(SPR)){
  const N = rows.length;
  if (!SIZES.has(N)){ console.error(`✗ ${name}: ${N}행 (허용 크기 16 또는 32)`); errs++; continue; }
  rows.forEach((r, y) => {
    if (r.length !== N){ console.error(`✗ ${name} ${y}행: ${r.length}자 (정사각 ${N}이어야)`); errs++; }
    if (/[^0-7.]/.test(r)){ console.error(`✗ ${name} ${y}행: 유효문자(0-7,.) 외 사용 → "${r}"`); errs++; }
  });
  /* 고아 픽셀: 4방 이웃이 전부 투명인 색픽셀 */
  const at = (x, y) => (y >= 0 && y < N && x >= 0 && x < N) ? rows[y][x] : ".";
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
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
    const rot = sil.map((_, y) => sil.map((__, x) => sil[N - 1 - x][y]).join("")); /* 90° 회전 */
    if (spec.includes("H") && !sil.every((r) => r === rev(r))){ console.error(`✗ ${name}: 실루엣 좌우 비대칭 (SYM=H)`); errs++; }
    if (spec.includes("V") && !sil.every((r, y) => r === sil[N - 1 - y])){ console.error(`✗ ${name}: 실루엣 상하 비대칭 (SYM=V)`); errs++; }
    if (spec.includes("R") && !sil.every((r, y) => r === rot[y])){ console.error(`✗ ${name}: 90° 회전 비대칭 — 상하·좌우 돌출부 모양을 통일해야 안 눌려 보임 (SYM=R)`); errs++; }
  }
}
console.log(`sprite-lint: ${Object.keys(SPR).length}개 검사 (${Object.entries(sources).map(([k,v])=>k+" "+Object.keys(v).length).join(" · ")}) — 에러 ${errs} · 경고 ${warns}`);
process.exit(errs ? 1 : 0);
