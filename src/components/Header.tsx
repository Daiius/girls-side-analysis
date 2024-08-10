import React from 'react';
import clsx from 'clsx';

import HeaderProfileLink from './HeaderProfileLink';
import ThemeChanger from './ThemeChanger';

const Header: React.FC = () => (
  <div className={clsx(
    'h-[3rem] w-full bg-sky-500 dark:bg-sky-900',
    'flex flex-row items-center',
    'px-4',
  )}>
    {/* ロゴ */}
    <div>
      💚💙Girl's Side Analysis💗🧡
    </div>
    <HeaderProfileLink />
    <ThemeChanger />
  </div>
);

export default Header;

