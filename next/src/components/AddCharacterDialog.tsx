'use client'

import React from 'react';

import { PlusIcon, CheckIcon } from '@heroicons/react/24/solid';

import CharacterNameLabel from '@/components/CharacterNameLabel';
import CharacterPickerDialog from '@/components/CharacterPickerDialog';
import { characterCellClass } from '@/components/characterCellStyle';
import { Character } from '@/types';

/**
 * 投票フォーム用のキャラ選択ダイアログ。
 * 共通シェル {@link CharacterPickerDialog} に「トグル選択セル」を差し込む。
 * セルのタップで即トグル（追加/解除がその場で favorites に反映される）。
 */
const AddCharacterDialog: React.FC<{
  characters: Character[];
  selectedCharaNames: string[];
  toggleCharacter: (charaName: string) => void;
  className?: string;
}> = ({
  characters,
  selectedCharaNames,
  toggleCharacter,
  className,
}) => (
  <CharacterPickerDialog
    className={className}
    characters={characters}
    title='推しを選ぶ'
    trigger={
      <>
        <PlusIcon className='size-4' />
        <span>推しを選ぶ</span>
        <span className='text-sm opacity-70'>
          （{selectedCharaNames.length}人選択中）
        </span>
      </>
    }
    // 開いた時に選択中の先頭（推し1位）の位置までスクロールする
    scrollTargetName={selectedCharaNames[0]}
    footerLeft={
      <>選択中 <span className='font-bold'>{selectedCharaNames.length}</span> 人</>
    }
    renderCell={c => {
      const selected = selectedCharaNames.includes(c.name);
      return (
        <button
          type='button'
          aria-pressed={selected}
          onClick={() => toggleCharacter(c.name)}
          className={characterCellClass(c, selected)}
        >
          {selected &&
            <CheckIcon className='absolute top-1 right-1 size-3.5' aria-hidden />
          }
          <CharacterNameLabel name={c.name} />
        </button>
      );
    }}
  />
);

export default AddCharacterDialog;
