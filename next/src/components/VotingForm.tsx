import clsx from 'clsx';

import { getSession } from '@/lib/auth-session';
import VotingFormClient from './VotingFormClient';

import {
  getLatestUserState,
  getUserStatesMaster,
} from '@/lib/users';
import { getCharacters } from '@/lib/characters';
import { getLatestVotes } from '@/lib/votes';


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
      {...props}
    />
  );
};

export default VotingForm;
