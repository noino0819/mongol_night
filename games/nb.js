"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("nb", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>⚾ 숫자야구</h2></div>
    <div id="nb-setup">
      <p class="hint">서로의 비밀 숫자를 추리하는 2인 대전! 0~9 <b>중복 없는</b> 숫자, 자리·숫자 다 맞으면 <b>S(스트라이크)</b>, 숫자만 맞으면 <b>B(볼)</b>. 올 스트라이크 먼저 맞히면 승리 — 단 <b style="color:var(--fire)">후공에겐 마지막 동수 기회</b>가 있어요.</p>
      <div class="field"><label>대결할 2명 (선공 · 후공)</label><div class="seg" id="nb-players"></div></div>
      <div class="field"><label>자릿수</label><div class="seg" id="nb-digits">
        <button data-d="3" class="sel">3자리</button><button data-d="4">4자리</button>
      </div></div>
      <button class="btn" id="nb-start">⚾ 비밀 숫자 정하기 →</button>
    </div>
    <div id="nb-set" style="display:none" class="stage-center">
      <span class="tag" id="nb-set-name">-</span>
      <div class="hint" id="nb-set-msg" style="margin:0"></div>
      <div class="nb-entry" id="nb-set-entry"></div>
      <div class="nb-pad" id="nb-set-pad"></div>
    </div>
    <div id="nb-play" style="display:none">
      <div class="stage-center" style="flex:0;gap:6px;margin:6px 0 10px">
        <span class="tag" id="nb-turn-tag">추측할 차례</span>
        <div class="who" id="nb-turn-name" style="font-size:26px">-</div>
        <div class="hint" id="nb-turn-msg" style="margin:0"></div>
      </div>
      <div class="nb-logs" id="nb-logs"></div>
      <div class="nb-entry" id="nb-play-entry"></div>
      <div class="nb-pad" id="nb-play-pad"></div>
    </div>
    <div id="nb-end" style="display:none" class="stage-center">
      <div class="reveal-card" id="nb-result"></div>
      <div id="nb-reveal"></div>
      <button class="btn mt" id="nb-again">다시 하기</button>
    </div>
  `);
snAddCss(`/* ---------- 숫자야구 ---------- */
#scr-nb .nb-entry{display:flex;justify-content:center;gap:8px;margin:6px 0 14px}
.nb-box{width:44px;height:54px;border:2px solid var(--line);border-radius:10px;background:var(--night2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:var(--milk)}
.nb-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:300px;margin:0 auto;width:100%}
.nb-pad button{background:var(--card);border:1px solid var(--line);border-radius:12px;color:var(--milk);font-size:22px;font-weight:800;padding:14px 0;font-family:inherit}
.nb-pad button:active:not(:disabled){border-color:var(--fire);color:var(--fire)}
.nb-pad button:disabled{opacity:.25}
.nb-pad .nb-del{color:var(--danger)}
.nb-pad .nb-ok{background:var(--fire);color:#231303;border-color:var(--fire);font-size:17px}
.nb-pad .nb-ok:disabled{background:var(--night2);color:var(--dim)}
.nb-logs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 12px}
.nb-logcol{background:var(--night2);border:1px solid var(--line);border-radius:12px;padding:8px;min-height:56px}
.nb-logcol .hd{font-size:12px;font-weight:800;color:var(--dim);text-align:center;padding-bottom:6px;border-bottom:1px solid var(--line);margin-bottom:6px;word-break:keep-all}
.nb-logrow{display:flex;align-items:center;gap:6px;padding:3px 2px}
.nb-logrow b{font-size:17px;letter-spacing:2px;color:var(--milk);flex:1}
.nb-logrow .sb{font-size:12px;font-weight:800;color:var(--steppe)}
.nb-logempty{color:var(--dim);font-size:12px;text-align:center;padding:8px 0}
.nb-reveal-row{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--night2);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin-top:8px}
.nb-reveal-row b{font-size:22px;letter-spacing:3px;color:var(--fire)}`);
/* ================= 숫자야구 (nb) ================= */
/* ponytail: 1:1 대전만. 기획서의 팀전 2:2는 S/B 로직 동일 + 핸드오프만 복잡해져 생략 — 필요하면 nb.players를 팀 배열로 확장. */
let nb = { digits: 3, sel: [], players: ["", ""], secret: ["", ""], logs: [[], []], turn: 0, solved: [0, 0], finalPending: false, entry: "" };
let nbMode = null; /* 유저 토글 선택(null=자동) — 실제 모드는 snMode(nbMode). solo=패스앤플레이 · multi=호스트 심판 */

/* --- 순수 판정: 중복 없는 숫자 문자열 → {s,b}. 0S0B = OUT --- */
function nbJudge(secret, guess){
  let s = 0, b = 0;
  for (let i = 0; i < guess.length; i++){
    if (guess[i] === secret[i]) s++;
    else if (secret.indexOf(guess[i]) >= 0) b++;
  }
  return { s, b };
}
/* --- 유효성: 자릿수 일치 + 0~9 중복 없음 (맨 앞 0 허용) --- */
function nbValid(str, digits){
  return str.length === digits && /^[0-9]+$/.test(str) && new Set(str).size === digits;
}

function nbShow(id){
  ["nb-setup", "nb-set", "nb-play", "nb-end"].forEach(x => $(x).style.display = (x === id ? (id === "nb-setup" ? "" : "flex") : "none"));
}
function nbReset(){
  const nbM = snMode(nbMode);
  nb = { digits: nb.digits || 3, sel: roster.slice(0, 2), players: ["", ""], secret: ["", ""], logs: [[], []], turn: 0, solved: [0, 0], finalPending: false, entry: "", multi: false };
  nbShow("nb-setup");
  nbRenderPlayers();
  $("nb-digits").querySelectorAll("button").forEach(x => x.classList.toggle("sel", +x.dataset.d === nb.digits));
  snModeBar($("nb-setup"), nbM, (m) => { nbMode = m; nbReset(); });
  $("nb-players").closest(".field").style.display = (nbM === "multi" ? "none" : ""); /* 여러 폰은 호스트+게스트가 자동 대전 → 명단 선택 숨김 */
}
function nbRenderPlayers(){
  const box = $("nb-players");
  box.innerHTML = "";
  roster.forEach(n => {
    const b = document.createElement("button");
    b.textContent = n;
    b.classList.toggle("sel", nb.sel.includes(n));
    b.addEventListener("click", () => {
      if (nb.sel.includes(n)) nb.sel = nb.sel.filter(x => x !== n);
      else if (nb.sel.length < 2) nb.sel.push(n);
      else return alert("2명만 고를 수 있어요 (선공·후공)");
      nbRenderPlayers();
    });
    box.appendChild(b);
  });
}
$("nb-digits").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  $("nb-digits").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel");
  nb.digits = +b.dataset.d;
}));
$("nb-start").addEventListener("click", () => {
  if (snMode(nbMode) === "multi") return startNbMulti();
  if (nb.sel.length !== 2) return alert("대결할 2명을 골라주세요!");
  nb.players = nb.sel.slice();
  nb.secret = ["", ""]; nb.logs = [[], []]; nb.solved = [0, 0]; nb.turn = 0; nb.finalPending = false;
  nbBeginSet(0);
});
$("nb-again").addEventListener("click", nbReset);

/* --- 비밀 숫자 설정 (i번 플레이어, 패스 후 비공개 입력) --- */
function nbBeginSet(i){
  nb.entry = "";
  snPassCover(nb.players[i], () => {
    nbShow("nb-set");
    $("nb-set-name").textContent = nb.players[i];
    $("nb-set-msg").innerHTML = "<b>" + escHtml(nb.players[i]) + "</b>의 비밀 숫자 " + nb.digits + "자리<br><span style='color:var(--dim)'>0~9 중복 없이 · 상대는 보지 마세요</span>";
    nbRenderPad("nb-set", () => {
      if (!nbValid(nb.entry, nb.digits)) return;
      nb.secret[i] = nb.entry;
      if (i === 0) nbBeginSet(1); else nbBeginTurn();
    });
  });
}

/* --- 추측 턴 --- */
function nbBeginTurn(){
  if (nb.multi) return nbMultiTurn(); /* 여러 폰: 핸드오프 없이 각자 폰에서 자기 턴 렌더 */
  nb.entry = "";
  snPassCover(nb.players[nb.turn], () => {
    nbShow("nb-play");
    const p = nb.turn, opp = 1 - p;
    $("nb-turn-tag").textContent = nb.finalPending ? "마지막 동수 기회!" : "추측할 차례";
    $("nb-turn-name").textContent = nb.players[p];
    $("nb-turn-msg").innerHTML = "<b>" + escHtml(nb.players[opp]) + "</b>의 숫자를 맞혀봐요";
    nbRenderLogs();
    nbRenderPad("nb-play", nbSubmitGuess);
  });
}
function nbRenderLogs(){
  const box = $("nb-logs");
  box.innerHTML = "";
  [0, 1].forEach(i => {
    const rows = nb.logs[i].map((g, k) =>
      '<div class="nb-logrow"><span class="n">' + (k + 1) + '</span><b>' + g.guess + '</b><span class="sb">' + (g.s === 0 && g.b === 0 ? "OUT" : g.s + "S " + g.b + "B") + '</span></div>'
    ).join("") || '<div class="nb-logempty">아직 없음</div>';
    box.innerHTML += '<div class="nb-logcol' + (i === nb.turn ? " now" : "") + '"><div class="hd">' + escHtml(nb.players[i]) + '</div>' + rows + '</div>';
  });
}
function nbSubmitGuess(){
  if (!nbValid(nb.entry, nb.digits)) return;
  const p = nb.turn, opp = 1 - p;
  const r = nbJudge(nb.secret[opp], nb.entry);
  nb.logs[p].push({ guess: nb.entry, s: r.s, b: r.b });
  haptic(r.s === nb.digits ? [30, 40, 30] : 20);
  if (r.s === nb.digits) snSfx("win");
  else if (r.s > 0) snSfx("correct");
  else if (r.b === 0) snSfx("wrong");
  nb.entry = "";
  if (r.s === nb.digits) nb.solved[p] = nb.logs[p].length;
  nbRenderLogs();
  /* 선공(0) 적중 → 후공(1)에게 마지막 동수 기회 1번 */
  if (nb.solved[0] && !nb.finalPending && !nb.solved[1]){
    nb.finalPending = true; nb.turn = 1;
    return nbBeginTurn();
  }
  if (nb.finalPending) return nbEnd();   /* 후공의 동수 기회 종료 */
  if (nb.solved[1]) return nbEnd();      /* 후공이 (동수 아니고) 먼저 적중 → 후공 승 */
  nb.turn = opp;
  nbBeginTurn();
}
function nbEnd(){
  nbShow("nb-end");
  let title, sub;
  if (nb.solved[0] && nb.solved[1]){ title = "무승부!"; sub = "둘 다 " + nb.solved[0] + "번 만에 정답 — 텡그리도 감탄"; }
  else if (nb.solved[0]){ title = "🏆 " + escHtml(nb.players[0]) + " 승리!"; sub = nb.solved[0] + "번 만에 적중"; }
  else { title = "🏆 " + escHtml(nb.players[1]) + " 승리!"; sub = nb.solved[1] + "번 만에 적중"; }
  $("nb-result").innerHTML = '<div class="lbl">결과</div><div class="val">' + title + '</div><div class="hint" style="margin:8px 0 0">' + sub + '</div>';
  $("nb-reveal").innerHTML = [0, 1].map(i =>
    '<div class="nb-reveal-row"><span>' + escHtml(nb.players[i]) + '의 비밀</span><b>' + nb.secret[i] + '</b><span class="dim">' + nb.logs[i].length + '번 시도</span></div>'
  ).join("");
  if (nb.multi) mpBroadcast({ t: "end", players: nb.players, secrets: nb.secret, logs: nb.logs, solved: nb.solved }); /* 게스트 mpBroadcast는 no-op */
}

/* --- 숫자패드: {prefix}-entry(입력칸) + {prefix}-pad(버튼) 렌더, onSubmit 콜백 --- */
function nbRenderPad(prefix, onSubmit){
  const disp = $(prefix + "-entry"), pad = $(prefix + "-pad");
  disp.style.display = ""; pad.style.display = ""; /* 대기화면이 숨겼을 수 있음 → 항상 복구 */
  function paint(){
    let boxes = "";
    for (let i = 0; i < nb.digits; i++) boxes += '<span class="nb-box' + (nb.entry[i] ? " on" : "") + '">' + (nb.entry[i] || "") + '</span>';
    disp.innerHTML = boxes;
    pad.querySelectorAll("button[data-k]").forEach(b => {
      b.disabled = nb.entry.includes(b.dataset.k) || nb.entry.length >= nb.digits;
    });
    $(prefix + "-ok").disabled = !nbValid(nb.entry, nb.digits);
  }
  if (!pad.dataset.built){
    let html = "";
    for (let n = 1; n <= 9; n++) html += '<button data-k="' + n + '">' + n + '</button>';
    html += '<button class="nb-del" data-del>←</button><button data-k="0">0</button><button class="nb-ok" id="' + prefix + '-ok" data-ok>확인</button>';
    pad.innerHTML = html;
    pad.dataset.built = "1";
    pad.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.del !== undefined) nb.entry = nb.entry.slice(0, -1);
      else if (b.dataset.ok !== undefined){ if (pad._submit) pad._submit(); return; }
      else if (b.dataset.k !== undefined && !b.disabled && nb.entry.length < nb.digits && !nb.entry.includes(b.dataset.k)) nb.entry += b.dataset.k;
      paint();
    });
  }
  pad._submit = onSubmit;
  paint();
}

/* ================= 여러 폰 모드 (multi) =================
   호스트=플레이어0=심판, 첫 게스트=플레이어1. 정확히 2인 대전.
   각자 자기 폰에서 비밀 숫자 설정 + 자기 턴에 추측 입력. 판정은 호스트가 nbJudge로 전담(로직 중복 0).
   게스트는 상태 미러 렌더만 — nbRenderLogs/nbRenderPad/nbEnd 그대로 재사용. */

/* nb-set 화면 상태 전환 (입력 pad 표시 여부) */
function nbSetView(name, msgHtml, showPad){
  nbShow("nb-set");
  $("nb-set-name").textContent = name;
  $("nb-set-msg").innerHTML = msgHtml;
  $("nb-set-entry").style.display = showPad ? "" : "none";
  $("nb-set-pad").style.display = showPad ? "" : "none";
}
const nbSecretMsg = (name, digits) =>
  "<b>" + escHtml(name) + "</b>의 비밀 숫자 " + digits + "자리<br><span style='color:var(--dim)'>0~9 중복 없이 · 이 폰에만 보여요</span>";

/* ---------- 호스트 ---------- */
function startNbMulti(){
  const order = mpNames();
  if (order.length < 2){ alert("여러 폰 숫자야구는 2명 연결이 필요해요 (지금 " + order.length + "명)"); return; }
  if (order.length > 2){ alert("숫자야구는 딱 2명 대전이에요 (지금 " + order.length + "명). 2명만 연결하고 다시 해주세요"); return; }
  nb.multi = true; nb.myIdx = 0;
  nb.players = [order[0], order[1]];
  nb.secret = ["", ""]; nb.logs = [[], []]; nb.solved = [0, 0]; nb.turn = 0; nb.finalPending = false; nb.entry = ""; nb.ready = [false, false];
  mpNav("nb");                                         /* 게스트 폰을 nb 화면으로 → __guest_nb 실행 */
  mp.game = { onMsg(from, m){ nbHostMsg(from, m); } };
  mpBroadcast({ t: "init", players: nb.players, digits: nb.digits });
  nbHostSetSecret();                                   /* 호스트 자기 비밀 숫자부터 */
}
function nbHostSetSecret(){
  nb.entry = "";
  nbSetView(nb.players[0], nbSecretMsg(nb.players[0], nb.digits), true);
  nbRenderPad("nb-set", () => {
    if (!nbValid(nb.entry, nb.digits)) return;
    nb.secret[0] = nb.entry; nb.ready[0] = true; nb.entry = "";
    nbSetView("대기", "상대가 비밀 숫자를 정하는 중…", false);
    nbMultiCheckStart();
  });
}
function nbMultiCheckStart(){ if (nb.ready[0] && nb.ready[1]){ nb.turn = 0; nbBeginTurn(); } } /* → nbMultiTurn */
function nbHostMsg(from, m){
  if (m.t === "secret"){
    if (!nbValid(m.num, nb.digits)) return;
    nb.secret[1] = m.num; nb.ready[1] = true; nbMultiCheckStart();
  } else if (m.t === "guess"){
    if (nb.turn !== 1 || !nbValid(m.num, nb.digits)) return; /* 게스트 차례·유효값만 심판 */
    nb.entry = m.num; nbSubmitGuess();                       /* 기존 판정/승패 로직 재사용 */
  }
}
/* 턴 전환: 호스트 자기 화면 렌더 + 게스트에 상태 브로드캐스트 */
function nbMultiTurn(){
  nb.entry = "";
  nbRenderMultiPlay(nb.turn === nb.myIdx);
  mpBroadcast({ t: "state", players: nb.players, digits: nb.digits, turn: nb.turn, finalPending: nb.finalPending, logs: nb.logs });
}

/* ---------- 공용 play 렌더 (호스트/게스트 동일) ---------- */
function nbRenderMultiPlay(myTurn){
  nbShow("nb-play");
  const p = nb.turn, opp = 1 - p;
  $("nb-turn-tag").textContent = nb.finalPending ? "마지막 동수 기회!" : (myTurn ? "내 차례" : "상대 차례");
  $("nb-turn-name").textContent = nb.players[p];
  $("nb-turn-msg").innerHTML = myTurn
    ? "<b>" + escHtml(nb.players[opp]) + "</b>의 숫자를 맞혀봐요"
    : "<b>" + escHtml(nb.players[p]) + "</b>가 추측 중…";
  nbRenderLogs();
  if (myTurn){ nb.entry = ""; nbRenderPad("nb-play", nbMultiSubmit); }
  else { $("nb-play-entry").style.display = "none"; $("nb-play-pad").style.display = "none"; }
}
/* 활성 플레이어의 확인 버튼: 호스트는 직접 판정, 게스트는 호스트로 전송 */
function nbMultiSubmit(){
  if (!nbValid(nb.entry, nb.digits)) return;
  if (mpAmHost()){ nbSubmitGuess(); return; }
  mpToHost({ t: "guess", num: nb.entry }); nb.entry = "";
  $("nb-play-entry").style.display = "none"; $("nb-play-pad").style.display = "none";
  $("nb-turn-tag").textContent = "판정 중…";
}

/* ---------- 게스트 ---------- */
window.__guest_nb = function(){
  nb.multi = true; nb.myIdx = 1; nb.entry = "";
  mp.game = { onMsg(from, m){ nbGuestMsg(from, m); } };
  nbSetView("연결됨", "호스트가 시작하면 여기서 비밀 숫자를 정해요", false);
};
function nbGuestMsg(from, m){
  if (m.t === "init"){
    nb.digits = m.digits; nb.players = m.players.slice(); nb.entry = "";
    nbSetView(nb.players[1], nbSecretMsg(nb.players[1], nb.digits), true);
    nbRenderPad("nb-set", () => {
      if (!nbValid(nb.entry, nb.digits)) return;
      mpToHost({ t: "secret", num: nb.entry }); nb.entry = "";
      nbSetView("대기", "상대가 준비되면 시작해요", false);
    });
  } else if (m.t === "state"){
    nb.players = m.players.slice(); nb.digits = m.digits; nb.turn = m.turn; nb.finalPending = m.finalPending; nb.logs = m.logs;
    nbRenderMultiPlay(nb.turn === nb.myIdx);
  } else if (m.t === "end"){
    nb.players = m.players.slice(); nb.secret = m.secrets; nb.logs = m.logs; nb.solved = m.solved;
    nbEnd(); /* 재사용: solved/secret 미러로 결과·리빌 렌더 (mpBroadcast는 게스트에서 no-op) */
  }
}
snRegisterGame("nb", nbReset);
