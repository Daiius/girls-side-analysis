import React from 'react';
import clsx from 'clsx';

import { RocketLaunchIcon } from '@heroicons/react/24/solid';

import GSButton from '@/components/GSButton';

const LogoutButton: React.FC<
  React.ComponentProps<typeof GSButton>
> = ({
  ...props
}) => {
  return (
    <GSButton 
      className='group mt-2 p-2 flex flex-row size-16 relative'
      variant='system'
      type='submit'
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

