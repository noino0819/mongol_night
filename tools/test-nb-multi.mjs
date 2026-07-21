/* 숫자야구(nb) 여러 폰 — 호스트 심판의 원격입력 가드 자체검증.
   실행: node tools/test-nb-multi.mjs  (assert 실패 시 throw)
   판정/승패는 nb-check.mjs가 담당 — 여기선 nbHostMsg가 잘못된/차례 아닌 입력을 거르는지만 본다. */
import fs from "node:fs";
import assert from "node:assert/strict";

const src = fs.readFileSync(new URL("../games/nb.js", import.meta.url), "utf8");
const grab = (n) => src.match(new RegExp("function " + n + "\\([^]*?\\n\\}"))[0];
const nbValid = new Function("return (" + grab("nbValid") + ")")();
const mkHost = (nb) => new Function(
  "nb", "nbValid", "nbMultiCheckStart", "nbSubmitGuess",
  "return (" + grab("nbHostMsg") + ")"
);

function run(nb){
  const calls = { start: 0, submit: 0, submittedEntry: null };
  const fn = mkHost(nb)(nb, nbValid, () => calls.start++, () => { calls.submit++; calls.submittedEntry = nb.entry; });
  return { fn, calls };
}

const base = () => ({ digits: 3, secret: ["123", ""], ready: [true, false], turn: 0, entry: "" });

/* 1) 유효한 비밀 숫자 → 저장 + ready + 시작체크 */
{ const nb = base(); const { fn, calls } = run(nb);
  fn("G", { t: "secret", num: "456" });
  assert.equal(nb.secret[1], "456"); assert.equal(nb.ready[1], true); assert.equal(calls.start, 1, "S1 시작체크 호출"); }

/* 2) 중복 있는 비밀 숫자 → 거부 */
{ const nb = base(); const { fn, calls } = run(nb);
  fn("G", { t: "secret", num: "455" });
  assert.equal(nb.secret[1], ""); assert.equal(nb.ready[1], false); assert.equal(calls.start, 0, "S2 무효 비밀 거부"); }

/* 3) 게스트 차례(turn=1) 유효 추측 → 심판 실행 */
{ const nb = base(); nb.turn = 1; const { fn, calls } = run(nb);
  fn("G", { t: "guess", num: "789" });
  assert.equal(calls.submit, 1); assert.equal(calls.submittedEntry, "789", "S3 추측이 nb.entry로 심판됨"); }

/* 4) 게스트 차례 아님(turn=0) → 추측 무시 */
{ const nb = base(); nb.turn = 0; const { fn, calls } = run(nb);
  fn("G", { t: "guess", num: "789" });
  assert.equal(calls.submit, 0, "S4 남의 차례 추측 무시"); }

/* 5) 무효 추측(자리수 부족) → 무시 */
{ const nb = base(); nb.turn = 1; const { fn, calls } = run(nb);
  fn("G", { t: "guess", num: "79" });
  assert.equal(calls.submit, 0, "S5 무효 추측 무시"); }

console.log("test-nb-multi: OK  (원격입력 가드 5케이스)");
