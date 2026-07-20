// 버저 퀴즈쇼(bz) 순수 로직 단위 테스트 — index.html에서 추출해 검증
import fs from "node:fs";

const html = fs.readFileSync(new URL("../games/bz.js", import.meta.url), "utf8");
function extract(name){
  const start = html.search(new RegExp("function " + name + "\\([^)]*\\)\\{"));
  if (start < 0) throw new Error(name + " 추출 실패");
  let depth = 0, i = html.indexOf("{", start);
  for (; i < html.length; i++){
    if (html[i] === "{") depth++;
    else if (html[i] === "}" && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(name + " 중괄호 불균형");
}
const bzPickWinner = new Function("return (" + extract("bzPickWinner") + ")")();
const bzPickType = new Function("return (" + extract("bzPickType") + ")")();
const bzMakeCalc = new Function("return (" + extract("bzMakeCalc") + ")")();
const oxSrc = html.match(/const BZ_OX = \[[\s\S]*?\n\];/);
const BZ_OX = new Function(oxSrc[0] + " return BZ_OX;")();

let pass = 0, fail = 0;
function ok(label, cond){
  if (cond){ pass++; console.log("  ok  " + label); }
  else { fail++; console.error("  FAIL " + label); }
}

console.log("bzPickWinner (동시 탭 → 타임스탬프 빠른 쪽 1개만)");
ok("이벤트 순서 무관, ts 빠른 쪽 승리", bzPickWinner([{ i: 1, ts: 100.2 }, { i: 0, ts: 100.1 }], []) === 0);
ok("단독 탭은 그대로 승자", bzPickWinner([{ i: 2, ts: 50 }], []) === 2);
ok("잠긴(오답) 사람 탭은 무시", bzPickWinner([{ i: 0, ts: 1 }, { i: 1, ts: 2 }], [0]) === 1);
ok("전원 잠금이면 -1", bzPickWinner([{ i: 0, ts: 1 }], [0]) === -1);
ok("탭 없으면 -1", bzPickWinner([], []) === -1);

console.log("bzMakeCalc (a,b 2~30 / ×는 한 자리 / 답 정확 / 음수 없음)");
let calcOk = true, sawOps = new Set();
for (let t = 0; t < 2000; t++){
  const c = bzMakeCalc();
  const m = c.q.match(/^(\d+) ([+−×]) (\d+) = \?$/);
  if (!m){ calcOk = false; break; }
  const a = +m[1], op = m[2], b = +m[3];
  sawOps.add(op);
  const want = op === "+" ? a + b : op === "−" ? a - b : a * b;
  if (c.a !== want || c.a < 0){ calcOk = false; break; }
  if (op === "×"){ if (a < 2 || a > 9 || b < 2 || b > 9){ calcOk = false; break; } }
  else if (a < 2 || a > 30 || b < 2 || b > 30){ calcOk = false; break; }
}
ok("2000회 생성 전부 규칙 준수", calcOk);
ok("+ − × 세 연산 모두 출제됨", sawOps.size === 3);

console.log("bzPickType (복수 선택 랜덤 믹스)");
let mixOk = true;
const seen = new Set();
for (let t = 0; t < 600; t++){
  const p = bzPickType(["ox", "calc"]);
  if (p !== "ox" && p !== "calc"){ mixOk = false; break; }
  seen.add(p);
}
ok("선택한 유형만 출제", mixOk);
ok("선택한 유형이 모두 등장", seen.size === 2);
ok("단일 선택이면 그 유형만", bzPickType(["cho"]) === "cho");

console.log("BZ_OX 뱅크 (" + BZ_OX.length + "문항)");
ok("90문항 이상", BZ_OX.length >= 90);
ok("전 문항 {q:문자열, a:불리언, d:1|2|3}", BZ_OX.every(x => typeof x.q === "string" && x.q.length > 0 && typeof x.a === "boolean" && [1, 2, 3].includes(x.d)));
ok("난이도별 최소 25문항", [1, 2, 3].every(d => BZ_OX.filter(x => x.d === d).length >= 25));
ok("O/X 분포 각 40% 이상", BZ_OX.filter(x => x.a).length >= BZ_OX.length * 0.4 && BZ_OX.filter(x => !x.a).length >= BZ_OX.length * 0.4);
ok("문항 중복 없음", new Set(BZ_OX.map(x => x.q.replace(/[\s·,.!?~'"()]/g, ""))).size === BZ_OX.length);

console.log("bzPickDiff (난이도 램프)");
const bzPickDiff = new Function("return (" + extract("bzPickDiff") + ")")();
function dist(p, n){
  const c = { 1: 0, 2: 0, 3: 0 };
  for (let t = 0; t < n; t++) c[bzPickDiff(p)]++;
  return c;
}
const early = dist(0, 2000), mid = dist(0.5, 2000), late = dist(0.9, 2000);
ok("초반(진행 0)엔 어려움 안 나옴", early[3] === 0 && early[1] > 0 && early[2] > 0);
ok("중반(0.5)엔 세 난이도 모두 등장", mid[1] > 0 && mid[2] > 0 && mid[3] > 0);
ok("후반(0.9)엔 어려움이 최다", late[3] > late[2] && late[2] > late[1]);

console.log(fail ? "❌ " + fail + "개 실패" : "✅ 전부 통과 (" + pass + "케이스)");
process.exit(fail ? 1 : 0);
