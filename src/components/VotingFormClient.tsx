'use client'

import React from 'react';

import Button from '@/components/Button';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import VotingFormUserStatesClient, {
  gsSeries
} from '@/components/VotingFormUserStatesClient';
import VotingFormCharactersClient from './VotingFormCharactersClient';

import {
  UserStatesMaster,
  UserState,
  Character,
  Vote,
} from '@/types';

import { vote } from '@/actions/voteActions';
import { useRouter } from 'next/navigation';


/**
 * 投票フォーム用client componentです
 *
 * server actionsを用いて内容をサーバに送信し、その結果を取得します
 * プレイ状況表示用、推し組み合わせ用、submit用の
 * 子コンポーネントを持ちます
 */
const VotingFormClient: React.FC<{
  userStatesMaster: UserStatesMaster;
  latestUserState: UserState;
  characters: Character[];
  latestVotes: Vote[];
}> = ({
  userStatesMaster,
  latestUserState,
  characters,
  latestVotes,
}) => {

  const router = useRouter();

  const latestUserStateDict = latestUserState
    .map(lus => ({ [lus.series]: lus.state }))
    .reduce((acc, curr) => ({ ...acc, ...curr }));

  const [errorMessage, formAction, isPending] = React.useActionState(
    async (prevState: string|undefined, formData: FormData) => {
      const isSameAsLastState = gsSeries.every(gs => 
        formData.get(gs.name) === latestUserStateDict[gs.series]
      );
      if (isSameAsLastState) {
        return '投票完了！（過去データと同じ）';
      }
      await vote(formData);
      router.refresh();
      return '投票完了!';
    },
    undefined
  );

  return (
    <form action={formAction}>
      {latestUserState.length > 0 && 
        <div>最後の投票内容:</div>
      }
      <VotingFormUserStatesClient
        latestUserStateDict={latestUserStateDict}
        userStatesMaster={userStatesMaster} 
      />
      <VotingFormCharactersClient
        characters={characters}
        latestVotes={latestVotes}
      />
      <div className='mt-5 flex flex-col'>
        <Button 
          type='submit'
          className='flex flex-row items-center ms-auto'
          disabled={isPending}
        >
          <span className='mr-2'>投票！</span>
          <PaperAirplaneIcon className='size-4'/>
        </Button>
        {errorMessage &&
          <div className='self-center'>{errorMessage}</div>
        }
      </div>
    </form>
  );
};

export default VotingFormClient;

