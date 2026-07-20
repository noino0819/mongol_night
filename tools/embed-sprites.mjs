// assets/sprites.js(단일 소스)를 index.html의 SPRITES 마커 블록에 주입한다.
// 재실행 안전 (마커 사이만 교체). 사용: node tools/embed-sprites.mjs
import { readFileSync, writeFileSync } from "node:fs";

const sprites = readFileSync("assets/sprites.js", "utf8").trimEnd();
const html = readFileSync("index.html", "utf8");
const re = /(\/\* SPRITES:BEGIN[^*]*\*\/)[\s\S]*?(\/\* SPRITES:END \*\/)/;
if (!re.test(html)) throw new Error("SPRITES 마커를 찾을 수 없음");
writeFileSync("index.html", html.replace(re, (_, a, b) => a + "\n" + sprites + "\n" + b));
console.log("sprites embedded:", Math.round(sprites.length / 1024) + "KB");
