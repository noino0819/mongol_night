"use strict";

/* ---- 화면·CSS 자체 등록 (index.html 무수정 원칙: core.js snAddScreen/snAddCss) ---- */
snAddScreen("ta", `
    <div class="topbar"><button class="back" data-go="home">← 홈</button><h2>📜 고비의 별</h2></div>
    <div id="ta-setup">
      <p class="hint">텡그리와 떠나는 <b>3일 밤의 협동 어드벤처</b>. 선택은 일행이 돌아가며 담당하고, 판정은 <b>스탯 + 🎲d6</b>이 결정해요. 실패해도 죽지 않아요 — 길이 험해질 뿐! 엔딩은 4종!</p>
      <div class="field"><label>파티 (설정의 일행 순서대로 선택권이 돌아요)</label><div class="ta-party" id="ta-party"></div></div>
      <button class="btn" id="ta-new">🌠 처음부터 떠나기</button>
      <button class="btn ghost mt" id="ta-continue" style="display:none">⏳ 이어하기</button>
    </div>
    <div id="ta-play" style="display:none">
      <div class="ta-hud" id="ta-hud"></div>
      <div class="ta-box">
        <div class="ta-port" id="ta-port"></div>
        <div class="ta-body">
          <div class="ta-nm" id="ta-nm"></div>
          <div class="ta-text" id="ta-text"></div>
        </div>
      </div>
      <div class="ta-turnbar" id="ta-turnbar" style="display:none"></div>
      <div id="ta-choices"></div>
    </div>
    <div class="ta-roll" id="ta-roll" style="display:none">
      <div class="ta-roll-card">
        <div class="ta-roll-tt" id="ta-roll-tt"></div>
        <div class="ta-roll-num" id="ta-roll-num">?</div>
        <div class="ta-roll-rs" id="ta-roll-rs"></div>
      </div>
    </div>
  `);
snAddCss(`/* ---------- 고비의 별 (ta) ---------- */
.ta-party{display:flex;gap:6px;flex-wrap:wrap}

.ta-turnbar{margin:12px 0 2px;font-size:13px;color:var(--dim);text-align:center}
.ta-turnbar b{color:var(--steppe)}
#ta-choices{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.ta-roll{position:fixed;inset:0;background:rgba(14,21,38,.82);display:flex;align-items:center;justify-content:center;z-index:60}
.ta-roll-card{background:var(--card);border:2px solid var(--line);border-radius:14px;padding:22px 30px;text-align:center;min-width:220px}
.ta-roll-tt{font-size:14px;font-weight:800;color:var(--dim);margin-bottom:10px}
.ta-roll-num{font-size:52px;font-weight:900;line-height:1.1;color:var(--milk)}
.ta-roll-rs{font-size:15px;font-weight:800;margin-top:10px;min-height:1.5em}`);
/* ================= 고비의 별 (ta) — 텍스트 어드벤처 엔진 ================= */
/* 데이터 캐논. text는 저작 턴에서 교체 예정인 임시 문안 (분기 구조는 확정).
   검증: node tools/ta-validate.mjs (index.html에서 아래 블록을 추출해 검사) */
/*TA_DATA_BEGIN*/
const TA_META = {
  start: "p_01",
  checkpoint: "c3_01",
  endings: ["end_star", "end_sheep", "end_wander", "end_go"],
  vars: { 용기: 2, 지혜: 2, 인심: 2, sheep: 5, star: 0, charm: 0, fails: 0 }
};
const TA_STORY = {
  /* ---------- 프롤로그 ---------- */
  p_01: { sp: "narr", text: "몽골 여행 첫날 밤. 게르 캠프 위로 별이 쏟아진다.", goto: "p_02" },
  p_02: { sp: "narr", text: "별똥별 하나가 고비 쪽으로 떨어진다. 소원을 빌 새도 없이, 아주 크게.", goto: "p_03" },
  p_03: { sp: "tengri", text: "…일어나라, 인간들. 고비의 별이 떨어졌다. 주워 와라.", goto: "p_04" },
  p_04: { sp: "tengri", text: "가진 건 용기·지혜·인심, 그리고 양 다섯 마리. 사흘 주지. …파티와 상의해도 좋다.", goto: "p_05" },
  p_05: {
    sp: "narr", text: "어떻게 떠날까? (다수결!)",
    choices: [
      { label: "말을 타고 질주한다 (용기+1)", set: { 용기: 1 }, goto: "p_06" },
      { label: "별자리로 길을 잡는다 (지혜+1)", set: { 지혜: 1 }, goto: "p_06" },
      { label: "유목민에게 길을 묻는다 (인심+1)", set: { 인심: 1 }, goto: "p_06" }
    ]
  },
  p_06: { sp: "tengri", text: "…제법이군. 양들 이름은 너희가 지어라. 난 안 외운다.", goto: "p_07" },
  p_07: { sp: "tengri", text: "별의 기운이 셋으로 갈라졌다. 사흘, 세 조각. 하나라도 놓치면… 알아서 해라.", goto: "c1_01" },

  /* ---------- 1장 첫째 날 — 초원의 흔적 ---------- */
  c1_01: {
    sp: "narr", text: "끝없는 초원. 멀리 게르의 연기 한 줄, 하늘엔 빙빙 도는 독수리.",
    choices: [
      { label: "독수리를 따라간다", goto: "c1_02" },
      { label: "게르로 간다", goto: "c1_09" }
    ]
  },
  c1_02: {
    sp: "narr", text: "말을 달리는 독수리 사냥꾼이 보인다. 따라잡아야 말을 걸지.",
    choices: [{ label: "말을 몰아 추격한다", check: { stat: "용기", dc: 5 }, ok: "c1_03", fail: "c1_04" }]
  },
  c1_03: { sp: "npc_hunter", text: "호오, 말 좀 타는군. 같이 가지.", goto: "c1_05" },
  c1_04: { sp: "narr", text: "장렬한 낙마. 양들이 매애— 하고 비웃는다. 걸어서 따라붙었다.", goto: "c1_05" },
  c1_05: {
    sp: "npc_hunter", text: "지난밤 빛? 협곡에 떨어졌지. …그보다 내 독수리 한번 받아볼 텐가?",
    choices: [
      { label: "독수리를 받아본다", check: { stat: "용기", dc: 6 }, ok: "c1_06", fail: "c1_07" },
      { label: "정중히 사양한다", goto: "c1_07" }
    ]
  },
  c1_06: { sp: "narr", text: "독수리가 어깨에 앉았다! (용기+1) 사냥꾼이 협곡 지름길을 알려준다.", set: { 용기: 1 }, goto: "c1_08" },
  c1_07: { sp: "narr", text: "독수리가 모자를 낚아채 갔다. 사냥꾼이 웃으며 길만 알려준다.", goto: "c1_08" },
  c1_08: { sp: "narr", text: "협곡으로 가는 길, 언덕 위에 돌무더기 오보가 보인다.", goto: "c1_17" },
  c1_09: { sp: "npc_family", text: "어서 와! 아이락 한 사발 쭉— (시큼함에 전원 오만상)", goto: "c1_10" },
  c1_10: {
    sp: "npc_family", text: "빛? 협곡 쪽이었지. …그보다 샤가이 한판 어때? 손님.",
    choices: [
      { label: "대결을 받는다", goto: "c1_11" },
      { label: "사양한다", goto: "c1_14" }
    ]
  },
  c1_11: {
    sp: "narr", text: "[미니게임] 샤가이 대결! 이번 담당자가 옆사람과 실제 가위바위보 한 판!",
    choices: [
      { label: "이겼다!", goto: "c1_12" },
      { label: "졌다…", goto: "c1_13" }
    ]
  },
  c1_12: { sp: "npc_family", text: "졌다 졌어! 하하! 양 한 마리 가져가! (🐑+1)", set: { sheep: 1 }, goto: "c1_15" },
  c1_13: { sp: "narr", text: "졌지만 웃으며 축하해 줬다. 주인장이 흐뭇해한다. (인심+1)", set: { 인심: 1 }, goto: "c1_15" },
  c1_14: {
    sp: "narr", text: "주인장이 서운한 눈치다. 분위기를 풀어야 하는데…",
    choices: [{ label: "진심으로 사정을 말한다", check: { stat: "인심", dc: 6 }, ok: "c1_15", fail: "c1_16" }]
  },
  c1_15: { sp: "npc_family", text: "별을 찾는다고? 그럼 든든해야지. 양 두 마리 데려가! (🐑+2) 지름길도 알려줄게.", set: { sheep: 2 }, goto: "c1_17" },
  c1_16: { sp: "narr", text: "길 정보만 대충 들었다. 그 사이 양들이 아이락을 훔쳐 마시고 비틀거린다.", goto: "c1_17" },
  c1_17: {
    sp: "tengri", text: "오보다. …돌 세 바퀴, 알고 있겠지.",
    choices: [
      { label: "🐑 양 1마리를 바친다", cost: { sheep: 1 }, hideIf: "sheep<1", goto: "c1_18" },
      { label: "돌만 얹고 세 바퀴 돈다", goto: "c1_19" }
    ]
  },
  c1_18: {
    sp: "narr", text: "바람이 응답한다. — 무엇을 원하나.",
    choices: [
      { label: "담대함을 (용기+1)", set: { 용기: 1 }, goto: "c1_20" },
      { label: "밝은 눈을 (지혜+1)", set: { 지혜: 1 }, goto: "c1_20" },
      { label: "따뜻한 마음을 (인심+1)", set: { 인심: 1 }, goto: "c1_20" }
    ]
  },
  c1_19: { sp: "tengri", text: "…쩨쩨하군. 뭐, 마음이니까.", goto: "c1_20" },
  c1_20: { sp: "narr", text: "해질녘, 협곡 도착. 바닥에 빛나는 흔적이 점점이 이어진다.", goto: "c1_21" },
  c1_21: {
    sp: "narr", text: "좁은 바위틈 아래, 첫 번째 별조각이 반짝인다!",
    choices: [
      { label: "뛰어내려 줍는다", check: { stat: "용기", dc: 6 }, ok: "c1_22", fail: "c1_23" },
      { label: "별자리로 안전한 길을 찾는다", check: { stat: "지혜", dc: 6 }, ok: "c1_22", fail: "c1_23" }
    ]
  },
  c1_22: { sp: "tengri", text: "별조각 하나! (⭐+1) …첫 조각. 제법이야.", set: { star: 1 }, goto: "c1_25" },
  c1_23: {
    sp: "narr", text: "미끄러졌다! 조각이 더 깊은 틈으로. 해가 지기 전 마지막 시도.",
    choices: [
      { label: "밧줄을 엮어 내려간다", check: { stat: "지혜", dc: 7 }, ok: "c1_22", fail: "c1_24" },
      { label: "🐑 양 1마리로 협곡 여우에게 부탁", cost: { sheep: 1 }, hideIf: "sheep<1", goto: "c1_22" }
    ]
  },
  c1_24: { sp: "tengri", text: "…놓쳤군. 둘째 날에 만회해라. 반드시.", set: { fails: 1 }, goto: "c1_25" },
  c1_25: { sp: "narr", text: "모닥불 곁에서 첫째 날이 저문다. (여기까지 자동 저장돼!)", goto: "c2_01" },

  /* ---------- 2장 둘째 날 — 모래폭풍의 밤 ---------- */
  c2_01: { sp: "narr", text: "초원이 끝나고 모래가 시작된다. 양들이 혀를 빼물었다.", goto: "c2_02" },
  c2_02: { sp: "tengri", text: "둘째 조각은 사막 한가운데다. …오늘 밤, 바람이 사납다.", goto: "c2_03" },
  c2_03: {
    sp: "narr", text: "갈림길이다.",
    choices: [
      { label: "사구를 직행한다 (빠르지만 험함)", goto: "c2_04" },
      { label: "우물을 경유한다 (멀지만 안전)", goto: "c2_08" }
    ]
  },
  c2_04: {
    sp: "narr", text: "타는 태양 아래, 거대한 사구를 넘어야 한다.",
    choices: [{ label: "이 악물고 오른다", check: { stat: "용기", dc: 6 }, ok: "c2_05", fail: "c2_06" }]
  },
  c2_05: { sp: "narr", text: "씩씩하게 주파! (용기+1) 저 멀리 신기루로 마트가 보인 건 비밀이다.", set: { 용기: 1 }, goto: "c2_07" },
  c2_06: { sp: "narr", text: "일사병 직전. 양 그늘에 숨어 한참을 쉬었다. 시간을 잃었다.", goto: "c2_07" },
  c2_07: { sp: "narr", text: "모래 바다 한가운데로 들어선다.", goto: "c2_12" },
  c2_08: { sp: "narr", text: "오아시스 우물 도착. 낙타 새끼가 물통을 베고 자고 있다.", goto: "c2_09" },
  c2_09: {
    sp: "narr", text: "우물 바닥에서 뭔가 반짝인다…?",
    choices: [{ label: "들여다본다", check: { stat: "지혜", dc: 5 }, ok: "c2_10", fail: "c2_11" }]
  },
  c2_10: { sp: "narr", text: "고대의 샤가이 주사위다! 옛 유목민의 지혜가 깃들었다. (지혜+1)", set: { 지혜: 1 }, goto: "c2_11" },
  c2_11: { sp: "narr", text: "물을 든든히 채우고 출발.", goto: "c2_12" },
  c2_12: {
    sp: "npc_trader", text: "조각? 폭풍 언덕에서 봤지. …폭풍 부적 하나 사 가지 않겠나? 양 두 마리면 돼.",
    choices: [
      { label: "🐑 2마리로 부적을 산다", cost: { sheep: 2 }, hideIf: "sheep<2", goto: "c2_13" },
      { label: "흥정한다", check: { stat: "인심", dc: 7 }, ok: "c2_14", fail: "c2_15" },
      { label: "길만 묻고 간다", goto: "c2_15" }
    ]
  },
  c2_13: { sp: "narr", text: "폭풍 부적 획득! (🧿) 바람을 한 번 잠재운다고 한다.", set: { charm: 1 }, goto: "c2_15" },
  c2_14: { sp: "npc_trader", text: "…자네 눈빛에 졌네. 한 마리만 받지. (🐑-1, 🧿 부적 획득)", set: { sheep: -1, charm: 1 }, goto: "c2_15" },
  c2_15: {
    sp: "npc_trader", text: "부탁이 하나 있네. 별자리로 길을 잡아 주면 양 두 마리 주지.",
    choices: [
      { label: "맡는다", check: { stat: "지혜", dc: 6 }, ok: "c2_16", fail: "c2_17" },
      { label: "갈 길이 멀다, 사양", goto: "c2_18" }
    ]
  },
  c2_16: { sp: "npc_trader", text: "정확하군! 약속대로 양 두 마리. (🐑+2)", set: { sheep: 2 }, goto: "c2_18" },
  c2_17: { sp: "narr", text: "북두칠성이라 우긴 건 비행기 불빛이었다. 상인이 웃으며 육포만 쥐여준다.", goto: "c2_18" },
  c2_18: { sp: "npc_family2", text: "해질녘 게르 발견 — 어제 그 가족의 친척집이란다. 초원 인맥 무섭다.", goto: "c2_19" },
  c2_19: {
    sp: "narr", text: "[미니게임] 마두금의 밤. 소녀가 청한다 — 전원 셋 세고 같은 별을 동시에 가리켜 봐!",
    choices: [
      { label: "통했다!", goto: "c2_20" },
      { label: "제각각…", goto: "c2_21" }
    ]
  },
  c2_20: { sp: "npc_family2", text: "소녀가 활짝 웃으며 새끼 양을 안겨준다. (🐑+1, 인심+1)", set: { sheep: 1, 인심: 1 }, goto: "c2_22" },
  c2_21: { sp: "narr", text: "전원이 전부 다른 별을 가리켰다. 은하수 아래 웃음이 터졌다.", goto: "c2_22" },
  c2_22: { sp: "tengri", text: "자정. 개들이 짖는다. …조각이 폭풍 한가운데서 울고 있다. 지금이다.", goto: "c2_23" },
  c2_23: {
    sp: "narr", text: "모래폭풍이 다가온다…!",
    choices: [
      { label: "정면 돌파, 말을 달린다", check: { stat: "용기", dc: 7 }, ok: "c2_25", fail: "c2_26" },
      { label: "바람 결을 읽어 틈으로", check: { stat: "지혜", dc: 6 }, ok: "c2_25", fail: "c2_26" },
      { label: "🐑 1마리로 유목민 길잡이 부탁", cost: { sheep: 1 }, hideIf: "sheep<1", goto: "c2_24" }
    ]
  },
  c2_24: { sp: "npc_family2", text: "노인이 낙타를 몰고 앞장선다. 폭풍의 결을 따라, 안전하게.", goto: "c2_27" },
  c2_25: { sp: "narr", text: "폭풍을 뚫었다! 모래 벽 사이로 길이 열린다.", goto: "c2_27" },
  c2_26: {
    sp: "narr", text: "휩쓸렸다! 양 한 마리가 바람에 굴러간다. (🐑-1) 모래 둔덕 뒤로 겨우 피신.",
    set: { sheep: -1 },
    choices: [
      { label: "폭풍의 틈으로 재돌진", check: { stat: "용기", dc: 6 }, ok: "c2_27", fail: "c2_28" },
      { label: "포기하고 대피한다", goto: "c2_28" }
    ]
  },
  c2_27: {
    sp: "narr", text: "폭풍의 눈. 회오리 꼭대기에서 둘째 조각이 돌고 있다!",
    choices: [
      { label: "인간 탑을 쌓는다 (전원 협동)", check: { stat: "인심", dc: 6 }, ok: "c2_29", fail: "c2_28" },
      { label: "🧿 부적을 던진다", hideIf: "charm<1", goto: "c2_29" },
      { label: "말 등에서 점프", check: { stat: "용기", dc: 7 }, ok: "c2_29", fail: "c2_28" }
    ]
  },
  c2_28: { sp: "tengri", text: "…모래가 삼켰군. 조각이 가라앉았다.", set: { fails: 1 }, goto: "c2_30" },
  c2_29: { sp: "narr", text: "둘째 조각 획득! (⭐+1) 폭풍이 거짓말처럼 잦아든다.", set: { star: 1 }, goto: "c2_30" },
  c2_30: { sp: "npc_family2", text: "새벽, 게르로 돌아오자 가족이 끌어안는다. 쪽잠이 꿀맛이다.", goto: "c2_31" },
  c2_31: { sp: "tengri", text: "…마지막 날이다. 별이 떨어진 크레이터로 간다. (여기까지 자동 저장돼!)", goto: "c3_01" },

  /* ---------- 3장 셋째 날 — 늑대의 시험 ---------- */
  c3_01: { sp: "narr", text: "크레이터 능선. 아래에서 빛이 새어 나오고, 사방에서 늑대 울음이 겹친다.", goto: "c3_02" },
  c3_02: { sp: "narr", text: "늑대 무리가 크레이터를 지키고 있다. 텡그리가… 이상하게 조용하다. 거대한 흰 늑대가 나선다.", goto: "c3_03" },
  c3_03: {
    sp: "npc_wolfking", text: "별은 하늘의 것. 인간이 어찌 여기 왔나.",
    choices: [
      { label: "당당히 요구한다", check: { stat: "용기", dc: 6 }, ok: "c3_04", fail: "c3_05" },
      { label: "정중히 사정을 말한다", check: { stat: "인심", dc: 6 }, ok: "c3_04", fail: "c3_05" },
      { label: "🐑 2마리를 예물로 바친다", cost: { sheep: 2 }, hideIf: "sheep<2", goto: "c3_04" }
    ]
  },
  c3_04: { sp: "npc_wolfking", text: "…재밌군. 시험을 받아라.", goto: "c3_08" },
  c3_05: {
    sp: "narr", text: "쫓겨났다. 그런데 능선 아래 — 모래에 빠진 새끼 늑대가 낑낑댄다.",
    choices: [
      { label: "새끼를 구한다", goto: "c3_06" },
      { label: "몰래 크레이터로 침입한다", goto: "c3_07" }
    ]
  },
  c3_06: { sp: "npc_wolfking", text: "…빚을 졌군. (인심+1) 시험을 허하지.", set: { 인심: 1 }, goto: "c3_08" },
  c3_07: {
    sp: "narr", text: "밤까지 숨었다가 크레이터로 기어든다.",
    choices: [
      { label: "숨을 죽이고 이동한다", check: { stat: "지혜", dc: 7 }, ok: "c3_09", fail: "c3_10" },
      { label: "역시 새끼부터 구한다", goto: "c3_06" }
    ]
  },
  c3_08: { sp: "npc_wolfking", text: "세 가지를 본다. 담력, 눈, 그리고 마음.", goto: "c3_11" },
  c3_09: { sp: "narr", text: "별 앞까지 갔다 — 순간 별이 반짝, 늑대왕을 불러버렸다. 고자질쟁이…! 결국 시험행.", goto: "c3_08" },
  c3_10: { sp: "npc_wolfking", text: "(목덜미를 물려 끌려왔다) …겁쟁이 방식이군. 그래도 시험은 주지.", goto: "c3_08" },
  c3_11: {
    sp: "npc_wolfking", text: "[미니게임] 첫째, 담력. 나와 눈싸움이다 — 담당자는 옆사람과 실제 눈싸움! 웃거나 깜빡이면 진다.",
    choices: [
      { label: "이겼다!", goto: "c3_12" },
      { label: "졌다…", goto: "c3_13" }
    ]
  },
  c3_12: { sp: "npc_wolfking", text: "담력은 합격.", goto: "c3_15" },
  c3_13: {
    sp: "narr", text: "눈싸움엔 졌다. 그래도 물러설 순 없다.",
    choices: [{ label: "다리를 떨면서도 버틴다", check: { stat: "용기", dc: 6 }, ok: "c3_12", fail: "c3_14" }]
  },
  c3_14: { sp: "npc_wolfking", text: "…네 양이 너보다 낫군. (양 한 마리가 대신 늑대왕을 노려보고 있다)", set: { fails: 1 }, goto: "c3_15" },
  c3_15: {
    sp: "npc_wolfking", text: "둘째, 눈. 세 개의 빛 중 진짜 별조각을 골라라.",
    choices: [{ label: "찬찬히 살핀다", check: { stat: "지혜", dc: 6 }, ok: "c3_16", fail: "c3_17" }]
  },
  c3_16: { sp: "npc_wolfking", text: "…정답. 셋째 조각을 가져라. (⭐+1)", set: { star: 1 }, goto: "c3_19" },
  c3_17: {
    sp: "narr", text: "집어든 것이 바스러진다 — 모래 유리다. 늑대들이 킥킥댄다. 한 번 더 기회.",
    choices: [{ label: "별자리 지식 총동원", check: { stat: "지혜", dc: 7 }, ok: "c3_16", fail: "c3_18" }]
  },
  c3_18: { sp: "npc_wolfking", text: "눈은 아직 어리군. 셋째 조각은 넘길 수 없다.", set: { fails: 1 }, goto: "c3_19" },
  c3_19: {
    sp: "npc_wolfking", text: "셋째, 마음. — 별을 되찾으면 소원이 이뤄진다. 누구를 위해 쓸 건가.",
    choices: [
      { label: "우리 일행의 무사귀환", goto: "c3_20" },
      { label: "양들이 배불리 (진심임)", goto: "c3_20" },
      { label: "여기서 만난 유목민 가족들", goto: "c3_20" }
    ]
  },
  c3_20: {
    sp: "npc_wolfking", text: "(늑대왕이 마음속을 들여다본다)",
    choices: [{ label: "눈을 똑바로 본다", check: { stat: "인심", dc: 6 }, ok: "c3_21", fail: "c3_22" }]
  },
  c3_21: { sp: "npc_wolfking", text: "…마음은 진짜군.", goto: "c3_23" },
  c3_22: { sp: "npc_wolfking", text: "…절반만 진심이군. (전원 뜨끔했다)", set: { fails: 1 }, goto: "c3_23" },
  c3_23: { sp: "npc_wolfking", text: "내려가라. 다만 — 별을 지키는 건, 우리가 아니다.", goto: "c3_24" },
  c3_24: { sp: "narr", text: "크레이터 중심, 떨어진 별 본체. 그 곁의 검은 모래가 일어선다 — 별의 그림자다.", goto: "c3_25" },
  c3_25: {
    sp: "narr", text: "그림자 늑대가 덮쳐온다!",
    choices: [
      { label: "정면으로 맞선다", check: { stat: "용기", dc: 7 }, ok: "c3_27", fail: "c3_26" },
      { label: "🧿 폭풍 부적을 꺼낸다", hideIf: "charm<1", goto: "c3_27" }
    ]
  },
  c3_26: {
    sp: "narr", text: "쓰러지기 직전 — 마지막 한 수.",
    choices: [{ label: "전원이 손을 잡고 버틴다", check: { stat: "인심", dc: 7 }, ok: "c3_27", fail: "end_go" }]
  },
  c3_27: { sp: "tengri", text: "(텡그리가 몸을 던져 그림자를 붙든다) …지금이다, 인간들!", goto: "c3_28" },
  c3_28: {
    sp: "narr", text: "[게이트] 양떼 체크",
    auto: [
      { if: "sheep>=10", goto: "c3_29" },
      { goto: "c3_30" }
    ]
  },
  c3_29: {
    sp: "narr", text: "🐑 열 마리의 양떼가 너희를 바라본다. …별이냐, 양이냐.",
    choices: [
      { label: "별은 하늘에 두고, 양떼와 초원에 남는다", goto: "end_sheep" },
      { label: "그래도 별을 줍는다", goto: "c3_30" }
    ]
  },
  c3_30: {
    sp: "narr", text: "[게이트] 별 복원 평가",
    auto: [
      { if: "star>=3 && (용기+지혜+인심)>=9", goto: "c3_33" },
      { if: "star>=2", goto: "c3_31" },
      { goto: "c3_32" }
    ]
  },
  c3_31: {
    sp: "tengri", text: "조각이 모자라군. …잃어버린 조각의 기억을, 너희의 이야기로 채워라.",
    choices: [{ label: "사흘의 여정을 이야기한다", check: { stat: "지혜", dc: 7 }, ok: "c3_33", fail: "c3_32" }]
  },
  c3_32: { sp: "narr", text: "별이 손끝에서 흩어져 다시 하늘로 오른다. 잡지 못했다. — 바람만이 남았다.", goto: "end_wander" },
  c3_33: { sp: "tengri", text: "별이 온전해진다. …이제 알겠나. 나는 별을 지키는 수호 늑대 정령. 너희가 내 세 번째 여행자다.", goto: "end_star" },

  /* ---------- 엔딩 ---------- */
  end_star: {
    sp: "tengri", text: "⭐ 진엔딩 — 별이 하늘로 돌아간다. 소원 하나가 이뤄질 것이다. …또 떨어지면, 부탁하지. 인간들.",
    choices: [{ label: "처음부터 다시", goto: "p_01" }]
  },
  end_sheep: {
    sp: "narr", text: "🐑 목동엔딩 — 별 대신 양떼를 골랐다. 훗날 고비에서 전설의 목동 얘기가 돌았다고 한다. 텡그리는 어이없어하며 축복을 남겼다.",
    choices: [{ label: "처음부터 다시", goto: "p_01" }]
  },
  end_wander: {
    sp: "narr", text: "🌪️ 방랑엔딩 — 별은 놓쳤지만, 사흘의 이야기는 남았다. 일행은 바람이 되어 초원을 떠돈다… 는 건 농담이고, 게르로 돌아가 아이락을 마셨다.",
    choices: [{ label: "처음부터 다시", goto: "p_01" }]
  },
  end_go: {
    sp: "narr", text: "💀 그림자에 삼켜졌다 — 순간, 텡그리가 이를 갈며 시간을 되감는다. …한 번만이다.",
    choices: [
      { label: "체크포인트에서 다시 (셋째 날 아침)", goto: "c3_01" },
      { label: "처음부터 다시", goto: "p_01" }
    ]
  }
};
/*TA_DATA_END*/

/* --- 순수 로직 (검증 스크립트가 추출해 단위 테스트) --- */
/*TA_LOGIC_BEGIN*/
/* 조건식 미니 평가기 — new Function 없이 "a+b>=n && c<n" 꼴만 지원 */
function taCond(expr, vars){
  return String(expr).split("&&").every(function(part){
    const m = part.trim().replace(/[()]/g, "").match(/^(.+?)(>=|<=|==|<|>)\s*(\d+)$/);
    if (!m) return false;
    let val = 0;
    for (const k of m[1].split("+")){
      const key = k.trim();
      if (!(key in vars)) return false;
      val += vars[key];
    }
    const n = +m[3];
    return m[2] === ">=" ? val >= n : m[2] === "<=" ? val <= n :
           m[2] === "<" ? val < n : m[2] === ">" ? val > n : val === n;
  });
}
/* 스탯 0~5 · sheep 0+ · star 0~3 · charm 0/1 클램프 */
function taClampVars(v){
  for (const k of ["용기", "지혜", "인심"]) v[k] = Math.max(0, Math.min(5, v[k]));
  v.sheep = Math.max(0, v.sheep);
  v.star = Math.max(0, Math.min(3, v.star));
  v.charm = Math.max(0, Math.min(1, v.charm));
  v.fails = Math.max(0, v.fails);
  return v;
}
/*TA_LOGIC_END*/

const TA_SP = {
  narr:         { nm: "",              spr: "fire" },
  tengri:       { nm: "텡그리",        spr: "tengri" },
  npc_hunter:   { nm: "독수리 사냥꾼", spr: "hawk" },
  npc_family:   { nm: "유목민 가족",   spr: "goat" },
  npc_family2:  { nm: "유목민 친척",   spr: "camel" },
  npc_trader:   { nm: "카라반 상인",   spr: "camel" },
  npc_wolfking: { nm: "늑대왕",        spr: "wolf" }
};
const TA_SAVE_KEY = "ta_save_v1";
const ta = { nodeId: null, vars: null, turnIdx: 0, ckpt: null, timers: [], rolling: false };

function taSaveGame(){
  try {
    localStorage.setItem(TA_SAVE_KEY, JSON.stringify({ node: ta.nodeId, vars: ta.vars, turnIdx: ta.turnIdx, ckpt: ta.ckpt }));
  } catch (e) { /* 무시 */ }
}
function taLoadGame(){
  try {
    const s = JSON.parse(localStorage.getItem(TA_SAVE_KEY) || "null");
    if (s && TA_STORY[s.node] && s.vars && typeof s.vars.sheep === "number") return s;
  } catch (e) { /* 무시 */ }
  return null;
}
function taClearSave(){ try { localStorage.removeItem(TA_SAVE_KEY); } catch (e) { /* 무시 */ } }

function taApply(delta, sign){
  if (!delta) return;
  for (const k in delta) ta.vars[k] = (ta.vars[k] || 0) + delta[k] * (sign || 1);
  taClampVars(ta.vars);
}

function taStart(fresh){
  ta.vars = Object.assign({}, TA_META.vars);
  ta.turnIdx = 0;
  ta.ckpt = null;
  $("ta-setup").style.display = "none";
  $("ta-play").style.display = "";
  taGo(TA_META.start);
}
function taContinue(){
  const s = taLoadGame();
  if (!s){ pwaToast("세이브가 없네…? 처음부터 가자"); taStart(true); return; }
  ta.vars = taClampVars(s.vars);
  ta.turnIdx = s.turnIdx || 0;
  ta.ckpt = s.ckpt || null;
  ta.nodeId = s.node;
  $("ta-setup").style.display = "none";
  $("ta-play").style.display = "";
  taRender(); /* 세이브 시점에 set 적용 완료 상태이므로 재적용 없이 렌더만 */
}

function taGo(id){
  const node = TA_STORY[id];
  if (!node) return;
  ta.nodeId = id;
  taApply(node.set);
  if (node.auto){
    const hit = node.auto.find((a) => !a.if || taCond(a.if, ta.vars));
    if (hit){ taGo(hit.goto); return; }
  }
  if (id === TA_META.checkpoint && !ta.ckpt){
    ta.ckpt = { vars: Object.assign({}, ta.vars), turnIdx: ta.turnIdx };
  }
  taRender();
}

function taRender(){
  const node = TA_STORY[ta.nodeId];
  const sp = TA_SP[node.sp] || TA_SP.narr;
  $("ta-port").innerHTML = '<px-sprite name="' + sp.spr + '" scale="4"></px-sprite>';
  $("ta-nm").textContent = sp.nm;
  $("ta-nm").style.display = sp.nm ? "" : "none";
  $("ta-text").textContent = node.text; /* 타자기 효과는 연출 턴에서 (prefs.tspeed 연동) */
  taHud();

  const box = $("ta-choices");
  box.innerHTML = "";
  const isEnd = TA_META.endings.includes(ta.nodeId);
  const bar = $("ta-turnbar");
  bar.style.display = "none";

  if (node.goto){
    const b = document.createElement("button");
    b.className = "btn ghost";
    b.innerHTML = '<span class="lb">▷ 계속</span>';
    b.addEventListener("click", () => { if (!ta.rolling) taGo(node.goto); });
    box.appendChild(b);
  } else if (node.choices){
    const visible = node.choices.filter((c) => !c.hideIf || !taCond(c.hideIf, ta.vars));
    if (!isEnd && roster.length){
      bar.style.display = "";
      bar.innerHTML = "이번 선택 담당: <b>" + escHtml(roster[ta.turnIdx % roster.length]) + "</b> · 파티와 상의해도 좋아";
    }
    visible.forEach((c) => {
      const b = document.createElement("button");
      b.className = "btn" + (c.check ? "" : " ghost");
      b.innerHTML = '<span class="lb">' + c.label + "</span>" +
        (c.check ? '<span class="ck">🎲 ' + c.check.stat + " " + c.check.dc + "</span>" : "");
      b.addEventListener("click", () => { if (!ta.rolling) taChoose(c); });
      box.appendChild(b);
    });
  }

  /* 진행 세이브 — 진엔딩류 도달 시엔 세이브 소멸(한 판 종료), 게임오버는 유지 */
  if (isEnd && ta.nodeId !== "end_go") taClearSave();
  else taSaveGame();
}

function taChoose(c){
  const fromEnd = TA_META.endings.includes(ta.nodeId);
  if (fromEnd){
    if (c.goto === TA_META.start){ taClearSave(); taStart(true); return; }
    if (c.goto === TA_META.checkpoint && ta.ckpt){
      ta.vars = Object.assign({}, ta.ckpt.vars);
      ta.turnIdx = ta.ckpt.turnIdx;
      taGo(c.goto);
      return;
    }
  }
  taApply(c.cost, -1);
  taApply(c.set);
  ta.turnIdx++;
  if (c.check) taRoll(c);
  else taGo(c.goto);
}

/* 판정: 스탯 + d6 ≥ dc. 연출 고도화(픽셀 주사위)는 텡그리 연출 턴에서 */
function taRoll(c){
  ta.rolling = true;
  const stat = c.check.stat, dc = c.check.dc, sv = ta.vars[stat] || 0;
  const d6 = 1 + Math.floor(Math.random() * 6);
  const ok = sv + d6 >= dc;
  $("ta-roll").style.display = "";
  $("ta-roll-tt").textContent = stat + " 판정 — 목표 " + dc + " (" + stat + " " + sv + " + 🎲)";
  const rs = $("ta-roll-rs");
  rs.textContent = "";
  rs.className = "ta-roll-rs";
  let tick = 0;
  const iv = setInterval(() => {
    $("ta-roll-num").textContent = 1 + Math.floor(Math.random() * 6);
    if (++tick >= 10){
      clearInterval(iv);
      $("ta-roll-num").textContent = d6;
      rs.textContent = sv + " + " + d6 + " = " + (sv + d6) + (ok ? " ≥ " + dc + " 성공!" : " < " + dc + " 실패…");
      rs.className = "ta-roll-rs " + (ok ? "ok" : "no");
      haptic(ok ? 20 : [40, 40, 40]);
      ta.timers.push(setTimeout(() => {
        $("ta-roll").style.display = "none";
        ta.rolling = false;
        taGo(ok ? c.ok : c.fail);
      }, 1300));
    }
  }, 70);
  ta.timers.push(iv);
}

function taHud(){
  const v = ta.vars;
  $("ta-hud").innerHTML =
    ["용기", "지혜", "인심"].map((k) => '<span class="st">' + k + " <b>" + v[k] + "</b></span>").join("") +
    '<span class="st">🐑 <b>' + v.sheep + '</b></span>' +
    '<span class="st">⭐ <b>' + v.star + "</b>/3</span>" +
    (v.charm ? '<span class="st">🧿 부적</span>' : "");
}

function taReset(){
  ta.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  ta.timers = [];
  ta.rolling = false;
  $("ta-roll").style.display = "none";
  $("ta-play").style.display = "none";
  $("ta-setup").style.display = "";
  $("ta-party").innerHTML = roster.length
    ? roster.map((n) => '<span class="pn">' + escHtml(n) + "</span>").join("")
    : '<span class="empty">설정(⚙️)에서 일행을 먼저 등록해줘!</span>';
  $("ta-continue").style.display = taLoadGame() ? "" : "none";
}
$("ta-new").addEventListener("click", () => {
  if (taLoadGame()){
    mbAsk("🌠", "처음부터 다시 떠날까?", "지난 여정 세이브는 사라져",
      "새로 떠나기", "이어하기로 갈래",
      () => { taClearSave(); taStart(true); }, () => taContinue());
    return;
  }
  taStart(true);
});
$("ta-continue").addEventListener("click", taContinue);
snRegisterGame("ta", taReset);
