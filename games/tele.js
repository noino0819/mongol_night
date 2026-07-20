"use strict";
/* ================= 텔레파시 게임 ================= */
const TELE_QS = [
  "몽골 하면 가장 먼저 떠오르는 것은?",
  "라면에 넣으면 최고인 토핑은?",
  "무인도에 딱 하나 가져간다면?",
  "1부터 5 중에 하나를 고른다면?",
  "우리 일행 중 제일 먼저 일어날 사람은?",
  "우리 일행 중 길 잃어버릴 것 같은 사람은?",
  "치킨 하면 떠오르는 브랜드는?",
  "여행 가서 제일 먹고 싶은 한식은?",
  "별 하면 떠오르는 단어는?",
  "겨울 하면 떠오르는 음식은?",
  "노래방 첫 곡으로 부를 노래 스타일은? (발라드/댄스/힙합/트로트 중)",
  "동물원에서 제일 먼저 보러 갈 동물은?",
  "초록색 하면 떠오르는 것은?",
  "우리 일행 중 벌칙을 제일 많이 받을 것 같은 사람은?",
  "아침에 눈 뜨면 제일 먼저 하는 것은?",
  "편의점에서 꼭 사는 것은?",
  "여행 중 제일 그리울 것 같은 것은?",
  "빨간색 과일 하면?",
  "가위바위보에서 내가 낼 것은?",
  "제일 무서운 것은? (귀신/벌레/높은곳/어둠 중)",
  "캠핑 하면 떠오르는 음식은?",
  "우리 일행 중 사진을 제일 많이 찍을 사람은?",
  "몽골에서 꼭 해보고 싶은 것은?",
  "생일에 받고 싶은 선물 종류는?",
  "여름 하면 떠오르는 것은?",
  "학교 하면 떠오르는 과목은?",
  "슈퍼히어로 능력 하나를 고른다면?",
  "우리 일행 중 요리를 제일 잘할 것 같은 사람은?",
  "바다 하면 떠오르는 것은?",
  "핸드폰에서 제일 많이 쓰는 앱은?",
  "밤샘 하면 떠오르는 것은?",
  "우리 일행을 동물로 비유하면 누가 양일까?",
  "커피 하면 떠오르는 메뉴는?",
  "노란색 하면 떠오르는 것은?",
  "떡볶이랑 최고 궁합인 것은?",
  "지금 제일 하고 싶은 것은?"
];
let te = { rounds: 5, q: 0, deck: [], players: [], i: 0, answers: [], scores: [] };
function teReset(){
  ["te-setup","te-q","te-pass","te-input","te-reveal","te-end"].forEach(id => $(id).style.display = "none");
  $("te-setup").style.display = "";
}
(function initTe(){
  $("te-rounds").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("te-rounds").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    te.rounds = parseInt(b.dataset.r, 10);
  }));
})();
function teShow(id){
  ["te-setup","te-q","te-pass","te-input","te-reveal","te-end"].forEach(x => $(x).style.display = "none");
  $(id).style.display = (id === "te-q" || id === "te-pass" || id === "te-end") ? "flex" : "";
}
$("te-start").addEventListener("click", () => {
  te.players = roster.slice();
  te.scores = te.players.map(() => 0);
  te.deck = shuffle(TELE_QS);
  te.q = 0;
  teQuestion();
});
function teQuestion(){
  teShow("te-q");
  $("te-q-step").textContent = "Q" + (te.q + 1) + " / " + te.rounds;
  $("te-question").textContent = te.deck[te.q];
}
$("te-input-start").addEventListener("click", () => {
  te.i = 0; te.answers = [];
  tePass();
});
function tePass(){
  teShow("te-pass");
  $("te-pass-name").textContent = te.players[te.i];
  $("te-pass-q").textContent = te.deck[te.q];
}
$("te-pass-go").addEventListener("click", () => {
  teShow("te-input");
  $("te-input-q").textContent = "Q. " + te.deck[te.q] + " — " + te.players[te.i] + "의 답:";
  $("te-answer").value = "";
  $("te-answer").focus();
});
$("te-submit").addEventListener("click", () => {
  const v = $("te-answer").value.trim();
  if (!v) return alert("답을 입력해주세요!");
  te.answers.push(v);
  te.i++;
  if (te.i >= te.players.length) return teReveal();
  snPassCover(te.players[te.i], tePass);
});
function teNorm(s){ return s.toLowerCase().replace(/\s+/g, ""); }
function teReveal(){
  teShow("te-reveal");
  const groups = {};
  te.answers.forEach((a, i) => {
    const k = teNorm(a);
    if (!groups[k]) groups[k] = { label: a, members: [] };
    groups[k].members.push(i);
  });
  const sorted = Object.values(groups).sort((a, b) => b.members.length - a.members.length);
  $("te-groups").innerHTML = sorted.map(g => {
    const pts = g.members.length >= 2 ? g.members.length : 0;
    g.members.forEach(i => te.scores[i] += pts);
    return '<div class="mb-teamcard"><b>"' + escHtml(g.label) + '" — ' + (pts ? "각 +" + pts + "점 ✨" : "0점 (혼자만...)") + '</b><span>' +
      g.members.map(i => te.players[i]).join(", ") + '</span></div>';
  }).join("");
  $("te-scores").innerHTML = te.players.map((n, i) => '<div class="sp">' + n + ' ' + te.scores[i] + '점</div>').join("");
  $("te-next").textContent = (te.q + 1 >= te.rounds) ? "최종 결과 보기 →" : "다음 문제 →";
}
$("te-next").addEventListener("click", () => {
  te.q++;
  if (te.q >= te.rounds) return teEnd();
  teQuestion();
});
function teEnd(){
  teShow("te-end");
  const rank = te.players.map((n, i) => ({ n, s: te.scores[i] })).sort((a, b) => b.s - a.s);
  const medals = ["🥇","🥈","🥉"];
  $("te-rank").innerHTML = '<div class="lbl">텔레파시 마스터</div><div class="val" style="font-size:18px;line-height:2">' +
    rank.map((r, i) => (medals[i] || "·") + " " + r.n + " — " + r.s + "점").join("<br>") + '</div>';
}
$("te-again").addEventListener("click", teReset);

