"use strict";
/* ================= 룰렛 ================= */
let spinning = false;
$("rou-spin").addEventListener("click", () => {
  if (spinning || roster.length < 2) return;
  spinning = true;
  $("rou-penalty").textContent = "";
  const el = $("rou-name");
  const winner = roster[Math.floor(Math.random() * roster.length)];
  let ticks = 0, total = 22 + Math.floor(Math.random() * 8), delay = 55;
  (function tick(){
    el.textContent = roster[ticks % roster.length];
    ticks++;
    if (ticks < total){ delay *= 1.09; setTimeout(tick, delay); }
    else { el.textContent = "🎉 " + winner; spinning = false; }
  })();
});
$("rou-penalty-btn").addEventListener("click", () => {
  if (spinning) return;
  $("rou-penalty").textContent = "벌칙: " + PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
});

/* 벌칙 목록 보기 / 직접 수정 (localStorage 저장, 룰렛·폭탄 공용) */
$("rou-list-btn").addEventListener("click", () => {
  const panel = $("rou-list-panel");
  panel.hidden = !panel.hidden;
  if (!panel.hidden) { $("rou-list-edit").value = PENALTIES.join("\n"); $("rou-list-saved").textContent = ""; }
});
$("rou-list-save").addEventListener("click", () => {
  const list = $("rou-list-edit").value.split("\n").map(s => s.trim()).filter(Boolean);
  if (!list.length) { $("rou-list-saved").textContent = "최소 1개는 있어야 해"; return; }
  PENALTIES = list;
  try { localStorage.setItem(PENALTY_KEY, JSON.stringify(list)); } catch (e) { /* 무시 */ }
  $("rou-list-edit").value = list.join("\n");
  $("rou-list-saved").textContent = "저장됨 · " + list.length + "개";
});
$("rou-list-reset").addEventListener("click", () => {
  PENALTIES = PENALTY_DEFAULTS.slice();
  try { localStorage.removeItem(PENALTY_KEY); } catch (e) { /* 무시 */ }
  $("rou-list-edit").value = PENALTIES.join("\n");
  $("rou-list-saved").textContent = "기본값으로 복원됨";
});

