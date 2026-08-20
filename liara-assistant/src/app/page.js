'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Loader2, MessageSquare, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'سلام! 👋 من دستیار هوشمند لیارا هستم. چطور می‌تونم کمکتون کنم؟\n\nمی‌تونید در مورد موضوعات زیر سوال بپرسید:\n- 🚀 استقرار برنامه‌ها (Deploy)\n- 💾 پایگاه‌های داده (Database)\n- 🌐 دامنه و DNS\n- 💰 قیمت‌ها و تعرفه‌ها\n- 🤖 سرویس‌های هوش مصنوعی\n- 📧 سرور ایمیل\n- 🐳 داکر و کانتینرها',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10),
        }),
      });

      const data = await response.json();
      
      let assistantContent = data.response || 'متأسفانه خطایی رخ داد.';
      
      if (data.sources && data.sources.length > 0) {
        assistantContent += '\n\n**منابع مرتبط:**\n' + data.sources.map(s => `- [${s.title}](${s.url})`).join('\n');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'چطور برنامه‌ام رو دیپلوی کنم؟',
    'انواع دیتابیس در لیارا چیست؟',
    'هزینه استفاده از لیارا چقدره؟',
    'چطور از هوش مصنوعی استفاده کنم؟',
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-xl md:relative"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">منو</h2>
                <button onClick={() => setShowSidebar(false)} className="md:hidden">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-2">
                <a href="#" className="block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">🏠 صفحه اصلی</a>
                <a href="https://liara.ir" target="_blank" className="block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">🌐 سایت لیارا</a>
                <a href="https://liara.ir/blog" target="_blank" className="block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">📝 وبلاگ</a>
                <a href="https://github.com/liara-cloud" target="_blank" className="block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">💻 گیت‌هاب</a>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white">دستیار هوشمند لیارا</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">پشتیبان هوشمند شما</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:inline">AI Powered</span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-500'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-400'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-md'
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content}
                  </ReactMarkdown>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-md">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">سوالات پیشنهادی:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 rounded-full text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <footer className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="سوال خود را بپرسید..."
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white placeholder-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">ارسال</span>
            </button>
          </form>
          <p className="text-xs text-center text-slate-400 mt-2">
            پاسخ‌ها توسط هوش مصنوعی تولید می‌شوند. همیشه اطلاعات را بررسی کنید.
          </p>
        </footer>
      </div>
    </div>
  );
}
