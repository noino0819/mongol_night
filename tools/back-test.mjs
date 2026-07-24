/* 뒤로가기 스택 단위 테스트 — shell.js의 실제 소스를 잘라와 가짜 DOM/history로 돌린다.
   실행:  node tools/back-test.mjs   */
import fs from "fs";
import assert from "assert";

const shell = fs.readFileSync(new URL("../shell.js", import.meta.url), "utf8");
const from = shell.indexOf("const snBack = {");
const to = shell.indexOf("\n});", shell.indexOf('window.addEventListener("popstate"')) + 4;
assert.ok(from > 0 && to > from, "shell.js에서 뒤로가기 블록을 못 찾음");
const SRC = shell.slice(from, to);

/* ---- 가짜 환경 ---- */
function el(opts){
  const e = Object.assign({ shown: true, clicked: 0 }, opts);
  e.getClientRects = () => (e.shown ? [{}] : []);
  e.click = () => { e.clicked++; if (e.onClick) e.onClick(); };
  return e;
}
function env(scene){
  /* scene: { sel -> [element] } · 셀렉터 문자열 그대로 매칭 (상태머신 검증용) */
  const popped = [];
  let handler = null;
  const history = {
    depth: 0, pushes: 0, backs: 0,
    pushState(){ this.depth++; this.pushes++; },
    back(){ this.depth--; this.backs++; if (handler) handler(); }
  };
  const document = {
    querySelectorAll: (sel) => scene[sel] || [],
    querySelector: (sel) => (scene[sel] || [])[0] || null
  };
  const window = { addEventListener: (t, fn) => { if (t === "popstate") handler = fn; } };
  const $ = (id) => scene["#" + id] || null;
  const ob = { page: 0 };
  const api = new Function("document", "history", "window", "$", "ob",
    SRC + "\nreturn { snBack, snBackSync, snBackClose };")(document, history, window, $, ob);
  return Object.assign(api, { history, document, scene, ob, press: () => handler(), popped });
}

function scene(opts){
  opts = opts || {};
  const home = { classList: { contains: (c) => c === "on" && !!opts.home } };
  const back = el({});
  const s = {
    "#scr-home": home,
    "#onboard": el({ shown: false }),
    "#coach": el({ shown: false }),
    "#ob-prev": el({}),
    "#coach-ok": el({}),
    ".screen.on": [{ querySelector: (sel) => (sel === "[data-back]" ? s.inner : null) }],
    ".screen.on .back[data-go]": [back]
  };
  s.back = back;
  s.home = home;
  s.setHome = (v) => { opts.home = v; };
  return s;
}

/* 1) 홈에선 아무것도 물지 않는다 → 뒤로가기 = 브라우저 기본(종료) */
{
  const s = scene({ home: true });
  const t = env(s);
  t.snBackSync();
  assert.equal(t.snBack.armed, false);
  assert.equal(t.history.pushes, 0);
}

/* 2) 게임 진입 = 엔트리 1개 물기 → 뒤로가기 1번에 '← 홈' 클릭 → 반납 없이 정리 */
{
  const s = scene({ home: false });
  const t = env(s);
  t.snBackSync();
  assert.equal(t.history.pushes, 1);
  s.back.onClick = () => { s.setHome(true); t.snBackSync(); };   /* 실제 go("home") 경로 흉내 */
  t.press();
  assert.equal(s.back.clicked, 1);
  assert.equal(t.snBack.armed, false);
  assert.equal(t.history.pushes, 1, "홈 복귀 후 재무장하면 안 됨");
  assert.equal(t.history.backs, 0, "이미 소비된 엔트리를 또 반납하면 안 됨");
}

/* 3) 게임 안쪽 레이어(data-back)가 열려 있으면 그것만 닫고 화면은 유지 → 다시 문다 */
{
  const s = scene({ home: false });
  const t = env(s);
  t.snBackSync();
  s.inner = el({});
  t.press();
  assert.equal(s.inner.clicked, 1);
  assert.equal(s.back.clicked, 0, "안쪽 레이어가 있으면 홈으로 나가면 안 됨");
  assert.equal(t.snBack.armed, true);
  assert.equal(t.history.pushes, 2, "닫은 뒤 엔트리를 다시 물어야 함");
}

/* 4) 모달은 노드 제거가 아니라 취소(.ghost) 버튼을 실제로 누른다 */
{
  const s = scene({ home: false });
  const cancel = el({}), ok = el({});
  s[".life-modal"] = [{ shown: true, getClientRects: () => [{}],
    querySelector: () => ({ querySelector: (q) => (q === "button.ghost" ? cancel : ok) }) }];
  const t = env(s);
  t.snBackSync();
  t.press();
  assert.equal(cancel.clicked, 1);
  assert.equal(ok.clicked, 0);
  assert.equal(s.back.clicked, 0);
}

/* 5) 폰 전달 가림막·카운트다운 중엔 삼킨다 (비밀 노출·연출 스킵 방지) */
{
  const s = scene({ home: false });
  s[".splash, .pc-ov, .cd-ov, .ta-roll, .mp-poke"] = [el({})];
  const t = env(s);
  t.snBackSync();
  t.press();
  assert.equal(s.back.clicked, 0);
  assert.equal(t.snBack.armed, true);
}
/* 5b) 같은 셀렉터라도 숨어 있는 노드(#ta-roll은 상시 DOM)면 삼키지 않는다 */
{
  const s = scene({ home: false });
  s[".splash, .pc-ov, .cd-ov, .ta-roll, .mp-poke"] = [el({ shown: false })];
  const t = env(s);
  t.snBackSync();
  t.press();
  assert.equal(s.back.clicked, 1);
}

/* 6) 상단 '← 홈' 버튼으로 나가면 물어둔 엔트리를 반납하고, 그때 오는 popstate는 무시한다 */
{
  const s = scene({ home: false });
  const t = env(s);
  t.snBackSync();
  s.setHome(true);
  t.snBackSync();
  assert.equal(t.history.backs, 1);
  assert.equal(t.snBack.armed, false);
  assert.equal(s.back.clicked, 0, "자기가 부른 back을 다시 처리하면 안 됨");
  assert.equal(t.history.depth, 0);
}

/* 7) 온보딩: 2페이지면 이전 페이지로, 첫 페이지면 삼킴 */
{
  const s = scene({ home: true });
  s["#onboard"] = el({ shown: true });
  const t = env(s);
  t.ob.page = 2;
  t.snBackSync();
  assert.equal(t.snBack.armed, true, "온보딩도 한 겹으로 친다");
  t.press();
  assert.equal(s["#ob-prev"].clicked, 1);
  t.ob.page = 0;
  t.press();
  assert.equal(s["#ob-prev"].clicked, 1);
  assert.equal(s.back.clicked, 0);
}

console.log("back-test OK — 7 cases");
