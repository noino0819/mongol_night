"use strict";
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
  if (show) a.innerHTML = '<div class="lbl">정답</div><div class="val">' + cho.cur + '</div>';
  a.style.display = show ? "" : "none";
  $("cho-show").textContent = show ? "정답 숨기기" : "정답 보기";
});

