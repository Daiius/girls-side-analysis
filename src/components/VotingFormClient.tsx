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

import { vote } from '@/actions/voteActions';
import { useRouter } from 'next/navigation';
import XShareLink from './XShareLink';


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

  const [favorites, setFavorites] = React.useState<string[]>(
    latestVotes
      .toSorted((a, b) => a.level - b.level)
      .map(c => c.characterName)
  );

  const latestUserStateDict = latestUserState
    .map(lus => ({ [lus.series]: lus.state }))
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});

  const [errorMessage, formAction, isPending] = React.useActionState(
    async (prevState: string|undefined, formData: FormData) => {
      const isSamePlayerStatus = gsSeries.every(gs => 
        formData.get(gs.name) === latestUserStateDict[gs.series]
      );
      const isSameVotes: boolean =
           latestVotes.length === favorites.length // 長さが異なればそもそも再投票の対象
        && favorites.every(d =>
            latestVotes.some(lv => lv.characterName === d)
           );

      if (isSamePlayerStatus && isSameVotes) {
        // 投票処理をスキップする
        return '投票完了！（過去データと同じ）';
      }

      await vote(
        formData, 
        favorites.map((characterName, iCharacterName) =>
          ({ characterName, level: iCharacterName })
        )
      );
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
    <>
      <form 
        className={clsx('flex flex-col', className)}
        action={formAction}
        {...props}
      >
        {latestUserState.length > 0 && 
          <div className='font-bold'>あなたの最後の投票内容:</div>
        }
        <VotingFormUserStatesClient
          className='h-auto mb-2'
          latestUserStateDict={latestUserStateDict}
          userStatesMaster={userStatesMaster} 
        />
        <VotingFormCharactersClient
          className='flex-1 overflow-auto p-2 mb-2'
          characters={characters}
          latestVotes={latestVotes}
          favorites={favorites}
          setFavorites={setFavorites}
        />
        <div className='sm:hidden'>推し追加：</div>
        <AddCharacterSelect 
          className='mb-2 h-[3rem]'
          characters={characters}
          selectedCharaNames={favorites}
          addCharacter={(characterName: string) =>
            setFavorites([...favorites, characterName])
          }
        />
        <div className='flex flex-col my-8'>
          <Button 
            type='submit'
            className={clsx(
              'flex flex-row items-center self-center',
              'px-2 text-2xl font-bold border-2'
            )}
            disabled={isPending}
          >
            <span className='mr-2'>投票！</span>
            <PaperAirplaneIcon className='size-6'/>
          </Button>
          {errorMessage &&
            <div className='self-center'>{errorMessage}</div>
          }
        </div>
      </form>
      <XShareLink
        className='absolute bottom-5 right-5'
        text={`私の推しは ${favorites.join('、')} です！`}
        url='https://faveo-systema.net/girls-side-analysis'
      >
        <span className='p-2'>X(Twitter)で共有</span>
      </XShareLink>
    </>
  );
};

export default VotingFormClient;

