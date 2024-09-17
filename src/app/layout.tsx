
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import clsx from 'clsx';

import Header from '@/components/Header';
import SettingsProvider from '@/providers/SettingsProvider';
import Footer from '@/components/Footer';

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
  },
  icons: [{
    rel: 'apple-touch-icon',
    url: 'https://faveo-systema.net/girls-side-analysis/girls-side-analysis-touch-icon.png',
    sizes: '180x180',
  }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="jp" suppressHydrationWarning>
      <SettingsProvider>
        <body className={clsx(
          'min-h-screen',
          'text-black dark:text-white',
          'bg-sky-100',
          'dark:from-sky-800 dark:to-sky-900',
          'flex flex-col',
          inter.className
        )}>
          <Header />
          <main className={clsx(
            'flex flex-col items-center',
            'p-5 md:px-24 md:py-5 flex-1'
          )}>
            {children}
          </main>
          <Footer />
        </body>
      </SettingsProvider>
    </html>
  );
}

