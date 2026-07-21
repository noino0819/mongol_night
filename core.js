"use strict";
/* ================= 데이터 ================= */
const WORDS = {
  "몽골 스페셜": ["게르","마두금","수태차","허르헉","고비사막","유목민","독수리 사냥꾼","아이락","울란바토르","양떼","별똥별","낙타 트레킹","테를지","홉스골","승마","초원","샤가이 놀이","보르츠","칭기즈칸","오보"],
  "음식": ["김치찌개","삼겹살","떡볶이","마라탕","초밥","치킨","냉면","붕어빵","곱창","샤인머스캣","김밥","순대","팥빙수","감자탕","족발","탕후루","크로플","비빔밥","라면","제육볶음"],
  "장소": ["찜질방","노래방","편의점","공항","놀이공원","도서관","PC방","한강공원","스키장","캠핑장","미용실","경복궁","헬스장","영화관","동물원","전통시장","지하철역","응급실","루프탑 카페","독서실"],
  "동물": ["낙타","독수리","늑대","고슴도치","판다","펭귄","상어","다람쥐","부엉이","알파카","수달","미어캣","혹등고래","사막여우","캥거루","두더지","하이에나","순록","염소","오리너구리"],
  "직업": ["유튜버","소방관","아이돌","프로게이머","바리스타","승무원","수의사","웹툰작가","요리사","택배기사","헬스트레이너","개발자","초등교사","약사","사진작가","통역사","파일럿","성우","큐레이터","농부"],
  "여행 물건": ["보조배터리","셀카봉","침낭","손전등","물티슈","선크림","고데기","삼각대","무릎담요","핫팩","텀블러","무선이어폰","카드지갑","헤어롤","손톱깎이","3단 우산","슬리퍼","마스크팩","모기퇴치제","보온병"]
};
const CHO_BANK = {
  "음식": WORDS["음식"].concat(["부대찌개","닭갈비","물회","콩국수","약과"]),
  "동물": WORDS["동물"].concat(["카피바라","쿼카","살쾡이","도롱뇽","앵무새"]),
  "사자성어": ["유비무환","일석이조","과유불급","동상이몽","작심삼일","각양각색","대기만성","살신성인","어부지리","청출어람","고진감래","다다익선","마이동풍","배은망덕","설상가상","십시일반","오리무중","이심전심","자업자득","천고마비"],
  "몽골 여행": WORDS["몽골 스페셜"].concat(["몽골리안 바비큐","은하수","사륜구동","별자리","캠프파이어"])
};
const BALANCE = [
  ["평생 라면 금지","평생 치킨 금지"],
  ["몽골 게르에서 한 달 살기","무인도에서 일주일 버티기"],
  ["와이파이 없는 한 달","뜨거운 물 없는 한 달"],
  ["말 타고 출근하기","낙타 타고 출근하기"],
  ["과거로 딱 한 번 가기","미래로 딱 한 번 가기"],
  ["투명인간 능력","순간이동 능력"],
  ["평생 여름만","평생 겨울만"],
  ["번지점프 하기","스카이다이빙 하기"],
  ["아이락(말젖술) 원샷","번데기 한 봉지 완식"],
  ["여행 중 지갑 잃어버리기","여행 중 폰 잃어버리기"],
  ["매일 아침 6시 기상 확정","매일 새벽 2시까지 잠 못 들기"],
  ["평생 매운 음식 금지","평생 단 음식 금지"],
  ["유명하지만 사생활 없음","평범하지만 완전 자유"],
  ["10년 전 나에게 조언 한마디","10년 후 나에게 질문 한마디"],
  ["이번 여행 사진 전부 삭제","이번 여행 기억 절반 삭제"],
  ["히터 없는 게르에서 겨울나기","에어컨 없는 사막에서 여름나기"],
  ["친구들 앞에서 흑역사 영상 상영","모르는 100명 앞에서 즉석 발표"],
  ["평생 커피 금지","평생 탄산 금지"],
  ["순록 목장 사장님 되기","낙타 목장 사장님 되기"],
  ["몽골에서 은하수 보기","아이슬란드에서 오로라 보기"],
  ["노래 못 부르는 저주","춤 못 추는 저주"],
  ["오늘 하루 전원에게 존댓말","오늘 하루 전원에게 반말"],
  ["여행 내내 짐꾼 담당","여행 내내 총무 담당"],
  ["텐트에 벌레 3마리와 취침","텐트 없이 침낭만으로 취침"],
  ["샤워 3일에 한 번 (물 부족)","폰 배터리 하루 20%만"],
  ["일주일 내내 허르헉만 먹기","일주일 내내 수태차만 마시기"],
  ["별똥별 소원 100% 실현 (사소한 것만)","로또 5등 평생 자동 당첨"],
  ["운전 담당 (비포장 8시간)","DJ+분위기 담당 (8시간 노동)"],
  ["한겨울 몽골 여행","한여름 사막 여행"],
  ["말에서 떨어질 뻔한 썰 보유","낙타에게 침 맞은 썰 보유"]
];
let PENALTIES = ["수태차/물 원샷","성대모사 1개 (통과할 때까지)","다음 식사 설거지 담당","내일 아침 모닝콜 담당","즉석 댄스 15초","일행 칭찬 릴레이 (전원 1명씩)","셀카 제일 못 나온 사진 공개","10초 안에 개그 치기","오늘 밤 별 사진 찍기 담당","다음 이동 때 짐 나르기","애교 3종 세트","1분간 존댓말 금지 대상 되기"];
const PENALTY_DEFAULTS = PENALTIES.slice();     // 룰렛·폭탄 공용 벌칙 풀 — 기본값 복원용
const PENALTY_KEY = "sn_penalties_v1";          // 사용자 커스텀 목록 저장 키
try { const s = JSON.parse(localStorage.getItem(PENALTY_KEY) || "null"); if (Array.isArray(s) && s.length) PENALTIES = s; } catch (e) { /* 무시 */ }
const CHO_TABLE = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

/* ================= 유틸 ================= */
const $ = (id) => document.getElementById(id);
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const toCho = (str) => [...str].map(ch => { const c = ch.charCodeAt(0) - 0xAC00; return (c >= 0 && c <= 11171) ? CHO_TABLE[Math.floor(c / 588)] : ch; }).join("");
function fmt(sec){ return Math.floor(sec/60) + ":" + String(sec%60).padStart(2,"0"); }

/* 꾹 눌러 보기: 누르는 동안만 보임 */
function holdReveal(el, onShow, onHide){
  let held = false;
  el.style.touchAction = "none";
  const down = (e) => { e.preventDefault(); if (el.setPointerCapture) try { el.setPointerCapture(e.pointerId); } catch(_){} held = true; onShow(); };
  const up = () => { if (held) { held = false; onHide(); } };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("pointerleave", up);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}

/* ================= 별하늘 ================= */
(function stars(){
  const sky = $("sky");
  for (let i = 0; i < 24; i++){
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() < .3 ? 4 : 2; /* 사각 픽셀 별 (프로토타입 스펙) */
    s.style.cssText = "width:" + size + "px;height:" + size + "px;left:" + Math.round(Math.random()*96) + "%;top:" + Math.round(Math.random()*94) + "%;animation-delay:" + (Math.random()*3).toFixed(1) + "s;animation-duration:" + (2+Math.random()*3).toFixed(1) + "s";
    sky.appendChild(s);
  }
})();

/* ================= 화면 전환 ================= */
function go(name){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("on"));
  $("scr-" + name).classList.add("on");
  window.scrollTo(0, 0);
  if (typeof mpSyncBack === "function") mpSyncBack(); /* 연결 상태에 맞춰 뒤로가기 라벨 정리 (net.js) */
}
/* 문서 위임: snAddScreen으로 나중에 주입된 화면의 [data-go] 버튼도 작동 */
document.addEventListener("click", (e) => {
  const b = e.target.closest ? e.target.closest("[data-go]") : null;
  if (!b) return;
  {
    const target = b.dataset.go;
    const connected = typeof mpLive === "function" && mpLive();
    /* 게스트는 방에 묶임 — 게임 선택·이동은 호스트가 mpNav로 끌고 감.
       게스트에겐 홈이 없으므로 뒤로가기(mpSyncBack이 '나가기'로 라벨 교체) = 방 나가기 확인 모달 */
    if (connected && typeof mpAmHost === "function" && !mpAmHost() && target !== "mp"){
      if (target === "home"){
        snConfirm("🚪", "방에서 나갈까?", "다시 들어오려면 호스트의 초대 QR이 필요해", "나가기", () => { mpReset(); go("home"); });
      } else {
        mp.game = null;
        resetGame("mp"); go("mp");
      }
      return;
    }
    if (target !== "home"){
      const need = { liar: 3, mafia: 4, choseong: 0, balance: 0, roulette: 2, fruit: 2, omok: 0, forehead: 0, life: 2, drawrelay: 3, catchmind: 3, wolf: 4, bomb: 3, tele: 3, ta: 2 }[target] || 0;
      if (roster.length < need && !connected){ /* 여러 폰 연결 중이면 등록 일행 대신 연결된 폰이 참가자 → 게이트 통과 */
        alert("이 게임은 " + need + "명 이상 필요해요!\n설정(⚙️)에서 일행을 등록하거나, 📡 폰 연결로 붙여주세요 🙌");
        return;
      }
    }
    if (target === "home" && typeof mpAmHost === "function" && mpAmHost() && connected){ mp.game = null; mpNav("home"); } /* 호스트가 나가면 게스트도 연결방으로 */
    resetGame(target);
    go(target);
  }
});
function resetGame(name){
  if (name === "liar") liarReset();
  if (name === "mafia") mafiaReset();
  if (name === "choseong"){ $("cho-setup").style.display = ""; $("cho-play").style.display = "none"; }
  if (name === "balance"){ balNext(); }
  if (name === "roulette"){ $("rou-name").textContent = "···"; $("rou-name").className = "roulette-name"; $("rou-penalty").textContent = ""; $("rou-tag").textContent = "오늘의 주인공은?"; }
  if (name === "fruit"){ fruitReset(); }
  if (name === "omok"){ omokNew(); }
  if (name === "forehead"){ fhReset(); }
  if (name === "life"){ lifeReset(); }
  if (name === "drawrelay"){ drReset(); }
  if (name === "catchmind"){ cmReset(); }
  if (name === "wolf"){ wfReset(); }
  if (name === "bomb"){ bombReset(); }
  if (name === "tele"){ teReset(); }
  if (name === "lv"){ lvReset(); }
  if (name === "vg"){ vgReset(); }
  if (name === "bz"){ bzReset(); }
  if (name === "um"){ umReset(); }
  if (name === "gq"){ gqReset(); }
  if (name === "ta"){ taReset(); }
  if (name === "nb"){ nbReset(); }
  if (name === "gm"){ gmReset(); }
  if (name === "cf"){ cfReset(); }
  if (name === "mp"){ mpEnter(); } /* 연결 유지 중이면 방 화면 복귀, 아니면 초기화 */
  if (SN_RESETS[name]) SN_RESETS[name]();   /* 신규 게임: snRegisterGame 레지스트리 (위 스위치 수정 불필요) */
}

/* ---- 게임 자체 등록 인프라: 새 게임은 index.html 무수정 (games/*.js에서 화면·CSS·리셋 등록) ---- */
const SN_RESETS = {};
function snRegisterGame(name, reset){ SN_RESETS[name] = reset; }
function snAddCss(css){ const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); }
function snAddScreen(name, html){
  const d = document.createElement("div");
  d.className = "screen";
  d.id = "scr-" + name;
  d.innerHTML = html;
  $("scr-home").parentElement.appendChild(d);
}

/* ================= 일행 등록 ================= */
let roster = [];
function renderChips(){
  const box = $("chips");
  box.innerHTML = "";
  if (!roster.length){ box.innerHTML = '<div class="empty">아직 아무도 없어요. 이름을 추가해주세요!</div>'; return; }
  roster.forEach((n, i) => {
    const c = document.createElement("div");
    c.className = "chip";
    c.innerHTML = n + " <b>✕</b>";
    c.addEventListener("click", () => { roster.splice(i, 1); renderChips(); saveRoster(); });
    box.appendChild(c);
  });
}
function addName(){
  const inp = $("name-input");
  const v = inp.value.trim();
  if (!v) return;
  if (roster.includes(v)){ alert("같은 이름이 이미 있어요!"); return; }
  if (roster.length >= 12){ alert("최대 12명까지 가능해요"); return; }
  roster.push(v); inp.value = ""; renderChips(); saveRoster(); inp.focus();
}
$("add-name").addEventListener("click", addName);
$("name-input").addEventListener("keydown", (e) => { if (e.key === "Enter") addName(); });
renderChips();

/* ================= 비밀 전달 공통 ================= */
/* order: 이름배열, secretFn(i)->{main,sub,liar?}, onDone */
function runPassPhase(container, order, secretFn, onDone){
  let idx = 0;
  function render(){
    const name = order[idx];
    const sec = secretFn(idx);
    container.innerHTML =
      '<div class="who-label">지금 볼 사람</div>' +
      '<div class="who">' + name + ' <small>(' + (idx+1) + '/' + order.length + ')</small></div>' +
      '<div class="hint" style="margin:0">다른 사람은 화면을 보지 마세요!</div>' +
      '<button class="hold-btn" id="hb"><div class="sub">🤫</div><div class="big">꾹 누르면<br>보여요</div><div class="sub">손을 떼면 사라집니다</div></button>' +
      '<button class="btn pass-next" id="pn" disabled>확인했어요, 다음 사람에게 →</button>';
    const hb = $("hb"), pn = $("pn");
    let seen = false;
    holdReveal(hb,
      () => {
        seen = true;
        hb.classList.add("revealed");
        if (sec.liar) hb.classList.add("liar");
        hb.innerHTML = '<div class="sub">' + (sec.label || "") + '</div><div class="big">' + sec.main + '</div>' + (sec.sub ? '<div class="sub">' + sec.sub + '</div>' : "");
        pn.disabled = false;
      },
      () => {
        hb.classList.remove("revealed", "liar");
        hb.innerHTML = '<div class="sub">🤫</div><div class="big">꾹 누르면<br>보여요</div><div class="sub">손을 떼면 사라집니다</div>';
      }
    );
    pn.addEventListener("click", () => {
      if (!seen) return;
      idx++;
      if (idx < order.length) snPassCover(order[idx], render); else onDone();
    });
  }
  render();
}

