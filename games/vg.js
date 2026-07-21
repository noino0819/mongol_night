"use strict";
/* ================= 라스베가스 (vg) =================
   카지노 6곳(눈 1~6)에 주사위 8개로 배팅. 굴려서 나온 눈 하나를 골라 전부 그 카지노에 배치.
   카지노마다 주사위 최다 순서로 지폐 스택을 나눠 갖되, 1위 동률이면 그들끼리 상쇄(꽝) 후 차순위가 챙긴다.
   한 상태머신으로 폰 하나(solo)와 여러 폰(multi)을 공유. multi는 net.js 브릿지 사용 —
   호스트가 유일 권위·유일 RNG, 매 변화마다 전체 상태를 브로드캐스트, 게스트는 자기 차례에 액션만 되쏨.
   검증: node tools/vg-check.mjs (vgWinnerOrder·vgDeal 순수 로직).
   ponytail: 상태 델타 없이 전체 브로드캐스트(상태 작음). 재연결 없음(mp 정책 그대로). */

const VG_COLORS = ["var(--fire)", "var(--steppe)", "var(--danger)", "var(--dim)", "var(--milk)", "var(--ember)"];
const VG_FACE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
let vgMode = "solo"; /* "solo"=폰 하나 · "multi"=여러 폰 */
let vg = { phase: "setup", players: [], casinos: [], rounds: 4, round: 1, turn: 0, starter: 0, roll: null, settleInfo: null, net: null, sel: [] };

/* ---------- 순수 로직 (node 테스트 대상) ---------- */
/* placed {playerIdx:diceCount} → 배당 순서 idx 배열. 매 라운드 최다 1명씩 뽑되, 최다가 동률이면 그 그룹 전원 제외(상쇄) 후 다음 최다로. */
function vgWinnerOrder(placed){
  let pool = Object.keys(placed).map((k) => ({ i: +k, c: placed[k] })).filter((e) => e.c > 0);
  const order = [];
  while (pool.length){
    const mx = Math.max(...pool.map((e) => e.c));
    const top = pool.filter((e) => e.c === mx);
    if (top.length === 1) order.push(top[0].i); /* 단독 최다 → 배당 */
    pool = pool.filter((e) => e.c < mx);        /* 동률이면 그 그룹 전원 상쇄(배당 없음) */
  }
  return order;
}
/* 카지노 6곳: 각 지폐(1~9만)를 합 5만 이상 될 때까지 쌓고 내림차순 정렬(큰 카드부터 지급). ponytail: 유한 덱 없이 라운드마다 랜덤 생성 */
function vgDeal(){
  const cas = [];
  for (let f = 0; f < 6; f++){
    const stack = []; let sum = 0;
    while (sum < 5 && stack.length < 5){ const v = 1 + Math.floor(Math.random() * 9); stack.push(v); sum += v; }
    stack.sort((a, b) => b - a);
    cas.push({ stack, placed: {} });
  }
  return cas;
}

/* ---------- 상태 전이 (호스트/폰하나에서만 실행) ---------- */
function vgNewRound(){
  vg.casinos = vgDeal();
  vg.players.forEach((p) => { p.dice = 8; });
  vg.turn = vg.starter;
  vg.roll = null;
  vg.settleInfo = null;
  vg.phase = "turn";
}
function vgRoll(){
  const p = vg.players[vg.turn];
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (let i = 0; i < p.dice; i++) counts[1 + Math.floor(Math.random() * 6)]++;
  vg.roll = { counts };
}
function vgPlace(face){
  if (!vg.roll || !vg.roll.counts[face]) return;
  const c = vg.roll.counts[face];
  const cas = vg.casinos[face - 1];
  cas.placed[vg.turn] = (cas.placed[vg.turn] || 0) + c;
  vg.players[vg.turn].dice -= c;
  vg.roll = null;
  if (vg.players.every((p) => p.dice === 0)) return vgSettle();
  do { vg.turn = (vg.turn + 1) % vg.players.length; } while (vg.players[vg.turn].dice === 0);
}
function vgSettle(){
  vg.settleInfo = vg.casinos.map((cas, ci) => {
    const order = vgWinnerOrder(cas.placed);
    const pays = [];
    order.forEach((pi, k) => { if (k < cas.stack.length){ vg.players[pi].money += cas.stack[k]; pays.push({ pi, amt: cas.stack[k] }); } });
    return { face: ci + 1, stack: cas.stack.slice(), placed: Object.assign({}, cas.placed), pays };
  });
  vg.phase = "settle";
}
function vgNext(){
  if (vg.round < vg.rounds){ vg.round++; vg.starter = (vg.starter + 1) % vg.players.length; vgNewRound(); }
  else vg.phase = "end";
}

/* ---------- 액션 라우팅 ---------- */
function vgMyTurn(){ return vgMode !== "multi" || (vg.net && vg.turn === vg.net.me); }
/* 버튼 → 여기로. 게스트는 호스트로 전송, 그 외(폰하나·호스트)는 로컬 적용. */
function vgAct(action){
  if (vgMode === "multi" && !mpAmHost()){ if (!vgMyTurn()) return; mpToHost(Object.assign({ t: "act" }, action)); return; }
  vgApply(action);
}
function vgApply(action){
  if (action.act === "roll"){ if (vg.roll) return; vgRoll(); }
  else if (action.act === "place"){ vgPlace(action.face); }
  else if (action.act === "next"){ vgNext(); }
  else return;
  vgRender();
  if (vgMode === "multi" && mpAmHost()) mpBroadcast({ t: "state", st: vgSerialize() });
}

/* ---------- 여러 폰 (net.js 브릿지) ---------- */
function vgSerialize(){ const { net, sel, ...st } = vg; return st; }
/* 호스트: 게스트가 보낸 액션 — 지금 차례인 그 폰의 것일 때만 수용 (from = 보낸 폰 이름) */
function vgHostMsg(from, m){
  if (m.t !== "act") return;
  if (!vg.players[vg.turn] || from !== vg.players[vg.turn].name) return;
  vgApply(m);
}
/* 호스트: 여러 폰 시작 */
function vgStartMulti(){
  const names = mpNames();
  if (names.length < 2){ alert("여러 폰 라스베가스는 2명 이상 연결돼야 해 (지금 " + names.length + "명)"); return; }
  if (names.length > 6){ alert("최대 6명까지야 — 지금 " + names.length + "명 연결됨"); return; }
  vg.players = names.map((n, i) => ({ name: String(n).slice(0, 8), color: VG_COLORS[i % 6], dice: 8, money: 0 }));
  vg.round = 1; vg.starter = 0; vg.net = { me: 0 };
  mpNav("vg");                                 /* 게스트들 라스베가스 화면으로 (게스트: __guest_vg 실행 → 대기) */
  mp.game = { onMsg: vgHostMsg, onPeers(){} };
  vgNewRound();
  mpParty().forEach((pl, i) => { if (!pl.self) pl.send({ t: "init", me: i, st: vgSerialize() }); }); /* 각 폰에 자기 인덱스 배달 */
  vgRender();
}
/* 게스트: 호스트가 시작하면 net.js가 이 훅을 부른다 (이미 resetGame·go("vg") 끝난 상태) */
if (typeof window !== "undefined") window.__guest_vg = function(){
  vgMode = "multi";
  vg.net = { me: -1 }; /* init 오기 전까진 내 차례 아님 */
  vgShow("vg-turn");
  $("vg-strip").innerHTML = ""; $("vg-casinos").innerHTML = "";
  $("vg-turn-name").textContent = "대기 중…";
  $("vg-roll-msg").textContent = "호스트가 시작하면 판이 여기 떠";
  $("vg-roll").style.display = "none"; $("vg-tray").innerHTML = ""; $("vg-faces").style.display = "none"; $("vg-wait").style.display = "none";
  mp.game = { onMsg(from, m){
    if (m.t === "init"){ vg.net = { me: m.me }; Object.assign(vg, m.st); vgRender(); }
    else if (m.t === "state"){ Object.assign(vg, m.st); vgRender(); }
  }, onPeers(){} };
};

/* ---------- 렌더 ---------- */
function vgShow(id){ ["vg-setup", "vg-turn", "vg-settle", "vg-end"].forEach((x) => $(x).style.display = x === id ? (id === "vg-end" ? "flex" : "") : "none"); }
function vgRenderStrip(el){
  const strip = $(el); strip.innerHTML = "";
  vg.players.forEach((p, i) => {
    const sp = document.createElement("span");
    sp.className = "sp" + (i === vg.turn && vg.phase === "turn" ? " now" : "") + (p.dice === 0 ? " dead" : "");
    sp.innerHTML = '<i style="background:' + p.color + '"></i>' + escHtml(p.name) + " 🎲" + p.dice + " 💰" + p.money;
    strip.appendChild(sp);
  });
}
function vgRenderCasinos(){
  const box = $("vg-casinos"); box.innerHTML = "";
  vg.casinos.forEach((cas, ci) => {
    let dots = "";
    vg.players.forEach((p, i) => { for (let k = 0; k < (cas.placed[i] || 0); k++) dots += '<i style="background:' + p.color + '"></i>'; });
    const stack = cas.stack.length ? cas.stack.join("·") + "만" : "—";
    box.innerHTML += '<div class="lv-slot"><div class="face">' + VG_FACE[ci] + " " + (ci + 1) + '번</div><div class="prize" style="font-size:14px">' + stack + '</div><div class="dots">' + dots + '</div></div>';
  });
}
function vgDiceHtml(counts){
  let h = "";
  for (let f = 1; f <= 6; f++) for (let k = 0; k < counts[f]; k++) h += '<span class="lv-die land">' + VG_FACE[f - 1] + "</span>";
  return h;
}
function vgRenderFaces(){
  const box = $("vg-faces"); box.innerHTML = "";
  for (let f = 1; f <= 6; f++){
    const c = vg.roll.counts[f];
    const b = document.createElement("button");
    b.innerHTML = VG_FACE[f - 1] + '<div class="fl">' + f + '번</div>' + (c ? '<span class="cnt">' + c + "</span>" : "");
    b.disabled = !c;
    if (c) b.addEventListener("click", () => { haptic(12); vgAct({ act: "place", face: f }); });
    box.appendChild(b);
  }
}
function vgRender(){
  if (vg.phase === "setup"){ vgShow("vg-setup"); return; }
  if (vg.phase === "end"){ vgEnd(); return; }
  vgRenderStrip("vg-strip");
  vgRenderCasinos();
  $("vg-round-tag").textContent = "ROUND " + vg.round + "/" + vg.rounds;
  if (vg.phase === "settle"){ vgShow("vg-settle"); vgRenderSettle(); return; }
  /* phase turn */
  vgShow("vg-turn");
  const actor = vg.players[vg.turn], mine = vgMyTurn();
  $("vg-turn-name").textContent = actor.name + (vgMode === "multi" && mine ? " (나)" : "");
  const roll = $("vg-roll"), tray = $("vg-tray"), faces = $("vg-faces"), wait = $("vg-wait");
  if (!vg.roll){
    tray.innerHTML = ""; faces.style.display = "none";
    if (mine){
      roll.style.display = ""; wait.style.display = "none";
      roll.onclick = () => { haptic(20); vgAct({ act: "roll" }); };
      $("vg-roll-msg").textContent = "남은 주사위 " + actor.dice + "개를 전부 굴려!";
    } else {
      roll.style.display = "none"; wait.style.display = "";
      wait.textContent = actor.name + "가 굴리는 중…"; $("vg-roll-msg").textContent = "";
    }
  } else {
    roll.style.display = "none"; tray.innerHTML = vgDiceHtml(vg.roll.counts);
    if (mine){
      wait.style.display = "none";
      $("vg-roll-msg").innerHTML = "한 눈만 골라 <b>전부</b> 그 카지노에 배치!";
      vgRenderFaces(); faces.style.display = "";
    } else {
      faces.style.display = "none"; wait.style.display = "";
      wait.textContent = actor.name + "가 배치 중…"; $("vg-roll-msg").textContent = "";
    }
  }
}
function vgRenderSettle(){
  $("vg-settle-tag").textContent = "ROUND " + vg.round + " 정산!";
  const list = $("vg-settle-list"); list.innerHTML = "";
  vg.settleInfo.forEach((info) => {
    const detail = vg.players.map((p, i) => info.placed[i] ? escHtml(p.name) + " " + info.placed[i] : null).filter(Boolean).join(" · ") || "배치 없음";
    const pay = info.pays.length
      ? info.pays.map((pp) => '<span style="color:var(--steppe)">🏆 ' + escHtml(vg.players[pp.pi].name) + " +" + pp.amt + "만</span>").join(" · ")
      : '<span style="color:var(--danger)">💨 동률/무배치 — 상금 소멸</span>';
    list.innerHTML += '<div class="mb-teamcard"><b>' + VG_FACE[info.face - 1] + " " + info.face + "번 — 💰" + info.stack.join("·") + "만</b><span>" + detail + "<br>" + pay + "</span></div>";
  });
  vgRenderStrip("vg-settle-strip");
  const canDrive = vgMode !== "multi" || mpAmHost();
  $("vg-next-round").textContent = vg.round < vg.rounds ? "다음 라운드 →" : "최종 결과 →";
  $("vg-next-round").style.display = canDrive ? "" : "none";
  $("vg-settle-wait").style.display = canDrive ? "none" : "";
  $("vg-next-round").onclick = () => vgApply({ act: "next" });
}
function vgEnd(){
  vgShow("vg-end");
  const rank = vg.players.map((p) => ({ n: p.name, s: p.money })).sort((a, b) => b.s - a.s);
  const medals = ["🥇", "🥈", "🥉"];
  $("vg-rank").innerHTML = '<div class="lbl">💰 상금 랭킹</div><div class="val" style="font-size:18px;line-height:2">' +
    rank.map((r, i) => (medals[i] || "·") + " " + escHtml(r.n) + " — 💰" + r.s + "만").join("<br>") + "</div>";
  $("vg-again").style.display = vgMode === "multi" ? "none" : "";
}

/* ---------- 셋업 · core.js resetGame("vg") 진입점 ---------- */
function vgReset(){
  if (vgMode === "multi" && !mpLive()) vgMode = "solo"; /* 연결 끊기면 폰 하나로 */
  vg.net = null; vg.phase = "setup";
  vgShow("vg-setup");
  snModeBar($("vg-setup"), vgMode, (m) => { vgMode = m; vgReset(); });
  const box = $("vg-players");
  if (vgMode === "multi"){
    const names = mpNames();
    $("vg-players-label").textContent = "이 방 참가자 (" + names.length + "명)";
    box.innerHTML = names.map((n) => '<button class="sel" disabled>' + escHtml(n) + "</button>").join("");
  } else {
    $("vg-players-label").textContent = "참여자 선택 (2~6명)";
    box.innerHTML = "";
    vg.sel = roster.slice(0, 6);
    roster.forEach((n) => {
      const b = document.createElement("button");
      b.textContent = n;
      if (vg.sel.includes(n)) b.classList.add("sel");
      b.addEventListener("click", () => {
        if (vg.sel.includes(n)) vg.sel = vg.sel.filter((x) => x !== n);
        else if (vg.sel.length < 6) vg.sel.push(n);
        else return alert("최대 6명까지!");
        b.classList.toggle("sel", vg.sel.includes(n));
      });
      box.appendChild(b);
    });
  }
}
function vgStartSolo(){
  if (vg.sel.length < 2) return alert("2명 이상 선택!");
  vg.players = vg.sel.map((n, i) => ({ name: n, color: VG_COLORS[i % 6], dice: 8, money: 0 }));
  vg.round = 1; vg.starter = 0; vg.net = null;
  vgNewRound(); vgRender();
}

/* ---------- 로드시 바인딩 (브라우저에서만) ---------- */
if (typeof document !== "undefined"){
  $("vg-rounds").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    $("vg-rounds").querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel"); vg.rounds = +b.dataset.r;
  }));
  $("vg-start").addEventListener("click", () => { if (vgMode === "multi") vgStartMulti(); else vgStartSolo(); });
  $("vg-again").addEventListener("click", vgReset);
}

/* node 단위 테스트용 — 순수 로직만 노출 */
if (typeof module !== "undefined") module.exports = { vgWinnerOrder, vgDeal };
