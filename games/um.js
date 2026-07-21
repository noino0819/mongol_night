"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("um", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>📖 우리말 겨루기</h2></div>
    <div id="um-setup">
      <p class="hint">한 명씩 돌아가며 <b>2지선다 스피드 퀴즈</b>! 맞춤법·속담·우리말 뜻이 섞여 나와. 제한 시간 안에 <b>많이 맞힌 사람이 우승</b>. 문제는 사람마다 다르게 나오니까 커닝 못 해. 틀리면 정답 보여주니까 구경꾼도 같이 배우기~</p>
      <div class="field"><label>참여자 선택 (2명 이상)</label><div class="seg" id="um-players"></div></div>
      <div class="field"><label>문제 유형 (복수 선택)</label><div class="seg" id="um-types">
        <button data-t="spell" class="sel">맞춤법</button><button data-t="prov" class="sel">속담</button><button data-t="mean" class="sel">우리말 뜻</button>
      </div></div>
      <div class="field"><label>1인당 제한 시간</label><div class="seg" id="um-time">
        <button data-s="30">30초</button><button data-s="45" class="sel">45초</button><button data-s="60">60초</button>
      </div></div>
      <button class="btn" id="um-start">📖 겨루기 시작!</button>
    </div>
    <div id="um-pass" style="display:none" class="pass-stage">
      <div class="who-label">도전 차례</div>
      <div class="who" id="um-pass-name">-</div>
      <div class="hint" style="margin:0">버튼 누르는 순간 시간 시작이야. 심호흡 한 번 하고 시작하자</div>
      <button class="btn pass-next" id="um-go">준비 완료, 시작! →</button>
    </div>
    <div id="um-play" style="display:none">
      <div class="um-hud"><div class="who" id="um-play-name">-</div><div><span class="tag" id="um-clock">45</span> <span class="um-score" id="um-play-score">0점</span></div></div>
      <div class="um-timebar" id="um-timebar"><i id="um-timefill" style="width:100%"></i></div>
      <div class="um-qcard"><div class="tp" id="um-qtype">맞춤법</div><div class="qq" id="um-qtext">-</div></div>
      <div class="um-choices"><button id="um-c0">-</button><button id="um-c1">-</button></div>
      <div class="um-flash" id="um-flash"></div>
    </div>
    <div id="um-between" style="display:none" class="stage-center">
      <span class="tag">타임 업!</span>
      <div class="who" id="um-bt-name" style="color:var(--fire)">-</div>
      <div class="hint" id="um-bt-msg" style="margin:0">-</div>
      <button class="btn" id="um-next-player">다음 사람 →</button>
    </div>
    <div id="um-end" style="display:none" class="stage-center">
      <span class="tag">우리말 지킴이 발표</span>
      <div class="reveal-card" id="um-rank"></div>
      <button class="btn" id="um-again">다시 하기</button>
    </div>
  `);
/* ================= 우리말 겨루기 ================= */
/* 문항: [문제, 정답, 오답] — 전부 표준국어대사전 기준 검수 */
const UM_BANK = {
spell: [
["오늘 ___ 기분이 좋다","왠지","웬지"],["___ 일로 여기까지 왔어?","웬","왠"],["소문이 ___ 퍼졌다","금세","금새"],
["___ 동안 못 봤지?","며칠","몇일"],["와, 진짜 ___이다!","오랜만","오랫만"],["___ 기다려 왔다","오랫동안","오랜동안"],
["정말 ___가 없네","어이","어의"],["참 ___ 일이야","희한한","희안한"],["마음이 ___","설렌다","설레인다"],
["네가 잘되길 ___","바람","바램"],["이제 다 ___","됐다","됬다"],["그러면 안 ___","돼","되"],
["내일 ___","봬요","뵈요"],["___ 생각해 봤다","곰곰이","곰곰히"],["___ 따지지 마","일일이","일일히"],
["방을 ___ 치웠다","깨끗이","깨끗히"],["___ 말해서","솔직히","솔직이"],["감기 빨리 ___","나아라","낳아라"],
["나 이제 ___","어떡해","어떻해"],["___ 그렇게까지 해?","굳이","구지"],["얼큰한 ___ 한 그릇","육개장","육계장"],
["매콤한 ___","떡볶이","떡볶기"],["보글보글 김치___","찌개","찌게"],["___는 내가 할게","설거지","설겆이"],
["푹신한 ___","베개","베게"],["그건 내가 ___","할게","할께"],["나중에 ___","할 거야","할 꺼야"],
["노력한 만큼 ___를 받는다","대가","댓가"],["카메라 ___을 맞추다","초점","촛점"],["___를 세어 봐","개수","갯수"],
["시도한 ___","횟수","회수"],["닭을 ___ 구웠다","통째로","통채로"],["___ 넘어질 뻔했다","하마터면","하마트면"],
["___ 이번엔 안 돼","어쨌든","어쨋든"],["___ 참아 봐","웬만하면","왠만하면"],["___을 찌푸리다","눈살","눈쌀"],
["그게 그거지, ___","도긴개긴","도찐개찐"],["갑자기 ___했다","폭발","폭팔"],["부모님의 ___을 받았다","승낙","승락"],
["짜장면 ___","곱빼기","곱배기"],["된장찌개는 ___에 끓여야지","뚝배기","뚝빼기"],["___에서 떨어질 뻔","낭떠러지","낭떨어지"],
["___ 넘어가지 마","어물쩍","어물쩡"],["남의 글 ___하지 마","짜깁기","짜집기"],["꺼억, ___ 실례","트림","트름"],
["맡은 ___을 다하자","역할","역활"],["발을 동동, ___","안절부절못했다","안절부절했다"],["걔 다음 달에 결혼___ (들은 말)","한대","한데"],
["___ 말든 네 맘대로 해","먹든","먹던"],["어제 ___ 피자 마저 먹자","먹던","먹든"],["선생___ 한마디 할게","으로서","으로써"],
["카드로 ___했다","결제","결재"],["___ 대고 반말이야?","얻다","어따"],["___ 전해 오는 이야기","예부터","옛부터"],
["___ 않고 대답했다","서슴지","서슴치"],["농담은 좀 ___","삼가자","삼가하자"],["슬퍼서 목이 ___","메었다","매었다"],
["어깨에 가방을 ___","메다","매다"],["신발 끈을 ___","매다","메다"],["대화에 ___지 마","끼어들","끼여들"],
["시험을 무사히 ___","치렀다","치뤘다"],["문을 꼭 ___","잠갔다","잠궜다"],["김치를 ___","담갔다","담궜다"],
["오는 길에 편의점에 ___","들렀다","들렸다"],["늘 행복하길 ___","바라요","바래요"],["자다 깼더니 머리가 ___","부스스하다","부시시하다"],
["마음을 ___","추스르다","추스리다"],["왜 이렇게 ___","닦달해","닥달해"],["그건 ___일 뿐이야","핑계","핑게"],
["난 그 분야엔 ___이야","문외한","무뇌한"],["몰래 ___했다","야반도주","야밤도주"],["개그맨의 ___","성대모사","성대묘사"],
["___의 위기","절체절명","절대절명"],["집안이 ___ 났다","풍비박산","풍지박산"],["___으로 상경했다","혈혈단신","홀홀단신"],
["기쁨도 슬픔도 함께, ___","동고동락","동거동락"],["___하게 움직였다","일사불란","일사분란"],["___을 가도 정신만 차리면 산다","삼수갑산","산수갑산"],
["사탕 한 ___","움큼","웅큼"],["나한테 ___ 씌우지 마","덤터기","덤테기"],["방바닥에 ___ 있다","널브러져","널부러져"],
["동생 ___하느라 바빠","뒤치다꺼리","뒤치닥거리"],["___가 멋진 아저씨","구레나룻","구렛나루"],["___ 소리에 잠이 깼다","우레","우뢰"],
["살짝 ___ 봤다","건드려","건들여"],["실타래가 ___ 있다","얽히고설켜","얽히고섥혀"],["왜 자꾸 ___하려 해","해코지","해꼬지"],
["___ 결론만 말해 봐","요컨대","요컨데"]
],
prov: [
["가는 날이 ___이다","장날","월급날"],["낮말은 새가 듣고 밤말은 ___가 듣는다","쥐","개"],["___도 나무에서 떨어진다","원숭이","다람쥐"],
["등잔 밑이 ___","어둡다","뜨겁다"],["소 잃고 ___ 고친다","외양간","울타리"],["믿는 ___에 발등 찍힌다","도끼","망치"],
["아니 땐 굴뚝에 ___ 날까","연기","냄새"],["구슬이 서 말이라도 ___ 보배","꿰어야","닦아야"],["벼는 익을수록 고개를 ___","숙인다","꼿꼿이 든다"],
["___ 도둑이 소도둑 된다","바늘","연필"],["호랑이도 제 말 하면 ___","온다","숨는다"],["개구리 ___ 적 생각 못 한다","올챙이","알"],
["우물 안 ___","개구리","붕어"],["티끌 모아 ___","태산","동산"],["___도 맞들면 낫다","백지장","이삿짐"],
["굼벵이도 ___ 재주가 있다","구르는","나는"],["지렁이도 밟으면 ___","꿈틀한다","소리친다"],["달면 삼키고 쓰면 ___","뱉는다","참는다"],
["사공이 많으면 배가 ___ 간다","산으로","거꾸로"],["서당 개 삼 년이면 ___을 읊는다","풍월","시조"],["고래 싸움에 ___ 등 터진다","새우","멸치"],
["꿩 대신 ___","닭","오리"],["___도 두들겨 보고 건너라","돌다리","징검다리"],["말 한마디에 ___ 빚 갚는다","천 냥","백 냥"],
["밑 빠진 ___에 물 붓기","독","솥"],["병 주고 ___ 준다","약","돈"],["언 발에 ___ 누기","오줌","눈물"],
["빈 수레가 ___","요란하다","가볍다"],["못 먹는 감 ___나 본다","찔러","던져"],["누워서 ___ 먹기","떡","죽"],
["___도 단김에 빼라","쇠뿔","사랑니"],["떡 줄 사람은 생각도 않는데 ___부터 마신다","김칫국","숭늉"],["___ 무서워 장 못 담글까","구더기","벌레"],
["가재는 ___ 편","게","새우"],["공든 ___이 무너지랴","탑","담"],["작은 고추가 더 ___","맵다","빨갛다"],
["___ 짚고 헤엄치기","땅","벽"],["똥 묻은 개가 ___ 묻은 개 나무란다","겨","흙"],["원님 덕에 ___ 분다","나발","풍악"],
["십 년이면 ___도 변한다","강산","사람"],["세 살 버릇 ___까지 간다","여든","환갑"],["___ 잡으려고 초가삼간 태운다","빈대","바퀴벌레"],
["마른하늘에 ___","날벼락","소나기"],["갈수록 ___","태산","첩첩산중"],["돌부리를 차면 ___만 아프다","발부리","돌부리"],
["남의 떡이 더 ___ 보인다","커","맛있어"],["개똥도 약에 쓰려면 ___","없다","비싸다"],["뛰는 놈 위에 ___ 놈 있다","나는","기는"],
["종로에서 뺨 맞고 ___에서 눈 흘긴다","한강","남산"],["___에도 볕 들 날 있다","쥐구멍","골방"]
],
mean: [
["'시나브로'의 뜻은?","모르는 새 조금씩","갑자기 한꺼번에"],["'미리내'는 뭘까?","은하수","무지개"],["'여우비'는 어떤 비?","해 떠 있는데 오는 비","한밤중에 오는 비"],
["'마수걸이'의 뜻은?","그날 첫 거래","마지막 떨이"],["'는개'는 뭘까?","아주 가늘게 내리는 비","새벽에 끼는 안개"],["'하늬바람'은 어느 쪽 바람?","서쪽","동쪽"],
["'마파람'은 어느 쪽 바람?","남쪽","북쪽"],["'개밥바라기'는 무엇?","저녁 하늘의 금성","새벽 하늘의 북극성"],["'윤슬'의 뜻은?","빛에 반짝이는 잔물결","풀잎에 맺힌 이슬"],
["'너나들이'는 어떤 사이?","서로 반말하는 허물없는 사이","어제 처음 만난 사이"],["'해거름'은 언제?","해 질 무렵","해 뜰 무렵"],["'달포'는 얼마 동안?","한 달 남짓","보름 정도"],
["'사나흘'은 며칠?","3~4일","4~5일"],["'그믐'은 언제?","음력 달의 끝 무렵","보름달 뜨는 날"],["'우수리'의 뜻은?","거스름돈","웃돈"],
["'몽니'의 뜻은?","심술","콧노래"],["'아람'은 무엇?","잘 익어 벌어진 밤·도토리","갓 태어난 망아지"],["'애면글면'은 어떤 모양?","몹시 애쓰는 모양","빈둥거리는 모양"],
["'곰살맞다'의 뜻은?","싹싹하고 다정하다","곰처럼 미련하다"],["'헛헛하다'의 뜻은?","허전하고 출출하다","자꾸 웃음이 난다"],["'나비잠'은 어떤 잠?","아기가 팔 벌리고 자는 잠","꽃밭에서 자는 낮잠"],
["'소담하다'의 뜻은?","넉넉하고 먹음직하다","소박하고 초라하다"],["이슬비보다 굵은 비는?","가랑비","는개"],["'삭풍'은 어떤 바람?","겨울 북풍","봄 산들바람"],
["'살갑다'의 뜻은?","상냥하고 다정하다","살짝 차갑다"],["'옹골차다'의 뜻은?","실속 있고 야무지다","속이 텅 비다"],["'우듬지'는 어디?","나무 꼭대기 줄기","나무뿌리 끝"],
["'함초롬하다'는?","촉촉이 젖어 차분하다","잔뜩 헝클어져 있다"],["'곁두리'는 무엇?","일하다 먹는 새참","자기 전 야식"],["'미쁘다'의 뜻은?","믿음직하다","미끄럽다"],
["'무서리'는?","가을 첫 서리","봄 늦서리"],["'동살'은?","동틀 때 비치는 햇살","저녁노을"],["'모꼬지'는?","여럿이 모이는 잔치·모임","혼자 떠나는 여행"],
["'벼리'의 뜻은?","일이나 글의 뼈대","벼 이삭"],["'하릴없이'의 뜻은?","어쩔 도리 없이","할 일 없이 심심하게"],["'십분 이해하다'의 '십분'은?","충분히","10분 동안"],
["'애오라지'의 뜻은?","겨우, 오로지","서럽게"],["'슬하'는 어디?","부모의 곁","이불 속"],["'귀잠'은?","아주 깊이 든 잠","살짝 든 선잠"],
["'도둑잠'은?","몰래 자는 잠","도둑이 자는 잠"],["'꽃샘추위'는 언제?","봄, 꽃 필 무렵","가을, 단풍 들 무렵"],["'댕기'는 무엇?","머리끝에 드리는 헝겊·리본","한복 저고리 고름"],
["'오지랖'의 원뜻은?","웃옷의 앞자락","동네 골목길"],["'감질나다'의 뜻은?","아쉬워서 애가 타다","몹시 만족스럽다"],["'객쩍다'의 뜻은?","쓸데없고 실없다","손님이 많다"],
["'을씨년스럽다'의 뜻은?","쓸쓸하고 스산하다","시끌벅적하다"],["'뜬금없다'의 '뜬금'은?","일정하지 않은 시세","하늘에 뜬 금"],["'바투'의 뜻은?","아주 가까이","아주 멀리"],
["'짐짓'의 뜻은?","일부러","진짜로"],["'가없다'의 뜻은?","끝이 없다","값어치가 없다"]
]
};
const UM_TYPE_LABEL = { spell: "맞춤법", prov: "속담", mean: "우리말 뜻" };
let um = { sel: [], types: ["spell","prov","mean"], limit: 45, p: [], turn: 0,
           queue: [], qi: 0, cur: null, end: 0, tid: null, qtid: null, phase: "setup" };

function umShow(id){
  ["um-setup","um-pass","um-play","um-between","um-end"].forEach(x => $(x).style.display = "none");
  $(id).style.display = (id === "um-setup" || id === "um-play") ? "" : "flex";
}
function umReset(){
  clearInterval(um.tid); um.tid = null;
  clearTimeout(um.qtid); um.qtid = null;
  um.phase = "setup";
  umShow("um-setup");
  const box = $("um-players");
  box.innerHTML = "";
  um.sel = roster.slice();
  roster.forEach(n => {
    const b = document.createElement("button");
    b.textContent = n;
    if (um.sel.includes(n)) b.classList.add("sel");
    b.addEventListener("click", () => {
      if (um.sel.includes(n)) um.sel = um.sel.filter(x => x !== n);
      else um.sel.push(n);
      b.classList.toggle("sel", um.sel.includes(n));
    });
    box.appendChild(b);
  });
}
$("um-types").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  const t = b.dataset.t;
  if (um.types.includes(t)){
    if (um.types.length === 1) return alert("최소 1개 유형은 있어야지");
    um.types = um.types.filter(x => x !== t);
  } else um.types.push(t);
  b.classList.toggle("sel", um.types.includes(t));
}));
$("um-time").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
  $("um-time").querySelectorAll("button").forEach(x => x.classList.remove("sel"));
  b.classList.add("sel");
  um.limit = +b.dataset.s;
}));
$("um-start").addEventListener("click", () => {
  if (um.sel.length < 2) return alert("2명 이상 선택!");
  let pool = [];
  um.types.forEach(t => { pool = pool.concat(UM_BANK[t].map(x => ({ t, q: x[0], a: x[1], w: x[2] }))); });
  um.queue = shuffle(pool);
  um.qi = 0;
  /* 로스터 순서가 아니라 랜덤 순서로 도전 (뒷사람이 유리하지 않게) */
  um.p = shuffle(um.sel).map(n => ({ name: n, score: 0 }));
  um.turn = 0;
  umPassStage();
});
function umPassStage(){
  um.phase = "pass";
  umShow("um-pass");
  $("um-pass-name").textContent = um.p[um.turn].name;
}
$("um-go").addEventListener("click", () => {
  if (um.phase !== "pass") return;
  um.phase = "play";
  umShow("um-play");
  const x = um.p[um.turn];
  $("um-play-name").textContent = x.name;
  $("um-play-score").textContent = "0점";
  $("um-clock").textContent = um.limit;
  $("um-timebar").classList.remove("hot");
  $("um-timefill").style.width = "100%";
  um.end = Date.now() + um.limit * 1000;
  um.tid = setInterval(umTick, 100);
  umNextQ();
});
function umTick(){
  const rem = um.end - Date.now();
  if (rem <= 0) return umTimeUp();
  $("um-clock").textContent = Math.ceil(rem / 1000);
  $("um-timefill").style.width = (rem / (um.limit * 1000) * 100) + "%";
  $("um-timebar").classList.toggle("hot", rem <= 10000);
}
function umNextQ(){
  if (um.phase !== "play") return;
  if (um.qi >= um.queue.length){ um.queue = shuffle(um.queue); um.qi = 0; } /* 다 쓰면 리셔플 */
  const src = um.queue[um.qi++];
  um.cur = { t: src.t, q: src.q, a: src.a, w: src.w, ci: Math.random() < 0.5 ? 1 : 0, done: false };
  $("um-qtype").textContent = UM_TYPE_LABEL[um.cur.t];
  $("um-qtext").textContent = um.cur.q;
  [0, 1].forEach(i => {
    const b = $("um-c" + i);
    b.textContent = i === um.cur.ci ? um.cur.a : um.cur.w;
    b.classList.remove("ok", "no");
  });
  const fl = $("um-flash");
  fl.textContent = "";
  fl.className = "um-flash";
}
function umPick(i){
  if (um.phase !== "play" || !um.cur || um.cur.done) return;
  um.cur.done = true;
  const hit = i === um.cur.ci;
  const fl = $("um-flash");
  $("um-c" + um.cur.ci).classList.add("ok");
  if (hit){
    um.p[um.turn].score++;
    $("um-play-score").textContent = um.p[um.turn].score + "점";
    fl.textContent = "정답! 😎";
    fl.className = "um-flash ok";
    haptic(15);
  } else {
    $("um-c" + i).classList.add("no");
    fl.textContent = "땡! 정답은 「" + um.cur.a + "」";
    fl.className = "um-flash no";
    haptic([30, 40, 30]);
  }
  um.qtid = setTimeout(umNextQ, hit ? 550 : 1100);
}
$("um-c0").addEventListener("click", () => umPick(0));
$("um-c1").addEventListener("click", () => umPick(1));
function umTimeUp(){
  clearInterval(um.tid); um.tid = null;
  clearTimeout(um.qtid); um.qtid = null;
  um.phase = "between";
  haptic([60, 40, 60]);
  umShow("um-between");
  const x = um.p[um.turn];
  const per15 = x.score / (um.limit / 15); /* 시간 옵션 달라도 공평한 코멘트 */
  const cmt = per15 >= 4 ? "우리말 박사 아니야?" : per15 >= 2.5 ? "오~ 좀 치는데?" : per15 >= 1.5 ? "무난무난, 중간은 간다" : "몽골 가기 전에 국어 공부부터 하자…";
  $("um-bt-name").textContent = x.name;
  $("um-bt-msg").textContent = x.score + "점! " + cmt;
  $("um-next-player").textContent = um.turn >= um.p.length - 1 ? "결과 보기 →" : "다음 사람 →";
}
$("um-next-player").addEventListener("click", () => {
  if (um.phase !== "between") return;
  if (um.turn >= um.p.length - 1) return umEnd();
  um.turn++;
  umPassStage();
});
function umEnd(){
  um.phase = "end";
  umShow("um-end");
  const rank = um.p.slice().sort((a, b) => b.score - a.score);
  const medals = ["🥇","🥈","🥉"];
  let mi = 0;
  const rows = rank.map((r, i) => {
    if (i > 0 && r.score < rank[i - 1].score) mi = i; /* 동점이면 메달 공유 */
    return (medals[mi] || "·") + " " + escHtml(r.name) + " — " + r.score + "점";
  });
  $("um-rank").innerHTML = '<div class="lbl">최종 스코어</div><div class="val" style="font-size:18px;line-height:2">' + rows.join("<br>") + "</div>";
}
$("um-again").addEventListener("click", umReset);
snRegisterGame("um", umReset);
