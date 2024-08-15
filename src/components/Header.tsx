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
    'h-[3rem] w-full bg-sky-500 dark:bg-sky-900',
    'flex flex-row items-center',
    'px-4',
  )}>
    {/* ロゴ */}
    <Link href='/'>
      💚💙Girl's Side Analysis💗🧡
    </Link>
    <HeaderProfileLink />
    <ThemeChanger />
  </div>
);

export default Header;

