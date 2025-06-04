import clsx from 'clsx';

import { Session } from 'next-auth';
import { signOut } from '@/auth';

import LogoutButton from './LogoutButton';
import VotingForm from './VotingForm';

/**
 * ログイン後のプロファイル画面です
 */
const AfterLoginProfile: React.FC<
  { session: Session; } 
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

