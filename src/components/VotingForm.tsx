import { auth } from '@/auth';
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
const VotingForm: React.FC = async () => {
  const session = await auth();
  if (session?.user.id == null) {
    throw new Error('Failed to get user information.');
  }

  const latestUserState = await getLatestUserState(session.user.id);
  const userStatesMaster = await getUserStatesMaster();
  const characters = await getCharacters();
  const latestVotes = await getLatestVotes(session.user.id);

  return (
    <VotingFormClient
      latestUserState={latestUserState}
      userStatesMaster={userStatesMaster}
      characters={characters}
      latestVotes={latestVotes}
    />
  );
};

export default VotingForm;

