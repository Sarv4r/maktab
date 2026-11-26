/* IlmNuri secure entry screen; school-data access remains disabled during migration. */
const $ = id => document.getElementById(id);
const loginForm = $("secureLoginForm");
const email = $("secureEmail");
const password = $("securePassword");
const loginButton = $("secureLoginButton");
const resetButton = $("secureResetButton");
const logoutButton = $("secureLogoutButton");
const message = $("secureMessage");
const authView = $("secureAuthView");
const accountView = $("secureAccountView");
let api, busy = false, user = null;

function say(text, error = false) {
  message.textContent = text;
  message.setAttribute("role", error ? "alert" : "status");
  message.dataset.kind = error ? "error" : "info";
}
function refreshControls() {
  loginButton.disabled = !api || busy || !navigator.onLine;
  resetButton.disabled = !api || busy || !navigator.onLine;
  logoutButton.disabled = !api || busy;
}
function describeError(error) {
  switch (error?.code) {
    case "auth/network-request-failed": return "Internet aloqasini tekshiring va qayta urining.";
    case "auth/too-many-requests": return "Juda ko‘p urinish. Keyinroq qayta urining.";
    case "auth/invalid-email": return "Elektron pochta manzilini to‘g‘ri kiriting.";
    case "auth/user-disabled": return "Hisobdan foydalanib bo‘lmaydi. Administratorga murojaat qiling.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password": return "Email yoki parol noto‘g‘ri.";
    default: return "Amal bajarilmadi. Qayta urining yoki administratorga murojaat qiling.";
  }
}
async function run(action) {
  if (!api || busy) return;
  busy = true; refreshControls();
  try { await action(); } catch (error) { say(describeError(error),true); }
  finally { busy = false; refreshControls(); }
}
loginForm.addEventListener("submit", e => {
  e.preventDefault();
  if (!loginForm.reportValidity()) return;
  run(async () => {
    say("Hisob tekshirilmoqda…");
    try { await api.login(email.value,password.value); }
    finally { password.value = ""; }
  });
});
resetButton.addEventListener("click", () => {
  if (!email.reportValidity()) return;
  run(async () => {
    try { await api.resetPassword(email.value); }
    catch (error) { if (error?.code !== "auth/user-not-found") throw error; }
    say("Agar ushbu email bilan hisob mavjud bo‘lsa, parolni tiklash xati yuboriladi.");
  });
});
logoutButton.addEventListener("click", () => run(async () => {
  await api.logout(); say("Hisobdan chiqdingiz.");
}));
window.addEventListener("online", () => { refreshControls(); if (!user) say("Internet aloqasi tiklandi."); });
window.addEventListener("offline", () => { refreshControls(); say("Internet aloqasi yo‘q. Kirish uchun internet kerak.",true); });
try { localStorage.removeItem("maktabos_active_uid_v1"); } catch {}
refreshControls();
(async () => {
  try {
    api = await import("./firebase-auth.js");
    api.observeSession(next => {
      user = next;
      authView.hidden = Boolean(next);
      accountView.hidden = !next;
      $("secureAccountEmail").textContent = next?.email || "";
      password.value = "";
      say(next ? "Firebase orqali kirish muvaffaqiyatli. Maktab bo‘limlari xavfsiz migratsiya tugaguncha yopiq." : "Email va yangi parolingiz bilan kiring.");
      refreshControls();
    }, () => say("Seansni tekshirib bo‘lmadi.",true));
    refreshControls();
  } catch (_) { api = null; refreshControls(); say("Kirish xizmati yuklanmadi. Internetni tekshirib, sahifani yangilang.",true); }
})();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).then(reg => {
    let reload = false;
    const offer = () => {
      if (!reg.waiting || !navigator.serviceWorker.controller) return;
      const btn = $("secureUpdate");
      btn.hidden = false;
      btn.onclick = () => { reload = true; reg.waiting?.postMessage("activate-update"); };
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (reload) location.reload(); });
    reg.addEventListener("updatefound", () => reg.installing?.addEventListener("statechange",offer));
    offer(); reg.update().catch(()=>{});
  }).catch(()=>{});
}
