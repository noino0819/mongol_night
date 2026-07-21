/* 라스베가스(vg) 검증 — games/vg.js의 순수 로직(vgWinnerOrder·vgDeal) 단위 테스트.
   vg.js는 window/document/module 가드가 있어 node에서 require 가능. 실행: node tools/vg-check.mjs */
import { createRequire } from "module";
import assert from "assert";
const require = createRequire(import.meta.url);
const { vgWinnerOrder, vgDeal } = require("../games/vg.js");

/* 1. 배당 순서 — 단독 최다 / 동률 상쇄 / 차순위 승계 */
assert.deepEqual(vgWinnerOrder({ 0: 3, 1: 1 }), [0, 1]);          /* 3 > 1 → 순서대로 */
assert.deepEqual(vgWinnerOrder({ 0: 2, 1: 2, 2: 1 }), [2]);       /* 1위(2·2) 동률 상쇄 → 차순위 2만 */
assert.deepEqual(vgWinnerOrder({ 0: 2, 1: 2 }), []);              /* 전원 동률 → 아무도 못 받음 */
assert.deepEqual(vgWinnerOrder({ 0: 3, 1: 2, 2: 2 }), [0]);       /* 단독 3 받고, 2·2 상쇄 */
assert.deepEqual(vgWinnerOrder({ 0: 1, 1: 2, 2: 3 }), [2, 1, 0]); /* 3→2→1 정렬 */
assert.deepEqual(vgWinnerOrder({}), []);                          /* 배치 없음 */
assert.deepEqual(vgWinnerOrder({ 0: 5 }), [0]);                   /* 혼자 */
assert.deepEqual(vgWinnerOrder({ 0: 3, 1: 3, 2: 2, 3: 1 }), [2, 3]); /* 1위 동률 상쇄 후 2, 1 순 */

/* 2. 카지노 분배 — 6곳, 각 스택 합 5만↑(또는 5장 캡), 값 1~9, 내림차순 */
for (let t = 0; t < 200; t++){
  const cas = vgDeal();
  assert.equal(cas.length, 6, "카지노 6곳");
  cas.forEach((c) => {
    assert.ok(c.stack.length >= 1 && c.stack.length <= 5, "스택 1~5장");
    const sum = c.stack.reduce((a, b) => a + b, 0);
    assert.ok(sum >= 5 || c.stack.length === 5, "합 5↑ 또는 5장 캡");
    c.stack.forEach((v, i) => {
      assert.ok(v >= 1 && v <= 9, "값 1~9");
      if (i) assert.ok(c.stack[i - 1] >= v, "내림차순");
    });
  });
}

console.log("vg-check OK · 배당순서 8케이스 · vgDeal 200회");
