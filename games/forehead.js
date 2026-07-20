"use strict";
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
    if (cd > 0){ $("fh-word").textContent = cd; fhFit(); }
    else {
      clearInterval(fh.cdId); fh.cdId = null;
      fhNextWord();
      fh.tid = setInterval(() => {
        fh.left--;
        $("fh-timer").textContent = fh.left;
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

