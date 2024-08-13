'use client'

import React from 'react';
import clsx from 'clsx';

import { 
  Character,
  Vote,
} from '@/types';

import CharacterStrip from './CharacterStrip';
import { useGarden } from '@/hooks/useGarden';

import {
  Transition
} from '@headlessui/react';


/**
 * 推しキャラ組み合わせの投票用コンポーネント
 *
 * 親のServer Componentからユーザ情報を受け取って表示します
 * 並び替えや項目追加など、インタラクションが多くなるので
 * Client Componentとして作成しています
 */
const VotingFormCharactersClient: React.FC<{
  characters: Character[],
  latestVotes: Vote[],
}> = ({
  characters,
  latestVotes,
}) => {

  const {
    charactersInGarden,
    maxLevel,
    increaseLevel,
    decreaseLevel,
  } = useGarden({ latestVotes });
  
  return (
    <div>
      <div>推しを追加:</div>
      {/* レベルごとに左右に分けて表示 */}
      <div className='flex flex-row gap-2'>
        {[...new Array(maxLevel)]
          .map((_, i) => i + 1)
          .map(level => 
            <div key={level}>
              推し順位: {level}
              <div className='flex flex-col'>
                {/* 同じ推し順位のキャラを縦に並べて表示 */}
                {charactersInGarden
                  .filter(c => c.level === level)
                  .map(c =>
                    <Transition
                      as='div'
                      show
                      enter='transition-opacity ease-in-out duration-250'
                      enterFrom='opacity-0'
                      enterTo='opacity-100'
                      leave='transition-opacity ease-in-out duration-250'
                      leaveFrom='opacity-100'
                      leaveTo='opacity-0'
                    >
                      <CharacterStrip
                        key={`${c.characterName}-${c.level}`}
                        characterName={c.characterName}
                        increaseLevel={() => increaseLevel(c.characterName)}
                        decreaseLevel={() => decreaseLevel(c.characterName)}
                      />
                    </Transition>
                  )
                }
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default VotingFormCharactersClient;

