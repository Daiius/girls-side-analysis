import React from 'react';
import clsx from 'clsx';

import Button from '@/components/Button';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const CharacterStrip: React.FC<
  {
    characterName: string;
    increaseLevel: () => void;
    decreaseLevel: () => void;
    isLonlyAtMaxLevel: boolean;
    isLonlyAtLevel: boolean;
  } 
  & React.ComponentProps<'div'>
>= ({
  characterName,
  increaseLevel,
  decreaseLevel,
  isLonlyAtMaxLevel,
  isLonlyAtLevel,
  className,
  ...props
}) => (
  <div 
    className={clsx(
      'border border-1 border-slate-800 dark:border-slate-200 rounded-md',
      'py-3 px-2',
      'flex flex-row  items-center gap-2 justify-between',
      characterName.includes('・') && 'text-xs',
      className,
    )}
    {...props}
  >
    <Button onClick={decreaseLevel}>
      <ChevronLeftIcon className='size-4' />
    </Button>
    <div className='flex flex-col'>
      <span className='font-bold'>
        {/* クリスの名前を収めるための処理 */}
        {characterName.includes('・')
          ? <div className='flex flex-col'>
              <span>
                {characterName.split('・')[0]}
              </span>
              <span>
                ・{characterName.split('・')[1]}
              </span>
            </div>
          : characterName
        }
      </span>
    </div>
    <Button 
      onClick={increaseLevel}
      disabled={!isLonlyAtMaxLevel && isLonlyAtLevel}
    >
      {isLonlyAtMaxLevel
        ? <XCircleIcon className='size-4' /> 
        : <ChevronRightIcon className='size-4' />
      }
    </Button>
  </div>
);

export default CharacterStrip;

