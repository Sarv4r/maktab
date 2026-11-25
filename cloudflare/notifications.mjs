const site = "https://sarv4r.github.io";
const feed = "https://maktabos-7172b-default-rtdb.firebaseio.com/maktabos_db/announcements.json";
const headers = {"Access-Control-Allow-Origin":site, "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":"Content-Type", "Cache-Control":"no-store", "Vary":"Origin"};
const encoder = new TextEncoder();
const base64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
const encode = value => base64url(encoder.encode(JSON.stringify(value)));
const registry = env => env.PHONES.get(env.PHONES.idFromName("school"));

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/") return new Response(null,{status:404});
    if (request.method === "GET" && !request.headers.get("Origin"))
      return new Response("MaktabOS bildirishnoma xizmati");
    if (request.headers.get("Origin") !== site) return new Response(null,{status:403});
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers});
    if (!["GET","POST"].includes(request.method)) return new Response(null,{status:405,headers});
    return registry(env).fetch(request);
  },
  async scheduled(event,env,ctx) {
    ctx.waitUntil(registry(env).fetch("https://internal/poll").then(r => {if (!r.ok) throw Error("Poll failed");}));
  }
};

export class PhoneRegistry {
  constructor(ctx) {
    this.db = ctx.storage;
    ctx.blockConcurrencyWhile(async () => {
      let keys = await this.db.get("vapid");
      if (!keys) {
        const pair = await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
        keys = {privateKey:await crypto.subtle.exportKey("jwk",pair.privateKey),
          publicKey:base64url(await crypto.subtle.exportKey("raw",pair.publicKey))};
        await this.db.put("vapid",keys);
      }
      this.publicKey = keys.publicKey;
      this.signer = await crypto.subtle.importKey("jwk",keys.privateKey,{name:"ECDSA",namedCurve:"P-256"},false,["sign"]);
    });
  }
  async fetch(request) {
    if (new URL(request.url).pathname === "/poll") {
      await this.poll();
      return new Response(null,{status:204});
    }
    if (request.method === "GET") return Response.json({publicKey:this.publicKey},{headers});
    let subscription, url;
    try { subscription = await request.json(); url = new URL(subscription.endpoint); }
    catch { return new Response(null,{status:400,headers}); }
    const hosts = ["fcm.googleapis.com","web.push.apple.com","push.services.mozilla.com","notify.windows.com"];
    if (url.protocol !== "https:" || url.port || url.username || url.password || url.href.length > 4096 ||
        !hosts.some(h => url.hostname === h || url.hostname.endsWith("."+h)) ||
        !/^[\w-]{87}$/.test(subscription.keys?.p256dh || "") || !/^[\w-]{22}$/.test(subscription.keys?.auth || "")) {
      return new Response(null,{status:400,headers});
    }
    const hash = base64url(await crypto.subtle.digest("SHA-256",encoder.encode(url.href)));
    if (await this.db.get("seen") === undefined) {
      const ids = await this.announcementIds();
      await this.db.transaction(async tx => {
        if (await tx.get("seen") === undefined) await tx.put("seen",ids);
      });
    }
    await this.db.put("device:"+hash,url.href);
    return new Response(null,{status:204,headers});
  }
  async announcementIds() {
    const result = await fetch(feed,{signal:AbortSignal.timeout(10000)});
    if (!result.ok) throw Error("Announcement feed unavailable");
    return Object.values(await result.json() || {}).map(a=>a?.id).filter(Boolean);
  }
  async poll() {
    let batch = await this.db.get("batch");
    if (!batch) {
      if (!(await this.db.list({prefix:"device:",limit:1})).size) return;
      const ids = await this.announcementIds();
      const previous = await this.db.get("seen");
      if (!previous || !ids.some(id=>!previous.includes(id))) {
        await this.db.put("seen",ids);
        return;
      }
      batch = {ids,cursor:""};
      await this.db.put("batch",batch);
    }
    const devices = await this.db.list({prefix:"device:", startAfter:batch.cursor || "device:", limit:20});
    for (const [key,endpoint] of devices) {
      const jwt = encode({typ:"JWT",alg:"ES256"})+"."+encode({aud:new URL(endpoint).origin,
        exp:Math.floor(Date.now()/1000)+3600,sub:site+"/maktab/"});
      const sig = base64url(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},this.signer,encoder.encode(jwt)));
      const response = await fetch(endpoint,{method:"POST",redirect:"manual",signal:AbortSignal.timeout(10000),
        headers:{TTL:"3600",Topic:"maktabos-announcements",Authorization:"vapid t="+jwt+"."+sig+", k="+this.publicKey}});
      if (response.status===404 || response.status===410) await this.db.delete(key);
      else if (response.status===429 || response.status>=500) return;
      batch.cursor = key;
      await this.db.put("batch",batch);
    }
    if (devices.size<20) {
      await this.db.transaction(async tx => {await tx.put("seen",batch.ids);await tx.delete("batch");});
    }
  }
}
