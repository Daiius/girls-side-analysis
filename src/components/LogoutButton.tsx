'use client'

import React from 'react';
import clsx from 'clsx';

import { signOut } from '@/actions/authActions';
import { useRouter } from 'next/navigation';


import { RocketLaunchIcon } from '@heroicons/react/24/solid';

import GSButton from '@/components/GSButton';

const LogoutButton: React.FC<
  React.ComponentProps<typeof GSButton>
> = ({
  className,
  ...props
}) => {
  const router = useRouter();
  return (
    <GSButton 
      className={clsx(
        'group mt-2 p-2 flex flex-row size-16 relative',
        className,
      )}
      variant='system'
      onClick={async () => {
        await signOut();
        router.refresh();
      }}
      {...props}
    >
      <div className={clsx(
        'absolute text-xs',
        'top-1 left-1/2 -translate-x-1/2 text-nowrap',
      )}>
        ログアウト
      </div>
      <RocketLaunchIcon className={clsx(
        'absolute size-8 top-4 right-2 group-hover:animate-logout-icon-scale',
      )} />
      <div className={clsx(
        'h-[1px] w-[80%] bg-white absolute bottom-2',
        'left-1/2 -translate-x-1/2',
      )}/>
    </GSButton>
  );
};

export default LogoutButton;

