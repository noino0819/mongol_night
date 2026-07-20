// 주사위 배팅(lv) 순수 로직 단위 테스트 — index.html에서 함수를 추출해 검증
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
function extract(name){
  const m = html.match(new RegExp("function " + name + "\\([^)]*\\)\\{[\\s\\S]*?\\n\\}"));
  if (!m) throw new Error(name + " 추출 실패");
  return m[0];
}
const lvSlotWinner = new Function("return (" + extract("lvSlotWinner") + ")")();
const lvMakeSlots = new Function("return (" + extract("lvMakeSlots") + ")")();

let pass = 0, fail = 0;
function eq(label, got, want){
  if (got === want){ pass++; console.log("  ok  " + label); }
  else { fail++; console.error("  FAIL " + label + " — got " + got + ", want " + want); }
}

console.log("lvSlotWinner (동률 무효 캐스케이드)");
eq("단독 1위가 획득", lvSlotWinner({ 0: 3, 1: 2 }), 0);
eq("1위 동률 → 차순위 획득", lvSlotWinner({ 0: 3, 1: 3, 2: 2 }), 2);
eq("전원 동률 → 소멸(-1)", lvSlotWinner({ 0: 2, 1: 2 }), -1);
eq("캐스케이드 동률 전멸 → 소멸(-1)", lvSlotWinner({ 0: 3, 1: 3, 2: 2, 3: 2 }), -1);
eq("2연속 동률 뚫고 3순위 획득", lvSlotWinner({ 0: 5, 1: 5, 2: 3, 3: 3, 4: 1 }), 4);
eq("아무도 배치 안 함 → -1", lvSlotWinner({}), -1);
eq("1개라도 단독이면 획득", lvSlotWinner({ 2: 1 }), 2);
eq("0개 배치는 무시", lvSlotWinner({ 0: 0, 1: 2 }), 1);

console.log("lvMakeSlots (상금 3~8, 합 14 이상, 슬롯 4개)");
let slotsOk = true;
for (let t = 0; t < 1000; t++){
  const s = lvMakeSlots();
  const sum = s.reduce((a, x) => a + x.prize, 0);
  if (s.length !== 4 || sum < 14 || s.some(x => x.prize < 3 || x.prize > 8 || Object.keys(x.placed).length)){
    slotsOk = false; break;
  }
}
eq("1000회 생성 전부 규칙 준수", slotsOk, true);

console.log(fail ? "❌ " + fail + "개 실패" : "✅ 전부 통과 (" + pass + "케이스)");
process.exit(fail ? 1 : 0);
