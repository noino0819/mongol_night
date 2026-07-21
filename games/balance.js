"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("balance", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>⚖️ 밸런스 게임</h2></div>
    <p class="hint">하나, 둘, 셋 하면 동시에 손가락으로 가리키기! 소수파가 벌칙 어때요 ㅎㅎ</p>
    <div class="vs-wrap">
      <button class="vs-opt" id="bal-a">A</button>
      <div class="vs-mid">VS</div>
      <button class="vs-opt" id="bal-b">B</button>
    </div>
    <button class="btn mt" id="bal-next">다음 질문 →</button>
  `);
snAddCss(`/* ---------- 밸런스 ---------- */
  .vs-wrap{flex:1;display:flex;flex-direction:column;gap:12px;justify-content:center}
  .vs-opt{
    flex:0 0 auto;min-height:120px;border-radius:20px;border:1px solid var(--line);
    background:var(--card);color:var(--milk);font-family:inherit;font-size:20px;font-weight:800;
    padding:22px;cursor:pointer;word-break:keep-all;line-height:1.45;transition:all .15s ease;
  }
  .vs-mid{text-align:center;font-size:15px;font-weight:800;color:var(--ember);letter-spacing:.3em}`);
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
snRegisterGame("balance", balNext);
