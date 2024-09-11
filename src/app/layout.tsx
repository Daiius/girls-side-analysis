
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
  description: "GSシリーズの情報共有・分析サイト",
  openGraph: {
    type: 'website',
    url: 'https://faveo-systema.net/girls-side-analysis',
    description: "GSシリーズの情報共有・分析サイト",
    siteName: "Girl's Side Analysis",
    images: 'https://faveo-systema.net/girls-side-analysis/girls-side-analysis-logo.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="jp" suppressHydrationWarning>
      <SettingsProvider>
        <ThemeProvider defaultTheme='light' attribute='class'>
          <body className={clsx(
            'min-h-screen',
            'text-black dark:text-white',
            'bg-gradient-to-b from-sky-100 to-sky-200',
            'dark:from-sky-800 dark:to-sky-900',
            inter.className
          )}>
            <Header />
            <main className={clsx(
              'flex flex-col items-center',
              'p-5 md:p-24'
            )}>
              {children}
            </main>
          </body>
        </ThemeProvider>
      </SettingsProvider>
    </html>
  );
}

