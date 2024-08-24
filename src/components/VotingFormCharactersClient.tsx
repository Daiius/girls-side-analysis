'use client'

import React from 'react';
import clsx from 'clsx';

import { 
  Character,
  Vote,
} from '@/types';

import CharacterStrip from './CharacterStrip';

/**
 * 推しキャラ組み合わせの投票用コンポーネント
 *
 * 親のServer Componentからユーザ情報を受け取って表示します
 * 並び替えや項目追加など、インタラクションが多くなるので
 * Client Componentとして作成しています
 */
const VotingFormCharactersClient: React.FC<
  {
    characters: Character[],
    latestVotes: Vote[],
    maxLevel: number;
    charactersInGarden: (Vote & { position: number })[];
    increaseLevel: (charaName: string) => void;
    decreaseLevel: (charaName: string) => void;
  }
  & React.ComponentProps<'div'>
> = ({
  characters,
  latestVotes,
  maxLevel,
  charactersInGarden,
  increaseLevel,
  decreaseLevel,
  className,
  ...props
}) => {

  
  return (
    <div 
      className={clsx(
        'dark:bg-white/10 bg-black/5',
        'border border-1 border-slate-500',
        'rounded-lg',
        className
      )}
      {...props}
    >
        <div className='flex flex-col gap-2'>
          {charactersInGarden.length === 0 &&
            <div>推しを選択、追加しましょう！</div>
          }
          {charactersInGarden.length > 0 &&
            charactersInGarden
              .map(c =>
                <CharacterStrip
                  className={clsx(
                    'w-[13rem] h-[3rem]',
                  )}
                  key={`${c.characterName}`}
                  characterName={c.characterName}
                  increaseLevel={() => increaseLevel(c.characterName)}
                  decreaseLevel={() => decreaseLevel(c.characterName)}
                  isLonlyAtMaxLevel={
                       c.level === maxLevel
                    && charactersInGarden
                         .filter(tmp => tmp.level === maxLevel)
                         .length === 1
                  }
                  isLonlyAtLevel={
                    charactersInGarden
                      .filter(tmp => tmp.level === c.level)
                      .length === 1
                  }
                  level={c.level}
                />
              )
          }
      </div>
    </div>
  );
};

export default VotingFormCharactersClient;

