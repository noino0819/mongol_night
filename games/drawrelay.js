"use strict";
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
  if (!dr.strokes.length && !confirm("아무것도 안 그렸는데 제출할까요?")) return;
  clearInterval(dr.drawTimerId); dr.drawTimerId = null;
  drSubmit("draw", dr.cv.toDataURL("image/png"));
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
$("dr-clear").addEventListener("click", () => { if (confirm("전체 삭제할까요?")){ dr.strokes = []; drRepaint(); } });
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

