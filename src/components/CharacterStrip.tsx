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
      'py-3 px-2',
      'flex flex-row  items-center gap-2 justify-between',
       characterName === 'クリストファー・ウェザーフィールド' 
         && 'text-xs',
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
    <Button onClick={increaseLevel}>
      <ChevronRightIcon className='size-4' />
    </Button>
  </div>
);

export default CharacterStrip;

