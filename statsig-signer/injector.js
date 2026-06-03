"use strict";

const DIRECT_INJECT_RE = /\.A\((\d+)\)\.then\(([$\w]+)=>([$\w]+)\(\2\.default\(\)\)\)/;
const LK_FUNCTION_RE = /async function lK\(([$\w]+),\s*([$_\w]+)\)\s*\{([\s\S]*?)let a=await t;return await a\(\1,\s*\2\)\s*\}/;
const LK_LOAD_RE = /e\.A\(4629918\)\.then\(e\s*=>\s*t\(e\.default\(\)\)\)/;

const DIRECT_INJECT_TO =
  ".A($1).then($2=>{let __s=$2.default();" +
  "try{window.__grokSigner=__s}catch(e){};return $3(__s)})";

function injectLazySignerLoader(source) {
  return source.replace(LK_FUNCTION_RE, (match, pathArg, methodArg, body) => {
    if (match.includes("window.__grokSigner") || body.includes("__grokLoadSigner")) return match;
    return [
      `async function lK(${pathArg}, ${methodArg}) {`,
      `        let __grokLoadSigner = async () => {`,
      body,
      `            let a=await t;`,
      `            return a`,
      `        }`,
      `        try {`,
      `            window.__grokSigner = async (p, m) => await (await __grokLoadSigner())(p, m)`,
      `        } catch (e) {}`,
      `        return await (await __grokLoadSigner())(${pathArg}, ${methodArg})`,
      `    }`,
    ].join("\n");
  });
}

function patchChunk(source) {
  if (typeof source !== "string" || !source) return source;

  let patched = source;

  if (patched.includes("async function lK(") && LK_LOAD_RE.test(patched)) {
    patched = injectLazySignerLoader(patched);
  }

  if (patched === source && DIRECT_INJECT_RE.test(source)) {
    patched = source.replace(DIRECT_INJECT_RE, DIRECT_INJECT_TO);
  }

  return patched;
}

module.exports = {
  patchChunk,
};
