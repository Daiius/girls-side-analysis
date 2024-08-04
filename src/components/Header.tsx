import React from 'react';
import clsx from 'clsx';

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
    <ThemeChanger className='ms-auto'/>
  </div>
);

export default Header;

