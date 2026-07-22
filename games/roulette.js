"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("roulette", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>🎯 복불복 룰렛</h2></div>
    <div class="stage-center">
      <span class="tag" id="rou-tag">오늘의 주인공은?</span>
      <div class="roulette-name" id="rou-name">···</div>
      <div class="penalty" id="rou-penalty"></div>
      <button class="btn" id="rou-spin">돌리기!</button>
      <button class="btn ghost" id="rou-penalty-btn">벌칙도 뽑기</button>
      <button class="btn ghost" id="rou-list-btn">벌칙 목록 / 수정</button>
      <div class="pen-panel" id="rou-list-panel" hidden>
        <p class="pen-hint">한 줄에 벌칙 하나. 룰렛·폭탄 게임 공용으로 쓰여.</p>
        <textarea class="pen-edit" id="rou-list-edit" rows="10" spellcheck="false" autocapitalize="off"></textarea>
        <div class="pen-actions">
          <button class="btn" id="rou-list-save">저장</button>
          <button class="btn ghost" id="rou-list-reset">기본값 복원</button>
        </div>
        <div class="pen-saved" id="rou-list-saved"></div>
      </div>
    </div>
  `);
snAddCss(`.penalty{font-size:18px;font-weight:700;color:var(--fire);min-height:28px;line-height:1.5;word-break:keep-all}
  .rou-confetti{position:absolute;top:42%;font-size:30px;pointer-events:none;will-change:transform,opacity;animation:rouConf 1.2s ease-out forwards}
  .pen-panel{width:100%;margin-top:12px;text-align:left}
  .pen-hint{font-size:12px;color:var(--dim);margin:0 0 8px}
  .pen-edit{width:100%;box-sizing:border-box;background:var(--night2);color:var(--milk);border:1px solid var(--line);border-radius:12px;padding:12px;font-family:inherit;font-size:15px;line-height:1.7;resize:vertical}
  .pen-actions{display:flex;gap:10px;margin-top:10px}
  .pen-saved{font-size:13px;color:var(--steppe);font-weight:700;min-height:20px;margin-top:8px;text-align:center}`);
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
    if (ticks < total){ delay *= 1.09; if (delay > 110) snSfx("spin"); setTimeout(tick, delay); } // ponytail: 초반 빠른 구간은 스킵, 감속(느려지는) 구간만 틱 — 남발 방지
    else {
      const r = ROU_HITS[Math.floor(Math.random() * ROU_HITS.length)];
      $("rou-tag").textContent = r.q;
      el.innerHTML = r.e + " " + escHtml(winner);
      void el.offsetWidth;                      // 애니메이션 재시작 강제
      el.classList.add(ROU_ANIMS[Math.floor(Math.random() * ROU_ANIMS.length)]);
      rouBurst(r.e);
      snSfx("reveal");
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
snRegisterGame("roulette", function(){ $("rou-name").textContent="···"; $("rou-name").className="roulette-name"; $("rou-penalty").textContent=""; $("rou-tag").textContent="오늘의 주인공은?"; });
