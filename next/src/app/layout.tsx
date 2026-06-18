
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import clsx from 'clsx';

import Header from '@/components/Header';
import SettingsProvider from '@/providers/SettingsProvider';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ["latin"] });

const hostUrl = process.env.HOST_URL
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

export const metadata: Metadata = {
  metadataBase: new URL(hostUrl),
  title: "Girl's Side Analysis",
  description: "GSシリーズの情報共有・分析サイト",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: hostUrl,
    description: "GSシリーズの情報共有・分析サイト",
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
        </body>
      </SettingsProvider>
    </html>
  );
}

