import clsx from 'clsx';

import { getSession } from '@/lib/auth-session';
import VotingFormClient from './VotingFormClient';

import {
  getLatestUserState,
  getUserStatesMaster,
} from '@/lib/users';
import { getCharacters } from '@/lib/characters';
import { getLatestVotes } from '@/lib/votes';

// シェア文言の URL は他ページ（/ と /[charaName]）と同じく HOST_URL から組み立てる。
// client component は process.env を読めないので、ここで解決して prop で渡す。
const hostUrl = process.env.HOST_URL
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

/**
 * 投票フォーム用server compoenent
 *
 * 子のclient components向けにDBからのデータ取得を行います
 */
const VotingForm: React.FC<
  React.ComponentProps<'form'>
> = async ({
  className,
  ...props
}) => {
  const session = await getSession();
  const twitterId = session?.user.twitterId;
  if (twitterId == null) {
    throw new Error('Failed to get twitterId from session.');
  }

  const latestUserState = await getLatestUserState(twitterId);
  const userStatesMaster = await getUserStatesMaster();
  const characters = await getCharacters();
  const latestVotes = await getLatestVotes(twitterId);

  return (
    <VotingFormClient
      className={clsx(className)}
      latestUserState={latestUserState}
      userStatesMaster={userStatesMaster}
      characters={characters}
      latestVotes={latestVotes}
      hostUrl={hostUrl}
      {...props}
    />
  );
};

export default VotingForm;
