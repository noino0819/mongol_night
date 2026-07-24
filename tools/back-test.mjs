/* 뒤로가기 스택 + 화면 이탈 정리 단위 테스트 — shell.js의 실제 소스를 잘라와
   가짜 DOM/history로 돌린다.   실행:  node tools/back-test.mjs   */
import fs from "fs";
import assert from "assert";

const shell = fs.readFileSync(new URL("../shell.js", import.meta.url), "utf8");
const from = shell.indexOf("function snLeave(");
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
function env(scene, extra){
  let handler = null;
  const log = { toasts: [], bgmStops: 0, resets: [] };
  const history = {
    depth: 0, pushes: 0,
    pushState(){ this.depth++; this.pushes++; },
    back(){ this.depth--; if (handler) handler(); }        /* 사용자가 뒤로가기를 누른 것과 동일 */
  };
  const document = {
    querySelectorAll: (sel) => scene[sel] || [],
    querySelector: (sel) => (scene[sel] || [])[0] || null
  };
  const window = { addEventListener: (t, fn) => { if (t === "popstate") handler = fn; } };
  const $ = (id) => scene["#" + id] || null;
  const ob = { page: 0 };
  const SN_RESETS = Object.assign({}, extra && extra.resets);
  Object.keys(SN_RESETS).forEach((k) => {
    const fn = SN_RESETS[k];
    SN_RESETS[k] = () => { log.resets.push(k); if (fn !== true) fn(); };
  });
  const api = new Function("document", "history", "window", "$", "ob", "SN_RESETS", "snBgmStop", "pwaToast", "haptic",
    SRC + "\nreturn { snBack, snBackSync, snBackClose, snLeave };")(
    document, history, window, $, ob, SN_RESETS,
    () => { log.bgmStops++; }, (m) => log.toasts.push(m), () => {});
  return Object.assign(api, { history, scene, ob, log, press: () => handler() });
}
function scene(opts){
  opts = opts || {};
  const back = el({});
  const s = {
    "#scr-home": { classList: { contains: (c) => c === "on" && !!opts.home } },
    "#onboard": el({ shown: false }),
    "#coach": el({ shown: false }),
    "#ob-prev": el({}),
    "#coach-ok": el({}),
    ".screen.on": [{ querySelector: (sel) => (sel === "[data-back]" ? s.inner : null) }],
    ".screen.on .back[data-go]": opts.home ? [] : [back]      /* 홈엔 '← 홈' 버튼이 없다 */
  };
  s.back = back;
  s.goHome = () => { s[".screen.on .back[data-go]"] = []; };
  return s;
}

/* 1) 게임 화면: 뒤로가기 1번 = '← 홈' 클릭, 앱은 안 꺼지고 엔트리를 다시 문다 */
{
  const s = scene({ home: false });
  const t = env(s);
  t.snBackSync();
  assert.equal(t.history.pushes, 1);
  s.back.onClick = () => { s.goHome(); t.snBackSync(); };    /* 실제 go("home") 경로 흉내 */
  t.press();
  assert.equal(s.back.clicked, 1);
  assert.equal(t.snBack.armed, true, "홈에서도 한 겹 물고 있어야 홈 가드가 걸린다");
  assert.equal(t.log.toasts.length, 0);
}

/* 2) 홈 가드: 첫 뒤로가기는 경고만, 엔트리는 안 문다 → 다음 한 번이 진짜 종료 */
{
  const s = scene({ home: true });
  const t = env(s);
  t.snBackSync();
  t.press();
  assert.match(t.log.toasts[0], /한 번 더/);
  assert.equal(t.snBack.armed, false, "경고 뒤엔 놔줘야 다음 뒤로가기가 앱을 닫는다");
  assert.ok(t.snBack.exitTimer, "2초 뒤 재무장 예약");
  clearTimeout(t.snBack.exitTimer);
}
/* 2b) 종료 대기 중에 앱을 계속 쓰면(화면 이동) 가드가 되살아난다 */
{
  const s = scene({ home: true });
  const t = env(s);
  t.snBackSync();
  t.press();
  const pushes = t.history.pushes;
  t.snBackSync();                                            /* go()가 부르는 것 */
  assert.equal(t.snBack.armed, true);
  assert.equal(t.snBack.exitTimer, 0, "종료 대기 취소");
  assert.equal(t.history.pushes, pushes + 1);
}

/* 3) 게임 안쪽 레이어(data-back)가 열려 있으면 그것만 닫고 화면은 유지 */
{
  const s = scene({ home: false });
  const t = env(s);
  t.snBackSync();
  s.inner = el({});
  t.press();
  assert.equal(s.inner.clicked, 1);
  assert.equal(s.back.clicked, 0, "안쪽 레이어가 있으면 홈으로 나가면 안 됨");
  assert.equal(t.history.pushes, 2, "닫은 뒤 엔트리를 다시 물어야 함");
}

/* 4) 모달은 노드 제거가 아니라 취소(.ghost) 버튼을 실제로 누른다 (콜백 안 돌면 게임이 멈춤) */
{
  const s = scene({ home: false });
  const cancel = el({}), ok = el({});
  s[".life-modal"] = [{ getClientRects: () => [{}],
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

/* 6) 온보딩: 2페이지면 이전 페이지로, 첫 페이지면 삼킴 */
{
  const s = scene({ home: true });
  s["#onboard"] = el({ shown: true });
  const t = env(s);
  t.snBackSync();
  t.ob.page = 2;
  t.press();
  assert.equal(s["#ob-prev"].clicked, 1);
  t.ob.page = 0;
  t.press();
  assert.equal(s["#ob-prev"].clicked, 1);
  assert.equal(t.log.toasts.length, 0, "온보딩 중엔 종료 경고가 뜨면 안 됨");
}

/* 7) 화면 이탈 정리: 떠나는 게임의 리셋(타이머·카메라)과 배경음을 끈다 */
{
  const t = env(scene({ home: false }), { resets: { bomb: true, forehead: true } });
  t.snLeave("bomb", "home");
  assert.deepEqual(t.log.resets, ["bomb"]);
  assert.equal(t.log.bgmStops, 1);
}
/* 7b) 같은 화면 재진입·mp는 리셋하지 않는다 (mp 리셋은 mpEnter = 입장) */
{
  const t = env(scene({ home: false }), { resets: { bomb: true, mp: true } });
  t.snLeave("bomb", "bomb");
  t.snLeave("mp", "bomb");
  t.snLeave(null, "bomb");
  assert.deepEqual(t.log.resets, []);
  assert.equal(t.log.bgmStops, 3, "배경음은 어느 경우든 정리");
}

console.log("back-test OK — 10 cases");
