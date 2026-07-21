"use strict";
/* ================= 한밤의 늑대인간 ================= */
const WF_ROLE_INFO = {
  "늑대인간": { em:"🐺", team:"늑대팀", tip:"들키지 마세요! 낮에는 다른 역할인 척 연기",
    help:"정체를 숨기고 처형만 피하면 승리! 동료 늑대끼리는 서로 알아봐요. 동료가 전부 가운데 카드라 혼자면, 위로로 가운데 1장을 훔쳐볼 수 있어요." },
  "예언자":   { em:"🔮", team:"마을팀", tip:"밤에 본 정보로 늑대를 추리하세요",
    help:"밤에 플레이어 1명의 카드를 보거나 가운데 2장을 봐요. 낮에 이 정보를 언제 터뜨릴지가 실력! 너무 일찍 밝히면 늑대인 척하는 사람의 먹잇감이 돼요." },
  "강도":     { em:"🕵️", team:"마을팀", tip:"당신의 역할은 훔친 카드로 바뀌었습니다!",
    help:"밤에 한 명을 골라 카드를 맞바꾸고 새 역할을 확인해요. 늑대 카드를 훔치면 그 순간부터 당신이 늑대팀! 승패는 아침의 최종 역할 기준이에요." },
  "말썽꾸러기": { em:"🃏", team:"마을팀", tip:"두 사람의 역할을 바꿨습니다. 그들은 모릅니다",
    help:"다른 두 사람의 역할을 몰래 서로 바꿔요. 바뀐 결과는 본인들도, 당신도 몰라서 판이 대혼돈. 낮에 '내가 누구누구 바꿨다'로 어그로 끌기 가능." },
  "하수인":   { em:"😈", team:"늑대팀", tip:"늑대를 알지만 늑대는 당신을 몰라요",
    help:"늑대가 누군지 알고 시작하는 늑대팀 스파이. 당신이 처형당해도 늑대만 살면 같이 승리라서, 늑대 대신 몸빵하는 게 최고의 플레이. 늑대가 판에 한 마리도 없으면? 당신 아닌 누군가만 처형되게 만들면 단독 승리!" },
  "비밀결사": { em:"🤝", team:"마을팀", tip:"동료와 서로 아는 사이! 서로 보증 가능",
    help:"둘이 서로가 누군지 알고 시작해요. 낮에 서로 보증해주면 마을에 강력한 정보! 단, 동료가 가운데 카드에 숨어있으면 혼자예요. 그리고 '나 비밀결사야'는 늑대도 할 수 있는 거짓말..." },
  "주정뱅이": { em:"🍺", team:"마을팀", tip:"가운데 카드와 교환! 새 역할은 비밀",
    help:"취해서 내 카드를 가운데 카드 1장과 바꿔요. 뭘 받았는지 본인도 몰라요. 늑대 카드를 집었으면 아침엔 나도 모르게 늑대팀! 승패는 아침의 최종 역할 기준." },
  "무두장이": { em:"🪓", team:"혼자팀", tip:"목표: 처형당하기! 어그로 풀가동",
    help:"모든 게 지긋지긋한 무두장이... 처형당하는 게 승리 조건! 처형되면 단독 승리하고 늑대팀은 무조건 패배해요. 수상하게 굴어서 표를 끌어모으세요. 근데 너무 티 나면 마을이 일부러 안 죽여줌" },
  "사냥꾼":   { em:"🏹", team:"마을팀", tip:"처형당하면 내가 찍은 사람도 같이 감",
    help:"처형당하면 내가 투표한 사람을 같이 데려가요. 제일 늑대 같은 사람에게 소신 투표하면 죽어도 복수 완료!" },
  "주민":     { em:"👨‍🌾", team:"마을팀", tip:"능력은 없지만 추리로 승부!",
    help:"능력은 없지만 예언자인 척, 강도인 척 연기해서 늑대의 거짓말을 낚아채요. 뻔뻔함이 무기!" }
};
const WF_TOGGLES = [
  { id:"seer",    role:"예언자",    n:1, desc:"밤에 카드 확인" },
  { id:"robber",  role:"강도",      n:1, desc:"역할 훔치기" },
  { id:"trouble", role:"말썽꾸러기", n:1, desc:"두 명 역할 교환" },
  { id:"minion",  role:"하수인",    n:1, desc:"늑대팀 · 늑대를 앎" },
  { id:"mason",   role:"비밀결사",  n:2, desc:"2명 · 서로 확인" },
  { id:"drunk",   role:"주정뱅이",  n:1, desc:"가운데와 몰래 교환" },
  { id:"tanner",  role:"무두장이",  n:1, desc:"처형당하면 단독 승리" },
  { id:"hunter",  role:"사냥꾼",    n:1, desc:"처형되면 지목자 동반" }
];
let wf = { sel: [], time: 180, on: { seer: true, robber: true, trouble: true }, cards: [], final: [], order: [], i: 0, robber: null, tmSwap: null, drunk: null, votes: [], dayTid: null, multi: false };
let wfMode = "solo"; /* "solo"=폰 하나 · "multi"=여러 폰 */
/* ponytail: 원격 이름의 HTML특수문자 제거 — 재사용하는 기존 렌더(wfSecret/wfResult 등)에 일일이 escHtml 넣는 대신 경계 1곳에서 정화 */
const wfSafeName = (s) => String(s).replace(/[<>&"']/g, "");
function wfSpecialCount(){
  return 2 + WF_TOGGLES.reduce((s, t) => s + (wf.on[t.id] ? t.n : 0), 0);
}
function wfRoleList(n){
  const roles = ["늑대인간","늑대인간"];
  WF_TOGGLES.forEach(t => { if (wf.on[t.id]) for (let i = 0; i < t.n; i++) roles.push(t.role); });
  while (roles.length < n + 3) roles.push("주민");
  return roles;
}
(function initWfToggles(){
  const box = $("wf-role-toggles");
  WF_TOGGLES.forEach(t => {
    const info = WF_ROLE_INFO[t.role];
    const row = document.createElement("div");
    row.className = "toggle-row";
    row.innerHTML = '<span>' + info.em + ' ' + t.role + (t.n > 1 ? ' ×2' : '') + ' (' + t.desc + ')</span><button class="tg' + (wf.on[t.id] ? ' on' : '') + '"></button>';
    box.appendChild(row);
    row.querySelector(".tg").addEventListener("click", (e) => {
      wf.on[t.id] = !wf.on[t.id];
      e.currentTarget.classList.toggle("on", wf.on[t.id]);
      wfPreview();
    });
  });
})();
$("wf-help-btn").addEventListener("click", () => {
  const el = $("wf-help"), btn = $("wf-help-btn");
  if (el.style.display !== "none"){ el.style.display = "none"; btn.textContent = "📖 역할 설명 · 마피아랑 뭐가 달라?"; return; }
  const roles = ["늑대인간","예언자","강도","말썽꾸러기","하수인","비밀결사","주정뱅이","무두장이","사냥꾼","주민"].map(r => {
    const info = WF_ROLE_INFO[r];
    return '<div style="margin-top:10px;text-align:left"><b>' + info.em + ' ' + r + ((r === "늑대인간" || r === "비밀결사") ? " (2명)" : "") + '</b> <small style="opacity:.65">· ' + info.team + '</small><br><small style="opacity:.85;line-height:1.6">' + info.help + '</small></div>';
  }).join("");
  el.innerHTML = '<div class="lbl">역할 도감</div>' + roles +
    '<div style="margin-top:14px;text-align:left"><b>🌙 마피아랑 뭐가 달라?</b><br><small style="opacity:.85;line-height:1.7">' +
    '· 마피아는 밤낮을 여러 번 반복하고 죽은 사람은 구경만... 늑대인간은 <b>밤 1번 + 투표 1번, 10분 컷!</b> 아무도 탈락 안 해요<br>' +
    '· 사회자 필요 없음. 밤 진행은 폰이 다 해줘요<br>' +
    '· 강도·말썽꾸러기 때문에 자고 일어나면 <b>내 역할이 바뀌어 있을 수도</b> 있어요. 승패는 아침의 최종 역할 기준!<br>' +
    '· 가운데 3장 덕분에 늑대가 판에 아예 없을 수도 있어요. 그럴 땐 🕊️ 평화 투표가 정답</small></div>';
  el.style.display = "";
  btn.textContent = "📖 설명 접기";
});
function wfReset(){
  clearInterval(wf.dayTid); wf.dayTid = null;
  if (wfMode === "multi" && !mpLive()) wfMode = "solo"; /* 연결 끊기면 폰 하나로 */
  wf.multi = false;
  ["wf-setup","wf-pass","wf-secret","wf-day","wf-vote","wf-result"].forEach(id => $(id).style.display = "none");
  $("wf-setup").style.display = "";
  snModeBar($("wf-setup"), wfMode, (m) => { wfMode = m; wfReset(); });
  const box = $("wf-players");
  box.innerHTML = "";
  wf.sel = roster.slice();
  roster.forEach(n => {
    const b = document.createElement("button");
    b.textContent = n;
    if (wf.sel.includes(n)) b.classList.add("sel");
    b.addEventListener("click", () => {
      if (wf.sel.includes(n)) wf.sel = wf.sel.filter(x => x !== n);
      else wf.sel.push(n);
      b.classList.toggle("sel", wf.sel.includes(n));
      wfPreview();
    });
    box.appendChild(b);
  });
  wfPreview();
}
function wfPreview(){
  const n = wf.sel.length;
  if (n < 4){ $("wf-roles").textContent = "4명 이상 선택하세요"; return; }
  if (wfSpecialCount() > n + 3){
    $("wf-roles").innerHTML = '<span style="color:var(--danger)">특수 역할 ' + wfSpecialCount() + '장 > 카드 ' + (n + 3) + '장! 역할을 몇 개 꺼주세요</span>';
    return;
  }
  const roles = wfRoleList(n);
  const count = {};
  roles.forEach(r => count[r] = (count[r] || 0) + 1);
  $("wf-roles").textContent = Object.keys(count).map(r => WF_ROLE_INFO[r].em + r + "×" + count[r]).join("  ") + "  (가운데 3장 포함)";
}
(function initWf(){
  $("wf-times").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("wf-times").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    wf.time = parseInt(b.dataset.t, 10);
  }));
})();
$("wf-start").addEventListener("click", () => {
  if (wfMode === "multi") return wfStartMulti();
  if (wf.sel.length < 4) return alert("4명 이상 필요해요!");
  if (wfSpecialCount() > wf.sel.length + 3) return alert("특수 역할이 카드 수(인원+3장)보다 많아요! 역할을 몇 개 꺼주세요");
  wf.order = shuffle(wf.sel);
  wf.cards = shuffle(wfRoleList(wf.order.length)); /* 앞 N장 = 플레이어, 뒤 3장 = 가운데 */
  wf.final = wf.cards.slice();
  wf.i = 0; wf.robber = null; wf.tmSwap = null; wf.drunk = null; wf.votes = [];
  wfShowPass();
});
function wfShow(id){
  ["wf-setup","wf-pass","wf-secret","wf-day","wf-vote","wf-result"].forEach(x => $(x).style.display = "none");
  $(id).style.display = (id === "wf-pass") ? "flex" : (id === "wf-day" ? "flex" : "");
}
function wfShowPass(){
  wfShow("wf-pass");
  $("wf-pass-label").textContent = "(" + (wf.i + 1) + "/" + wf.order.length + ") 역할 확인 + 밤 행동";
  $("wf-pass-name").textContent = wf.order[wf.i];
}
$("wf-pass-go").addEventListener("click", () => wfSecret());
function wfSecret(){
  wfShow("wf-secret");
  const idx = wf.i, name = wf.order[idx], role = wf.cards[idx];
  const info = WF_ROLE_INFO[role];
  const el = $("wf-secret");
  let action = "";
  if (role === "늑대인간"){
    const mates = wf.order.filter((n, j) => j !== idx && wf.cards[j] === "늑대인간");
    action = mates.length
      ? '<div class="reveal-card"><div class="lbl">동료 늑대</div><div class="val">🐺 ' + mates.join(", ") + '</div></div>'
      : '<div class="reveal-card"><div class="lbl">혼자인 늑대!</div><div class="val" style="font-size:15px">동료가 전부 가운데 카드에... 가운데 1장을 훔쳐볼 수 있어요</div></div>' +
        '<div class="name-grid" id="wf-act-grid">' + [0,1,2].map(k => '<button data-k="' + k + '">🂠 가운데 ' + (k+1) + '</button>').join("") + '</div><div id="wf-act-result"></div>';
  }
  else if (role === "예언자"){
    action = '<p class="hint">플레이어 1명의 카드를 보거나, 가운데 2장을 봅니다</p><div class="name-grid" id="wf-act-grid">' +
      wf.order.map((n, j) => j === idx ? "" : '<button data-p="' + j + '">' + n + '</button>').join("") +
      '<button data-center="1">🂠 가운데 2장</button></div><div id="wf-act-result"></div>';
  }
  else if (role === "강도"){
    action = '<p class="hint">한 명을 골라 역할을 훔칩니다. 훔친 카드가 당신의 새 역할!</p><div class="name-grid" id="wf-act-grid">' +
      wf.order.map((n, j) => j === idx ? "" : '<button data-p="' + j + '">' + n + '</button>').join("") + '</div><div id="wf-act-result"></div>';
  }
  else if (role === "말썽꾸러기"){
    action = '<p class="hint">다른 두 사람을 골라 역할을 서로 바꿉니다 (당신은 결과를 못 봅니다)</p><div class="name-grid" id="wf-act-grid">' +
      wf.order.map((n, j) => j === idx ? "" : '<button data-p="' + j + '">' + n + '</button>').join("") + '</div><div id="wf-act-result"></div>';
  }
  else if (role === "하수인"){
    const wolves = wf.order.filter((n, j) => wf.cards[j] === "늑대인간");
    action = wolves.length
      ? '<div class="reveal-card"><div class="lbl">늑대 명단</div><div class="val">🐺 ' + escHtml(wolves.join(", ")) + '</div></div>' +
        '<p class="hint">늑대는 당신의 존재를 몰라요. 시민인 척 몰래 도우세요. 늑대만 살면 당신이 죽어도 같이 승리!</p>'
      : '<div class="reveal-card"><div class="lbl">늑대가 전부 가운데에!</div><div class="val" style="font-size:15px">판에 늑대가 없어요. 당신 아닌 누군가만 처형되게 만들면 단독 승리!</div></div>';
  }
  else if (role === "비밀결사"){
    const mates = wf.order.filter((n, j) => j !== idx && wf.cards[j] === "비밀결사");
    action = mates.length
      ? '<div class="reveal-card"><div class="lbl">동료 비밀결사</div><div class="val">🤝 ' + escHtml(mates.join(", ")) + '</div></div>' +
        '<p class="hint">서로 늑대가 아닌 걸 알아요. 낮에 보증해주면 강력한 정보!</p>'
      : '<div class="reveal-card"><div class="lbl">혼자인 비밀결사</div><div class="val" style="font-size:15px">동료가 가운데 카드에 숨어있어요. "나 말고 비밀결사라고 주장하는 놈 = 거짓말쟁이"라는 정보!</div></div>';
  }
  else if (role === "주정뱅이"){
    action = '<p class="hint">가운데 카드 1장을 골라 내 카드와 교환합니다. <b>새 역할은 못 봐요!</b> (필수)</p><div class="name-grid" id="wf-act-grid">' +
      [0,1,2].map(k => '<button data-k="' + k + '">🂠 가운데 ' + (k+1) + '</button>').join("") + '</div><div id="wf-act-result"></div>';
  }
  else {
    action = '<p class="hint">할 일은 없지만, 시간을 끌어서 능력자인 척하세요 🤫</p>' +
      '<div class="name-grid"><button>🐑</button><button>🐑</button><button>🐑</button><button>🐑</button></div>' +
      '<p class="hint" style="font-size:12px">(위 버튼은 아무 기능 없음. 눌러서 연기하세요)</p>';
  }
  el.innerHTML =
    '<div class="stage-center" style="flex:0;gap:6px;margin-bottom:10px">' +
    '<span class="tag">' + name + '의 역할</span>' +
    '<div style="font-size:64px">' + info.em + '</div>' +
    '<div class="who" style="font-size:30px">' + role + '</div>' +
    '<p class="hint" style="margin:0">' + info.tip + '</p></div>' +
    action +
    '<button class="btn mt" id="wf-secret-done">확인 완료, 다음 사람에게 →</button>';
  const grid = el.querySelector("#wf-act-grid");
  if (grid){
    let used = false;
    grid.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      const res = el.querySelector("#wf-act-result");
      if (role === "예언자"){
        if (used) return;
        used = true;
        if (b.dataset.center){
          res.innerHTML = '<div class="reveal-card"><div class="lbl">가운데 2장</div><div class="val">' +
            WF_ROLE_INFO[wf.cards[wf.order.length]].em + wf.cards[wf.order.length] + " · " +
            WF_ROLE_INFO[wf.cards[wf.order.length + 1]].em + wf.cards[wf.order.length + 1] + '</div></div>';
        } else {
          const p = +b.dataset.p;
          res.innerHTML = '<div class="reveal-card"><div class="lbl">' + wf.order[p] + '의 카드</div><div class="val">' +
            WF_ROLE_INFO[wf.cards[p]].em + wf.cards[p] + '</div></div>';
        }
        grid.style.opacity = ".35";
      }
      else if (role === "강도"){
        if (used) return;
        used = true;
        const p = +b.dataset.p;
        wf.robber = { from: idx, to: p };
        res.innerHTML = '<div class="reveal-card"><div class="lbl">' + wf.order[p] + '에게서 훔친 새 역할</div><div class="val">' +
          WF_ROLE_INFO[wf.cards[p]].em + wf.cards[p] + '</div></div>';
        grid.style.opacity = ".35";
      }
      else if (role === "말썽꾸러기"){
        if (!wf.tmSwap) wf.tmSwap = [];
        if (wf.tmSwap.length >= 2) return;
        const p = +b.dataset.p;
        if (wf.tmSwap.includes(p)) return;
        wf.tmSwap.push(p);
        b.style.background = "var(--fire)"; b.style.color = "#231303";
        if (wf.tmSwap.length === 2){
          res.innerHTML = '<div class="reveal-card"><div class="val" style="font-size:15px">🃏 ' + wf.order[wf.tmSwap[0]] + ' ↔ ' + wf.order[wf.tmSwap[1]] + ' 역할 교환 완료!</div></div>';
          grid.style.opacity = ".35";
        }
      }
      else if (role === "주정뱅이" && b.dataset.k !== undefined){
        if (used) return;
        used = true;
        wf.drunk = { from: idx, k: +b.dataset.k };
        res.innerHTML = '<div class="reveal-card"><div class="val" style="font-size:15px">🍺 가운데 ' + (wf.drunk.k + 1) + '번과 교환 완료! 새 역할은 아침까지 비밀</div></div>';
        grid.style.opacity = ".35";
      }
      else if (role === "늑대인간" && b.dataset.k !== undefined){
        if (used) return;
        used = true;
        const k = +b.dataset.k;
        res.innerHTML = '<div class="reveal-card"><div class="lbl">가운데 ' + (k+1) + '번 카드</div><div class="val">' +
          WF_ROLE_INFO[wf.cards[wf.order.length + k]].em + wf.cards[wf.order.length + k] + '</div></div>';
        grid.style.opacity = ".35";
      }
    }));
  }
  el.querySelector("#wf-secret-done").addEventListener("click", () => {
    if (role === "주정뱅이" && !wf.drunk) return alert("가운데 카드 1장을 골라야 잘 수 있어요");
    wf.i++;
    if (wf.i >= wf.order.length) return wfNightResolve();
    snPassCover(wf.order[wf.i], wfShowPass);
  });
}
function wfNightResolve(){
  /* 공식 순서: 강도 교환 → 말썽꾸러기 교환 → 주정뱅이 교환 */
  wf.final = wf.cards.slice();
  if (wf.robber){
    const t = wf.final[wf.robber.from];
    wf.final[wf.robber.from] = wf.final[wf.robber.to];
    wf.final[wf.robber.to] = t;
  }
  if (wf.tmSwap && wf.tmSwap.length === 2){
    const t = wf.final[wf.tmSwap[0]];
    wf.final[wf.tmSwap[0]] = wf.final[wf.tmSwap[1]];
    wf.final[wf.tmSwap[1]] = t;
  }
  if (wf.drunk){
    const c = wf.order.length + wf.drunk.k;
    const t = wf.final[wf.drunk.from];
    wf.final[wf.drunk.from] = wf.final[c];
    wf.final[c] = t;
  }
  wfShow("wf-day");
  const swappers = [wf.on.robber ? "강도" : "", wf.on.trouble ? "말썽꾸러기" : "", wf.on.drunk ? "주정뱅이" : ""].filter(Boolean);
  $("wf-day-hint").innerHTML = "밤 사이 무슨 일이? 늑대를 찾아내세요!" +
    (swappers.length ? " " + swappers.join("·") + " 때문에 <b>지금 내 역할이 바뀌었을 수도</b> 있습니다..." : "");
  let left = wf.time;
  $("wf-day-timer").textContent = fmt(left);
  clearInterval(wf.dayTid);
  wf.dayTid = setInterval(() => {
    left--;
    $("wf-day-timer").textContent = left > 0 ? fmt(left) : "⏰ 투표하세요!";
    if (left <= 0){ clearInterval(wf.dayTid); wf.dayTid = null; }
  }, 1000);
}
$("wf-vote-start").addEventListener("click", () => {
  clearInterval(wf.dayTid); wf.dayTid = null;
  wf.i = 0; wf.votes = [];
  wfVotePass();
});
function wfVotePass(){
  wfShow("wf-vote");
  $("wf-vote-pass").style.display = "flex";
  $("wf-vote-pick").style.display = "none";
  $("wf-vote-name").textContent = wf.order[wf.i];
}
$("wf-vote-go").addEventListener("click", () => {
  $("wf-vote-pass").style.display = "none";
  $("wf-vote-pick").style.display = "";
  const grid = $("wf-vote-grid");
  grid.innerHTML = "";
  wf.order.forEach((n, j) => {
    if (j === wf.i) return;
    const b = document.createElement("button");
    b.textContent = n;
    b.addEventListener("click", () => wfCastVote(j));
    grid.appendChild(b);
  });
});
$("wf-vote-peace").addEventListener("click", () => wfCastVote(-1));
function wfCastVote(target){
  wf.votes.push(target);
  wf.i++;
  if (wf.i >= wf.order.length) return wfResult();
  wfVotePass();
}
function wfJudge(finals, votes){
  /* 원작(ONUW) 승리 조건: 무두장이 처형 → 무두장이 단독승 · 늑대 있으면 늑대 1명 이상 처형 시 마을승 ·
     늑대 없음: 평화 투표 = 마을승, 하수인만 있으면 하수인 외 처형 시 하수인승, 하수인 처형 시 승자 없음 */
  const n = finals.length;
  const count = Array(n).fill(0);
  let peace = 0;
  votes.forEach(v => { if (v === -1) peace++; else count[v]++; });
  const maxV = Math.max(peace, ...count);
  const executed = (peace >= maxV) ? [] : count.map((c, j) => c === maxV ? j : -1).filter(j => j >= 0);
  const hunterKills = [];
  for (let guard = 0; guard < n; guard++){
    const add = executed.filter(j => finals[j] === "사냥꾼" && votes[j] >= 0 && !executed.includes(votes[j])).map(j => votes[j]);
    if (!add.length) break;
    add.forEach(t => { if (!executed.includes(t)){ executed.push(t); hunterKills.push(t); } });
  }
  const deadWolf = executed.some(j => finals[j] === "늑대인간");
  const deadTanner = executed.some(j => finals[j] === "무두장이");
  const hasWolf = finals.includes("늑대인간");
  const hasMinion = finals.includes("하수인");
  let win;
  if (deadTanner) win = "tanner";
  else if (hasWolf) win = deadWolf ? "village" : "wolf";
  else if (!executed.length) win = "village";
  else if (hasMinion && executed.some(j => finals[j] !== "하수인")) win = "minion";
  else if (hasMinion) win = "nobody";
  else win = "lose";
  return { count, peace, executed, hunterKills, win, deadWolf };
}
function wfResult(){
  const n = wf.order.length;
  const finals = wf.final.slice(0, n);
  const jd = wfJudge(finals, wf.votes);
  const V = {
    tanner:  { em:"🪓", txt:"무두장이 승리!", color:"var(--fire)",   sub:"처형이 소원이었던 무두장이의 큰 그림. 늑대팀은 무조건 패배!" + (jd.deadWolf ? " 늑대도 잡혔으니 마을팀도 같이 승리!" : "") },
    village: { em:"🌞", txt:"마을 승리!",     color:"var(--steppe)", sub: jd.executed.length ? "늑대를 잡아냈다!" : "늑대는 없었다. 평화 투표 정답! 👏" },
    wolf:    { em:"🌕", txt:"늑대팀 승리!",   color:"var(--danger)", sub: finals.includes("하수인") ? "하수인도 같이 승리!" : "늑대는 유유히 사라졌다..." },
    minion:  { em:"😈", txt:"하수인 승리!",   color:"var(--danger)", sub:"늑대 한 마리 없이 혼자 마을을 속여넘겼다..." },
    nobody:  { em:"💀", txt:"모두 패배...",   color:"var(--danger)", sub:"늑대는 없었고 하수인만 잡혔다. 승자 없는 밤" },
    lose:    { em:"💀", txt:"마을 패배...",   color:"var(--danger)", sub:"늑대는 없었는데 무고한 사람을 처형해버렸다..." }
  }[jd.win];
  wfShow("wf-result");
  const voteLines = wf.order.map((nm, j) => nm + " " + jd.count[j] + "표").join(" · ") + (jd.peace ? " · 🕊️평화 " + jd.peace + "표" : "");
  const execLine = (jd.executed.length ? "⚰️ 처형: " + jd.executed.map(j => wf.order[j]).join(", ") : "🕊️ 아무도 처형되지 않음") +
    (jd.hunterKills.length ? "<br>🏹 사냥꾼의 마지막 화살: " + jd.hunterKills.map(j => wf.order[j]).join(", ") + " 동반 처형!" : "");
  const table = wf.order.map((nm, j) => {
    const orig = wf.cards[j], fin = wf.final[j];
    return '<div class="mb-teamcard"><b>' + nm + (jd.executed.includes(j) ? " ⚰️" : "") + '</b><span>' +
      WF_ROLE_INFO[fin].em + " " + fin + (orig !== fin ? ' <s style="opacity:.55">(밤 시작: ' + orig + ')</s>' : "") + '</span></div>';
  }).join("");
  const center = wf.final.slice(n).map((r, k) => {
    const orig = wf.cards[n + k];
    return WF_ROLE_INFO[r].em + r + (orig !== r ? ' <s style="opacity:.55">(' + orig + ')</s>' : "");
  }).join(" · ");
  $("wf-result").innerHTML =
    '<div class="stage-center" style="flex:0;gap:8px;margin-bottom:12px">' +
    '<div style="font-size:70px">' + V.em + '</div>' +
    '<div class="who" style="font-size:32px;color:' + V.color + '">' + V.txt + '</div>' +
    '<p class="hint" style="margin:0">' + V.sub + '</p>' +
    '<p class="hint" style="margin:0">' + execLine + '<br>' + voteLines + '</p></div>' +
    table +
    '<div class="reveal-card" style="margin-top:8px"><div class="lbl">가운데 3장</div><div class="val" style="font-size:15px">' + center + '</div></div>' +
    '<button class="btn mt" id="wf-again">한 판 더!</button>';
  if (wf.multi) mpBroadcast({ t: "reveal", em: V.em, txt: V.txt, sub: V.sub,
    table: wf.order.map((nm, j) => ({ nm, role: wf.final[j], orig: wf.cards[j], dead: jd.executed.includes(j) })) });
  $("wf-again").addEventListener("click", wfReset);
}

/* ================= 여러 폰 (net.js 브릿지) =================
   1차: 호스트가 역할 배분 → 각자 폰에 자기 역할·팀·능력 카드 개인 배달(마피아 패턴).
   밤 능력·투표·공개는 호스트 폰에서 기존 흐름 그대로(pass-and-play). 결과만 각 폰에 미러링.
   컷: 밤 액션/투표를 각 폰에서 하는 2차는 미구현(호스트 폰 돌려가며 진행). */
function wfRolePayload(i){
  const role = wf.cards[i], info = WF_ROLE_INFO[role];
  let team = "";
  if (role === "늑대인간"){
    const mates = wf.order.filter((n, j) => j !== i && wf.cards[j] === "늑대인간");
    team = mates.length ? "동료 늑대 — " + mates.join(", ") : "혼자인 늑대! 동료가 전부 가운데 카드에 있어";
  } else if (role === "하수인"){
    const wolves = wf.order.filter((n, j) => wf.cards[j] === "늑대인간");
    team = wolves.length ? "늑대 — " + wolves.join(", ") + " (늑대는 널 몰라)" : "판에 늑대가 없어! 너 아닌 누가 처형되면 단독 승리";
  } else if (role === "비밀결사"){
    const mates = wf.order.filter((n, j) => j !== i && wf.cards[j] === "비밀결사");
    team = mates.length ? "동료 비밀결사 — " + mates.join(", ") : "혼자인 비밀결사! 동료는 가운데 카드에 숨어 있어";
  }
  return { t: "role", role, em: info.em, tip: info.tip, help: info.help, team, danger: info.team === "늑대팀" };
}
/* 각 폰에 뜨는 역할 카드 (liar-role 재사용). 원격/상수 모두 escHtml. */
function wfRoleHtml(m){
  return '<div class="liar-role' + (m.danger ? ' liar' : '') + '">' +
    '<b>' + m.em + ' ' + escHtml(m.role) + '</b>' +
    '<small style="opacity:.9;font-weight:600;line-height:1.6">' + escHtml(m.tip) + '</small>' +
    (m.team ? '<small style="margin-top:12px;color:var(--fire);font-weight:800;line-height:1.5">🔒 ' + escHtml(m.team) + '</small>' : '') +
    '<small style="margin-top:12px;opacity:.7;font-weight:600;line-height:1.6">' + escHtml(m.help) + '</small>' +
  '</div>';
}
/* ---------- 여러 폰 (호스트) ---------- */
function wfStartMulti(){
  const names = mpNames().map(wfSafeName);
  if (names.length < 4){ alert("여러 폰 늑대인간은 4명 이상 연결돼야 해 (지금 " + names.length + "명)"); return; }
  if (wfSpecialCount() > names.length + 3){ alert("특수 역할이 카드 수(인원+3장)보다 많아요! 역할을 몇 개 꺼주세요"); return; }
  wf.order = names;
  wf.cards = shuffle(wfRoleList(names.length)); /* 앞 N = 플레이어, 뒤 3 = 가운데 */
  wf.final = wf.cards.slice();
  wf.i = 0; wf.robber = null; wf.tmSwap = null; wf.drunk = null; wf.votes = [];
  wf.multi = true;
  mpNav("wolf");                        /* 게스트들 늑대 화면으로 → __guest_wolf 대기 */
  mp.game = { onMsg(){}, onPeers(){} }; /* 호스트 활성 (역할 배달·결과 공개용) */
  /* party 순서 = mpNames 순서 = wf.order → 인덱스로 매칭. 호스트 자기 역할은 밤 pass-around에서 확인 */
  mpParty().forEach((pl, i) => { if (!pl.self) pl.send(wfRolePayload(i)); });
  wfShowPass();                         /* 밤 능력·투표·공개는 호스트 폰에서 기존 흐름대로 */
}
/* ---------- 여러 폰 (게스트) ---------- */
window.__guest_wolf = function(){
  wfShow("wf-secret");
  $("wf-secret").innerHTML =
    '<div class="stage-center" style="flex:0;gap:10px;margin-top:40px">' +
    '<div class="who-label">여러 폰 늑대인간</div>' +
    '<div class="who">대기 중…</div>' +
    '<p class="hint" style="margin:0">호스트가 역할을 나누면 네 역할이 여기 떠</p></div>';
  mp.game = { onMsg(from, m){
    if (m.t === "role"){
      wfShow("wf-secret");
      $("wf-secret").innerHTML = wfRoleHtml(m) +
        '<p class="hint" style="margin-top:16px;text-align:center">네 폰에서 역할·팀 확인!<br>밤 능력·투표·공개는 호스트 폰을 돌려가며 진행해</p>';
    }
    if (m.t === "reveal"){
      wfShow("wf-secret");
      const rows = m.table.map(r => '<div class="mb-teamcard"><b>' + escHtml(r.nm) + (r.dead ? " ⚰️" : "") + '</b><span>' +
        (WF_ROLE_INFO[r.role] ? WF_ROLE_INFO[r.role].em : "") + " " + escHtml(r.role) +
        (r.orig !== r.role ? ' <s style="opacity:.55">(밤 시작: ' + escHtml(r.orig) + ')</s>' : "") + '</span></div>').join("");
      $("wf-secret").innerHTML =
        '<div class="stage-center" style="flex:0;gap:8px;margin:20px 0 12px">' +
        '<div style="font-size:64px">' + m.em + '</div>' +
        '<div class="who" style="font-size:28px">' + escHtml(m.txt) + '</div>' +
        '<p class="hint" style="margin:0">' + escHtml(m.sub) + '</p></div>' + rows;
    }
  }};
};

