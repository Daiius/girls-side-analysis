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
    type='button'
    {...props}
    className={clsx(
      'border border-1 border-slate-800',
      'rounded-md',
      'p-1',
      'hover:bg-white/10',
      'active:outline active:outline-1 active:outline-slate-400',
      'focus:outline focus:outline-1 focus:outline-slate-400',
      'disabled:hover:bg-transparent disabled:active:outline-none',
      'disabled:active:outline-none',
      'disabled:text-slate-500/30',
      className,
    )}
  >
    {children}
  </HeadlessButton>
);

export default Button;

