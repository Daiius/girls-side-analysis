import React from 'react';
import clsx from 'clsx';

import Link from 'next/link';

import HeaderProfileLink from './HeaderProfileLink';
import ThemeChanger from './ThemeChanger';

/**
 * トップページへのリンク、投票ページへのリンク、
 * テーマ切り替えボタンを持ったヘッダです
 */
const Header: React.FC = () => (
  <div className={clsx(
    'sticky top-0 h-[3rem] w-full bg-sky-500/90 dark:bg-sky-900/90',
    'flex flex-row items-center z-10',
    'px-4',
  )}>
    {/* ロゴ */}
    <Link href='/'>
      <div className='hidden sm:flex flex-row items-center'>
        <span className='text-green-400 text-2xl text-shadow-white'>♥</span>
        <span className='text-blue-600 text-2xl'>♥</span>
        <span>Girl's Side Analysis</span>
        <span className='text-pink-400 text-2xl'>♥</span>
        <span className='text-orange-400 text-2xl'>♥</span>
      </div>
      <span className='sm:hidden flex flex-row items-center'>
        <span className='text-green-400 text-2xl'>♥</span>
        <span className='text-blue-600 text-2xl'>♥</span>
        <span>GS Analysis</span>
        <span className='text-pink-400 text-2xl'>♥</span>
        <span className='text-orange-400 text-2xl'>♥</span>
      </span>
    </Link>
    <HeaderProfileLink />
    <ThemeChanger />
  </div>
);

export default Header;

