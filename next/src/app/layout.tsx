
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import clsx from 'clsx';

import Header from '@/components/Header';
import SettingsProvider from '@/providers/SettingsProvider';
import Footer from '@/components/Footer';

import GSMessage from '@/components/GSMessage';

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
            <GSMessage title='お知らせ' className='mb-3'>
              <div className={clsx(
                'text-slate-700 overflow-y-auto',
                'md:text-base text-sm',
                'flex flex-col',
              )}>
                <div>
                  当サイト作成のためのレンタルサーバのプラン変更における設定ミスが原因で、
                </div>
                <div >
                  2024年9月19~11月2日の投票データが削除されてしまいました。申し訳ございません。
                </div>
                <div>
                  今回のデータ消失につきまして、皆様の個人情報の流出はございません。
                </div>
                <div >
                  現在はバックアップ体制を強化し、サーバ全体のデータを毎日保存しております。
                </div>
                <div>
                  新作が出るまで、そしてその先も皆様が楽しめますよう努めて参ります。
                </div>
                <div>
                  お時間ございましたら、投票ボタンから皆様のデータをご確認頂ければと存じます。
                </div>
                <div className='ms-auto'>
                  2024年11月3日 サイト作成者より
                </div>
              </div>
            </GSMessage>
            {children}
          </main>
          <Footer />
        </body>
      </SettingsProvider>
    </html>
  );
}

