"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("vg", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>🎰 라스베가스</h2></div>
    <div id="vg-setup">
      <p class="hint">카지노 6곳(1~6번)에 주사위 8개로 배팅! 굴려서 나온 눈 중 <b>하나를 골라 전부</b> 그 번호 카지노에 올려. 카지노마다 <b>주사위 최다 순서로 지폐를 나눠 갖는데</b>, <b style="color:var(--danger)">1등이 동률이면 그들끼리 상쇄(꽝)</b> — 다음 순서가 챙겨. 라운드 끝나면 💰 최다 부자 승!</p>
      <div class="field"><label id="vg-players-label">참여자 선택 (2~6명)</label><div class="seg" id="vg-players"></div></div>
      <div class="field"><label>라운드 수</label><div class="seg" id="vg-rounds">
        <button data-r="3">3라운드</button><button data-r="4" class="sel">4라운드</button>
      </div></div>
      <button class="btn" id="vg-start">🎲 게임 시작!</button>
    </div>
    <div id="vg-turn" style="display:none">
      <div class="mb-strip" id="vg-strip"></div>
      <div class="vg-casinos" id="vg-casinos"></div>
      <div class="stage-center" style="flex:0;gap:6px;margin:14px 0 10px">
        <span class="tag" id="vg-round-tag">ROUND 1</span>
        <div class="who" id="vg-turn-name" style="font-size:30px">-</div>
        <div class="hint" id="vg-roll-msg" style="margin:0"></div>
      </div>
      <button class="btn" id="vg-roll">🎲 굴리기!</button>
      <div class="lv-tray" id="vg-tray"></div>
      <div class="lv-faces vg-faces" id="vg-faces" style="display:none"></div>
      <div class="hint" id="vg-wait" style="display:none;text-align:center"></div>
    </div>
    <div id="vg-settle" style="display:none">
      <div class="stage-center" style="flex:0;gap:6px;margin-bottom:10px"><span class="tag" id="vg-settle-tag">정산!</span></div>
      <div id="vg-settle-list"></div>
      <div class="mb-strip" id="vg-settle-strip" style="margin-top:12px"></div>
      <button class="btn mt" id="vg-next-round">다음 라운드 →</button>
      <p class="hint" id="vg-settle-wait" style="display:none;text-align:center">호스트가 다음 라운드를 시작하길 기다리는 중…</p>
    </div>
    <div id="vg-end" style="display:none" class="stage-center">
      <span class="tag">최종 결과</span>
      <div class="reveal-card" id="vg-rank"></div>
      <button class="btn" id="vg-again">다시 하기</button>
    </div>
  `);
snAddCss(`/* 라스베가스: 카지노 6곳·눈 6면 → 3열 그리드 (lv-slot·lv-faces 재사용) */
  .vg-casinos{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:4px 0 8px}
  .vg-faces{grid-template-columns:repeat(3,1fr)}`);
/* ================= 라스베가스 (vg) =================
   카지노 6곳(눈 1~6)에 주사위 8개로 배팅. 굴려서 나온 눈 하나를 골라 전부 그 카지노에 배치.
   카지노마다 주사위 최다 순서로 지폐 스택을 나눠 갖되, 1위 동률이면 그들끼리 상쇄(꽝) 후 차순위가 챙긴다.
   한 상태머신으로 폰 하나(solo)와 여러 폰(multi)을 공유. multi는 net.js 브릿지 사용 —
   호스트가 유일 권위·유일 RNG, 매 변화마다 전체 상태를 브로드캐스트, 게스트는 자기 차례에 액션만 되쏨.
   검증: node tools/vg-check.mjs (vgWinnerOrder·vgDeal 순수 로직).
   ponytail: 상태 델타 없이 전체 브로드캐스트(상태 작음). 재연결 없음(mp 정책 그대로). */

const VG_COLORS = ["var(--fire)", "var(--steppe)", "var(--danger)", "var(--dim)", "var(--milk)", "var(--ember)"];
const VG_FACE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
let vgMode = null; /* 유저 토글 선택(null=자동) — 셋업의 실제 모드는 snMode(vgMode). 게임 중엔 vgStartMulti/__guest_vg가 "multi"로 확정 */
let vg = { phase: "setup", players: [], casinos: [], rounds: 4, round: 1, turn: 0, starter: 0, roll: null, rollSeq: 0, settleInfo: null, net: null, sel: [] };
let vgAnim = { seq: 0, iv: 0, timers: [] }; /* 주사위 굴림 연출 — seq는 이미 재생한 굴림 번호(상태 재동기화 때 재재생 방지), 로컬 전용 */

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
  vg.rollSeq++; /* 새 굴림 표식 — 모든 폰이 이 번호로 연출 1회만 재생 */
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
  else if (action.act === "end"){ vg.phase = "end"; }   /* 호스트 탈출: 이탈로 턴이 멈췄을 때 현재 상금 순으로 즉시 종료 */
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
  vgMode = "multi";                            /* 게임 중 비교(vgMyTurn·브로드캐스트)가 이 값을 본다 */
  vg.players = names.map((n, i) => ({ name: String(n).slice(0, 8), color: VG_COLORS[i % 6], dice: 8, money: 0 }));
  vg.round = 1; vg.starter = 0; vg.rollSeq = 0; vg.net = { me: 0 }; vgAnim.seq = 0;
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
  vgClearDiceAnim(); vgAnim.seq = 0;
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
function vgClearDiceAnim(){ clearInterval(vgAnim.iv); vgAnim.iv = 0; vgAnim.timers.forEach(clearTimeout); vgAnim.timers = []; }
/* 굴림 연출: 전부 텀블 → 하나씩 착지(햅틱) → 끝나면 배치 UI. counts는 이미 방송된 결과라 모든 폰이 동일하게 재생. */
function vgPlayRoll(counts, mine, actor){
  vgClearDiceAnim();
  const vals = shuffle([].concat(...[1, 2, 3, 4, 5, 6].map((f) => Array(counts[f]).fill(f)))); /* 눈별 개수 → 섞은 주사위 배열 */
  const tray = $("vg-tray");
  tray.innerHTML = vals.map(() => '<span class="lv-die tumbling">⚅</span>').join("");
  const dice = [...tray.children];
  $("vg-faces").style.display = "none"; $("vg-wait").style.display = "none";
  $("vg-roll-msg").textContent = actor.name + " 굴리는 중…";
  haptic(20);
  let ticks = 0;
  vgAnim.iv = setInterval(() => {
    dice.forEach((d) => { if (d.classList.contains("tumbling")) d.textContent = VG_FACE[Math.floor(Math.random() * 6)]; });
    if (++ticks % 3 === 0) haptic(8);
    if (ticks >= 9){ clearInterval(vgAnim.iv); vgAnim.iv = 0; land(0); }
  }, 70);
  function land(i){
    if (i >= dice.length){ done(); return; }
    const d = dice[i];
    d.classList.remove("tumbling"); d.classList.add("land");
    d.textContent = VG_FACE[vals[i] - 1];
    haptic(14);
    vgAnim.timers.push(setTimeout(() => land(i + 1), 90));
  }
  function done(){
    if (mine){
      $("vg-roll-msg").innerHTML = "한 눈만 골라 <b>전부</b> 그 카지노에 배치!";
      vgRenderFaces(); $("vg-faces").style.display = "";
    } else {
      $("vg-wait").style.display = ""; $("vg-wait").textContent = actor.name + "가 배치 중…";
      $("vg-roll-msg").textContent = "";
    }
  }
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
/* 여러 폰: 현 차례 게스트가 이탈하면 턴이 멈춘다 — 호스트만 보이는 즉시 종료 버튼 (idempotent, vg-turn 내부라 다른 단계선 자동 숨김) */
function vgHostEscape(show){
  let b = $("vg-host-end");
  if (!b){
    b = document.createElement("button");
    b.id = "vg-host-end"; b.className = "btn ghost"; b.style.marginTop = "10px";
    b.textContent = "게임 끝내기 (현재 상금 순 정산)";
    b.addEventListener("click", () => snConfirm("💰", "게임을 끝낼까요?", "지금까지 상금이 많은 사람이 승리!", "끝내기", () => vgApply({ act: "end" })));
    $("vg-turn").appendChild(b);
  }
  b.style.display = show ? "" : "none";
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
  vgHostEscape(vgMode === "multi" && mpAmHost() && !mine); /* 남 차례 대기 중 이탈 스톨 대비 호스트 탈출 버튼 */
  const roll = $("vg-roll"), tray = $("vg-tray"), faces = $("vg-faces"), wait = $("vg-wait");
  if (!vg.roll){
    vgClearDiceAnim();
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
    roll.style.display = "none";
    if (vg.rollSeq !== vgAnim.seq){
      vgAnim.seq = vg.rollSeq;              /* 이 굴림 첫 렌더 → 연출 재생 */
      vgPlayRoll(vg.roll.counts, mine, actor);
    } else {                                /* 재동기화 등 재렌더 → 최종 상태 정적 표시 */
      vgClearDiceAnim();
      tray.innerHTML = vgDiceHtml(vg.roll.counts);
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
  const vgM = snMode(vgMode);
  if (vgMode === "multi" && !mpLive()) vgMode = null;   /* 게임 중 확정된 multi는 연결 끊기면 자동으로 되돌림 */
  vgClearDiceAnim(); vgAnim.seq = 0;
  vg.net = null; vg.phase = "setup";
  vgShow("vg-setup");
  snModeBar($("vg-setup"), vgM, (m) => { vgMode = m; vgReset(); });
  const box = $("vg-players");
  if (vgM === "multi"){
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
  vg.round = 1; vg.starter = 0; vg.rollSeq = 0; vg.net = null; vgAnim.seq = 0;
  vgNewRound(); vgRender();
}

/* ---------- 로드시 바인딩 (브라우저에서만) ---------- */
if (typeof document !== "undefined"){
  $("vg-rounds").querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    $("vg-rounds").querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel"); vg.rounds = +b.dataset.r;
  }));
  $("vg-start").addEventListener("click", () => { if (snMode(vgMode) === "multi") vgStartMulti(); else vgStartSolo(); });
  $("vg-again").addEventListener("click", vgReset);
}

/* node 단위 테스트용 — 순수 로직만 노출 */
if (typeof module !== "undefined") module.exports = { vgWinnerOrder, vgDeal };
snRegisterGame("vg", vgReset);
