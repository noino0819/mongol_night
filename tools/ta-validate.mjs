// ============================================================
// "고비의 별" 그래프 검증 스크립트
// 1) 구조: 미정의 goto / 고아 노드 / 막다른 비엔딩 노드 / 선택지 수
// 2) 도달성: 전략 시뮬레이션으로 엔딩 4종 실제 도달 확인
// 3) 밸런스: 시드 고정 랜덤 플레이 1,000회 엔딩 분포
// 사용: node tools/ta-validate.mjs
// ============================================================
import { TA_GRAPH, TA_META } from "./ta-graph.mjs";

const errors = [];
const warns = [];
const ids = Object.keys(TA_GRAPH);
const isEnding = (id) => TA_META.endings.includes(id);

// ---------- 1. 구조 검증 ----------
const referenced = new Set([TA_META.start]);
const targetsOf = (node) => {
  const t = [];
  if (node.goto) t.push(node.goto);
  for (const c of node.choices ?? []) {
    if (c.goto) t.push(c.goto);
    if (c.check) { t.push(c.ok, c.fail); }
  }
  for (const a of node.auto ?? []) t.push(a.goto);
  return t.filter(Boolean);
};

for (const [id, node] of Object.entries(TA_GRAPH)) {
  const outs = targetsOf(node);
  for (const t of outs) {
    if (!TA_GRAPH[t]) errors.push(`${id}: 미정의 goto → "${t}"`);
    referenced.add(t);
  }
  if (!outs.length) errors.push(`${id}: 나가는 간선 0 (엔딩도 재시작 선택지 필요)`);
  for (const c of node.choices ?? []) {
    if (c.check && (!c.ok || !c.fail)) errors.push(`${id}: check 선택지에 ok/fail 누락`);
    if (c.check && c.goto) errors.push(`${id}: check와 goto 동시 지정`);
    if (!c.check && !c.goto) errors.push(`${id}: 선택지에 목적지 없음`);
  }
  if ((node.choices?.length ?? 0) > 3) warns.push(`${id}: 선택지 ${node.choices.length}개 (권장 최대 3)`);
}
for (const id of ids) {
  if (!referenced.has(id)) errors.push(`고아 노드: ${id} (어디서도 참조 안 됨)`);
}

// BFS 도달성 (엔딩의 재시작 간선은 역류이므로 제외하고 시작점 기준 전 노드 도달)
const seen = new Set([TA_META.start]);
const queue = [TA_META.start];
while (queue.length) {
  const id = queue.shift();
  if (isEnding(id)) continue; // 엔딩에서의 재시작 간선은 순회 제외
  for (const t of targetsOf(TA_GRAPH[id])) {
    if (!seen.has(t) && TA_GRAPH[t]) { seen.add(t); queue.push(t); }
  }
}
for (const id of ids) {
  if (!seen.has(id)) errors.push(`시작점에서 도달 불가: ${id}`);
}

// ---------- 2. 시뮬레이터 ----------
const clamp = (s) => {
  for (const k of ["용기", "지혜", "인심"]) s[k] = Math.max(0, Math.min(5, s[k]));
  s.sheep = Math.max(0, s.sheep);
  return s;
};
const evalCond = (cond, s) =>
  new Function("s", `const {용기,지혜,인심,sheep,star,charm,fails}=s; return (${cond});`)(s);
const applyDelta = (s, delta) => {
  for (const [k, v] of Object.entries(delta ?? {})) s[k] = (s[k] ?? 0) + v;
  clamp(s);
};

// policy: { pick(id, visibleChoices, s) → index, roll(id, check, s) → 성공 여부 }
function simulate(policy, maxSteps = 400) {
  const s = structuredClone(TA_META.vars);
  let id = TA_META.start;
  const path = [];
  for (let step = 0; step < maxSteps; step++) {
    const node = TA_GRAPH[id];
    if (!node) return { ending: null, error: `미정의 노드 ${id}`, path, s };
    path.push(id);
    if (isEnding(id)) return { ending: id, path, s };
    applyDelta(s, node.set);
    if (node.auto) {
      const hit = node.auto.find((a) => !a.if || evalCond(a.if, s));
      if (!hit) return { ending: null, error: `${id}: auto 전 조건 불일치`, path, s };
      id = hit.goto;
      continue;
    }
    if (node.goto) { id = node.goto; continue; }
    const visible = node.choices.filter((c) => !c.hideIf || !evalCond(c.hideIf, s));
    if (!visible.length) return { ending: null, error: `${id}: 표시 가능한 선택지 0`, path, s };
    const c = visible[Math.min(policy.pick(id, visible, s), visible.length - 1)];
    applyDelta(s, Object.fromEntries(Object.entries(c.cost ?? {}).map(([k, v]) => [k, -v])));
    if (c.check) id = policy.roll(id, c.check, s) ? c.ok : c.fail;
    else id = c.goto;
  }
  return { ending: null, error: "maxSteps 초과 (무한루프 의심)", path, s };
}

// ---------- 3. 전략별 엔딩 도달 확인 ----------
const pickByLabel = (keywords) => (id, visible) => {
  for (const kw of keywords) {
    const i = visible.findIndex((c) => c.label.includes(kw));
    if (i >= 0) return i;
  }
  return 0;
};

const strategies = {
  "⭐ 진엔딩 (전 판정 성공 + 스탯 성장 루트)": {
    expect: "end_star",
    policy: {
      pick: pickByLabel(["독수리를 따라간다", "독수리를 받아본다", "양 1마리를 바친다", "담대함", "뛰어내려", "사구를 직행", "이 악물고", "통했다", "정면 돌파", "인간 탑", "당당히", "이겼다", "찬찬히", "눈을 똑바로", "정면으로 맞선다", "그래도 별"]),
      roll: () => true,
    },
  },
  "🐑 목동엔딩 (양떼 사재기 루트)": {
    expect: "end_sheep",
    policy: {
      pick: pickByLabel(["게르로 간다", "대결을 받는다", "이겼다", "돌만 얹고", "별자리로 안전한", "우물을 경유", "들여다본다", "길만 묻고", "맡는다", "통했다", "바람 결을", "인간 탑", "당당히", "찬찬히", "눈을 똑바로", "정면으로 맞선다", "양떼와 초원에"]),
      roll: () => true,
    },
  },
  "🌪️ 방랑엔딩 (주요 판정 전패, 생존만 성공)": {
    expect: "end_wander",
    policy: {
      pick: pickByLabel(["게르로 간다", "사양한다", "돌만 얹고", "밧줄", "길만 묻고", "갈 길이 멀다", "제각각", "포기하고 대피", "정중히", "새끼를 구한다", "졌다", "버틴다", "눈을 똑바로", "전원이 손을"]),
      roll: (id) => id === "c3_26", // 최후의 생존 판정만 성공 → 게임오버 회피
    },
  },
  "💀 게임오버 (최종장 이중 실패)": {
    expect: "end_go",
    policy: { pick: () => 0, roll: () => false },
  },
};

const reachResults = [];
for (const [name, { expect, policy }] of Object.entries(strategies)) {
  const r = simulate(policy);
  const pass = r.ending === expect && !r.error;
  reachResults.push({ name, expect, got: r.ending, pass, error: r.error, s: r.s, len: r.path.length });
  if (!pass) errors.push(`엔딩 도달 실패: ${name} → 기대 ${expect}, 결과 ${r.ending ?? r.error}`);
}

// ---------- 4. 랜덤 플레이 분포 (시드 고정) ----------
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260720);
const dist = {};
const visitCount = {};
const RUNS = 1000;
for (let i = 0; i < RUNS; i++) {
  const r = simulate({
    pick: (id, visible) => Math.floor(rng() * visible.length),
    roll: (id, check, s) => (s[check.stat] ?? 0) + (1 + Math.floor(rng() * 6)) >= check.dc,
  });
  const key = r.ending ?? `ERROR:${r.error}`;
  dist[key] = (dist[key] ?? 0) + 1;
  for (const id of r.path) visitCount[id] = (visitCount[id] ?? 0) + 1;
  if (r.error) errors.push(`랜덤 플레이 오류(run ${i}): ${r.error}`);
}
const neverVisited = ids.filter((id) => !visitCount[id]);

// ---------- 리포트 ----------
const chapters = { 프롤로그: /^p_/, "1장": /^c1_/, "2장": /^c2_/, "3장": /^c3_/, 엔딩: /^end_/ };
console.log("=== 고비의 별 그래프 검증 ===");
console.log(`노드 수: ${ids.length}` + " (" +
  Object.entries(chapters).map(([n, re]) => `${n} ${ids.filter((i) => re.test(i)).length}`).join(", ") + ")");
console.log("\n[엔딩 도달 시뮬레이션]");
for (const r of reachResults) {
  console.log(`  ${r.pass ? "✅" : "❌"} ${r.name} → ${r.got ?? r.error} (${r.len}노드, 최종 상태 ${JSON.stringify(r.s)})`);
}
console.log(`\n[랜덤 플레이 ${RUNS}회 분포 (시드 20260720)]`);
for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k}: ${v} (${(v / RUNS * 100).toFixed(1)}%)`);
}
if (neverVisited.length) console.log(`  랜덤 미방문 노드: ${neverVisited.join(", ")} (전략 시뮬로 커버되는지 확인)`);
if (warns.length) { console.log("\n[경고]"); warns.forEach((w) => console.log("  ⚠ " + w)); }
if (errors.length) {
  console.log("\n[에러]");
  errors.forEach((e) => console.log("  ❌ " + e));
  process.exit(1);
}
console.log("\n✅ 검증 통과: 에러 0건");
