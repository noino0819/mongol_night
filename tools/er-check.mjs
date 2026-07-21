/* 게르 탈출(er) 검증 — games/er.js의 DATA·LOGIC 블록을 추출해 단위 테스트.
   실행: node tools/er-check.mjs */
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync(new URL("../games/er.js", import.meta.url), "utf8");
const grab = (name) => {
  const m = src.match(new RegExp("/\\*" + name + "_BEGIN\\*/([\\s\\S]*?)/\\*" + name + "_END\\*/"));
  if (!m) throw new Error(name + " 블록 없음");
  return m[1];
};

/* 순수 로직 + 데이터만 평가 (DOM/전역 의존 없음) */
const mod = new Function(grab("ER_DATA") + grab("ER_LOGIC") + "; return { ER_SC, erNorm, erMatch, erStars };")();
const { ER_SC, erNorm, erMatch, erStars } = mod;

/* 1. 정규화 */
assert.equal(erNorm("  낙 타 "), "낙타");
assert.equal(erNorm("Tengri"), "tengri");
assert.equal(erNorm("2,8·1.4"), "2814");

/* 2. 매칭 (정답/오답/대체정답) */
assert.equal(erMatch("2814", ["2814"]), true);
assert.equal(erMatch("2815", ["2814"]), false);
assert.equal(erMatch("쌍봉낙타", ["낙타", "쌍봉낙타"]), true);
assert.equal(erMatch("", ["남"]), false); /* 빈 입력은 통과 안 됨 */

/* 3. 별점 */
assert.equal(erStars(400, 480, 0), 3);  /* 목표내 + 힌트0 */
assert.equal(erStars(600, 480, 0), 2);  /* 초과 */
assert.equal(erStars(400, 480, 3), 2);  /* 힌트 많음 */
assert.equal(erStars(600, 480, 5), 1);  /* 탈출만 */

/* 4. 시나리오 무결성: 각 자물쇠는 정답 존재 + 힌트 3개 + 자기 정답이 매칭돼야 */
assert.ok(ER_SC.locks.length >= 3, "자물쇠 3개 이상");
ER_SC.locks.forEach((L, i) => {
  assert.ok(Array.isArray(L.ans) && L.ans.length >= 1, `자물쇠 ${i + 1} 정답 없음`);
  assert.equal(L.hints.length, 3, `자물쇠 ${i + 1} 힌트 3개 아님`);
  assert.ok(erMatch(L.ans[0], L.ans), `자물쇠 ${i + 1} 자기 정답 매칭 실패`);
});

console.log("er-check OK ·", ER_SC.locks.length, "locks");
