import clsx from 'clsx';

import { Session } from 'next-auth';
import { signOut } from '@/auth';

import Button from '@/components/Button';
import VotingForm from './VotingForm';

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
        <Button 
          className='mt-2 p-2 flex flex-row'
          type='submit'
        >
          ログアウト
        </Button>
      </form>
    </div>

    <VotingForm className='flex-1' />

  </div>
);

export default AfterLoginProfile;

