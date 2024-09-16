import React from 'react';
import clsx from 'clsx';

import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

import GSButton from '@/components/GSButton';

const VoteButton: React.FC<
  React.ComponentProps<typeof GSButton>
> = ({
  className,
  ...props
}) => (
  <GSButton 
    className={clsx(
      'relative',
      'text-white h-20 w-20',
      className,
    )}
    {...props}
  >
    <div className={clsx(
      'absolute text-sm top-1 left-1/2 -translate-x-1/2',
      'text-nowrap',
    )}>
      投票！
    </div>
    <PaperAirplaneIcon 
      className={clsx(
        'absolute size-16',
        'top-1/2 left-1/2',
        'animate-vote-icon-rotation [transform-origin:center]',
      )}
    />
  </GSButton>
);

export default VoteButton;

