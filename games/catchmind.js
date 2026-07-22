"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("catchmind", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>🖍️ 그림 퀴즈</h2></div>

    <div id="cm-setup">
      <p class="hint">그리는 사람만 제시어를 몰래 확인하고, 폰을 테이블에 놓고 그려요. 나머지는 화면 보면서 정답을 외치기! 맞힌 사람 <b style="color:var(--steppe)">+2점</b>, 그린 사람 <b style="color:var(--fire)">+1점</b>. 전원이 한 번씩 그리면 한 바퀴!</p>
      <div class="field"><label>카테고리</label><div class="seg" id="cm-cats"></div></div>
      <div class="field"><label>제한시간</label><div class="seg" id="cm-times">
        <button data-t="15">15초</button><button data-t="30" class="sel">30초</button><button data-t="60">60초</button>
      </div></div>
      <div class="field"><label>바퀴 수 (전원 1번 그리기 = 1바퀴)</label><div class="seg" id="cm-rounds">
        <button data-r="1" class="sel">1바퀴</button><button data-r="2">2바퀴</button><button data-r="3">3바퀴</button>
      </div></div>
      <button class="btn mt" id="cm-start">시작!</button>
    </div>

    <div id="cm-secret" style="display:none" class="pass-stage">
      <div class="who-label" id="cm-secret-round">그릴 사람</div>
      <div class="who" id="cm-secret-name">-</div>
      <div class="hint" style="margin:0">혼자만 제시어를 확인하세요!</div>
      <button class="hold-btn" id="cm-secret-hold"><div class="sub">🤫</div><div class="big">꾹 누르면<br>제시어 공개</div><div class="sub">손 떼면 사라져요</div></button>
      <button class="btn ghost pass-next" id="cm-reroll" style="margin-top:16px">🎲 제시어 재뽑기</button>
      <button class="btn mt" id="cm-godraw" disabled>외웠어요, 그리기 시작! →</button>
    </div>

    <div id="cm-draw" style="display:none">
      <div class="cm-score-strip" id="cm-scores"></div>
      <div class="cm-topline"><b id="cm-drawer-label">-</b><span class="dr-timer" id="cm-timer">90</span></div>
      <canvas id="cm-canvas"></canvas>
      <div class="dr-tools" id="cm-colors"></div>
      <div class="dr-tools">
        <button class="dr-tool sel" id="cm-pen">✏️ 펜</button>
        <button class="dr-tool" id="cm-thick">🖌️ 굵게</button>
        <button class="dr-tool" id="cm-eraser">🧽 지우개</button>
        <button class="dr-tool" id="cm-undo">↩️</button>
        <button class="dr-tool" id="cm-clear" style="line-height:0;padding:6px 10px"><px-sprite name="trash" scale="2"></px-sprite></button>
        <button class="dr-tool cm-peek" id="cm-peek">🤫 제시어 (꾹, 손으로 가리고!)</button>
      </div>
      <div class="cm-actions">
        <button class="btn" id="cm-correct">🙌 정답 나왔어요!</button>
        <button class="btn ghost" id="cm-giveup">⏭️ 포기</button>
      </div>
    </div>

    <div id="cm-pick" style="display:none">
      <div class="stage-center" style="flex:0;gap:8px">
        <span class="tag">누가 맞혔나요?</span>
      </div>
      <div class="name-grid" id="cm-pick-grid"></div>
    </div>

    <div id="cm-end" style="display:none" class="stage-center">
      <span class="tag">최종 점수</span>
      <div class="reveal-card" id="cm-rank"></div>
      <button class="btn" id="cm-again">다시 하기</button>
    </div>
  `);
snAddCss(`/* ---------- 그림 퀴즈 (캐치마인드식) ---------- */
  .cm-score-strip{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
  .cm-topline{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
  .cm-topline b{font-size:15px}
  .cm-actions{display:flex;gap:8px;margin-top:10px}
  .cm-peek{font-size:13px !important}`);
/* ================= 그림 퀴즈 (캐치마인드식) ================= */
const CM_BANK = {
  "쉬움 (사물/동물)": [].concat(WORDS["동물"], ["게르","텐트","별","말","우산","안경","라면","기타","자전거","선인장","무지개","전구","시계","눈사람"]),
  "동작": FH_BANK["동작"],
  "장소": WORDS["장소"],
  "몽골 여행": WORDS["몽골 스페셜"],
  "어려움 (추상/합성)": ["월요병","여행 첫날 설렘","단체사진 각 잡기","와이파이 없는 삶","새벽 감성","길치","반전 매력","선택장애","N행시 짓는 중","귀차니즘","금강산도 식후경","꿈에서 깬 직후","환승 대기","짐 싸기 고수","알람 5분만 더"]
};
let cm = {
  cat: "쉬움 (사물/동물)", time: 30, rounds: 1,
  players: [], scores: [], turn: 0, totalTurns: 0, word: "", deck: [],
  timerId: null, left: 30,
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
    if (cm.left === 5) snSfx("alarm");             /* 시간 경고 (한 번만) */
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
      snSfx("correct");                            /* 정답자 확정 */
      lifeModal("🎉", n + " 정답!", "\u201C" + cm.word + "\u201D — " + n + " +2점, 그린 " + cm.players[drawerIdx] + " +1점", cmNextTurn);
    });
    grid.appendChild(b);
  });
  cmShow("cm-pick");
});
$("cm-giveup").addEventListener("click", () => {
  snConfirm("😅", "포기할까요?", "정답을 공개하고 다음 차례로 넘어가요", "포기하기", () => {
  if (!cm.timerId) return; /* 모달 떠 있는 사이 시간 초과로 이미 넘어간 경우 */
  clearInterval(cm.timerId); cm.timerId = null;
  lifeModal("😅", "포기!", "정답은 \u201C" + cm.word + "\u201D 였습니다", cmNextTurn);
  });
});
function cmNextTurn(){
  cm.turn++;
  if (cm.turn >= cm.totalTurns) return cmEnd();
  cmSecret();
}
function cmEnd(){
  snSfx("win");                                    /* 최종 순위 발표 */
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
  drAddPicker(bar, v => { cm.color = v; cm.erasing = false; cmToolSel(cm.size > 6 ? "cm-thick" : "cm-pen"); });
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
snRegisterGame("catchmind", cmReset);
