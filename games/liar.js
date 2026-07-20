"use strict";
/* ================= 라이어 게임 ================= */
let liarState = null;
(function initLiar(){
  const cats = $("liar-cats");
  let selCat = "몽골 스페셜";
  Object.keys(WORDS).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    if (c === selCat) b.classList.add("sel");
    b.addEventListener("click", () => { selCat = c; cats.querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); });
    cats.appendChild(b);
  });
  $("liar-start").addEventListener("click", () => startLiar(selCat));
  $("liar-again").addEventListener("click", () => startLiar(liarState.cat));
})();

function startLiar(cat){
  const order = shuffle(roster);
  const word = WORDS[cat][Math.floor(Math.random() * WORDS[cat].length)];
  const liarIdx = Math.floor(Math.random() * order.length);
  liarState = { cat, word, liarName: order[liarIdx], timerId: null, timeLeft: 180 };
  $("liar-setup").style.display = "none";
  $("liar-play").style.display = "none";
  const pass = $("liar-pass");
  pass.style.display = "flex";
  runPassPhase(pass, order,
    (i) => i === liarIdx
      ? { main: "당신이 라이어!", sub: "카테고리: " + cat + "<br>들키지 말고 버텨보세요", liar: true }
      : { label: "제시어", main: word, sub: "카테고리: " + cat },
    () => {
      pass.style.display = "none";
      $("liar-play").style.display = "flex";
      $("liar-cat-tag").textContent = "카테고리: " + cat;
      $("liar-result").style.display = "none";
      $("liar-again").style.display = "none";
      $("liar-timer").textContent = "3:00";
      $("liar-timer").classList.remove("low");
      $("liar-timer-btn").textContent = "타이머 시작";
    }
  );
}
$("liar-timer-btn").addEventListener("click", () => {
  const st = liarState;
  if (st.timerId){ clearInterval(st.timerId); st.timerId = null; $("liar-timer-btn").textContent = "다시 시작"; return; }
  if (st.timeLeft <= 0) st.timeLeft = 180;
  $("liar-timer-btn").textContent = "일시정지";
  st.timerId = setInterval(() => {
    st.timeLeft--;
    const t = $("liar-timer");
    t.textContent = fmt(Math.max(0, st.timeLeft));
    if (st.timeLeft <= 30) t.classList.add("low");
    if (st.timeLeft <= 0){ clearInterval(st.timerId); st.timerId = null; t.textContent = "투표!"; $("liar-timer-btn").textContent = "타이머 재시작"; st.timeLeft = 180; }
  }, 1000);
});
$("liar-reveal-btn").addEventListener("click", () => {
  if (!confirm("정말 공개할까요? 투표 먼저 하셨죠? 😏")) return;
  if (liarState.timerId){ clearInterval(liarState.timerId); liarState.timerId = null; }
  const r = $("liar-result");
  r.style.display = "";
  r.innerHTML = '<div class="lbl">라이어는...</div><div class="val" style="color:var(--danger)">' + liarState.liarName + '</div><div class="lbl" style="margin-top:14px">제시어</div><div class="val">' + liarState.word + '</div>';
  $("liar-again").style.display = "";
});

