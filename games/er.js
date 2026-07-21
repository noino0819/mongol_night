"use strict";
/* ================= 게르 탈출 (er) 2.0 — 협동 방탈출 엔진 =================
   포인트앤클릭식: 오브젝트를 조사(examine)해 단서·아이템 획득 → 자물쇠(코드/아이템) 해제 → 조합 → 다음 막.
   ❤️하트 + ⏳타이머(모드 선택: 소프트/하드코어), 막 사이 체크포인트(하드코어 실패 시 이어하기).
   설계원칙: 한 퍼즐 한 정답·자가검증·단서↔퍼즐 연결·아하는 상식·레드헤링 0·3단 힌트·쉬움→어려움.
   검증: node tools/er-check.mjs (아래 DATA/LOGIC 블록 추출해 무결성·단위 테스트) */

/*ER_DATA_BEGIN*/
/* 오브젝트: { id, nm, spr, txt(조사문), need?(플래그 게이트), lockedTxt?, sets?(조사 시 플래그),
   give?(조사 시 아이템 — lock 없을 때만), lock?{ ans[](코드) | item(아이템요구), digits?, hints?[3], open, give?, sets? },
   final?(막의 마지막 문) }
   아이템은 act.items 맵에 선언. combos: 인벤토리 아이템 조합 → 새 아이템. */
const ER_SCENARIOS = [];
ER_SCENARIOS.push({
  id: "ger", title: "게르 탈출", emoji: "🔒", tagline: "한밤의 게르, 어둠 속 다섯 자물쇠",
  outro: "모래폭풍을 등지고 초원으로 사라졌다. 다음 밤, 또 어딘가에 갇히겠지.",
  acts: [
    {
      id: "ger",
      name: "제1막 · 잠긴 게르",
      intro: "여행 셋째 밤. 눈을 뜨니 게르 문이 밖에서 잠겼다. 화로의 불씨만 희미하다. 단서를 뒤져 자물쇠를 풀고 문을 열자. 무엇이든 먼저 눌러서 '조사'해 봐.",
      time: 900,   /* 하드코어 제한시간(초) — 15분 */
      hearts: 5,
      items: { keyA: "🗝️ 열쇠조각 ㄱ", keyB: "🗝️ 열쇠조각 ㄴ", keyBody: "🗝️ 열쇠 몸통", master: "🔑 완성된 열쇠" },
      combos: [
        { need: ["keyA", "keyB", "keyBody"], gives: "master", text: "세 조각이 딸깍— 열쇠 하나로 맞물렸다!" }
      ],
      objects: [
        { id: "letter", nm: "낡은 편지", spr: "letter",
          txt: "화로 옆 쪽지: '재는 거짓말을 안 해. 허나 어둠 속에선 아무것도 못 보지 — 먼저 빛부터 밝혀라. 그리고 마두금은 몇 줄이더냐.'" },
        { id: "lamp", nm: "등잔 셋", spr: "lamp",
          txt: "등잔 셋에 불을 붙였다. 게르 안이 환해진다 — 이제 구석구석 보인다.",
          sets: "lit" },
        { id: "fire", nm: "화로", spr: "fire",
          need: "lit", lockedTxt: "재를 헤쳐도 너무 어두워 아무것도 안 보인다. 빛부터 밝혀야겠다.",
          txt: "재 속에 표식 새긴 돌 넷이 드러난다: 2 · 8 · 1 · 4. 화로 밑엔 작은 자물쇠.",
          lock: { ans: ["2814"], digits: 4,
            hints: ["재에 드러난 돌의 숫자를 왼쪽부터 그대로.", "네 자리. 2로 시작해.", "2814."],
            open: "화로 밑 칸이 열렸다. 열쇠조각 ㄱ과 메모: '별을 짜 넣은 바닥, 하늘과 맞춰라.'",
            give: "keyA" } },
        { id: "morin", nm: "마두금", spr: "morin",
          txt: "말머리 장식 마두금. 줄 2개, 조임쇠 2개, 울림통 옆 매듭 3개가 묶여 있다. 몸통에 세 자리 자물쇠.",
          lock: { ans: ["223"], digits: 3,
            hints: ["편지가 시켰지 — 줄·조임쇠·매듭을 차례로 세어라.", "줄 2, 조임쇠 2, 매듭 3.", "223."],
            open: "울림통이 열리며 열쇠조각 ㄴ이 굴러 나왔다.",
            give: "keyB" } },
        { id: "rug", nm: "양탄자", spr: "rug",
          need: "lit", lockedTxt: "바닥 양탄자가 어둠에 묻혀 무늬가 안 보인다.",
          txt: "불빛에 양탄자 무늬가 드러난다 — 별 일곱이 국자 모양(북두칠성)으로 짜여 있다. 손잡이 끝 세 별이 유독 밝다. 천창으로 진짜 하늘과 맞춰 보라." },
        { id: "toono", nm: "천창(토노)", spr: "toono",
          txt: "천창 너머 밤하늘. 양탄자의 국자를 하늘에서 찾으니, 손잡이 끝 세 별의 밝기 순서가 보인다 — 셋째가 가장 밝고, 다음이 첫째, 그다음 둘째. 궤짝은 이 순서를 원한다." },
        { id: "chest", nm: "궤짝", spr: "chest",
          txt: "구석의 나무 궤짝. 세 자리 다이얼 자물쇠가 걸려 있다.",
          lock: { ans: ["312"], digits: 3,
            hints: ["천창에서 본 세 별의 순서야.", "셋째·첫째·둘째 → 3, 1, 2.", "312."],
            open: "궤짝이 열렸다. 열쇠 몸통이 들어 있다. 이제 조각들을 맞출 차례.",
            give: "keyBody" } },
        { id: "door", nm: "게르 문", spr: "door", final: true,
          txt: "밖으로 나가는 문. 열쇠 구멍이 하나.",
          lock: { item: "master", open: "완성된 열쇠를 꽂자 빗장이 풀린다. 문틈으로 찬 바람이 밀려든다 — 밖으로!" } }
      ]
    },
    {
      id: "storm",
      name: "제2막 · 모래폭풍 전야",
      intro: "문을 열고 나왔지만 캠프는 텅 비었고, 지평선에서 모래벽이 밀려온다. 말을 타고 초원을 벗어나야 해 — 폭풍이 닿기 전에. 서두르자.",
      time: 720,   /* 하드코어 12분 */
      hearts: 5,
      items: { bridle: "🪢 굴레", saddle: "🐴 안장", flare: "🎆 신호탄", ready: "🐎 말 (탈 준비 끝)" },
      combos: [
        { need: ["bridle", "saddle"], gives: "ready", text: "낙타… 아니 말에게 굴레와 안장을 채웠다. 탈 준비 끝!" }
      ],
      objects: [
        { id: "well", nm: "우물", spr: "well",
          txt: "마른 우물. 안쪽 벽 눈금에 페인트로 크게 4 · 2 · 5. 마구간 자물쇠가 이 숫자를 원할 것 같다." },
        { id: "stable", nm: "마구간 궤", spr: "stable",
          txt: "마구간 문에 걸린 세 자리 자물쇠. 안에서 가죽 냄새가 난다.",
          lock: { ans: ["425"], digits: 3,
            hints: ["우물 벽에 적힌 세 숫자야.", "4, 2, 5.", "425."],
            open: "마구간이 열렸다. 말에 채울 굴레를 얻었다. 안장은… 저 낙타가 깔고 앉아 있네.",
            give: "bridle" } },
        { id: "ovoo", nm: "오보(돌무더기)", spr: "ovoo",
          txt: "성황당 같은 돌무더기 오보. 흰 돌 넷, 그 위에 검은 돌 셋이 얹혀 있다. 신호탄 상자가 '흰 다음 검은' 순서를 물었지." },
        { id: "sky", nm: "밤하늘", spr: "bigdipper",
          txt: "폭풍 오기 직전의 맑은 하늘. 북두칠성 일곱 별이 또렷하다. 마지막 한 자리는 저 별의 수라고 신호탄 상자에 적혀 있었다." },
        { id: "flarebox", nm: "신호탄 상자", spr: "flarebox",
          txt: "낡은 신호탄 상자. 세 자리 자물쇠 — '흰 돌, 검은 돌, 별의 수' 순.",
          lock: { ans: ["437"], digits: 3,
            hints: ["흰 돌 4, 검은 돌 3, 북두칠성 별 7.", "4, 3, 7 순서로.", "437."],
            open: "신호탄을 얻었다. 하늘로 쏘면 저 낙타가 놀라 일어날지도.",
            give: "flare" } },
        { id: "camel", nm: "누운 낙타", spr: "camel",
          txt: "안장을 깔고 앉아 꿈쩍 않는 낙타. 뭔가로 놀래켜야 일어나겠다.",
          lock: { item: "flare", open: "신호탄을 쏘자 낙타가 벌떡! 깔고 있던 안장이 툭 떨어졌다.",
            give: "saddle" } },
        { id: "gate", nm: "초원 끝", spr: "horse", final: true,
          txt: "캠프를 벗어나는 길. 준비된 말만 있으면 달릴 수 있다.",
          lock: { item: "ready", open: "말에 올라 초원을 가른다. 등 뒤로 모래벽이 무너져 내린다 — 탈출 성공!" } }
      ]
    }
  ]
});
/*ER_DATA_END*/

/*ER_LOGIC_BEGIN*/
/* 정답 정규화: 공백·구두점 제거 + 소문자. 한글·숫자 그대로. */
function erNorm(s){ return String(s).toLowerCase().replace(/[\s.,·\-]/g, ""); }
/* 코드 입력이 허용 정답(배열) 중 하나와 일치? */
function erMatch(input, ans){
  const n = erNorm(input);
  return n.length > 0 && ans.some((a) => erNorm(a) === n);
}
/* 별점: 탈출 1 + 하트 넉넉(≥ 시작의 절반) 1 + 힌트 적음(≤2) 1 (최대 3) */
function erStars(heartsLeft, heartsMax, hintsUsed){
  return 1 + (heartsLeft * 2 >= heartsMax ? 1 : 0) + (hintsUsed <= 2 ? 1 : 0);
}
/*ER_LOGIC_END*/

const ER_SAVE_KEY = "er_save_v2";
const er = { st: null, ckpt: null, sel: [], hintStep: {}, panel: null, timer: null, selScen: 0 };

/* ---------- 상태/세이브 ---------- */
function erScen(){ return ER_SCENARIOS[er.st.sc]; }
function erAct(){ return erScen().acts[er.st.act]; }
function erObj(id){ return erAct().objects.find((o) => o.id === id); }
function erSnap(){ return JSON.parse(JSON.stringify(er.st)); }
function erSave(){ try { localStorage.setItem(ER_SAVE_KEY, JSON.stringify(er.st)); } catch (e) { /* 무시 */ } }
function erLoad(){ try { const s = JSON.parse(localStorage.getItem(ER_SAVE_KEY) || "null"); return (s && ER_SCENARIOS[s.sc] && ER_SCENARIOS[s.sc].acts[s.act]) ? s : null; } catch (e) { return null; } }
function erClearSave(){ try { localStorage.removeItem(ER_SAVE_KEY); } catch (e) { /* 무시 */ } }

function erTimersOff(){ if (er.timer){ clearInterval(er.timer); er.timer = null; } }

/* ---------- 막 시작 / 체크포인트 ---------- */
function erBeginAct(idx){
  const a = erScen().acts[idx];
  er.st.act = idx;
  er.st.solved = {};
  er.st.seen = {};
  er.st.inv = [];
  er.st.flags = {};
  er.st.hearts = a.hearts;
  er.st.tLeft = a.time;     /* 하드: 남은 초 / 소프트: 미사용 */
  er.hintStep = {};
  er.sel = [];
  er.ckpt = erSnap();       /* 이 막의 체크포인트 (하드코어 실패 시 복귀) */
  erSave();
  erShowActIntro();
}

function erShowActIntro(){
  const a = erAct();
  $("er-setup").style.display = "none";
  $("er-play").style.display = "none";
  $("er-fail").style.display = "none";
  $("er-done").style.display = "none";
  $("er-act").style.display = "";
  $("er-act-name").textContent = a.name;
  $("er-act-intro").textContent = a.intro;
}

function erEnterPlay(){
  $("er-act").style.display = "none";
  $("er-play").style.display = "";
  er.panel = null;
  erTimersOff();
  er.timer = setInterval(erTick, 1000);
  erRender();
  erTick();
}

/* ---------- 새 게임 / 이어하기 ---------- */
function erNew(mode){
  er.st = { sc: er.selScen, mode: mode, act: 0, hintsTotal: 0 };
  erBeginAct(0);
}
function erContinue(){
  const s = erLoad();
  if (!s){ pwaToast("세이브가 없네 — 처음부터 가자"); return; }
  er.st = s;
  er.hintStep = {};
  er.sel = [];
  er.ckpt = erSnap();   /* 이어하기 지점을 새 체크포인트로 */
  erEnterPlay();
}

/* ---------- 타이머 ---------- */
function erTick(){
  if (!er.st) return;
  if (er.st.mode === "hard"){
    er.st.tLeft--;
    if (er.st.tLeft <= 0){ er.st.tLeft = 0; erUpdateHud(); erFail("⏳ 시간 초과! 모래폭풍이 닿았다…"); return; }
  } else {
    er.st.tLeft = (er.st.tLeft || 0) + 1;   /* 소프트: 경과 카운트업 */
  }
  erUpdateHud();
}

/* ---------- 렌더 ---------- */
function erUpdateHud(){
  const st = er.st, a = erAct();
  const total = a.objects.length, solved = Object.keys(st.solved).length;
  const heart = st.mode === "hard" ? "❤️".repeat(st.hearts) + "🖤".repeat(a.hearts - st.hearts) : "❤️ 자유";
  const t = st.mode === "hard" ? "⏳ " + fmt(st.tLeft) : "⏱️ " + fmt(st.tLeft || 0);
  const timeStyle = (st.mode === "hard" && st.tLeft <= 60) ? ' style="color:var(--danger)"' : "";
  $("er-hud").innerHTML =
    '<span class="st">' + escHtml(a.name.split(" · ")[0]) + "</span>" +
    '<span class="st">' + heart + "</span>" +
    '<span class="st"' + timeStyle + ">" + t + "</span>" +
    '<span class="st">🔓 <b>' + solved + "</b>/" + total + "</span>";
}

function erRender(){
  erUpdateHud();
  /* 오브젝트 그리드 */
  const scene = $("er-scene");
  scene.innerHTML = "";
  erAct().objects.forEach((o) => {
    const solved = !!er.st.solved[o.id];
    const badge = solved ? "🔓" : (o.lock ? "🔒" : "🔍");
    const t = document.createElement("button");
    t.className = "er-tile" + (solved ? " done" : "");
    t.innerHTML = '<px-sprite name="' + o.spr + '" scale="3"></px-sprite>' +
      '<span class="er-tile-nm">' + escHtml(o.nm) + "</span>" +
      '<span class="er-tile-b">' + badge + "</span>";
    t.addEventListener("click", () => erOpen(o.id));
    scene.appendChild(t);
  });
  erRenderInv();
  erRenderPanel();
}

function erRenderInv(){
  const inv = $("er-inv");
  const items = er.st.inv;
  if (!items.length){ inv.innerHTML = '<span class="er-inv-empty">🎒 인벤토리 — 아직 비었어</span>'; return; }
  const names = Object.assign({}, ...erScen().acts.map((a) => a.items));
  inv.innerHTML = '<div class="er-inv-row">' +
    items.map((id) => '<button class="chip er-item' + (er.sel.includes(id) ? " sel" : "") +
      '" data-it="' + id + '">' + escHtml(names[id] || id) + "</button>").join("") +
    "</div>" +
    (items.length >= 2 ? '<button class="btn ghost er-combine">🔗 고른 것 조합</button>' : "");
  inv.querySelectorAll(".er-item").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.it;
    const i = er.sel.indexOf(id);
    if (i >= 0) er.sel.splice(i, 1); else er.sel.push(id);
    erRenderInv();
  }));
  const cb = inv.querySelector(".er-combine");
  if (cb) cb.addEventListener("click", erCombine);
}

function erRenderPanel(){
  const p = $("er-panel");
  if (!er.panel){ p.style.display = "none"; p.innerHTML = ""; return; }
  const o = erObj(er.panel);
  const solved = !!er.st.solved[o.id];
  const gated = o.need && !er.st.flags[o.need];
  const body = gated ? o.lockedTxt : o.txt;
  let html = '<div class="ta-box"><div class="ta-port"><px-sprite name="' + o.spr + '" scale="4"></px-sprite></div>' +
    '<div class="ta-body"><div class="ta-nm">' + escHtml(o.nm) + "</div>" +
    '<div class="ta-text">' + escHtml(body) + "</div></div></div>";

  if (!solved && !gated && o.lock){
    if (o.lock.ans){
      html += '<div class="field mt"><input id="er-code" type="text" inputmode="' + (/^\d+$/.test(o.lock.ans[0]) ? "numeric" : "text") +
        '" placeholder="' + (o.lock.digits ? o.lock.digits + "자리 암호" : "암호 입력") + '" autocomplete="off" autocapitalize="off" spellcheck="false"></div>' +
        '<button class="btn" id="er-open">🔓 열기</button>' +
        '<button class="btn ghost" id="er-hint">💡 힌트</button>' +
        '<div class="hint" id="er-hintout" style="display:none"></div>';
    } else if (o.lock.item){
      const has = er.st.inv.includes(o.lock.item);
      const nm = Object.assign({}, ...erScen().acts.map((a) => a.items))[o.lock.item];
      html += has
        ? '<button class="btn" id="er-use">' + (o.final ? "🚪 " : "▶ ") + "사용: " + escHtml(nm) + "</button>"
        : '<div class="hint">아직 필요한 게 없어 — 뭔가를 얻거나 조합해야 해. (필요: ' + escHtml(nm) + ")</div>";
    }
  }
  html += '<button class="btn ghost mt" id="er-close">← 닫기</button>' +
    '<div class="er-msg" id="er-msg"></div>';
  p.innerHTML = html;
  p.style.display = "";

  const inp = $("er-code");
  if (inp){
    inp.focus();
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") erTryCode(); });
    $("er-open").addEventListener("click", erTryCode);
    $("er-hint").addEventListener("click", erHint);
  }
  if ($("er-use")) $("er-use").addEventListener("click", erUseItem);
  $("er-close").addEventListener("click", () => { er.panel = null; erRenderPanel(); });
}

/* ---------- 상호작용 ---------- */
function erOpen(id){
  const o = erObj(id);
  er.panel = id;
  /* 조사 1회 효과: 게이트 안 걸린 examine 오브젝트의 sets/give (lock 없는 것만) */
  if (!er.st.seen[id] && !(o.need && !er.st.flags[o.need])){
    er.st.seen[id] = true;
    if (!o.lock){
      if (o.sets) er.st.flags[o.sets] = true;
      if (o.give) erGain(o.give);
      if (!o.give && !o.sets) { /* 순수 단서 */ }
      if (o.give || o.sets){ erSave(); erRender(); return; }
    }
    erSave();
    erRender();     /* lit 등 플래그로 다른 타일 표시 갱신 */
    return;
  }
  erRenderPanel();
}

function erGain(itemId){
  if (!er.st.inv.includes(itemId)) er.st.inv.push(itemId);
}

function erTryCode(){
  const o = erObj(er.panel);
  const inp = $("er-code");
  if (!inp) return;
  if (!erMatch(inp.value, o.lock.ans)){
    erWrong("🔒 잠긴 채다. 단서를 다시 살펴봐.");
    inp.select();
    return;
  }
  erSolve(o);
}

function erUseItem(){
  const o = erObj(er.panel);
  if (!er.st.inv.includes(o.lock.item)) return;
  erSolve(o);
}

function erSolve(o){
  haptic(30);
  er.st.solved[o.id] = true;
  if (o.lock.sets) er.st.flags[o.lock.sets] = true;
  if (o.lock.give) erGain(o.lock.give);
  erSave();
  if (o.final){ erActClear(); return; }
  /* 해제 결과 문구를 패널에 보여주고 닫기 유도 */
  er.panel = o.id;
  erRender();
  const p = $("er-panel");
  p.innerHTML = '<div class="ta-box"><div class="ta-port"><px-sprite name="' + o.spr + '" scale="4"></px-sprite></div>' +
    '<div class="ta-body"><div class="ta-nm">🔓 ' + escHtml(o.nm) + '</div><div class="ta-text">' + escHtml(o.lock.open) + "</div></div></div>" +
    '<button class="btn mt" id="er-close">계속</button>';
  p.style.display = "";
  $("er-close").addEventListener("click", () => { er.panel = null; erRenderPanel(); });
  pwaToast("🔓 " + o.nm + " 해제!");
}

function erWrong(msg){
  const box = $("er-msg");
  if (box) box.textContent = msg;
  haptic([40, 40, 40]);
  const bx = $("er-panel").querySelector(".ta-box");
  if (bx){ bx.classList.remove("er-shake"); void bx.offsetWidth; bx.classList.add("er-shake"); }
  if (er.st.mode === "hard"){
    er.st.hearts--;
    er.st.tLeft = Math.max(0, er.st.tLeft - 30);   /* 오답 -30초 */
    erUpdateHud();
    erSave();
    if (er.st.hearts <= 0){ erFail("💔 하트를 다 잃었다…"); return; }
  }
}

function erHint(){
  const o = erObj(er.panel);
  const step = er.hintStep[o.id] || 0;
  if (step >= o.lock.hints.length){ $("er-hintout").textContent = "💡 이 자물쇠 힌트는 여기까지야."; $("er-hintout").style.display = ""; return; }
  $("er-hintout").textContent = "💡 " + o.lock.hints[step];
  $("er-hintout").style.display = "";
  er.hintStep[o.id] = step + 1;
  er.st.hintsTotal = (er.st.hintsTotal || 0) + 1;
  if (er.st.mode === "hard"){ er.st.tLeft = Math.max(0, er.st.tLeft - 15); erUpdateHud(); }  /* 힌트 -15초 */
  erSave();
}

function erCombine(){
  const sel = er.sel.slice().sort();
  const combo = erAct().combos.find((c) => c.need.slice().sort().join() === sel.join());
  if (!combo){ pwaToast("이건 서로 안 맞아 — 다른 조합을 찾아봐"); er.sel = []; erRenderInv(); return; }
  /* 재료 소모 → 결과 아이템 */
  er.st.inv = er.st.inv.filter((id) => !combo.need.includes(id));
  erGain(combo.gives);
  er.sel = [];
  haptic(30);
  erSave();
  erRender();
  pwaToast("🔗 " + combo.text);
}

/* ---------- 막 클리어 / 실패 / 승리 ---------- */
function erActClear(){
  erTimersOff();
  if (er.st.act + 1 < erScen().acts.length){
    pwaToast("🎉 " + erAct().name + " 클리어! 저장됐어");
    erBeginAct(er.st.act + 1);    /* 다음 막 인트로 (자동 저장) */
  } else {
    erWin();
  }
}

function erFail(msg){
  erTimersOff();
  $("er-play").style.display = "none";
  $("er-fail").style.display = "";
  $("er-fail-msg").textContent = msg;
  $("er-fail-sub").textContent = "이 막 처음부터 다시 할 수 있어 (지금까지 연 자물쇠는 초기화돼).";
}

function erWin(){
  erTimersOff();
  erClearSave();
  const a = erAct();
  const stars = er.st.mode === "hard" ? erStars(er.st.hearts, a.hearts, er.st.hintsTotal || 0) : 3;
  $("er-play").style.display = "none";
  $("er-done").style.display = "";
  $("er-result").innerHTML =
    '<div style="font-size:34px;letter-spacing:4px">' + "⭐".repeat(stars) + "☆".repeat(3 - stars) + "</div>" +
    '<h3 style="margin:10px 0 6px">🎉 ' + escHtml(erScen().title) + ' — 탈출 성공!</h3>' +
    '<p class="hint" style="margin:0 0 12px">' + escHtml(erScen().outro || "무사히 빠져나왔다.") + "</p>" +
    '<div class="ta-hud" style="justify-content:center">' +
      '<span class="st">🎮 모드 <b>' + (er.st.mode === "hard" ? "하드코어" : "소프트") + "</b></span>" +
      '<span class="st">💡 힌트 <b>' + (er.st.hintsTotal || 0) + "</b></span>" +
      (er.st.mode === "hard" ? '<span class="st">❤️ 남은 <b>' + er.st.hearts + "</b></span>" : "") +
    "</div>";
}

/* ---------- 셋업 / 리셋 ---------- */
function erRenderScens(){
  const box = $("er-scens");
  box.innerHTML = "";
  ER_SCENARIOS.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "er-scen" + (i === er.selScen ? " sel" : "");
    b.innerHTML = '<span class="es-e">' + s.emoji + '</span><span><b>' + escHtml(s.title) + "</b><small>" + escHtml(s.tagline) + "</small></span>";
    b.addEventListener("click", () => { er.selScen = i; erRenderScens(); });
    box.appendChild(b);
  });
}
function erReset(){
  /* 진입 시: 진행 중 세이브 있으면 이어하기 노출, 아니면 시나리오·모드 선택 */
  erTimersOff();
  er.panel = null; er.sel = [];
  $("er-act").style.display = "none";
  $("er-play").style.display = "none";
  $("er-fail").style.display = "none";
  $("er-done").style.display = "none";
  $("er-setup").style.display = "";
  erRenderScens();
  const save = erLoad();
  $("er-continue").style.display = save ? "" : "none";
  if (save) $("er-continue").textContent = "⏳ 이어하기 — " + ER_SCENARIOS[save.sc].title + " · " + ER_SCENARIOS[save.sc].acts[save.act].name;
}

$("er-mode-soft").addEventListener("click", () => erNew("soft"));
$("er-mode-hard").addEventListener("click", () => erNew("hard"));
$("er-continue").addEventListener("click", erContinue);
$("er-act-go").addEventListener("click", erEnterPlay);
$("er-again").addEventListener("click", () => { erClearSave(); erReset(); });
$("er-fail-continue").addEventListener("click", () => {
  er.st = JSON.parse(JSON.stringify(er.ckpt));   /* 이 막 체크포인트 복귀 (하트·시간 리셋) */
  er.hintStep = {}; er.sel = [];
  erSave();
  erEnterPlay();
});
$("er-fail-restart").addEventListener("click", () => { erClearSave(); erReset(); });
