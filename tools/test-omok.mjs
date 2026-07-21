/* 오목 자체검증: 승리 판정 + 여러 폰 심판(턴 게이트·유효성).
   실행: node tools/test-omok.mjs  (assert 실패 시 throw) */
import fs from "node:fs";
import assert from "node:assert/strict";

const src = fs.readFileSync(new URL("../games/omok.js", import.meta.url), "utf8");

/* DOM/캔버스/net 스텁으로 omok.js를 로드하고 필요한 심볼을 꺼낸다.
   IIFE가 load 시 $·getContext·addEventListener만 건드리므로 그것만 채워주면 됨. */
function load(bcast){
  const noop = () => {};
  const ctx = new Proxy({}, { get: () => noop });
  const el = { style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop },
    getContext: () => ctx, addEventListener: noop, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400 }), appendChild: noop,
    insertBefore: noop, prepend: noop, set innerHTML(_v){}, set textContent(_v){}, parentNode: null };
  el.parentNode = el;
  const document = { getElementById: () => el, querySelector: () => ({ clientWidth: 400 }), createElement: () => el };
  const win = {};
  const g = {
    $: () => el, document, window: win,
    mpLive: () => true, mpAmHost: () => true, mpNames: () => ["H", "G"],
    mpNav: noop, mpParty: () => [], mpBroadcast: (m) => bcast.push(m), mpToHost: noop,
    snModeBar: noop, mp: { role: "host", game: null }, alert: noop,
  };
  const fn = new Function(...Object.keys(g), src + "\n;return { om, omApply, omokWin, omHostRecv };");
  const api = fn(...Object.values(g));
  api.win = win;
  return api;
}

const empty = (n) => Array.from({ length: n }, () => Array(n).fill(0));

/* ---- 1) 승리 판정: 가로 5 = 승, 4 = 미승 ---- */
{
  const api = load([]);
  const b = empty(11);
  for (let c = 0; c < 4; c++) b[5][c] = 1;
  Object.assign(api.om, { size: 11, board: b, rule: "free" });
  assert.equal(api.omokWin(5, 3), false, "가로 4목은 아직 승리 아님");
  b[5][4] = 1;
  assert.equal(api.omokWin(5, 4), true, "가로 5목 = 승리");
  b[6][0] = 2; b[6][1] = 2;
  assert.equal(api.omokWin(6, 1), false, "백 2목은 미승");
}

/* ---- 2) omApply: 착수 반영 + 턴 교대 ---- */
{
  const api = load([]);
  Object.assign(api.om, { size: 11, board: empty(11), turn: 1, history: [], over: false, rule: "free" });
  assert.equal(api.omApply(5, 5), true);
  assert.equal(api.om.board[5][5], 1, "흑돌 착수 반영");
  assert.equal(api.om.turn, 2, "착수 후 백 차례로 교대");
  assert.deepEqual(api.om.history.at(-1), [5, 5], "히스토리 기록");
}

/* ---- 3) 호스트 심판: 턴 게이트 + 유효성 ---- */
{
  const bcast = [];
  const api = load(bcast);
  Object.assign(api.om, { size: 11, board: empty(11), turn: 1, history: [], over: false, rule: "free" });

  /* 흑(호스트) 차례인데 게스트가 착수 시도 → 반려, 보드 불변, 브로드캐스트 없음 */
  api.omHostRecv("G", { t: "move", r: 3, c: 3 });
  assert.equal(api.om.board[3][3], 0, "백 차례 아닐 때 게스트 착수 반려");
  assert.equal(bcast.length, 0, "반려 시 브로드캐스트 없음");

  /* 백 차례로 두고 유효 착수 → 반영 + 브로드캐스트 1회 */
  api.om.turn = 2;
  api.omHostRecv("G", { t: "move", r: 3, c: 3 });
  assert.equal(api.om.board[3][3], 2, "백 차례에 게스트 착수 반영");
  assert.equal(bcast.length, 1, "유효 착수 후 상태 브로드캐스트");
  assert.equal(bcast[0].t, "state");
  assert.equal(api.om.turn, 1, "게스트 착수 후 호스트(흑) 차례");

  /* 이미 돌 있는 칸 / 정수 아닌 좌표 → 반려 */
  const before = bcast.length;
  api.om.turn = 2;
  api.omHostRecv("G", { t: "move", r: 3, c: 3 });      /* 점유된 칸 */
  api.omHostRecv("G", { t: "move", r: 1.5, c: 2 });    /* 비정수 */
  api.omHostRecv("G", { t: "move", r: 99, c: 0 });     /* 범위 밖 */
  assert.equal(bcast.length, before, "무효 착수는 전부 반려");

  /* 백 차례라도 백(mpNames[1]="G")이 아닌 관전자가 쏜 착수는 반려 (from 검증) */
  api.om.turn = 2;
  const before2 = bcast.length;
  api.omHostRecv("X", { t: "move", r: 5, c: 5 });
  assert.equal(api.om.board[5][5], 0, "관전자(비-백) 착수는 반려");
  assert.equal(bcast.length, before2, "관전자 착수 시 브로드캐스트 없음");
}

console.log("test-omok: OK");
