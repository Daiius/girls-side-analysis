'use client'

import React from 'react';
import clsx from 'clsx';

import VotingFormUserStatesClient, {
  gsSeries
} from '@/components/VotingFormUserStatesClient';
import VotingFormCharactersClient from './VotingFormCharactersClient';
import AddCharacterDialog from '@/components/AddCharacterDialog';
import VoteButton from '@/components/VoteButton';

import type {
  UserStatesMaster,
  UserState,
  Character,
  Vote,
} from '@/types';

import { vote } from '@/actions/voteActions';
import { useRouter } from 'next/navigation';
import XShareLink from './XShareLink';
import GSMessage from './GSMessage';


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
    /** シェア文言に使う自身の公開 URL。server component 側で HOST_URL から解決する */
    hostUrl: string;
  }
  & React.ComponentProps<'form'>
> = ({
  userStatesMaster,
  latestUserState,
  characters,
  latestVotes,
  hostUrl,
  className,
  ...props
}) => {

  const router = useRouter();

  const [favorites, setFavorites] = React.useState<string[]>(
    latestVotes
      .toSorted((a, b) => a.level - b.level)
      .map(c => c.characterName)
  );

  const latestUserStateDict = Object.fromEntries(
    latestUserState.map(lus => [lus.series, lus.state]),
  );

  const [errorMessage, formAction, isPending] = React.useActionState(
    async (_prevState: string|undefined, formData: FormData) => {
      // 推し 0 人は投票として認めない（prd/04-voting.md §4.1）。
      // ⚠️ 「前回と同じ」判定より**先**に置くこと。初投票のユーザーは
      // latestVotes が空なので、0 人のまま送ると previousFavorites と
      // favorites が共に空 → isSameVotes === true となり、後ろに置くと
      // 「投票完了！（過去データと同じ）」を返してしまう。
      if (favorites.length === 0) {
        return '推しを 1 人以上選んでから投票してください！';
      }

      const isSamePlayerStatus = gsSeries.every(gs =>
        formData.get(gs.name) === latestUserStateDict[gs.series]
      );
      // level（=並び順）込みで前回投票と比較する。
      // キャラの集合が同じでも順番だけ変えた場合は「変更あり」として扱う。
      const previousFavorites = latestVotes
        .toSorted((a, b) => a.level - b.level)
        .map(lv => lv.characterName);
      const isSameVotes: boolean =
           previousFavorites.length === favorites.length // 長さが異なればそもそも再投票の対象
        && previousFavorites.every((characterName, i) =>
            characterName === favorites[i]
           );

      if (isSamePlayerStatus && isSameVotes) {
        // 投票処理をスキップする
        return '投票完了！（過去データと同じ）';
      }

      // vote() が投げると error boundary まで飛び、フォームの入力状態ごと
      // 画面が差し替わってしまう。ここで捕まえてメッセージとして返し、
      // 選択中の推しを保ったまま再試行できるようにする。
      try {
        await vote(
          formData,
          favorites.map((characterName, iCharacterName) =>
            ({ characterName, level: iCharacterName })
          )
        );
      } catch (e) {
        console.error(e);
        return '投票に失敗しました... 少し待ってからもう一度お試しください';
      }
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
        <AddCharacterDialog
          className='mb-2'
          characters={characters}
          selectedCharaNames={favorites}
          toggleCharacter={(characterName: string) =>
            setFavorites(favorites.includes(characterName)
              ? favorites.filter(name => name !== characterName)
              : [...favorites, characterName])
          }
        />
        <div className='relative w-full h-24'>
          <VoteButton
            className={clsx(
              'absolute left-1/2 -translate-x-1/2',
              'top-1/2 -translate-y-1/2',
            )}
            variant='date'
            type='submit'
            // 推し 0 人は投票として認めない（prd/04-voting.md §4.1）
            disabled={isPending || favorites.length === 0}
          />
          <XShareLink
            className={clsx(
              'absolute right-0',
              'top-1/2 -translate-y-1/2',
            )}
            text={`私の推しは ${favorites.join('、')} です！`}
            url={hostUrl}
          />
        </div>
        {errorMessage &&
          <div className='self-center'>{errorMessage}</div>
        }
        <GSMessage>
          <span>
            何度でも投票できます！
            新しい推しが出来たら、また投票を！
          </span>
          <span>何人でもお気軽に推してください！</span>
        </GSMessage>
      </form>
  );
};

export default VotingFormClient;

