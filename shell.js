"use strict";
/* ================================================================
   v2 PWA: 서비스워커 등록 + 오프라인 배지 + 설치 유도 + 업데이트 토스트
   ================================================================ */
const pwa = { deferredPrompt: null, toastEl: null, toastTimer: null };

function pwaToast(msg, btnLabel, onBtn, opts){
  if (pwa.toastEl) pwa.toastEl.remove();
  clearTimeout(pwa.toastTimer);
  const t = document.createElement("div");
  t.className = "px-toast" + (opts && opts.warn ? " warn" : "");
  t.innerHTML = "<span></span>";
  t.querySelector("span").textContent = msg;
  if (btnLabel){
    const b = document.createElement("button");
    b.textContent = btnLabel;
    b.addEventListener("click", () => { t.remove(); pwa.toastEl = null; onBtn(); });
    t.appendChild(b);
  } else {
    /* 긴 메시지는 읽을 시간만큼 더 띄움 (2.4s ~ 5.2s) — 퇴장은 스르륵 */
    const dur = Math.min(5200, Math.max(2400, 1000 + msg.length * 60));
    pwa.toastTimer = setTimeout(() => {
      t.classList.add("bye");
      setTimeout(() => { t.remove(); if (pwa.toastEl === t) pwa.toastEl = null; }, 200);
    }, dur);
  }
  document.body.appendChild(t);
  pwa.toastEl = t;
}

/* 네이티브 alert() 대체: 픽셀 토스트로 통일 (v1 게임 로직은 무수정, 호출부 전 화면 공통 적용) */
window.alert = function(msg){
  pwaToast(String(msg), null, null, { warn: true });
  if (navigator.vibrate) navigator.vibrate(60);
};

/* 네이티브 confirm() 대체: 픽셀 확인 모달 (life-modal 스킨 재사용). onOk는 확인 버튼에서만 실행 */
function snConfirm(em, tt, ds, okLabel, onOk){
  const old = document.querySelector(".life-modal.sn-confirm"); if (old) old.remove();
  const wrap = document.createElement("div");
  wrap.className = "life-modal sn-confirm";
  wrap.innerHTML = '<div class="inner"><div class="em"></div><div class="tt"></div><div class="ds"></div>' +
    '<div class="row"><button class="btn ghost">취소</button><button class="btn"></button></div></div>';
  wrap.querySelector(".em").textContent = em;
  wrap.querySelector(".tt").textContent = tt;
  wrap.querySelector(".ds").textContent = ds;
  const btns = wrap.querySelectorAll(".row button");
  btns[0].addEventListener("click", () => wrap.remove());
  btns[1].textContent = okLabel || "확인";
  btns[1].addEventListener("click", () => { wrap.remove(); onOk(); });
  wrap.addEventListener("click", (e) => { if (e.target === wrap) wrap.remove(); }); /* 바깥 탭 = 취소 */
  document.body.appendChild(wrap);
}

(function pwaInit(){
  /* 버전 단일 소스 — 홈·설정 푸터(.app-version) 모두 채움. CI가 __BUILD__를 커밋 SHA로 치환(로컬은 생략) */
  const VER = "v2.11.3";
  const BUILD = "__BUILD__";
  const verText = VER + (BUILD.includes("_") ? "" : " · " + BUILD);
  document.querySelectorAll(".app-version").forEach((el) => { el.textContent = verText; });
  const badge = $("pwa-badge");
  const installBtn = $("pwa-install");
  /* 설정 화면 '앱으로 설치하기'는 항상 눌리므로, 실제 유도 로직이 세팅되기 전 기본 동작을 미리 깔아둠 */
  pwa.installAction = () => pwaToast("설치 준비 중이야, 잠깐 뒤 다시 눌러줘");
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  /* 카톡 등 인앱 브라우저: beforeinstallprompt 미발화(안드)·Safari 아님(iOS)이라 설치 불가 → 외부 브라우저로 탈출시킴 */
  const inApp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeapp/i.test(navigator.userAgent);
  const openExternal = () => {
    if (/android/i.test(navigator.userAgent)){
      /* 안드로이드: 크롬으로 강제 오픈 (크롬 없으면 아무 일 없음 — 드문 케이스) */
      location.href = "intent://" + location.href.replace(/^https?:\/\//, "") + "#Intent;scheme=https;package=com.android.chrome;end";
    } else {
      lifeModal("🌐", "브라우저로 열어줘",
        "카톡 안에서는 설치·오프라인 저장이 안 돼.<br><br>1. 화면 <b>아래(또는 위) 메뉴 버튼</b>을 눌러<br>2. <b>Safari로 열기</b> / <b>다른 브라우저로 열기</b> 선택<br>3. 열린 브라우저에서 다시 <b>설치</b>를 눌러", null);
    }
  };

  /* --- 오프라인 준비 배지 --- */
  const canSW = "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1");
  if (!canSW){
    /* file:// 등: SW 불가 환경. 배지 숨김 (기능엔 지장 없음) */
    badge.style.display = "none";
  } else {
    /* 성공 배지는 잠깐 확인시킨 뒤 스르륵 퇴장 — ⏳/⚠️는 계속 표시 */
    const badgeOk = (msg) => {
      badge.textContent = msg;
      badge.classList.add("ok");
      setTimeout(() => {
        badge.classList.add("bye");
        setTimeout(() => { badge.style.display = "none"; }, 700);
      }, 3000);
    };
    if (navigator.serviceWorker.controller){
      badgeOk("✅ 오프라인 준비 완료");
    }
    const promptUpdate = (w) => {
      /* 설정에서 '최신 버전 받아오기'를 누른 경우엔 토스트 없이 바로 적용 */
      if (pwa.autoApply){
        pwa.wantReload = true;
        w.postMessage("SKIP_WAITING");
        return;
      }
      pwaToast("🌙 새 버전 도착!", "새로고침", () => {
        pwa.wantReload = true;
        w.postMessage("SKIP_WAITING");
      });
    };
    /* 설정 버튼용 수동 업데이트 — 토스트가 아직 안 떴어도 강제로 최신 확인 */
    pwa.manualUpdate = async (reg) => {
      if (!navigator.onLine){ pwaToast("새 버전을 받으려면 인터넷에 연결해줘", null, null, { warn: true }); return; }
      pwa.autoApply = true;
      if (reg.waiting){ promptUpdate(reg.waiting); return; } /* 이미 대기 중 → 즉시 적용 */
      pwaToast("최신 버전 확인 중…");
      try { await reg.update(); }
      catch (e){ pwa.autoApply = false; pwaToast("확인 실패 — 잠깐 뒤 다시 해줘", null, null, { warn: true }); return; }
      /* update() 후 새 워커가 있으면 updatefound→promptUpdate가 자동 적용. 없으면 최신 */
      if (reg.installing || reg.waiting){ pwaToast("새 버전 받는 중…"); }
      else { pwa.autoApply = false; pwaToast("이미 최신 버전이야 🌙"); }
    };
    navigator.serviceWorker.register("sw.js").then((reg) => {
      pwa.reg = reg;
      /* 지난 방문에서 토스트를 못 누르고 닫았어도, 대기 중인 워커가 있으면 다시 안내 */
      if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state !== "installed") return;
          if (navigator.serviceWorker.controller){
            promptUpdate(w);
          } else {
            badgeOk("✅ 오프라인 저장 끝! 이제 비행기 모드에서도 돼");
          }
        });
      });
      /* 앱을 켜둔 채 오래 쓰는 파티게임 특성상, 로드 시 1회 체크로는 부족.
         포그라운드 복귀·온라인 복귀·1시간마다 새 배포 확인 */
      const checkUpdate = () => { if (navigator.onLine) reg.update().catch(() => {}); };
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkUpdate(); });
      window.addEventListener("online", checkUpdate);
      setInterval(checkUpdate, 60 * 60 * 1000);
    }).catch(() => {
      /* 성공 배지가 이미 퇴장했더라도 실패는 다시 보여준다 */
      badge.style.display = "";
      badge.classList.remove("ok", "bye");
      badge.textContent = "⚠️ 오프라인 저장 실패 — 새로고침 해줘";
      badge.classList.add("err");
    });
    /* 첫 설치 때 clients.claim()도 controllerchange를 발화시키므로,
       사용자가 [새로고침]을 누른 경우에만 reload */
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!pwa.wantReload || reloading) return;
      reloading = true;
      location.reload();
    });
  }

  /* --- 설치 유도 --- */
  if (standalone){
    /* 이미 앱으로 실행 중 — 설정의 설치 버튼은 숨기고, 눌러도 안내만 */
    const si = $("set-install"); if (si) si.style.display = "none";
    pwa.installAction = () => pwaToast("이미 앱으로 실행 중이야 🎉");
    return;
  }
  if (inApp){
    /* 인앱 브라우저: 설치 버튼을 '브라우저로 열기'로 바꿔 노출 + 진입 즉시 1회 안내 */
    installBtn.textContent = "🌐 브라우저로 열기";
    installBtn.style.display = "";
    installBtn.addEventListener("click", openExternal);
    pwaToast("카톡 안에선 설치·오프라인이 안 돼", "🌐 브라우저로 열기", openExternal);
    pwa.installAction = openExternal; /* 온보딩 '앱으로 설치하기'도 탈출로 연결 */
    return;
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pwa.deferredPrompt = e;
    installBtn.style.display = "";
  });
  window.addEventListener("appinstalled", () => {
    installBtn.style.display = "none";
    pwa.deferredPrompt = null;
    pwaToast("📲 설치 완료! 홈 화면에서 열어주세요");
  });
  if (isIOS && canSW){
    installBtn.textContent = "📲 홈 화면에 추가";
    installBtn.style.display = "";
  }
  pwa.installAction = () => {
    if (pwa.deferredPrompt){
      pwa.deferredPrompt.prompt();
      pwa.deferredPrompt.userChoice.finally(() => { pwa.deferredPrompt = null; installBtn.style.display = "none"; });
    } else if (isIOS){
      lifeModal("📲", "홈 화면에 설치하기",
        "1. Safari 하단 <b>공유 버튼(⬆️)</b>을 눌러요<br>2. <b>홈 화면에 추가</b>를 선택해요<br>3. 끝! 이제 비행기 모드에서도 열려요<br><br><span style='color:var(--dim)'>Safari에서만 가능해요. 크롬이라면 Safari로 열어주세요</span>", null);
    } else if (/Chrome|CriOS|Edg|SamsungBrowser/.test(navigator.userAgent)){
      /* 크로미움인데 설치 프롬프트가 없음 = 대개 이미 설치돼 있음(설치된 앱엔 beforeinstallprompt를 안 쏨).
         ponytail: UA 휴리스틱 — 확실한 판정은 manifest related_applications+getInstalledRelatedApps 필요하나
         배포 절대경로를 몰라 생략. 아래 폴백 문구로 '조건 미충족'인 드문 케이스도 커버 */
      lifeModal("🎉", "이미 설치돼 있어",
        "새로 설치 안 해도 돼! <b>홈 화면(또는 앱 목록)</b>의 <b>초원의 밤</b> 아이콘을 눌러서 열면 끝.<br><br><span style='color:var(--dim)'>아이콘이 안 보이면 브라우저를 껐다 켠 뒤 다시 눌러줘.</span>", null);
    } else {
      pwaToast("이 브라우저에선 설치 안내가 없어 — 폰의 크롬/사파리로 열어봐");
    }
  };
  installBtn.addEventListener("click", pwa.installAction);
})();

/* ================================================================
   v2 앱 셸: prefs(localStorage) + 스플래시 + 온보딩
   ================================================================ */
const PREFS_KEY = "sn_prefs_v1";
const prefs = (() => {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {}; }
  catch (e) { return {}; } /* localStorage 불가 환경 → 인메모리 폴백 */
})();
function savePrefs(){
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* 무시 */ }
}

/* --- 온보딩 (프로토타입 OB 데이터) --- */
const OB_PAGES = [
  { t:"와이파이? 필요 없어", s:"비행기 모드에서도 전부 돌아가는 파티게임 20종", scene:[["fox",4],["fire",5],["bor",4]] },
  { t:"폰 하나면 충분", s:"돌려가며 하는 패스앤플레이. 비밀은 꾹 눌러 확인!", scene:[["bor",4],["phone",5],["wolf",4]] },
  { t:"가볍게도, 진하게도", s:"5분 폭탄 돌리기부터 40분 어드벤처까지", scene:[["dice",4],["mole",5],["tengri",4]] },
  { t:"홈 화면에 설치하면 완성", s:"설치해 두면 앱 아이콘으로 바로 실행돼", scene:[["arrowdn",4],["bor",5]] }
];
const ob = { page: 0 };
function obRender(){
  const p = OB_PAGES[ob.page];
  const last = ob.page === OB_PAGES.length - 1;
  $("ob-scene").innerHTML = p.scene.map(([n, s]) => '<px-sprite name="' + n + '" scale="' + s + '"></px-sprite>').join("");
  $("ob-title").textContent = p.t;
  $("ob-sub").textContent = p.s;
  $("ob-cta").style.display = last ? "" : "none";
  $("ob-prev").style.visibility = ob.page > 0 ? "visible" : "hidden";
  $("ob-next").style.visibility = last ? "hidden" : "visible";
  $("ob-dots").innerHTML = OB_PAGES.map((_, i) => '<i class="' + (i === ob.page ? "on" : "") + '"></i>').join("");
}
function obShow(){ ob.page = 0; obRender(); $("onboard").style.display = ""; }
function obDone(){
  prefs.onboarded = true;
  savePrefs();
  $("onboard").style.display = "none";
  if (typeof coachShow === "function") coachShow("fav");
}
$("ob-next").addEventListener("click", () => { if (ob.page < OB_PAGES.length - 1){ ob.page++; obRender(); } });
$("ob-prev").addEventListener("click", () => { if (ob.page > 0){ ob.page--; obRender(); } });
$("ob-skip").addEventListener("click", obDone);
$("ob-later").addEventListener("click", obDone);
$("ob-install").addEventListener("click", () => { obDone(); if (pwa.installAction) pwa.installAction(); });
$("set-install").addEventListener("click", () => { if (pwa.installAction) pwa.installAction(); });
$("set-update").addEventListener("click", () => {
  if (pwa.manualUpdate && pwa.reg) pwa.manualUpdate(pwa.reg);
  else pwaToast("이 브라우저에선 업데이트 확인이 안 돼");
});

/* --- 일행 영속화 --- */
/* prefs.roster가 배열이면 사용자가 저장한 상태(빈 배열 포함) → 그대로 존중.
   한 번도 저장한 적 없을 때만 기본 일행을 채운다. */
const DEFAULT_ROSTER = ["시언","소연","예린","현서","재현","건호"];
function saveRoster(){ prefs.roster = roster.slice(); savePrefs(); }
if (Array.isArray(prefs.roster)){
  roster.push(...prefs.roster.filter((n) => typeof n === "string" && n.trim()).slice(0, 12));
} else {
  roster.push(...DEFAULT_ROSTER);
}
renderChips();

/* --- 설정 페이지 --- */
(function settingsInit(){
  /* 토글: 사운드·진동 모두 기본 on */
  const bindTg = (id, key, def) => {
    const el = $(id);
    const cur = () => (key in prefs ? !!prefs[key] : def);
    el.classList.toggle("on", cur());
    el.addEventListener("click", () => {
      prefs[key] = !cur();
      savePrefs();
      el.classList.toggle("on", prefs[key]);
      if (key === "vibe" && prefs.vibe && navigator.vibrate) navigator.vibrate(10);
      if (key === "sound"){ if (prefs.sound) snSfx("select"); else snBgmStop(); }  /* 켜면 바로 들려주고, 끄면 BGM 정지 */
    });
  };
  bindTg("set-sound", "sound", true);
  bindTg("set-vibe", "vibe", true);

  /* 텍스트 속도 seg */
  const seg = $("set-speed");
  const applySpeed = () => seg.querySelectorAll("button").forEach((b) =>
    b.classList.toggle("sel", b.dataset.s === (prefs.tspeed || "보통")));
  applySpeed();
  seg.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    prefs.tspeed = b.dataset.s;
    savePrefs();
    applySpeed();
  }));

  /* 폰 전달 가림막 시간 seg */
  const cov = $("set-cover");
  const applyCover = () => cov.querySelectorAll("button").forEach((b) =>
    b.classList.toggle("sel", b.dataset.c === String(snCoverMode())));
  applyCover();
  cov.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    prefs.passCover = b.dataset.c === "tap" ? "tap" : +b.dataset.c;
    savePrefs();
    applyCover();
  }));

  /* 데이터 초기화: 2단계 확인 */
  $("set-reset").addEventListener("click", () => {
    mbAsk("🗑️", "데이터를 초기화할까?", "즐겨찾기·설정·일행·세이브가 전부 사라져",
      "초기화 진행", "그대로 두기",
      () => mbAsk("⚠️", "진짜 마지막 확인이야", "되돌릴 수 없어. 온보딩부터 다시 시작해",
        "전부 지우기", "그대로 두기",
        () => {
          try {
            ["sn_prefs_v1", "balance_seen_v1", "ta_save_v1", "sn_penalties_v1"].forEach((k) => localStorage.removeItem(k));
          } catch (e) { /* 무시 */ }
          location.reload();
        }, () => {}),
      () => {});
  });
})();

/* ================================================================
   v2 홈 IA: 카테고리 6종 · 인원 필터 · 즐겨찾기 · 최근 한 판 · 코치마크
   go:null 게임은 아직 미구현 (M3~M4에서 채움)
   ================================================================ */
const SN_CATS = [
  { id:"psych", emoji:"🕵️", name:"심리전", spr:"fox", games:[
    { id:"liar",     go:"liar",      need:3, name:"라이어",        spr:"fox",      desc:"말로 속이고 눈치로 잡아",       p:[3,8],  t:15 },
    { id:"mafia",    go:"mafia",     need:4, name:"마피아",        spr:"crow",     desc:"밤이 되면 누군가 사라진다",     p:[4,10], t:20 },
    { id:"were",     go:"wolf",      need:4, name:"늑대인간",      spr:"wolf",     desc:"보름달 아래 정체 숨기기",       p:[4,10], t:25 } ] },
  { id:"speed", emoji:"⚡", name:"스피드", spr:"mole", games:[
    { id:"fruit",    go:"fruit",     need:2, name:"과일 종!",      spr:"hedgehog", desc:"진짜 할리갈리, 합 5면 종 쳐",     p:[2,6],  t:10 },
    { id:"bomb",     go:"bomb",      need:3, name:"폭탄 돌리기",   spr:"mole",     desc:"터지기 전에 넘겨",              p:[3,10], t:5 },
    { id:"buzzer",   go:"bz",        need:2, name:"버저 퀴즈",     spr:"rooster",  desc:"먼저 누르면 임자",              p:[2,8],  t:15 },
    { id:"forehead", go:"forehead",  need:0, name:"이마 퀴즈",     spr:"goat",     desc:"내 이마에 뭐 있게",             p:[3,8],  t:10 },
    { id:"choseong", go:"choseong",  need:0, name:"초성 퀴즈",     spr:"squirrel", desc:"ㄱㄴ만 보고 맞혀",              p:[2,8],  t:10 },
    { id:"colorhunt",go:"cf",        need:0, name:"색찾기",        spr:"rooster",  desc:"카메라로 목표색 찾기 · 폰 여럿",  p:[2,8],  t:10 } ] },
  { id:"draw", emoji:"🎨", name:"그림", spr:"rabbit", games:[
    { id:"relay",    go:"drawrelay", need:3, name:"그림 릴레이",   spr:"rabbit",   desc:"그림으로 전하는 전화게임",      p:[3,10], t:15 },
    { id:"drawq",    go:"catchmind", need:3, name:"그림 퀴즈",     spr:"otter",    desc:"내 그림 실력을 믿지 마",        p:[3,8],  t:15 } ] },
  { id:"board", emoji:"🎲", name:"보드·두뇌", spr:"bor", games:[
    { id:"journey",  go:"life",      need:2, name:"몽골 대장정 2.0", spr:"bor",    desc:"초원 횡단 보드 레이스",         p:[2,6],  t:40 },
    { id:"omok",     go:"omok",      need:0, name:"오목",          spr:"turtle",   desc:"다섯 알을 먼저 놓아라",         p:[2,2],  t:10 },
    { id:"dicebet",  go:"lv",        need:2, name:"주사위 배팅",   spr:"badger",   desc:"눈치로 거는 상금 독식전",       p:[2,5],  t:15 },
    { id:"vegas",    go:"vg",        need:0, name:"라스베가스",    spr:"hawk",     desc:"카지노 6곳 지폐 쟁탈전 · 폰 여럿",  p:[2,6],  t:20 },
    { id:"baseball", go:"nb",        need:2, name:"숫자야구",      spr:"crane",    desc:"3자리 숫자 추리 대결",          p:[2,4],  t:15 },
    { id:"escape",   go:"er",        need:0, name:"게르 탈출",     spr:"owlprof",  desc:"단서 풀어 암호 열고 탈출",       p:[1,8],  t:15 } ] },
  { id:"talk", emoji:"💬", name:"토크·퀴즈", spr:"camel", games:[
    { id:"balance",  go:"balance",   need:0, name:"밸런스 게임",   spr:"camel",    desc:"A냐 B냐 그것이 문제",           p:[2,10], t:10 },
    { id:"tele",     go:"tele",      need:3, name:"텔레파시",      spr:"owl2",     desc:"같은 생각이면 승리",            p:[3,10], t:10 },
    { id:"urimal",   go:"um",        need:2, name:"우리말 겨루기", spr:"crane",    desc:"맞춤법으로 서열 정리",     p:[2,10], t:15 },
    { id:"roulette", go:"roulette",  need:2, name:"복불복 룰렛",   spr:"marmot",   desc:"운명의 화살을 돌려",            p:[2,10], t:5 },
    { id:"quiz",     go:"gq",        need:2, name:"상식퀴즈",      spr:"owlprof",  desc:"초원의 골든벨",                 p:[2,10], t:20 } ] },
  { id:"story", emoji:"📜", name:"스토리", spr:"tengri", games:[
    { id:"gobi",     go:"ta",        need:2, name:"고비의 별",     spr:"tengri",   desc:"텡그리와 떠나는 3일 밤",        p:[2,6],  t:35 },
    { id:"teller",   go:"gm",        need:2, name:"이야기꾼의 밤", spr:"fire",     desc:"네가 GM, 앱은 상황과 주사위만",  p:[2,8],  t:25 } ] }
];
const SN_GAME_BY_ID = {};
SN_CATS.forEach((c) => c.games.forEach((g) => { SN_GAME_BY_ID[g.id] = g; }));
if (!prefs.openCats) prefs.openCats = { psych: true };
if (!prefs.favs) prefs.favs = {};
if (!prefs.coachDone) prefs.coachDone = {};

function haptic(pattern){
  if (("vibe" in prefs ? prefs.vibe : true) && navigator.vibrate){
    try { navigator.vibrate(pattern); } catch (e) { /* 무시 */ }
  }
}

/* --- 코치마크 --- */
const COACH_TEXTS = {
  fav: "게임 카드를 길게 누르면 즐겨찾기 ⭐ 에 등록돼",
  secret: "비밀은 꾹 누르는 동안만 보여 — 손 떼면 바로 잠겨",
  roster: "여기서 일행을 등록하면 모든 게임에서 그대로 쓰여"
};
let coachCur = null;
function coachShow(key){
  if (prefs.coachDone[key] || coachCur) return;
  coachCur = key;
  $("coach-tx").textContent = COACH_TEXTS[key];
  $("coach").style.display = "";
}
$("coach-ok").addEventListener("click", () => {
  if (coachCur){ prefs.coachDone[coachCur] = true; savePrefs(); coachCur = null; }
  $("coach").style.display = "none";
});

/* --- 게임 실행 (필터/카드/최근/즐겨찾기 공용 경로) --- */
function launchGame(g){
  if (!g.go){
    pwaToast("🚧 " + g.name + "은(는) 준비 중이야, 곧 나와");
    return;
  }
  if (roster.length < g.need){
    alert("이 게임은 " + g.need + "명 이상 필요해요!\n설정(⚙️)에서 일행을 등록해주세요 🙌");
    return;
  }
  prefs.recent = { id: g.id, when: Date.now(), n: roster.length };
  savePrefs();
  haptic(10);
  resetGame(g.go);
  go(g.go);
  coachShow("secret");
}

/* 길게 누르면 즐겨찾기 토글, 짧게 탭이면 실행 */
function bindGameCard(el, g){
  let lpId = null, lpFired = false;
  el.addEventListener("pointerdown", () => {
    lpFired = false;
    clearTimeout(lpId);
    lpId = setTimeout(() => {
      lpFired = true;
      haptic(30);
      prefs.favs[g.id] = !prefs.favs[g.id];
      savePrefs();
      pwaToast(prefs.favs[g.id] ? "⭐ 즐겨찾기 등록!" : "즐겨찾기 해제");
      renderHome();
    }, 500);
  });
  const cancel = () => clearTimeout(lpId);
  el.addEventListener("pointerup", cancel);
  el.addEventListener("pointerleave", cancel);
  el.addEventListener("pointercancel", cancel);
  el.addEventListener("click", () => { if (lpFired){ lpFired = false; return; } launchGame(g); });
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}

function relTime(ts){
  const d = Math.floor((Date.now() - ts) / 86400000);
  return d <= 0 ? "오늘" : d === 1 ? "어제" : d + "일 전";
}
function gameCardHtml(g){
  const star = prefs.favs[g.id] ? ' <span class="st">⭐</span>' : "";
  const ppl = g.p[0] === g.p[1] ? g.p[0] + "인" : g.p[0] + "-" + g.p[1] + "인";
  return '<px-sprite name="' + g.spr + '" scale="3"></px-sprite>' +
    '<div class="info"><div class="nm">' + g.name + (g.go ? star : ' <span style="font-size:11px;color:var(--dim)">준비 중</span>') + '</div>' +
    '<div class="ds">' + g.desc + '</div></div>' +
    '<div class="meta"><i>👥 ' + ppl + '</i><i>⏱️ ' + g.t + '분</i></div>';
}

function renderHome(){
  /* 빈 상태 */
  $("home-empty").style.display = roster.length ? "none" : "";

  /* 인원 필터 칩 */
  const FILTERS = ["전체", "2인", "3-4인", "5인+"];
  const cur = prefs.filter || "전체";
  const fbox = $("home-filter");
  fbox.innerHTML = "";
  FILTERS.forEach((f) => {
    const b = document.createElement("button");
    b.textContent = f;
    b.classList.toggle("sel", f === cur);
    b.addEventListener("click", () => { haptic(10); prefs.filter = f; savePrefs(); renderHome(); });
    fbox.appendChild(b);
  });
  const pass = (g) => {
    const [mn, mx] = g.p;
    if (cur === "2인") return mn <= 2;
    if (cur === "3-4인") return mn <= 4 && mx >= 3;
    if (cur === "5인+") return mx >= 5;
    return true;
  };

  /* 최근 한 판 */
  const rec = prefs.recent && SN_GAME_BY_ID[prefs.recent.id];
  $("home-recent-sec").style.display = rec ? "" : "none";
  if (rec){
    const rc = $("home-recent");
    rc.innerHTML = '<px-sprite name="' + rec.spr + '" scale="3"></px-sprite>' +
      '<div class="info"><div class="nm">' + rec.name + '</div>' +
      '<div class="ds">' + relTime(prefs.recent.when) + " " + prefs.recent.n + '명이 했어 · 바로 이어서 →</div></div>';
    rc.onclick = () => launchGame(rec);
  }

  /* 즐겨찾기 가로 스크롤 */
  const favs = Object.keys(prefs.favs).filter((id) => prefs.favs[id] && SN_GAME_BY_ID[id]);
  $("home-favs-sec").style.display = favs.length ? "" : "none";
  const fr = $("home-favs");
  fr.innerHTML = "";
  favs.forEach((id) => {
    const g = SN_GAME_BY_ID[id];
    const b = document.createElement("button");
    b.className = "fav-card";
    b.innerHTML = '<px-sprite name="' + g.spr + '" scale="2"></px-sprite><span>' + g.name + '</span>';
    bindGameCard(b, g);
    fr.appendChild(b);
  });

  /* 카테고리 아코디언 */
  const box = $("home-cats");
  box.innerHTML = "";
  SN_CATS.forEach((cat) => {
    const games = cat.games.filter(pass);
    if (!games.length) return;
    const open = !!prefs.openCats[cat.id];
    const block = document.createElement("div");
    block.className = "cat-block";
    const head = document.createElement("button");
    head.className = "cat-head";
    head.innerHTML = '<px-sprite name="' + cat.spr + '" scale="2"></px-sprite>' +
      '<span class="nm">' + cat.emoji + " " + cat.name + '</span>' +
      '<span class="cnt">' + games.length + '개</span><span class="arw">' + (open ? "▲" : "▼") + '</span>';
    head.addEventListener("click", () => {
      haptic(10);
      prefs.openCats[cat.id] = !open;
      savePrefs();
      renderHome();
    });
    block.appendChild(head);
    if (open){
      const list = document.createElement("div");
      list.className = "cat-games";
      games.forEach((g) => {
        const b = document.createElement("button");
        b.className = "g-card" + (g.go ? "" : " soon");
        b.innerHTML = gameCardHtml(g);
        bindGameCard(b, g);
        list.appendChild(b);
      });
      block.appendChild(list);
    }
    box.appendChild(block);
  });
}

/* go() 래핑: 홈 복귀 시 항상 최신 상태로 재렌더 + 설정 첫 진입 코치 */
const goV1 = go;
go = function(name){
  goV1(name);
  if (name === "home") renderHome();
  if (name === "settings" && !roster.length) coachShow("roster");
};
renderHome();
if (prefs.onboarded) coachShow("fav"); /* 온보딩 직후가 아닌 재방문 첫 홈에서 */

/* --- kitchen-sink: 홈 로고 7연타 진입 + 데모 콘텐츠 --- */
(function kitchenInit(){
  let taps = 0, tapId = null;
  $("home-logo").addEventListener("click", () => {
    taps++;
    clearTimeout(tapId);
    tapId = setTimeout(() => { taps = 0; }, 1600);
    if (taps >= 7){
      taps = 0;
      pwaToast("🧪 kitchen-sink 오픈!");
      go("kitchen");
    } else if (taps >= 4){
      pwaToast((7 - taps) + "번 더 누르면 비밀 화면");
    }
  });

  /* 팔레트 스와치 */
  $("ks-pal").innerHTML = window.SN_SPRITES.PAL.map((h) =>
    '<div style="display:flex;flex-direction:column;gap:4px;align-items:center">' +
    '<div style="width:34px;height:34px;background:' + h + ';box-shadow:0 0 0 2px var(--px-black)"></div>' +
    '<div style="font-size:10px;color:var(--dim)">' + h + '</div></div>').join("");

  /* 마스코트 21종 (프로토타입 라벨) */
  const MASCOTS = [
    ["bor", "보르 (대표·대장정)"], ["bormoon", "보르+달 (로고)"], ["fox", "여우 (라이어)"],
    ["crow", "까마귀 (마피아)"], ["wolf", "늑대 (늑대인간)"], ["hawk", "매 (독수리 사냥꾼)"],
    ["hedgehog", "고슴도치 (과일 종!)"], ["mole", "두더지 (폭탄)"], ["rooster", "수탉 (버저)"],
    ["goat", "염소 (이마 퀴즈)"], ["squirrel", "다람쥐 (초성)"], ["rabbit", "토끼 (그림 릴레이)"],
    ["otter", "수달 (그림 퀴즈)"], ["turtle", "거북 (오목)"], ["badger", "오소리 (주사위 배팅)"],
    ["crane", "학 (숫자야구)"], ["camel", "낙타 (밸런스)"], ["owl2", "올빼미 쌍둥이 (텔레파시)"],
    ["marmot", "마멋 (룰렛)"], ["owlprof", "부엉이 박사 (상식퀴즈)"], ["tengri", "텡그리 (고비의 별)"]
  ];
  $("ks-mascots").innerHTML = MASCOTS.map(([k, label]) =>
    '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;background:#1A2138;padding:10px 4px">' +
    '<px-sprite name="' + k + '" scale="3"></px-sprite>' +
    '<div style="font-size:11px;color:#B9C1D6;text-align:center;line-height:1.4;word-break:keep-all">' + label + '</div></div>').join("");

  /* QA용 직행: index.html#kitchen */
  if (location.hash === "#kitchen") go("kitchen");

  /* 트리거 */
  $("ks-cd").addEventListener("click", () => snCountdown(() => pwaToast("시작!")));
  $("ks-vic").addEventListener("click", () => snVictory("bor"));
  $("ks-upd").addEventListener("click", () => pwaToast("🌙 새 버전 도착!", "새로고침", () => pwaToast("데모라서 진짜로는 안 껐어")));
  document.querySelectorAll(".ks-toast").forEach((b) => b.addEventListener("click", () => pwaToast("토스트는 2.4초 뒤에 사라져")));
})();

/* --- 공통 연출: 폰 전달 가림막 (비밀 전달 게임 공용) --- */
function snCoverMode(){ return prefs.passCover === undefined ? 3 : prefs.passCover; }
function snPassCover(name, onDone){
  const mode = snCoverMode();
  if (mode === 0 || mode === "0"){ onDone(); return; }
  const tap = (mode === "tap");
  const ov = document.createElement("div");
  ov.className = "pc-ov";
  ov.innerHTML =
    '<div class="pc-emoji">📱</div>' +
    '<div class="pc-label">폰 전달 타임</div>' +
    '<div class="pc-name">' + escHtml(name) + '</div>' +
    (tap ? '<div class="pc-num pc-tap">탭해서 열기</div>'
         : '<div class="pc-num">' + (+mode) + '</div>') +
    '<div class="pc-hint">' + (tap ? "받은 사람이 화면을 탭하면 열려요" : "가림막이 걷힐 때까지 폰을 넘겨주세요") + '</div>';
  document.body.appendChild(ov);
  onDone(); /* 다음 화면은 가림막 아래에서 미리 렌더 */
  haptic(10);
  if (tap){ ov.addEventListener("click", () => { ov.remove(); haptic(15); }, { once: true }); return; }
  let n = +mode;
  const num = ov.querySelector(".pc-num");
  const id = setInterval(() => {
    n--;
    if (n <= 0){ clearInterval(id); ov.remove(); haptic(15); }
    else { num.textContent = n; haptic(10); }
  }, 1000);
}

/* --- 공통 연출: 3-2-1 카운트다운 / 승리 컨페티 (전 게임 공용) --- */
function snCountdown(onDone){
  const ov = document.createElement("div");
  ov.className = "cd-ov";
  ov.innerHTML = '<div class="cd-box"><b>3</b></div>';
  document.body.appendChild(ov);
  const box = ov.querySelector(".cd-box"), num = ov.querySelector("b");
  const show = (v) => {
    num.textContent = v;
    box.classList.remove("pop");
    void box.offsetWidth;
    box.classList.add("pop");
    haptic(10);
  };
  show(3);
  let n = 3;
  const id = setInterval(() => {
    n--;
    if (n <= 0){ clearInterval(id); ov.remove(); if (onDone) onDone(); }
    else show(n);
  }, 900);
}
function snVictory(spr, title){
  haptic([30, 40, 30]);
  snSfx("win");
  const ov = document.createElement("div");
  ov.className = "victory-ov";
  let cf = "";
  const P = window.SN_SPRITES.PAL;
  for (let i = 0; i < 12; i++){
    cf += '<i class="cf" style="left:' + (6 + i * 7.5) + '%;background:' + P[[2, 3, 4, 5, 6][i % 5]] +
      ';animation-duration:' + (1.4 + (i % 4) * 0.4) + 's;animation-delay:' + (i * 0.12).toFixed(2) + 's"></i>';
  }
  ov.innerHTML = cf +
    '<div class="jump"><px-sprite name="' + (spr || "bor") + '" scale="6"></px-sprite></div>' +
    '<div class="vt">' + (title || "승리!") + '</div><div class="vs">탭해서 닫기</div>';
  ov.addEventListener("click", () => ov.remove());
  document.body.appendChild(ov);
}

/* ================================================================
   사운드: 오프라인 100% → 오디오 파일 0. Web Audio로 8비트 칩튠 합성.
   prefs.sound(기본 on)로 게이트 — 진동 haptic()과 같은 규칙.
   게임에서:  snSfx('correct')  ·  snBgm('fuse')/snBgmStop()
   팔레트가 곧 재미의 다양성 — 이벤트마다 다른 큐를 골라 쓴다.
   ================================================================ */
const snd = { ctx: null, master: null, bgmTimer: null, bgmName: null };
function snOn(){ return prefs.sound !== false; }        /* 미설정 = 켜짐 */
function snAudio(){                                     /* 첫 제스처 안에서 호출돼야 잠금 해제됨(자동재생 정책) */
  if (!snOn()) return null;
  if (!snd.ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { snd.ctx = new AC(); } catch (e) { return null; }
    snd.master = snd.ctx.createGain();
    snd.master.gain.value = 0.5;                        /* 여러 음 겹쳐도 안 터지게 헤드룸 */
    snd.master.connect(snd.ctx.destination);
  }
  if (snd.ctx.state === "suspended") snd.ctx.resume();
  return snd.ctx;
}
/* 한 음: 사각파 기본, 짧은 어택 + 지수 감쇠 → 도트 블립 */
function snTone(freq, dur, o){
  const ctx = snAudio(); if (!ctx) return;
  o = o || {};
  const t = ctx.currentTime + (o.delay || 0);
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = o.type || "square";
  osc.frequency.setValueAtTime(freq, t);
  if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slide), t + dur);
  const vol = o.vol != null ? o.vol : 0.3;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(snd.master);
  osc.start(t); osc.stop(t + dur + 0.03);
}
/* 노이즈 버스트: 타악/폭발/버저용 (감쇠 화이트노이즈, 옵션 로우패스) */
function snNoise(dur, o){
  const ctx = snAudio(); if (!ctx) return;
  o = o || {};
  const t = ctx.currentTime + (o.delay || 0);
  const n = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = o.vol != null ? o.vol : 0.3;
  if (o.lp){ const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; src.connect(f); f.connect(g); }
  else src.connect(g);
  g.connect(snd.master); src.start(t);
}
/* 이름 붙은 효과음 팔레트 — 이벤트별로 골라 쓰면 다양해진다 */
const SN_SFX = {
  tap:    () => snTone(660, 0.05, { vol: .10 }),
  select: () => { snTone(523, 0.06, { vol: .18 }); snTone(784, 0.09, { vol: .18, delay: .05 }); },
  back:   () => { snTone(494, 0.06, { vol: .15 }); snTone(330, 0.10, { vol: .15, delay: .05 }); },
  toggle: () => snTone(880, 0.07, { vol: .18, type: "triangle" }),
  correct:() => [523, 659, 784, 1047].forEach((f, i) => snTone(f, 0.12, { vol: .22, delay: i * .07 })),
  wrong:  () => { snTone(196, 0.28, { vol: .26, type: "sawtooth", slide: 104 }); snNoise(0.12, { vol: .08, lp: 700, delay: .02 }); },
  win:    () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => snTone(f, 0.14, { vol: .24, delay: i * .11 })),
  lose:   () => [440, 392, 330, 262].forEach((f, i) => snTone(f, 0.22, { vol: .22, delay: i * .14, type: "triangle" })),
  tick:   () => snTone(1200, 0.03, { vol: .13 }),
  boom:   () => { snNoise(0.55, { vol: .5, lp: 380 }); snTone(90, 0.42, { vol: .3, type: "sawtooth", slide: 42 }); },
  coin:   () => { snTone(988, 0.06, { vol: .22 }); snTone(1319, 0.14, { vol: .22, delay: .06 }); },
  pop:    () => snTone(1047, 0.06, { vol: .18, type: "triangle", slide: 1568 }),
  reveal: () => { snTone(392, 0.08, { vol: .18 }); snTone(587, 0.13, { vol: .18, delay: .07 }); },
  buzz:   () => snTone(150, 0.28, { vol: .28, type: "sawtooth" }),
  alarm:  () => { snTone(880, 0.11, { vol: .22 }); snTone(880, 0.11, { vol: .22, delay: .17 }); },
  spin:   () => snTone(500, 0.04, { vol: .10, slide: 1000 })
};
function snSfx(name){ if (snOn() && SN_SFX[name]) SN_SFX[name](); }
/* BGM: 짧은 칩튠 루프. seq 각 스텝 {m:멜로디, b:베이스} 또는 null(쉼).
   ponytail: setTimeout 나이브 스케줄러(살짝 드리프트) — 배경음엔 충분. 정밀 필요하면 lookahead로 교체. */
const SN_BGM = {
  fuse:  { bpm: 108, div: 2, seq: [ { b: 110 }, null, { b: 110 }, { m: 330 }, { b: 98 }, null, { b: 98 }, { m: 294 } ] },
  /* story: 성글고 낮은 앰비언트 — 스토리류(고비의 별·이야기꾼·게르탈출) 배경. 오래 들어도 안 질리게 부드럽게 */
  story: { bpm: 92, div: 1, mType: "sine", bType: "sine", mVol: .07, bVol: .08,
    seq: [ { b: 110 }, null, null, { m: 330 }, null, null, { b: 98 }, null, { m: 392 }, null, { b: 82 }, null ] }
};
function snBgm(name){
  snBgmStop();
  const pat = SN_BGM[name]; if (!pat || !snOn() || !snAudio()) return;
  const step = 60 / pat.bpm / (pat.div || 1);
  let i = 0;
  snd.bgmName = name;
  (function loop(){
    if (snd.bgmName !== name || !snOn()){ snBgmStop(); return; }
    const s = pat.seq[i % pat.seq.length];
    if (s){
      if (s.b) snTone(s.b, step * .9, { vol: pat.bVol != null ? pat.bVol : .09, type: pat.bType || "triangle" });
      if (s.m) snTone(s.m, step * .8, { vol: pat.mVol != null ? pat.mVol : .10, type: pat.mType || "square" });
    }
    i++;
    snd.bgmTimer = setTimeout(loop, step * 1000);
  })();
}
function snBgmStop(){ if (snd.bgmTimer){ clearTimeout(snd.bgmTimer); snd.bgmTimer = null; } snd.bgmName = null; }

/* 앱 전역 UI 사운드: 버튼/카드 탭에 블립 하나 — 게임 수정 0으로 전체 커버.
   네비게이션 탭은 BGM도 정리(떠나는 화면은 자기 reset을 못 도니 셸이 백스톱). */
document.addEventListener("pointerdown", (e) => {
  if (!snOn()) return;
  const el = e.target.closest && e.target.closest("button, [data-go], .card, .chip");
  if (!el) return;
  if (el.matches("[data-go='home'], .back")){ snBgmStop(); snSfx("back"); return; }
  if (el.classList.contains("tg")) return;          /* 토글은 설정 핸들러가 소리냄(중복 방지) */
  if (el.hasAttribute("data-go")) snBgmStop();
  snSfx("tap");
}, { passive: true });

/* --- 스플래시: 폰트 준비 + 최소 노출 후 해제, 최대 1.2s --- */
(function splashInit(){
  const t0 = Date.now();
  const MIN = 400, MAX = 1200;
  const ready = ("fonts" in document) ? document.fonts.ready : Promise.resolve();
  Promise.race([ready, new Promise((r) => setTimeout(r, MAX))]).then(() => {
    const wait = Math.max(0, MIN - (Date.now() - t0));
    setTimeout(() => {
      const sp = $("splash");
      sp.classList.add("hide");
      setTimeout(() => sp.remove(), 260);
      if (!prefs.onboarded) obShow();
    }, wait);
  });
})();

