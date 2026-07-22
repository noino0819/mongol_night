"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("omok", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>⚫ 오목</h2></div>
    <div class="omok-info">
      <div class="omok-turn" id="omok-turn"><span class="stone" style="background:#222"></span>흑돌 차례</div>
      <div class="field" style="margin:0"><div class="seg" id="omok-size">
        <button data-size="11" class="sel">11줄</button><button data-size="13">13줄</button>
      </div></div>
    </div>
    <div class="field" style="margin-bottom:10px"><div class="seg" id="omok-rule">
      <button data-rule="free" class="sel">자유룰</button><button data-rule="renju">렌주룰 (흑 금수)</button>
    </div>
    <p class="hint" id="omok-rule-hint" style="display:none;margin:8px 0 0">흑(선공)은 <b>삼삼·사사·장목(6목 이상)</b>에 둘 수 없어요. 금수 자리는 ❌로 표시됩니다. 선공 필승법 방지용 정식 룰!</p></div>
    <canvas id="omok-canvas"></canvas>
    <div class="omok-btns">
      <button class="btn ghost" id="omok-undo">한 수 무르기</button>
      <button class="btn" id="omok-new">새 게임</button>
    </div>
  `);
snAddCss(`/* ---------- 오목 ---------- */
  .omok-info{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
  .omok-turn{font-size:16px;font-weight:800}
  .omok-turn .stone{display:inline-block;width:16px;height:16px;border-radius:50%;vertical-align:-2px;margin-right:7px;border:1px solid #888}
  #omok-canvas{display:block;width:100%;border-radius:14px;touch-action:manipulation}
  .omok-btns{display:flex;gap:8px;margin-top:12px}`);
/* ================= 오목 =================
   폰 하나(solo): 한 폰에서 흑/백 번갈아 착수(기존 그대로).
   여러 폰(multi): 두 폰에 같은 보드 동기화 — 호스트=흑(선), 첫 게스트=백.
   호스트가 심판: 유효성·착수 반영·승리 판정 후 보드 전체를 broadcast → 양쪽 갱신.
   (원격 값은 board(숫자배열)·turn·r,c(정수)뿐 — innerHTML에 원격 문자열을 넣지 않음.) */
let om = { size: 11, board: [], turn: 1, history: [], over: false, canvas: null, ctx: null, rule: "free" };
let omMode = "solo";   /* "solo"=폰 하나 · "multi"=여러 폰 */
let omMyColor = 0;     /* 내 돌: 1=흑(호스트) · 2=백(첫 게스트) · 0=관전/미배정 */
const OM_DIRS = [[0,1],[1,0],[1,1],[1,-1]];
(function initOmok(){
  om.canvas = $("omok-canvas");
  om.ctx = om.canvas.getContext("2d");
  $("omok-size").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      if (omGuestLocked()) return;                 /* 여러 폰 게스트는 호스트 보드만 따름 */
      $("omok-size").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      om.size = parseInt(b.dataset.size, 10);
      omokNew();
    });
  });
  $("omok-rule").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      if (omGuestLocked()) return;
      $("omok-rule").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      om.rule = b.dataset.rule;
      $("omok-rule-hint").style.display = om.rule === "renju" ? "" : "none";
      omokNew();
    });
  });
  $("omok-new").addEventListener("click", omokNew);
  $("omok-undo").addEventListener("click", () => {
    if (omMode === "multi") return;                /* 무르기는 폰 하나 모드만 */
    if (!om.history.length || om.over) return;
    const [r, c] = om.history.pop();
    om.board[r][c] = 0;
    om.turn = om.turn === 1 ? 2 : 1;
    omokDraw(); omokTurnLabel();
  });
  om.canvas.addEventListener("pointerdown", (e) => {
    if (om.over) return;
    const rect = om.canvas.getBoundingClientRect();
    const cell = rect.width / (om.size + 1);
    const c = Math.round((e.clientX - rect.left) / cell) - 1;
    const r = Math.round((e.clientY - rect.top) / cell) - 1;
    if (r < 0 || c < 0 || r >= om.size || c >= om.size || om.board[r][c]) return;
    if (omMode === "multi"){
      if (om.turn !== omMyColor){ omHint("상대 차례야"); return; }
      if (mpAmHost()){ if (omApply(r, c)) omBroadcastState(); }
      else mpToHost({ t: "move", r, c });          /* 게스트: 호스트 심판 대기 (로컬 반영 X) */
      return;
    }
    omApply(r, c);                                  /* 폰 하나: 즉시 반영 */
  });
})();
/* 착수 적용 (om.turn 색으로 (r,c)에 둠) — 렌주 금수/승리 판정 포함. 성공 true, 금수로 반려 false. */
function omApply(r, c){
  om.board[r][c] = om.turn;
  /* 렌주룰: 흑은 정확히 5목이 아니면 금수 검사 */
  if (om.rule === "renju" && om.turn === 1 && !omExactFive(r, c)){
    const foul = omFoulType(r, c);
    if (foul){ om.board[r][c] = 0; omFoulToast(foul); return false; }
  }
  om.history.push([r, c]);
  omokDraw();
  const won = (om.rule === "renju" && om.turn === 1) ? omExactFive(r, c) : omokWin(r, c);
  if (won){ om.over = true; omWinLabel(); snSfx("win"); return true; }
  om.turn = om.turn === 1 ? 2 : 1;
  omokTurnLabel();
  omokDraw();
  snSfx("pop");                                    /* 착수 */
  return true;
}
function omFoulToast(foul){
  const t = $("omok-turn");
  t.innerHTML = "🚫 금수! <b style='color:var(--danger)'>" + foul + "</b> — 다른 곳에 두세요";
  clearTimeout(om._toastId);
  om._toastId = setTimeout(omokTurnLabel, 1600);
}
/* 여러 폰: 내 차례 아닐 때 탭하면 잠깐 안내 (상단 라벨 재사용) */
function omHint(msg){
  const t = $("omok-turn");
  t.textContent = msg;
  clearTimeout(om._toastId);
  om._toastId = setTimeout(() => { om.over ? omWinLabel() : omokTurnLabel(); }, 1100);
}
function omAt(r, c){
  if (r < 0 || c < 0 || r >= om.size || c >= om.size) return -1;
  return om.board[r][c];
}
/* (r,c) 흑돌 기준, 방향 d의 연속 run 길이 */
function omRun(r, c, dr, dc){
  let n = 1;
  for (let k = 1;; k++){ if (omAt(r + dr*k, c + dc*k) !== 1) break; n++; }
  for (let k = 1;; k++){ if (omAt(r - dr*k, c - dc*k) !== 1) break; n++; }
  return n;
}
function omExactFive(r, c){ return OM_DIRS.some(([dr, dc]) => omRun(r, c, dr, dc) === 5); }
function omOverline(r, c){ return OM_DIRS.some(([dr, dc]) => omRun(r, c, dr, dc) >= 6); }
/* 방향 d에서 '넷'(한 수로 정확한 5 완성 가능) 집합 수집. 4돌 좌표 세트로 중복 제거(열린 4는 1개로 취급) */
function omFoursInDir(r, c, dr, dc, acc){
  for (let off = -5; off <= 5; off++){
    const er = r + dr*off, ec = c + dc*off;
    if (omAt(er, ec) !== 0) continue;
    om.board[er][ec] = 1;
    const run = omRun(er, ec, dr, dc);
    if (run === 5){
      /* 완성된 5가 (r,c)를 포함하는지 확인 후, 빈칸 er,ec 제외한 4돌을 키로 */
      let cells = [[er, ec]];
      for (let k = 1;; k++){ if (omAt(er + dr*k, ec + dc*k) !== 1) break; cells.push([er + dr*k, ec + dc*k]); }
      for (let k = 1;; k++){ if (omAt(er - dr*k, ec - dc*k) !== 1) break; cells.push([er - dr*k, ec - dc*k]); }
      const hasMe = cells.some(([a, b]) => a === r && b === c);
      if (hasMe){
        const key = dr + "," + dc + ":" + cells.filter(([a, b]) => !(a === er && b === ec))
          .map(([a, b]) => a + "-" + b).sort().join("|");
        acc.add(key);
      }
    }
    om.board[er][ec] = 0;
  }
}
/* 방향 d에서 열린 삼(한 수 추가로 '열린 4'가 되는) 여부 */
function omOpenThreeInDir(r, c, dr, dc){
  for (let off = -4; off <= 4; off++){
    const er = r + dr*off, ec = c + dc*off;
    if (omAt(er, ec) !== 0) continue;
    om.board[er][ec] = 1;
    let found = false;
    if (omRun(er, ec, dr, dc) === 4){
      /* run 4의 양 끝 좌표 계산 */
      let hi = 0, lo = 0;
      for (let k = 1;; k++){ if (omAt(er + dr*k, ec + dc*k) !== 1) break; hi = k; }
      for (let k = 1;; k++){ if (omAt(er - dr*k, ec - dc*k) !== 1) break; lo = k; }
      const cells = [];
      for (let k = -lo; k <= hi; k++) cells.push([er + dr*k, ec + dc*k]);
      const hasMe = cells.some(([a, b]) => a === r && b === c);
      /* 열린 4 조건: 양 끝 바로 옆이 빈칸 + 그 너머가 흑이 아님(정확 5 가능) */
      const e1r = er + dr*(hi+1), e1c = ec + dc*(hi+1);
      const e2r = er - dr*(lo+1), e2c = ec - dc*(lo+1);
      const open1 = omAt(e1r, e1c) === 0 && omAt(e1r + dr, e1c + dc) !== 1;
      const open2 = omAt(e2r, e2c) === 0 && omAt(e2r - dr, e2c - dc) !== 1;
      if (hasMe && open1 && open2) found = true;
    }
    om.board[er][ec] = 0;
    if (found) return true;
  }
  return false;
}
/* 금수 판정: (r,c)에 흑돌이 이미 놓인 상태에서 호출 */
function omFoulType(r, c){
  if (omOverline(r, c)) return "장목 (6목)";
  const fours = new Set();
  OM_DIRS.forEach(([dr, dc]) => omFoursInDir(r, c, dr, dc, fours));
  if (fours.size >= 2) return "사사";
  let threes = 0;
  OM_DIRS.forEach(([dr, dc]) => { if (omOpenThreeInDir(r, c, dr, dc)) threes++; });
  if (threes >= 2) return "삼삼";
  return null;
}
function omIsForbidden(r, c){
  if (om.board[r][c] !== 0) return false;
  om.board[r][c] = 1;
  const foul = !omExactFive(r, c) && !!omFoulType(r, c);
  om.board[r][c] = 0;
  return foul;
}
/* 캔버스 실측/DPR 세팅 (보드 상태는 건드리지 않음) */
function omSizeCanvas(){
  const cssW = Math.min(394, document.querySelector(".app").clientWidth - 36);
  const dpr = window.devicePixelRatio || 1;
  om.canvas.style.width = cssW + "px"; om.canvas.style.height = cssW + "px";
  om.canvas.width = cssW * dpr; om.canvas.height = cssW * dpr;
  om.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
/* 보드 초기화(빈 판) + 다시그림 */
function omokNewBoard(){
  om.board = Array.from({ length: om.size }, () => Array(om.size).fill(0));
  om.turn = 1; om.history = []; om.over = false;
  omSizeCanvas();
  omokDraw(); omokTurnLabel();
}
/* core.js resetGame("omok") 진입점 + 새 게임/사이즈·룰 변경 공용 */
function omokNew(){
  if (omMode === "multi"){
    if (!mpLive()) omMode = "solo";                /* 연결 끊기면 폰 하나로 */
    else if (mpAmHost()){ omEnterMulti(false); return; }  /* 호스트: 판 리셋 + 재배포 */
    else { omRenderModeBar(); return; }            /* 게스트: 호스트 상태 유지(로컬 리셋 X) */
  }
  omMyColor = 0;
  omokNewBoard();
  omRenderModeBar();
}
function omokTurnLabel(){
  const t = $("omok-turn");
  t.style.color = "";
  const stone = '<span class="stone" style="background:' + (om.turn === 1 ? "#222" : "#F4EEE0") + '"></span>';
  let suffix = " 차례";
  if (omMode === "multi" && omMyColor) suffix += om.turn === omMyColor ? " · 내 턴" : " · 상대 턴";
  t.innerHTML = stone + (om.turn === 1 ? "흑돌" : "백돌") + suffix;
}
/* 승리 라벨 — 승리 시 turn을 안 넘겼으므로 om.turn = 승자 색 */
function omWinLabel(){
  const t = $("omok-turn");
  t.innerHTML = '<span class="stone" style="background:' + (om.turn === 1 ? "#222" : "#F4EEE0") + '"></span>'
    + (om.turn === 1 ? "흑돌" : "백돌") + " 승리! 🎉";
  t.style.color = "var(--fire)";
}
function omokDraw(){
  const w = parseFloat(om.canvas.style.width);
  const cell = w / (om.size + 1);
  const ctx = om.ctx;
  ctx.clearRect(0, 0, w, w);
  ctx.fillStyle = "#C8A05C";
  ctx.fillRect(0, 0, w, w);
  ctx.strokeStyle = "#5A4320"; ctx.lineWidth = 1;
  for (let i = 1; i <= om.size; i++){
    ctx.beginPath(); ctx.moveTo(cell, cell * i); ctx.lineTo(cell * om.size, cell * i); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cell * i, cell); ctx.lineTo(cell * i, cell * om.size); ctx.stroke();
  }
  const mid = Math.floor(om.size / 2) + 1;
  ctx.fillStyle = "#5A4320";
  ctx.beginPath(); ctx.arc(cell * mid, cell * mid, 3, 0, Math.PI * 2); ctx.fill();
  om.board.forEach((row, r) => row.forEach((v, c) => {
    if (!v) return;
    const x = cell * (c + 1), y = cell * (r + 1);
    ctx.beginPath(); ctx.arc(x, y, cell * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = v === 1 ? "#1A1A1A" : "#F7F2E6"; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.stroke();
  }));
  const last = om.history[om.history.length - 1];
  if (last){
    const x = cell * (last[1] + 1), y = cell * (last[0] + 1);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#FF7A45"; ctx.fill();
  }
  /* 렌주룰: 흑 차례에 금수 자리 ❌ 표시 */
  if (om.rule === "renju" && om.turn === 1 && !om.over){
    ctx.strokeStyle = "#C0392B"; ctx.lineWidth = 2;
    const s = cell * 0.2;
    for (let r = 0; r < om.size; r++) for (let c2 = 0; c2 < om.size; c2++){
      if (!omIsForbidden(r, c2)) continue;
      const x = cell * (c2 + 1), y = cell * (r + 1);
      ctx.beginPath(); ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s); ctx.stroke();
    }
    ctx.lineWidth = 1;
  }
}
function omokWin(r, c){
  const me = om.board[r][c];
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  return dirs.some(([dr, dc]) => {
    let n = 1;
    for (let k = 1; k < 5; k++){ const rr = r + dr*k, cc = c + dc*k; if (rr<0||cc<0||rr>=om.size||cc>=om.size||om.board[rr][cc]!==me) break; n++; }
    for (let k = 1; k < 5; k++){ const rr = r - dr*k, cc = c - dc*k; if (rr<0||cc<0||rr>=om.size||cc>=om.size||om.board[rr][cc]!==me) break; n++; }
    return n >= 5;
  });
}

/* ================= 여러 폰 (net.js 브릿지) ================= */
/* 여러 폰 세션 중인 게스트는 사이즈·룰·모드 토글을 못 만짐(호스트 보드만 따름) */
function omGuestLocked(){ return omMode === "multi" && typeof mpLive === "function" && mpLive() && !mpAmHost(); }
/* 모드 토글 마운트 지점(#omok-mode)을 topbar와 omok-info 사이에 한 번만 만든다 */
function omModeMount(){
  let host = $("omok-mode");
  if (!host){
    host = document.createElement("div");
    host.id = "omok-mode";
    const info = document.querySelector("#scr-omok .omok-info");
    info.parentNode.insertBefore(host, info);
  }
  return host;
}
function omRenderModeBar(){
  const host = omModeMount();
  if (omMode === "multi" && typeof mpLive === "function" && mpLive() && !mpAmHost()){ host.style.display = "none"; return; }
  host.style.display = "";
  snModeBar(host, omMode, (m) => {
    if (m === "multi"){
      if (!mpAmHost()){ alert("여러 폰 오목은 호스트 폰에서 시작해줘"); return; }
      omMode = "multi"; omEnterMulti(true); return;
    }
    omMode = "solo"; omMyColor = 0; omokNew();
  });
}
/* 보드 전체 상태를 전원에게 배포 (작아서 통째로 보내면 동기화가 단순) */
function omBroadcastState(){
  mpBroadcast({ t: "state", size: om.size, rule: om.rule, board: om.board, turn: om.turn, over: om.over, last: om.history[om.history.length - 1] || null });
}
/* 호스트: 여러 폰 세션 시작/리셋. doNav면 게스트들을 오목 화면으로 끌고 온다. */
function omEnterMulti(doNav){
  const names = mpNames();
  if (names.length < 2){
    alert("여러 폰 오목은 2명 연결이 필요해 (지금 " + names.length + "명)");
    omMode = "solo"; omMyColor = 0; omokNewBoard(); omRenderModeBar(); return;
  }
  omMyColor = 1;                                    /* 호스트 = 흑(선) */
  omokNewBoard();
  if (doNav) mpNav("omok");
  mp.game = { onMsg(from, m){ omHostRecv(from, m); }, onPeers(){ omRenderModeBar(); } };
  /* 색 배정: party 순서 = [호스트, 첫 게스트, …] → 첫 게스트만 백(2), 나머지는 관전(0) */
  mpParty().forEach((pl, i) => { if (!pl.self) pl.send({ t: "assign", color: i === 1 ? 2 : 0 }); });
  omBroadcastState();
  omRenderModeBar();
}
/* 호스트: 게스트 착수 수신 → 심판 */
function omHostRecv(from, m){
  if (!m || m.t !== "move" || om.over) return;
  if (om.turn !== 2) return;                        /* 백(게스트) 차례에만 게스트 착수 허용 */
  if (from !== mpNames()[1]) return;                /* 백=첫 게스트(mpNames[1]) — 그 폰이 보낸 것만 (vg.js:102 패턴, 관전자 착수 차단) */
  const r = m.r, c = m.c;
  if (!Number.isInteger(r) || !Number.isInteger(c)) return;
  if (r < 0 || c < 0 || r >= om.size || c >= om.size || om.board[r][c]) return;
  if (omApply(r, c)) omBroadcastState();
}
/* 게스트: 호스트 메시지 수신 */
function omGuestRecv(m){
  if (!m) return;
  if (m.t === "assign"){ omMyColor = m.color; if (!om.over) omokTurnLabel(); return; }
  if (m.t === "state"){ omApplyState(m); }
}
/* 게스트: 호스트가 보낸 보드 상태 그대로 반영 (단일 진실원) */
function omApplyState(m){
  om.size = m.size; om.rule = m.rule;
  om.board = m.board; om.turn = m.turn; om.over = m.over;
  om.history = m.last ? [m.last] : [];
  omSizeCanvas();
  omokDraw();
  if (om.over){ omWinLabel(); snSfx("win"); }      /* 게스트 폰: 호스트 판정 반영 */
  else { omokTurnLabel(); if (m.last) snSfx("pop"); }
}
/* 게스트 진입 훅 — 호스트가 mpNav("omok")로 끌고 오면 실행됨 */
window.__guest_omok = function(){
  omMode = "multi";
  omMyColor = 0;                                    /* assign 오면 갱신 */
  om.board = Array.from({ length: om.size }, () => Array(om.size).fill(0));
  om.turn = 1; om.history = []; om.over = false;
  omSizeCanvas();
  omokDraw();
  $("omok-turn").style.color = "";
  $("omok-turn").textContent = "호스트가 준비 중…";
  mp.game = { onMsg(from, m){ omGuestRecv(m); }, onPeers(){} };
  omRenderModeBar();                                /* 세션 게스트는 토글 숨김 */
};
snRegisterGame("omok", omokNew);
