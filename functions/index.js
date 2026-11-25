const {createHash} = require("node:crypto");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {onRequest} = require("firebase-functions/v2/https");
const {onValueWritten} = require("firebase-functions/v2/database");
const {defineSecret} = require("firebase-functions/params");
const webPush = require("web-push");
initializeApp();
const vapid = defineSecret("MAKTABOS_WEB_PUSH");
const devices = () => getFirestore().collection("maktabosNotificationDevices");
const origin = "https://sarv4r.github.io";

exports.announcementDevices = onRequest({cors:[origin], secrets:[vapid]}, async (req,res) => {
  if (req.get("Origin") !== origin) return res.sendStatus(403);
  const keys = JSON.parse(vapid.value());
  if (req.method === "GET") return res.json({publicKey:keys.publicKey});
  if (req.method !== "POST") return res.sendStatus(405);
  const sub = req.body;
  let endpoint;
  try { endpoint = new URL(sub.endpoint); } catch { return res.sendStatus(400); }
  const allowed = ["fcm.googleapis.com","web.push.apple.com","push.services.mozilla.com","notify.windows.com"];
  if (endpoint.protocol !== "https:" || endpoint.port || endpoint.username || endpoint.password ||
      !allowed.some(host => endpoint.hostname === host || endpoint.hostname.endsWith("." + host)) ||
      !/^[A-Za-z0-9_-]{87}$/.test(sub.keys?.p256dh || "") || !/^[A-Za-z0-9_-]{22}$/.test(sub.keys?.auth || "")) {
    return res.sendStatus(400);
  }
  const id = createHash("sha256").update(endpoint.href).digest("hex");
  await devices().doc(id).set({endpoint:endpoint.href, keys:{auth:sub.keys.auth,p256dh:sub.keys.p256dh}});
  res.sendStatus(204);
});

exports.announceToPhones = onValueWritten({
  ref:"/maktabos_db/announcements",instance:"maktabos-7172b-default-rtdb",
  region:"us-central1",secrets:[vapid],retry:true
}, async event => {
  const previous = Object.values(event.data.before.val() || {});
  const known = new Set(previous.map(a => a.id));
  const added = Object.values(event.data.after.val() || {}).some(a => !known.has(a.id));
  if (!added) return;
  const {publicKey,privateKey,subject} = JSON.parse(vapid.value());
  webPush.setVapidDetails(subject, publicKey, privateKey);
  let cursor;
  while (true) {
    let query = devices().orderBy("__name__").limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    await Promise.all(page.docs.map(async doc => {
      try {
        await webPush.sendNotification(doc.data(), null, {TTL:3600,topic:"maktabos-announcements"});
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) await doc.ref.delete();
        else throw err;
      }
    }));
    cursor = page.docs[page.docs.length - 1];
  }
});
