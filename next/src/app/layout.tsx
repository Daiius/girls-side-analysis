
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import clsx from 'clsx';

import Header from '@/components/Header';
import SettingsProvider from '@/providers/SettingsProvider';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import { SITE_DESCRIPTION, siteGraph } from '@/lib/structuredData';

const inter = Inter({ subsets: ["latin"] });

const hostUrl = process.env.HOST_URL
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

export const metadata: Metadata = {
  metadataBase: new URL(hostUrl),
  title: {
    default: "Girl's Side Analysis",
    template: "%s | Girl's Side Analysis",
  },
  // 「GSシリーズの情報共有・分析サイト」から差し替えた。抽象語だけの説明は
  // 想定質問への答えにならない（固有名詞と数字で書く。structuredData.ts 参照）。
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: hostUrl,
    description: SITE_DESCRIPTION,
    siteName: "Girl's Side Analysis",
    images: `${hostUrl}/girls-side-analysis-logo.png`,
  },
  icons: [{
    rel: 'apple-touch-icon',
    url: `${hostUrl}/girls-side-analysis-touch-icon.png`,
    sizes: '180x180',
  }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <SettingsProvider>
        <body className={clsx(
          'min-h-screen',
          'text-black',
          'bg-sky-100',
          'flex flex-col',
          inter.className
        )}>
          <Header />
          <main className={clsx(
            'flex flex-col items-center self-center',
            'p-5', 
            'md:min-w-[40rem] max-w-full lg:max-w-[55rem] flex-1',
            'w-full'
          )}>
            {children}
          </main>
          <Footer />
          {/*
            全ページ共通の実体（WebSite / WebApplication / Person）。
            各ページはこれを @id で参照するだけにする（structuredData.ts の @id 設計）。
          */}
          <JsonLd data={siteGraph()} />
        </body>
      </SettingsProvider>
    </html>
  );
}

