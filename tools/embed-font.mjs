// Galmuri11 서브셋(woff2)을 assets/font.css의 FONT 마커 블록에 base64로 주입한다.
// 재실행해도 안전 (마커 사이만 교체). 사용: node tools/embed-font.mjs
import { readFileSync, writeFileSync } from "node:fs";

const b64 = (p) => readFileSync(p).toString("base64");
const face = (weight, data) => `@font-face{
    font-family:"Galmuri11";font-weight:${weight};font-style:normal;font-display:block;
    src:url(data:font/woff2;base64,${data}) format("woff2");
  }`;

const css = [
  face(400, b64("assets/fonts/Galmuri11-sub.woff2")),
  face(700, b64("assets/fonts/Galmuri11-Bold-sub.woff2")),
].join("\n  ");

const html = readFileSync("assets/font.css", "utf8");
const re = /(\/\* FONT:BEGIN[^*]*\*\/)[\s\S]*?(\/\* FONT:END \*\/)/;
if (!re.test(html)) throw new Error("FONT 마커를 찾을 수 없음");
writeFileSync("assets/font.css", html.replace(re, `$1\n  ${css}\n  $2`));
console.log("font embedded:", Math.round(css.length / 1024) + "KB css");
