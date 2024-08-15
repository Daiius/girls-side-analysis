'use client'

import React from 'react';
import clsx from 'clsx';

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

import { useGarden } from '@/hooks/useGarden';

import { vote } from '@/actions/voteActions';
import { useRouter } from 'next/navigation';


/**
 * 投票フォーム用client componentです
 *
 * server actionsを用いて内容をサーバに送信し、その結果を取得します
 * プレイ状況表示用、推し組み合わせ用、submit用の
 * 子コンポーネントを持ちます
 */
const VotingFormClient: React.FC<
  {
    userStatesMaster: UserStatesMaster;
    latestUserState: UserState;
    characters: Character[];
    latestVotes: Vote[];
  }
  & React.ComponentProps<'form'>
> = ({
  userStatesMaster,
  latestUserState,
  characters,
  latestVotes,
  className,
  ...props
}) => {

  const router = useRouter();

  const {
    charactersInGarden,
    maxLevel,
    increaseLevel,
    decreaseLevel,
  } = useGarden({ latestVotes });

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
    <form 
      className={clsx('flex flex-col', className)}
      action={formAction}
      {...props}
    >
      <div className='flex flex-col'>
        <Button 
          type='submit'
          className={clsx(
            'flex flex-row items-center self-center',
            'px-2'
          )}
          disabled={isPending}
        >
          <span className='mr-2'>投票！</span>
          <PaperAirplaneIcon className='size-4'/>
        </Button>
        {errorMessage &&
          <div className='self-center'>{errorMessage}</div>
        }
      </div>
      {latestUserState.length > 0 && 
        <div>最後の投票内容:</div>
      }
      <VotingFormUserStatesClient
        className='h-auto'
        latestUserStateDict={latestUserStateDict}
        userStatesMaster={userStatesMaster} 
      />
      <VotingFormCharactersClient
        className='flex-1 overflow-auto p-2'
        characters={characters}
        latestVotes={latestVotes}
        maxLevel={maxLevel}
        charactersInGarden={charactersInGarden}
        increaseLevel={increaseLevel}
        decreaseLevel={decreaseLevel}
      />
    </form>
  );
};

export default VotingFormClient;

