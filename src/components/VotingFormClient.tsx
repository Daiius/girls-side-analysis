'use client'

import React from 'react';
import clsx from 'clsx';

import Button from '@/components/Button';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import VotingFormUserStatesClient, {
  gsSeries
} from '@/components/VotingFormUserStatesClient';
import VotingFormCharactersClient from './VotingFormCharactersClient';
import AddCharacterSelect from '@/components/AddCharacterSelect';

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
    addCharacter,
  } = useGarden({ latestVotes });

  const latestUserStateDict = latestUserState
    .map(lus => ({ [lus.series]: lus.state }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});

  const [errorMessage, formAction, isPending] = React.useActionState(
    async (prevState: string|undefined, formData: FormData) => {
      const isSamePlayerStatus = gsSeries.every(gs => 
        formData.get(gs.name) === latestUserStateDict[gs.series]
      );
      const isSameVotes: boolean =
           latestVotes.length === charactersInGarden.length // 長さが異なればそもそも再投票の対象
        && charactersInGarden.every(d =>
            latestVotes.some(lv =>
              Object.keys(lv).every(key => 
                d[key as keyof Vote] === lv[key as keyof Vote]
              )
            )
           );

      if (isSamePlayerStatus && isSameVotes) {
        // 投票処理をスキップする
        return '投票完了！（過去データと同じ）';
      }

      await vote(formData, charactersInGarden);
      router.refresh();
      
      if (!isSamePlayerStatus && isSameVotes) {
        return '投票完了！（プレイ状況のみ更新）';
      }
      if (isSamePlayerStatus && !isSameVotes) {
        return '投票完了！（推しデータのみ更新）';
      }

      return '投票完了！';
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
      <AddCharacterSelect 
        characters={characters}
        selectedCharaNames={
          charactersInGarden.map(c => c.characterName)
        }
        addCharacter={addCharacter}
      />
    </form>
  );
};

export default VotingFormClient;

