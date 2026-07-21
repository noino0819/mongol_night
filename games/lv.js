"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("lv", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>🎰 주사위 배팅</h2></div>
    <div id="lv-setup">
      <p class="hint">상금 더미 4개에 주사위 7개로 눈치 배팅! 굴려서 나온 눈 중 <b>하나를 골라 전부 배치</b>해요. 눈 1·2는 꽝(자동 소각 💨). 더미마다 <b>최다 배치자가 상금 독식</b>, 근데 <b style="color:var(--danger)">1위가 동률이면 그들 전원 무효</b> — 차순위가 꿀꺽!</p>
      <div class="field"><label>참여자 선택 (2~5명)</label><div class="seg" id="lv-players"></div></div>
      <div class="field"><label>라운드 수</label><div class="seg" id="lv-rounds">
        <button data-r="2">2라운드</button><button data-r="3" class="sel">3라운드</button><button data-r="4">4라운드</button>
      </div></div>
      <button class="btn" id="lv-start">🎲 배팅 시작!</button>
    </div>
    <div id="lv-turn" style="display:none">
      <div class="mb-strip" id="lv-strip"></div>
      <div class="lv-slots" id="lv-slots"></div>
      <div class="stage-center" style="flex:0;gap:6px;margin:14px 0 10px">
        <span class="tag" id="lv-round-tag">ROUND 1</span>
        <div class="who" id="lv-turn-name" style="font-size:32px">-</div>
        <div class="hint" id="lv-roll-msg" style="margin:0">남은 주사위를 전부 굴려요!</div>
      </div>
      <button class="btn" id="lv-roll">🎲 굴리기!</button>
      <div class="lv-tray" id="lv-tray"></div>
      <div class="lv-faces" id="lv-faces" style="display:none"></div>
      <button class="btn ghost mt" id="lv-junk-next" style="display:none">아쉽다… 다음 사람 →</button>
    </div>
    <div id="lv-settle" style="display:none">
      <div class="stage-center" style="flex:0;gap:6px;margin-bottom:10px"><span class="tag" id="lv-settle-tag">정산!</span></div>
      <div id="lv-settle-list"></div>
      <div class="mb-strip" id="lv-settle-strip" style="margin-top:12px"></div>
      <button class="btn mt" id="lv-next-round">다음 라운드 →</button>
    </div>
    <div id="lv-end" style="display:none" class="stage-center">
      <span class="tag">최종 결과</span>
      <div class="reveal-card" id="lv-rank"></div>
      <button class="btn" id="lv-again">다시 하기</button>
    </div>
  `);
snAddCss(`/* ---------- 주사위 배팅 ---------- */
  .lv-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:4px 0 8px}
  .lv-junk{color:var(--danger);font-weight:800}`);
/* ================= 주사위 배팅 ================= */
const LV_COLORS = ["var(--fire)","var(--steppe)","var(--ember)","var(--danger)","var(--milk)"];
const LV_FACE_EM = { 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅" };
const LV_DICE = ["⚀","⚁","⚂","⚃","⚄","⚅"];
let lv = { sel: [], rounds: 3, round: 1, slots: [], p: [], turn: 0, lastRoll: null };

function lvReset(){
  ["lv-setup","lv-turn","lv-settle","lv-end"].forEach(id => $(id).style.display = "none");
  $("lv-setup").style.display = "";
  const box = $("lv-players");
  box.innerHTML = "";
  lv.sel = roster.slice(0, 5);
  roster.forEach(n => {
    const b = document.createElement("button");
    b.textContent = n;
    if (lv.sel.includes(n)) b.classList.add("sel");
    b.addEventListener("click", () => {
      if (lv.sel.includes(n)) lv.sel = lv.sel.filter(x => x !== n);
      else if (lv.sel.length < 5) lv.sel.push(n);
      else return alert("5명 초과는 2인 1팀 추천!");
      b.classList.toggle("sel", lv.sel.includes(n));
    });
    box.appendChild(b);
  });
}
$("lv-rounds").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  $("lv-rounds").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel");
  lv.rounds = +b.dataset.r;
}));
$("lv-start").addEventListener("click", () => {
  if (lv.sel.length < 2) return alert("2명 이상 선택!");
  lv.p = lv.sel.map(n => ({ name: n, dice: 7, sheep: 0 }));
  lv.round = 1;
  lvNewRound();
});
function lvShow(id){
  ["lv-setup","lv-turn","lv-settle","lv-end"].forEach(x => $(x).style.display = "none");
  $(id).style.display = (id === "lv-end") ? "flex" : "";
}
/* 슬롯 4개 생성: 눈 3~6, 상금 3~8양, 합 14 미만이면 리롤 */
function lvMakeSlots(){
  while (true){
    const s = [3,4,5,6].map(() => ({ prize: 3 + Math.floor(Math.random() * 6), placed: {} }));
    if (s.reduce((a, x) => a + x.prize, 0) >= 14) return s;
  }
}
function lvNewRound(){
  lv.slots = lvMakeSlots();
  lv.p.forEach(x => { x.dice = 7; });
  lv.turn = (lv.round - 1) % lv.p.length; /* 라운드마다 선 로테이션 */
  lv.lastRoll = null;
  lvShow("lv-turn");
  lvTurn();
}
function lvRenderStrip(el){
  const strip = $(el || "lv-strip");
  strip.innerHTML = "";
  lv.p.forEach((x, i) => {
    const sp = document.createElement("span");
    sp.className = "sp" + (el ? "" : (i === lv.turn ? " now" : "") + (x.dice === 0 ? " dead" : ""));
    sp.innerHTML = '<i style="background:' + LV_COLORS[i] + '"></i>' + escHtml(x.name) + (el ? "" : " 🎲" + x.dice) + " 🐑" + x.sheep;
    strip.appendChild(sp);
  });
}
function lvRenderSlots(){
  const box = $("lv-slots");
  box.innerHTML = "";
  lv.slots.forEach((slot, si) => {
    let dots = "";
    lv.p.forEach((x, i) => {
      for (let k = 0; k < (slot.placed[i] || 0); k++) dots += '<i style="background:' + LV_COLORS[i] + '"></i>';
    });
    box.innerHTML += '<div class="lv-slot"><div class="face">' + LV_FACE_EM[si + 3] + " " + (si + 3) + '</div><div class="prize">🐑' + slot.prize + '</div><div class="dots">' + dots + '</div></div>';
  });
}
function lvTurn(){
  lvRenderStrip();
  lvRenderSlots();
  $("lv-round-tag").textContent = "ROUND " + lv.round + "/" + lv.rounds;
  const x = lv.p[lv.turn];
  $("lv-turn-name").textContent = x.name;
  $("lv-roll-msg").textContent = "남은 주사위 " + x.dice + "개를 전부 굴려요!";
  $("lv-roll").style.display = "";
  $("lv-tray").innerHTML = "";
  $("lv-faces").style.display = "none";
  $("lv-junk-next").style.display = "none";
}
$("lv-roll").addEventListener("click", () => {
  const x = lv.p[lv.turn];
  const rolls = Array.from({ length: x.dice }, () => 1 + Math.floor(Math.random() * 6));
  const tray = $("lv-tray");
  tray.innerHTML = rolls.map(() => '<span class="lv-die tumbling">⚅</span>').join("");
  const dice = [...tray.children];
  $("lv-roll").style.display = "none";
  $("lv-roll-msg").textContent = "굴리는 중…";
  haptic(20);
  /* 1) 전부 텀블 */
  let ticks = 0;
  const anim = setInterval(() => {
    dice.forEach(d => { if (d.classList.contains("tumbling")) d.textContent = LV_DICE[Math.floor(Math.random() * 6)]; });
    if (++ticks % 3 === 0) haptic(8);
    if (ticks >= 9){ clearInterval(anim); lvSettleDice(); }
  }, 70);
  /* 2) 하나씩 착지 — 꽝(1·2)은 💨 연소 */
  function lvSettleDice(){
    let i = 0;
    (function step(){
      if (i >= dice.length) return lvRevealRoll(x, rolls);
      const d = dice[i], v = rolls[i];
      d.classList.remove("tumbling");
      d.textContent = LV_DICE[v - 1];
      if (v <= 2){ d.classList.add("land"); setTimeout(() => { d.textContent = "💨"; d.classList.add("gone"); }, 240); haptic(6); }
      else { d.classList.add("land"); haptic(14); }
      i++;
      setTimeout(step, 95);
    })();
  }
});
function lvRevealRoll(x, rolls){
  const counts = { 3: 0, 4: 0, 5: 0, 6: 0 };
  let junk = 0;
  rolls.forEach(v => { if (v <= 2) junk++; else counts[v]++; });
  lv.lastRoll = { counts, junk };
  x.dice -= junk; /* 꽝 자동 소각 */
  haptic(25);
  lvRenderStrip();
  let html = [3,4,5,6].filter(f => counts[f]).map(f => "<b>" + LV_FACE_EM[f] + f + "</b>×" + counts[f]).join(" · ");
  if (junk) html += (html ? " · " : "") + '<span class="lv-junk">꽝×' + junk + ' 소각 💨</span>';
  if ([3,4,5,6].some(f => counts[f])){
    $("lv-roll-msg").innerHTML = html + "<br>한 눈만 골라 <b>전부</b> 배치!";
    const box = $("lv-faces");
    box.innerHTML = "";
    [3,4,5,6].forEach(f => {
      const b = document.createElement("button");
      b.innerHTML = LV_FACE_EM[f] + '<div class="fl">' + f + "의 더미</div>" + (counts[f] ? '<span class="cnt">' + counts[f] + '</span>' : "");
      b.disabled = !counts[f];
      b.addEventListener("click", () => lvPlace(f));
      box.appendChild(b);
    });
    box.style.display = "";
  } else {
    $("lv-roll-msg").innerHTML = html + "<br>전부 꽝… 배치할 게 없다 😇";
    $("lv-junk-next").style.display = "";
  }
}
function lvPlace(face){
  const c = lv.lastRoll && lv.lastRoll.counts[face];
  if (!c) return;
  const slot = lv.slots[face - 3];
  slot.placed[lv.turn] = (slot.placed[lv.turn] || 0) + c;
  lv.p[lv.turn].dice -= c;
  lv.lastRoll = null;
  lvAdvance();
}
$("lv-junk-next").addEventListener("click", lvAdvance);
function lvAdvance(){
  if (lv.p.every(x => x.dice === 0)) return lvSettleRound();
  do { lv.turn = (lv.turn + 1) % lv.p.length; } while (lv.p[lv.turn].dice === 0);
  lvTurn();
}
/* 순수 정산: placed {playerIdx:count} → 승자 idx. 1위 동률이면 전원 제외 후 차순위, 전부 동률이면 -1(소멸) */
function lvSlotWinner(placed){
  let pool = Object.keys(placed).map(k => ({ i: +k, c: placed[k] })).filter(e => e.c > 0);
  while (pool.length){
    const mx = Math.max(...pool.map(e => e.c));
    const top = pool.filter(e => e.c === mx);
    if (top.length === 1) return top[0].i;
    pool = pool.filter(e => e.c < mx);
  }
  return -1;
}
function lvSettleRound(){
  lvShow("lv-settle");
  $("lv-settle-tag").textContent = "ROUND " + lv.round + " 정산!";
  const list = $("lv-settle-list");
  list.innerHTML = "";
  lv.slots.forEach((slot, si) => {
    const face = si + 3;
    const w = lvSlotWinner(slot.placed);
    if (w >= 0) lv.p[w].sheep += slot.prize;
    const detail = lv.p.map((x, i) => slot.placed[i] ? escHtml(x.name) + " " + slot.placed[i] + "개" : null).filter(Boolean).join(" · ") || "배치 없음";
    const anyone = Object.keys(slot.placed).some(k => slot.placed[k] > 0);
    const line = w >= 0
      ? '<span style="color:var(--steppe)">🏆 ' + escHtml(lv.p[w].name) + " +" + slot.prize + "양</span>"
      : anyone
        ? '<span style="color:var(--danger)">💨 동률 전원 무효! 상금 소멸</span>'
        : '<span style="color:var(--dim)">아무도 안 와서 상금 소멸</span>';
    list.innerHTML += '<div class="mb-teamcard"><b>' + LV_FACE_EM[face] + " " + face + "의 더미 — 🐑" + slot.prize + "</b><span>" + detail + "<br>" + line + "</span></div>";
  });
  lvRenderStrip("lv-settle-strip");
  $("lv-next-round").textContent = lv.round < lv.rounds ? "다음 라운드 →" : "최종 결과 →";
}
$("lv-next-round").addEventListener("click", () => {
  if (lv.round < lv.rounds){ lv.round++; lvNewRound(); }
  else lvEnd();
});
function lvEnd(){
  lvShow("lv-end");
  const rank = lv.p.map(x => ({ n: x.name, s: x.sheep })).sort((a, b) => b.s - a.s);
  const medals = ["🥇","🥈","🥉"];
  $("lv-rank").innerHTML = '<div class="lbl">양 부자 랭킹</div><div class="val" style="font-size:18px;line-height:2">' +
    rank.map((r, i) => (medals[i] || "·") + " " + escHtml(r.n) + " — 🐑" + r.s + "양").join("<br>") + "</div>";
}
$("lv-again").addEventListener("click", lvReset);
snRegisterGame("lv", lvReset);
