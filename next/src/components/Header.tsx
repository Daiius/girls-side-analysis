import React from 'react';
import clsx from 'clsx';

import Link from 'next/link';
import { Gamja_Flower } from 'next/font/google';
import { NoticeButton } from '@/components/NoticeButton';

const gamjaFlower = Gamja_Flower({ weight: "400", subsets: ['latin'] });

/**
 * トップページへのリンク、投票ページへのリンク、
 * テーマ切り替えボタンを持ったヘッダです
 */
const Header = () => (
  <div className={clsx(
    'sticky top-0 h-12 w-full bg-sky-500/90',
    'flex flex-row items-center z-10',
    'px-4',
  )}>
    {/* ロゴ */}
    <Link href='/'>
      <div className='sm:flex flex-row items-center'>
        <span className='text-green-400 text-2xl text-shadow-white'>♥</span>
        <span className='text-blue-600 text-2xl'>♥</span>
        <span className={clsx(
          gamjaFlower.className,
          'text-2xl mx-2',
        )}>
          Girl's Side Analysis
        </span>
        <span className='text-pink-400 text-2xl'>♥</span>
        <span className='text-orange-400 text-2xl'>♥</span>
      </div>
    </Link>
    <div className='ml-auto'>
      <NoticeButton />
    </div>
  </div>
);

export default Header;

