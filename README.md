# رمل (Raml)

مینیمال‌ترین نقش‌آفرینی متنی به سبک D&D برای بازار ایران — PWA + بک‌اند پراکسی LLM.

## ساختار

```
/frontend   React + Vite + TypeScript + Tailwind + Capacitor (PWA/APK)
/backend    Node.js + Express + MongoDB (با fallback حافظه) + پراکسی OpenAI
```

## اجرای محلی

### ۱) بک‌اند

```bash
cd backend
cp .env.example .env   # در صورت نیاز
npm install
npm run dev
```

- پورت پیش‌فرض: `http://localhost:3001`
- اگر MongoDB در دسترس نباشد، به‌صورت خودکار از **حافظهٔ موقت** استفاده می‌شود.
- با `USE_MOCK_AI=true` نیازی به کلید API نیست (حالت پیش‌فرض توسعه).

برای LLM واقعی:

```env
USE_MOCK_AI=false
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### ۲) فرانت‌اند

```bash
cd frontend
npm install
npm run dev
```

باز کنید: `http://localhost:5173`  
Vite درخواست‌های `/api` را به بک‌اند پروکسی می‌کند.

### ۳) تست انرژی

```bash
cd backend && npm test
```

## جریان بازی

1. **کاربر جدید:** نوار بالا (تنظیمات + انرژی) + متن آغازین + نام + دکمه «باز کردن چشم‌ها»
2. بک‌اند وضعیت را نگه می‌دارد و از LLM فقط JSON ساخت‌یافته می‌گیرد
3. فرانت فقط state را رندر می‌کند (تایپ‌رایتر، کارت اقدام، تاس D20)
4. **پس از ۳ روز بازی** (یا آنلاک دیباگ / خرید) رابط کامل فعال می‌شود: هدر آمار، مکان، داک پایین، تاس، فروشگاه

### تاس مهارت

1. AI → `needs_dice_roll: true`
2. بازیکن تاس می‌ریزد (فرانت: D20 + اصلاح‌گر)
3. فقط نتیجه به بک‌اند ارسال می‌شود
4. بک‌اند به AI می‌گوید چه شد و state بعدی را برمی‌گرداند

## کافه‌بازار / Capacitor

```bash
cd frontend
npm run build
npx cap add android   # یک‌بار
npm run cap:sync
npm run cap:open
```

- شناسه اپ: `ir.raml.game`
- SKUها در `frontend/pool.json` (اسکلت Bazaar IAP)
- تبلیغ پاداش‌دار: ماک در UI؛ جای خالی برای Tapsell/Yektanet

## API خلاصه

| متد | مسیر | توضیح |
|-----|------|--------|
| GET | `/api/game/state` | وضعیت بازیکن (`x-device-id`) |
| POST | `/api/game/awaken` | بیداری با نام/کلاس |
| POST | `/api/game/action` | انتخاب گزینه |
| POST | `/api/game/dice` | ارسال نتیجه تاس |
| POST | `/api/game/debug/unlock` | آنلاک رابط کامل |
| GET | `/api/mono/shop` | لیست SKU |
| POST | `/api/mono/ads/reward` | +۵ انرژی |
| POST | `/api/mono/iap/verify` | تأیید خرید ماک |

## پالت OLED

| نقش | رنگ |
|-----|------|
| پس‌زمینه | `#000000` |
| متن | `#E4E4E7` |
| اکسنت | `#F59E0B` |
| فونت | Vazirmatn |
