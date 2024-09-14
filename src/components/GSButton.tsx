import React from 'react';
import clsx from 'clsx';

import Button from '@/components/Button';

const GSButton: React.FC<
  {
    variant?: 'command' | 'friend' | 'system' | 'date';
  } & React.ComponentProps<typeof Button>
> = ({
  variant = 'command',
  className,
  children,
  ...props
}) => (
  <Button
    className={clsx(
      'shadow-lg border-none text-white',
      variant === 'command' 
        && 'bg-gradient-to-b from-sky-400 to-sky-600',
      variant === 'friend'
        && 'bg-gradient-to-b from-green-400 to-green-600',
      variant === 'system'
        && 'bg-gradient-to-b from-amber-400 to-amber-600',
      variant === 'date'
        && 'bg-gradient-to-b from-ping-400 to-ping-600',
      'transition ease-in-out delay-150',
      'hover:scale-110',
      className,
    )}
    {...props}
  >
    {children}
  </Button>
);

export default GSButton;

