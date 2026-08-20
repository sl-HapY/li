import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'دستیار هوشمند لیارا | Liara AI Assistant',
  description: 'چت‌بات هوشمند برای پاسخگویی به سوالات شما درباره سرویس‌های لیارا',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
