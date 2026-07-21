"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("drawrelay", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>🎨 그림 릴레이</h2></div>

    <div id="dr-setup">
      <p class="hint">첫 사람이 제시어를 정하면 → 다음 사람이 <b>그림</b>으로 → 그 다음 사람은 그림만 보고 <b>추측</b> → 또 그림 → 또 추측... 마지막에 변천사를 쫙 공개! 순서는 자동으로 섞여요.</p>
      <button class="btn" id="dr-start">첫 라운드 시작!</button>
    </div>

    <div id="dr-handoff" style="display:none" class="pass-stage">
      <div class="who-label" id="dr-handoff-label">다음 차례</div>
      <div class="who" id="dr-handoff-name">-</div>
      <div class="hint" style="margin:0" id="dr-handoff-hint">폰을 전달해주세요. 다른 사람은 화면 보지 않기!</div>
      <button class="btn pass-next" id="dr-ready">나 왔어요, 시작! →</button>
    </div>

    <div id="dr-word" style="display:none">
      <p class="hint">아무도 안 볼 때 제시어를 정하세요. 직접 입력하거나 랜덤으로!</p>
      <input class="dr-input" id="dr-word-input" type="text" maxlength="14" placeholder="제시어 직접 입력 (예: 게르에서 라면 먹기)">
      <button class="btn ghost" id="dr-word-random">🎲 랜덤 제시어 뽑기</button>
      <button class="btn mt" id="dr-word-ok">이걸로 확정!</button>
    </div>

    <div id="dr-draw" style="display:none">
      <div class="dr-prompt"><div class="lb">이걸 그려주세요 (글자 쓰기 금지!)</div><div class="wd" id="dr-draw-word">-</div></div>
      <canvas id="draw-canvas"></canvas>
      <div class="dr-tools" id="dr-colors"></div>
      <div class="dr-tools">
        <button class="dr-tool sel" id="dr-pen">✏️ 펜</button>
        <button class="dr-tool" id="dr-thick">🖌️ 굵게</button>
        <button class="dr-tool" id="dr-eraser">🧽 지우개</button>
        <button class="dr-tool" id="dr-undo">↩️ 되돌리기</button>
        <button class="dr-tool" id="dr-clear">🗑️ 전체 삭제</button>
        <span class="dr-timer" id="dr-timer">90</span>
      </div>
      <button class="btn mt" id="dr-draw-done">다 그렸어요! →</button>
    </div>

    <div id="dr-guess" style="display:none">
      <p class="hint" style="margin-bottom:8px">앞사람이 그린 그림이에요. 뭘 그린 걸까요?</p>
      <img class="dr-guess-img" id="dr-guess-img" alt="앞사람의 그림">
      <input class="dr-input" id="dr-guess-input" type="text" maxlength="14" placeholder="정답 추측 입력">
      <button class="btn" id="dr-guess-ok">제출! →</button>
    </div>

    <div id="dr-reveal" style="display:none">
      <div class="stage-center" style="flex:0;gap:8px;margin-bottom:6px">
        <span class="tag">🎬 변천사 대공개</span>
        <div class="big-word" style="font-size:24px" id="dr-reveal-title"></div>
      </div>
      <div class="dr-chain" id="dr-chain"></div>
      <button class="btn mt" id="dr-next-round">다음 라운드 (다음 사람이 출제) →</button>
    </div>
  `);
snAddCss(`/* ---------- 그림 릴레이 ---------- */
  .dr-prompt{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 16px;text-align:center;margin-bottom:10px}
  .dr-prompt .wd{font-size:22px;font-weight:800;margin-top:4px;word-break:keep-all}
  .dr-guess-img{width:100%;border-radius:14px;background:#F7F2E6;margin-bottom:12px}
  .dr-chain{display:flex;flex-direction:column;gap:12px;margin-top:6px}
  .dr-item{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px}
  .dr-item .by{font-size:12px;color:var(--dim);font-weight:700;margin-bottom:6px}
  .dr-item img{width:100%;border-radius:10px;background:#F7F2E6}`);
/* ================= 그림 릴레이 (갈틱폰 스타일) ================= */
const DR_COLORS = ["#1A1A1A","#E8434A","#2E7DD1","#2E9E5B","#F0A030","#8B5CC9","#E86AA6"];
const DR_WORDS = [].concat(WORDS["몽골 스페셜"], WORDS["동물"], WORDS["음식"], WORDS["장소"], FH_BANK["동작"],
  ["말 타는 칭기즈칸","별똥별 보는 양","라면 끓이는 낙타","셀카 찍는 독수리","게르에서 노래방","사막에서 눈사람","늑대의 생일파티","염소 미용실"]);
let dr = {
  order: [], startIdx: 0, step: 0, chain: [], phase: null,
  drawTimerId: null, drawLeft: 30,
  cv: null, ctx: null, strokes: [], curStroke: null, color: DR_COLORS[0], size: 4, erasing: false, drawing: false
};
function drReset(){
  clearInterval(dr.drawTimerId); dr.drawTimerId = null;
  ["dr-setup","dr-handoff","dr-word","dr-draw","dr-guess","dr-reveal"].forEach(id => $(id).style.display = "none");
  $("dr-setup").style.display = "";
  dr.order = shuffle(roster);
  dr.startIdx = 0;
}
function drShow(id){
  ["dr-setup","dr-handoff","dr-word","dr-draw","dr-guess","dr-reveal"].forEach(x => $(x).style.display = "none");
  $(id).style.display = id === "dr-handoff" ? "flex" : "";
}
$("dr-start").addEventListener("click", drNewRound);
$("dr-next-round").addEventListener("click", () => {
  dr.startIdx = (dr.startIdx + 1) % dr.order.length;
  drNewRound();
});
function drNewRound(){
  dr.chain = [];
  dr.step = 0;
  drHandoff();
}
function drPlayerAt(step){
  return dr.order[(dr.startIdx + step) % dr.order.length];
}
function drPhaseAt(step){
  if (step === 0) return "word";
  return step % 2 === 1 ? "draw" : "guess";
}
function drHandoff(){
  const name = drPlayerAt(dr.step);
  const phase = drPhaseAt(dr.step);
  const show = () => {
    $("dr-handoff-name").textContent = name;
    $("dr-handoff-label").textContent = "(" + (dr.step + 1) + "/" + dr.order.length + ") 다음 차례";
    $("dr-handoff-hint").textContent = phase === "word" ? "제시어를 몰래 정할 차례예요!" : phase === "draw" ? "그림 그릴 차례예요! 다른 사람은 보지 마세요" : "그림 보고 추측할 차례예요!";
    drShow("dr-handoff");
  };
  /* 라운드 첫 차례(직전 화면이 공개 화면)는 가림막 생략 */
  if (dr.step > 0) snPassCover(name, show); else show();
}
$("dr-ready").addEventListener("click", () => {
  const phase = drPhaseAt(dr.step);
  if (phase === "word"){
    $("dr-word-input").value = "";
    drShow("dr-word");
  } else if (phase === "draw"){
    const prev = dr.chain[dr.chain.length - 1];
    $("dr-draw-word").textContent = prev.v;
    drShow("dr-draw");
    drCanvasInit();
    drStartDrawTimer();
  } else {
    const prev = dr.chain[dr.chain.length - 1];
    $("dr-guess-img").src = prev.v;
    $("dr-guess-input").value = "";
    drShow("dr-guess");
  }
});
$("dr-word-random").addEventListener("click", () => {
  $("dr-word-input").value = DR_WORDS[Math.floor(Math.random() * DR_WORDS.length)];
});
$("dr-word-ok").addEventListener("click", () => {
  const v = $("dr-word-input").value.trim();
  if (!v) return alert("제시어를 입력하거나 랜덤으로 뽑아주세요!");
  drSubmit("word", v);
});
$("dr-draw-done").addEventListener("click", () => {
  const done = () => {
    clearInterval(dr.drawTimerId); dr.drawTimerId = null;
    drSubmit("draw", dr.cv.toDataURL("image/png"));
  };
  if (dr.strokes.length) done();
  else snConfirm("🎨", "백지로 제출할까요?", "아무것도 안 그렸는데 이대로 넘어가요", "제출하기", done);
});
$("dr-guess-ok").addEventListener("click", () => {
  const v = $("dr-guess-input").value.trim();
  if (!v) return alert("추측을 입력해주세요! 대충이라도 괜찮아");
  drSubmit("guess", v);
});
function drSubmit(type, v){
  dr.chain.push({ type, v, by: drPlayerAt(dr.step) });
  dr.step++;
  if (dr.step >= dr.order.length) return drReveal();
  drHandoff();
}
function drReveal(){
  drShow("dr-reveal");
  $("dr-reveal-title").textContent = "시작: \u201C" + dr.chain[0].v + "\u201D";
  $("dr-chain").innerHTML = dr.chain.map((c, i) => {
    const label = c.type === "word" ? "✍️ 제시어" : c.type === "draw" ? "🎨 그림" : "🤔 추측";
    const body = c.type === "draw" ? '<img src="' + c.v + '" alt="그림">' : '<div class="tx">' + escHtml(c.v) + '</div>';
    return '<div class="dr-item"><div class="by">' + (i + 1) + '. ' + label + ' — ' + c.by + '</div>' + body + '</div>';
  }).join("");
}
function escHtml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* --- 캔버스 드로잉 --- */
function drCanvasInit(){
  dr.cv = $("draw-canvas");
  dr.ctx = dr.cv.getContext("2d");
  const cssW = Math.min(394, document.querySelector(".app").clientWidth - 36);
  const cssH = Math.round(cssW * 0.82);
  const dpr = window.devicePixelRatio || 1;
  dr.cv.style.width = cssW + "px"; dr.cv.style.height = cssH + "px";
  dr.cv.width = cssW * dpr; dr.cv.height = cssH * dpr;
  dr.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dr.strokes = []; dr.curStroke = null; dr.erasing = false; dr.size = 4;
  dr.color = DR_COLORS[0];
  drRepaint();
  drBuildColorBar();
  drToolSel("dr-pen");
}
function drBuildColorBar(){
  const bar = $("dr-colors");
  bar.innerHTML = "";
  DR_COLORS.forEach(c => {
    const b = document.createElement("button");
    b.className = "dr-color" + (c === dr.color ? " sel" : "");
    b.style.background = c;
    b.addEventListener("click", () => {
      dr.color = c; dr.erasing = false;
      bar.querySelectorAll(".dr-color").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      drToolSel(dr.size > 6 ? "dr-thick" : "dr-pen");
    });
    bar.appendChild(b);
  });
  drAddPicker(bar, v => { dr.color = v; dr.erasing = false; drToolSel(dr.size > 6 ? "dr-thick" : "dr-pen"); });
}
/* 네이티브 컬러 피커 스와치 — 캐치마인드·그림 릴레이 공용 */
function drAddPicker(bar, onPick){
  const inp = document.createElement("input");
  inp.type = "color"; inp.className = "dr-color pick"; inp.value = "#8B5A2B";
  inp.addEventListener("input", () => {
    onPick(inp.value);
    bar.querySelectorAll(".dr-color").forEach(x => x.classList.remove("sel"));
    inp.classList.add("sel");
  });
  bar.appendChild(inp);
}
function drToolSel(id){
  ["dr-pen","dr-thick","dr-eraser"].forEach(x => $(x).classList.toggle("sel", x === id));
}
function drPos(e){
  const r = dr.cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
/* 진행 중인 획의 마지막 구간만 그림 (매 move마다 전체 리페인트 = 끊김의 원인) */
function inkSeg(ctx, s){
  const n = s.pts.length;
  ctx.strokeStyle = s.color; ctx.lineWidth = s.size;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (n < 2){ ctx.moveTo(s.pts[0].x, s.pts[0].y); ctx.lineTo(s.pts[0].x + 0.1, s.pts[0].y); }
  else { ctx.moveTo(s.pts[n-2].x, s.pts[n-2].y); ctx.lineTo(s.pts[n-1].x, s.pts[n-1].y); }
  ctx.stroke();
}
function drRepaint(){
  const w = parseFloat(dr.cv.style.width), h = parseFloat(dr.cv.style.height);
  dr.ctx.fillStyle = "#F7F2E6";
  dr.ctx.fillRect(0, 0, w, h);
  dr.ctx.lineCap = "round"; dr.ctx.lineJoin = "round";
  dr.strokes.forEach(s => {
    dr.ctx.strokeStyle = s.color; dr.ctx.lineWidth = s.size;
    dr.ctx.beginPath();
    s.pts.forEach((p, i) => i === 0 ? dr.ctx.moveTo(p.x, p.y) : dr.ctx.lineTo(p.x, p.y));
    if (s.pts.length === 1) dr.ctx.lineTo(s.pts[0].x + 0.1, s.pts[0].y);
    dr.ctx.stroke();
  });
}
(function drBindCanvas(){
  const cv = $("draw-canvas");
  cv.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    dr.drawing = true;
    dr.curStroke = { color: dr.erasing ? "#F7F2E6" : dr.color, size: dr.erasing ? 22 : dr.size, pts: [drPos(e)] };
    dr.strokes.push(dr.curStroke);
    inkSeg(dr.ctx, dr.curStroke);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!dr.drawing) return;
    e.preventDefault();
    dr.curStroke.pts.push(drPos(e));
    inkSeg(dr.ctx, dr.curStroke);
  });
  const up = () => { dr.drawing = false; dr.curStroke = null; };
  cv.addEventListener("pointerup", up);
  cv.addEventListener("pointercancel", up);
})();
$("dr-pen").addEventListener("click", () => { dr.erasing = false; dr.size = 4; drToolSel("dr-pen"); });
$("dr-thick").addEventListener("click", () => { dr.erasing = false; dr.size = 10; drToolSel("dr-thick"); });
$("dr-eraser").addEventListener("click", () => { dr.erasing = true; drToolSel("dr-eraser"); });
$("dr-undo").addEventListener("click", () => { dr.strokes.pop(); drRepaint(); });
$("dr-clear").addEventListener("click", () => {
  if (!dr.strokes.length) return;
  snConfirm("🧽", "전체 삭제할까요?", "그린 선이 모두 지워져요", "삭제", () => { dr.strokes = []; drRepaint(); });
});
function drStartDrawTimer(){
  clearInterval(dr.drawTimerId);
  dr.drawLeft = 30;
  $("dr-timer").textContent = dr.drawLeft;
  dr.drawTimerId = setInterval(() => {
    dr.drawLeft--;
    $("dr-timer").textContent = dr.drawLeft > 0 ? dr.drawLeft : "시간 초과! (그래도 마저 그리세요)";
    if (dr.drawLeft <= 0){ clearInterval(dr.drawTimerId); dr.drawTimerId = null; }
  }, 1000);
}
snRegisterGame("drawrelay", drReset);
