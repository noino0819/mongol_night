"use strict";
/* ================= 오목 ================= */
let om = { size: 11, board: [], turn: 1, history: [], over: false, canvas: null, ctx: null, rule: "free" };
const OM_DIRS = [[0,1],[1,0],[1,1],[1,-1]];
(function initOmok(){
  om.canvas = $("omok-canvas");
  om.ctx = om.canvas.getContext("2d");
  $("omok-size").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      $("omok-size").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      om.size = parseInt(b.dataset.size, 10);
      omokNew();
    });
  });
  $("omok-rule").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      $("omok-rule").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      om.rule = b.dataset.rule;
      $("omok-rule-hint").style.display = om.rule === "renju" ? "" : "none";
      omokNew();
    });
  });
  $("omok-new").addEventListener("click", omokNew);
  $("omok-undo").addEventListener("click", () => {
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
    om.board[r][c] = om.turn;
    /* 렌주룰: 흑은 정확히 5목이 아니면 금수 검사 */
    if (om.rule === "renju" && om.turn === 1 && !omExactFive(r, c)){
      const foul = omFoulType(r, c);
      if (foul){
        om.board[r][c] = 0;
        omFoulToast(foul);
        return;
      }
    }
    om.history.push([r, c]);
    omokDraw();
    const won = (om.rule === "renju" && om.turn === 1) ? omExactFive(r, c) : omokWin(r, c);
    if (won){
      om.over = true;
      const t = $("omok-turn");
      t.innerHTML = '<span class="stone" style="background:' + (om.turn === 1 ? "#222" : "#F4EEE0") + '"></span>' + (om.turn === 1 ? "흑돌" : "백돌") + " 승리! 🎉";
      t.style.color = "var(--fire)";
      return;
    }
    om.turn = om.turn === 1 ? 2 : 1;
    omokTurnLabel();
    omokDraw();
  });
})();
function omFoulToast(foul){
  const t = $("omok-turn");
  t.innerHTML = "🚫 금수! <b style='color:var(--danger)'>" + foul + "</b> — 다른 곳에 두세요";
  clearTimeout(om._toastId);
  om._toastId = setTimeout(omokTurnLabel, 1600);
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
function omokNew(){
  om.board = Array.from({ length: om.size }, () => Array(om.size).fill(0));
  om.turn = 1; om.history = []; om.over = false;
  const cssW = Math.min(394, document.querySelector(".app").clientWidth - 36);
  const dpr = window.devicePixelRatio || 1;
  om.canvas.style.width = cssW + "px"; om.canvas.style.height = cssW + "px";
  om.canvas.width = cssW * dpr; om.canvas.height = cssW * dpr;
  om.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  omokDraw(); omokTurnLabel();
}
function omokTurnLabel(){
  const t = $("omok-turn");
  t.style.color = "";
  t.innerHTML = '<span class="stone" style="background:' + (om.turn === 1 ? "#222" : "#F4EEE0") + '"></span>' + (om.turn === 1 ? "흑돌" : "백돌") + " 차례";
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

