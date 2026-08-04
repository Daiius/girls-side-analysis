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
    {/*
      ログイン後の /profile は投票フォームがページの主題。画面上に見出しに相当する
      文言が無く（「ようこそ」は挨拶であってページの主題ではない）、
      デザインを変えずに文書構造を与えたいので sr-only の h1 を置く。
    */}
    <h1 className='sr-only'>推しの登録</h1>
    <div className='flex flex-row items-center mb-2'>
      <div>ようこそ {session.user.name} さん!</div>
      <LogoutButton className='self-center ms-auto'/>
    </div>

    <VotingForm className='flex-1' />
  </div>
);

export default AfterLoginProfile;
