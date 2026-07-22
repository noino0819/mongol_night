"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("fruit", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>🔔 과일 종!</h2></div>
    <div id="fruit-setup">
      <p class="hint">진짜 할리갈리! 카드 56장을 똑같이 나눠 갖고, 자기 차례가 오면 <b>자기 판</b>을 탭해서 한 장씩 뒤집어. 깔린 카드들 중 <b style="color:var(--fire)">같은 과일 합이 정확히 5</b>가 되는 순간 <b>가운데 자기 이름 종</b>을 먼저 탭! 맞으면 깔린 카드 싹쓸이, 틀리면 전원에게 한 장씩 벌금. 카드 다 잃으면 탈락 — 끝까지 살아남으면 승리.</p>
      <div class="field">
        <label>참여자 선택 (탭해서 켜고 끄기, 2~6명)</label>
        <div class="seg" id="fruit-players"></div>
      </div>
      <button class="btn mt" id="fruit-start">카드 돌려! 시작!</button>
    </div>
    <div id="fruit-game" style="display:none">
      <div class="fruit-arena" id="fruit-arena">
        <div class="fcenter" id="fruit-bells"></div>
        <div class="fmsg" id="fruit-msg"></div>
      </div>
      <button class="btn ghost mt" id="fruit-stop">게임 끝내기 (카드 많은 순 정산)</button>
    </div>
    <div id="fruit-result" style="display:none" class="stage-center">
      <span class="tag">최종 결과</span>
      <div class="reveal-card" id="fruit-rank"></div>
      <button class="btn" id="fruit-again">한 판 더!</button>
    </div>
  `);
snAddCss(`/* ---------- 과일 종! (할리갈리) ---------- */
  .fruit-arena{position:relative;flex:1;min-height:480px;border:1px solid var(--line);border-radius:20px;background:var(--night2);overflow:hidden;margin-top:4px}
  .fzone{
    position:absolute;width:112px;height:130px;border-radius:16px;border:2px solid var(--line);
    background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    font-weight:800;font-size:13px;cursor:pointer;touch-action:manipulation;transition:background .1s;padding:4px;
  }
  .fzone.good{background:#1E4633;border-color:var(--steppe)}
  .fzone.bad{background:#4A2230;border-color:var(--danger)}
  .fzone .fzname{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fzone .fzcard{image-rendering:pixelated}
  .fzone .fzflip{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--dim);border:1px solid var(--line);padding:2px 10px;white-space:nowrap}
  .fzone.tl{top:10px;left:10px;transform:rotate(180deg)}
  .fzone.tr{top:10px;right:10px;transform:rotate(180deg)}
  .fzone.tc{top:10px;left:50%;transform:translateX(-50%) rotate(180deg)}
  .fzone.bl{bottom:10px;left:10px}
  .fzone.bc{bottom:10px;left:50%;transform:translateX(-50%)}
  .fzone.lm{top:50%;left:10px;transform:translateY(-50%) rotate(90deg)}
  .fzone.rm{top:50%;right:10px;transform:translateY(-50%) rotate(-90deg)}
  /* 가운데 종 클러스터 — 자기 자리 방향 칸에 자기 종 (2열 그리드, 상단은 180도) */
  .fcenter{
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    display:grid;grid-template-columns:repeat(2,64px);gap:8px;
  }
  .fbellbtn{
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:58px;
    border:2px solid var(--line);border-radius:14px;background:var(--card);padding:6px 2px;
    font-weight:800;font-size:10px;cursor:pointer;touch-action:manipulation;
  }
  .fbellbtn .fzname{max-width:58px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fbellbtn.tl{grid-area:1/1}.fbellbtn.tr{grid-area:1/2}.fbellbtn.tc{grid-area:1/1/2/3}
  .fbellbtn.lm{grid-area:2/1}.fbellbtn.rm{grid-area:2/2}
  .fbellbtn.bl{grid-area:3/1}.fbellbtn.br{grid-area:3/2}.fbellbtn.bc{grid-area:3/1/4/3}
  .fbellbtn.tl,.fbellbtn.tr,.fbellbtn.tc{transform:rotate(180deg)}
  .fbellbtn.lm{transform:rotate(90deg)}.fbellbtn.rm{transform:rotate(-90deg)}
  .fbellbtn.good{background:#1E4633;border-color:var(--steppe)}
  .fbellbtn.bad{background:#4A2230;border-color:var(--danger)}
  .fbellbtn.dead{opacity:.35;pointer-events:none}
  .fmsg{
    position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3;pointer-events:none;
    font-size:14px;font-weight:800;color:var(--fire);text-align:center;width:150px;
    background:var(--night2);border:1px solid var(--line);border-radius:12px;padding:8px 6px;
  }
  .fmsg:empty{display:none}`);
/* ================= 과일 종! (할리갈리) ================= */
const FRUITS = ["strawberry","banana","kiwi","grape"]; /* SPR 스프라이트 키 */
/* 정식 할리갈리 분포: 과일당 1개×5장, 2개×3장, 3개×3장, 4개×2장, 5개×1장 = 14장 × 4과일 = 56장 */
const FRUIT_DIST = [[1,5],[2,3],[3,3],[4,2],[5,1]];
const FZ_LAYOUT = { 2:["bc","tc"], 3:["bc","tl","tr"], 4:["bl","br","tl","tr"], 5:["bl","br","tl","tr","lm"], 6:["bl","br","tl","tr","lm","rm"] };
let fr = { sel: [], players: [], decks: [], faceup: [], turn: 0, locked: false, flipLock: false, running: false, multi: false, toId: null, flId: null };
let frMode = null; /* 유저 토글 선택(null=자동) — 실제 모드는 snMode(frMode) */

function fruitReset(){
  clearTimeout(fr.toId); fr.toId = null;
  clearTimeout(fr.flId); fr.flId = null;
  fr.running = false; fr.locked = false; fr.flipLock = false; fr.multi = false;
  const ov = $("fruit-mp"); if (ov) ov.style.display = "none"; /* 여러 폰 오버레이 치우기 */
  $("fruit-setup").style.display = ""; $("fruit-game").style.display = "none"; $("fruit-result").style.display = "none";
  const frM = snMode(frMode);
  snModeBar($("fruit-setup"), frM, (m) => { frMode = m; fruitReset(); });
  const box = $("fruit-players");
  box.innerHTML = "";
  if (frM === "multi"){
    const names = mpNames();
    box.innerHTML = names.map(n => '<button class="sel" disabled>' + escHtml(n) + "</button>").join("");
    return; /* 참가자 = 연결된 폰 전부, 시작 때 mpNames()로 확정 */
  }
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
  if (snMode(frMode) === "multi") return fruitStartMulti();
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
  const bells = $("fruit-bells");
  bells.innerHTML = "";
  const layout = FZ_LAYOUT[fr.players.length];
  fr.players.forEach((name, i) => {
    /* 자기 판 탭 = 뒤집기만 (종은 가운데로 분리) */
    const z = document.createElement("button");
    z.className = "fzone " + layout[i];
    z.id = "fz-" + i;
    z.addEventListener("pointerdown", (e) => { e.preventDefault(); fruitFlipTurn(i); });
    arena.appendChild(z);
    /* 가운데 종 — 자기 자리 방향 칸 */
    const b = document.createElement("button");
    b.className = "fbellbtn " + layout[i];
    b.id = "fb-" + i;
    b.innerHTML = '<px-sprite name="bell" scale="2"></px-sprite><span class="fzname">' + escHtml(name) + "</span>";
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); haptic(30); fruitBell(i, b); });
    bells.appendChild(b);
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
  if (fr.multi) return; /* 여러 폰은 fz 존 없음 — fruitRenderTurn→fruitBeam이 전체 그림 */
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
  if (fr.multi) return fruitBeam(); /* 모든 상태 변화가 여길 지나므로 브로드캐스트 지점으로 씀 */
  fr.players.forEach((_, j) => {
    const z = $("fz-" + j);
    z.classList.toggle("turn", fr.running && j === fr.turn);
    z.classList.toggle("dead", !fruitAlive(j));
    const b = $("fb-" + j);
    if (b) b.classList.toggle("dead", !fruitAlive(j));
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
  snSfx("pop");
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
    if (zone) zone.classList.add("good");
    snSfx("coin");
    $("fruit-msg").textContent = "🔔 " + fr.players[i] + " 싹쓸이! +" + gain + "장";
    fr.turn = i; /* 종 친 사람이 다음 선 */
  } else {
    if (zone) zone.classList.add("bad");
    snSfx("wrong");
    fr.players.forEach((_, j) => {
      if (j !== i && fruitAlive(j) && fr.decks[i].length) fr.decks[j].unshift(fr.decks[i].shift());
    });
    $("fruit-msg").textContent = "😱 " + fr.players[i] + " 오답! 전원에게 한 장씩 벌금";
  }
  fr.players.forEach((_, j) => fruitRenderZone(j));
  fruitRenderTurn();
  fr.toId = setTimeout(() => {
    if (zone) zone.classList.remove("good", "bad");
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
  snSfx("win");
  const rank = fr.players.map((n, i) => ({ n, s: fr.decks[i].length + fr.faceup[i].length })).sort((a, b) => b.s - a.s);
  const medal = (i) => i < 3 ? '<px-sprite name="medal' + (i + 1) + '" scale="2" style="display:inline-block;vertical-align:middle"></px-sprite> ' : '· ';
  $("fruit-rank").innerHTML = '<div class="lbl">최종 카드</div><div class="val" style="font-size:19px;line-height:2">' +
    rank.map((r, i) => medal(i) + escHtml(r.n) + " — " + r.s + "장").join("<br>") + '</div>';
  if (fr.multi){
    const ov = $("fruit-mp"); if (ov) ov.style.display = "none"; /* 호스트는 기존 결과 화면으로 */
    mpBroadcast({ t: "st", phase: "end", rank });
  }
}
$("fruit-stop").addEventListener("click", () => snConfirm("🔔", "게임을 끝낼까요?", "카드 많은 사람이 승리!", "끝내기", fruitEnd));
$("fruit-again").addEventListener("click", () => { fruitReset(); });

/* ================= 여러 폰 — 각자 폰이 자기 패 ================= */
/* 호스트가 유일 권위: 판정·정산은 위 solo 로직 그대로(fruitFlipTurn/fruitBell), 존 렌더만 건너뛰고
   매 상태 변화(fruitRenderTurn)마다 스냅샷을 브로드캐스트. 호스트도 같은 뷰(fruitMpShow)를 로컬 렌더.
   ponytail: 종 판정은 호스트 도착순, 지연 보정 없음(bz와 동일 정책). 게스트 이탈 시 그 사람 차례에
   진행이 멈출 수 있음 — 호스트가 '게임 끝내기'로 정산하는 게 탈출구. */
function fruitStartMulti(){
  const names = mpNames();
  if (!mpLive() || names.length < 2) return alert("여러 폰은 폰 2대 이상 연결돼야 해");
  fr.players = names;
  fr.decks = fr.players.map(() => []);
  fruitDeck56().forEach((c, i) => fr.decks[i % fr.players.length].push(c));
  fr.faceup = fr.players.map(() => []);
  fr.turn = 0; fr.locked = false; fr.flipLock = false; fr.running = true; fr.multi = true;
  mpNav("fruit");                    /* 게스트들 이 화면으로 (게스트: __guest_fruit 실행 → 대기) */
  mp.game = { onMsg: fruitHostMsg, onPeers(){} };
  $("fruit-setup").style.display = "none"; $("fruit-game").style.display = "none"; $("fruit-result").style.display = "none";
  $("fruit-msg").textContent = fr.players[0] + "부터 뒤집어!";
  fruitBeam();
}
/* 게스트 입력 수신 → 이름으로 인덱스 찾아 기존 로직에 태움 */
function fruitHostMsg(from, m){
  if (!m) return;
  const i = fr.players.indexOf(from);
  if (i < 0) return;
  if (m.t === "flip") fruitFlipTurn(i);
  else if (m.t === "bell") fruitBell(i, null);
}
/* 게스트에 필요한 전부: 각자 맨 윗장 + 덱 수 + 차례 + 메시지 */
function fruitSnap(){
  return { t: "st", phase: "play", players: fr.players, turn: fr.turn, running: fr.running,
    tops: fr.faceup.map(p => p.length ? p[p.length - 1] : null),
    piles: fr.faceup.map(p => p.length),
    decks: fr.decks.map(d => d.length),
    msg: $("fruit-msg").textContent };
}
function fruitBeam(){
  const s = fruitSnap();
  mpBroadcast(s);
  fruitMpShow(s);
}
function fruitMpEl(){
  let el = $("fruit-mp");
  if (!el){
    el = document.createElement("div");
    el.id = "fruit-mp";
    el.style.cssText = "display:none;flex-direction:column;gap:10px;padding:8px 0 20px";
    $("scr-fruit").appendChild(el);
  }
  return el;
}
/* 호스트·게스트 공용 뷰 — 호스트가 보낸 스냅샷(st) 하나로 전체를 다시 그린다 */
function fruitMpShow(m){
  const el = fruitMpEl();
  el.style.display = "flex";
  if (m.phase === "wait"){
    el.innerHTML = '<div class="stage-center" style="min-height:50vh"><span class="tag">🔔 과일 종!</span><div class="hint" style="margin:0">호스트가 카드 나누는 중…</div></div>';
    return;
  }
  if (m.phase === "end"){
    const medal = (i) => i < 3 ? '<px-sprite name="medal' + (i + 1) + '" scale="2" style="display:inline-block;vertical-align:middle"></px-sprite> ' : '· ';
    el.innerHTML = '<div class="stage-center" style="min-height:50vh"><span class="tag">최종 결과</span>'
      + '<div class="reveal-card"><div class="lbl">최종 카드</div><div class="val" style="font-size:19px;line-height:2">'
      + m.rank.map((r, i) => medal(i) + escHtml(r.n) + " — " + r.s + "장").join("<br>")
      + '</div></div><div class="hint" style="margin:0">호스트 폰에서 한 판 더 열 수 있어</div></div>';
    return;
  }
  const my = m.players.indexOf(mp.name);
  el.innerHTML = "";
  const msg = document.createElement("div");
  msg.style.cssText = "min-height:22px;text-align:center;font-weight:700;color:var(--fire)";
  msg.textContent = m.msg || (m.running ? (my === m.turn ? "내 차례!" : m.players[m.turn] + " 차례") : "");
  el.appendChild(msg);
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px";
  m.players.forEach((n, i) => {
    const isTurn = m.running && i === m.turn;
    const dead = m.decks[i] + m.piles[i] <= 0;
    const cell = document.createElement("div");
    cell.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1px solid "
      + (isTurn ? "var(--fire)" : "var(--line)") + ";border-radius:12px;background:var(--night2)" + (dead ? ";opacity:.35" : "");
    const nm = document.createElement("div");
    nm.style.cssText = "font-size:12px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    nm.textContent = (i === my ? "⭐ " : "") + n + (isTurn ? " ◀" : "");
    cell.appendChild(nm);
    if (m.tops[i]){
      const cv = fruitCardCv(m.tops[i].f, m.tops[i].n);
      cv.style.cssText = "image-rendering:pixelated";
      cell.appendChild(cv);
    } else {
      const none = document.createElement("div");
      none.style.cssText = "width:108px;height:72px;display:flex;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:8px;color:var(--dim);font-size:11px";
      none.textContent = "비었음";
      cell.appendChild(none);
    }
    const dk = document.createElement("div");
    dk.style.cssText = "font-size:11px;color:var(--dim)";
    dk.innerHTML = '<px-sprite name="cardback" scale="1"></px-sprite> ' + m.decks[i] + " · 앞 " + m.piles[i];
    cell.appendChild(dk);
    grid.appendChild(cell);
  });
  el.appendChild(grid);
  const myTurn = m.running && my >= 0 && my === m.turn && m.decks[my] > 0;
  const btns = document.createElement("div");
  btns.style.cssText = "display:flex;gap:8px";
  const flip = document.createElement("button");
  flip.className = "btn ghost";
  flip.style.cssText = "flex:1";
  flip.textContent = myTurn ? "🃏 뒤집기!" : "🃏 " + (m.running ? m.players[m.turn] + " 차례…" : "…");
  flip.disabled = !myTurn;
  flip.addEventListener("click", () => { haptic(15); if (mpAmHost()) fruitFlipTurn(my); else mpToHost({ t: "flip" }); });
  const bell = document.createElement("button");
  bell.className = "btn";
  bell.style.cssText = "flex:1;font-size:17px";
  bell.textContent = "🔔 종!";
  bell.disabled = !m.running || my < 0;
  bell.addEventListener("pointerdown", (e) => { e.preventDefault(); haptic(30); if (mpAmHost()) fruitBell(my, null); else mpToHost({ t: "bell" }); });
  bell.addEventListener("contextmenu", (e) => e.preventDefault());
  btns.append(flip, bell);
  el.appendChild(btns);
  if (mpAmHost()){
    const stop = document.createElement("button");
    stop.className = "btn ghost";
    stop.textContent = "게임 끝내기 (카드 많은 순 정산)";
    stop.addEventListener("click", () => snConfirm("🔔", "게임을 끝낼까요?", "카드 많은 사람이 승리!", "끝내기", fruitEnd));
    el.appendChild(stop);
  }
}
/* 게스트 진입 훅 — 호스트가 mpNav("fruit") 하면 자동 호출 */
window.__guest_fruit = function(){
  ["fruit-setup","fruit-game","fruit-result"].forEach(id => $(id).style.display = "none");
  fruitMpShow({ phase: "wait" });
  mp.game = { onMsg(from, m){ if (m && m.t === "st") fruitMpShow(m); } };
};
snRegisterGame("fruit", fruitReset);
