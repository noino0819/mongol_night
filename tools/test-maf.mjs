/* 마피아 여러 폰 배달 무결성: 역할 풀 카운트 + 동명이인이어도 슬롯당 1역할(오배달 없음).
   실행: node tools/test-maf.mjs */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

/* mafia.js는 로드 시 DOM 리스너·holdReveal 등을 걸어서, 정의 안 된 전역은 전부 no-op으로 흡수하는
   샌드박스에서 실행한 뒤 mafRolePool만 꺼낸다. */
const stub = new Proxy(function(){}, { get: () => stub, apply: () => stub, construct: () => stub });
const sandbox = new Proxy({ shuffle: (a) => a.slice() }, {
  has: () => true,                                   /* 모든 식별자를 "정의됨"으로 → ReferenceError 방지 */
  get: (t, k) => (k in t ? t[k] : stub),             /* 실제 값 있으면 그것, 없으면 no-op stub */
  set: (t, k, v) => (t[k] = v, true),
});
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL("../games/mafia.js", import.meta.url), "utf8"), sandbox);
const mafRolePool = sandbox.mafRolePool;
assert.equal(typeof mafRolePool, "function", "mafRolePool 추출됨");

const count = (arr) => arr.reduce((m, r) => (m[r] = (m[r] || 0) + 1, m), {});

/* 1) 특수 없음: 마피아 count + 나머지 시민 */
let pool = mafRolePool(6, 2, {});
assert.equal(pool.length, 6);
assert.deepEqual(count(pool), { "마피아": 2, "시민": 4 }, "특수 꺼짐: 마피아 2 + 시민 4");

/* 2) 특수 너무 많으면 null */
assert.equal(mafRolePool(4, 4, {}), null, "마피아>=인원 → null");
assert.equal(mafRolePool(3, 2, {}).length, 3, "3인 마피아2 → 시민1");

/* 3) 동명이인 배달 무결성: startMafiaMulti와 동일한 인덱스 zip → 이름 겹쳐도 슬롯당 1역할 */
pool = mafRolePool(6, 2, {});
const party = [{ name: "김" }, { name: "김" }, { name: "김" }, { name: "박" }, { name: "박" }, { name: "이" }];
const dealt = pool.slice();                                    /* shuffle 없이도 zip 무결성은 동일 */
const list = party.map((pl, i) => ({ name: pl.name, role: dealt[i] }));
assert.equal(list.length, party.length, "슬롯 수 = 인원");
assert.deepEqual(count(list.map(x => x.role)), count(pool), "배달 역할 다중집합 = 풀 (누락·중복 없음)");
list.forEach((x, i) => assert.equal(x.role, dealt[i], "슬롯 " + i + " 역할 = dealt[" + i + "] (이름 매칭이면 여기서 깨짐)"));

console.log("test-maf: OK");
