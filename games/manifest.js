/* 스크립트 로드 순서 + 서비스워커 프리캐시 목록의 단일 소스.
   새 게임 추가 = 여기 한 줄 + shell.js 카탈로그 한 줄 (index.html·sw.js 무수정).
   순서 중요: shell.js(프리퍼런스·토스트) 뒤에 오는 게임은 pwaToast 등 사용 가능. */
const SN_SCRIPTS = [
  "games/liar.js",
  "games/mafia.js",
  "games/choseong.js",
  "games/balance.js",
  "games/roulette.js",
  "games/fruit.js",
  "games/omok.js",
  "games/forehead.js",
  "games/life.js",
  "games/drawrelay.js",
  "games/catchmind.js",
  "games/wolf.js",
  "games/bomb.js",
  "games/tele.js",
  "games/lv.js",
  "games/vg.js",
  "games/bz.js",
  "games/um.js",
  "games/gq.js",
  "shell.js",
  "games/ta.js",
  "games/nb.js",
  "games/gm.js",
  "games/er.js",
  "games/cf.js",
  "lib/qrcode-gen.js",
  "lib/jsqr.js",
  "games/mp.js",
  "games/net.js"
];
