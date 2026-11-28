/* IlmNuri public platform experience modules */
(function(){
"use strict";
if(window.__MOS_EXPERIENCE__)return;window.__MOS_EXPERIENCE__=true;
const $=s=>document.querySelector(s),db=()=>typeof DB!=="undefined"?DB:{users:[],tasks:[],announcements:[],rooms:[],messages:{}},user=()=>typeof currentUser!=="undefined"?currentUser:null;
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0"),dateKey=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()),today=()=>dateKey(new Date());
const fmt=d=>{if(!d)return "Sana belgilanmagan";const x=new Date(d+"T00:00:00");return isNaN(x)?"":x.toLocaleDateString("uz-UZ",{day:"numeric",month:"long",year:"numeric"});};
let searchResults=[],noticeItems=[];
const iconPaths={"📚":"<path d='M4 19V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0 0 4h14'/>","📢":"<path d='m3 9 18-5v16L3 15z M7 16l2 5'/>","💬":"<path d='M21 11a8 8 0 0 1-8 8H4l2-4a8 8 0 1 1 15-4z'/>","👤":"<circle cx='12' cy='7' r='4'/><path d='M4 21v-2a8 8 0 0 1 16 0v2'/>","📝":"<path d='M4 20h4L20 8l-4-4L4 16z'/>","🧠":"<path d='M9 18h6m-5 4h4M8 15a7 7 0 1 1 8 0l-1 3H9z'/>","📊":"<path d='M4 20V10m8 10V4m8 16v-7'/>","✎":"<path d='M4 20h4L20 8l-4-4L4 16z'/>","🌙":"<path d='M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z'/>","⌕":"<circle cx='10' cy='10' r='6'/><path d='m15 15 5 5'/>","♧":"<path d='M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'/>","▤":"<path d='M4 20V10m8 10V4m8 16v-7'/>"};function replaceIcons(){const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes){if(!n.parentElement||n.parentElement.closest('script,style,textarea,input,[contenteditable],svg'))continue;const value=n.nodeValue;if(!Object.keys(iconPaths).some(k=>value.includes(k)))continue;const frag=document.createDocumentFragment();for(const part of value.split(/(📚|📢|💬|👤|📝|🧠|📊|✎|🌙|⌕|♧|▤)/u)){if(iconPaths[part]){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','18');svg.setAttribute('height','18');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('aria-hidden','true');svg.style.verticalAlign='middle';svg.innerHTML=iconPaths[part];frag.append(svg)}else frag.append(document.createTextNode(part))}n.replaceWith(frag)}}
function insights(box){
const d=db(),u=user(),students=(d.users||[]).filter(x=>x.role==="student"),tasks=d.tasks||[];
if(u.role==="student"){
const submitted=tasks.filter(t=>(t.submissions||[]).some(s=>s.studentId===u.id)).length,pending=tasks.length-submitted,rank=[...students].sort((a,b)=>(b.points||0)-(a.points||0)).findIndex(x=>x.id===u.id)+1,leaders=[...students].sort((a,b)=>(b.points||0)-(a.points||0)).slice(0,5);
box.innerHTML='<div class="mos-hero"><h2>Shaxsiy natijalar</h2><p>Ballaringiz, testlar va vazifalar bo‘yicha rivojlanishingizni kuzating.</p><div class="mos-hero-actions"><button onclick="navigate(\'tests\')">Test ishlash</button><button onclick="navigate(\'tasks\')">Vazifalarim</button></div></div><div class="grid-3"><div class="card"><div class="stat-label">Joriy ball</div><div class="stat-val">'+(u.points||0)+'</div></div><div class="card"><div class="stat-label">Yechilgan testlar</div><div class="stat-val">'+(u.solvedTests||[]).length+'</div></div><div class="card"><div class="stat-label">Kutilayotgan vazifa</div><div class="stat-val">'+pending+'</div></div></div><div class="grid-2"><div class="card"><h3>Vazifalar bajarilishi</h3><div class="mos-progress" style="margin-top:12px"><span style="width:'+(tasks.length?Math.round(submitted/tasks.length*100):0)+'%"></span></div><p class="page-sub" style="margin:8px 0 0">'+submitted+' / '+tasks.length+' ta topshirilgan</p><h3 style="margin-top:18px">Reytingdagi o‘rningiz: #'+(rank||"—")+'</h3><p class="page-sub" style="margin:3px 0 0">'+students.length+' nafar o‘quvchi orasida</p></div><div class="card"><h3>Faol o‘quvchilar</h3>'+leaders.map((x,i)=>'<div class="mos-event-row"><div class="mos-event-date"><strong>'+(i+1)+'</strong><span>O‘rin</span></div><div><strong>'+memberLink(x.id,x.name)+'</strong><p style="font-size:11px;color:var(--muted)">'+esc(x.grade||"")+' · '+(x.points||0)+' ball</p></div></div>').join("")+'</div></div>';return;}
const submissions=tasks.reduce((n,t)=>n+(t.submissions||[]).length,0),graded=tasks.reduce((n,t)=>n+(t.submissions||[]).filter(s=>s.grade!==null&&s.grade!==undefined).length,0),groups={};
tasks.forEach(t=>{const k=t.subject||"Boshqa";groups[k]=(groups[k]||0)+1;});
const rows=Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,7),max=Math.max(1,...rows.map(x=>x[1])),leaders=[...students].sort((a,b)=>(b.points||0)-(a.points||0)).slice(0,5);
box.innerHTML='<div class="mos-hero"><h2>Akademik tahlillar</h2><p>Maktabdagi o‘quv jarayoni, vazifalar va faollik ko‘rsatkichlari.</p><div class="mos-hero-actions"><button onclick="mosExportCSV()">Hisobotni CSV yuklash</button>'+(u.role==="admin"?'<button onclick="navigate(\'admin\')">Boshqaruv paneli</button>':"")+'</div></div><div class="grid-3"><div class="card"><div class="stat-label">O‘quvchilar</div><div class="stat-val">'+students.length+'</div></div><div class="card"><div class="stat-label">Vazifalar</div><div class="stat-val">'+tasks.length+'</div><small>'+submissions+' ta topshirish</small></div><div class="card"><div class="stat-label">Tekshirilgan ishlar</div><div class="stat-val">'+graded+'</div><small>'+(submissions-graded)+' ta tekshiruv kutilmoqda</small></div></div><div class="grid-2"><div class="card"><h3>Fanlar bo‘yicha vazifalar</h3><div class="mos-bars" style="margin-top:16px">'+(rows.map(x=>'<div class="mos-bar-row"><span>'+esc(x[0])+'</span><div class="mos-bar-track"><div class="mos-bar-fill" style="width:'+Math.round(x[1]/max*100)+'%"></div></div><strong>'+x[1]+'</strong></div>').join("")||'<p class="mos-search-empty">Vazifalar hali yaratilmagan.</p>')+'</div></div><div class="card"><h3>Top o‘quvchilar</h3>'+leaders.map((x,i)=>'<div class="mos-event-row"><div class="mos-event-date"><strong>'+(i+1)+'</strong><span>O‘rin</span></div><div><strong>'+memberLink(x.id,x.name)+'</strong><p style="font-size:11px;color:var(--muted)">'+esc(x.grade||"")+' · '+(x.points||0)+' ball</p></div></div>').join("")+'</div></div>';
}
function catalog(q){const d=db(),u=user(),items=[];
const roles={admin:"Administrator",student:"O‘quvchi",teacher:"O‘qituvchi",homeroom:"Sinf rahbari"};
const types={direct:"Shaxsiy chat",group:"Guruh",channel:"Kanal"};
const query=q.trim().toLowerCase();
if(!query)return [];
(d.tasks||[]).forEach(x=>items.push({kind:"Vazifa",icon:"📚",title:x.title,detail:[x.subject||"Fan",x.teacherName].filter(Boolean).join(" · "),view:"tasks",terms:[x.title,x.subject,x.desc,x.teacherName]}));(d.announcements||[]).forEach(x=>items.push({kind:"E’lon",icon:"📢",title:x.title,detail:x.author||"Ma’muriyat",view:"announcements",terms:[x.title,x.body,x.author]}));(d.rooms||[]).filter(r=>u.role==="admin" || r.id==="r_general" || r.members?.includes(u.id)).forEach(x=>items.push({kind:"Kanal",icon:"💬",title:x.name,detail:types[x.type]||"Chat",roomId:x.id,view:"chats",terms:[x.name,x.desc]}));(d.users||[]).forEach(x=>items.push({kind:"Foydalanuvchi",icon:"👤",title:x.name,detail:[x.login && "@"+x.login,roles[x.role],x.grade||x.subject].filter(Boolean).join(" · "),memberId:x.id,terms:[x.name,x.login,x.login && "@"+x.login,x.grade,x.subject]}));const matches=items.filter(x=>x.terms.some(t=>String(t||"").toLowerCase().includes(query)));
const result=[];
for(const kind of ["Foydalanuvchi","Kanal","Vazifa","E’lon"]){
  const group=matches.filter(x=>x.kind===kind);
  const rank=x=>{const title=String(x.title||"").toLowerCase();return title===query?0:title.startsWith(query)?1:2;};
  group.sort((a,b)=>rank(a)-rank(b)||String(a.title).localeCompare(String(b.title),"uz")||a.detail.localeCompare(b.detail,"uz"));
  result.push(...group.slice(0,15));
}
return result;
}
function openSearch(){
  if(!user())return;
  window.openModal('<div class="mos-search-head"><span aria-hidden="true">⌕</span><input id="mosSearchInput" aria-label="Qidiruv so‘zi" placeholder="Ism, vazifa yoki e’lonni qidiring..." autocomplete="off"><button type="button" class="btn-secondary" aria-label="Qidiruvni yopish" onclick="closeModal()">✕</button></div><div id="mosSearchResults" class="mos-search-results"></div>');
  const modal=$("#modalCard"),input=$("#mosSearchInput"),results=$("#mosSearchResults");
  modal.setAttribute("role","dialog");
  modal.setAttribute("aria-modal","true");
  modal.setAttribute("aria-label","Sayt bo‘ylab qidiruv");
  const headings={"Foydalanuvchi":"Foydalanuvchilar","Kanal":"Chatlar","Vazifa":"Vazifalar","E’lon":"E’lonlar"};
  function render(){
    const query=input.value.trim();
    searchResults=catalog(query);
    results.scrollTop=0;
    results.innerHTML=searchResults.map((x,i)=>{
      const heading=searchResults[i-1]?.kind!==x.kind ? '<h3>'+headings[x.kind]+'</h3>' : '';
      return heading+'<button type="button" class="mos-search-result" onclick="mosSearchOpen('+i+')"><span aria-hidden="true" class="mos-search-result-icon">'+x.icon+'</span><span class="mos-result-copy"><strong>'+esc(x.title)+'</strong><small>'+esc(x.detail)+'</small></span></button>';
    }).join("") || '<div class="mos-search-empty">'+(query?'Mos natija topilmadi.':'Qidirish uchun so‘z yozing.')+'</div>';
  }
  input.addEventListener("input",render);
  render();
  setTimeout(()=>input.focus(),40);
}
function notices(){const d=db(),u=user(),out=[];if(!u)return out;(d.announcements||[]).filter(a=>!(a.views||[]).includes(u.id)).forEach(a=>out.push({icon:"📢",title:a.title,detail:"Yangi maktab e’loni · "+(a.date||""),view:"announcements"}));if(u.role==="student")(d.tasks||[]).filter(t=>!(t.submissions||[]).some(s=>s.studentId===u.id)).forEach(t=>out.push({icon:"📚",title:t.title,detail:"Topshirilmagan vazifa · "+(t.deadline||""),view:"tasks"}));else(d.tasks||[]).forEach(t=>(t.submissions||[]).filter(s=>s.grade==null).forEach(s=>out.push({icon:"📝",title:t.title,detail:"Tekshiruv kutilmoqda: "+(s.studentName||"O‘quvchi"),view:"tasks"})));return out.slice(0,15);}
function openNotices(){noticeItems=notices();window.openModal('<h3 style="font-size:18px;margin-bottom:4px">Bildirishnomalar</h3><p class="page-sub" style="margin:0 0 12px">'+noticeItems.length+' ta muhim xabar</p>'+(noticeItems.length?noticeItems.map((n,i)=>'<button class="mos-notice-item" style="width:100%;text-align:left;background:transparent;color:var(--text)" onclick="mosNoticeOpen('+i+')"><span class="mos-notice-icon">'+n.icon+'</span><span><strong>'+esc(n.title)+'</strong><p>'+esc(n.detail)+'</p></span></button>').join(""):'<div class="mos-search-empty">Hozircha yangi bildirishnomalar yo‘q.</div>'));}
function exportCSV(){const d=db(),u=user(),students=u.role==="student"?[u]:(d.users||[]).filter(x=>x.role==="student"),rows=[["Ism","Sinf","Ball","Testlar","Topshirilgan vazifalar"]];students.forEach(x=>rows.push([x.name,x.grade||"",x.points||0,(x.solvedTests||[]).length,(d.tasks||[]).filter(t=>(t.submissions||[]).some(s=>s.studentId===x.id)).length]));const csv="\uFEFF"+rows.map(r=>r.map(v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"').join(";")).join("\r\n"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download="IlmNuri_hisobot_"+today()+".csv";a.click();URL.revokeObjectURL(url);if(window.notify)notify("Hisobot CSV formatida yuklandi.","success");}
function help(box) {
  const role = user().role;
  const student = role === "student";
  const groups = [
    {
      title: "Darslar va natijalar", icon: ICONS.task,
      topics: [
        student
          ? ["Vazifani qanday topshiraman?", "Vazifalar ro‘yxatidan topshiriqni tanlang. Shartni o‘qing, javobingizni yozing va «Topshirish»ni bosing. Ustoz qo‘ygan baho shu vazifada ko‘rinadi.", "tasks", "Vazifalarni ochish"]
          : ["Vazifa berish va baholash", "«Vazifa berish» orqali topshiriq yarating. O‘quvchilar yuborgan javoblar vazifa ostida chiqadi. Ballni kiritib, «Baholash»ni bosing.", "tasks", "Vazifalarni ochish"],
        student
          ? ["Testni qanday yechaman?", "Sinf va fanni tanlang. Test yonidagi «Boshlash»ni bosing. Javoblarni belgilab, «Yakunlash»ni bosing. Har bir to‘g‘ri javob uchun 5–10 ball beriladi.", "tests", "Fan testlarini ochish"]
          : ["Yangi testni qanday tuzaman?", "«Test tuzish»ni bosing. Sinf va test nomini kiriting. Har bir savol uchun bitta to‘g‘ri javob, ikkita noto‘g‘ri variant va ballni kiriting. 10 ta savol tayyor bo‘lgach, «Saqlash»ni bosing.", "tests", "Fan testlarini ochish"],
        ["Reytingdagi ball qanday hisoblanadi?", "«Haftalik»da shu haftada yig‘ilgan ball, «Umumiy»da jami yig‘ilgan ball ko‘rinadi. Mukofotga sarflangan ball umumiy reytingda hisoblanadi.", "ranking", "Reytingni ochish"],
        student
          ? ["Sertifikatimni qayerdan yuklayman?", "Profilning «Sertifikatlar» bo‘limida o‘zingizga berilgan sertifikatni tanlang. PDF tugmasi orqali uni ochishingiz va saqlashingiz mumkin.", "certs", "Sertifikatlarimni ochish"]
          : ["O‘quvchilar sertifikatlari qayerda?", "O‘quvchini ro‘yxatdan toping. «PDF ko‘rish» hujjatni ochadi. Sertifikatni o‘quvchiga bergach, «Topshirildi»ni bosing.", "student_certs", "Sertifikatlarni ochish"]
      ]
    },
    {
      title: "Profil va ilova", icon: ICONS.user,
      topics: [
        ["Profilimni qanday tahrirlayman?", "Profilingizda «Tahrirlash»ni bosing. Tug‘ilgan kun va boshqa ma’lumotlarni kiritib, saqlang. Qaysi ma’lumotlar boshqalarga ko‘rinishini sozlamalarda tanlaysiz.", "profile", "Profilni ochish"],
        ["Tizimdan qanday chiqaman?", "Profil sozlamalarining pastidagi «Tizimdan chiqish»ni bosing. Kirish sahifasi ochiladi.", "settings", "Profil sozlamalarini ochish"],
        ["Ilovani qanday o‘rnataman?", "Profil sozlamalarida «Ilovani o‘rnatish»ni bosing. Brauzer ko‘rsatmalariga amal qiling. iPhone’da Safari menyusidan «Bosh ekranga qo‘shish»ni tanlang.", "settings", "Profil sozlamalarini ochish"]
      ]
    },
    {
      title: "Muloqot va xabarlar", icon: ICONS.chat,
      topics: [
        ["Shaxsiy suhbatni qanday boshlayman?", "Chatlar ro‘yxatining pastki o‘ng burchagidagi «+» tugmasini bosing. «Shaxsiy chat»ni tanlab, suhbatdosh yonidagi «Yozish»ni bosing. Shu menyudan guruh yoki kanal ham yaratishingiz mumkin.", "chats", "Chatlarni ochish"],
        ["E’lonlar telefonga qanday keladi?", "Maktab e’lonlarida «Telefonda xabar olish»ni bosing. Brauzer ruxsat so‘rasa, bildirishnomalarni yoqing.", "announcements", "Maktab e’lonlarini ochish"],
        ["Saytdan kerakli ma’lumotni qanday topaman?", "Yuqoridagi lupa orqali sayt bo‘ylab qidiring. Kompyuterda Ctrl + K ham qidiruvni ochadi, Esc esa oynani yopadi.", "search", "Sayt bo‘ylab qidirish"]
      ]
    }
  ];
  if (role === "admin") {
    groups[1].topics.push(["Yangi foydalanuvchini qanday qo‘shaman?", "Boshqaruv panelida «Yangi foydalanuvchi»ni tanlang. Kerakli rol va hisob ma’lumotlarini kiriting.", "admin", "Boshqaruv panelini ochish"]);
  }

  box.innerHTML = `<section class="ilm-help" aria-labelledby="helpTitle">
    <header class="ilm-page-head"><div><h2 class="page-title" id="helpTitle" tabindex="-1">Yordam markazi</h2>
      <p class="page-sub">Savolni tanlang yoki kalit so‘z bilan qidiring.</p></div></header>
    <label class="help-search"><span>Yordamdan qidirish</span>
      <input type="search" placeholder="Masalan, sertifikat yoki tizimdan chiqish" autocomplete="off"></label>
    <p class="help-status" role="status"></p>
    <div class="help-groups">${groups.map(group => `<section class="help-group"><h3>${group.icon}${group.title}</h3>
      ${group.topics.map(([question, answer, target, action]) => `<details><summary>${question}</summary>
        <div class="help-answer"><p>${answer}</p><button type="button" class="btn-secondary" data-help-target="${target}">${action}</button></div>
      </details>`).join("")}</section>`).join("")}</div>
    <button type="button" class="btn-secondary help-reset" hidden>Qidiruvni tozalash</button>
  </section>`;

  const page = box.querySelector(".ilm-help");
  const input = page.querySelector("input");
  const status = page.querySelector(".help-status");
  const reset = page.querySelector(".help-reset");
  const normalize = text => text.toLowerCase().replace(/['‘’ʻʼ`]/g, "");
  function filterTopics() {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const section of page.querySelectorAll(".help-group")) {
      let matches = 0;
      const category = section.querySelector("h3").textContent;
      for (const topic of section.querySelectorAll("details")) {
        const text = normalize(category + " " + topic.textContent);
        topic.hidden = !words.every(word => text.includes(word));
        if (!topic.hidden) matches++;
      }
      section.hidden = matches === 0;
      count += matches;
    }
    status.textContent = !words.length ? "" : count ? `${count} ta savol topildi.` : "Mos savol topilmadi. Boshqa so‘z bilan qidiring.";
    reset.hidden = count > 0;
  }
  input.addEventListener("input", filterTopics);
  reset.addEventListener("click", () => { input.value = ""; filterTopics(); input.focus(); });
  page.addEventListener("click", async event => {
    const button = event.target.closest("[data-help-target]");
    if (!button) return;
    const target = button.dataset.helpTarget;
    if (target === "search") return openSearch();
    const profileSection = target === "settings" || target === "certs";
    await window.navigate(profileSection ? "profile" : target);
    if (profileSection && currentView === "profile") {
      const choice = target === "settings" ? box.querySelector('[aria-controls="profileSettings"]') : box.querySelector('[data-profile-choice="certs"]');
      if (choice) { choice.click(); choice.focus(); choice.scrollIntoView({block:"center"}); }
    } else if (currentView === target) {
      window.scrollTo(0, 0);
    }
  });
  page.querySelector("h2").focus({preventScroll:true});
  window.scrollTo(0, 0);
}
function mountTools(){if(!user())return;const top=$(".topbar"),right=top&&top.lastElementChild;if(!right||$("#mosToolbar"))return;const wrap=document.createElement("div");wrap.id="mosToolbar";wrap.className="mos-toolbar";wrap.innerHTML='<button class="mos-tool-btn" title="Qidiruv (Ctrl+K)" onclick="mosOpenSearch()">⌕ <span class="mos-tool-label">Qidiruv</span><span class="mos-shortcut">Ctrl K</span></button><button class="mos-tool-btn" title="Bildirishnomalar" onclick="mosOpenNotices()">♧ <span id="mosNoticeDot" class="mos-dot" style="display:none"></span></button>';right.insertBefore(wrap,right.firstChild);const tools=wrap.querySelectorAll("button");if(tools[0])tools[0].setAttribute("aria-label","Sayt bo‘ylab qidirish (Ctrl+K)");if(tools[1])tools[1].setAttribute("aria-label","Bildirishnomalarni ochish");refreshDot();}
function refreshDot(){const dot=$("#mosNoticeDot"),btn=dot&&dot.closest("button"),count=notices().length;if(dot)dot.style.display=count?"inline-block":"none";if(btn)btn.setAttribute("aria-label",count?"Bildirishnomalar, "+count+" ta":"Bildirishnomalar");}
function mountNav(){const nav=$("#navMenu");if(!nav||!user())return;[['insights','▤','Natijalar tahlili'],['help','<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .3c0 1.7-2.5 2.1-2.5 4M12 16.7h.01"/></svg>','Yordam markazi']].forEach(x=>{if(nav.querySelector('[data-mos-view="'+x[0]+'"]'))return;const b=document.createElement("button");b.className="nav-item"+(typeof currentView!=="undefined"&&currentView===x[0]?" active":"");b.dataset.mosView=x[0];b.innerHTML='<div class="nav-item-left"><span style="width:18px;text-align:center;font-weight:800">'+x[1]+'</span><span>'+x[2]+'</span></div>';b.onclick=()=>window.navigate(x[0]);nav.appendChild(b);});}
const originalNavigate=window.navigate;if(typeof originalNavigate==="function")window.navigate=async function(view){if(["insights","help"].includes(view)){if(!user())return;resetViewLoader();currentView=view;$("#sidebar")?.classList.remove("open");$("#sidebarOverlay")?.classList.remove("show");const nav=$("#navMenu");nav?.querySelectorAll(".nav-item").forEach(b=>{const target=b.dataset.mosView||(b.getAttribute("onclick")||"").match(/navigate\([\'"]([^\'"]+)/)?.[1];b.classList.toggle("active",target===view);if(target===view)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});if(window.renderBottomNav)window.renderBottomNav();if(window.updateTopbar)window.updateTopbar();const box=$("#mainContent");box.dataset.page=view;if(view==="insights")insights(box);else help(box);return;}const result=await originalNavigate.apply(this,arguments);mountNav();mountTools();refreshDot();return result;};
const originalEnter=window.enterApp;if(typeof originalEnter==="function")window.enterApp=function(){const result=originalEnter.apply(this,arguments);setTimeout(()=>{mountNav();mountTools();},0);return result;};
document.addEventListener("keydown",e=>{const t=e.target,typing=t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.isContentEditable);if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch();}if(e.key==="/"&&!typing&&user()){e.preventDefault();openSearch();}if(e.key==="Escape"&&$("#modalBackdrop")&&!$("#modalBackdrop").classList.contains("hidden"))window.closeModal();});
window.mosOpenSearch=openSearch;window.mosOpenNotices=openNotices;window.mosSearchOpen=async i=>{const x=searchResults[i];if(x){window.closeModal();if(x.memberId)openMember(x.memberId);else {await window.navigate(x.view);if(x.roomId)selectRoom(x.roomId);}}};window.mosNoticeOpen=i=>{const x=noticeItems[i];if(x){window.closeModal();window.navigate(x.view);}};window.mosExportCSV=exportCSV;
window.addEventListener("online",()=>window.notify&&notify("Internet aloqasi tiklandi.","success"));window.addEventListener("offline",()=>window.notify&&notify("Internet aloqasi uzildi. Oflayn rejimda davom etishingiz mumkin."));
let installEvent;
let installedThisSession = false;
window.appInstalled = () => installedThisSession || matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
window.installMaktabApp = async function() {
  if (appInstalled()) return;
  if (installEvent) {
    const prompt = installEvent;
    installEvent = null;
    document.getElementById("mosInstallBtn")?.remove();
    try {
      await prompt.prompt();
      await prompt.userChoice;
      return;
    } catch { /* Offer the browser menu when the native prompt expires. */ }
  }
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const instruction = ios ? "Safari’da Ulashish tugmasini bosing, so‘ng «Bosh ekranga qo‘shish»ni tanlang." :
    "Brauzer menyusini oching va «Ilovani o‘rnatish» yoki «Bosh ekranga qo‘shish»ni tanlang. Bu band ko‘rinmasa, saytni Chrome yoki Edge’da oching.";
  openModal('<h3>Ilovani o‘rnatish</h3><p class="page-sub">'+instruction+'</p><button class="btn-secondary" onclick="closeModal()">Yopish</button>');
};
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installEvent = event;
  const toolbar = $(".topbar")?.lastElementChild;
  if (!toolbar || $("#mosInstallBtn") || appInstalled()) return;
  const button = document.createElement("button");
  button.id = "mosInstallBtn";
  button.className = "mos-tool-btn";
  button.textContent = "Ilovani o‘rnatish";
  button.onclick = installMaktabApp;
  toolbar.prepend(button);
});
window.addEventListener("appinstalled", () => {
  installedThisSession = true;
  installEvent = null;
  $("#mosInstallBtn")?.remove();
  const button = $("#profileInstallBtn");
  if (button) { button.disabled = true; button.lastElementChild.textContent = "Ilova o‘rnatilgan"; }
});
function adaptTables(){document.querySelectorAll("#mainContent table,#modalCard table").forEach(table=>{if(table.parentElement.classList.contains("mos-table-scroll"))return;const wrap=document.createElement("div");wrap.className="mos-table-scroll";wrap.tabIndex=0;wrap.setAttribute("role","region");wrap.setAttribute("aria-label","Jadval");table.before(wrap);wrap.append(table)});const meta=document.querySelector("meta[name=theme-color]");if(meta)meta.content=document.documentElement.dataset.theme==="dark"?"#182235":"#ffffff";}
let iconQueued=false;const iconObserver=new MutationObserver(()=>{if(iconQueued)return;iconQueued=true;requestAnimationFrame(()=>{iconQueued=false;replaceIcons();adaptTables()})});iconObserver.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{mountNav();mountTools();},{once:true});else{mountNav();mountTools();}
})();