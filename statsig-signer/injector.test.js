"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { patchChunk } = require("./injector");

test("patchChunk exposes lazy signer loader before first request", () => {
  const source =
    "async function lK(n,i){t=t||new Promise(t=>{e.A(4629918).then(e=>t(e.default()))});let a=await t;return await a(n,i)}";

  const patched = patchChunk(source);

  assert.notEqual(patched, source);
  assert.match(patched, /window\.__grokSigner\s*=\s*async\s*\(p,\s*m\)/);
  assert.match(patched, /e\.A\(4629918\)\.then\(e=>t\(e\.default\(\)\)\)/);
  assert.match(patched, /window\.__grokSigner\s*=\s*async\s*\(p,\s*m\)\s*=>\s*await\s*\(await __grokLoadSigner\(\)\)\(p,\s*m\)/);
});

test("patchChunk keeps non-signer chunks unchanged", () => {
  const source = "function noop(){return 1}";
  assert.equal(patchChunk(source), source);
});
