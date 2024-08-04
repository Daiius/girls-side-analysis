import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import clsx from 'clsx';
import { ThemeProvider } from 'next-themes';

import Header from '@/components/Header';
import SettingsProvider from '@/providers/SettingsProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Girl's Side Analysis",
  description: "💚💙 GSシリーズの情報共有・分析サイト❤🧡",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="jp" suppressHydrationWarning>
      <SettingsProvider>
        <ThemeProvider defaultTheme='system' attribute='class'>
          <body className={clsx(
            'h-full w-full',
            'text-black dark:text-white',
            'bg-gradient-to-b from-sky-100 to-sky-200',
            'dark:from-sky-800 dark:to-sky-900',
            inter.className
          )}>
            <Header />
            {children}
          </body>
        </ThemeProvider>
      </SettingsProvider>
    </html>
  );
}
