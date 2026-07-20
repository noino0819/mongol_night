"use strict";
/* ================= 그림 퀴즈 (캐치마인드식) ================= */
const CM_BANK = {
  "쉬움 (사물/동물)": [].concat(WORDS["동물"], ["게르","텐트","별","말","우산","안경","라면","기타","자전거","선인장","무지개","전구","시계","눈사람"]),
  "동작": FH_BANK["동작"],
  "장소": WORDS["장소"],
  "몽골 여행": WORDS["몽골 스페셜"],
  "어려움 (추상/합성)": ["월요병","여행 첫날 설렘","단체사진 각 잡기","와이파이 없는 삶","새벽 감성","길치","반전 매력","선택장애","N행시 짓는 중","귀차니즘","금강산도 식후경","꿈에서 깬 직후","환승 대기","짐 싸기 고수","알람 5분만 더"]
};
let cm = {
  cat: "쉬움 (사물/동물)", time: 90, rounds: 1,
  players: [], scores: [], turn: 0, totalTurns: 0, word: "", deck: [],
  timerId: null, left: 90,
  strokes: [], cur: null, color: DR_COLORS[0], size: 4, erasing: false, drawing: false, cv: null, ctx: null
};
(function initCm(){
  const cats = $("cm-cats");
  Object.keys(CM_BANK).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    if (c === cm.cat) b.classList.add("sel");
    b.addEventListener("click", () => { cm.cat = c; cats.querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); });
    cats.appendChild(b);
  });
  $("cm-times").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("cm-times").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    cm.time = parseInt(b.dataset.t, 10);
  }));
  $("cm-rounds").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("cm-rounds").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    cm.rounds = parseInt(b.dataset.r, 10);
  }));
})();
function cmReset(){
  clearInterval(cm.timerId); cm.timerId = null;
  ["cm-setup","cm-secret","cm-draw","cm-pick","cm-end"].forEach(id => $(id).style.display = "none");
  $("cm-setup").style.display = "";
}
function cmShow(id){
  ["cm-setup","cm-secret","cm-draw","cm-pick","cm-end"].forEach(x => $(x).style.display = "none");
  $(id).style.display = id === "cm-secret" ? "flex" : "";
}
$("cm-start").addEventListener("click", () => {
  cm.players = shuffle(roster);
  cm.scores = cm.players.map(() => 0);
  cm.turn = 0;
  cm.totalTurns = cm.players.length * cm.rounds;
  cm.deck = shuffle(CM_BANK[cm.cat]);
  cmSecret();
});
function cmDrawWord(){
  if (!cm.deck.length) cm.deck = shuffle(CM_BANK[cm.cat]);
  return cm.deck.pop();
}
function cmSecret(){
  cm.word = cmDrawWord();
  const drawer = cm.players[cm.turn % cm.players.length];
  $("cm-secret-name").textContent = drawer;
  $("cm-secret-round").textContent = "(" + (cm.turn + 1) + "/" + cm.totalTurns + ") 그릴 사람";
  $("cm-godraw").disabled = true;
  const hb = $("cm-secret-hold");
  hb.classList.remove("revealed");
  hb.innerHTML = '<div class="sub">🤫</div><div class="big">꾹 누르면<br>제시어 공개</div><div class="sub">손 떼면 사라져요</div>';
  cmShow("cm-secret");
}
holdReveal($("cm-secret-hold"),
  () => {
    const hb = $("cm-secret-hold");
    hb.classList.add("revealed");
    hb.innerHTML = '<div class="sub">제시어</div><div class="big"></div><div class="sub">이걸 그림으로!</div>';
    hb.querySelector(".big").textContent = cm.word;
    $("cm-godraw").disabled = false;
  },
  () => {
    const hb = $("cm-secret-hold");
    hb.classList.remove("revealed");
    hb.innerHTML = '<div class="sub">🤫</div><div class="big">꾹 누르면<br>제시어 공개</div><div class="sub">손 떼면 사라져요</div>';
  }
);
$("cm-reroll").addEventListener("click", () => {
  cm.word = cmDrawWord();
  $("cm-godraw").disabled = true;
  alert("새 제시어를 뽑았어요! 다시 꾹 눌러 확인하세요");
});
$("cm-godraw").addEventListener("click", () => {
  cmShow("cm-draw");
  $("cm-drawer-label").textContent = "🖍️ " + cm.players[cm.turn % cm.players.length] + " 그리는 중";
  cmRenderScores();
  cmPadInit();
  clearInterval(cm.timerId);
  cm.left = cm.time;
  $("cm-timer").textContent = cm.left;
  cm.timerId = setInterval(() => {
    cm.left--;
    $("cm-timer").textContent = cm.left;
    if (cm.left <= 0){
      clearInterval(cm.timerId); cm.timerId = null;
      lifeModal("⏰", "시간 초과!", "정답은 \u201C" + cm.word + "\u201D 였습니다!", cmNextTurn);
    }
  }, 1000);
});
function cmRenderScores(){
  const drawerIdx = cm.turn % cm.players.length;
  $("cm-scores").innerHTML = cm.players.map((n, i) =>
    '<div class="sp' + (i === drawerIdx ? " now" : "") + '">' + n + ' ' + cm.scores[i] + '점</div>'
  ).join("");
}
holdReveal($("cm-peek"),
  () => { $("cm-peek").textContent = "🤫 " + cm.word; },
  () => { $("cm-peek").textContent = "🤫 제시어 (꾹, 손으로 가리고!)"; }
);
$("cm-correct").addEventListener("click", () => {
  clearInterval(cm.timerId); cm.timerId = null;
  const drawerIdx = cm.turn % cm.players.length;
  const grid = $("cm-pick-grid");
  grid.innerHTML = "";
  cm.players.forEach((n, i) => {
    if (i === drawerIdx) return;
    const b = document.createElement("button");
    b.textContent = n;
    b.addEventListener("click", () => {
      cm.scores[i] += 2;
      cm.scores[drawerIdx] += 1;
      lifeModal("🎉", n + " 정답!", "\u201C" + cm.word + "\u201D — " + n + " +2점, 그린 " + cm.players[drawerIdx] + " +1점", cmNextTurn);
    });
    grid.appendChild(b);
  });
  cmShow("cm-pick");
});
$("cm-giveup").addEventListener("click", () => {
  if (!confirm("포기하고 정답을 공개할까요?")) return;
  clearInterval(cm.timerId); cm.timerId = null;
  lifeModal("😅", "포기!", "정답은 \u201C" + cm.word + "\u201D 였습니다", cmNextTurn);
});
function cmNextTurn(){
  cm.turn++;
  if (cm.turn >= cm.totalTurns) return cmEnd();
  cmSecret();
}
function cmEnd(){
  cmShow("cm-end");
  const rank = cm.players.map((n, i) => ({ n, s: cm.scores[i] })).sort((a, b) => b.s - a.s);
  const medals = ["🥇","🥈","🥉"];
  $("cm-rank").innerHTML = '<div class="lbl">그림 퀴즈 왕</div><div class="val" style="font-size:19px;line-height:2">' +
    rank.map((r, i) => (medals[i] || "·") + " " + r.n + " — " + r.s + "점").join("<br>") + '</div>';
}
$("cm-again").addEventListener("click", cmReset);

/* --- 캐치마인드 전용 캔버스 패드 --- */
function cmPadInit(){
  cm.cv = $("cm-canvas");
  cm.ctx = cm.cv.getContext("2d");
  const cssW = Math.min(394, document.querySelector(".app").clientWidth - 36);
  const cssH = Math.round(cssW * 0.78);
  const dpr = window.devicePixelRatio || 1;
  cm.cv.style.width = cssW + "px"; cm.cv.style.height = cssH + "px";
  cm.cv.width = cssW * dpr; cm.cv.height = cssH * dpr;
  cm.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cm.strokes = []; cm.cur = null; cm.erasing = false; cm.size = 4; cm.color = DR_COLORS[0];
  cmRepaint();
  const bar = $("cm-colors");
  bar.innerHTML = "";
  DR_COLORS.forEach(c => {
    const b = document.createElement("button");
    b.className = "dr-color" + (c === cm.color ? " sel" : "");
    b.style.background = c;
    b.addEventListener("click", () => {
      cm.color = c; cm.erasing = false;
      bar.querySelectorAll(".dr-color").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      cmToolSel(cm.size > 6 ? "cm-thick" : "cm-pen");
    });
    bar.appendChild(b);
  });
  cmToolSel("cm-pen");
}
function cmToolSel(id){
  ["cm-pen","cm-thick","cm-eraser"].forEach(x => $(x).classList.toggle("sel", x === id));
}
function cmPos(e){
  const r = cm.cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function cmRepaint(){
  const w = parseFloat(cm.cv.style.width), h = parseFloat(cm.cv.style.height);
  cm.ctx.fillStyle = "#F7F2E6";
  cm.ctx.fillRect(0, 0, w, h);
  cm.ctx.lineCap = "round"; cm.ctx.lineJoin = "round";
  cm.strokes.forEach(s => {
    cm.ctx.strokeStyle = s.color; cm.ctx.lineWidth = s.size;
    cm.ctx.beginPath();
    s.pts.forEach((p, i) => i === 0 ? cm.ctx.moveTo(p.x, p.y) : cm.ctx.lineTo(p.x, p.y));
    if (s.pts.length === 1) cm.ctx.lineTo(s.pts[0].x + 0.1, s.pts[0].y);
    cm.ctx.stroke();
  });
}
(function cmBindCanvas(){
  const cv = $("cm-canvas");
  cv.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    cm.drawing = true;
    cm.cur = { color: cm.erasing ? "#F7F2E6" : cm.color, size: cm.erasing ? 22 : cm.size, pts: [cmPos(e)] };
    cm.strokes.push(cm.cur);
    inkSeg(cm.ctx, cm.cur);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!cm.drawing) return;
    e.preventDefault();
    cm.cur.pts.push(cmPos(e));
    inkSeg(cm.ctx, cm.cur);
  });
  const up = () => { cm.drawing = false; cm.cur = null; };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
})();
$("cm-pen").addEventListener("click", () => { cm.erasing = false; cm.size = 4; cmToolSel("cm-pen"); });
$("cm-thick").addEventListener("click", () => { cm.erasing = false; cm.size = 10; cmToolSel("cm-thick"); });
$("cm-eraser").addEventListener("click", () => { cm.erasing = true; cmToolSel("cm-eraser"); });
$("cm-undo").addEventListener("click", () => { cm.strokes.pop(); cmRepaint(); });
$("cm-clear").addEventListener("click", () => { cm.strokes = []; cmRepaint(); });

