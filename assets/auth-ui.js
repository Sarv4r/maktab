/* IlmNuri secure entry screen; school-data access remains disabled during migration. */
const $ = id => document.getElementById(id);
const loginForm = $("secureLoginForm");
const email = $("secureEmail");
const password = $("securePassword");
const loginButton = $("secureLoginButton");
const resetButton = $("secureResetButton");
const registerButton = $("secureRegisterButton");
const verifyButton = $("secureVerifyButton");
const checkButton = $("secureCheckButton");
const logoutButton = $("secureLogoutButton");
const message = $("secureMessage");
const authView = $("secureAuthView");
const accountView = $("secureAccountView");
let api, initialized = false, busy = false, user = null;

function say(text, error = false) {
  message.textContent = text;
  message.setAttribute("role", error ? "alert" : "status");
  message.dataset.kind = error ? "error" : "info";
}
function refreshControls() {
  loginButton.disabled = !initialized || !api || busy || !navigator.onLine;
  resetButton.disabled = !initialized || !api || busy || !navigator.onLine;
  logoutButton.disabled = !initialized || !api || busy;
  registerButton.disabled = !initialized || !api || busy || !navigator.onLine;
  verifyButton.disabled = !initialized || !api || busy || !navigator.onLine;
  checkButton.disabled = !initialized || !api || busy || !navigator.onLine;
}
function describeError(error) {
  switch (error?.code) {
    case "auth/operation-not-allowed": return "Firebase’da Email/Password orqali hisob yaratish ruxsati yoqilmagan.";
    case "auth/admin-restricted-operation": return "Firebase sozlamalarida yangi hisob yaratish cheklangan.";
    case "auth/invalid-api-key": return "Firebase konfiguratsiyasi noto‘g‘ri (auth/invalid-api-key).";
    case "auth/unauthorized-domain": return "Sayt domeniga Firebase’da ruxsat berilmagan.";
    case "auth/quota-exceeded": return "Firebase ro‘yxatdan o‘tish limiti tugagan.";
    case "auth/network-request-failed": return "Internet aloqasini tekshiring va qayta urining.";
    case "auth/too-many-requests": return "Juda ko‘p urinish. Keyinroq qayta urining.";
    case "auth/invalid-email": return "Elektron pochta manzilini to‘g‘ri kiriting.";
    case "auth/user-disabled": return "Bu hisob bloklangan.";
    case "auth/email-already-in-use": return "Bu email bilan hisob bor. Kirish yoki parolni tiklashni tanlang.";
    case "auth/weak-password": case "auth/password-does-not-meet-requirements": return "Parol kamida 6 belgi, katta va kichik harf hamda raqamdan iborat bo‘lsin.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password": return "Email yoki parol noto‘g‘ri.";
    default: return "Amal bajarilmadi. " + (/^auth\/[a-z0-9-]+$/.test(error?.code || "") ? "(" + error.code + ")" : "Qayta urining.");
  }
}
async function run(action) {
  if (!initialized || !api || busy) return;
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
registerButton.addEventListener("click", () => {
  if (!loginForm.reportValidity()) return;
  if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{6,}$/.test(password.value)) return say("Parol kamida 6 belgi, katta va kichik harf hamda raqamdan iborat bo‘lsin.",true);
  run(async () => {
    say("Hisob yaratilmoqda…");
    try { await api.register(email.value,password.value); }
    finally { password.value = ""; }
    try { await api.verifyEmail(); say("Hisob yaratildi. Emailingizga tasdiqlash xati yuborildi."); }
    catch (_) { say("Hisob yaratildi. Tasdiqlash xatini qayta yuborish tugmasidan foydalaning."); }
  });
});
verifyButton.addEventListener("click",()=>run(async()=>{await api.verifyEmail();say("Tasdiqlash xati yuborildi.");}));
checkButton.addEventListener("click",()=>run(async()=>{const next=await api.refreshUser();verifyButton.hidden=Boolean(next?.emailVerified);checkButton.hidden=Boolean(next?.emailVerified);say(next?.emailVerified?"Email tasdiqlandi. Maktab ma’lumotlari hali ulanmagan.":"Email hali tasdiqlanmagan.");}));
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
    await api.initializeSession();
    api.observeSession(next => {
      initialized = true;
      user = next;
      authView.hidden = Boolean(next);
      accountView.hidden = !next;
      $("secureAccountEmail").textContent = next?.email || "";
      password.value = "";
      verifyButton.hidden = !next || next.emailVerified;
      checkButton.hidden = !next || next.emailVerified;
      say(next ? "Firebase orqali kirish muvaffaqiyatli. Maktab bo‘limlari xavfsiz migratsiya tugaguncha yopiq." : "Email va yangi parolingiz bilan kiring.");
      refreshControls();
    }, () => { initialized = false; refreshControls(); say("Seansni tekshirib bo‘lmadi.",true); });
    refreshControls();
  } catch (error) { api = null; refreshControls(); say("Kirish xizmati yuklanmadi. " + (/^auth\/[a-z0-9-]+$/.test(error?.code || "") ? error.code : "Internetni tekshirib, sahifani yangilang."),true); }
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
