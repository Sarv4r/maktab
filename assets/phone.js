const pushService = "https://maktab.sarvarxasanov426.workers.dev/";
let workerRegistration;
let pendingAnnouncements = new URLSearchParams(location.search).get("view") === "announcements";

function openPendingAnnouncements() {
  syncPhonePrompt();
  if (!pendingAnnouncements || !currentUser) return;
  pendingAnnouncements = false;
  history.replaceState(null, "", location.pathname);
  navigate("announcements");
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data === "open-announcements") {
      pendingAnnouncements = true;
      openPendingAnnouncements();
    }
  });
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js", {updateViaCache:"none"});
      navigator.serviceWorker.ready.then(active => {
        workerRegistration = active;
        syncPhonePrompt();
      });
      let reload = false;
      const offerUpdate = () => {
        if (!reg.waiting || !navigator.serviceWorker.controller || document.querySelector("#appUpdate")) return;
        const button = document.createElement("button");
        button.id = "appUpdate";
        button.className = "btn-primary";
        button.textContent = "Yangi versiya tayyor · Yangilash";
        button.onclick = () => { reload = true; reg.waiting?.postMessage("activate-update"); };
        document.body.append(button);
      };
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reload) location.reload();
      });
      const observe = () => reg.installing?.addEventListener("statechange", offerUpdate);
      reg.addEventListener("updatefound", observe);
      observe(); offerUpdate();
      const check = () => reg.update().catch(() => {});
      document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
      setInterval(check, 60 * 60 * 1000);
    } catch { /* The site remains usable without offline storage. */ }
  });
}

let connecting = false;
function syncPhonePrompt() {
  const prompt = document.getElementById("phonePrompt");
  prompt.hidden = true;
  if (!currentUser || !workerRegistration || !("Notification" in window)) return;
  const key = phoneKey();
  if (localStorage.getItem(key + "_off")) return;
  if (Notification.permission === "granted") {
    if (!connecting) enablePhoneAlerts(true);
  } else if (Notification.permission === "default" && !sessionStorage.getItem(key + "_later")) {
    prompt.hidden = false;
  }
}
function postponePhonePrompt() {
  sessionStorage.setItem(phoneKey() + "_later", "1");
  document.getElementById("phonePrompt").hidden = true;
}

async function disconnectPhoneAlerts() {
  if (!currentUser) return;
  localStorage.removeItem(phoneKey());
  try { const sub = await workerRegistration?.pushManager?.getSubscription(); await sub?.unsubscribe(); } catch {}
}
function phoneKey() { return "mos_phone_" + currentUser.id; }
async function configurePhoneAlerts() {
  if (!("Notification" in window) || !workerRegistration) {
    return notify("Telefon bildirishnomalari uchun ilovani bosh ekrandan oching.", "info");
  }
  const key = phoneKey();
  if (localStorage.getItem(key)) {
    try {
      const sub = await workerRegistration.pushManager?.getSubscription();
      if (sub) await sub.unsubscribe();
      localStorage.removeItem(key);
      localStorage.setItem(key + "_off", "1");
      document.getElementById("phonePrompt").hidden = true;
      navigate("announcements");
      notify("Telefon bildirishnomalari o‘chirildi.", "info");
    } catch { notify("O‘chirish amalga oshmadi. Qayta urining.", "error"); }
    return;
  }
  return enablePhoneAlerts(false);
}

async function enablePhoneAlerts(automatic) {
  if (connecting || !currentUser || !workerRegistration) return;
  connecting = true;
  const key = phoneKey();
  const sameUser = () => currentUser && phoneKey() === key;
  try {
    if (Notification.permission !== "granted" && (automatic || await Notification.requestPermission() !== "granted")) {
      if (sameUser()) postponePhonePrompt();
      return notify("Telefon bildirishnomalari uchun brauzerdan ruxsat bering.", "info");
    }
    if (!sameUser()) return;
    document.getElementById("phonePrompt").hidden = true;
    localStorage.removeItem(key + "_off");
    const previous = JSON.parse(localStorage.getItem(key) || "null");
    const existing = await workerRegistration.pushManager?.getSubscription();
    if (previous?.background && existing) return;
    const state = previous || {seen:DB.announcements.map(a => a.id), background:false};
    state.background = false;
    localStorage.setItem(key, JSON.stringify(state));
    if (currentView === "announcements") navigate("announcements");
    try {
      const response = await fetch(pushService, {signal:AbortSignal.timeout(8000)});
      if (!response.ok) throw Error();
      const {publicKey} = await response.json();
      const bytes = Uint8Array.from(atob(publicKey.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
      if (!sameUser()) return;
      const sub = existing ||
        await workerRegistration.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:bytes});
      const registered = await fetch(pushService, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(sub)});
      if (!registered.ok) throw Error();
      if (!sameUser()) return;
      state.background = true;
      localStorage.setItem(key, JSON.stringify(state));
      if (!automatic) notify("Telefon bildirishnomalari yoqildi.", "success");
    } catch {
      if (!automatic) notify("E’lonlar hozircha ilova ishlayotganida telefonga chiqadi.", "info");
    }
  } catch {
    if (!automatic) notify("Bildirishnomalarni yoqib bo‘lmadi.", "error");
  } finally {
    connecting = false;
    if (currentUser && !sameUser()) syncPhonePrompt();
  }
}

async function deliverAnnouncements() {
  if (!workerRegistration || !currentUser || !("Notification" in window) || Notification.permission !== "granted") return;
  const key = phoneKey();
  const state = JSON.parse(localStorage.getItem(key) || "null");
  if (!state || state.background) return;
  const items = DB.announcements;
  const fresh = items.filter(a => !state.seen.includes(a.id));
  if (!fresh.length) return;
  state.seen = items.map(a => a.id);
  localStorage.setItem(key, JSON.stringify(state));
  if (fresh.some(a => a.authorId !== currentUser.id)) {
    await workerRegistration.showNotification("MaktabOS", {body:"Yangi maktab e’loni bor.", tag:"maktabos-announcement", icon:"./assets/icon-192.png"}).catch(() => {});
  }
}
openPendingAnnouncements();
