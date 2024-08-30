'use client'

import React from 'react';
import clsx from 'clsx';

import { Select } from '@headlessui/react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/solid';

import Button from '@/components/Button';

import { Character } from '@/types';

const AddCharacterSelect: React.FC<
  { 
    characters: Character[];
    selectedCharaNames: string[];
    addCharacter: (charaName: string) => void;
  }
  & React.ComponentProps<'div'>
> = ({
  characters,
  selectedCharaNames,
  addCharacter,
  className,
  ...props
}) => {

  const [selectedName, setSelectedName] = React.useState<string>(characters[0].name);

  return (
    <div className={clsx('flex flex-row gap-2', className)}>
      <div 
        className={clsx('relative')}
        {...props}
      >
        <Select
          className={clsx(
            'block w-full appearance-none rounded-lg border-none',
            'bg-black/5 dark:bg-white/5',
            'py-1.5 px-3 text-sm/6'
          )}
          value={selectedName}
          onChange={e => setSelectedName(e.target.value)}
        >
          {characters.map(c =>
            <option 
              key={c.name}
              value={c.name}
              disabled={selectedCharaNames.includes(c.name)}
              className='text-black'
            >
              {c.name}
              {selectedCharaNames.includes(c.name) &&
                <span> (選択済)</span>
              }
            </option>
          )}
        </Select>
        <ChevronDownIcon
          className={clsx(
            'group pointer-events-none absolute top-2.5 right-2.5 size-4',
            'fill-black/60 dark:fill-white/60'
          )}
          aria-hidden
        />
      </div>
      <Button 
        className='flex flex-row gap-2 items-center px-2'
        onClick={() => addCharacter(selectedName)}
        disabled={selectedCharaNames.includes(selectedName)}
      >
        推し追加
        <PlusIcon className='size-4' />
      </Button>
    </div>
  );
};

export default AddCharacterSelect;

