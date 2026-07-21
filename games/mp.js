"use strict";
/* ================= 폰 연결 데모 (mp) =================
   여러 폰을 인터넷·서버 없이 직접 연결하는 베타 화면.
   구조: 같은 핫스팟(LAN) 위에서 WebRTC 데이터채널, 시그널링은 QR 맞스캔.
   호스트가 별(스타) 중심이 되어 게스트별 1:1 연결을 들고 중계한다.
   ponytail: 자동 재연결 없음(끊기면 재초대) — 게임 붙일 때 필요해지면 추가. */

let mp = { role: null, name: "", spr: "bor", peers: [], hostChan: null, hostPc: null, hostName: "", hostSpr: "bor", rosterNames: null, rosterSprs: null, rtt: null, stream: null, scanRAF: 0, timers: [], warnTs: 0 };

/* 아바타로 쓸 캐릭터 스프라이트 (오브젝트 제외, 동물·텡그리 20종) */
const MP_AVATARS = ["bor", "fox", "wolf", "crow", "hawk", "hedgehog", "mole", "rooster", "goat", "squirrel", "rabbit", "otter", "turtle", "badger", "crane", "camel", "owl2", "marmot", "owlprof", "tengri"];
const MP_DEF_SPR = "bor";
/* 원격에서 온 캐릭터 값은 허용목록 밖이면 기본값으로 (px-sprite name 속성 신뢰경계) */
function mpSprOk(s){ return MP_AVATARS.includes(s) ? s : MP_DEF_SPR; }
/* 캐릭터 선택 UI — mp-role 진입 시 그림 */
function mpRenderAvatars(){
  const box = $("mp-avatars"); if (!box) return;
  box.innerHTML = "";
  MP_AVATARS.forEach((k) => {
    const b = document.createElement("button");
    b.className = k === mp.spr ? "on" : "";
    b.innerHTML = '<px-sprite name="' + k + '" scale="2"></px-sprite>'; /* k는 상수 목록에서만 옴 */
    b.onclick = () => { mp.spr = k; prefs.mpSpr = k; savePrefs(); mpRenderAvatars(); };
    box.append(b);
  });
}

/* ---------- 시그널링 페이로드 (QR에 담는 문자열) ---------- */
/* MP-PURE:START — tools/test-mp.mjs가 이 블록을 추출해 검증 */
/* 후보는 UDP host만 남김 (같은 LAN 직결이라 srflx/tcp 불필요) — QR 밀도 최소화 */
function mpSlimSdp(sdp){
  return sdp.split(/\r?\n/).filter((l) => {
    if (!l) return false;
    if (!l.startsWith("a=candidate:")) return true;
    const f = l.split(" ");
    return /^udp$/i.test(f[2]) && f[7] === "host";
  }).join("\r\n") + "\r\n";
}
/* LAN 접속 감지: 수집된 host 후보가 0개면 이 폰은 어떤 Wi-Fi에도 안 붙은 상태 */
function mpHasLan(sdp){ return /a=candidate:/.test(mpSlimSdp(sdp)); }
function mpB64(bytes){
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function mpUnb64(str){
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return b;
}
/* deflate(네이티브 CompressionStream) + base64url — 900B SDP가 QR 버전 ~15로 줄어 스캔이 쉬워짐 */
async function mpPack(kind, sdp){
  const cs = new CompressionStream("deflate-raw");
  const buf = await new Response(new Blob([mpSlimSdp(sdp)]).stream().pipeThrough(cs)).arrayBuffer();
  return "SN1" + kind + "." + mpB64(new Uint8Array(buf));
}
async function mpUnpack(str){
  const m = /^SN1([OA])\.([A-Za-z0-9_-]+)$/.exec(str || "");
  if (!m) return null;
  try {
    const ds = new DecompressionStream("deflate-raw");
    const sdp = await new Response(new Blob([mpUnb64(m[2])]).stream().pipeThrough(ds)).text();
    return { kind: m[1], sdp };
  } catch (e) { return null; }
}
/* MP-PURE:END */

/* ---------- QR 그리기 ---------- */
function mpDrawQr(cv, text){
  const qr = qrcode(0, "M");
  qr.addData(text, "Byte");
  qr.make();
  const n = qr.getModuleCount(), scale = 4, quiet = 4;
  const size = (n + quiet * 2) * scale;
  cv.width = size; cv.height = size;
  const g = cv.getContext("2d");
  /* 흑백 고정 = 스캐너 대비·콰이엇존 규격 (팔레트 규칙의 유일한 예외) */
  g.fillStyle = "#FFF"; g.fillRect(0, 0, size, size);
  g.fillStyle = "#000";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
    if (qr.isDark(y, x)) g.fillRect((quiet + x) * scale, (quiet + y) * scale, scale, scale);
}

/* ---------- 카메라 · 스캔 ---------- */
async function mpCam(){
  if (mp.stream && mp.stream.active) return mp.stream;
  mp.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  return mp.stream;
}
function mpCamOff(){
  if (mp.stream){ mp.stream.getTracks().forEach((t) => t.stop()); mp.stream = null; }
  const v = $("mp-video"); if (v) v.srcObject = null;
}
function mpStopScan(){ cancelAnimationFrame(mp.scanRAF); mp.scanRAF = 0; mpCamOff(); }
async function mpScan(expect, onOk){
  const stream = await mpCam();
  const video = $("mp-video");
  video.srcObject = stream;
  await video.play();
  const cv = document.createElement("canvas");
  const g = cv.getContext("2d", { willReadFrequently: true });
  let last = 0;
  const loop = (ts) => {
    mp.scanRAF = requestAnimationFrame(loop);
    if (ts - last < 160 || video.readyState < 2 || !video.videoWidth) return;
    last = ts;
    const s = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight)); /* 다운스케일 → 디코딩 속도 */
    cv.width = video.videoWidth * s | 0; cv.height = video.videoHeight * s | 0;
    g.drawImage(video, 0, 0, cv.width, cv.height);
    const d = g.getImageData(0, 0, cv.width, cv.height);
    const r = jsQR(d.data, cv.width, cv.height, { inversionAttempts: "dontInvert" });
    if (!r || !r.data) return;
    if (r.data.startsWith(expect)){
      mpStopScan();
      if (navigator.vibrate) navigator.vibrate(80);
      onOk(r.data);
    } else if (r.data.startsWith("SN1") && ts - mp.warnTs > 2500){
      mp.warnTs = ts;
      alert(expect === "SN1A" ? "이건 초대 QR이야 — 게스트 폰의 답장 QR을 비춰줘" : "이건 답장 QR이야 — 호스트 폰의 초대 QR을 비춰줘");
    }
  };
  mp.scanRAF = requestAnimationFrame(loop);
}

/* ---------- 화면 전환 ---------- */
function mpView(id){ ["mp-role", "mp-flow", "mp-room"].forEach((x) => $(x).style.display = (x === id ? "" : "none")); }
function mpFlow(tag, msg){
  mpView("mp-flow");
  $("mp-step-tag").textContent = tag;
  $("mp-step-msg").textContent = msg;
  $("mp-qr").style.display = "none";
  $("mp-cam").style.display = "none";
  $("mp-flow-next").style.display = "none";
}
function mpShowQr(code, tag, msg){
  mpFlow(tag, msg);
  mpDrawQr($("mp-qr"), code);
  $("mp-qr").style.display = "";
}
function mpShowCam(){ $("mp-cam").style.display = ""; }
function mpNext(label, fn){
  const b = $("mp-flow-next");
  b.style.display = "";
  b.textContent = label;
  b.onclick = fn;
}

/* ---------- 연결 공통 ---------- */
function mpNewPc(){ return new RTCPeerConnection({ iceServers: [] }); }
function mpGather(pc){
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((res) => {
    const t = setTimeout(res, 3000); /* ponytail: LAN엔 STUN이 없어 수집이 즉시 끝남 — 3초는 보험 */
    mp.timers.push(t);
    pc.addEventListener("icegatheringstatechange", () => {
      if (pc.iceGatheringState === "complete"){ clearTimeout(t); res(); }
    });
  });
}
function mpSend(chan, obj){
  if (chan && chan.readyState === "open"){ try { chan.send(JSON.stringify(obj)); } catch (e) { /* 무시 */ } }
}
function mpPoke(from){
  const d = document.createElement("div");
  d.className = "mp-poke";
  d.textContent = "👋 " + from;
  document.body.appendChild(d);
  if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  const t = setTimeout(() => d.remove(), 1100);
  mp.timers.push(t);
}
function mpFail(e){
  alert("연결 준비에 실패했어" + (e && e.name === "NotAllowedError" ? " — 카메라 허용이 필요해" : ""));
  mpStopScan();
  mp.peers.length || mp.hostChan ? mpRoom() : mpView("mp-role");
}

/* ---------- 호스트 ---------- */
function mpWireHostPeer(peer){
  peer.chan.onopen = () => {
    peer.on = true;
    if (mp.pendingPc === peer.pc) mp.pendingPc = null;
    mp.peers.push(peer);
    mpRoom();
    mpRoster();
  };
  peer.chan.onclose = () => { peer.on = false; if (mp.role === "host"){ mpRoom(); mpRoster(); } };
  peer.chan.onmessage = (e) => {
    let msg; try { msg = JSON.parse(e.data); } catch (err) { return; }
    if (msg.t === "hi"){ peer.name = String(msg.name || "게스트").slice(0, 8); peer.spr = mpSprOk(msg.spr); mpRoom(); mpRoster(); }
    if (msg.t === "ping") mpSend(peer.chan, { t: "pong", ts: msg.ts });
    if (msg.t === "pong"){ peer.rtt = Math.max(1, Math.round(performance.now() - msg.ts)); mpRoom(); }
    if (msg.t === "poke"){ mpPoke(peer.name); mp.peers.forEach((p) => { if (p !== peer) mpSend(p.chan, { t: "poke", from: peer.name }); }); }
  };
}
function mpRoster(){
  const on = mp.peers.filter((p) => p.on);
  const names = [mp.name].concat(on.map((p) => p.name || "게스트"));
  const sprs = [mp.spr].concat(on.map((p) => p.spr || MP_DEF_SPR));
  mp.peers.forEach((p) => mpSend(p.chan, { t: "roster", names, sprs }));
}
async function mpInvite(){
  try {
    mpFlow("카메라 준비", "게스트 답장을 스캔해야 해서 카메라 허용이 필요해");
    await mpCam(); /* 권한을 먼저 받아야 SDP에 mDNS 대신 실제 IP가 실림 (핫스팟 멀티캐스트 이슈 회피) */
    mpCamOff();
    mpFlow("초대장 만드는 중", "…");
    const pc = mpNewPc();
    mp.pendingPc = pc; /* 취소·리셋 시 정리 대상 — 연결 성사되면 해제 */
    const chan = pc.createDataChannel("sn");
    const peer = { pc, chan, name: "", spr: MP_DEF_SPR, rtt: null, on: false };
    mpWireHostPeer(peer);
    await pc.setLocalDescription(await pc.createOffer());
    await mpGather(pc);
    if (!mpHasLan(pc.localDescription.sdp)){
      try { pc.close(); } catch (e) { /* 무시 */ }
      mp.pendingPc = null;
      alert("이 폰이 Wi-Fi(핫스팟)에 안 붙어 있는 것 같아 — 핫스팟부터 켜고 전원이 붙은 뒤 다시 해줘");
      mp.peers.length ? mpRoom() : mpView("mp-role");
      return;
    }
    const code = await mpPack("O", pc.localDescription.sdp);
    mpShowQr(code, "① 초대 QR", "게스트 폰: [참가하기]로 이 QR을 스캔 → 게스트 화면에 답장 QR이 뜨면 아래 버튼");
    mpNext("② 게스트 답장 스캔 →", () => {
      mpFlow("답장 스캔", "게스트 화면의 답장 QR을 비춰줘");
      mpShowCam();
      mpScan("SN1A", async (data) => {
        const p = await mpUnpack(data);
        if (!p) return;
        mpFlow("연결 중", "별들을 잇는 중…");
        await pc.setRemoteDescription({ type: "answer", sdp: p.sdp });
        const t = setTimeout(() => {
          if (!peer.on){
            try { pc.close(); } catch (e) { /* 무시 */ }
            alert("연결이 안 됐어. 전원이 같은 Wi-Fi(핫스팟)인지 확인하고 다시 초대해줘");
            mpRoom();
          }
        }, 15000);
        mp.timers.push(t);
      });
    });
  } catch (e) { mpFail(e); }
}

/* ---------- 게스트 ---------- */
async function mpJoin(){
  try {
    mpFlow("초대 스캔", "호스트 화면의 초대 QR을 비춰줘");
    mpShowCam();
    await mpScan("SN1O", async (data) => {
      const o = await mpUnpack(data);
      if (!o) return;
      mpFlow("답장 만드는 중", "…");
      const pc = mpNewPc();
      mp.hostPc = pc;
      pc.ondatachannel = (e) => {
        mp.hostChan = e.channel;
        e.channel.onopen = () => { mpSend(e.channel, { t: "hi", name: mp.name, spr: mp.spr }); mpRoom(); };
        e.channel.onclose = () => { alert("호스트와 연결이 끊겼어"); mpReset(); };
        e.channel.onmessage = (ev) => {
          let msg; try { msg = JSON.parse(ev.data); } catch (err) { return; }
          if (msg.t === "ping") mpSend(mp.hostChan, { t: "pong", ts: msg.ts });
          if (msg.t === "pong"){ mp.rtt = Math.max(1, Math.round(performance.now() - msg.ts)); mpRoom(); }
          if (msg.t === "poke") mpPoke(String(msg.from || "?").slice(0, 8));
          if (msg.t === "roster"){ mp.hostName = String(msg.names[0] || "호스트").slice(0, 8); mp.hostSpr = mpSprOk(msg.sprs && msg.sprs[0]); mp.rosterNames = msg.names.map((n) => String(n).slice(0, 8)); mp.rosterSprs = (msg.sprs || []).map(mpSprOk); mpRoom(); }
        };
      };
      await pc.setRemoteDescription({ type: "offer", sdp: o.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await mpGather(pc);
      if (!mpHasLan(pc.localDescription.sdp)){
        try { pc.close(); } catch (e) { /* 무시 */ }
        mp.hostPc = null; mp.hostChan = null;
        alert("이 폰이 Wi-Fi(핫스팟)에 안 붙어 있는 것 같아 — 호스트와 같은 Wi-Fi에 붙은 뒤 다시 해줘");
        mpView("mp-role");
        return;
      }
      const code = await mpPack("A", pc.localDescription.sdp);
      mpShowQr(code, "② 답장 QR", "이제 호스트가 이 QR을 스캔하면 자동으로 연결돼. 이 화면 그대로 기다려줘");
    });
  } catch (e) { mpFail(e); }
}

/* ---------- 방(연결됨) 화면 ---------- */
function mpPeerRow(name, on, rtt, spr){
  const d = document.createElement("div");
  d.className = "mp-peer" + (on ? "" : " off");
  const dot = document.createElement("span"); dot.className = "dot";
  const av = document.createElement("span"); av.className = "av";
  av.innerHTML = '<px-sprite name="' + mpSprOk(spr) + '" scale="2"></px-sprite>'; /* mpSprOk → 허용목록 값만 삽입 */
  const nm = document.createElement("span"); nm.textContent = name; /* 원격 입력 → textContent만 사용 */
  const rt = document.createElement("span"); rt.className = "rtt";
  rt.textContent = !on ? "끊김" : (rtt ? rtt + "ms" : "");
  d.append(dot, av, nm, rt);
  return d;
}
/* 방 전원 칩 — 상태 점·핑 없음(직접 연결이 아니라 "방에 있음"만 뜻함) */
function mpChip(name, spr){
  const c = document.createElement("div");
  c.className = "mp-chip";
  const av = document.createElement("span"); av.className = "av";
  av.innerHTML = '<px-sprite name="' + mpSprOk(spr) + '" scale="2"></px-sprite>'; /* mpSprOk → 허용목록 값만 */
  const nm = document.createElement("span"); nm.textContent = name; /* 원격 입력 → textContent */
  c.append(av, nm);
  return c;
}
function mpRoom(){
  mpView("mp-room");
  const box = $("mp-peers");
  box.innerHTML = "";
  if (mp.role === "host"){
    $("mp-room-label").textContent = "연결된 폰 (" + mp.peers.filter((p) => p.on).length + ")";
    box.append(mpPeerRow(mp.name + " (나·호스트)", true, null, mp.spr));
    if (!mp.peers.length){
      const d = document.createElement("div");
      d.className = "hint";
      d.textContent = "아직 아무도 없어 — 아래 버튼으로 초대해봐";
      box.append(d);
    }
    mp.peers.forEach((p) => box.append(mpPeerRow(p.name || "게스트", p.on, p.rtt, p.spr)));
    $("mp-invite-more").style.display = "";
    $("mp-roster-field").style.display = "none"; /* 호스트는 위 연결 행이 이미 전원(실상태) */
    $("mp-room-hint").textContent = "게스트 폰은 같은 Wi-Fi에 붙인 뒤 [참가하기]로 들어오면 돼";
  } else {
    $("mp-room-label").textContent = "내 연결";
    box.append(mpPeerRow((mp.hostName || "호스트") + " (호스트)", !!(mp.hostChan && mp.hostChan.readyState === "open"), mp.rtt, mp.hostSpr));
    $("mp-invite-more").style.display = "none";
    /* 방 전원 캐릭터 칩 — 다른 게스트는 직접 연결이 아니라 roster로만 아니까 상태 없이 표시 */
    const rbox = $("mp-roster"); rbox.innerHTML = "";
    (mp.rosterNames || []).forEach((n, i) => rbox.append(mpChip(n, (mp.rosterSprs || [])[i])));
    $("mp-roster-field").style.display = mp.rosterNames && mp.rosterNames.length ? "" : "none";
    $("mp-room-hint").textContent = "";
  }
}

/* ---------- 진입·리셋 ---------- */
function mpReset(){
  mp.timers.forEach(clearTimeout);
  mpStopScan();
  mp.peers.forEach((p) => { try { p.pc.close(); } catch (e) { /* 무시 */ } });
  if (mp.hostPc){ try { mp.hostPc.close(); } catch (e) { /* 무시 */ } }
  if (mp.pendingPc){ try { mp.pendingPc.close(); } catch (e) { /* 무시 */ } }
  mp = { role: null, name: "", spr: mpSprOk(prefs.mpSpr), peers: [], hostChan: null, hostPc: null, hostName: "", hostSpr: MP_DEF_SPR, rosterNames: null, rosterSprs: null, rtt: null, stream: null, scanRAF: 0, timers: [], warnTs: 0 };
  /* 대표로 저장해둔 이름·캐릭터 미리 채우기 */
  if (prefs.mpName) $("mp-name").value = prefs.mpName;
  mpRenderAvatars();
  /* 브라우저(미설치)로 열었으면 설치 유도 — 오프라인 현장에선 설치된 앱만 열리니까 */
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  $("mp-install-warn").style.display = standalone ? "none" : "";
  mpView("mp-role");
}
/* 홈에 다녀와도 연결 유지 — 활성 연결이 없을 때만 초기화 */
function mpEnter(){
  if (mp.role && (mp.peers.some((p) => p.on) || (mp.hostChan && mp.hostChan.readyState === "open"))) mpRoom();
  else mpReset();
}

/* ---------- 버튼 ---------- */
$("mp-host-btn").addEventListener("click", () => {
  if (!("RTCPeerConnection" in window) || !("CompressionStream" in window)) return alert("이 폰 브라우저는 연결 기능을 지원하지 않아");
  mp.role = "host";
  mp.name = ($("mp-name").value.trim() || "호스트").slice(0, 8);
  prefs.mpName = $("mp-name").value.trim(); savePrefs();
  mpInvite();
});
$("mp-join-btn").addEventListener("click", () => {
  if (!("RTCPeerConnection" in window) || !("CompressionStream" in window)) return alert("이 폰 브라우저는 연결 기능을 지원하지 않아");
  mp.role = "guest";
  mp.name = ($("mp-name").value.trim() || "게스트").slice(0, 8);
  prefs.mpName = $("mp-name").value.trim(); savePrefs();
  mpJoin();
});
$("mp-flow-cancel").addEventListener("click", () => {
  mpStopScan();
  if (mp.pendingPc){ try { mp.pendingPc.close(); } catch (e) { /* 무시 */ } mp.pendingPc = null; }
  if (mp.role === "host" && mp.peers.length) mpRoom(); else mpReset();
});
$("mp-invite-more").addEventListener("click", mpInvite);
$("mp-ping").addEventListener("click", () => {
  const ts = performance.now();
  if (mp.role === "host"){
    if (!mp.peers.some((p) => p.on)) return alert("아직 연결된 폰이 없어");
    mp.peers.forEach((p) => mpSend(p.chan, { t: "ping", ts }));
  } else mpSend(mp.hostChan, { t: "ping", ts });
});
$("mp-install-btn").addEventListener("click", () => {
  if (typeof pwa !== "undefined" && pwa.installAction) pwa.installAction(); /* shell.js 설치 플로우 재사용 (인앱 탈출·iOS 안내 포함) */
});
$("mp-poke-btn").addEventListener("click", () => {
  mpPoke(mp.name);
  if (mp.role === "host") mp.peers.forEach((p) => mpSend(p.chan, { t: "poke", from: mp.name }));
  else mpSend(mp.hostChan, { t: "poke" });
});
