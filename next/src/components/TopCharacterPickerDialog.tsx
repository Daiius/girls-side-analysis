'use client'

import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

import CharacterPickerDialog from '@/components/CharacterPickerDialog';
import {
  characterCellBaseClass,
  characterCellIdleClass,
  seriesActiveClass,
  characterNameSizeClass,
} from '@/components/characterCellStyle';
import { Character } from '@/types';

/**
 * 分析ページ（トップ / キャラ別）でキャラを切り替えるためのダイアログ。
 * 共通シェル {@link CharacterPickerDialog} に「遷移リンクセル」を差し込む。
 *
 * セルは本物の <Link>（= <a href>）。中クリック・履歴・アクセシビリティに強い。
 * 現在表示中のキャラはセルをアクセント表示する。
 */
const TopCharacterPickerDialog: React.FC<{
  characters: Character[];
  className?: string;
}> = ({
  characters,
  className,
}) => {

  const pathname = usePathname();
  // "/にゃんこ" → "にゃんこ"。トップ("/")では空文字。
  const currentName = decodeURIComponent(pathname.replace('/', ''));

  return (
    <CharacterPickerDialog
      className={className}
      characters={characters}
      title='表示するキャラを選ぶ'
      trigger={
        <>
          <span>
            {currentName
              ? `「${currentName}」を表示中`
              : '分析するキャラを選ぶ'}
          </span>
          <ChevronDownIcon className='size-4' />
        </>
      }
      footerLeft='タップで分析ページへ移動します'
      renderCell={(c, { close }) => {
        const current = c.name === currentName;
        return (
          <Link
            // canonical / sitemap と同じく生の日本語 URL に揃える
            href={`/${c.name}`}
            onClick={close}
            aria-current={current ? 'page' : undefined}
            className={clsx(
              characterCellBaseClass,
              characterNameSizeClass(c.name),
              current ? seriesActiveClass(c.series) : characterCellIdleClass(c.series),
            )}
          >
            <span>{c.name}</span>
          </Link>
        );
      }}
    />
  );
};

export default TopCharacterPickerDialog;
