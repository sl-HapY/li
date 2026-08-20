# دستیار هوشمند لیارا | Liara AI Assistant

یک چت‌بات هوشمند برای پاسخگویی به سوالات کاربران درباره سرویس‌های لیارا.

## ویژگی‌ها

- 🤖 پشتیبانی از زبان فارسی
- 🔍 جستجو در مستندات لیارا
- 💬 مکالمه طبیعی و روان
- 📱 طراحی ریسپانسیو و زیبا
- ⚡️ پاسخ‌دهی سریع
- 🔒 Rate Limiting برای امنیت
- 📊 تشخیص Intent کاربر
- 🔗 ارائه منابع مرتبط

## نصب و راه‌اندازی

```bash
# نصب وابستگی‌ها
npm install

# اسکرپ مستندات لیارا
node scripts/scrape-docs.js

# اجرای پروژه در حالت توسعه
npm run dev

# بیلد برای پروداکشن
npm run build

# اجرای پروژه
npm start
```

## متغیرهای محیطی

یک فایل `.env` بسازید و کلید API خود را قرار دهید:

```
OPENAI_API_KEY=your_api_key_here
```

## استقرار در لیارا

```bash
# نصب CLI لیارا
npm install -g @liara/cli

# ورود به لیارا
liara login

# استقرار پروژه
liara deploy
```

## تکنولوژی‌های استفاده شده

- Next.js 14
- React 18
- TailwindCSS
- Framer Motion
- React Markdown

## مجوز

MIT License
