import React from 'react';
import clsx from 'clsx';

import Button from '@/components/Button';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const CharacterStrip: React.FC<{
  characterName: string;
  increaseLevel: () => void;
  decreaseLevel: () => void;
}>= ({
  characterName,
  increaseLevel,
  decreaseLevel,
}) => (
  <div 
    className={clsx(
      'outline outline-1 outline-slate-200 rounded-md',
      'p-3 w-fit',
      'flex flex-row  items-center gap-2',
    )}
  >
    <Button onClick={decreaseLevel}>
      <ChevronLeftIcon className='size-6' />
    </Button>
    <div className='flex flex-col'>
      <span>{characterName}</span>
    </div>
    <Button onClick={increaseLevel}>
      <ChevronRightIcon className='size-6' />
    </Button>
  </div>
);

export default CharacterStrip;

