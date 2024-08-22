'use server'

import { auth } from '@/auth';
import { insertUserStatesIfUpdated } from '@/lib/users';
import { insertVotesIfUpdated } from '@/lib/votes';

import { Vote } from '@/types';

/**
 * ユーザのプレイ状況と推しデータの記録を行います
 */
export const vote = async (
  /**
   * uncontrolledなフォームデータによるユーザのプレイ状況
   */
  formData: FormData,
  /**
   * ユーザが設定した投票状態
   */ 
  userVotes: Vote[],
) => {

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

  await insertVotesIfUpdated({
    twitterID: session.user.id,
    data: userVotes,
  });

};
