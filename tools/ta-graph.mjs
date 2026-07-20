// ============================================================
// "고비의 별" 스토리 그래프 스켈레톤 (M4 설계 산출물)
// - note: 노드 내용 요약 (실제 text는 저작 턴에서 90자 이내로 집필)
// - 스키마: docs/초원의밤_v2_스케일업기획서.md 4-3 + 설계 문서의 확장 3종
//   (auto 조건 분기 / choice 레벨 set / fails 카운터)
// - set·cost는 델타(음수=차감). 스탯 0~5, sheep 0 이상으로 엔진이 클램프.
// ============================================================

export const TA_META = {
  start: "p_01",
  checkpoint: "c3_01", // 진입 시 상태 스냅샷 저장 → 게임오버 재시작 지점
  endings: ["end_star", "end_sheep", "end_wander", "end_go"],
  vars: { 용기: 2, 지혜: 2, 인심: 2, sheep: 5, star: 0, charm: 0, fails: 0 },
};

export const TA_GRAPH = {
  // ---------- 프롤로그 (7) ----------
  p_01: { sp: "narr", note: "여행 첫날 밤, 게르 캠프. 쏟아지는 별", goto: "p_02" },
  p_02: { sp: "narr", note: "별똥별이 고비 쪽으로 떨어짐. 소원 개그", goto: "p_03" },
  p_03: { sp: "tengri", note: "별 늑대 정령 텡그리 등장. '고비의 별을 주워 와라, 인간들'", goto: "p_04" },
  p_04: { sp: "tengri", note: "규칙 설명: 스탯 3종·양 5마리·사흘. '파티와 상의해도 좋다'", goto: "p_05" },
  p_05: {
    sp: "narr", note: "출발 준비 — 스탯 배분 다수결",
    choices: [
      { label: "말을 타고 질주한다 (용기+1)", set: { 용기: 1 }, goto: "p_06" },
      { label: "별자리로 길을 잡는다 (지혜+1)", set: { 지혜: 1 }, goto: "p_06" },
      { label: "유목민에게 길을 묻는다 (인심+1)", set: { 인심: 1 }, goto: "p_06" },
    ],
  },
  p_06: { sp: "tengri", note: "'…제법이군.' + 양 5마리 이름 소개 개그", goto: "p_07" },
  p_07: { sp: "tengri", note: "'별의 기운이 셋으로 갈라졌다. 사흘, 세 조각.'", goto: "c1_01" },

  // ---------- 1장 첫째 날 — 초원의 흔적 (25) ----------
  c1_01: {
    sp: "narr", note: "초원. 멀리 게르의 연기 vs 하늘의 독수리",
    choices: [
      { label: "독수리를 따라간다", goto: "c1_02" },
      { label: "게르로 간다", goto: "c1_09" },
    ],
  },
  // A. 독수리 사냥꾼 루트
  c1_02: {
    sp: "narr", note: "말 달리는 독수리 사냥꾼 — 따라잡기",
    choices: [{ label: "말을 몰아 추격한다", check: { stat: "용기", dc: 5 }, ok: "c1_03", fail: "c1_04" }],
  },
  c1_03: { sp: "npc_hunter", note: "사냥꾼 감탄, 동행 허락", goto: "c1_05" },
  c1_04: { sp: "narr", note: "낙마 개그 — 양들이 비웃음. 걸어서 합류", goto: "c1_05" },
  c1_05: {
    sp: "npc_hunter", note: "'지난밤 빛은 협곡에 떨어졌다' + 독수리 훈련 제안",
    choices: [
      { label: "독수리를 받아본다", check: { stat: "용기", dc: 6 }, ok: "c1_06", fail: "c1_07" },
      { label: "정중히 사양한다", goto: "c1_07" },
    ],
  },
  c1_06: { sp: "narr", note: "독수리가 어깨에! (용기+1) 지름길 정보", set: { 용기: 1 }, goto: "c1_08" },
  c1_07: { sp: "narr", note: "머리 쪼임/사양 — 사냥꾼이 웃으며 길만 알려줌", goto: "c1_08" },
  c1_08: { sp: "narr", note: "협곡으로 출발, 언덕 위 오보 발견", goto: "c1_17" },
  // B. 유목민 게르 루트
  c1_09: { sp: "npc_family", note: "유목민 가족, 아이락 대접 — 시큼함 개그", goto: "c1_10" },
  c1_10: {
    sp: "npc_family", note: "'빛? 협곡 쪽.' 주인장이 샤가이 대결 제안",
    choices: [
      { label: "대결을 받는다", goto: "c1_11" },
      { label: "사양한다", goto: "c1_14" },
    ],
  },
  c1_11: {
    sp: "narr", note: "[크로스오버] 샤가이 대결 = 대표자 실제 가위바위보 (자가 신고)",
    choices: [
      { label: "이겼다!", goto: "c1_12" },
      { label: "졌다…", goto: "c1_13" },
    ],
  },
  c1_12: { sp: "npc_family", note: "승리! 양 1마리 획득, 주인장 호탕 웃음", set: { sheep: 1 }, goto: "c1_15" },
  c1_13: { sp: "narr", note: "패배했지만 깨끗하게 승복 (인심+1)", set: { 인심: 1 }, goto: "c1_15" },
  c1_14: {
    sp: "narr", note: "주인장 서운. 분위기 풀기",
    choices: [{ label: "진심으로 사정을 말한다", check: { stat: "인심", dc: 6 }, ok: "c1_15", fail: "c1_16" }],
  },
  c1_15: { sp: "npc_family", note: "가족이 양 2마리 선물 + 협곡 지름길 정보", set: { sheep: 2 }, goto: "c1_17" },
  c1_16: { sp: "narr", note: "길 정보만 대충. 양들이 아이락 훔쳐 마심 개그", goto: "c1_17" },
  // 합류 — 오보
  c1_17: {
    sp: "tengri", note: "언덕 위 오보. '…돌 세 바퀴, 알고 있겠지.'",
    choices: [
      { label: "🐑 양 1마리를 바친다", cost: { sheep: 1 }, hideIf: "sheep<1", goto: "c1_18" },
      { label: "돌만 얹고 세 바퀴 돈다", goto: "c1_19" },
    ],
  },
  c1_18: {
    sp: "narr", note: "바람이 응답한다 — '무엇을 원하나'",
    choices: [
      { label: "담대함을 (용기+1)", set: { 용기: 1 }, goto: "c1_20" },
      { label: "밝은 눈을 (지혜+1)", set: { 지혜: 1 }, goto: "c1_20" },
      { label: "따뜻한 마음을 (인심+1)", set: { 인심: 1 }, goto: "c1_20" },
    ],
  },
  c1_19: { sp: "tengri", note: "무난한 참배. '…쩨쩨하군.' 개그", goto: "c1_20" },
  c1_20: { sp: "narr", note: "해질녘 협곡 도착. 바닥에 빛나는 흔적", goto: "c1_21" },
  c1_21: {
    sp: "narr", note: "좁은 바위틈 아래 첫 번째 별조각!",
    choices: [
      { label: "뛰어내려 줍는다", check: { stat: "용기", dc: 6 }, ok: "c1_22", fail: "c1_23" },
      { label: "별자리로 안전한 길을 찾는다", check: { stat: "지혜", dc: 6 }, ok: "c1_22", fail: "c1_23" },
    ],
  },
  c1_22: { sp: "tengri", note: "별조각 1 획득! '…첫 조각. 제법이야.'", set: { star: 1 }, goto: "c1_25" },
  c1_23: {
    sp: "narr", note: "미끄러짐! 조각이 더 깊이. 어두워지기 전 마지막 시도",
    choices: [
      { label: "밧줄을 엮어 내려간다", check: { stat: "지혜", dc: 7 }, ok: "c1_22", fail: "c1_24" },
      { label: "🐑 양 1마리로 협곡 여우에게 부탁", cost: { sheep: 1 }, hideIf: "sheep<1", goto: "c1_22" },
    ],
  },
  c1_24: { sp: "tengri", note: "조각 상실. '…둘째 날에 만회해라.' (fails+1)", set: { fails: 1 }, goto: "c1_25" },
  c1_25: { sp: "narr", note: "밤 캠프. 첫째 날 마무리 (자동 세이브 안내)", goto: "c2_01" },

  // ---------- 2장 둘째 날 — 모래폭풍의 밤 (31) ----------
  c2_01: { sp: "narr", note: "초원이 끝나고 모래의 시작. 양들 더위 개그", goto: "c2_02" },
  c2_02: { sp: "tengri", note: "'둘째 조각은 사막 한가운데. 오늘 밤 바람이 사납다.'", goto: "c2_03" },
  c2_03: {
    sp: "narr", note: "갈림길",
    choices: [
      { label: "사구를 직행한다 (빠르지만 험함)", goto: "c2_04" },
      { label: "우물을 경유한다 (멀지만 안전)", goto: "c2_08" },
    ],
  },
  c2_04: {
    sp: "narr", note: "타는 태양 아래 사구 넘기",
    choices: [{ label: "이 악물고 오른다", check: { stat: "용기", dc: 6 }, ok: "c2_05", fail: "c2_06" }],
  },
  c2_05: { sp: "narr", note: "씩씩하게 주파 (용기+1). 마트 신기루 개그", set: { 용기: 1 }, goto: "c2_07" },
  c2_06: { sp: "narr", note: "일사병 직전 — 양 그늘에서 쉬어감. 시간 손실", goto: "c2_07" },
  c2_07: { sp: "narr", note: "모래 바다 한가운데로", goto: "c2_12" },
  c2_08: { sp: "narr", note: "오아시스 우물. 낙타 새끼 개그", goto: "c2_09" },
  c2_09: {
    sp: "narr", note: "우물 바닥에 뭔가 반짝?",
    choices: [{ label: "들여다본다", check: { stat: "지혜", dc: 5 }, ok: "c2_10", fail: "c2_11" }],
  },
  c2_10: { sp: "narr", note: "고대 샤가이 유물 발견 (지혜+1)", set: { 지혜: 1 }, goto: "c2_11" },
  c2_11: { sp: "narr", note: "물 든든히 챙기고 출발", goto: "c2_12" },
  c2_12: {
    sp: "npc_trader", note: "낙타 카라반 상인. '조각? 폭풍 언덕에서 봤지.' 폭풍 부적 판매",
    choices: [
      { label: "🐑 2마리로 부적을 산다", cost: { sheep: 2 }, hideIf: "sheep<2", goto: "c2_13" },
      { label: "흥정한다", check: { stat: "인심", dc: 7 }, ok: "c2_14", fail: "c2_15" },
      { label: "길만 묻고 간다", goto: "c2_15" },
    ],
  },
  c2_13: { sp: "narr", note: "폭풍 부적 획득", set: { charm: 1 }, goto: "c2_15" },
  c2_14: { sp: "npc_trader", note: "흥정 성공 — 🐑 1마리에 부적 획득", set: { sheep: -1, charm: 1 }, goto: "c2_15" },
  c2_15: {
    sp: "npc_trader", note: "상인의 부탁: '별자리로 길을 잡아주면 양 2마리 주지'",
    choices: [
      { label: "맡는다", check: { stat: "지혜", dc: 6 }, ok: "c2_16", fail: "c2_17" },
      { label: "갈 길이 멀다, 사양", goto: "c2_18" },
    ],
  },
  c2_16: { sp: "npc_trader", note: "정확한 길 안내 — 사례로 양 2마리!", set: { sheep: 2 }, goto: "c2_18" },
  c2_17: { sp: "narr", note: "길 틀림 개그. 상인이 그래도 육포는 줌", goto: "c2_18" },
  c2_18: { sp: "npc_family2", note: "해질녘 게르 — 1장 가족의 친척! 저녁 대접", goto: "c2_19" },
  c2_19: {
    sp: "narr", note: "[크로스오버] 마두금의 밤 — 텔레파시: 전원 동시에 같은 별 지목 (자가 신고)",
    choices: [
      { label: "통했다!", goto: "c2_20" },
      { label: "제각각…", goto: "c2_21" },
    ],
  },
  c2_20: { sp: "npc_family2", note: "소녀가 웃으며 양 1마리 선물 (인심+1)", set: { sheep: 1, 인심: 1 }, goto: "c2_22" },
  c2_21: { sp: "narr", note: "전원 다른 별 지목 개그. 그래도 즐거운 밤", goto: "c2_22" },
  c2_22: { sp: "tengri", note: "자정, 개들이 짖는다. '…조각이 폭풍 한가운데서 운다. 지금이다.'", goto: "c2_23" },
  c2_23: {
    sp: "narr", note: "모래폭풍이 다가온다… (기획서 예시 노드)",
    choices: [
      { label: "정면 돌파, 말을 달린다", check: { stat: "용기", dc: 7 }, ok: "c2_25", fail: "c2_26" },
      { label: "바람 결을 읽어 틈으로", check: { stat: "지혜", dc: 6 }, ok: "c2_25", fail: "c2_26" },
      { label: "🐑 1마리로 유목민 길잡이 부탁", cost: { sheep: 1 }, hideIf: "sheep<1", goto: "c2_24" },
    ],
  },
  c2_24: { sp: "npc_family2", note: "노인이 낙타로 안내 — 안전하게 폭풍 진입", goto: "c2_27" },
  c2_25: { sp: "narr", note: "폭풍 돌파 성공! (부적 보유 시 연출 강화)", goto: "c2_27" },
  c2_26: {
    sp: "narr", note: "휩쓸림! 양 1마리를 잃고 모래 둔덕 뒤로 (sheep-1)",
    set: { sheep: -1 },
    choices: [
      { label: "폭풍의 틈으로 재돌진", check: { stat: "용기", dc: 6 }, ok: "c2_27", fail: "c2_28" },
      { label: "포기하고 대피한다", goto: "c2_28" },
    ],
  },
  c2_27: {
    sp: "narr", note: "폭풍의 눈 — 회오리 꼭대기에 둘째 조각",
    choices: [
      { label: "인간 탑을 쌓는다 (전원 협동)", check: { stat: "인심", dc: 6 }, ok: "c2_29", fail: "c2_28" },
      { label: "부적을 던진다", hideIf: "charm<1", goto: "c2_29" },
      { label: "말 등에서 점프", check: { stat: "용기", dc: 7 }, ok: "c2_29", fail: "c2_28" },
    ],
  },
  c2_28: { sp: "tengri", note: "조각이 모래에 매몰. '…모래가 삼켰군.' (fails+1)", set: { fails: 1 }, goto: "c2_30" },
  c2_29: { sp: "narr", note: "별조각 2 획득! 폭풍이 거짓말처럼 잦아듦", set: { star: 1 }, goto: "c2_30" },
  c2_30: { sp: "npc_family2", note: "새벽 귀환, 가족 안도. 쪽잠", goto: "c2_31" },
  c2_31: { sp: "tengri", note: "'…마지막 날이다. 별이 떨어진 크레이터로.' (자동 세이브)", goto: "c3_01" },

  // ---------- 3장 셋째 날 — 늑대의 시험 (33) ----------
  c3_01: { sp: "narr", note: "[체크포인트] 크레이터 능선. 아래에 빛, 늑대 울음", goto: "c3_02" },
  c3_02: { sp: "narr", note: "늑대 무리가 크레이터를 지킴. 텡그리가 이상하게 조용함 → 거대한 흰 늑대왕 등장", goto: "c3_03" },
  c3_03: {
    sp: "npc_wolfking", note: "'별은 하늘의 것. 인간이 왜 왔나.'",
    choices: [
      { label: "당당히 요구한다", check: { stat: "용기", dc: 6 }, ok: "c3_04", fail: "c3_05" },
      { label: "정중히 사정을 말한다", check: { stat: "인심", dc: 6 }, ok: "c3_04", fail: "c3_05" },
      { label: "🐑 2마리를 예물로 바친다", cost: { sheep: 2 }, hideIf: "sheep<2", goto: "c3_04" },
    ],
  },
  c3_04: { sp: "npc_wolfking", note: "'…재밌군. 시험을 받아라.'", goto: "c3_08" },
  c3_05: {
    sp: "narr", note: "쫓겨남. 모래에 빠진 새끼 늑대 발견",
    choices: [
      { label: "새끼를 구한다", goto: "c3_06" },
      { label: "몰래 크레이터로 침입한다", goto: "c3_07" },
    ],
  },
  c3_06: { sp: "npc_wolfking", note: "구출 (인심+1). '…빚을 졌군. 시험을 허하지.'", set: { 인심: 1 }, goto: "c3_08" },
  c3_07: {
    sp: "narr", note: "밤까지 숨었다가 잠입 시도",
    choices: [
      { label: "숨을 죽이고 이동한다", check: { stat: "지혜", dc: 7 }, ok: "c3_09", fail: "c3_10" },
      { label: "역시 새끼부터 구한다", goto: "c3_06" },
    ],
  },
  c3_08: { sp: "npc_wolfking", note: "시험 개막 — '세 가지를 본다. 담력, 눈, 그리고 마음.'", goto: "c3_11" },
  c3_09: { sp: "narr", note: "별 앞까지 갔지만 별이 스스로 늑대왕을 불러버림 개그 → 시험행", goto: "c3_08" },
  c3_10: { sp: "narr", note: "목덜미 물려 끌려옴. '…겁쟁이 방식이군' → 시험행", goto: "c3_08" },
  // 시험1 — 담력 (크로스오버: 눈싸움)
  c3_11: {
    sp: "npc_wolfking", note: "[크로스오버] 시험1 눈싸움 — 담당자가 옆사람과 실제 눈싸움 (웃거나 깜빡이면 패)",
    choices: [
      { label: "이겼다!", goto: "c3_12" },
      { label: "졌다…", goto: "c3_13" },
    ],
  },
  c3_12: { sp: "npc_wolfking", note: "'담력은 합격.'", goto: "c3_15" },
  c3_13: {
    sp: "narr", note: "눈싸움 패배 — 그래도 물러서지 않는다",
    choices: [{ label: "다리를 떨면서도 버틴다", check: { stat: "용기", dc: 6 }, ok: "c3_12", fail: "c3_14" }],
  },
  c3_14: { sp: "narr", note: "굴욕 — 양이 대신 늑대왕을 노려봄 개그. '네 양이 너보다 낫군' (fails+1)", set: { fails: 1 }, goto: "c3_15" },
  // 시험2 — 눈 (셋째 조각이 걸린 시험)
  c3_15: {
    sp: "npc_wolfking", note: "시험2 — 세 개의 빛 중 진짜 별조각 고르기 (셋째 조각!)",
    choices: [{ label: "찬찬히 살핀다", check: { stat: "지혜", dc: 6 }, ok: "c3_16", fail: "c3_17" }],
  },
  c3_16: { sp: "npc_wolfking", note: "정답! 별조각 3 획득. 늑대왕 눈이 가늘어짐", set: { star: 1 }, goto: "c3_19" },
  c3_17: {
    sp: "narr", note: "가짜(모래 유리)가 부서지며 늑대들 웃음. 한 번 더 기회",
    choices: [{ label: "별자리 지식 총동원", check: { stat: "지혜", dc: 7 }, ok: "c3_16", fail: "c3_18" }],
  },
  c3_18: { sp: "npc_wolfking", note: "'눈은 아직 어리군.' 셋째 조각 상실 (fails+1)", set: { fails: 1 }, goto: "c3_19" },
  // 시험3 — 마음
  c3_19: {
    sp: "npc_wolfking", note: "시험3 — '별을 되찾으면 소원이 이뤄진다. 누구를 위해 쓸 건가.'",
    choices: [
      { label: "우리 일행의 무사귀환", goto: "c3_20" },
      { label: "양들이 배불리 (복선 개그)", goto: "c3_20" },
      { label: "여기서 만난 유목민 가족들", goto: "c3_20" },
    ],
  },
  c3_20: {
    sp: "npc_wolfking", note: "늑대왕이 마음을 읽는다",
    choices: [{ label: "눈을 똑바로 본다", check: { stat: "인심", dc: 6 }, ok: "c3_21", fail: "c3_22" }],
  },
  c3_21: { sp: "npc_wolfking", note: "'…마음은 진짜군.'", goto: "c3_23" },
  c3_22: { sp: "npc_wolfking", note: "'…절반만 진심이군.' 뜨끔 개그 (fails+1)", set: { fails: 1 }, goto: "c3_23" },
  c3_23: { sp: "npc_wolfking", note: "시험 종료. '내려가라. 다만 별을 지키는 건 우리가 아니다.'", goto: "c3_24" },
  // 최종 시퀀스 (게임오버 존)
  c3_24: { sp: "narr", note: "크레이터 중심 — 별 본체. 검은 모래 회오리 '별의 그림자' 각성", goto: "c3_25" },
  c3_25: {
    sp: "narr", note: "그림자 늑대 습격!",
    choices: [
      { label: "정면으로 맞선다", check: { stat: "용기", dc: 7 }, ok: "c3_27", fail: "c3_26" },
      { label: "폭풍 부적을 꺼낸다", hideIf: "charm<1", goto: "c3_27" },
    ],
  },
  c3_26: {
    sp: "narr", note: "쓰러지기 직전 — 마지막 한 수",
    choices: [{ label: "전원이 손을 잡고 버틴다", check: { stat: "인심", dc: 7 }, ok: "c3_27", fail: "end_go" }],
  },
  c3_27: { sp: "tengri", note: "텡그리가 몸을 던져 그림자를 붙든다. '…지금이다, 인간들!'", goto: "c3_28" },
  c3_28: {
    sp: "narr", note: "[게이트1] 양떼 체크",
    auto: [
      { if: "sheep>=10", goto: "c3_29" },
      { goto: "c3_30" },
    ],
  },
  c3_29: {
    sp: "narr", note: "🐑 열 마리의 양떼가 너를 바라본다…",
    choices: [
      { label: "별은 하늘에 두고, 양떼와 초원에 남는다", goto: "end_sheep" },
      { label: "그래도 별을 줍는다", goto: "c3_30" },
    ],
  },
  c3_30: {
    sp: "narr", note: "[게이트2] 별 복원 평가",
    auto: [
      { if: "star>=3 && (용기+지혜+인심)>=9", goto: "c3_33" },
      { if: "star>=2", goto: "c3_31" },
      { goto: "c3_32" },
    ],
  },
  c3_31: {
    sp: "tengri", note: "담판 — '잃어버린 조각의 기억을, 너희의 이야기로 채워라.'",
    choices: [{ label: "사흘의 여정을 이야기한다", check: { stat: "지혜", dc: 7 }, ok: "c3_33", fail: "c3_32" }],
  },
  c3_32: { sp: "narr", note: "별이 다시 하늘로 흩어짐 — 방랑의 시작 (fails 수에 따라 연출 분기)", goto: "end_wander" },
  c3_33: { sp: "tengri", note: "별 복원! 텡그리의 정체 = 별을 지키는 수호 늑대 정령. 소원 연출", goto: "end_star" },

  // ---------- 엔딩 (4) ----------
  end_star: {
    sp: "tengri", note: "⭐ 진엔딩 — 별이 하늘로 돌아가고 텡그리가 작별. '…또 떨어지면, 부탁하지.'",
    choices: [{ label: "처음부터 다시", goto: "p_01" }],
  },
  end_sheep: {
    sp: "narr", note: "🐑 목동엔딩 — 전설의 목동이 된 일행. 텡그리 어이없어하며 축복",
    choices: [{ label: "처음부터 다시", goto: "p_01" }],
  },
  end_wander: {
    sp: "narr", note: "🌪️ 방랑엔딩 — 별을 놓쳤지만 바람이 된 여행자들. 유쾌한 후일담",
    choices: [{ label: "처음부터 다시", goto: "p_01" }],
  },
  end_go: {
    sp: "narr", note: "💀 게임오버 — 그림자에 삼켜짐. 텡그리가 시간을 되감음",
    choices: [
      { label: "체크포인트에서 다시 (셋째 날 아침)", goto: "c3_01" },
      { label: "처음부터 다시", goto: "p_01" },
    ],
  },
};
