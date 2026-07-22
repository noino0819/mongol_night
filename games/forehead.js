"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("forehead", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>🎤 이마 퀴즈</h2></div>
    <div id="fh-setup">
      <p class="hint">한 명이 폰을 이마에 대면(화면이 남들을 향하게!) 나머지가 말과 몸짓으로 설명해요. 맞히면 오른쪽 <b style="color:var(--steppe)">정답</b>, 모르겠으면 왼쪽 <b style="color:var(--fire)">패스</b>를 탭. 제한시간 안에 몇 개 맞히나! <b>가로 모드</b>면 글자가 왕커져서 멀리서도 잘 보여요</p>
      <div class="field"><label>카테고리</label><div class="seg" id="fh-cats"></div></div>
      <div class="field"><label>제한시간</label><div class="seg" id="fh-times">
        <button data-t="60" class="sel">60초</button><button data-t="90">90초</button><button data-t="120">120초</button>
      </div></div>
      <div class="field"><label>화면 방향</label><div class="seg" id="fh-orient">
        <button data-o="land" class="sel">📺 가로 (왕크게)</button><button data-o="port">세로</button>
      </div></div>
      <button class="btn mt" id="fh-start">이마에 대고 시작!</button>
    </div>
    <div id="fh-game" style="display:none" class="fh-stage">
      <div class="fh-top"><span id="fh-score">0개 정답</span><span id="fh-timer">60</span><button class="fh-quit" id="fh-quit">✕ 끝내기</button></div>
      <div class="fh-word-area" id="fh-area"><div class="fh-word" id="fh-word">준비!</div></div>
      <div class="fh-controls">
        <button class="fh-pass" id="fh-pass">◀ 패스</button>
        <button class="fh-ok" id="fh-ok">정답! ▶</button>
      </div>
    </div>
    <div id="fh-result" style="display:none" class="stage-center">
      <span class="tag">결과</span>
      <div class="big-word" id="fh-final"></div>
      <div class="fh-list" id="fh-history"></div>
      <button class="btn" id="fh-again">다음 사람 도전!</button>
    </div>
  `);
snAddCss(`/* ---------- 이마 퀴즈 ---------- */
  .fh-stage{flex:1;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;border:1px solid var(--line);min-height:440px;position:relative}
  .fh-word-area{flex:1;display:flex;align-items:center;justify-content:center;background:var(--night2);text-align:center;padding:20px}
  .fh-word{font-size:46px;font-weight:800;word-break:keep-all;line-height:1.3}
  .fh-controls{display:flex;height:120px}
  .fh-pass,.fh-ok{flex:1;border:none;font-family:inherit;font-size:19px;font-weight:800;cursor:pointer}
  .fh-pass{background:#3A3324;color:var(--fire)}
  .fh-ok{background:#1E4633;color:var(--steppe)}
  .fh-top{display:flex;justify-content:space-between;padding:12px 16px;background:var(--card);font-weight:800;font-size:15px;font-variant-numeric:tabular-nums}
  .fh-flash-ok{animation:flashok .35s ease}
  .fh-flash-pass{animation:flashpass .35s ease}
  .fh-list{margin-top:12px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;font-size:15px;line-height:2}
  .fh-quit{background:none;border:none;color:var(--dim);font-family:inherit;font-size:15px;font-weight:800;cursor:pointer;padding:0}
  /* 가로모드: 폰은 세로로 들고, 화면만 90도 돌려서 렌더 (멀리서도 보이게 왕크게) */
  #fh-game.fh-land{
    position:fixed;top:0;left:0;z-index:70;margin:0;border:none;border-radius:0;min-height:0;
    width:100vh;height:100vw;transform:rotate(90deg) translateY(-100vw);transform-origin:top left;
    background:var(--night2);
  }
  #fh-game.fh-land .fh-top{font-size:18px;padding:12px 22px}
  #fh-game.fh-land .fh-quit{font-size:18px}
  #fh-game.fh-land .fh-controls{height:96px}
  #fh-game.fh-land .fh-pass,#fh-game.fh-land .fh-ok{font-size:24px}`);
/* ================= 이마 퀴즈 ================= */
const FH_BANK = {
  "동작": ["셀카 찍기","양치질","승마","낚시","골프 스윙","줄넘기","머리 감기","라면 끓이기","운전하기","활쏘기","무거운 짐 들기","별 보기","텐트 치기","모기 잡기","김치 담그기","응원하기","윙크","팔굽혀펴기","계란 후라이","춤추기"],
  "동물": WORDS["동물"],
  "직업": WORDS["직업"],
  "음식": WORDS["음식"],
  "몽골 여행": WORDS["몽골 스페셜"]
};
let fh = { cat: "동작", time: 60, orient: "land", deck: [], cur: null, score: 0, left: 60, tid: null, cdId: null, history: [] };
(function initFh(){
  const cats = $("fh-cats");
  Object.keys(FH_BANK).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    if (c === fh.cat) b.classList.add("sel");
    b.addEventListener("click", () => { fh.cat = c; cats.querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); });
    cats.appendChild(b);
  });
  $("fh-times").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      $("fh-times").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      fh.time = parseInt(b.dataset.t, 10);
    });
  });
  $("fh-orient").querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      $("fh-orient").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      fh.orient = b.dataset.o;
    });
  });
})();
/* 가로모드에서 단어 길이에 맞춰 폰트 자동 확대 (세로모드는 CSS 기본값) */
function fhFit(){
  const wEl = $("fh-word");
  if (!$("fh-game").classList.contains("fh-land")){ wEl.style.fontSize = ""; return; }
  const area = $("fh-area");
  const aw = area.clientWidth || 320, ah = area.clientHeight || 200;
  const txt = wEl.textContent || "";
  const chars = txt.replace(/\s/g, "").length, sp = txt.length - chars;
  const len = Math.max(2, chars + sp * 0.5);
  wEl.style.fontSize = Math.round(Math.min(ah * 0.55, (aw * 0.92) / Math.min(len, 9))) + "px";
}
function fhReset(){
  clearInterval(fh.tid); fh.tid = null;
  clearInterval(fh.cdId); fh.cdId = null;
  $("fh-game").classList.remove("fh-land");
  $("fh-setup").style.display = ""; $("fh-game").style.display = "none"; $("fh-result").style.display = "none";
}
$("fh-start").addEventListener("click", () => {
  fh.deck = shuffle(FH_BANK[fh.cat]);
  fh.score = 0; fh.left = fh.time; fh.history = [];
  $("fh-game").classList.toggle("fh-land", fh.orient === "land");
  $("fh-setup").style.display = "none"; $("fh-game").style.display = "flex"; $("fh-result").style.display = "none";
  $("fh-score").textContent = "0개 정답";
  $("fh-timer").textContent = fh.left;
  let cd = 3;
  $("fh-word").textContent = cd; fhFit();
  fh.cdId = setInterval(() => {
    cd--;
    if (cd > 0){ $("fh-word").textContent = cd; fhFit(); snSfx("tick"); }
    else {
      clearInterval(fh.cdId); fh.cdId = null;
      fhNextWord();
      fh.tid = setInterval(() => {
        fh.left--;
        $("fh-timer").textContent = fh.left;
        if (fh.left === 10) snSfx("alarm");
        if (fh.left <= 0) fhEnd();
      }, 1000);
    }
  }, 1000);
});
function fhNextWord(){
  if (!fh.deck.length) fh.deck = shuffle(FH_BANK[fh.cat]);
  fh.cur = fh.deck.pop();
  $("fh-word").textContent = fh.cur;
  fhFit();
}
function fhMark(ok){
  if (!fh.tid || !fh.cur) return;
  fh.history.push({ w: fh.cur, ok });
  snSfx(ok ? "correct" : "wrong");
  if (ok){ fh.score++; $("fh-score").textContent = fh.score + "개 정답"; }
  const area = $("fh-area");
  area.classList.remove("fh-flash-ok", "fh-flash-pass");
  void area.offsetWidth;
  area.classList.add(ok ? "fh-flash-ok" : "fh-flash-pass");
  fhNextWord();
}
$("fh-ok").addEventListener("click", () => fhMark(true));
$("fh-pass").addEventListener("click", () => fhMark(false));
function fhEnd(){
  clearInterval(fh.tid); fh.tid = null;
  clearInterval(fh.cdId); fh.cdId = null;
  $("fh-game").classList.remove("fh-land");
  $("fh-game").style.display = "none"; $("fh-result").style.display = "flex";
  $("fh-final").textContent = fh.score + "개 정답! 🎉";
  $("fh-history").innerHTML = fh.history.map(h => (h.ok ? "✅ " : "⏭️ ") + h.w).join("<br>") || "기록 없음";
}
$("fh-again").addEventListener("click", fhReset);
$("fh-quit").addEventListener("click", fhEnd);
snRegisterGame("forehead", fhReset);
