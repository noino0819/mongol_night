"use strict";
/* ================= 몽골 대장정 (인생게임 스타일) ================= */
const LIFE_COLORS = ["#FF7A45","#8FBF9F","#6FA8DC","#E8B84D","#C98BD9","#F27B9B"];
const MB_TEAM_NAMES = ["🔥 불꽃 기마단","🌊 푸른 늑대단","⭐ 황금 독수리단"];
/* 존별 시세: p=초원 가격, t=통행료 (게르 있으면 통행료 2배, 게르 건설비 = 가격) */
const MB_Z = [{ p: 3, t: 2 }, { p: 4, t: 3 }, { p: 5, t: 4 }];
const MB_N = 28;
const MB_TILES = [
  { t:"start",  nm:"울란바토르", sh:"출발", em:"🏁" },
  { t:"land",   nm:"수흐바타르 광장", sh:"광장", z:0 },
  { t:"key",    sh:"열쇠", em:"🗝️" },
  { t:"land",   nm:"간단 사원", sh:"사원", z:0 },
  { t:"ev",     sh:"", em:"❓" },
  { t:"land",   nm:"자이승 전망대", sh:"자이승", z:0 },
  { t:"land",   nm:"테렐지", sh:"테렐지", z:0 },
  { t:"island", nm:"고비 사막 조난", sh:"조난", em:"🏜️" },
  { t:"land",   nm:"거북바위", sh:"거북", z:0 },
  { t:"key",    sh:"열쇠", em:"🗝️" },
  { t:"land",   nm:"엘승타사르하이", sh:"엘승", z:1 },
  { t:"duel",   sh:"결투", em:"⚔️" },
  { t:"land",   nm:"바양고비", sh:"바양", z:1 },
  { t:"ev",     sh:"", em:"❓" },
  { t:"naadam", nm:"나담 축제", sh:"나담", em:"🏇" },
  { t:"land",   nm:"카라코룸", sh:"카라", z:1 },
  { t:"land",   nm:"어르헝 폭포", sh:"폭포", z:1 },
  { t:"key",    sh:"열쇠", em:"🗝️" },
  { t:"land",   nm:"쳉헤르 온천", sh:"온천", z:1 },
  { t:"ev",     sh:"", em:"❓" },
  { t:"land",   nm:"홍고린엘스", sh:"모래", z:2 },
  { t:"eagle",  nm:"독수리 택시", sh:"독수리", em:"🦅" },
  { t:"land",   nm:"욜링암", sh:"욜링암", z:2 },
  { t:"key",    sh:"열쇠", em:"🗝️" },
  { t:"land",   nm:"바양작", sh:"바양작", z:2 },
  { t:"duel",   sh:"결투", em:"⚔️" },
  { t:"ev",     sh:"", em:"❓" },
  { t:"land",   nm:"홉스골", sh:"홉스골", z:2 }
];
const LIFE_EVENTS = [
  { em:"🌠", tt:"별똥별을 봤다!", ds:"소원을 빌었더니 양떼가 불어났다. 양 +3", sheep:+3 },
  { em:"🐎", tt:"말이 도망갔다!", ds:"쫓아가느라 뒤로 2칸", move:-2 },
  { em:"🍵", tt:"유목민 가족의 수태차 대접", ds:"따뜻한 인심에 양 +1", sheep:+1 },
  { em:"🌪️", tt:"모래폭풍!", ds:"게르에서 대피, 한 턴 쉬기", skip:true },
  { em:"🐪", tt:"낙타가 침을 뱉었다", ds:"세탁비로 양 −1...", sheep:-1 },
  { em:"🦴", tt:"샤가이 놀이 대승!", ds:"복사뼈 굴리기의 달인, 양 +2", sheep:+2 },
  { em:"🧭", tt:"초원에서 길을 잃었다", ds:"3칸 뒤로...", move:-3 },
  { em:"🦅", tt:"독수리와 친구가 됐다", ds:"하늘에서 지름길 발견! 3칸 전진", move:+3 },
  { em:"🎻", tt:"마두금 연주회", ds:"감동의 팁으로 양 +2", sheep:+2 },
  { em:"🥟", tt:"허르헉 파티!", ds:"배불리 먹고 힘내서 2칸 전진", move:+2 },
  { em:"🍶", tt:"아이락 과음", ds:"숙취로 한 턴 쉬기...", skip:true },
  { em:"🐺", tt:"늑대 출몰!", ds:"양 2마리를 잃었다", sheep:-2 },
  { em:"⛺", tt:"양털 장사 대박", ds:"양 +3", sheep:+3 },
  { em:"🏇", tt:"경마 내기 우승!", ds:"상금으로 양 +4", sheep:+4 },
  { em:"🌧️", tt:"비포장길에 차가 빠졌다", ds:"밀어내느라 뒤로 1칸", move:-1 },
  { em:"📸", tt:"인생샷 성공", ds:"기분 최고! 다음 이동 2배", dbl:true },
  { em:"🔥", tt:"캠프파이어 밤샘 수다", ds:"늦잠으로 한 턴 쉬기", skip:true },
  { em:"🐐", tt:"염소 떼와 교통체증", ds:"기다리며 뒤로 1칸", move:-1 },
  { em:"💰", tt:"양털 시세 폭등!", ds:"양 최다 보유팀에게서 2마리 가져오기", steal:2 },
  { em:"⭐", tt:"은하수 명당 발견", ds:"일행에게 공유한 보답으로 양 +2", sheep:+2 },
  { em:"🐴", tt:"승마 실력 만렙", ds:"말을 타고 4칸 질주!", move:+4 },
  { em:"🥶", tt:"밤 기온 급하강", ds:"핫팩 사느라 양 −1", sheep:-1 },
  { em:"🗿", tt:"오보에서 소원 빌기", ds:"돌 세 바퀴 돌고 양 +1", sheep:+1 },
  { em:"🚙", tt:"사륜구동 정비", ds:"수리비로 양 −2", sheep:-2 }
];
const MB_KEYS = [
  { em:"💰", tt:"양털 수출 대박!", ds:"양 +5", fx:{ sheep:5 } },
  { em:"🐺", tt:"늑대 습격!", ds:"양 −3", fx:{ sheep:-3 } },
  { em:"🎁", tt:"환영 선물", ds:"다른 모든 팀에게서 양 1마리씩 받기", fx:{ fromAll:1 } },
  { em:"🍬", tt:"인심 쓰는 날", ds:"다른 모든 팀에게 양 1마리씩 주기", fx:{ toAll:1 } },
  { em:"🥇", tt:"부자 견제 카드", ds:"양 최다 보유팀에게서 3마리 가져오기!", fx:{ steal:3 } },
  { em:"🏜️", tt:"모래폭풍 조난", ds:"고비 조난 칸으로 즉시 이동!", fx:{ goIsland:true } },
  { em:"🦅", tt:"독수리 순풍", ds:"출발지로 날아가 월급 양 +5", fx:{ goStart:true } },
  { em:"🎫", tt:"통행료 면제권", ds:"다음 통행료 1회 면제!", fx:{ freepass:true } },
  { em:"⛺", tt:"게르 증축 지원", ds:"내 초원 중 가장 비싼 곳에 무료 게르! (초원이 없으면 양 +2)", fx:{ freeGer:true } },
  { em:"⚔️", tt:"결투 신청서", ds:"즉시 결투 발동!", fx:{ duel:true } },
  { em:"🐎", tt:"준마를 얻었다", ds:"3칸 전진!", fx:{ move:3 } },
  { em:"🌧️", tt:"진흙탕길", ds:"3칸 후진...", fx:{ move:-3 } },
  { em:"🧾", tt:"초원 관리비", ds:"보유 초원 1곳당 양 1마리 납부", fx:{ taxPerLand:1 } },
  { em:"🛟", tt:"유목민 상호부조", ds:"양이 3마리 미만이면 +5!", fx:{ welfare:true } },
  { em:"📸", tt:"인생샷 대박", ds:"다음 이동 2배!", fx:{ dbl:true } },
  { em:"😴", tt:"아이락 과음", ds:"한 턴 쉬기...", fx:{ skip:true } }
];
const MB_DUELS = [
  "🪨✂️📄 가위바위보 3판 2선승!",
  "👁️ 눈싸움! 먼저 웃거나 눈 깜빡이면 패배",
  "🤫 침묵 대결 30초! 먼저 소리 내면 패배",
  "🎵 노래 이어부르기! '사랑' 들어간 노래, 먼저 못 대면 패배",
  "🔢 3-6-9 맞대결! 먼저 틀리면 패배",
  "🗣️ 초성 ㅁㄱ 단어 번갈아 말하기! 먼저 못 대면 패배 (예: 몽골, 마곡...)",
  "👏 스피드 박수! 제3자가 '시작' 외치면 먼저 박수 치는 쪽 승리",
  "🐑 '양' 금지 토크! 30초간 몽골 여행 얘기, '양' 말하면 패배",
  "🖐️ 손바닥 밀기 한 판! 발이 먼저 움직이면 패배",
  "😐 무표정 대결! 서로 웃기기, 먼저 웃으면 패배"
];
let mb = {
  mode:"solo", teamN:2, sel:[], teamAssign:[], limit:14,
  units:[], turn:0, busy:false, doubles:0, owner:{}, ger:{}
};
function lifeReset(){
  $("life-setup").style.display = ""; $("life-game").style.display = "none"; $("life-end").style.display = "none";
  const box = $("life-players");
  box.innerHTML = "";
  mb.sel = roster.slice(0, 8);
  roster.forEach(n => {
    const b = document.createElement("button");
    b.textContent = n;
    if (mb.sel.includes(n)) b.classList.add("sel");
    b.addEventListener("click", () => {
      if (mb.sel.includes(n)) mb.sel = mb.sel.filter(x => x !== n);
      else mb.sel.push(n);
      b.classList.toggle("sel", mb.sel.includes(n));
      mbAssignTeams();
    });
    box.appendChild(b);
  });
  mbAssignTeams();
}
function mbAssignTeams(){
  if (mb.mode !== "team"){ $("mb-teamview-wrap").style.display = "none"; return; }
  $("mb-teamview-wrap").style.display = "";
  const pool = shuffle(mb.sel);
  mb.teamAssign = Array.from({ length: mb.teamN }, () => []);
  pool.forEach((n, i) => mb.teamAssign[i % mb.teamN].push(n));
  $("mb-teamview").innerHTML = mb.teamAssign.map((mem, i) =>
    '<div class="mb-teamcard"><b><i style="background:' + LIFE_COLORS[i] + '"></i>' + MB_TEAM_NAMES[i] + '</b><span>' +
    (mem.length ? mem.join(", ") : "(인원 부족)") + '</span></div>'
  ).join("");
}
(function initMbSetup(){
  $("mb-mode").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("mb-mode").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    mb.mode = b.dataset.m;
    $("mb-teamrow").style.display = mb.mode === "team" ? "" : "none";
    mbAssignTeams();
  }));
  $("mb-teamn").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("mb-teamn").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    mb.teamN = parseInt(b.dataset.n, 10);
    mbAssignTeams();
  }));
  $("mb-len").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    $("mb-len").querySelectorAll("button").forEach(x => x.classList.remove("sel")); b.classList.add("sel");
    mb.limit = parseInt(b.dataset.l, 10);
  }));
  $("mb-reshuffle").addEventListener("click", mbAssignTeams);
})();
$("life-start").addEventListener("click", () => {
  let units = [];
  if (mb.mode === "solo"){
    if (mb.sel.length < 2) return alert("2명 이상 선택해주세요!");
    if (mb.sel.length > 6) return alert("개인전은 최대 6명! (더 많으면 팀전 추천)");
    units = mb.sel.map((n, i) => ({ label: n, members: [n], color: LIFE_COLORS[i] }));
  } else {
    if (mb.sel.length < mb.teamN * 2) return alert("팀당 최소 2명이 필요해요! (총 " + (mb.teamN * 2) + "명 이상)");
    units = mb.teamAssign.map((mem, i) => ({ label: MB_TEAM_NAMES[i], members: mem.slice(), color: LIFE_COLORS[i] }));
  }
  mb.units = units.map(u => Object.assign(u, {
    pos: 0, sheep: 12, skip: false, dbl: false, jail: 0, freepass: 0, rollIdx: 0, turns: 0, alive: true, bankruptOrder: 0
  }));
  mb.turn = 0; mb.busy = false; mb.doubles = 0; mb.owner = {}; mb.ger = {};
  $("life-setup").style.display = "none"; $("life-game").style.display = ""; $("life-end").style.display = "none";
  mbRender("");
});
/* 8x8 둘레 좌표: 0=좌하단 코너, 시계 반대... 아래줄 좌→우, 우측 위로, 윗줄 우→좌, 좌측 아래로 */
function mbPerim(i){
  if (i <= 7)  return { r: 7, c: i };
  if (i <= 14) return { r: 7 - (i - 7), c: 7 };
  if (i <= 21) return { r: 0, c: 7 - (i - 14) };
  return { r: i - 21, c: 0 };
}
function mbLandValue(k){
  const z = MB_Z[MB_TILES[k].z];
  return z.p + (mb.ger[k] ? z.p : 0);
}
function mbAssets(u){
  let a = u.sheep;
  Object.keys(mb.owner).forEach(k => { if (mb.owner[k] === mb.units.indexOf(u)) a += mbLandValue(+k); });
  return a;
}
function mbRender(diceText){
  const cur = mb.units[mb.turn];
  $("mb-strip").innerHTML = mb.units.map((u, i) => {
    const lands = Object.keys(mb.owner).filter(k => mb.owner[k] === i).length;
    return '<div class="sp' + (i === mb.turn ? " now" : "") + (u.alive ? "" : " dead") + '"><i style="background:' + u.color + '"></i>' +
      u.label + ' 🐑' + u.sheep + ' ⛰️' + lands + (u.freepass ? " 🎫" : "") + '</div>';
  }).join("");
  const cells = [];
  const tileAt = {};
  for (let i = 0; i < MB_N; i++){ const p = mbPerim(i); tileAt[p.r * 8 + p.c] = i; }
  for (let g = 0; g < 64; g++){
    if (!(g in tileAt)){ cells.push('<div class="mb-cell"></div>'); continue; }
    const i = tileAt[g], t = MB_TILES[i];
    const ownIdx = mb.owner[i];
    const toks = mb.units.filter(u => u.alive && u.pos === i).map(u => '<i style="background:' + u.color + '"></i>').join("");
    let inner = "", cls = "mb-tile";
    if (t.t === "land"){
      const z = MB_Z[t.z];
      if (ownIdx !== undefined){
        cls += " owned";
        inner = '<div>' + t.sh + (mb.ger[i] ? "⛺" : "") + '</div><div class="price">₩' + (z.t * (mb.ger[i] ? 2 : 1)) + '</div><div class="own" style="background:' + mb.units[ownIdx].color + '"></div>';
      } else {
        inner = '<div>' + t.sh + '</div><div class="price">🐑' + z.p + '</div>';
      }
    } else {
      if (t.t !== "land" && ["start","island","naadam","eagle"].includes(t.t)) cls += " corner";
      inner = '<div class="em">' + t.em + '</div>' + (t.sh ? '<div>' + t.sh + '</div>' : "");
    }
    cells.push('<div class="' + cls + '">' + inner + '<div class="mb-toks">' + toks + '</div></div>');
  }
  const roller = cur.members[cur.rollIdx % cur.members.length];
  const center = '<div class="mb-center">' +
    '<div class="whom" style="color:' + cur.color + '">' + cur.label + '</div>' +
    '<div class="roller">🎲 ' + roller + ' 굴릴 차례</div>' +
    '<div class="dice" id="mb-dice">' + (diceText || "") + '</div>' +
    '<div class="info">' + (mb.limit - cur.turns) + '턴 남음' + (cur.dbl ? " · 🔥이동 2배" : "") + (cur.jail ? " · 🏜️조난 " + cur.jail + "턴" : "") + '</div>' +
    '</div>';
  $("mb-board").innerHTML = cells.join("") + center;
}
function mbNextUnit(){
  mb.doubles = 0;
  let tries = 0;
  do {
    mb.turn = (mb.turn + 1) % mb.units.length;
    tries++;
    if (tries > mb.units.length) return mbSettle();
  } while (!mb.units[mb.turn].alive || mb.units[mb.turn].turns >= mb.limit);
  const cur = mb.units[mb.turn];
  if (cur.skip){
    cur.skip = false;
    cur.turns++;
    mbRender("");
    lifeModal("😴", cur.label + " 한 턴 쉬기", "이번 차례는 통과!", mbAfterTurn);
    return;
  }
  mb.busy = false;
  mbRender("");
}
function mbAfterTurn(){
  const alive = mb.units.filter(u => u.alive);
  if (alive.length === 1){
    return mbSettle();
  }
  if (alive.every(u => u.turns >= mb.limit)) return mbSettle();
  mbNextUnit();
}
function mbEndTurn(wasDouble){
  mbRender("");
  const cur = mb.units[mb.turn];
  if (wasDouble && cur.alive && !cur.jail){
    mb.busy = false;
    lifeModal("🎲", "더블!", cur.label + " 한 번 더 굴리세요!", () => { mbRender(""); });
    return;
  }
  cur.turns++;
  mbAfterTurn();
}
$("mb-roll").addEventListener("click", () => {
  if (mb.busy) return;
  const cur = mb.units[mb.turn];
  if (!cur.alive) return;
  mb.busy = true;
  let d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
  let ticks = 0;
  const anim = setInterval(() => {
    const dice = $("mb-dice");
    if (dice) dice.textContent = (1 + Math.floor(Math.random() * 6)) + " · " + (1 + Math.floor(Math.random() * 6));
    ticks++;
    if (ticks >= 10){
      clearInterval(anim);
      const dbl = d1 === d2;
      const dice2 = $("mb-dice");
      if (dice2) dice2.textContent = d1 + " · " + d2 + (dbl ? " 🔥" : "");
      setTimeout(() => mbResolveRoll(cur, d1 + d2, dbl), 550);
    }
  }, 70);
});
function mbResolveRoll(cur, sum, dbl){
  if (cur.jail > 0){
    if (dbl){
      cur.jail = 0;
      lifeModal("🎉", "더블로 탈출!", "조난에서 벗어나 " + sum + "칸 이동!", () => mbMove(cur, sum, false));
    } else {
      cur.jail--;
      if (cur.jail === 0){
        lifeModal("🚙", "구조대 도착!", "조난에서 벗어나 " + sum + "칸 이동!", () => mbMove(cur, sum, false));
      } else {
        lifeModal("🏜️", "아직 조난 중...", "남은 대기: " + cur.jail + "턴", () => mbEndTurn(false));
      }
    }
    return;
  }
  if (dbl){
    mb.doubles++;
    if (mb.doubles >= 3){
      cur.pos = 7; cur.jail = 2; mb.doubles = 0;
      lifeModal("🏜️", "더블 3연속!", "과속으로 고비 사막에 조난... (2턴 대기, 더블이면 즉시 탈출)", () => mbEndTurn(false));
      return;
    }
  }
  const mult = cur.dbl ? 2 : 1;
  cur.dbl = false;
  mbMove(cur, sum * mult, dbl);
}
function mbMove(cur, steps, dbl){
  let np = cur.pos + steps;
  let salary = false;
  if (steps > 0 && np >= MB_N) salary = true;
  cur.pos = ((np % MB_N) + MB_N) % MB_N;
  cur.rollIdx++;
  mbRender("");
  const go = () => mbResolveTile(cur, dbl);
  if (salary){
    cur.sheep += 5;
    mbRender("");
    lifeModal("💵", "월급날!", "울란바토르를 지나며 양 +5", go);
  } else go();
}
function mbResolveTile(cur, dbl){
  const i = cur.pos, t = MB_TILES[i];
  const myIdx = mb.units.indexOf(cur);
  if (t.t === "start"){
    cur.sheep += 2;
    lifeModal("🏁", "출발지 정확히 도착!", "보너스 양 +2", () => mbEndTurn(dbl));
  }
  else if (t.t === "island"){
    cur.jail = 2;
    lifeModal("🏜️", "고비 사막 조난!", "2턴 대기... 더블이 나오면 즉시 탈출!", () => mbEndTurn(false));
  }
  else if (t.t === "eagle"){
    lifeModal("🦅", "독수리 택시 탑승!", "출발지로 날아가 월급 양 +5", () => {
      cur.pos = 0; cur.sheep += 5;
      mbEndTurn(dbl);
    });
  }
  else if (t.t === "naadam"){
    lifeModal("🏇", "나담 축제 도착!", "축제의 하이라이트는 결투 대회!", () => mbDuel(cur, dbl));
  }
  else if (t.t === "duel"){
    mbDuel(cur, dbl);
  }
  else if (t.t === "ev"){
    const ev = LIFE_EVENTS[Math.floor(Math.random() * LIFE_EVENTS.length)];
    if (ev.sheep) cur.sheep = Math.max(0, cur.sheep + ev.sheep);
    if (ev.skip) cur.skip = true;
    if (ev.dbl) cur.dbl = true;
    if (ev.steal) mbStealFromRichest(cur, ev.steal);
    lifeModal(ev.em, ev.tt, ev.ds, () => {
      if (ev.move){ mbMove(cur, ev.move, dbl); return; }
      mbEndTurn(dbl);
    });
  }
  else if (t.t === "key"){
    const k = MB_KEYS[Math.floor(Math.random() * MB_KEYS.length)];
    lifeModal(k.em, "🗝️ 황금열쇠: " + k.tt, k.ds, () => mbApplyKey(cur, k.fx, dbl));
  }
  else if (t.t === "land"){
    const z = MB_Z[t.z];
    const ownIdx = mb.owner[i];
    if (ownIdx === undefined){
      if (cur.sheep >= z.p){
        mbAsk("🌿", t.nm, "빈 초원! 양 " + z.p + "마리로 구매하면 통행료 " + z.t + "(게르 시 " + (z.t * 2) + ")를 걷을 수 있어요.",
          "🐑" + z.p + " 구매!", "패스",
          () => { cur.sheep -= z.p; mb.owner[i] = myIdx; mbEndTurn(dbl); },
          () => mbEndTurn(dbl));
      } else {
        lifeModal("💸", t.nm, "빈 초원이지만 양이 부족해서 못 삼... (필요: " + z.p + ")", () => mbEndTurn(dbl));
      }
    }
    else if (ownIdx === myIdx){
      if (!mb.ger[i] && cur.sheep >= z.p){
        mbAsk("⛺", t.nm + " (내 초원)", "게르를 지으면 통행료가 2배! 건설비 양 " + z.p,
          "⛺ 건설 (" + z.p + ")", "다음에",
          () => { cur.sheep -= z.p; mb.ger[i] = true; mbEndTurn(dbl); },
          () => mbEndTurn(dbl));
      } else {
        lifeModal("🏡", t.nm, mb.ger[i] ? "내 게르에서 편안한 하룻밤~" : "내 초원! (게르 건설비 부족)", () => mbEndTurn(dbl));
      }
    }
    else {
      const owner = mb.units[ownIdx];
      const toll = z.t * (mb.ger[i] ? 2 : 1);
      if (cur.freepass > 0){
        cur.freepass--;
        lifeModal("🎫", "통행료 면제권 사용!", owner.label + "의 " + t.nm + " 통행료 " + toll + " 면제!", () => mbEndTurn(dbl));
        return;
      }
      mbPay(cur, owner, toll, t.nm, dbl);
    }
  }
  else mbEndTurn(dbl);
}
function mbStealFromRichest(cur, n){
  const others = mb.units.filter(u => u !== cur && u.alive);
  if (!others.length) return;
  const rich = others.reduce((a, b) => (b.sheep > a.sheep ? b : a), others[0]);
  const take = Math.min(n, rich.sheep);
  rich.sheep -= take; cur.sheep += take;
}
function mbApplyKey(cur, fx, dbl){
  const myIdx = mb.units.indexOf(cur);
  if (fx.sheep) cur.sheep = Math.max(0, cur.sheep + fx.sheep);
  if (fx.fromAll) mb.units.forEach(u => { if (u !== cur && u.alive){ const t = Math.min(fx.fromAll, u.sheep); u.sheep -= t; cur.sheep += t; } });
  if (fx.toAll) mb.units.forEach(u => { if (u !== cur && u.alive){ const t = Math.min(fx.toAll, cur.sheep); cur.sheep -= t; u.sheep += t; } });
  if (fx.steal) mbStealFromRichest(cur, fx.steal);
  if (fx.freepass) cur.freepass++;
  if (fx.skip) cur.skip = true;
  if (fx.dbl) cur.dbl = true;
  if (fx.welfare && cur.sheep < 3) cur.sheep += 5;
  if (fx.taxPerLand){
    const lands = Object.keys(mb.owner).filter(k => mb.owner[k] === myIdx).length;
    cur.sheep = Math.max(0, cur.sheep - lands * fx.taxPerLand);
  }
  if (fx.freeGer){
    const owned = Object.keys(mb.owner).filter(k => mb.owner[k] === myIdx && !mb.ger[k]).map(Number);
    if (owned.length){
      owned.sort((a, b) => MB_Z[MB_TILES[b].z].p - MB_Z[MB_TILES[a].z].p);
      mb.ger[owned[0]] = true;
    } else cur.sheep += 2;
  }
  if (fx.goIsland){ cur.pos = 7; cur.jail = 2; return mbEndTurn(false); }
  if (fx.goStart){ cur.pos = 0; cur.sheep += 5; return mbEndTurn(dbl); }
  if (fx.duel) return mbDuel(cur, dbl);
  if (fx.move) return mbMove(cur, fx.move, dbl);
  mbEndTurn(dbl);
}
function mbDuel(cur, dbl){
  const others = mb.units.filter(u => u !== cur && u.alive);
  if (!others.length) return mbEndTurn(dbl);
  const rival = others.reduce((a, b) => (mbAssets(b) > mbAssets(a) ? b : a), others[0]);
  const game = MB_DUELS[Math.floor(Math.random() * MB_DUELS.length)];
  const a = cur.members[Math.floor(Math.random() * cur.members.length)];
  const b = rival.members[Math.floor(Math.random() * rival.members.length)];
  mbAsk("⚔️", cur.label + " vs " + rival.label,
    "대표 선수: <b>" + a + "</b> vs <b>" + b + "</b><br><br>" + game + "<br><br>판돈: 🐑 3마리 — 지금 실제로 대결하세요!",
    cur.label.slice(0, 8) + " 승!", rival.label.slice(0, 8) + " 승!",
    () => { const t = Math.min(3, rival.sheep); rival.sheep -= t; cur.sheep += t; lifeModal("🏆", cur.label + " 승리!", "양 " + t + "마리 획득!", () => mbEndTurn(dbl)); },
    () => { const t = Math.min(3, cur.sheep); cur.sheep -= t; rival.sheep += t; lifeModal("😭", rival.label + " 승리!", "양 " + t + "마리 강탈당함...", () => mbEndTurn(dbl)); });
}
function mbPay(cur, owner, toll, landName, dbl){
  const myIdx = mb.units.indexOf(cur);
  let soldMsg = "";
  while (cur.sheep < toll){
    const owned = Object.keys(mb.owner).filter(k => mb.owner[k] === myIdx).map(Number);
    if (!owned.length) break;
    owned.sort((a, b) => mbLandValue(a) - mbLandValue(b));
    const k = owned[0];
    const val = mbLandValue(k);
    cur.sheep += val;
    soldMsg += "<br>💔 " + MB_TILES[k].nm + " 매각 (+" + val + ")";
    delete mb.owner[k]; delete mb.ger[k];
  }
  if (cur.sheep >= toll){
    cur.sheep -= toll; owner.sheep += toll;
    lifeModal("💸", landName + " 통행료!", owner.label + "에게 양 " + toll + "마리 지급" + soldMsg, () => mbEndTurn(dbl));
  } else {
    const rest = cur.sheep;
    owner.sheep += rest; cur.sheep = 0;
    cur.alive = false;
    cur.bankruptOrder = mb.units.filter(u => !u.alive).length;
    lifeModal("💀", cur.label + " 파산!", "전 재산(" + rest + ")을 넘기고 대장정에서 탈락..." + soldMsg, mbAfterTurn);
  }
}
function mbAsk(em, tt, ds, aLabel, bLabel, onA, onB){
  const wrap = document.createElement("div");
  wrap.className = "life-modal";
  wrap.innerHTML = '<div class="inner"><div class="em">' + em + '</div><div class="tt">' + tt + '</div><div class="ds">' + ds + '</div>' +
    '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn" data-a>' + aLabel + '</button><button class="btn ghost" data-b>' + bLabel + '</button></div></div>';
  wrap.querySelector("[data-a]").addEventListener("click", () => { wrap.remove(); onA(); });
  wrap.querySelector("[data-b]").addEventListener("click", () => { wrap.remove(); onB(); });
  document.body.appendChild(wrap);
}
function mbSettle(){
  $("life-game").style.display = "none"; $("life-end").style.display = "flex";
  const rank = mb.units.slice().sort((a, b) => {
    if (a.alive !== b.alive) return a.alive ? -1 : 1;
    if (!a.alive) return b.bankruptOrder - a.bankruptOrder;
    return mbAssets(b) - mbAssets(a);
  });
  const medals = ["🥇","🥈","🥉"];
  $("life-rank").innerHTML = '<div class="lbl">최종 목축왕</div><div class="val" style="font-size:17px;line-height:2">' +
    rank.map((r, i) => {
      const lands = Object.keys(mb.owner).filter(k => mb.owner[k] === mb.units.indexOf(r)).length;
      return (medals[i] || "·") + " " + r.label + " — " + (r.alive ? "총자산 " + mbAssets(r) + " (🐑" + r.sheep + " · ⛰️" + lands + ")" : "💀 파산");
    }).join("<br>") + '</div>';
}
function lifeModal(em, tt, ds, onClose){
  const wrap = document.createElement("div");
  wrap.className = "life-modal";
  wrap.innerHTML = '<div class="inner"><div class="em">' + em + '</div><div class="tt">' + tt + '</div><div class="ds">' + ds + '</div><button class="btn mt">확인</button></div>';
  wrap.querySelector("button").addEventListener("click", () => { wrap.remove(); if (onClose) onClose(); });
  document.body.appendChild(wrap);
}
$("life-again").addEventListener("click", lifeReset);

