'use server'

import { getSession } from '@/lib/auth-session';
import { insertUserStatesIfUpdated } from '@/lib/users';
import { insertVotesIfUpdated } from '@/lib/votes';

import type { Vote } from '@/types';

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

  const session = await getSession();
  const twitterId = session?.user.twitterId;
  if (twitterId == null) {
    throw new Error('Failed to get twitterId from session.');
  }

  // 推し 0 人は投票として認めない（prd/04-voting.md §4.1）。
  // ⚠️ **UserStates を含む一切の書き込みより前**に弾くこと。
  // 投票は「推しの並び」と「プレイ状態」を同時に送る 1 つの行為なので（§1）、
  // 推しが拒否されるのにプレイ状態だけ更新されるのは仕様違反になる。
  // 下の insertUserStatesIfUpdated は insertVotesIfUpdated より先に走り、
  // server 側の .min(1) で 400 になっても巻き戻らない。
  //
  // ここが公開ミューテーションの唯一の入口（§5）なので、UI の送信ボタン無効化や
  // フォーム内チェックをすり抜けて直接呼ばれた場合もここで止まる。
  if (userVotes.length === 0) {
    throw new Error('推しは 1 人以上必要です');
  }

  const rawVoteData = {
    gs1: formData.get('GS1') as string,
    gs2: formData.get('GS2') as string,
    gs3: formData.get('GS3') as string,
    gs4: formData.get('GS4') as string,
  };

  await insertUserStatesIfUpdated({
    twitterID: twitterId,
    data: [
      { series: 1, state: rawVoteData.gs1 },
      { series: 2, state: rawVoteData.gs2 },
      { series: 3, state: rawVoteData.gs3 },
      { series: 4, state: rawVoteData.gs4 },
    ],
  });

  await insertVotesIfUpdated({
    twitterID: twitterId,
    data: userVotes,
  });
};
