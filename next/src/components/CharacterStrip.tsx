import React from 'react';
import clsx from 'clsx';

import { 
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import Button from './Button';

const CharacterStrip: React.FC<
  {
    characterName: string;
    level: number;
    onDelete: () => void;
  } 
  & React.ComponentProps<'div'>
>= ({
  characterName,
  level,
  onDelete,
  className,
  ...props
}) => (
  <div 
    className={clsx(
      'border border-1 border-slate-800 rounded-md',
      'py-3 px-2',
      'flex flex-row  items-center gap-2',
      characterName.includes('・') && 'text-xs',
      className,
    )}
    {...props}
  >
    <Bars3Icon className='size-5' />
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
    <Button className='ms-auto border-none' onClick={onDelete}>
      <XMarkIcon className='size-4' />
    </Button>
  </div>
);

export default CharacterStrip;

