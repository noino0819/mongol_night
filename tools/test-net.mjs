/* net.js 브릿지 자체검증: 참가자 순서·개인배달·브로드캐스트·수신 라우팅.
   실행: node tools/test-net.mjs  (assert 실패 시 throw) */
import fs from "node:fs";
import assert from "node:assert/strict";

const src = fs.readFileSync(new URL("../games/net.js", import.meta.url), "utf8");
/* net.js의 top-level 함수들을 스텁 전역과 함께 로드해서 꺼낸다 */
function load(stubs){
  const g = { mp: stubs.mp, mpSend: stubs.mpSend, go: stubs.go, resetGame: stubs.resetGame, window: stubs.window, confirm: () => true };
  const fn = new Function(...Object.keys(g), src + "\n;return { mpNames, mpParty, mpBroadcast, mpToHost, mpNav, mpGameRecv, mpGamePeers, mpAmHost, mpLive };");
  return fn(...Object.values(g));
}

/* ---- 호스트: 3명 연결(1명 off) ---- */
{
  const sent = [];
  const mk = (name) => ({ readyState: "open", _name: name });
  const chA = mk("A"), chB = mk("B"), chC = mk("C");
  const mp = { role: "host", name: "H", spr: "bor",
    peers: [{ on: true, name: "A", chan: chA }, { on: true, name: "B", chan: chB }, { on: false, name: "C", chan: chC }],
    game: null };
  const api = load({ mp, mpSend: (chan, obj) => sent.push([chan._name, obj]), go(){}, resetGame(){}, window: {} });

  assert.deepEqual(api.mpNames(), ["H", "A", "B"], "호스트 명단: 자기 먼저 + on 게스트만");
  assert.equal(api.mpAmHost(), true);
  assert.equal(api.mpLive(), true);

  /* mpParty 순서 = mpNames 순서, self는 no-op send */
  const party = api.mpParty();
  assert.deepEqual(party.map(p => p.name), ["H", "A", "B"]);
  assert.equal(party[0].self, true);
  party[0].send({ nope: 1 }); /* self send = no-op */
  assert.equal(sent.length, 0, "self.send는 아무것도 안 보냄");

  /* 개인배달: liarIdx=1(A) → A만 liar:true */
  const liarIdx = 1;
  party.forEach((pl, i) => { const m = { t: "role", liar: i === liarIdx }; if (!pl.self) pl.send(m); });
  assert.deepEqual(sent, [
    ["A", { t: "game", m: { t: "role", liar: true } }],
    ["B", { t: "game", m: { t: "role", liar: false } }],
  ], "개인 역할이 올바른 폰으로만 배달");

  sent.length = 0;
  api.mpBroadcast({ q: 1 });
  assert.deepEqual(sent, [["A", { t: "game", m: { q: 1 } }], ["B", { t: "game", m: { q: 1 } }]], "브로드캐스트는 on 게스트 전원(off 제외)");

  sent.length = 0;
  api.mpNav("liar");
  assert.deepEqual(sent, [["A", { t: "nav", game: "liar" }], ["B", { t: "nav", game: "liar" }]], "nav는 on 게스트 전원");

  /* 호스트는 게스트→호스트 게임메시지를 mp.game.onMsg로 받는다 */
  let got = null;
  mp.game = { onMsg: (from, m) => { got = [from, m]; } };
  api.mpGameRecv("A", { t: "game", m: { buzz: 1 } });
  assert.deepEqual(got, ["A", { buzz: 1 }], "수신 라우팅: t:game → onMsg(from, m)");
}

/* ---- 게스트 ---- */
{
  const sent = [];
  const navd = [];
  const hostChan = { readyState: "open" };
  const mp = { role: "guest", name: "G", hostChan, hostName: "H", rosterNames: ["H", "G", "X"], game: null };
  const win = {};
  const api = load({ mp, mpSend: (chan, obj) => sent.push(obj), go: (n) => navd.push(["go", n]), resetGame: (n) => navd.push(["reset", n]), window: win });

  assert.deepEqual(api.mpNames(), ["H", "G", "X"], "게스트 명단: 호스트가 보낸 roster");
  assert.equal(api.mpAmHost(), false);
  assert.equal(api.mpLive(), true);

  api.mpToHost({ move: 5 });
  assert.deepEqual(sent, [{ t: "game", m: { move: 5 } }], "게스트→호스트 전송");

  /* nav 수신 → resetGame + go + __guest_ 훅 호출 */
  let hookCalled = 0;
  win.__guest_liar = () => { hookCalled++; };
  api.mpGameRecv("H", { t: "nav", game: "liar" });
  assert.deepEqual(navd, [["reset", "liar"], ["go", "liar"]], "nav → resetGame 후 go");
  assert.equal(hookCalled, 1, "게스트 진입 훅 실행");

  /* nav home → 연결방 복귀 + game 해제 */
  navd.length = 0;
  mp.game = { onMsg(){} };
  api.mpGameRecv("H", { t: "nav", game: "home" });
  assert.deepEqual(navd, [["go", "mp"]], "nav home → go(mp)");
  assert.equal(mp.game, null, "home 복귀 시 game 핸들러 해제");
}

console.log("test-net: OK");
