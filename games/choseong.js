"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("choseong", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>⚡ 초성 퀴즈</h2></div>
    <div id="cho-setup">
      <p class="hint">화면을 모두에게 보여주고, 초성을 보고 먼저 정답을 외치는 사람이 1점!</p>
      <div class="field">
        <label>카테고리</label>
        <div class="seg" id="cho-cats"></div>
      </div>
      <button class="btn mt" id="cho-start">시작</button>
    </div>
    <div id="cho-play" style="display:none" class="stage-center">
      <span class="tag" id="cho-cat-tag"></span>
      <div class="big-word" id="cho-word">ㄱㄴㄷ</div>
      <div class="reveal-card" id="cho-answer" style="display:none"></div>
      <button class="btn ghost" id="cho-show">정답 보기</button>
      <button class="btn" id="cho-next">다음 문제 →</button>
    </div>
  `);
/* ================= 초성 퀴즈 ================= */
let cho = { cat: "몽골 여행", deck: [], cur: null };
(function initCho(){
  const cats = $("cho-cats");
  Object.keys(CHO_BANK).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    if (c === cho.cat) b.classList.add("sel");
    b.addEventListener("click", () => { cho.cat = c; cats.querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); });
    cats.appendChild(b);
  });
})();
$("cho-start").addEventListener("click", () => {
  cho.deck = shuffle(CHO_BANK[cho.cat]);
  $("cho-setup").style.display = "none";
  $("cho-play").style.display = "flex";
  $("cho-cat-tag").textContent = "카테고리: " + cho.cat;
  choNext();
});
function choNext(){
  if (!cho.deck.length) cho.deck = shuffle(CHO_BANK[cho.cat]);
  cho.cur = cho.deck.pop();
  $("cho-word").textContent = toCho(cho.cur);
  $("cho-answer").style.display = "none";
  $("cho-show").textContent = "정답 보기";
}
$("cho-next").addEventListener("click", choNext);
$("cho-show").addEventListener("click", () => {
  const a = $("cho-answer");
  const show = a.style.display === "none";
  if (show){ a.innerHTML = '<div class="lbl">정답</div><div class="val">' + cho.cur + '</div>'; snSfx("reveal"); }
  a.style.display = show ? "" : "none";
  $("cho-show").textContent = show ? "정답 숨기기" : "정답 보기";
});
snRegisterGame("choseong", function(){ $("cho-setup").style.display=""; $("cho-play").style.display="none"; });
