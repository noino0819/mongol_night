"use strict";
/* ================= 마피아 ================= */
const MAF_ROLES = [
  { id: "police", icon: "👮", name: "경찰", team: "시민팀", n: 1,
    desc: "밤마다 한 명 조사",
    card: "밤마다 한 명을 조사해요. 진행자가 마피아면 끄덕, 아니면 도리도리!",
    night: '"경찰, 눈 뜨고 조사할 사람 지목" → 진행자가 끄덕/도리도리' },
  { id: "doctor", icon: "💉", name: "의사", team: "시민팀", n: 1,
    desc: "밤마다 한 명 보호",
    card: "밤마다 한 명을 지목해 지켜줘요. 마피아가 노린 사람과 겹치면 그날 밤 아무도 안 죽어요.",
    night: '"의사, 눈 뜨고 살릴 사람 지목"' },
  { id: "reporter", icon: "📰", name: "기자", team: "시민팀", n: 1,
    desc: "밤 취재 1회 → 아침에 직업 공개",
    card: "게임 중 딱 1번, 밤에 한 명을 취재할 수 있어요. 다음 날 아침 진행자가 그 사람의 직업을 전체 공개!",
    night: '"기자, 취재하려면 지금 지목 (게임 중 1회)" → 다음 날 아침 직업 발표' },
  { id: "soldier", icon: "🪖", name: "군인", team: "시민팀", n: 1,
    desc: "마피아 공격 1회 방어",
    card: "마피아의 공격을 딱 1번 버텨요. 버티면 군인인 게 모두에게 공개되고, 다음 공격부턴 못 버텨요.",
    rule: "군인: 마피아 공격을 1회 버팀. 버티면 정체 공개 + 이후엔 방어 불가" },
  { id: "politician", icon: "🎩", name: "정치인", team: "시민팀", n: 1,
    desc: "투표로 처형 안 됨",
    card: "낮 투표에서 몰표를 받아도 처형되지 않아요. 정체만 공개되고 게임은 계속!",
    rule: "정치인: 최다 득표해도 처형 안 됨 (정체만 공개되고 게임 계속)" },
  { id: "terrorist", icon: "💣", name: "테러리스트", team: "시민팀", n: 1,
    desc: "처형되면 1명 동반 퇴장",
    card: "낮 투표로 처형당하면 마지막에 한 명을 지목해 같이 데려가요. 억울하게 몰리면 화끈하게 복수!",
    rule: "테러리스트: 투표로 처형되면 원하는 한 명을 지목해 동반 퇴장" },
  { id: "lovers", icon: "💞", name: "연인", team: "시민팀", n: 2,
    desc: "2명 · 죽으면 같이 죽는 운명",
    help: "둘이 한 팀인 운명 공동체. 서로가 누군지 알고 시작해요. 한 명이 죽으면 남은 한 명도 다음 날 아침 따라가요.",
    rule: "연인: 한 명이 죽으면 남은 한 명도 다음 날 아침 함께 사망" },
  { id: "spy", icon: "🕵️", name: "스파이", team: "마피아팀", n: 1,
    desc: "마피아팀 · 마피아 명단을 앎",
    help: "마피아가 누군지 알지만 마피아는 스파이를 몰라요. 시민인 척 여론을 흔들어 마피아를 승리시키면 같이 이겨요.",
    rule: "스파이: 마피아팀 소속! 시민인 척 마피아를 도와요. 마피아팀이 지면 같이 패배" }
];
const MAF_BASE = [
  { icon: "🔪", name: "마피아", team: "마피아팀", help: "밤마다 한 명을 제거해요. 마피아끼리는 서로를 알아요. 시민 수와 같아지면 마피아팀 승리!" },
  { icon: "👤", name: "시민", team: "시민팀", help: "특별한 능력은 없지만 추리와 투표가 무기! 마피아를 전부 찾아내면 시민팀 승리." }
];
let maf = { count: 1, on: {}, list: [] };
let mafMode = null; /* 유저 토글 선택(null=자동) — 실제 모드는 snMode(mafMode) */
$("maf-minus").addEventListener("click", () => { if (maf.count > 1) maf.count--; $("maf-count").textContent = maf.count; });
$("maf-plus").addEventListener("click", () => { if (maf.count < 3) maf.count++; $("maf-count").textContent = maf.count; });
(function initMafRoles(){
  const box = $("maf-roles");
  MAF_ROLES.forEach(r => {
    const row = document.createElement("div");
    row.className = "toggle-row";
    row.innerHTML = '<span>' + r.icon + ' ' + r.name + ' (' + r.desc + ')</span><button class="tg" id="tg-' + r.id + '"></button>';
    box.appendChild(row);
    row.querySelector(".tg").addEventListener("click", (e) => {
      maf.on[r.id] = !maf.on[r.id];
      e.currentTarget.classList.toggle("on", maf.on[r.id]);
    });
  });
})();
$("maf-help-btn").addEventListener("click", () => {
  const el = $("maf-help"), btn = $("maf-help-btn");
  if (el.style.display !== "none"){ el.style.display = "none"; btn.textContent = "📖 직업 설명 보기"; return; }
  const rows = MAF_BASE.concat(MAF_ROLES.map(r => ({ icon: r.icon, name: r.name + (r.n > 1 ? " (2명)" : ""), team: r.team, help: r.help || r.card })));
  el.innerHTML = '<div class="lbl">직업 도감</div>' + rows.map(r =>
    '<div style="margin-top:10px;text-align:left"><b>' + r.icon + ' ' + r.name + '</b> <small style="opacity:.65">· ' + r.team + '</small><br><small style="opacity:.85;line-height:1.6">' + r.help + '</small></div>'
  ).join("");
  el.style.display = "";
  btn.textContent = "📖 설명 접기";
});
$("mafia-start").addEventListener("click", startMafia);
$("mafia-again").addEventListener("click", startMafia);

/* 역할 풀 생성 (N슬롯: 마피아 count + 특수 + 시민 채움). 특수가 너무 많으면 null. 폰하나·여러폰 공용 */
function mafRolePool(n, count, on){
  const picked = MAF_ROLES.filter(r => on[r.id]);
  const special = count + picked.reduce((s, r) => s + r.n, 0);
  if (special >= n) return null;
  const roles = [];
  for (let i = 0; i < count; i++) roles.push("마피아");
  picked.forEach(r => { for (let i = 0; i < r.n; i++) roles.push(r.name); });
  while (roles.length < n) roles.push("시민");
  return roles;
}
function mafDeal(names, count, on){
  const roles = mafRolePool(names.length, count, on);
  if (!roles) return null;
  const order = shuffle(names.slice());
  const dealt = shuffle(roles);
  return order.map((n, i) => ({ name: n, role: dealt[i] }));
}
function mafGuide(on){
  const picked = MAF_ROLES.filter(r => on[r.id]);
  const lines = ['"모두 눈을 감아주세요"', '"마피아, 눈 뜨고 제거할 사람을 조용히 지목"'];
  picked.filter(r => r.night).forEach(r => lines.push(r.night));
  lines.push('"모두 눈 뜨세요" → 밤 결과 발표 → 낮 토론 & 투표');
  return { lines: lines.map((t, i) => (i + 1) + ". " + t), rules: picked.filter(r => r.rule).map(r => r.icon + " " + r.rule) };
}

/* 한 플레이어의 비밀 카드 내용 {main,sub,liar}. 원격 이름은 escHtml. 폰하나·여러폰 공용. */
function mafSecret(p, mafiaNames, loverNames){
  if (p.role === "마피아"){
    const peers = mafiaNames.filter(n => n !== p.name);
    return { main: "🔪 마피아", sub: (peers.length ? "동료 마피아: " + escHtml(peers.join(", ")) : "당신은 단독 마피아입니다") + (maf.on.spy ? "<br>어딘가에 스파이가 숨어 당신을 몰래 도와요 (누군지는 비밀)" : ""), liar: true };
  }
  if (p.role === "스파이") return { main: "🕵️ 스파이", sub: "당신은 마피아팀! 마피아는 <b>" + escHtml(mafiaNames.join(", ")) + "</b><br>마피아는 당신을 몰라요. 시민인 척 몰래 도우세요", liar: true };
  if (p.role === "연인"){
    const partner = loverNames.find(n => n !== p.name);
    return { main: "💞 연인", sub: "당신의 연인: <b>" + escHtml(partner) + "</b><br>한 명이 죽으면 다음 날 아침 남은 한 명도 따라가요. 끝까지 둘 다 살아남으세요!" };
  }
  const def = MAF_ROLES.find(r => r.name === p.role);
  if (def) return { main: def.icon + " " + def.name, sub: def.card };
  return { main: "👤 시민", sub: "추리력으로 마피아를 찾아내세요" };
}
/* 비밀 카드 → liar-role 스타일 HTML (여러 폰: 각자 폰 + 호스트 자기 카드). main/sub는 이미 이스케이프됨. */
function mafRoleHtml(sec){
  return '<div class="liar-role' + (sec.liar ? " liar" : "") + '"><b>' + sec.main + '</b>' +
    (sec.sub ? '<small style="opacity:.9;font-weight:600;line-height:1.6">' + sec.sub + '</small>' : '') + '</div>';
}

/* core.js resetGame("mafia") 진입점 — 셋업 화면 + 모드 토글 */
function mafiaReset(){
  $("mafia-setup").style.display = "";
  $("mafia-pass").style.display = "none";
  $("mafia-play").style.display = "none";
  const my = $("maf-myrole"); if (my) my.style.display = "none";
  snModeBar($("mafia-setup"), snMode(mafMode), (m) => { mafMode = m; mafiaReset(); });
}

function startMafia(){
  if (snMode(mafMode) === "multi") return startMafiaMulti();
  return startMafiaSolo();
}

/* 밤 진행 가이드 + 특수 규칙을 play 화면에 채움 (폰하나·여러폰 공용, 호스트 화면) */
function mafShowGuide(){
  $("mafia-pass").style.display = "none";
  $("mafia-play").style.display = "";
  $("mafia-modlist").style.display = "none";
  const g = mafGuide(maf.on);
  $("mafia-order").innerHTML = g.lines.join("<br>");
  $("mafia-rules").style.display = g.rules.length ? "" : "none";
  $("mafia-rules-val").innerHTML = g.rules.join("<br>");
}
/* play 화면 표시. 여러 폰이면 호스트 자기 역할 카드도 맨 위에. */
function mafShowPlay(multi){
  $("mafia-setup").style.display = "none";
  let my = $("maf-myrole");
  if (multi){
    if (!my){ my = document.createElement("div"); my.id = "maf-myrole"; my.style.marginBottom = "14px"; $("mafia-play").prepend(my); }
    my.style.display = "";
    my.innerHTML = mafRoleHtml(maf.myRole);
  } else if (my){ my.style.display = "none"; }
  mafShowGuide();
}

/* ---------- 폰 하나 (기존: 폰 돌려가며 꾹눌러 확인) ---------- */
function startMafiaSolo(){
  const list = mafDeal(roster, maf.count, maf.on);
  if (!list){ alert("특수 역할이 너무 많아요! 시민이 최소 1명은 있어야 해요."); return; }
  maf.list = list;
  const order = list.map(p => p.name);
  const mafiaNames = list.filter(p => p.role === "마피아").map(p => p.name);
  const loverNames = list.filter(p => p.role === "연인").map(p => p.name);

  $("mafia-setup").style.display = "none";
  $("mafia-play").style.display = "none";
  const pass = $("mafia-pass");
  pass.style.display = "flex";
  runPassPhase(pass, order,
    (i) => mafSecret(maf.list[i], mafiaNames, loverNames),
    () => mafShowPlay(false)
  );
}

/* ---------- 여러 폰 (호스트) ---------- */
function startMafiaMulti(){
  const party = mpParty();
  if (party.length < 4){ alert("여러 폰 마피아는 4명 이상 연결돼야 해 (지금 " + party.length + "명)"); return; }
  const roles = mafRolePool(party.length, maf.count, maf.on);
  if (!roles){ alert("특수 역할이 너무 많아요! 시민이 최소 1명은 있어야 해요."); return; }
  /* 역할만 섞어 party 슬롯에 인덱스로 배정 — 이름으로 안 찾으니 동명이인이어도 오배달 없음 */
  const dealt = shuffle(roles);
  const list = party.map((pl, i) => ({ name: pl.name, role: dealt[i] }));
  maf.list = list;
  const mafiaNames = list.filter(p => p.role === "마피아").map(p => p.name);
  const loverNames = list.filter(p => p.role === "연인").map(p => p.name);

  mpNav("mafia");                        /* 게스트들 마피아 화면으로 (__guest_mafia 실행 → 대기) */
  mp.game = { onMsg(){}, onPeers(){} };  /* 호스트도 게임 활성 */
  party.forEach((pl, i) => {             /* party[i] ↔ list[i] 인덱스 정합 — 이름 매칭 제거 */
    const sec = mafSecret(list[i], mafiaNames, loverNames);
    const payload = { t: "role", main: sec.main, sub: sec.sub, liar: sec.liar };
    if (pl.self) maf.myRole = payload; else pl.send(payload);
  });
  mafShowPlay(true);
}

/* ---------- 여러 폰 (게스트) ---------- */
window.__guest_mafia = function(){
  $("mafia-setup").style.display = "none";
  $("mafia-play").style.display = "none";
  const pass = $("mafia-pass");
  pass.style.display = "flex";
  pass.innerHTML = '<div class="who-label">여러 폰 마피아</div><div class="who">대기 중…</div><div class="hint" style="margin:0">호스트가 역할을 나누면 네 역할이 여기 떠</div>';
  mp.game = { onMsg(from, m){
    if (m.t === "role"){
      pass.style.display = "flex";
      pass.innerHTML = mafRoleHtml(m) + '<div class="hint" style="margin-top:14px">네 폰만 확인해. 밤/낮 진행은 호스트 폰 보고 따라가</div>';
    }
  }};
};
holdReveal($("mafia-modview"),
  () => {
    const ml = $("mafia-modlist");
    ml.style.display = "";
    ml.innerHTML = '<div class="lbl">사회자 전용 · 손 떼면 사라짐</div><div class="val">' + maf.list.map(p => escHtml(p.name) + " — " + p.role).join("<br>") + '</div>';
  },
  () => { $("mafia-modlist").style.display = "none"; }
);

