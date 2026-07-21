"use strict";
/* ================= 과일 종! (할리갈리) ================= */
const FRUITS = ["strawberry","banana","kiwi","grape"]; /* SPR 스프라이트 키 */
/* 정식 할리갈리 분포: 과일당 1개×5장, 2개×3장, 3개×3장, 4개×2장, 5개×1장 = 14장 × 4과일 = 56장 */
const FRUIT_DIST = [[1,5],[2,3],[3,3],[4,2],[5,1]];
const FZ_LAYOUT = { 2:["bc","tc"], 3:["bc","tl","tr"], 4:["bl","br","tl","tr"], 5:["bl","br","tl","tr","lm"], 6:["bl","br","tl","tr","lm","rm"] };
let fr = { sel: [], players: [], decks: [], faceup: [], turn: 0, locked: false, flipLock: false, running: false, toId: null, flId: null };

function fruitReset(){
  clearTimeout(fr.toId); fr.toId = null;
  clearTimeout(fr.flId); fr.flId = null;
  fr.running = false; fr.locked = false; fr.flipLock = false;
  $("fruit-setup").style.display = ""; $("fruit-game").style.display = "none"; $("fruit-result").style.display = "none";
  const box = $("fruit-players");
  box.innerHTML = "";
  fr.sel = roster.slice(0, 6);
  roster.forEach(n => {
    const b = document.createElement("button");
    b.textContent = n;
    if (fr.sel.includes(n)) b.classList.add("sel");
    b.addEventListener("click", () => {
      if (fr.sel.includes(n)) fr.sel = fr.sel.filter(x => x !== n);
      else if (fr.sel.length < 6) fr.sel.push(n);
      else return alert("최대 6명까지!");
      b.classList.toggle("sel", fr.sel.includes(n));
    });
    box.appendChild(b);
  });
}
function fruitDeck56(){
  const deck = [];
  FRUITS.forEach(f => FRUIT_DIST.forEach(([n, cnt]) => {
    for (let k = 0; k < cnt; k++) deck.push({ f, n });
  }));
  for (let i = deck.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function fruitAlive(i){ return fr.decks[i].length + fr.faceup[i].length > 0; }
$("fruit-start").addEventListener("click", () => {
  if (fr.sel.length < 2) return alert("2명 이상 선택해주세요!");
  fr.players = fr.sel.slice();
  fr.decks = fr.players.map(() => []);
  fruitDeck56().forEach((c, i) => fr.decks[i % fr.players.length].push(c));
  fr.faceup = fr.players.map(() => []);
  fr.turn = 0; fr.locked = false; fr.flipLock = false; fr.running = true;
  $("fruit-setup").style.display = "none"; $("fruit-game").style.display = ""; $("fruit-result").style.display = "none";
  buildFruitArena();
  $("fruit-msg").textContent = fr.players[0] + "부터 뒤집어!";
});
function buildFruitArena(){
  const arena = $("fruit-arena");
  arena.querySelectorAll(".fzone").forEach(z => z.remove());
  const layout = FZ_LAYOUT[fr.players.length];
  fr.players.forEach((name, i) => {
    const z = document.createElement("button");
    z.className = "fzone " + layout[i];
    z.id = "fz-" + i;
    z.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      /* 자기 🃏 더미 탭 = 뒤집기(자기 차례만), 그 외 = 종 */
      if (e.target.closest(".fzflip")) fruitFlipTurn(i);
      else fruitBell(i, z);
    });
    arena.appendChild(z);
    fruitRenderZone(i);
  });
  fruitRenderTurn();
}
/* 도트 카드: 밀크 바탕 위 주사위(pip) 배치 — 개수를 위치로 즉독 */
const FR_PIPS = { 1:[[19,10]], 2:[[2,2],[36,18]], 3:[[2,2],[19,10],[36,18]], 4:[[2,2],[36,2],[2,18],[36,18]], 5:[[2,2],[36,2],[19,10],[2,18],[36,18]] };
function fruitCardCv(f, n, pop){
  const { PAL, stamp } = window.SN_SPRITES;
  const S = 2, W = 54, H = 36; /* 도트 단위, ×2 = 108×72px */
  const cv = document.createElement("canvas");
  cv.width = W * S; cv.height = H * S;
  cv.className = "fzcard" + (pop ? " pop" : "");
  const g = cv.getContext("2d");
  g.fillStyle = PAL[6]; g.fillRect(0, 0, W * S, H * S);
  /* 광원 좌상 → 우·하단 1도트 음영 */
  g.fillStyle = PAL[2]; g.fillRect(0, (H - 1) * S, W * S, S); g.fillRect((W - 1) * S, 0, S, H * S);
  /* 픽셀 라운드 코너 */
  [[0,0],[1,0],[0,1],[W-1,0],[W-2,0],[W-1,1],[0,H-1],[0,H-2],[1,H-1],[W-1,H-1],[W-2,H-1],[W-1,H-2]]
    .forEach(([x, y]) => g.clearRect(x * S, y * S, S, S));
  FR_PIPS[n].forEach(([x, y]) => stamp(g, f, x, y, S));
  return cv;
}
function fruitRenderZone(i, pop){
  const z = $("fz-" + i);
  const pile = fr.faceup[i];
  const top = pile.length ? pile[pile.length - 1] : null;
  z.innerHTML =
    '<div class="fzname">' + escHtml(fr.players[i]) + '</div>' +
    (top ? '' : '<div class="fzcard none">비었음</div>') +
    '<div class="fzflip"><px-sprite name="cardback" scale="1"></px-sprite>' + fr.decks[i].length + '</div>';
  if (top) z.insertBefore(fruitCardCv(top.f, top.n, pop), z.lastElementChild);
}
function fruitRenderTurn(){
  fr.players.forEach((_, j) => {
    const z = $("fz-" + j);
    z.classList.toggle("turn", fr.running && j === fr.turn);
    z.classList.toggle("dead", !fruitAlive(j));
  });
}
function fruitSumOK(){
  const sums = {};
  fr.faceup.forEach(pile => {
    if (!pile.length) return;
    const c = pile[pile.length - 1];
    sums[c.f] = (sums[c.f] || 0) + c.n;
  });
  return Object.values(sums).some(v => v === 5);
}
function fruitFlipTurn(i){
  if (!fr.running || fr.locked || fr.flipLock) return;
  if (i !== fr.turn) return; /* 자기 차례 아니면 무시 (종 오발 방지) */
  if (!fr.decks[i].length) return fruitNextTurn();
  fr.faceup[i].push(fr.decks[i].pop());
  fruitRenderZone(i, true);
  $("fruit-msg").textContent = "";
  /* 카드 확인할 틈: 잠깐 뒤집기 잠금 */
  fr.flipLock = true;
  fr.flId = setTimeout(() => { fr.flipLock = false; }, 450);
  fruitNextTurn();
}
function fruitNextTurn(){
  for (let s = 1; s <= fr.players.length; s++){
    const j = (fr.turn + s) % fr.players.length;
    if (fruitAlive(j) && fr.decks[j].length){ fr.turn = j; fruitRenderTurn(); return; }
  }
  fruitEnd(); /* 전원 덱 소진 → 카드 많은 순 정산 */
}
function fruitBell(i, zone){
  if (!fr.running || fr.locked) return;
  fr.locked = true;
  const ok = fruitSumOK();
  if (ok){
    let gain = 0;
    fr.players.forEach((_, j) => {
      gain += fr.faceup[j].length;
      fr.decks[i].unshift(...fr.faceup[j]);
      fr.faceup[j] = [];
    });
    zone.classList.add("good");
    $("fruit-msg").textContent = "🔔 " + fr.players[i] + " 싹쓸이! +" + gain + "장";
    fr.turn = i; /* 종 친 사람이 다음 선 */
  } else {
    zone.classList.add("bad");
    fr.players.forEach((_, j) => {
      if (j !== i && fruitAlive(j) && fr.decks[i].length) fr.decks[j].unshift(fr.decks[i].shift());
    });
    $("fruit-msg").textContent = "😱 " + fr.players[i] + " 오답! 전원에게 한 장씩 벌금";
  }
  fr.players.forEach((_, j) => fruitRenderZone(j));
  fruitRenderTurn();
  fr.toId = setTimeout(() => {
    zone.classList.remove("good", "bad");
    $("fruit-msg").textContent = "";
    fr.locked = false;
    const aliveN = fr.players.filter((_, j) => fruitAlive(j)).length;
    if (aliveN <= 1) return fruitEnd();
    if (!fruitAlive(fr.turn) || !fr.decks[fr.turn].length) fruitNextTurn();
    else fruitRenderTurn();
  }, 1100);
}
function fruitEnd(){
  clearTimeout(fr.toId); fr.toId = null; fr.running = false;
  $("fruit-game").style.display = "none"; $("fruit-result").style.display = "flex";
  const rank = fr.players.map((n, i) => ({ n, s: fr.decks[i].length + fr.faceup[i].length })).sort((a, b) => b.s - a.s);
  const medal = (i) => i < 3 ? '<px-sprite name="medal' + (i + 1) + '" scale="2" style="display:inline-block;vertical-align:middle"></px-sprite> ' : '· ';
  $("fruit-rank").innerHTML = '<div class="lbl">최종 카드</div><div class="val" style="font-size:19px;line-height:2">' +
    rank.map((r, i) => medal(i) + escHtml(r.n) + " — " + r.s + "장").join("<br>") + '</div>';
}
$("fruit-stop").addEventListener("click", () => { if (confirm("게임을 끝낼까요? 카드 많은 사람이 승리!")) fruitEnd(); });
$("fruit-again").addEventListener("click", () => { fruitReset(); });

