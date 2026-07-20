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

