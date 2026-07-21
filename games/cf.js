"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("cf", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>🌈 색찾기</h2></div>
    <div id="cf-root"></div>
  `);
/* ================= 색찾기 (color hunt) — 여러 폰 전용 =================
   호스트가 라운드를 시작하면 모두의 폰에 목표 색이 뜬다. 각자 폰 카메라(중앙 네모)로
   주변에서 그 색과 가장 비슷한 걸 찾아 제출. 호스트가 제출된 색들을 목표와 비교(Lab ΔE)
   해 제일 가까운 사람만 1점(동률이면 나눠 가짐). 여러 라운드 누적, 최다 점수가 우승.
   판정은 전부 호스트(net.js 브릿지) — 게스트는 잡은 RGB만 보냄. 솔로 불가(연결 유도).
   ponytail: 폰마다 카메라 화이트밸런스가 달라 색이 조금씩 튀는 건 파티게임 감안(보정 없음).
             정밀 비교가 필요해지면 흰 종이 캘리브레이션 추가. */

/* 이름 있는 색이라야 "찾을 맛"이 남 (완전 랜덤 hex는 사냥·명명이 어려움) */
const CF_COLORS = [
  { n:"빨강",   hex:"#E23B3B" }, { n:"주황",   hex:"#F08B2E" },
  { n:"노랑",   hex:"#F2C531" }, { n:"연두",   hex:"#8FCB4E" },
  { n:"초록",   hex:"#3AA65B" }, { n:"청록",   hex:"#2FB6AE" },
  { n:"하늘",   hex:"#4FA9E8" }, { n:"파랑",   hex:"#3A63D6" },
  { n:"남색",   hex:"#3A3E8C" }, { n:"보라",   hex:"#8B54C9" },
  { n:"분홍",   hex:"#EE84B4" }, { n:"갈색",   hex:"#8A5A32" },
  { n:"베이지", hex:"#D8C7A0" }, { n:"회색",   hex:"#9098A6" },
  { n:"검정",   hex:"#2A2E38" }, { n:"흰색",   hex:"#EDEDE8" }
];

let cf = { round:0, target:null, subs:{}, scores:{}, players:[], phase:null, cur:[136,136,136], locked:false, stream:null, raf:0 };

/* ---------- 색 수학 (sRGB → Lab, ΔE76) ---------- */
function cfSafeHex(h){ return /^#[0-9A-Fa-f]{6}$/.test(h) ? h : "#888888"; }
function cfHexRgb(hex){ hex = cfSafeHex(hex); return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]; }
/* 원격에서 온 RGB는 배열·범위 검증 (style 삽입·색수학 신뢰경계) */
function cfCleanRgb(v){ if (!Array.isArray(v) || v.length !== 3) return null; const c = v.map(x => Math.max(0, Math.min(255, x|0))); return c.some(x => !Number.isFinite(x)) ? null : c; }
function cfLin(c){ c /= 255; return c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function cfLab(rgb){
  const r = cfLin(rgb[0]), g = cfLin(rgb[1]), b = cfLin(rgb[2]);
  const f = (t) => t > 0.008856 ? Math.cbrt(t) : (7.787*t + 16/116);
  const x = f((r*0.4124 + g*0.3576 + b*0.1805)/0.95047);
  const y = f(r*0.2126 + g*0.7152 + b*0.0722);
  const z = f((r*0.0193 + g*0.1192 + b*0.9505)/1.08883);
  return [116*y - 16, 500*(x-y), 200*(y-z)];
}
function cfDE(rgb1, rgb2){ const a = cfLab(rgb1), b = cfLab(rgb2); return Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]); }
function cfAcc(dE){ return Math.max(0, Math.round(100 - dE)); } /* 친근한 정확도% (ΔE 0 = 100%) */

/* ---------- 카메라 (중앙 패치 평균 샘플) ---------- */
function cfRoot(){ return $("cf-root"); }
function cfCamStop(){ cancelAnimationFrame(cf.raf); cf.raf = 0; if (cf.stream){ cf.stream.getTracks().forEach(t => t.stop()); cf.stream = null; } }
function cfCamStart(video, onSample){
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((stream) => {
    cf.stream = stream; video.srcObject = stream; video.play().catch(() => {});
    const cv = document.createElement("canvas"); const S = 48; cv.width = S; cv.height = S;
    const g = cv.getContext("2d", { willReadFrequently: true });
    let last = 0;
    const loop = (ts) => {
      cf.raf = requestAnimationFrame(loop);
      if (ts - last < 90 || video.readyState < 2 || !video.videoWidth) return; /* ~11fps면 충분 */
      last = ts;
      const vw = video.videoWidth, vh = video.videoHeight, m = Math.min(vw, vh) * 0.25; /* 중앙 25% 정사각 */
      g.drawImage(video, (vw-m)/2, (vh-m)/2, m, m, 0, 0, S, S);
      const d = g.getImageData(0, 0, S, S).data;
      let r = 0, gg = 0, b = 0; const n = S*S;
      for (let i = 0; i < d.length; i += 4){ r += d[i]; gg += d[i+1]; b += d[i+2]; }
      cf.cur = [Math.round(r/n), Math.round(gg/n), Math.round(b/n)];
      onSample(cf.cur);
    };
    cf.raf = requestAnimationFrame(loop);
  }).catch(() => {
    const h = $("cf-hint"); if (h) h.textContent = "카메라 권한이 필요해 — 허용하고 다시 들어와줘";
  });
}

/* ---------- 공용 렌더 조각 ---------- */
function cfTargetHtml(target, label){
  const hex = cfSafeHex(target && target.hex);
  return '<div class="stage-center" style="flex:0;gap:8px">' +
    '<span class="tag">' + label + '</span>' +
    '<div style="width:118px;height:118px;border-radius:18px;border:2px solid var(--line);background:' + hex + '"></div>' +
    '<div class="who" style="font-size:26px">🌈 ' + escHtml(String(target && target.n || "?")) + '</div></div>';
}
function cfBoardHtml(scores){
  const rank = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  if (!rank.length) return "";
  const medals = ["🥇","🥈","🥉"];
  let mi = 0;
  const rows = rank.map((n, i) => {
    if (i > 0 && scores[n] < scores[rank[i-1]]) mi = i;
    return (medals[mi] || "·") + " " + escHtml(n) + " — " + scores[n] + "점";
  });
  return '<div class="reveal-card" style="margin-top:10px"><div class="lbl">누적 점수</div>' +
    '<div class="val" style="font-size:16px;line-height:1.9">' + rows.join("<br>") + '</div></div>';
}

/* ---------- 대기실 / 진입 ---------- */
function cfReset(){
  cfCamStop();
  cf.phase = "lobby";
  cfLobby();
}
function cfLobby(){
  const connected = typeof mpLive === "function" && mpLive();
  if (!connected){
    cfRoot().innerHTML =
      '<div class="stage-center" style="gap:12px"><div style="font-size:64px">🌈</div>' +
      '<div class="who">여러 폰으로 즐기는 게임</div>' +
      '<p class="hint" style="margin:0">각자 폰 카메라로 목표 색과 가장 비슷한 걸 주변에서 찾아! 먼저 폰을 연결해줘</p>' +
      '<button class="btn" id="cf-goconnect">📡 폰 연결하러 가기</button></div>';
    $("cf-goconnect").addEventListener("click", () => go("mp"));
    return;
  }
  if (mpAmHost()){
    mp.game = { onMsg: cfHostMsg, onPeers(){ if (cf.phase === "lobby") cfLobby(); } };
    cfRoot().innerHTML =
      '<div class="stage-center" style="gap:10px"><span class="tag">색찾기 · ' + mpNames().length + '명</span>' +
      '<div style="font-size:56px">🌈</div><div class="who">주변에서 색을 찾아라</div>' +
      '<p class="hint" style="margin:0">라운드를 시작하면 모두의 폰에 목표 색이 떠. 카메라로 가장 비슷한 색을 찾아 제출 — 제일 가까운 사람이 1점!</p></div>' +
      cfBoardHtml(cf.scores) +
      '<button class="btn mt" id="cf-start">' + (cf.round ? "다음 라운드 시작" : "라운드 시작") + '</button>' +
      (cf.round ? '<button class="btn ghost mt" id="cf-end2">게임 끝내기 · 순위</button>' : '');
    $("cf-start").addEventListener("click", cfStartRound);
    const e2 = $("cf-end2"); if (e2) e2.addEventListener("click", cfEnd);
  } else {
    cfWaitScreen();
  }
}
function cfWaitScreen(){
  cf.phase = "wait";
  cfRoot().innerHTML = '<div class="stage-center"><span class="tag">색찾기</span><div class="who">대기 중…</div>' +
    '<p class="hint" style="margin:0">호스트가 라운드를 시작하면 카메라가 켜져</p></div>';
  mp.game = { onMsg(from, m){ cfGuestMsg(m); } };
}

/* ---------- 잡기 화면 (호스트·게스트 공용) ---------- */
function cfCaptureUI(isHost, target){
  cfCamStop();
  cf.target = target; cf.locked = false;
  const tRgb = cfHexRgb(target.hex);
  cfRoot().innerHTML =
    cfTargetHtml(target, "이 색을 찾아!") +
    '<div style="position:relative;margin-top:12px">' +
      '<video id="cf-video" playsinline muted style="width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:16px;background:#000;display:block"></video>' +
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:74px;height:74px;border:3px solid #fff;border-radius:10px;box-shadow:0 0 0 2px rgba(0,0,0,.55);pointer-events:none"></div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-top:12px">' +
      '<span id="cf-swatch" style="width:48px;height:48px;border-radius:10px;border:1px solid var(--line);background:#888"></span>' +
      '<div><div id="cf-acc" style="font-size:22px;font-weight:800">–</div><div id="cf-hint" class="hint" style="margin:0">중앙 네모를 색에 맞춰봐</div></div>' +
    '</div>' +
    '<button class="btn mt" id="cf-submit">이 색으로 제출</button>' +
    (isHost ? '<div id="cf-hoststat" class="hint" style="text-align:center;margin-top:10px"></div>' +
              '<button class="btn ghost mt" id="cf-reveal">그만 받고 결과 공개</button>' : '');
  const sw = $("cf-swatch"), accEl = $("cf-acc"), hintEl = $("cf-hint");
  cfCamStart($("cf-video"), (rgb) => {
    if (cf.locked) return;
    sw.style.background = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
    const acc = cfAcc(cfDE(rgb, tRgb));
    accEl.textContent = acc + "%";
    hintEl.textContent = acc >= 85 ? "🔥 거의 똑같아!" : acc >= 65 ? "😮 꽤 비슷해" : acc >= 40 ? "🙂 그럭저럭" : "❄️ 아직 멀었어";
  });
  $("cf-submit").addEventListener("click", () => cfSubmit(isHost));
  if (isHost){ $("cf-reveal").addEventListener("click", cfHostReveal); cfHostStat(); }
}
function cfSubmit(isHost){
  if (cf.locked) return;
  cf.locked = true;
  const rgb = cf.cur.slice();
  cfCamStop();
  const b = $("cf-submit"); if (b){ b.disabled = true; b.textContent = "제출 완료 ✓"; }
  haptic(20);
  if (isHost){ cf.subs[mp.name] = rgb; cfHostStat(); cfCheckAll(); }
  else { mpToHost({ t:"submit", rgb }); const h = $("cf-hint"); if (h) h.textContent = "제출 완료! 결과 기다리는 중…"; }
}

/* ---------- 호스트 (심판·전광판) ---------- */
function cfStartRound(){
  const players = mpNames();
  if (players.length < 2){ alert("색찾기는 폰이 2대 이상 연결돼야 해 (지금 " + players.length + "명)"); return; }
  cf.players = players;
  cf.round++;
  let t; do { t = CF_COLORS[Math.floor(Math.random() * CF_COLORS.length)]; } while (cf.target && t.n === cf.target.n);
  cf.target = t; cf.subs = {}; cf.phase = "capture";
  mp.game = { onMsg: cfHostMsg, onPeers(){ if (cf.phase === "capture") cfHostStat(); } };
  mpNav("cf");
  mpBroadcast({ t:"round", target: t });
  cfCaptureUI(true, t);
}
function cfHostMsg(from, m){
  if (m.t !== "submit" || cf.phase !== "capture") return;
  if (!cf.players.includes(from) || cf.subs[from] !== undefined) return;
  const rgb = cfCleanRgb(m.rgb); if (!rgb) return;
  cf.subs[from] = rgb;
  cfHostStat(); cfCheckAll();
}
function cfHostStat(){
  const el = $("cf-hoststat"); if (!el) return;
  const done = cf.players.filter(p => cf.subs[p] !== undefined).length;
  el.textContent = "제출 " + done + "/" + cf.players.length;
}
function cfCheckAll(){ if (cf.phase === "capture" && cf.players.every(p => cf.subs[p] !== undefined)) cfHostReveal(); }
function cfHostReveal(){
  if (cf.phase !== "capture") return;
  const tRgb = cfHexRgb(cf.target.hex);
  const scored = cf.players.filter(p => cf.subs[p]).map(p => { const dist = cfDE(cf.subs[p], tRgb); return { name:p, rgb:cf.subs[p], dist, acc:cfAcc(dist) }; });
  if (!scored.length){ alert("아직 아무도 제출 안 했어"); return; }
  scored.sort((a, b) => a.dist - b.dist);
  const best = scored[0].dist; /* 가장 가까운 사람만 1점 (동률이면 나눠 가짐) */
  scored.forEach((r, i) => { r.rank = i + 1; r.pts = r.dist === best ? 1 : 0; if (r.pts) cf.scores[r.name] = (cf.scores[r.name] || 0) + 1; });
  const missing = cf.players.filter(p => !cf.subs[p]).map(p => ({ name:p, rgb:null, acc:0, pts:0, rank:0 }));
  const rows = scored.map(r => ({ name:r.name, rgb:r.rgb, acc:r.acc, pts:r.pts, rank:r.rank })).concat(missing);
  cf.phase = "reveal";
  mpBroadcast({ t:"result", target: cf.target, rows, scores: cf.scores });
  cfResultUI(rows, cf.target, cf.scores, true);
}

/* ---------- 결과 (공용) ---------- */
function cfResultUI(rows, target, scores, isHost){
  cfCamStop();
  cf.phase = "reveal";
  const body = (Array.isArray(rows) ? rows : []).map((r) => {
    const rgb = cfCleanRgb(r.rgb);
    const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : rgb ? "·" : "—";
    const sw = rgb
      ? '<span style="display:inline-block;width:34px;height:34px;border-radius:8px;border:1px solid var(--line);background:rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')"></span>'
      : '<span style="width:34px;font-size:12px;opacity:.5;text-align:center">미제출</span>';
    const me = (!isHost && r.name === mp.name) ? ' style="color:var(--fire);font-weight:800"' : '';
    const tail = rgb ? ((r.acc|0) + "%" + ((r.pts|0) ? ' <span style="color:var(--steppe)">+' + (r.pts|0) + '</span>' : "")) : "";
    return '<div style="display:flex;align-items:center;gap:10px;padding:7px 4px;border-bottom:1px solid var(--line)">' +
      '<span style="width:26px;text-align:center;font-size:18px">' + medal + '</span>' + sw +
      '<span' + me + '>' + escHtml(String(r.name)) + '</span>' +
      '<span style="margin-left:auto;font-weight:700">' + tail + '</span></div>';
  }).join("");
  cfRoot().innerHTML =
    cfTargetHtml(target, "이 색이었어") +
    '<div style="margin-top:12px">' + body + '</div>' +
    cfBoardHtml(scores) +
    (isHost ? '<button class="btn mt" id="cf-next">다음 라운드 →</button><button class="btn ghost mt" id="cf-end">게임 끝내기 · 순위</button>'
            : '<div class="hint" style="margin-top:14px;text-align:center">호스트가 다음 라운드를 시작할 때까지 대기</div>');
  if (isHost){ $("cf-next").addEventListener("click", cfStartRound); $("cf-end").addEventListener("click", cfEnd); }
}

/* ---------- 종료 (공용) ---------- */
function cfEnd(){ cf.phase = "end"; mpBroadcast({ t:"end", scores: cf.scores }); cfEndUI(cf.scores, true); }
function cfEndUI(scores, isHost){
  cfCamStop(); cf.phase = "end";
  const rank = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  const champ = rank.length ? rank.filter(n => scores[n] === scores[rank[0]]) : [];
  cfRoot().innerHTML =
    '<div class="stage-center" style="gap:10px"><span class="tag">최종 순위</span>' +
    '<div style="font-size:64px">👑</div>' +
    '<div class="who" style="color:var(--fire)">' + (champ.length ? champ.map(escHtml).join(", ") : "무승부") + '</div></div>' +
    cfBoardHtml(scores) +
    (isHost ? '<button class="btn mt" id="cf-restart">새 게임</button>'
            : '<div class="hint" style="text-align:center;margin-top:14px">호스트가 새 게임을 시작할 때까지 대기</div>');
  if (isHost) $("cf-restart").addEventListener("click", () => { cf.round = 0; cf.scores = {}; cf.target = null; cfReset(); });
}

/* ---------- 게스트 ---------- */
window.__guest_cf = function(){ cfCamStop(); cfWaitScreen(); };
function cfGuestMsg(m){
  if (m.t === "round"){ if (!m.target) return; cfCaptureUI(false, { n: String(m.target.n || "?"), hex: cfSafeHex(m.target.hex) }); }
  else if (m.t === "result"){ cfResultUI(m.rows, { n: String(m.target && m.target.n || "?"), hex: cfSafeHex(m.target && m.target.hex) }, m.scores || {}, false); }
  else if (m.t === "end"){ cfEndUI(m.scores || {}, false); }
}

/* 어떤 경로로든 화면을 벗어나면 카메라 끄기 — 뒤로가기·호스트가 홈/다른 게임으로 끌고 갈 때 모두 포함.
   (개별 나가기 훅을 다 다는 대신 .on 클래스가 빠지는 순간 1곳에서 정리) */
(function cfInit(){
  const scr = document.getElementById("scr-cf");
  if (scr && "MutationObserver" in window)
    new MutationObserver(() => { if (!scr.classList.contains("on")) cfCamStop(); }).observe(scr, { attributes:true, attributeFilter:["class"] });
})();
snRegisterGame("cf", cfReset);
