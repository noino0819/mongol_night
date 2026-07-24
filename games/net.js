"use strict";
/* ================= 게임 네트워크 브릿지 (net) =================
   mp.js(연결 계층) 위에 얹는 "여러 폰 게임" 공용 layer. mp.js 바로 뒤에 로드.
   - 호스트가 게임을 시작하면 게스트 폰들을 같은 화면으로 끌고 들어가고(mpNav),
     게임 데이터를 브로드캐스트/개인배달하고, 게스트는 호스트로 되쏜다.
   - 각 게임은 활성화될 때  mp.game = { onMsg(from, m), onPeers(names) }  를 등록한다.
   - 게스트 진입 훅: 게임이  window["__guest_"+name]  함수를 정의해두면
     호스트가 그 게임을 시작할 때(mpNav) 게스트 폰에서 자동 호출된다(핸들러 등록·대기화면).
   메시지 봉투: {t:"game", m:{…}}=게임데이터 · {t:"nav", game}=화면이동.
   mp.js의 onmessage가 mpGameRecv(from, msg)로 넘겨준다.

   === 여러 폰 게임 붙이는 법 (게임 파일에서) ===
   1) 셋업 화면 상단에  snModeBar(mount, mode, (m)=>{모드저장; 다시그림})  로 토글.
   2) 호스트 시작 흐름:  참가자 = mpNames();  mpNav("게임id");  mp.game={onMsg};
      개인정보 배달 →  mpParty().forEach((pl,i)=>{ pl.self ? 로컬렌더 : pl.send(payload) })
      공유 상태(문제·보드·턴·결과) →  mpBroadcast(payload)
   3) 게스트:  window.__guest_게임id = ()=>{ mp.game={onMsg(from,m){…}}; 대기화면 }  ;
      내 입력은  mpToHost(payload)  로 호스트에 전송. */

/* ---------- 상태 질의 ---------- */
function mpAmHost(){ return mp.role === "host"; }
function mpLive(){
  return mp.role === "host"  ? mp.peers.some((p) => p.on)
       : mp.role === "guest" ? !!(mp.hostChan && mp.hostChan.readyState === "open")
       : false;
}
/* 참가자 표시 이름 (호스트 먼저, 자기 포함) — 여러 폰 모드의 roster 대체. */
function mpNames(){
  if (mp.role === "host") return [mp.name].concat(mp.peers.filter((p) => p.on).map((p) => p.name || "게스트"));
  if (mp.role === "guest") return (mp.rosterNames && mp.rosterNames.length) ? mp.rosterNames.slice() : [mp.hostName || "호스트", mp.name];
  return [];
}

/* ---------- 송신 ---------- */
/* 호스트: 참가자별 객체 [{name, self, host, send(m)}]. self는 send가 no-op(자기 것은 로컬 렌더).
   순서는 mpNames()와 동일(호스트 먼저 → on 게스트) → 인덱스로 역할 배분 가능.
   개인정보 배달(각자 다른 값)에 쓴다. 게스트는 자기 하나만. */
function mpParty(){
  const me = { name: mp.name, self: true, host: mpAmHost(), send(){} };
  if (mpAmHost())
    return [me].concat(mp.peers.filter((p) => p.on).map((p) => ({
      name: p.name || "게스트", self: false, host: false,
      send(m){ mpSend(p.chan, { t: "game", m }); }
    })));
  return [me];
}
/* 호스트→전원 (공유 상태: 문제·보드·턴·결과) */
function mpBroadcast(m){ if (mpAmHost()) mp.peers.forEach((p) => { if (p.on) mpSend(p.chan, { t: "game", m }); }); }
/* 게스트→호스트 (내 입력: 답·착수·버저) */
function mpToHost(m){ if (mp.role === "guest") mpSend(mp.hostChan, { t: "game", m }); }
/* 호스트→전원 화면 이동. 게스트 폰을 game 화면으로 끌고 간다. "home"이면 연결방 복귀. */
function mpNav(game){ if (mpAmHost()) mp.peers.forEach((p) => { if (p.on) mpSend(p.chan, { t: "nav", game }); }); }

/* ---------- 수신 (mp.js onmessage가 호출) ---------- */
function mpGameRecv(from, msg){
  if (msg.t === "nav"){ mpGuestNav(msg.game); return; }
  if (msg.t === "roster"){ mpGamePeers(); return; }               /* 게스트: 명단 갱신 통지 */
  if (msg.t === "game" && mp.game && mp.game.onMsg) mp.game.onMsg(from, msg.m);
}
function mpGamePeers(){ if (mp.game && mp.game.onPeers) mp.game.onPeers(mpNames()); }
/* 게스트: 호스트가 시작한 게임 화면으로 따라 들어간다. */
function mpGuestNav(game){
  if (game === "home"){ mp.game = null; go("mp"); return; }
  if (typeof resetGame === "function") resetGame(game);           /* 각 게임 reset이 mpAmHost()로 게스트 분기 렌더 */
  go(game);
  const init = window["__guest_" + game];
  if (typeof init === "function") init();                          /* 게스트 진입 훅 */
}

/* 게스트에겐 '홈'이 없다 — 연결 상태에 맞춰 상단 뒤로가기를 정리.
   대기방(scr-mp): 뒤로가기 숨김(아래 방 나가기 버튼만 남김) · 게임 화면: '← 홈' → '🚪 나가기' */
function mpSyncBack(){
  const guest = mpLive() && !mpAmHost();
  document.querySelectorAll('.back[data-go="home"]').forEach((b) => {
    if (b.closest("#scr-mp")) b.style.visibility = guest ? "hidden" : "";
    else b.textContent = guest ? "🚪 나가기" : "← 홈";
  });
}

/* 모드 결정: saved = 유저가 토글로 고른 값(null=미선택).
   방에 연결돼 있으면 기본 여러 폰, 미연결이면 무조건 폰 하나(선택은 보존 → 재연결 시 복귀). */
function snMode(saved){ return mpLive() ? (saved || "multi") : "solo"; }

/* ---------- 모드 토글 UI ---------- */
/* 게임 셋업 상단에 [📱 폰 하나 | 📡 여러 폰] 토글을 꽂는다(idempotent).
   여러 폰인데 미연결이면 연결 화면으로 유도. onPick(mode)로 선택 통지. */
function snModeBar(mountEl, current, onPick){
  if (!mountEl) return;
  let bar = mountEl.querySelector(":scope > .sn-modebar");
  if (!bar){ bar = document.createElement("div"); bar.className = "sn-modebar"; mountEl.prepend(bar); }
  bar.innerHTML = "";
  const live = mpLive();
  const mk = (mode, label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    if (mode === current) b.classList.add("sel");
    b.addEventListener("click", () => {
      if (mode === "multi" && !mpLive()){
        snConfirm("📡", "폰 연결이 먼저예요", "여러 폰 모드는 폰끼리 연결부터 해야 해요. 연결 화면으로 갈까요?", "연결하러 가기", () => go("mp"));
        return;
      }
      onPick(mode);
    });
    return b;
  };
  bar.append(mk("solo", "📱 폰 하나"), mk("multi", "📡 여러 폰" + (live ? " · " + mpNames().length + "명" : "")));
}
