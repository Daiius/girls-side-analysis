import clsx from 'clsx';

import { signIn } from '@/auth';
import DataUsageDialog from '@/components/DataUsageDialog';
import Button from '@/components/Button';
import GSButton from '@/components/GSButton';
import XIcon from '@/components/XIcon';

import { ArrowLeftEndOnRectangleIcon } from '@heroicons/react/24/outline';
import GSMessage from './GSMessage';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';

const BeforeLoginProfile: React.FC<
  React.ComponentProps<'div'>
> = ({
  className,
  ...props
}) => (
  <div 
    className={clsx(
      'flex flex-col gap-2',
      className,
    )}
    {...props}
  >
      <div className='text-lg font-bold'>
        Twitterアカウント連携について：
      </div>
      <GSMessage>
        <ul className='list-disc pl-4'>
          <li>投票データは匿名で保存されます</li>
          <li className='before:-ml-2'>「シェア」しなければ投票内容は非公開です</li>
          <li>X(Twitter)閲覧・投稿は自動ではしません</li>
        </ul>
      </GSMessage>
      <div className='self-end flex flex-row items-center gap-2'>
        詳細: <DataUsageDialog/>
      </div>
      <form
        action={async () => {
          'use server'
          await signIn('twitter');
        }}
        className='self-center'
      >
        <GSButton 
          className='size-20 relative group'
          type='submit'
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
      </form>
  </div>
);

export default BeforeLoginProfile;

