"use strict";
/* ================= 게르 탈출 (er) — 협동 방탈출 엔진 ================= */
/* 단서 읽고 → 암호 입력 → 검증 → 다음 자물쇠. 다 함께 한 화면 보며 푸는 코옵.
   힌트 3단계, 시간은 재되 죽지 않음(소프트 타이머). 목표시간+힌트로 별점.
   검증: node tools/er-check.mjs (아래 DATA/LOGIC 블록을 추출해 검사) */

/*ER_DATA_BEGIN*/
const ER_SC = {
  title: "게르 탈출 — 잠긴 밤",
  intro: "여행 셋째 밤. 눈을 뜨니 게르 문이 밖에서 잠겼다. 화로 불빛에 의지해 단서를 찾자. 자물쇠 다섯 개를 풀면 초원으로 나갈 수 있어. 다 같이 화면을 보고 머리를 모아 봐.",
  outro: "마지막 빗장이 툭— 풀린다. 문틈으로 새벽 초원의 찬 바람이 밀려든다. 탈출 성공!",
  target: 480, /* 목표 8분 (초). 넘어도 실패 아님 — 별점만 깎임 */
  locks: [
    {
      nm: "① 나무 자물쇠 (숫자 4자리)",
      q: "화로 옆 벽에 물건이 걸려 있다. 개수를 왼쪽부터 순서대로 눌러라.\n\n마두금 줄 = 2\n서까래 = 8\n화로의 돌 = 1\n걸린 등잔 = 4",
      ans: ["2814"],
      hints: [
        "개수를 그냥 왼쪽→오른쪽으로 이어 붙이면 돼.",
        "네 자리 숫자. 마두금(2)부터 시작.",
        "정답은 2로 시작해서 4로 끝나 — 2814."
      ]
    },
    {
      nm: "② 방향 자물쇠",
      q: "문 위 낡은 쪽지: '북을 첫 칸으로, 시계 방향으로 세어 셋째 칸이 열쇠 방향.'\n\n한 글자로 입력: 동 / 서 / 남 / 북",
      ans: ["남"],
      hints: [
        "시계 방향은 북 → 동 → 남 → 서 순서야.",
        "첫째가 북, 둘째가 동…",
        "셋째 칸은 해가 가장 높이 뜨는 쪽 — 남."
      ]
    },
    {
      nm: "③ 가죽 주머니 (수수께끼)",
      q: "주머니에 새겨진 글: '혹은 둘, 다리는 넷. 물 없이 사흘을 걷고, 사막의 배라 불린다. 나는?'",
      ans: ["낙타", "쌍봉낙타"],
      hints: [
        "사막에서 사람을 태우고 걷는 동물.",
        "등에 혹이 솟아 있어.",
        "두 글자, ㄴ으로 시작 — 낙타."
      ]
    },
    {
      nm: "④ 계산 자물쇠 (숫자)",
      q: "양피지의 셈: 게르 안에 양 6마리, 개 1마리, 목동 2명이 있다.\n네 발 짐승과 두 발 사람의 '발'을 전부 더하면?\n\n숫자로 입력.",
      ans: ["32"],
      hints: [
        "네 발 짐승은 양 6 + 개 1 = 7마리.",
        "7마리 × 4발 = 28, 사람 2명 × 2발 = 4.",
        "28 + 4 = 32."
      ]
    },
    {
      nm: "⑤ 마지막 빗장 (초성)",
      q: "문을 여는 마지막 암호. 게르 주인의 이름이자, 하늘 그 자체.\n\n초성: ㅌ ㄱ ㄹ\n세 글자로 풀어라.",
      ans: ["텡그리"],
      hints: [
        "이 게임 세계를 다스리는 신이야.",
        "몽골 하늘의 신 — 텡…",
        "텡그리."
      ]
    }
  ]
};
/*ER_DATA_END*/

/*ER_LOGIC_BEGIN*/
/* 정답 정규화: 공백 제거 + 소문자 + 가운뎃점/구두점 제거. 한글·숫자 그대로. */
function erNorm(s){
  return String(s).toLowerCase().replace(/[\s.,·]/g, "");
}
/* 입력이 허용 정답(문자열 또는 배열) 중 하나와 일치하나 */
function erMatch(input, ans){
  const list = Array.isArray(ans) ? ans : [ans];
  const n = erNorm(input);
  return n.length > 0 && list.some((a) => erNorm(a) === n);
}
/* 별점: 탈출 성공 1 + 목표시간 내 1 + 힌트 1개 이하 1 (최대 3) */
function erStars(elapsedSec, targetSec, hintsUsed){
  return 1 + (elapsedSec <= targetSec ? 1 : 0) + (hintsUsed <= 1 ? 1 : 0);
}
/*ER_LOGIC_END*/

const er = { idx: 0, hints: 0, fails: 0, hintStep: 0, startAt: 0, timers: [] };

function erClearTimers(){ er.timers.forEach((t) => clearInterval(t)); er.timers = []; }

function erStart(){
  er.idx = 0; er.hints = 0; er.fails = 0; er.hintStep = 0;
  er.startAt = Date.now();
  erClearTimers();
  $("er-setup").style.display = "none";
  $("er-done").style.display = "none";
  $("er-play").style.display = "";
  er.timers.push(setInterval(erTick, 1000));
  erRender();
  erTick();
}

function erElapsed(){ return Math.floor((Date.now() - er.startAt) / 1000); }

function erTick(){
  const el = $("er-timer");
  if (!el) return;
  const left = ER_SC.target - erElapsed();
  if (left >= 0){ el.textContent = "⏳ " + fmt(left); el.style.color = ""; }
  else { el.textContent = "⏳ +" + fmt(-left); el.style.color = "var(--px-red, #e05a4e)"; }
}

function erRender(){
  const lock = ER_SC.locks[er.idx];
  er.hintStep = 0;
  $("er-hud").innerHTML =
    '<span class="st">🔒 <b>' + (er.idx + 1) + "</b>/" + ER_SC.locks.length + "</span>" +
    '<span class="st" id="er-timer">⏳ --:--</span>' +
    '<span class="st">💡 <b id="er-hintn">' + er.hints + "</b></span>";
  $("er-lock-nm").textContent = lock.nm;
  $("er-clue").textContent = lock.q;
  const inp = $("er-input");
  inp.value = "";
  inp.placeholder = "암호 입력";
  $("er-hint-out").style.display = "none";
  $("er-hint-out").textContent = "";
  $("er-msg").textContent = "";
  inp.focus();
  erTick();
}

function erSubmit(){
  const lock = ER_SC.locks[er.idx];
  const inp = $("er-input");
  if (!erMatch(inp.value, lock.ans)){
    er.fails++;
    $("er-msg").textContent = "🔒 잠긴 채다. 다시 살펴봐.";
    haptic([40, 40, 40]);
    const box = $("er-clue").closest(".ta-box");
    if (box){ box.classList.remove("er-shake"); void box.offsetWidth; box.classList.add("er-shake"); }
    inp.select();
    return;
  }
  haptic(30);
  er.idx++;
  if (er.idx >= ER_SC.locks.length){ erWin(); return; }
  pwaToast("🔓 자물쇠 하나 풀림! 다음으로.");
  erRender();
}

function erHint(){
  const lock = ER_SC.locks[er.idx];
  if (er.hintStep >= lock.hints.length){
    $("er-hint-out").textContent = "💡 이 자물쇠 힌트는 여기까지야.";
    return;
  }
  er.hints++;
  $("er-hint-out").style.display = "";
  $("er-hint-out").textContent = "💡 " + lock.hints[er.hintStep];
  er.hintStep++;
  $("er-hintn").textContent = er.hints;
}

function erWin(){
  erClearTimers();
  const elapsed = erElapsed();
  const stars = erStars(elapsed, ER_SC.target, er.hints);
  $("er-play").style.display = "none";
  $("er-done").style.display = "";
  $("er-result").innerHTML =
    '<div style="font-size:34px;letter-spacing:4px">' + "⭐".repeat(stars) + "☆".repeat(3 - stars) + "</div>" +
    '<h3 style="margin:10px 0 6px">🎉 게르 탈출 성공!</h3>' +
    '<p class="hint" style="margin:0 0 12px">' + escHtml(ER_SC.outro) + "</p>" +
    '<div class="ta-hud" style="justify-content:center">' +
      '<span class="st">⏱️ 걸린 시간 <b>' + fmt(elapsed) + "</b></span>" +
      '<span class="st">🎯 목표 <b>' + fmt(ER_SC.target) + "</b></span>" +
      '<span class="st">💡 힌트 <b>' + er.hints + "</b></span>" +
      '<span class="st">🔁 시도 <b>' + er.fails + "</b></span>" +
    "</div>";
}

function erReset(){
  /* ponytail: 홈 나갔다 재진입 시 여기서 초기화 → 진행 중이던 판은 리셋됨(대부분 게임 동일). 세이브는 YAGNI. */
  erClearTimers();
  er.hintStep = 0;
  $("er-play").style.display = "none";
  $("er-done").style.display = "none";
  $("er-setup").style.display = "";
  $("er-intro").textContent = ER_SC.intro;
}

$("er-start").addEventListener("click", erStart);
$("er-again").addEventListener("click", erStart);
$("er-submit").addEventListener("click", erSubmit);
$("er-hint-btn").addEventListener("click", erHint);
$("er-input").addEventListener("keydown", (e) => { if (e.key === "Enter") erSubmit(); });
