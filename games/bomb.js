"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("bomb", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>💣 폭탄 돌리기</h2></div>
    <div id="bomb-setup">
      <p class="hint">제시어에 맞는 답을 외치고 <b>재빨리 옆 사람에게 폰 패스!</b> 폭탄은 설정한 시간 안에서 랜덤으로 터집니다. 터질 때 들고 있던 사람이 벌칙! 답을 못 하면 패스 금지 (버티기 불가)</p>
      <div class="field"><label>모드</label><div class="seg" id="bomb-modes">
        <button data-m="topic" class="sel">주제 토크</button><button data-m="cho">초성 단어</button><button data-m="word">끝말잇기</button>
      </div></div>
      <div class="field"><label>폭탄 시간</label><div class="seg" id="bomb-fuses">
        <button data-f="8-20">⚡ 짧게 8~20초</button><button data-f="15-45" class="sel">보통 15~45초</button><button data-f="30-60">🐢 길게 30~60초</button>
      </div></div>
      <button class="btn" id="bomb-start">💣 점화 준비!</button>
    </div>
    <div id="bomb-play" style="display:none" class="stage-center">
      <span class="tag" id="bomb-mode-label">주제</span>
      <div class="who" id="bomb-prompt" style="font-size:34px">-</div>
      <div id="bomb-icon"><px-sprite name="bomb" scale="6"></px-sprite></div>
      <div id="bomb-fusebar"><i id="bomb-zone"></i><i id="bomb-fill"></i></div>
      <div id="bomb-sec">빨간 구간부터는 언제 터질지 모름!</div>
      <p class="hint" id="bomb-playhint" style="margin:0">제시어 확인했으면 심지에 불붙여!</p>
      <button class="btn" id="bomb-go">🔥 심지에 불붙이기!</button>
      <button class="btn ghost" id="bomb-newprompt">🔁 제시어가 이상해요 (교체)</button>
    </div>
    <div id="bomb-flash"></div>
    <div id="bomb-boom" style="display:none" class="stage-center">
      <div style="display:flex;justify-content:center"><px-sprite name="boom" scale="7"></px-sprite></div>
      <div class="who" style="font-size:38px">펑!!!</div>
      <div class="reveal-card"><div class="lbl">지금 폰 들고 있는 사람 벌칙</div><div class="val" id="bomb-penalty" style="font-size:20px">-</div></div>
      <button class="btn" id="bomb-again">한 판 더!</button>
    </div>
  `);
snAddCss(`/* ===== 폭탄 돌리기 ===== */
#bomb-flash{position:fixed;inset:0;background:var(--danger);opacity:0;pointer-events:none;z-index:40}
#bomb-fusebar{position:relative;width:100%;max-width:300px;margin:0 auto;height:16px;background:var(--night2);border:2px solid var(--line);border-radius:9px;overflow:hidden}
#bomb-zone{position:absolute;top:0;bottom:0;right:0;left:60%;background:var(--danger);opacity:.28}
#bomb-fill{position:relative;display:block;height:100%;width:0;background:var(--fire)}
#bomb-sec{font-size:13px;font-weight:800;color:var(--dim)}
.bomb-shake{animation:bombShake .3s linear infinite}`);
/* ================= 폭탄 돌리기 ================= */
const BOMB_TOPICS = ["치킨 브랜드","라면 종류","김씨 성 연예인","아이돌 그룹","한국 도시","과일 이름","영화 제목","네발 동물","편의점에서 파는 것","몽골에서 볼 수 있는 것","빨간색인 것","차가운 것","부엌에 있는 물건","세 글자 음식","나라 이름","스포츠 종목","직업 이름","꽃 이름","술 이름","전자제품","학교 과목","바다 생물","겨울에 하는 것","캠핑 준비물","여행 필수템","노래 제목","드라마 제목","탈 것","신체 부위","조미료/양념","반찬 종류","길거리 음식","커피/음료 메뉴","게임 이름","전래동화 등장인물","색깔 이름","동그란 것","냄새나는 것","하늘에 있는 것","학용품"];
const BOMB_CHO = ["ㄱㅅ","ㅅㄹ","ㅁㅈ","ㅂㅅ","ㄷㅂ","ㅎㄱ","ㅈㄱ","ㅇㅅ","ㄱㅂ","ㅅㅈ","ㅊㄱ","ㅋㅍ","ㅌㅈ","ㅎㅅ","ㄴㅁ","ㅇㅈ","ㄱㄹ","ㅁㅅ","ㅂㄹ","ㅅㄱ","ㅈㅁ","ㅇㄹ","ㄷㅈ","ㅅㅁ"];
const BOMB_WORDS = ["기차","사과","나무","라면","호수","바다","치킨","몽골","초원","여행","사진","노래","친구","기린","수박","가방","별자리","돼지","다리","구름"];
let bomb = { mode: "topic", fuseMin: 15, fuseMax: 45, tid: null, animId: null };
function bombFxOff(){
  clearTimeout(bomb.tid); clearInterval(bomb.animId);
  bomb.tid = null; bomb.animId = null;
  $("bomb-flash").style.opacity = 0;
  const icon = $("bomb-icon");
  icon.classList.remove("bomb-shake"); icon.style.transform = "";
  $("bomb-fill").style.width = "0"; $("bomb-fill").classList.remove("hot");
}
function bombReset(){
  bombFxOff();
  ["bomb-setup","bomb-play","bomb-boom"].forEach(id => $(id).style.display = "none");
  $("bomb-setup").style.display = "";
}
(function initBomb(){
  $("bomb-modes").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("bomb-modes").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    bomb.mode = b.dataset.m;
  }));
  $("bomb-fuses").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("bomb-fuses").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    const [a, z] = b.dataset.f.split("-");
    bomb.fuseMin = parseInt(a, 10); bomb.fuseMax = parseInt(z, 10);
  }));
})();
function bombPrompt(){
  if (bomb.mode === "topic"){
    $("bomb-mode-label").textContent = "이 주제로 하나씩!";
    $("bomb-prompt").textContent = BOMB_TOPICS[Math.floor(Math.random() * BOMB_TOPICS.length)];
  } else if (bomb.mode === "cho"){
    $("bomb-mode-label").textContent = "이 초성으로 단어!";
    $("bomb-prompt").textContent = BOMB_CHO[Math.floor(Math.random() * BOMB_CHO.length)];
  } else {
    $("bomb-mode-label").textContent = "끝말잇기 시작 단어";
    $("bomb-prompt").textContent = BOMB_WORDS[Math.floor(Math.random() * BOMB_WORDS.length)];
  }
}
$("bomb-start").addEventListener("click", () => {
  bombFxOff();
  ["bomb-setup","bomb-boom"].forEach(id => $(id).style.display = "none");
  $("bomb-play").style.display = "flex";
  bombPrompt();
  // 준비 상태: 제시어 보고 불붙이기 전까지 타이머 없음
  $("bomb-zone").style.left = (bomb.fuseMin / bomb.fuseMax * 100).toFixed(1) + "%";
  $("bomb-sec").textContent = "빨간 구간부터는 언제 터질지 모름!";
  const hint = $("bomb-playhint");
  hint.textContent = "제시어 확인했으면 심지에 불붙여!"; hint.style.color = "";
  $("bomb-go").style.display = "";
});
$("bomb-go").addEventListener("click", () => {
  $("bomb-go").style.display = "none";
  const hint = $("bomb-playhint");
  hint.textContent = "답하고 옆으로 패스! 패스! 패스!"; hint.style.color = "";
  const fuse = (bomb.fuseMin + Math.random() * (bomb.fuseMax - bomb.fuseMin)) * 1000;
  const t0 = Date.now();
  clearInterval(bomb.animId);
  bomb.animId = setInterval(() => {
    const el = Date.now() - t0;
    const prog = el / fuse;
    // 심지 게이지: 최대 시간 기준으로 차오름 (빨간 구간 진입 후엔 언제든 펑)
    const fill = $("bomb-fill");
    const barProg = Math.min(1, el / (bomb.fuseMax * 1000));
    fill.style.width = (barProg * 100).toFixed(1) + "%";
    fill.classList.toggle("hot", barProg >= bomb.fuseMin / bomb.fuseMax);
    $("bomb-sec").textContent = "⏱ " + Math.floor(el / 1000) + "초";
    const icon = $("bomb-icon");
    const speed = Math.max(0.12, 0.6 - prog * 0.5);
    const scale = 1 + Math.sin(Date.now() / (speed * 1000) * Math.PI) * 0.12 * (0.5 + prog);
    icon.style.transform = "scale(" + scale.toFixed(3) + ")";
    icon.classList.toggle("bomb-shake", prog > 0.55);
    $("bomb-flash").style.opacity = prog > 0.8 ? (0.05 + 0.1 * Math.abs(Math.sin(Date.now() / 140))).toFixed(3) : 0;
    if (prog > 0.85){ hint.textContent = "🔥 곧 터진다!!! 빨리 패스!!"; hint.style.color = "var(--danger)"; }
    if (prog > 0.75 && navigator.vibrate && Math.random() < 0.15) navigator.vibrate(60);
  }, 90);
  clearTimeout(bomb.tid);
  bomb.tid = setTimeout(() => {
    bombFxOff();
    if (navigator.vibrate) navigator.vibrate([300, 100, 500]);
    $("bomb-play").style.display = "none";
    $("bomb-boom").style.display = "flex";
    $("bomb-penalty").textContent = PENALTIES[Math.floor(Math.random() * PENALTIES.length)];
  }, fuse);
});
$("bomb-newprompt").addEventListener("click", bombPrompt);
$("bomb-again").addEventListener("click", () => $("bomb-start").click());
snRegisterGame("bomb", bombReset);
