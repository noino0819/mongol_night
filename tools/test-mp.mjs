// 폰 연결(mp) 순수 로직 단위 테스트 — games/mp.js의 MP-PURE 블록 추출 + QR 왕복
import fs from "node:fs";
import { createRequire } from "node:module";

const src = fs.readFileSync(new URL("../games/mp.js", import.meta.url), "utf8");
const m = src.match(/\/\* MP-PURE:START[\s\S]*?\*\/([\s\S]*?)\/\* MP-PURE:END \*\//);
if (!m) throw new Error("MP-PURE 블록 추출 실패");
const pure = new Function(m[1] + "; return { mpSlimSdp, mpB64, mpUnb64, mpPack, mpUnpack };")();

const require = createRequire(import.meta.url);
const qrcode = require("../lib/qrcode-gen.js");
const jsQR = require("../lib/jsqr.js");

let pass = 0, fail = 0;
function ok(label, cond){
  if (cond){ pass++; console.log("  ok  " + label); }
  else { fail++; console.error("  FAIL " + label); }
}

const SDP = [
  "v=0",
  "o=- 123 2 IN IP4 127.0.0.1",
  "s=-",
  "t=0 0",
  "a=group:BUNDLE 0",
  "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
  "c=IN IP4 0.0.0.0",
  "a=candidate:1 1 udp 2122260223 192.168.43.15 54321 typ host generation 0",
  "a=candidate:2 1 tcp 1518280447 192.168.43.15 9 typ host tcptype active generation 0",
  "a=candidate:3 1 udp 1686052607 1.2.3.4 54321 typ srflx raddr 192.168.43.15 rport 54321 generation 0",
  "a=candidate:4 1 UDP 2122187007 abcd-1234.local 60001 typ host generation 0",
  "a=ice-ufrag:abcd",
  "a=ice-pwd:efghijklmnopqrstuvwx",
  "a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
  "a=setup:actpass",
  "a=mid:0",
  "a=sctp-port:5000",
  "a=max-message-size:262144"
].join("\r\n") + "\r\n";

console.log("mpSlimSdp (UDP host 후보만 유지)");
const slim = pure.mpSlimSdp(SDP);
ok("udp host 후보 유지", slim.includes("a=candidate:1 "));
ok("UDP 대문자·mDNS 후보도 유지", slim.includes("a=candidate:4 "));
ok("tcp 후보 제거", !slim.includes("a=candidate:2 "));
ok("srflx 후보 제거", !slim.includes("a=candidate:3 "));
ok("일반 라인(ufrag·fingerprint) 보존", slim.includes("a=ice-ufrag:abcd") && slim.includes("a=fingerprint:sha-256"));
ok("CRLF 종결 유지", slim.endsWith("\r\n"));

console.log("mpB64 (base64url 왕복)");
const bytes = new Uint8Array(70000).map((_, i) => i % 256); // 청크 경계(0x8000) 교차 확인
const b64 = pure.mpB64(bytes);
ok("URL-safe (+,/,= 없음)", !/[+/=]/.test(b64));
const back = pure.mpUnb64(b64);
ok("바이트 왕복 일치", back.length === bytes.length && back.every((v, i) => v === bytes[i]));

console.log("mpPack/mpUnpack (deflate 왕복)");
const packed = await pure.mpPack("O", SDP);
ok("프리픽스 SN1O.", packed.startsWith("SN1O."));
const un = await pure.mpUnpack(packed);
ok("kind 복원", un && un.kind === "O");
ok("SDP = slim 결과와 일치", un && un.sdp === slim);
ok("쓰레기 문자열 → null", (await pure.mpUnpack("hello")) === null && (await pure.mpUnpack("SN1X.abc")) === null);
ok("깨진 본문 → null", (await pure.mpUnpack("SN1A.!!!!")) === null);
console.log("  (QR 페이로드 크기: " + packed.length + "자, 원본 " + SDP.length + "자)");

console.log("QR 인코딩 → jsQR 디코딩 왕복 (games/mp.js 렌더 방식과 동일)");
function qrRoundtrip(payload){
  const qr = qrcode(0, "M");
  qr.addData(payload, "Byte");
  qr.make();
  const n = qr.getModuleCount(), scale = 4, quiet = 4;
  const size = (n + quiet * 2) * scale;
  const img = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++){
    if (!qr.isDark(y, x)) continue;
    for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++){
      const p = (((quiet + y) * scale + dy) * size + (quiet + x) * scale + dx) * 4;
      img[p] = img[p + 1] = img[p + 2] = 0;
    }
  }
  const r = jsQR(img, size, size);
  return r && r.data === payload;
}
ok("실제 pack 페이로드 왕복", qrRoundtrip(packed));
ok("대형(1200자) 페이로드 왕복", qrRoundtrip("SN1O." + "Ab_-9".repeat(240)));

console.log(pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
