import clsx from 'clsx';

import { Session } from 'next-auth';
import { signOut } from '@/auth';

import GSButton from '@/components/GSButton';
import VotingForm from './VotingForm';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';

/**
 * ログイン後のプロファイル画面です
 */
const AfterLoginProfile: React.FC<
  { session: Session }
  & React.ComponentProps<'div'>
> = async ({
   session,
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
    <div className='flex flex-row items-center mb-2'>
      <div>ようこそ {session.user.name} さん!</div>
      <form
        action={async () => {
          'use server'
          await signOut();
        }}
        className='self-center ms-auto'
      >
        <GSButton 
          className='group mt-2 p-2 flex flex-row size-16 relative'
          variant='system'
          type='submit'
        >
          <div className={clsx(
            'absolute text-xs',
            'top-1 left-1/2 -translate-x-1/2 text-nowrap',
          )}>
            ログアウト
          </div>
          <RocketLaunchIcon className={clsx(
            'absolute size-8 top-4 right-2 group-hover:animate-logout-icon-scale',
          )} />
          <div className={clsx(
            'h-[1px] w-[80%] bg-white absolute bottom-2',
            'left-1/2 -translate-x-1/2',
          )}/>
        </GSButton>
      </form>
    </div>

    <VotingForm className='flex-1' />

  </div>
);

export default AfterLoginProfile;

