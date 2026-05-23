import clsx from 'clsx';

import type { SessionResponse } from '@/lib/auth-session';

import LogoutButton from './LogoutButton';
import VotingForm from './VotingForm';

/**
 * ログイン後のプロファイル画面です
 */
const AfterLoginProfile: React.FC<
  { session: SessionResponse; }
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
      <LogoutButton className='self-center ms-auto'/>
    </div>

    <VotingForm className='flex-1' />
  </div>
);

export default AfterLoginProfile;
