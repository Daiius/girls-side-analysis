'use server'

import { auth } from '@/auth';
import { insertUserStatesIfUpdated } from '@/lib/users';

export const vote = async (formData: FormData) => {

  const session = await auth();
  if (session?.user.id == null) {
    throw new Error('Failed to get user information.');
  }

  const rawVoteData = {
    gs1: formData.get('GS1') as string,
    gs2: formData.get('GS2') as string,
    gs3: formData.get('GS3') as string,
    gs4: formData.get('GS4') as string,
  };

  await insertUserStatesIfUpdated({
    twitterID: session.user.id, 
    data: [
      { series: 1, state: rawVoteData.gs1 },
      { series: 2, state: rawVoteData.gs2 },
      { series: 3, state: rawVoteData.gs3 },
      { series: 4, state: rawVoteData.gs4 },
    ],
  });



};

