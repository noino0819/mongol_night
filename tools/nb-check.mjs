/* 숫자야구(nb) 순수 로직 + 승패 상태머신 자체검증. 실행: node tools/nb-check.mjs */
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync(new URL("../games/nb.js", import.meta.url), "utf8");
const grab = (n) => src.match(new RegExp("function " + n + "\\([^]*?\\n\\}"))[0];
const nbJudge = new Function("return (" + grab("nbJudge") + ")")();
const nbValid = new Function("return (" + grab("nbValid") + ")")();

/* --- 판정/유효성 --- */
assert.deepStrictEqual(nbJudge("123", "123"), { s: 3, b: 0 });
assert.deepStrictEqual(nbJudge("123", "132"), { s: 1, b: 2 });
assert.deepStrictEqual(nbJudge("123", "456"), { s: 0, b: 0 });   // OUT
assert.deepStrictEqual(nbJudge("1234", "1243"), { s: 2, b: 2 });
assert(nbValid("012", 3) && !nbValid("112", 3) && !nbValid("12", 3) && !nbValid("12a", 3));

/* --- 승패 상태머신: 실제 nbSubmitGuess 를 스텁 환경에서 구동 --- */
const nbSubmitGuess = new Function(
  "nb", "nbJudge", "nbValid", "haptic", "nbRenderLogs", "nbBeginTurn", "nbEnd",
  "return (" + grab("nbSubmitGuess") + ")"
);
function drive(secretA, secretB, guessesA, guessesB){
  // 턴 순서: A(0),B(1),A,B... A는 secretB를, B는 secretA를 맞힌다
  const nb = { digits: 3, secret: [secretA, secretB], logs: [[], []], turn: 0, solved: [0, 0], finalPending: false, entry: "" };
  let ended = null, ai = 0, bi = 0;
  const submit = nbSubmitGuess(nb, nbJudge, nbValid, () => {}, () => {}, () => { pull(); }, () => { ended = nb; });
  function pull(){
    if (ended) return;
    nb.entry = nb.turn === 0 ? guessesA[ai++] : guessesB[bi++];
    submit();
  }
  pull();
  return nb;
}
// A는 secretB(456)를, B는 secretA(123)를 맞힌다. miss 추측도 중복 없는 유효값이어야 함(숫자패드 제약)
// 시나리오1: 선공A 3번째 적중, 후공B 마지막 기회 실패 → A 승
let r = drive("123", "456", ["789", "780", "456"], ["987", "908", "870"]);
assert.deepStrictEqual([r.solved[0] > 0, r.solved[1] > 0], [true, false], "S1: A 단독승");
// 시나리오2: 선공A 2번째 적중, 후공B 동수 기회(2번째)도 적중 → 무승부
r = drive("123", "456", ["789", "456"], ["987", "123"]);
assert.deepStrictEqual([r.solved[0], r.solved[1]], [2, 2], "S2: 무승부");
// 시나리오3: 후공B가 먼저(2번째) 적중, 선공A 미적중 → B 승 (A 동수기회 없음)
r = drive("123", "456", ["789", "780"], ["987", "123"]);
assert.deepStrictEqual([r.solved[0] > 0, r.solved[1] > 0], [false, true], "S3: B 단독승");

console.log("nb 자체검증 통과 ✅  (판정 4 · 유효성 4 · 승패 3)");
