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
