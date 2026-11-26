/* Three-way reconciliation for the legacy data model.
 * Staging only until Firebase Emulator and multi-device tests pass.
 */
(function(root){
  "use strict";
  const copy = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
  const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const object = x => x !== null && typeof x === "object" && !Array.isArray(x);
  const safeKey = k => !["__proto__","constructor","prototype"].includes(k);
  function merge(base, local, remote) {
    if (equal(base,local)) return copy(remote);
    if (equal(base,remote) || equal(local,remote)) return copy(local);
    if (local === undefined || remote === undefined) {
      if (base !== undefined) return undefined;
      return copy(local === undefined ? remote : local);
    }
    if (Array.isArray(local) && Array.isArray(remote) && (base === undefined || Array.isArray(base))) {
      const b = base || [], all = [...b,...local,...remote];
      const field = ["id","studentId"].find(k => all.length && all.every(x => object(x) && typeof x[k] === "string"));
      const primitives = all.every(x => typeof x === "string" || typeof x === "number");
      if (field || primitives) {
        const key = field ? x=>x[field] : x=>x;
        const maps = [b,local,remote].map(xs=>new Map(xs.map(x=>[key(x),x])));
        const order = [...new Set([...remote,...local].map(key))];
        return order.map(k=>merge(maps[0].get(k),maps[1].get(k),maps[2].get(k))).filter(x=>x!==undefined);
      }
    }
    if (object(local) && object(remote) && (base === undefined || object(base))) {
      const out = {}, b = base || {};
      for (const k of new Set([...Object.keys(b),...Object.keys(local),...Object.keys(remote)])) {
        if (!safeKey(k)) continue;
        const val = merge(b[k],local[k],remote[k]);
        if (val !== undefined) out[k] = val;
      }
      return out;
    }
    // Conflicting edits to the same scalar use the current local edit.
    return copy(local);
  }
  async function commit({url,base,local,normalize,request=fetch,attempts=4}) {
    for (let i=0;i<attempts;i++) {
      const read=await request(url,{cache:"no-store",headers:{"X-Firebase-ETag":"true"}});
      if (!read.ok) throw Error("READ_FAILED");
      const tag=read.headers.get("ETag");
      if (!tag) throw Error("ETAG_UNAVAILABLE");
      const raw=await read.json();
      const remote=raw===null ? copy(base) : normalize(raw);
      const next=normalize(merge(base,local,remote));
      if (raw!==null && equal(remote,next)) return next;
      const write=await request(url,{method:"PUT",headers:{"Content-Type":"application/json","if-match":tag},body:JSON.stringify(next)});
      if (write.ok) return next;
      if (write.status!==412) throw Error("WRITE_FAILED");
    }
    throw Error("CONFLICT_RETRY_LIMIT");
  }
  const api={copy,equal,merge,commit};
  if (typeof module !== "undefined" && module.exports) module.exports=api;
  else root.IlmSync=api;
})(typeof globalThis !== "undefined" ? globalThis : this);
