'use client'

import clsx from 'clsx';

import { authClient } from '@/lib/auth-client';
import { DataUsageDialog } from '@/components/DataUsageDialog';
import GSButton from '@/components/GSButton';
import XIcon from '@/components/XIcon';

import GSMessage from './GSMessage';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';

const BeforeLoginProfile = ({
  errorMessage,
  className,
}: {
  errorMessage?: string;
  className?: string;
}) => (
  <div
    className={clsx(
      'flex flex-col gap-2',
      className,
    )}
  >
      <div className='text-lg font-bold'>
        Twitterアカウント連携について：
      </div>
      <GSMessage heightFixed={false}>
        <ul className='list-disc pl-4 text-sm sm:text-base'>
          <li>投票データは匿名で保存されます</li>
          <li className='before:-ml-2'>「シェア」しなければ投票内容は非公開です</li>
          <li>X(Twitter)閲覧・投稿は自動ではしません</li>
        </ul>
      </GSMessage>
      <div className='self-end flex flex-row items-center gap-2'>
        詳細: <DataUsageDialog/>
      </div>
      <div className='self-center'>
        <GSButton
          className='size-20 relative group'
          type='button'
          onClick={async () => {
            await authClient.signIn.social({
              provider: 'twitter',
              callbackURL: '/profile',
            });
          }}
        >
          <div className={clsx(
            'absolute top-1 left-1/2 -translate-x-1/2 text-nowrap',
            'text-sm',
          )}>
            ログイン
          </div>
          <XIcon
            className='absolute top-6 right-1'
            width={28}
            height={29}
          />
          <RocketLaunchIcon className={clsx(
            'absolute size-9 bottom-1 left-3 group-hover:animate-logout-icon-scale'
          )}/>
        </GSButton>
      </div>
    {errorMessage != null &&
      <div>
        <div>
          直前のX(Twitter)認証が上手くいかなかった様です...
        </div>
        <div className='text-slate-500'>
          エラー情報: {errorMessage}
        </div>
      </div>
    }
  </div>
);

export default BeforeLoginProfile;
