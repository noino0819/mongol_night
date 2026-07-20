// 우리말 겨루기(um) 단위 테스트 — 문항 뱅크 무결성 + 순위/메달 정산 로직
import fs from "node:fs";

const html = fs.readFileSync(new URL("../games/um.js", import.meta.url), "utf8");
let pass = 0, fail = 0;
function ok(cond, name){
  if (cond){ pass++; console.log("  ✅", name); }
  else { fail++; console.error("  ❌", name); }
}

/* ---------- 1. UM_BANK 추출 & 무결성 ---------- */
const bankSrc = html.match(/const UM_BANK = (\{[\s\S]*?\n\});/);
ok(!!bankSrc, "UM_BANK 추출");
const UM_BANK = new Function("return " + bankSrc[1])();

const types = ["spell", "prov", "mean"];
ok(types.every(t => Array.isArray(UM_BANK[t])), "3개 유형 존재");
const all = types.flatMap(t => UM_BANK[t].map(x => ({ t, q: x[0], a: x[1], w: x[2] })));
console.log(`  · 문항 수: spell=${UM_BANK.spell.length} prov=${UM_BANK.prov.length} mean=${UM_BANK.mean.length} (총 ${all.length})`);
ok(all.length >= 150, "총 150문항 이상");
ok(all.every(x => typeof x.q === "string" && x.q && typeof x.a === "string" && x.a && typeof x.w === "string" && x.w), "모든 문항 q/a/w 비어있지 않음");
ok(all.every(x => x.a !== x.w), "정답≠오답");
ok(UM_BANK.spell.every(x => x[0].includes("___")) && UM_BANK.prov.every(x => x[0].includes("___")), "맞춤법·속담은 빈칸(___) 포함");
const seen = new Set();
const dup = all.filter(x => { const k = x.q + "|" + x.a; if (seen.has(k)) return true; seen.add(k); return false; });
ok(dup.length === 0, "중복 문항 없음" + (dup.length ? " → " + dup.map(d => d.q).join(", ") : ""));

/* ---------- 2. umEnd 순위/메달 로직 (소스에서 추출해 실행) ---------- */
const endSrc = html.match(/function umEnd\(\)\{[\s\S]*?\n\}/);
ok(!!endSrc, "umEnd 추출");
function runEnd(scores){
  let captured = "";
  const sandbox = {
    um: { phase: "", p: scores.map((s, i) => ({ name: "P" + i, score: s })) },
    umShow: () => {},
    escHtml: (s) => s,
    $: () => ({ set innerHTML(v){ captured = v; } }),
  };
  new Function(...Object.keys(sandbox), endSrc[0] + "; umEnd();")(...Object.values(sandbox));
  return [...captured.matchAll(/(🥇|🥈|🥉|·) (P\d+) — (\d+)점/g)].map(m => m[1] + m[3]);
}
// 케이스 1: 단순 순위
ok(JSON.stringify(runEnd([4, 3, 2])) === JSON.stringify(["🥇4", "🥈3", "🥉2"]), "정산: 4/3/2 → 금·은·동");
// 케이스 2: 2위 동점 → 메달 공유, 4위는 메달 없음
ok(JSON.stringify(runEnd([5, 3, 3, 1])) === JSON.stringify(["🥇5", "🥈3", "🥈3", "·1"]), "정산: 5/3/3/1 → 은메달 공유");
// 케이스 3: 전원 동점 → 전원 금메달
ok(JSON.stringify(runEnd([2, 2, 2])) === JSON.stringify(["🥇2", "🥇2", "🥇2"]), "정산: 2/2/2 → 전원 금메달");
// 케이스 4: 입력 순서와 무관하게 점수 내림차순
ok(JSON.stringify(runEnd([1, 7, 4])) === JSON.stringify(["🥇7", "🥈4", "🥉1"]), "정산: 정렬 확인");

console.log(fail === 0 ? `\n전부 통과! (${pass}개)` : `\n실패 ${fail}개`);
process.exit(fail === 0 ? 0 : 1);
