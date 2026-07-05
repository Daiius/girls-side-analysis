'use client'

import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

import CharacterNameLabel from '@/components/CharacterNameLabel';
import CharacterPickerDialog from '@/components/CharacterPickerDialog';
import {
  characterCellClass,
  seriesLeftAccentClass,
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
  // シリーズ色の装飾に使う。トップ("/")や未知のパスでは undefined。
  const current = characters.find(c => c.name === currentName);

  return (
    <CharacterPickerDialog
      className={className}
      characters={characters}
      title='表示するキャラを選ぶ'
      trigger={
        current
          ? <>
              <span className='text-xs text-black/50'>表示中</span>
              <span className='font-bold'>{current.name}</span>
              <ChevronDownIcon className='size-4' />
            </>
          : <>
              <span>分析するキャラを選ぶ</span>
              <ChevronDownIcon className='size-4' />
            </>
      }
      triggerClassName={current
        ? clsx(
            // ダイアログ内のキャラセルと同じ「白ベース + シリーズ色の左バー」。
            // 「現在のキャラのセルがここにあり、タップで一覧が開く」つながりを見せる。
            // hover は共通 Button の hover:bg-white/10 と競合するため ! で上書きする。
            'bg-white/60 hover:bg-white!',
            seriesLeftAccentClass(current.series),
          )
        : undefined
      }
      // 開いた時に現在表示中のキャラの位置までスクロールする
      scrollTargetName={current?.name}
      footerLeft='タップで分析ページへ移動します'
      renderCell={(c, { close }) => {
        const isCurrent = c.name === currentName;
        return (
          <Link
            // canonical / sitemap と同じく生の日本語 URL に揃える
            href={`/${c.name}`}
            onClick={close}
            aria-current={isCurrent ? 'page' : undefined}
            className={characterCellClass(c, isCurrent)}
          >
            <CharacterNameLabel name={c.name} />
          </Link>
        );
      }}
    />
  );
};

export default TopCharacterPickerDialog;
