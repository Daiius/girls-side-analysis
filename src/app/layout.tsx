
export const dynamic = 'force-static';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import clsx from 'clsx';
import { ThemeProvider } from 'next-themes';

import Header from '@/components/Header';
import SettingsProvider from '@/providers/SettingsProvider';
import TopCharacterSelect from '@/components/TopCharacterSelect';

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
            <main className={clsx(
              'h-[calc(100vh-3rem)] flex flex-col items-center'
            )}>
              <div className={clsx(
                'flex flex-col items-center',
                'p-6 md:p-24'
              )}>
                <TopCharacterSelect className='my-5'/>
              </div>
              {children}
            </main>
          </body>
        </ThemeProvider>
      </SettingsProvider>
    </html>
  );
}

