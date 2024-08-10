'use client'

import clsx from 'clsx';

import {
  Field,
  Label,
  Select,
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

import type { 
  getUserStatesMaster, 
  getLatestUserState,
} from '@/lib/users';

type UserStatesMaster = 
  Awaited<ReturnType<typeof getUserStatesMaster>>;
type UserState = 
  Awaited<ReturnType<typeof getLatestUserState>>;

const gsSeries = [
  { name: 'GS1', series: 1 },
  { name: 'GS2', series: 2 },
  { name: 'GS3', series: 3 },
  { name: 'GS4', series: 4 },
];

const VotingFormClient: React.FC<{
  userStatesMaster: UserStatesMaster;
  latestUserState: UserState;
}> = ({
  userStatesMaster,
  latestUserState,
}) => {
  return (
    <div className='flex flex-wrap md:flex-row gap-4'>
      {gsSeries.map(gs =>
        <Field key={gs.series} className='flex flex-row items-center'>
          <Label className='mr-3'>{gs.name}: </Label>
          <div className='relative'>
          <Select 
            className={clsx(
              'block w-full appearance-none rounded-lg border-none',
              'bg-black/5 dark:bg-white/5 w-full',
              'py-1.5 pl-2 pr-3 text-sm/6 text-slate-400'
            )}
            defaultValue={latestUserState.find(s =>
              s.series === gs.series
            )?.state}
          >
            {userStatesMaster.map(s =>
              <option key={s.sort} value={s.state}>
                {s.state}
              </option>
            )}
          </Select>
          <ChevronDownIcon
            className={clsx(
              'group pointer-events-none absolute top-2.5 right-1 size-4',
              'fill-black/60 dark:fill-white/60'
            )}
            aria-hidden
          />
          </div>
        </Field>
      )}
    </div>
  );
};

export default VotingFormClient;

