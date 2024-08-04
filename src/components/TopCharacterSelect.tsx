'use client'

import React from 'react';
import clsx from 'clsx';
import {
  Field, 
  Label,
  Description,
  Select,
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

import {
  usePathname,
  useRouter
} from 'next/navigation';

const TopCharacterSelect: React.FC<React.ComponentProps<'div'>> = ({
  className,
  ...props
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const defaultCharaName = decodeURIComponent(
    pathname.replace('/', '')
  );

  const handleSelect = (charaName: string) => {
    router.push(`/${charaName}`);
  };

  return (
    <div className={clsx(className)} {...props}>
      <Field>
        <Label>あなたの推しキャラは？</Label>
        <Description className={clsx(
          'text-slate-500 dark:text-slate-300 ml-2'
        )}>
          分析結果を表示します...
        </Description>
        <div className='relative'>
          <Select
            className={clsx(
              'mt-3 block w-full appearance-none rounded-lg border-none',
              'bg-black/5 dark:bg-white/5',
              'py-1.5 px-3 text-sm/6 text-slate-400'
            )}
            onChange={e => handleSelect(e.target.value)}
            defaultValue={defaultCharaName}
          >
            <option value="">選択...</option>
            <option value="氷上格">氷上格</option>
            <option value="柊夜ノ介">柊夜ノ介</option>
          </Select>
          <ChevronDownIcon
            className={clsx(
              'group pointer-events-none absolute top-2.5 right-2.5 size-4',
              'fill-black/60 dark:fill-white/60'
            )}
            aria-hidden
          />
        </div>
      </Field>
    </div>
  );
};

export default TopCharacterSelect;

