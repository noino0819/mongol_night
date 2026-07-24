/* 게르 탈출(er) 난이도 정적 측정기 — games/er.js의 ER_DATA에서 구조 신호만 뽑아
   자물쇠(퍼즐)별 D_lock, 막별 D_act를 계산해 별점·100점·레드플래그로 출력.
   실행: node tools/er-difficulty.mjs   (검증: node tools/er-check.mjs 와 짝)

   ⚠️ 이건 '구조·부피의 프록시'이지 재미의 질을 재는 게 아니다. 절대점수가 아니라
   막·자물쇠 간 '상대 순위/이상치 탐지'로 써라. 못 재는 것은 하단 한계 출력 참조.
   신호·가중치 근거: docs/방탈출_트릭사전.md(0장 원칙·난이도 손잡이·1-1) + 웹리서치
   (엔트로피/의존그래프/스도쿠 난이도). 임계 상수는 실플레이 피드백으로 튜닝할 손잡이. */
import fs from "fs";
import assert from "assert";

const src = fs.readFileSync(new URL("../games/er.js", import.meta.url), "utf8");
const grab = (name) => {
  const m = src.match(new RegExp("/\\*" + name + "_BEGIN\\*/([\\s\\S]*?)/\\*" + name + "_END\\*/"));
  if (!m) throw new Error(name + " 블록 없음");
  return m[1];
};
const { ER_SCENARIOS, erNorm } =
  new Function(grab("ER_DATA") + grab("ER_LOGIC") + "; return { ER_SCENARIOS, erNorm };")();

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isPuzzle = (o) => !!(o.lock || o.ctext || o.find || o.torch);

/* ---- 자물쇠 단위 신호 ---- */
/* S1 입력 기본 난이도(퍼즐 종류) */
function s1(o){
  if (!o.lock) return 0;
  if (o.lock.item) return 1;                    /* 아이템 삽입 */
  if (o.lock.type === "dial") return 2;         /* 다이얼 = 입력이 구속됨 */
  if (o.lock.ans) return 3;                     /* 열린 키보드 코드 */
  return 0;
}
/* S2 클루 추출/관찰 복잡도 */
function s2(o){
  let p = 0;
  if (o.ctext){                                 /* 색글자 추출 */
    const colors = new Set(o.ctext.segs.filter((s) => s.c).map((s) => s.c)).size;
    p += 2 + (o.ctext.vert ? 1 : 0) + (colors >= 2 ? 2 : 0);   /* 세로쓰기·다색 채널 = 다단 추출 */
  }
  if (o.find){                                  /* 심볼 필터·개수세기 */
    const cells = o.find.cells || [];
    const total = cells.length || 1;
    const empty = cells.filter((c) => !c.s).length;
    const symbols = new Set(cells.filter((c) => c.s).map((c) => c.s)).size;
    const noise = clamp(Math.round(empty / total * 3), 0, 3);
    const filter = (symbols > 1 || empty > 0) ? 1 : 0;         /* '다 누르면 끝'이 아니라 규칙 적용 필요 */
    p += 1 + noise + filter;
  }
  if (o.torch){                                 /* 손전등 탐색 */
    p += 1 + ((o.torch.marks || []).length >= 3 ? 1 : 0);
  }
  return p;
}
/* S5 답 길이/자릿수 */
function s5(o){
  if (!o.lock || !o.lock.ans) return 0;
  const L = o.lock.digits || erNorm(o.lock.ans[0]).length;
  return clamp(L - 2, 0, 3);                     /* 2자리=0 · 3=1 · 4=2 · 5+=3 */
}

/* ---- 연결 거리 그래프 depth() (S6/A4) ---- */
function buildDepth(act){
  const byId = Object.fromEntries(act.objects.map((o) => [o.id, o]));
  const flagProducers = {}, itemProducers = {};
  const addFlag = (f, o) => { if (f) (flagProducers[f] ||= []).push(o); };
  const addItem = (i, o) => { if (i) (itemProducers[i] ||= []).push(o); };
  for (const o of act.objects){
    addFlag(o.sets, o); if (o.lock) addFlag(o.lock.sets, o); if (o.taps) addFlag(o.taps.sets, o);
    addItem(o.give, o); if (o.lock) addItem(o.lock.give, o); if (o.taps) addItem(o.taps.give, o);
  }
  const combos = act.combos || [];
  const dObj = {}, dItem = {};
  function depth(o, seen = new Set()){
    if (dObj[o.id] !== undefined) return dObj[o.id];
    if (seen.has("o:" + o.id)) return 0;         /* 사이클 방지(DAG 가정) */
    seen.add("o:" + o.id);
    const reqs = [];
    if (o.need){
      const ps = flagProducers[o.need] || [];
      reqs.push(1 + Math.min(...(ps.length ? ps.map((p) => depth(p, seen)) : [0])));
    }
    if (o.lock && o.lock.item) reqs.push(1 + depthOfItem(o.lock.item, seen));
    const v = reqs.length ? Math.max(...reqs) : 0;
    return (dObj[o.id] = v);
  }
  function depthOfItem(it, seen = new Set()){
    if (dItem[it] !== undefined) return dItem[it];
    if (seen.has("i:" + it)) return 0;
    seen.add("i:" + it);
    const direct = (itemProducers[it] || []).map((o) => depth(o, seen));
    const viaCombo = combos.filter((c) => c.gives === it)
      .map((c) => 1 + Math.max(...(c.need.length ? c.need.map((n) => depthOfItem(n, seen)) : [0])));
    const all = [...direct, ...viaCombo];
    return (dItem[it] = all.length ? Math.min(...all) : 0);
  }
  return { depth, depthOfItem };
}

/* ---- 막 단위 계산 ---- */
function scoreAct(act){
  const { depth, depthOfItem } = buildDepth(act);
  const puzzles = act.objects.filter(isPuzzle);
  const locks = puzzles.map((o) => {
    const S1 = s1(o), S2 = s2(o), S5 = s5(o), S6 = depth(o);
    return { id: o.id, S1, S2, S5, S6, D: S1 + S2 + S5 + S6 };
  });
  const A1 = puzzles.reduce((a, o) => a + s1(o) + s2(o) + s5(o), 0);
  const A2 = clamp(act.objects.length - 6, 0, 3);
  const combos = act.combos || [];
  const finalItems = new Set(act.objects.filter((o) => o.final && o.lock && o.lock.item).map((o) => o.lock.item));
  const A3 = combos.reduce((a, c) => a + (c.need.length - 1), 0) + (combos.some((c) => finalItems.has(c.gives)) ? 1 : 0);
  const A4 = puzzles.reduce((m, o) => Math.max(m, depth(o)), 0);
  const raw = A1 + A2 + A3 + A4;
  /* 하드코어 시간압(별도 모디파이어) */
  const tp = act.time / (puzzles.length || 1);
  const A5 = tp < 120 ? 3 : tp < 150 ? 2 : tp < 180 ? 1 : 0;
  return { A1, A2, A3, A4, raw, A5, hardRaw: raw + A5, locks, tp, puzzleCount: puzzles.length };
}

const lockStar = (D) => D <= 2 ? 1 : D === 3 ? 2 : D <= 5 ? 3 : D <= 7 ? 4 : 5;
const actStar = (r) => r <= 13 ? 1 : r <= 17 ? 2 : r <= 21 ? 3 : r <= 25 ? 4 : 5;
const actScore = (r) => Math.round(clamp((r - 10) / 20 * 100, 0, 100));
const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

/* ---- 출력 ---- */
const rows = [];
for (const sc of ER_SCENARIOS){
  const acts = sc.acts.map(scoreAct);
  acts.forEach((r, i) => rows.push({ sc: sc.id, actName: sc.acts[i].name.split(" · ")[1] || sc.acts[i].name, ...r }));
}

console.log("=== er 난이도(정적 프록시) — 막별 ===\n");
console.log("막".padEnd(26), "별점    ", "raw", "score", "하드(+시간압)");
for (const r of rows){
  const label = (r.sc + " · " + r.actName).slice(0, 25);
  console.log(label.padEnd(26), stars(actStar(r.raw)), String(r.raw).padStart(3),
    String(actScore(r.raw)).padStart(4), "   " + stars(actStar(r.hardRaw)) + " (raw " + r.hardRaw + ", " + Math.round(r.tp) + "s/퍼즐)");
}

console.log("\n=== 자물쇠별 최난 top (D_lock) ===");
const allLocks = rows.flatMap((r) => r.locks.map((l) => ({ ...l, act: r.sc + "/" + r.actName })));
allLocks.sort((a, b) => b.D - a.D);
for (const l of allLocks.slice(0, 8)){
  console.log("  " + stars(lockStar(l.D)).slice(0, 5), "D=" + l.D, (l.act + " · " + l.id).padEnd(34),
    "(S1=" + l.S1 + " S2=" + l.S2 + " S5=" + l.S5 + " S6=" + l.S6 + ")");
}

console.log("\n=== 레드 플래그 ===");
const flags = [];
/* 시나리오 내 난이도 곡선 역전(1막 > 2막) */
for (const sc of ER_SCENARIOS){
  const a = sc.acts.map(scoreAct);
  if (a.length === 2 && a[0].raw > a[1].raw)
    flags.push(`곡선 역전: ${sc.id} 1막(raw ${a[0].raw}) > 2막(raw ${a[1].raw}) — 워밍업이 뒤에 있음`);
}
/* 하드코어 5분 초과 위험(퍼즐당 시간 빠듯) */
for (const r of rows) if (r.tp < 120) flags.push(`시간압: ${r.sc}/${r.actName} — ${Math.round(r.tp)}s/퍼즐 (하드코어 병목 위험)`);
/* 힌트 누락(코드 자물쇠인데 hints 3단 없음) */
for (const sc of ER_SCENARIOS) for (const act of sc.acts) for (const o of act.objects)
  if (o.lock && o.lock.ans && (!o.lock.hints || o.lock.hints.length !== 3))
    flags.push(`힌트 결손: ${sc.id}/${o.id} — 코드 자물쇠에 3단 힌트 없음`);
/* 클라이맥스(final 락)가 최하 난도인가 */
for (const sc of ER_SCENARIOS){
  const last = sc.acts[sc.acts.length - 1];
  const { depth } = buildDepth(last);
  const fin = last.objects.find((o) => o.final);
  if (fin && fin.lock && fin.lock.ans){
    const D = s1(fin) + s2(fin) + s5(fin) + depth(fin);
    if (D <= 2) flags.push(`피날레 김빠짐: ${sc.id} 최종 '${fin.id}' D=${D} — 클라이맥스인데 최하 난도`);
  }
}
if (!flags.length) console.log("  (없음)");
else flags.forEach((f) => console.log("  ⚑ " + f));

console.log("\n=== 이 측정기가 못 재는 것 (과신 금지) ===");
[
  "아하의 질: '정보 다 줬는데 연결만 숨김'의 그 연결이 우아한지 vs '그걸 어떻게 알아'인지 — 클루→락 태깅이 데이터에 없어 측정 불가(코드 자물쇠 depth가 0으로 나오는 이유).",
  "프로즈에 숨은 퍼즐: txt·speech에 박힌 개수세기·재읽기·추리는 신호 0(예: khan 2막 pen 세기, isekai 흑막 추리 과소평가).",
  "문화·서사 사전지식 부담: 샤가이 순서·자정=12:00 같은 '규칙 발견'의 친숙도.",
  "힌트 품질: 항상 3단이라 개수로 변별 불가. 1단이 방법을 떠먹이는지는 텍스트 판단 필요.",
  "연출·피드백·오답 리액션·톤(재미의 절반).",
].forEach((s) => console.log("  · " + s));
console.log("\n→ 절대점수 아님. 상대 순위·이상치 탐지용. 실플레이 성공률/힌트사용률로 보정할 것.");

/* ---- self-check: 로직 회귀 감지(측정기설계 손계산과 대조) ---- */
const khanA1 = scoreAct(ER_SCENARIOS[0].acts[0]);
assert.equal(khanA1.raw, 24, "khan 1막 raw가 24가 아님(측정기 로직 변경?) → " + khanA1.raw);
const topLetter = khanA1.locks.slice().sort((a, b) => b.D - a.D)[0];
assert.equal(topLetter.id, "letter", "khan 1막 최난 자물쇠가 letter가 아님 → " + topLetter.id);
console.log("\nself-check OK (khan 1막 raw=24, 최난 자물쇠=letter)");
