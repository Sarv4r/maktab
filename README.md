# MaktabOS — Akademik raqamli ekotizim

MaktabOS o‘quvchilar, ustozlar va maktab ma’muriyati uchun yagona raqamli ta’lim platformasi.

## Imkoniyatlar
- Rollar bo‘yicha kabinetlar: o‘quvchi, ustoz, sinf rahbari va administrator
- Vazifalar, topshiriqlar va baholash
- Fan testlari va shaxsiy natijalar
- Maktab chatlari va e’lonlari
- O‘quv taqvimi
- Akademik tahlillar va CSV hisobot
- Global qidiruv va bildirishnomalar markazi
- Light/Dark rejimi va mobil moslashuv
- PWA ilova qobig‘i va asosiy sahifalar uchun oflayn kesh

## Frontend tuzilishi
- `index.html` — semantik sahifa tuzilishi va SEO metama’lumotlari
- `assets/css/styles.css` — asosiy dizayn
- `assets/css/experience.css` — taqvim, tahlillar va qo‘shimcha interfeys
- `assets/app.js` — mavjud ilova logikasi
- `assets/experience.js` — qo‘shimcha frontend modullari
- `sw.js` — statik resurslar uchun service worker
- `manifest.webmanifest` — PWA sozlamalari
- `favicon.svg` — loyiha belgisi

## Ishga tushirish
GitHub Pages yoki boshqa statik hostingda `index.html` orqali ishlaydi.

## Muhim eslatma
Bu bosqich frontend va statik resurslar bilan cheklangan. Firebase ma’lumotlar modeli va server qoidalari o‘zgartirilmagan. Oflayn rejim hozircha keshga tushgan sahifalar va resurslar bilan cheklangan; Firebase sinxronizatsiyasi uchun internet kerak.

### Telefon bildirishnomalari

GitHub Pages ilovasi ochiq turganda yangi e’lonni telefon bildirishnomasi sifatida ko‘rsata oladi. Ilova yopiq bo‘lganda yetkazish uchun shu loyihadagi Firebase Functions xizmatini bir marta joylashtiring.

1. Firebase loyihasida Cloud Functions va Firestore yoqilgan bo‘lishi kerak. Firestore qoidalarida mijoz ilovalariga `maktabosNotificationDevices` kolleksiyasini o‘qish va yozish huquqini bermang.
2. `cd functions && npm install` orqali bog‘liqliklarni o‘rnating. `npx web-push generate-vapid-keys --json` yordamida juft kalit yarating. Maxfiy kalitni repozitoriyga kiritmang.
3. Loyiha ildizida `firebase functions:secrets:set MAKTABOS_WEB_PUSH --project maktabos-7172b` buyrug‘iga publicKey, privateKey va subject (masalan, sayt HTTPS manzili) maydonlari bor JSON kiriting.
4. `firebase deploy --only functions:maktabos-notifications --project maktabos-7172b` orqali xizmatni joylashtiring.
5. Telefonda E’lonlar bo‘limidagi bildirishnoma tugmasi orqali obunani yoqing. Oldin faqat ochiq ilova rejimi yoqilgan bo‘lsa, o‘chirib qayta yoqing. Telefon qulflanganida bildirishnomada faqat yangi e’lon borligi ko‘rsatiladi.
