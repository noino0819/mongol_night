/* 게르 탈출(er) 2.0 검증 — games/er.js의 DATA·LOGIC 블록 추출해 테스트.
   실행: node tools/er-check.mjs
   1) 로직 단위 테스트  2) 데이터 무결성(정답·힌트3·아이템 선언)
   3) 막별 풀이 시뮬레이션(그리디) — 데드락 없이 최종 문까지 도달 증명
   4) 레드헤링 검사 — 안 쓰이는 아이템/콤보/플래그 = 설계원칙 위반 */
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync(new URL("../games/er.js", import.meta.url), "utf8");
const grab = (name) => {
  const m = src.match(new RegExp("/\\*" + name + "_BEGIN\\*/([\\s\\S]*?)/\\*" + name + "_END\\*/"));
  if (!m) throw new Error(name + " 블록 없음");
  return m[1];
};
const { ER_SCENARIOS, erNorm, erMatch, erStars } =
  new Function(grab("ER_DATA") + grab("ER_LOGIC") + "; return { ER_SCENARIOS, erNorm, erMatch, erStars };")();

/* ---------- 1. 로직 단위 테스트 ---------- */
assert.equal(erNorm("  낙 타 "), "낙타");
assert.equal(erNorm("2,8·1-4"), "2814");
assert.equal(erMatch("2814", ["2814"]), true);
assert.equal(erMatch("2815", ["2814"]), false);
assert.equal(erMatch("", ["남"]), false);
assert.equal(erStars(5, 5, 0), 3);   /* 풀피+힌트0 */
assert.equal(erStars(2, 5, 0), 2);   /* 하트 절반 미만 */
assert.equal(erStars(5, 5, 3), 2);   /* 힌트 과다 */
assert.equal(erStars(1, 5, 9), 1);   /* 탈출만 */

/* ---------- 2~4. 시나리오·막별 검사 ---------- */
for (const sc of ER_SCENARIOS){
  assert.ok(sc.id && sc.title && sc.emoji && sc.tagline && sc.outro, `시나리오 메타 필드 누락: ${sc.id || sc.title}`);
  assert.equal(sc.acts.length, 2, `[${sc.id}] 2막이어야`);
for (const act of sc.acts){
  const P = (msg) => `[${sc.id}/${act.id}] ${msg}`;
  const finals = act.objects.filter((o) => o.final);
  assert.equal(finals.length, 1, P("final 오브젝트는 정확히 1개"));

  /* 무결성 */
  for (const o of act.objects){
    assert.ok(o.id && o.nm && o.spr && o.txt, P(o.id + ": 필수 필드"));
    if (o.need) assert.ok(o.lockedTxt, P(o.id + ": need엔 lockedTxt 필요"));
    if (o.lock){
      if (o.lock.ans){
        assert.ok(o.lock.ans.length >= 1, P(o.id + ": 정답 없음"));
        assert.equal(o.lock.hints.length, 3, P(o.id + ": 힌트 3개 아님"));
        assert.ok(erMatch(o.lock.ans[0], o.lock.ans), P(o.id + ": 자기 정답 매칭 실패"));
        if (o.lock.digits) assert.equal(erNorm(o.lock.ans[0]).length, o.lock.digits, P(o.id + ": digits와 정답 길이 불일치"));
      } else {
        assert.ok(o.lock.item, P(o.id + ": lock에 ans도 item도 없음"));
        assert.ok(act.items[o.lock.item], P(o.id + ": 미선언 아이템 요구 " + o.lock.item));
      }
      if (o.lock.give) assert.ok(act.items[o.lock.give], P(o.id + ": 미선언 아이템 지급"));
      assert.ok(o.final || o.lock.open, P(o.id + ": 해제 문구(open) 필요"));
    }
    if (o.give) assert.ok(act.items[o.give], P(o.id + ": 미선언 아이템 지급"));
    if (o.taps){
      assert.ok(o.taps.n >= 1 && o.taps.reveal, P(o.id + ": taps엔 n·reveal 필요"));
      if (o.taps.give) assert.ok(act.items[o.taps.give], P(o.id + ": 미선언 아이템 지급(taps)"));
    }
  }
  for (const c of act.combos){
    for (const n of c.need) assert.ok(act.items[n], P("콤보 재료 미선언 " + n));
    assert.ok(act.items[c.gives], P("콤보 결과 미선언 " + c.gives));
  }

  /* 풀이 시뮬레이션 (그리디: 가능한 행동 반복, 진행 없으면 데드락) */
  const st = { inv: new Set(), flags: new Set(), solved: new Set(), usedCombos: new Set() };
  let escaped = false, guard = 0;
  while (!escaped && guard++ < 100){
    let progressed = false;
    for (const o of act.objects){
      if (o.need && !st.flags.has(o.need)) continue;      /* 게이트 잠김 */
      /* 두드리기 효과 (플레이어가 n회 두드린다고 가정 — 자물쇠와 독립) */
      if (o.taps){
        if (o.taps.sets && !st.flags.has(o.taps.sets)){ st.flags.add(o.taps.sets); progressed = true; }
        if (o.taps.give && !st.inv.has(o.taps.give)){ st.inv.add(o.taps.give); progressed = true; }
      }
      /* 조사 효과 */
      if (!o.lock){
        if (o.sets && !st.flags.has(o.sets)){ st.flags.add(o.sets); progressed = true; }
        if (o.give && !st.inv.has(o.give)){ st.inv.add(o.give); progressed = true; }
        continue;
      }
      if (st.solved.has(o.id)) continue;
      /* 자물쇠: 코드는 (플레이어가 단서로 풂 가정) need만 충족하면 해제, 아이템은 소지 필요 */
      if (o.lock.item && !st.inv.has(o.lock.item)) continue;
      st.solved.add(o.id);
      if (o.lock.sets) st.flags.add(o.lock.sets);
      if (o.lock.give) st.inv.add(o.lock.give);
      progressed = true;
      if (o.final) escaped = true;
    }
    for (const [i, c] of act.combos.entries()){
      if (!st.usedCombos.has(i) && c.need.every((n) => st.inv.has(n))){
        c.need.forEach((n) => st.inv.delete(n));
        st.inv.add(c.gives);
        st.usedCombos.add(i);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  assert.ok(escaped, P("데드락! 최종 문까지 못 감 — solved: " + [...st.solved].join(",") + " / inv: " + [...st.inv].join(",")));

  /* 레드헤링 검사: 모든 아이템이 어딘가에 쓰였나 (탈출 시 소모된 것 포함) */
  const consumed = new Set();
  act.objects.forEach((o) => { if (o.lock && o.lock.item) consumed.add(o.lock.item); });
  act.combos.forEach((c) => c.need.forEach((n) => consumed.add(n)));
  for (const it of Object.keys(act.items)){
    assert.ok(consumed.has(it), P("레드헤링 아이템(용도 없음): " + it));
  }
  /* 플래그도: sets 된 건 need 어딘가에 쓰여야 */
  const setFlags = new Set(), needFlags = new Set();
  act.objects.forEach((o) => {
    if (o.sets) setFlags.add(o.sets);
    if (o.lock && o.lock.sets) setFlags.add(o.lock.sets);
    if (o.taps && o.taps.sets) setFlags.add(o.taps.sets);
    if (o.need) needFlags.add(o.need);
  });
  for (const f of setFlags) assert.ok(needFlags.has(f), P("레드헤링 플래그: " + f));
  for (const f of needFlags) assert.ok(setFlags.has(f), P("어디서도 세워지지 않는 플래그: " + f));
}}

console.log("er-check OK ·", ER_SCENARIOS.length, "시나리오 —",
  ER_SCENARIOS.map((sc) => sc.title + "[" + sc.acts.map((a) => a.objects.length).join("+") + "오브젝트]").join(" · "), "· 전 막 풀이 증명됨");
