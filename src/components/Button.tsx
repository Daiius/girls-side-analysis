'use client'

import React from 'react';
import clsx from 'clsx';

import { Button as HeadlessButton } from '@headlessui/react';

const Button: React.FC<React.ComponentProps<typeof HeadlessButton>> = ({
  className,
  children,
  ...props
}) => (
  <HeadlessButton
    {...props}
    className={clsx(
      'border border-1 border-slate-500 rounded-md',
      'dark:border-slate-300',
      'text-slate-500 dark:text-slate-100 p-1',
      'hover:bg-slate-200 dark:hover:bg-slate-100/10',
      'active:outline active:outline-1 active:outline-slate-400 dark:active:outline-slate-200',
      'focus:outline focus:outline-1 focus:outline-slate-400 dark:focus:outline-slate-200',
      'disabled:hover:bg-transparent disabled:dark:bg-transparent disabled:active:outline-none',
      'disabled:active:outline-none disabled:dark:active:outline-none',
      'disabled:text-slate-500/30 disabled:dark:text-slate-100/30',
      className,
    )}
  >
    {children}
  </HeadlessButton>
);

export default Button;

