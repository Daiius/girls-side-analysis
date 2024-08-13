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
        <div className='relative'>
          {/* 上部に順位表示 */}
          {[...new Array(maxLevel)].map((_, ilevel) =>
            <div 
              key={ilevel+1}
              className='absolute'
              style={{top: '0rem', left: `${(ilevel)*10}rem`}}
            >
              推し順位: {ilevel + 1}
            </div>
          )}
          {charactersInGarden
            .map(c =>
              <CharacterStrip
                className={clsx(
                  'absolute', 
                  'transition-transform duration-100 ease-in-out'
                )}
                style={{ transform: `translate(${(c.level-1)*10}rem,${(c.position+1)*4}rem)` }}
                key={`${c.characterName}`}
                characterName={c.characterName}
                increaseLevel={() => increaseLevel(c.characterName)}
                decreaseLevel={() => decreaseLevel(c.characterName)}
              />
            )
          }
      </div>
    </div>
  );
};

export default VotingFormCharactersClient;

