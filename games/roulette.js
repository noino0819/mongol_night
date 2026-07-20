"use strict";
/* ================= 룰렛 ================= */
/* 당첨 리액션 — 매번 랜덤으로 골라 웃긴 문구 + 이모지 + 애니메이션이 다르게 나옴 */
const ROU_HITS = [
  { e: "🎉", q: "당첨! 축하해" },
  { e: "💀", q: "오늘 넌 못 도망가" },
  { e: "👑", q: "오늘의 주인공 등장" },
  { e: "🎯", q: "딱 걸렸다" },
  { e: "🔥", q: "운명이 골랐어" },
  { e: "😈", q: "미안하지만 너야" },
  { e: "🍗", q: "제물로 선정됨" },
  { e: "🫵", q: "바로 너, 도망 금지" },
  { e: "🎲", q: "주사위 신의 선택" },
  { e: "🚨", q: "당첨자 검거 완료" },
  { e: "⚡", q: "하늘이 점지했다" },
  { e: "🥹", q: "그냥 받아들여" },
];
const ROU_ANIMS = ["rhit1", "rhit2", "rhit3", "rhit4"];

function rouBurst(emoji){
  const stage = $("rou-name").parentElement;
  for (let i = 0; i < 9; i++){
    const s = document.createElement("span");
    s.className = "rou-confetti";
    s.textContent = emoji;
    s.style.left = (15 + Math.random() * 70) + "%";
    s.style.animationDelay = (Math.random() * 0.18).toFixed(2) + "s";
    s.style.setProperty("--dx", (Math.random() * 120 - 60).toFixed(0) + "px");
    s.style.setProperty("--rot", (Math.random() * 120 - 60).toFixed(0) + "deg");
    stage.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}

let spinning = false;
$("rou-spin").addEventListener("click", () => {
  if (spinning || roster.length < 2) return;
  spinning = true;
  $("rou-tag").textContent = "돌리는 중…";       // 벌칙(rou-penalty)은 안 지움 — 돌리는 동안 계속 보이게
  const el = $("rou-name");
  el.className = "roulette-name";               // 이전 이펙트 클래스 제거
  const winner = roster[Math.floor(Math.random() * roster.length)];
  let ticks = 0, total = 22 + Math.floor(Math.random() * 8), delay = 55;
  (function tick(){
    el.textContent = roster[ticks % roster.length];
    ticks++;
    if (ticks < total){ delay *= 1.09; setTimeout(tick, delay); }
    else {
      const r = ROU_HITS[Math.floor(Math.random() * ROU_HITS.length)];
      $("rou-tag").textContent = r.q;
      el.innerHTML = r.e + " " + escHtml(winner);
      void el.offsetWidth;                      // 애니메이션 재시작 강제
      el.classList.add(ROU_ANIMS[Math.floor(Math.random() * ROU_ANIMS.length)]);
      rouBurst(r.e);
      spinning = false;
    }
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

