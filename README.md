# BEY ANIME — Telegram Bot + React Mini App + MongoDB

**Loyiha holati:** ishlaydigan boshlang‘ich full-stack versiya (MVP), barcha master-prompt funksiyalari hali mavjud emas. O‘zingizga tegishli / tarqatish huquqingiz bor anime videolarini ulashing.

## Windows 11 da ishga tushirish

1. [Node.js LTS](https://nodejs.org/) va MongoDB Atlas ma’lumotlar bazasini tayyorlang.
2. `backend/.env.example` faylini `backend/.env` nomi bilan nusxalang. Quyidagilarni to‘ldiring:
   - `BOT_TOKEN`: @BotFather dan olingan haqiqiy bot token.
   - `ADMIN_IDS`: Telegram ID raqamingiz (masalan @userinfobot bilan biling).
   - `MONGO_URI`: MongoDB Atlas `mongodb+srv://...` ulanish manzili.
   - `JWT_SECRET`: 32+ belgilik tasodifiy maxfiy kalit.
   - `WEBAPP_URL`: serveringizga chiqarilgan **HTTPS** frontend manzili.
   - `FRONTEND_URL`: lokal `http://localhost:5173`, productionda HTTPS frontend manzili.
3. Loyiha bosh papkasida terminal oching:
   ```powershell
   npm install
   npm run dev
   ```
4. Brauzerda `http://localhost:5173` ni oching. Backend `http://localhost:5000/api/health` da tekshiriladi.
5. Telegram botga `/start` yuboring. Ism, familiya va tug‘ilgan sanani kiriting.

**MUHIM:** Telegram Mini App `web_app` tugmasi uchun internetda ishlaydigan haqiqiy HTTPS domeni kerak (`localhost` Telegram telefoningizdan ishlamaydi). Backend ham internetdan HTTPS bilan olinishi kerak. Frontend host qilganda `VITE_API_URL=https://api-sizning-domeningiz.com` qilib build qiling (Vite proxy faqat lokal rivojlantirishda ishlaydi). Browser CORS uchun `FRONTEND_URL` ham o‘sha frontend domeni bo‘lsin.

## Lokal brauzerda sinash

`backend/.env` ga `DEV_LOGIN=true` qo‘shing va botdan ro‘yxatdan o‘tgan Telegram ID ni kiriting. **Faqat lokal rivojlantirishda ishlating!** `NODE_ENV=production` holatida bu kirish avtomatik o‘chiriladi. Public serverda `DEV_LOGIN=true` qoldirmang.

## Admin

`ADMIN_IDS` ro‘yxatidagi Telegram akkaunt orqali Mini App ga kiring → `Admin panel`. Anime qo‘shing, qismlar uchun ruxsat etilgan MP4 HTTPS havolalarini ulang, Premium tarif narxlarini belgilang. Premium so‘rovlar admin Telegramiga tugmalar bilan boradi; admin tasdiqlaganda muddat MongoDB ga saqlanadi. Admin botga **avval /start yozgan bo‘lishi kerak**, aks holda Telegram xabar yubora olmaydi.

## Buyruqlar

- `npm run dev` — backend + frontend
- `npm run build` — frontend/dist yig‘adi
- `npm run start` — backendni ishga tushiradi
- `npm run test` — asosiy xavfsizlik/vaqt testlari

## Production / PM2

Frontendni Vercel, Netlify yoki boshqa HTTPS hostingga `frontend/dist` dan joylang. Backend uchun Node.js + MongoDB ishlaydigan VPS/server kerak. Backend `.env` da `NODE_ENV=production`, HTTPS domenlarni va maxfiy kalitlarni sozlang.

```bash
npm install
npm run build
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

Nginx yoki Caddy bilan backend port 5000 ni HTTPS orqali chiqarib qo‘ying. Telegramda @BotFather /setmenubutton yoki botdagi Web App tugmasini to‘g‘ri domen bilan sozlang. **Bot polling rejimda ishlaydi: bitta bot uchun faqat bitta process ishga tushiring.** MongoDB Atlas tarmoq IP allowlistni VPS IP manziliga cheklang.

## Ma’lumotlarni zaxiralash

MongoDB Atlas Backups yoki `mongodump --uri="MONGO_URI" --out backup` dan foydalaning. Qayta tiklash uchun `mongorestore` ishlatiladi. `.env` va maxfiy ma’lumotlarni GitHub ga qo‘ymang.

## Amalda ishlaydigan qismlar

- Telegram `/start` bilan yosh ogohlantirishi, ism/familiya/sana ro‘yxatdan o‘tish
- Telegram Mini App `initData` serverda HMAC tekshirish, JWT sessiya
- Admin ID tekshiruvi, yoshga qarab API katalog filtrlash
- Anime katalog, qidiruv, kartalar, tafsilot, reyting, izohlar, sevimlilar
- MP4 video epizodlar, o‘z progressini yozish, Premium playback tekshirish
- Uch Premium tarif, narxlarni tahrirlash, admin so‘rovlari, qo‘lda grant/revoke, expiry
- Admin panel: anime va epizod qo‘shish, nashr qilish, foydalanuvchi bloklash, izohlarni yashirish, sahifa va menyu, xabar tarqatish, sozlamalar, statistika
- Telegram botda admin so‘rovini tasdiqlash/rad etish

## Hozircha cheklovlar

Bu ZIP keng master-promptdagi **to‘liq production-ready** talablarning hammasini bajarmaydi. Xususan: drag-and-drop sahifa muharriri, multipart poster/video fayl yuklash, private storage/CDN tokenli stream himoyasi, HLS segmentlarga alohida avtorizatsiya, foydalanuvchi profil tahriri, kompleks media transcoding, subtitr/auto-next, kengaytirilgan analytics, to‘liq broadcast queue, ko‘p adminli transaction/idempotency va barcha 22 integration test hali yo‘q. **Hozirgi video URL modeli faqat ochiq va qonuniy tarqatiladigan MP4 manzillari uchun**, Premium video manzilini redirectdan so‘ng brauzer ko‘radi; kuchli DRM emas. Maxfiy Premium kontentni productionga joylashdan oldin private storage va proxy/short-lived signed media URL qo‘shish shart. Yoshni faqat o‘zi aytadi, bu haqiqiy yoshni tasdiqlash emas. Rasm/video URL lariga ishonchli domenlardan foydalaning.

**Xavfsizlik:** barcha sirlar server tomonda. `.env` namunaviy qiymatlar bilan keladi; haqiqiy token, MongoDB URL va JWT_SECRET kiritilmaguncha backend start bo‘lmaydi.
