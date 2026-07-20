"use strict";
/* ================= 밸런스 ================= */
let balDeck = [];
function balNext(){
  if (!balDeck.length) balDeck = shuffle(BALANCE);
  const [a, b] = balDeck.pop();
  $("bal-a").textContent = a; $("bal-b").textContent = b;
  $("bal-a").classList.remove("picked"); $("bal-b").classList.remove("picked");
}
$("bal-a").addEventListener("click", () => { $("bal-a").classList.toggle("picked"); $("bal-b").classList.remove("picked"); });
$("bal-b").addEventListener("click", () => { $("bal-b").classList.toggle("picked"); $("bal-a").classList.remove("picked"); });
$("bal-next").addEventListener("click", balNext);
balNext();

