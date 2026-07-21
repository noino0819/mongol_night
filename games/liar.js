"use strict";
/* ================= 라이어 게임 =================
   폰 하나 모드: 폰 돌려가며 꾹눌러 제시어 확인(runPassPhase, 기존 그대로).
   여러 폰 모드: 각자 폰에 자기 역할만 뜸 → 안 돌려도 됨. 호스트가 역할 배분·공개.
   (net.js 브릿지 레퍼런스 — 다른 개인정보형 게임은 이 패턴을 따른다.) */
let liarState = null;
let liarMode = "solo"; /* "solo"=폰 하나 · "multi"=여러 폰 */
const liarEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); /* 원격 이름 → innerHTML 경로 이스케이프 */

(function initLiar(){
  const cats = $("liar-cats");
  let selCat = "몽골 스페셜";
  Object.keys(WORDS).forEach(c => {
    const b = document.createElement("button");
    b.textContent = c;
    if (c === selCat) b.classList.add("sel");
    b.addEventListener("click", () => { selCat = c; cats.querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); });
    cats.appendChild(b);
  });
  liarState = { cat: selCat }; /* again 버튼이 참조할 최소 상태 */
  $("liar-cats").dataset.sel = selCat;
  $("liar-start").addEventListener("click", () => startLiar($("liar-cats").dataset.sel || selCat));
  $("liar-again").addEventListener("click", () => startLiar(liarState.cat));
  /* 카테고리 선택을 dataset에 기록 (again·start 공용으로 최신값 읽기) */
  cats.addEventListener("click", (e) => { const t = e.target.closest("button"); if (t) $("liar-cats").dataset.sel = t.textContent; });
})();

/* core.js resetGame("liar") 진입점 — 셋업 화면 + 모드 토글 */
function liarReset(){
  if (liarMode === "multi" && !mpLive()) liarMode = "solo"; /* 연결 끊기면 폰 하나로 */
  $("liar-setup").style.display = "";
  $("liar-pass").style.display = "none";
  $("liar-play").style.display = "none";
  snModeBar($("liar-setup"), liarMode, (m) => { liarMode = m; liarReset(); });
}

function startLiar(cat){
  if (liarMode === "multi") return startLiarMulti(cat);
  return startLiarSolo(cat);
}

/* ---------- 폰 하나 (기존) ---------- */
function startLiarSolo(cat){
  const order = shuffle(roster);
  const word = WORDS[cat][Math.floor(Math.random() * WORDS[cat].length)];
  const liarIdx = Math.floor(Math.random() * order.length);
  liarState = { cat, word, liarName: order[liarIdx], multi: false, timerId: null, timeLeft: 180 };
  $("liar-setup").style.display = "none";
  $("liar-play").style.display = "none";
  const pass = $("liar-pass");
  pass.style.display = "flex";
  runPassPhase(pass, order,
    (i) => i === liarIdx
      ? { main: "당신이 라이어!", sub: "카테고리: " + cat + "<br>들키지 말고 버텨보세요", liar: true }
      : { label: "제시어", main: word, sub: "카테고리: " + cat },
    () => liarShowPlay(cat, false)
  );
}

/* ---------- 여러 폰 (호스트) ---------- */
function startLiarMulti(cat){
  const order = mpNames();
  if (order.length < 3){ alert("여러 폰 라이어는 3명 이상 연결돼야 해 (지금 " + order.length + "명)"); return; }
  const word = WORDS[cat][Math.floor(Math.random() * WORDS[cat].length)];
  const liarIdx = Math.floor(Math.random() * order.length);
  liarState = { cat, word, liarName: order[liarIdx], multi: true, timerId: null, timeLeft: 180 };
  mpNav("liar");                        /* 게스트들 라이어 화면으로 (게스트: __guest_liar 실행 → 대기) */
  mp.game = { onMsg(){}, onPeers(){} }; /* 호스트도 게임 활성 (공개 브로드캐스트용) */
  /* 개인 역할 배달 — party 순서 = mpNames() 순서 → liarIdx로 매칭 */
  mpParty().forEach((pl, i) => {
    const payload = { t: "role", liar: i === liarIdx, word, cat };
    if (pl.self) liarState.myRole = payload; else pl.send(payload);
  });
  liarShowPlay(cat, true);
}

/* ---------- 공용 play 화면 (호스트/폰하나) ---------- */
function liarShowPlay(cat, multi){
  $("liar-setup").style.display = "none";
  $("liar-pass").style.display = "none";
  $("liar-play").style.display = "flex";
  const my = $("liar-myrole");
  if (multi){
    let el = my;
    if (!el){ el = document.createElement("div"); el.id = "liar-myrole"; $("liar-play").prepend(el); }
    el.style.display = "";
    el.innerHTML = liarRoleHtml(liarState.myRole);
  } else if (my){ my.style.display = "none"; }
  $("liar-cat-tag").textContent = "카테고리: " + cat + (multi ? " · 여러 폰" : "");
  $("liar-result").style.display = "none";
  $("liar-again").style.display = "none";
  $("liar-timer").textContent = "3:00";
  $("liar-timer").classList.remove("low");
  $("liar-timer-btn").textContent = "타이머 시작";
}
function liarRoleHtml(role){
  return role.liar
    ? '<div class="liar-role liar">🤥 당신이 <b>라이어</b><small>제시어를 몰라요 · 들키지 말고 버텨요</small></div>'
    : '<div class="liar-role">제시어<b>' + liarEsc(role.word) + '</b><small>카테고리: ' + liarEsc(role.cat) + '</small></div>';
}

/* ---------- 여러 폰 (게스트) ---------- */
window.__guest_liar = function(){
  $("liar-setup").style.display = "none";
  $("liar-play").style.display = "none";
  const pass = $("liar-pass");
  pass.style.display = "flex";
  pass.innerHTML = '<div class="who-label">여러 폰 라이어</div><div class="who">대기 중…</div><div class="hint" style="margin:0">호스트가 시작하면 네 역할이 여기 떠</div>';
  mp.game = { onMsg(from, m){
    if (m.t === "role"){
      pass.style.display = "flex";
      $("liar-play").style.display = "none";
      pass.innerHTML = liarRoleHtml(m) + '<div class="hint" style="margin-top:14px">네 폰만 보고, 돌아가며 한 마디씩!<br>호스트 폰의 타이머를 봐</div>';
    }
    if (m.t === "reveal"){
      pass.innerHTML = '<div class="who-label">결과</div><div class="reveal-card" style="display:block"><div class="lbl">라이어는…</div><div class="val" style="color:var(--danger)">' + liarEsc(m.liarName) + '</div><div class="lbl" style="margin-top:14px">제시어</div><div class="val">' + liarEsc(m.word) + '</div></div>';
    }
  }};
};

/* ---------- 타이머 (호스트/폰하나) ---------- */
$("liar-timer-btn").addEventListener("click", () => {
  const st = liarState;
  if (st.timerId){ clearInterval(st.timerId); st.timerId = null; $("liar-timer-btn").textContent = "다시 시작"; return; }
  if (st.timeLeft <= 0) st.timeLeft = 180;
  $("liar-timer-btn").textContent = "일시정지";
  st.timerId = setInterval(() => {
    st.timeLeft--;
    const t = $("liar-timer");
    t.textContent = fmt(Math.max(0, st.timeLeft));
    if (st.timeLeft <= 30) t.classList.add("low");
    if (st.timeLeft <= 0){ clearInterval(st.timerId); st.timerId = null; t.textContent = "투표!"; $("liar-timer-btn").textContent = "타이머 재시작"; st.timeLeft = 180; }
  }, 1000);
});

/* ---------- 공개 (호스트/폰하나) ---------- */
$("liar-reveal-btn").addEventListener("click", () => {
  if (!confirm("정말 공개할까요? 투표 먼저 하셨죠? 😏")) return;
  if (liarState.timerId){ clearInterval(liarState.timerId); liarState.timerId = null; }
  const r = $("liar-result");
  r.style.display = "";
  r.innerHTML = '<div class="lbl">라이어는...</div><div class="val" style="color:var(--danger)">' + liarEsc(liarState.liarName) + '</div><div class="lbl" style="margin-top:14px">제시어</div><div class="val">' + liarEsc(liarState.word) + '</div>';
  $("liar-again").style.display = "";
  if (liarState.multi) mpBroadcast({ t: "reveal", liarName: liarState.liarName, word: liarState.word });
});
