import { auth } from '@/auth';
import VotingFormClient from './VotingFormClient';

import { 
  getLatestUserState,
  getUserStatesMaster,
} from '@/lib/users';


const VotingForm: React.FC = async () => {
  const session = await auth();
  const latestUserState = await getLatestUserState(
    session?.user.id ?? ''
  );
  const userStatesMaster = await getUserStatesMaster();
  return (
    <VotingFormClient
      latestUserState={latestUserState}
      userStatesMaster={userStatesMaster}
    />
  );
};

export default VotingForm;

