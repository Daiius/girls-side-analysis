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
import { Character } from '@/types';

/**
 * キャラ毎の分析ページに移動するためのSelectコンポーネントです
 * インタラクション担当の子コンポーネントです
 *
 * キャラ名が選択されると、対応する分析ページに移動します
 * デフォルト選択肢を選ぶとトップページに移動します
 */
const TopCharacterSelectClient: React.FC<
  React.ComponentProps<'div'>
  & { characters: Character[] }
> = ({
  characters,
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
        <Label className='text-lg font-bold'>表示データの選択：</Label>
        <Description className={clsx(
          'text-slate-700 ml-2'
        )}>
          分析結果を表示します...
        </Description>
        <div className='relative'>
          <Select
            className={clsx(
              'block w-full appearance-none rounded-lg border-none',
              'bg-black/5 ',
              'py-1.5 pl-3 pr-8 text-sm/6',
            )}
            onChange={e => handleSelect(e.target.value)}
            defaultValue={defaultCharaName}
          >
            <option className='text-black' value="">選択...</option>
            {characters.map(chara => 
              <option
                key={chara.name}
                value={chara.name}
                className={clsx(
                  'text-black',
                  chara.series === 1 && 'bg-emerald-200',
                  chara.series === 2 && 'bg-sky-200',
                  chara.series === 3 && 'bg-pink-200',
                  chara.series === 4 && 'bg-orange-200',
                )}
              >
                {chara.name}
              </option>
            )}
          </Select>
          <ChevronDownIcon
            className={clsx(
              'group pointer-events-none absolute top-2.5 right-2.5 size-4',
              'fill-black/60'
            )}
            aria-hidden
          />
        </div>
      </Field>
    </div>
  );
};

export default TopCharacterSelectClient;

