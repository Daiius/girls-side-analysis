'use client'

import React from 'react';
import clsx from 'clsx';

import { useTheme } from 'next-themes';
import { Switch } from '@headlessui/react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

import { useSettings } from '@/providers/SettingsProvider';

/**
 * next-themesによるテーマ切り替えスイッチです
 */
const ThemeChanger: React.FC<
  React.ComponentProps<typeof Switch>
> = ({
  className,
  ...props
}) => {
  const { theme, setTheme } = useTheme();
  const { mounted } = useSettings();

  if (!mounted) return null;

  return (
    <Switch
      checked={theme === "dark"}
      onChange={v => v ? setTheme("dark") : setTheme("light")}
      className={clsx(
        'group flex h-7 w-14 cursor-pointer rounded-full',
        'bg-slate-300 dark:bg-slate-400 p-1',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none',
        'dark:data-[focus]:outline-white data-[focus]:outline-slate-500',
        'ms-auto',
        className,
      )}
      {...props}
    >
      <div className={clsx(
           'absolute transition-transform duration-800 text-white',
           'translate-x-7 dark:text-slate-600',
           'dark:translate-x-1'
      )}>
        {theme === 'light' && <SunIcon className='size-5' />}
        {theme === 'dark' && <MoonIcon className='size-5' />}
      </div>
      <span
        aria-hidden={true}
        className={clsx(
          'absolute point-events-none inline-block size-5',
          'translate-x-0 rounded-full dark:bg-slate-600 bg-slate-200 ring-0 shadow-lg',
          'transition duration-200 ease-in-out',
          'group-data-[checked]:translate-x-7',
        )}
      />
    </Switch>
  );
};

export default ThemeChanger;

