'use client'

import React from 'react';
import clsx from 'clsx';

import {
  Field,
  Label,
  Select,
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

import { 
  UserStatesMaster, 
} from '@/types';

export const gsSeries = [
  { name: 'GS1', series: 1 },
  { name: 'GS2', series: 2 },
  { name: 'GS3', series: 3 },
  { name: 'GS4', series: 4 },
];

/**
 * ユーザのプレイ状況入力フォームです
 *
 * データベース中の選択肢から選んで、シリーズごとに記録します
 */
const VotingFormUserStatesClient: React.FC<
  {
    latestUserStateDict: { [key: number]: string },
    userStatesMaster: UserStatesMaster,
  }
  & React.ComponentProps<'div'>
> = ({
  latestUserStateDict,
  userStatesMaster,
  className,
  ...props
}) => {
  return (
    <div 
      className={clsx(
        'flex flex-wrap sm:flex-row gap-4',
        className,
      )}
      {...props}
    >
      {gsSeries.map(gs =>
        <Field key={gs.series} className='flex flex-row items-center'>
          <Label className='mr-3'>{gs.name}: </Label>
          <div className='relative'>
          <Select
            // defaultValueはrouter.refresh()の度に
            // 確実に変更されてほしいので、
            // keyを変更して確実に再描画する
            key={`${gs.series}-${latestUserStateDict[gs.series]}`}
            name={gs.name} 
            className={clsx(
              'block w-full appearance-none rounded-lg border-none',
              'bg-black/5 w-full',
              'py-1.5 pl-2 pr-6 text-sm/6'
            )}
            defaultValue={latestUserStateDict[gs.series]}
          >
            {userStatesMaster.map(s =>
              <option className='text-black' key={s.sort} value={s.state}>
                {s.state}
              </option>
            )}
          </Select>
          <ChevronDownIcon
            className={clsx(
              'group pointer-events-none absolute top-2.5 right-1 size-4',
              'fill-black/60',
            )}
            aria-hidden
          />
          </div>
        </Field>
      )}
    </div>
  );
};

export default VotingFormUserStatesClient;

