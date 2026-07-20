"use strict";
/* ================= 숫자야구 (nb) ================= */
/* ponytail: 1:1 대전만. 기획서의 팀전 2:2는 S/B 로직 동일 + 핸드오프만 복잡해져 생략 — 필요하면 nb.players를 팀 배열로 확장. */
let nb = { digits: 3, sel: [], players: ["", ""], secret: ["", ""], logs: [[], []], turn: 0, solved: [0, 0], finalPending: false, entry: "" };

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
  nb = { digits: nb.digits || 3, sel: roster.slice(0, 2), players: ["", ""], secret: ["", ""], logs: [[], []], turn: 0, solved: [0, 0], finalPending: false, entry: "" };
  nbShow("nb-setup");
  nbRenderPlayers();
  $("nb-digits").querySelectorAll("button").forEach(x => x.classList.toggle("sel", +x.dataset.d === nb.digits));
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
      else return alert("2명만 골라줘 (선공·후공)");
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
  if (nb.sel.length !== 2) return alert("대결할 2명을 골라줘!");
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
    $("nb-set-msg").innerHTML = "<b>" + escHtml(nb.players[i]) + "</b>의 비밀 숫자 " + nb.digits + "자리<br><span style='color:var(--dim)'>0~9 중복 없이 · 상대는 보지 마</span>";
    nbRenderPad("nb-set", () => {
      if (!nbValid(nb.entry, nb.digits)) return;
      nb.secret[i] = nb.entry;
      if (i === 0) nbBeginSet(1); else nbBeginTurn();
    });
  });
}

/* --- 추측 턴 --- */
function nbBeginTurn(){
  nb.entry = "";
  snPassCover(nb.players[nb.turn], () => {
    nbShow("nb-play");
    const p = nb.turn, opp = 1 - p;
    $("nb-turn-tag").textContent = nb.finalPending ? "마지막 동수 기회!" : "추측할 차례";
    $("nb-turn-name").textContent = nb.players[p];
    $("nb-turn-msg").innerHTML = "<b>" + escHtml(nb.players[opp]) + "</b>의 숫자를 맞혀봐";
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
}

/* --- 숫자패드: {prefix}-entry(입력칸) + {prefix}-pad(버튼) 렌더, onSubmit 콜백 --- */
function nbRenderPad(prefix, onSubmit){
  const disp = $(prefix + "-entry"), pad = $(prefix + "-pad");
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
