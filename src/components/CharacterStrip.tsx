import React from 'react';
import clsx from 'clsx';

import Button from '@/components/Button';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const CharacterStrip: React.FC<
  {
    characterName: string;
    increaseLevel: () => void;
    decreaseLevel: () => void;
  } 
  & React.ComponentProps<'div'>
>= ({
  characterName,
  increaseLevel,
  decreaseLevel,
  className,
  ...props
}) => (
  <div 
    className={clsx(
      'border border-1 border-slate-200 rounded-md',
      'p-3 w-fit',
      'flex flex-row  items-center gap-2',
      className,
    )}
    {...props}
  >
    <Button onClick={decreaseLevel}>
      <ChevronLeftIcon className='size-4' />
    </Button>
    <div className='flex flex-col'>
      <span className='font-bold'>{characterName}</span>
    </div>
    <Button onClick={increaseLevel}>
      <ChevronRightIcon className='size-4' />
    </Button>
  </div>
);

export default CharacterStrip;

