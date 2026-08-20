import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const requestCache = new Map();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;

let documents = [];
try {
  const docsPath = join(process.cwd(), 'data', 'documents.json');
  documents = JSON.parse(readFileSync(docsPath, 'utf-8'));
} catch (error) {
  console.error('Error loading documents:', error);
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, ' ').split(/\s+/).filter(word => word.length > 2);
}

function searchDocuments(query, topK = 5) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  
  const scores = documents.map((doc) => {
    let score = 0;
    queryTokens.forEach(token => {
      const count = (doc.content.toLowerCase().match(new RegExp(token, 'gi')) || []).length;
      score += count;
    });
    if (doc.title.toLowerCase().includes(query.toLowerCase())) score *= 2;
    return { score, doc };
  });
  
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK).map(s => s.doc);
}

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestCache.get(ip) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);
  if (recentRequests.length >= RATE_LIMIT) return false;
  recentRequests.push(now);
  requestCache.set(ip, recentRequests);
  return true;
}

function extractIntent(message) {
  const lowerMessage = message.toLowerCase();
  const intents = {
    deployment: ['دیپلوی', 'استقرار', 'deploy', 'آپلود'],
    database: ['دیتابیس', 'database', 'mysql', 'postgresql', 'mongodb', 'redis'],
    domain: ['دامنه', 'domain', 'dns', 'ssl'],
    pricing: ['قیمت', 'هزینه', 'تعرفه'],
    ai: ['هوش مصنوعی', 'ai', 'llm', 'chat'],
  };
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) return intent;
  }
  return 'general';
}

async function callLLM(messages, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) throw new Error(`LLM API error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    
    const body = await request.json();
    const { message, conversationHistory = [] } = body;
    
    if (!message) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const demoResponse = generateDemoResponse(message);
      return NextResponse.json({ response: demoResponse, sources: [], intent: extractIntent(message) });
    }
    
    const relevantDocs = searchDocuments(message);
    const context = relevantDocs.map(doc => `${doc.title}: ${doc.content.substring(0, 500)}`).join('\n\n');
    const intent = extractIntent(message);
    
    const systemPrompt = `شما دستیار هوشمند لیارا هستید. به فارسی پاسخ دهید. مستندات: ${context}`;
    const messages = [{ role: 'system', content: systemPrompt }, ...conversationHistory, { role: 'user', content: message }];
    
    const assistantResponse = await callLLM(messages, apiKey);
    const sources = relevantDocs.map(doc => ({ title: doc.title, url: doc.url }));
    
    return NextResponse.json({ response: assistantResponse, sources, intent });
  } catch (error) {
    console.error('Chat error:', error);
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ response: generateDemoResponse(body.message || ''), sources: [], error: error.message });
  }
}

function generateDemoResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('سلام') || lower.includes('درود')) return 'سلام! 👋 من دستیار هوشمند لیارا هستم. چطور می‌تونم کمکتون کنم؟\n\nمی‌تونید در مورد موضوعات زیر سوال بپرسید:\n- 🚀 استقرار برنامه‌ها (Deploy)\n- 💾 پایگاه‌های داده (Database)\n- 🌐 دامنه و DNS\n- 💰 قیمت‌ها و تعرفه‌ها\n- 🤖 سرویس‌های هوش مصنوعی\n- 📧 سرور ایمیل\n- 🐳 داکر و کانتینرها';
  
  if (lower.includes('دیپلوی') || lower.includes('استقرار')) {
    return `برای دیپلوی کردن برنامه‌تان در لیارا، مراحل زیر را دنبال کنید:\n\n**روش‌های استقرار:**\n\n۱. **از طریق پنل کاربری:**\n   - وارد پنل لیارا شوید\n   - روی «برنامه‌ جدید» کلیک کنید\n   - نوع برنامه را انتخاب کنید (Node.js, Python, PHP, etc.)\n   - ریپوزیتوری گیت‌هاب خود را متصل کنید یا فایل‌ها را آپلود کنید\n\n۲. **از طریق خط فرمان (LIARA CLI):**\n   \`\`\`bash\n   npm install -g @liara/cli\n   liara login\n   liara deploy\n   \`\`\`\n\n۳. **از طریق Docker:**\n   - یک Dockerfile در ریشه پروژه خود ایجاد کنید\n   - لیارا به صورت خودکار آن را تشخیص می‌دهد\n\nآیا نیاز به راهنمایی بیشتری دارید؟`;
  }
  
  if (lower.includes('دیتابیس') || lower.includes('database') || lower.includes('mysql') || lower.includes('mongodb')) {
    return `لیارا انواع مختلفی از پایگاه‌های داده را پشتیبانی می‌کند:\n\n**انواع Database در لیارا:**\n\n۱. **MySQL** - مناسب برای برنامه‌های رابطه‌ای\n۲. **PostgreSQL** - پیشرفته با قابلیت‌های بیشتر\n۳. **MongoDB** - پایگاه داده NoSQL\n۴. **Redis** - کش و ذخیره‌سازی کلید-مقدار\n\n**راه‌اندازی:**\n- از پنل کاربری، بخش «پایگاه داده» را انتخاب کنید\n- نوع دیتابیس مورد نظر را انتخاب کنید\n- پلن مناسب را انتخاب کرده و ایجاد کنید\n\n**مزایا:**\n- ✅ بکاپ‌گیری خودکار\n- ✅ مقیاس‌پذیری آسان\n- ✅ مانیتورینگ لحظه‌ای`;
  }
  
  if (lower.includes('قیمت') || lower.includes('هزینه') || lower.includes('تعرفه')) {
    return `💰 **تعرفه‌های لیارا:**\n\nلیارا بر اساس مصرف منابع محاسبه می‌شود:\n\n**سرویس‌های ابری (PaaS):**\n- شروع از ۵۰ هزار تومان ماهانه\n- بر اساس CPU، RAM و ترافیک\n\n**پایگاه داده:**\n- شروع از ۱۰۰ هزار تومان ماهانه\n\n**ذخیره‌سازی اشیاء:**\n- ۵۰ گیگابایت رایگان\n- مازاد: هر گیگابایت ۵ هزار تومان\n\n**ترافیک شبکه:**\n- ۱۰۰ گیگابایت رایگان ماهانه\n\n🔗 برای مشاهده تعرفه‌های دقیق: https://liara.ir/pricing`;
  }
  
  if (lower.includes('هوش مصنوعی') || lower.includes('ai') || lower.includes('llm')) {
    return `🤖 **سرویس‌های هوش مصنوعی لیارا:**\n\nلیارا دسترسی به مدل‌های مختلف زبانی را فراهم می‌کند:\n\n**مدل‌های موجود:**\n- GPT-4, GPT-3.5 (OpenAI)\n- Claude (Anthropic)\n- Gemini (Google)\n- Llama (Meta)\n\n**راه‌اندازی سریع:**\n\`\`\`bash\nnpm install @liara/ai\n\`\`\`\n\n**مزایا:**\n- ✅ بدون نیاز به کارت اعتباری بین‌المللی\n- ✅ پرداخت ریالی\n- ✅ سرعت بالا\n- ✅ پشتیبانی فنی`;
  }
  
  if (lower.includes('دامنه') || lower.includes('dns') || lower.includes('ssl')) {
    return `🌐 **مدیریت دامنه و DNS در لیارا:**\n\n**اتصال دامنه:**\n۱. وارد پنل لیارا شوید\n۲. به بخش «دامنه‌ها» بروید\n۳. دامنه خود را اضافه کنید\n۴. رکوردهای DNS را تنظیم کنید\n\n**SSL رایگان:**\n- لیارا به صورت خودکار SSL ارائه می‌دهد\n- فعال‌سازی با یک کلیک\n- تمدید خودکار\n\n**DNS داخلی لیارا:**\n- امکان مدیریت کامل DNS\n- رکوردهای A, AAAA, CNAME, MX, TXT`;
  }
  
  return `متوجه شدم که سوالی دارید. برای اینکه بتونم بهتر کمکتون کنم، لطفاً کمی بیشتر توضیح بدید.\n\nمثلاً می‌تونید بپرسید:\n- چطور برنامه‌ام رو دیپلوی کنم؟\n- چه نوع دیتابیسی برای پروژه‌ام مناسبه؟\n- هزینه استفاده از لیارا چقدره؟\n- چطور از سرویس‌های هوش مصنوعی استفاده کنم؟\n\nمن اینجام تا به تمام سوالات شما درباره سرویس‌های لیارا پاسخ بدم! 😊`;
}
