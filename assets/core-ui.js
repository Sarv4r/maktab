
/* IlmNuri UI core: certificate links, connectivity and accessible dialogs. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const pending = new URL(location.href).searchParams.get("cert");
  let handled = false, lastModalOpen = false, previousFocus = null;
  function showConnection() {
    const status = $("ilmConnection");
    if (!status) return;
    status.hidden = navigator.onLine;
    status.textContent = navigator.onLine ? "" : "Internet aloqasi yo‘q. Serverga yuborish uchun internet kerak.";
  }
  function addCertificateQR() {
    const area = $("certPrintArea");
    if (!area || !area.dataset.certId || area.querySelector(".ilm-cert-qr")) return;
    const url = new URL("./", location.href);
    url.searchParams.set("cert", area.dataset.certId);
    const panel = document.createElement("div");
    panel.className = "ilm-cert-qr";
    panel.style.cssText = "display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:14px;color:#1d334b;font:12px system-ui";
    const qr = document.createElement("div");
    try {
      const code = qrcode(0, "M");
      code.addData(url.href); code.make();
      qr.innerHTML = code.createSvgTag(3,12);
      qr.querySelector("svg")?.setAttribute("aria-label", "Sertifikat havolasining QR kodi");
      qr.style.cssText = "background:white;max-width:100%;line-height:0";
    } catch (_) { return; }
    const link = document.createElement("a");
    link.href = url.href; link.textContent = "Sertifikatni IlmNuri orqali ochish";
    link.style.cssText = "color:#1d334b;max-width:160px;text-align:left";
    panel.append(qr,link);
    area.querySelector(".cert-frame-inner")?.append(panel);
  }
  function checkCertificate() {
    if (handled || !pending || typeof currentUser === "undefined" || !currentUser) return;
    handled = true;
    const user = currentUser;
    Promise.resolve(pullFromCloud(true)).then(ok => {
      if (currentUser?.id !== user.id) { handled = false; return; }
      if (!ok) { notify("Sertifikatni tekshirish uchun internet kerak.", "error"); return; }
      const record = DB.certificates.find(c => c.id === pending);
      if (!record || (user.role === "student" && record.studentId !== user.id)) {
        notify("Sertifikat topilmadi yoki uni ko‘rish huquqi yo‘q.", "error"); return;
      }
      openCertPdfModal(record.id);
    }).catch(() => notify("Sertifikatni ochib bo‘lmadi.", "error"));
  }
  function improveModal() {
    const backdrop = $("modalBackdrop"), card = $("modalCard");
    if (!backdrop || !card) return;
    const open = !backdrop.classList.contains("hidden");
    if (open) {
      card.setAttribute("role","dialog"); card.setAttribute("aria-modal","true");
      card.setAttribute("aria-label",card.querySelector("h1,h2,h3")?.textContent || "IlmNuri oynasi");
      if (!lastModalOpen) { previousFocus = document.activeElement; card.tabIndex = -1; card.focus({preventScroll:true}); }
      addCertificateQR();
    } else if (lastModalOpen && previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    lastModalOpen = open;
  }
  document.addEventListener("keydown", e => {
    if (e.key !== "Tab" || !lastModalOpen) return;
    const card = $("modalCard");
    const controls = [...card.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length);
    if (!controls.length) { e.preventDefault(); card.focus(); return; }
    if (e.shiftKey && (document.activeElement === controls[0] || document.activeElement === card)) { e.preventDefault(); controls.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0].focus(); }
  });
  function init() {
    const backdrop = $("modalBackdrop");
    if (backdrop) new MutationObserver(improveModal).observe(backdrop,{attributes:true,attributeFilter:["class"],childList:true,subtree:true});
    const app = $("appScreen");
    if (app) new MutationObserver(checkCertificate).observe(app,{attributes:true,attributeFilter:["class"]});
    showConnection(); improveModal(); checkCertificate();
  }
  window.addEventListener("online",showConnection);
  window.addEventListener("offline",showConnection);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();
