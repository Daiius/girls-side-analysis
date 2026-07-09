'use client'

import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// トップ / キャラページ共通の検索ピルは線を太めに見せたいので、stroke-width を効かせられる
// outline 版を使う（solid は塗りなので線幅を調整できない。太さは className の stroke-3 で指定）。
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

import CharacterNameLabel from '@/components/CharacterNameLabel';
import CharacterPickerDialog from '@/components/CharacterPickerDialog';
import { characterCellClass } from '@/components/characterCellStyle';
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
  // 現在表示中のキャラ。トップ("/")や未知のパスでは undefined。
  const current = characters.find(c => c.name === currentName);

  // トップ / キャラページ共通の「検索ピル」トリガー。虫眼鏡 + chevron の full-rounded ピルで、
  // 中央のラベルだけ状態で出し分けてデザインを揃える（トップ=「分析する人を選ぶ」／
  // キャラページ=「表示中 + キャラ名」）。
  // - full-rounded + 少し濃い青の 2px 枠 + 淡い塗りで「探して選ぶ」を示す
  // - 素の Button の border / rounded / hover:bg-white/10 は ! で上書きする
  const pillTriggerClass = clsx(
    'rounded-full! border-2! border-sky-500! text-sky-800 font-bold',
    // 全体背景（sky-100）より少しだけ濃くして「押せる」浮きを出す。
    // sky-150 は無いので sky-200 を半透明で重ね、100↔200 の中間色（≒ sky-150）にする。
    'bg-sky-200/50 hover:bg-sky-200!',
    // 文字・サイズは控えめに（分析結果の文字と同程度）。強調は上下の余白（呼び出し側の my）で。
    'px-5 text-base',
  );

  return (
    <CharacterPickerDialog
      className={className}
      characters={characters}
      title='分析する人を選ぶ'
      trigger={
        <>
          {/* アイコンは固定サイズ（flex の縮小で潰れないよう shrink-0） */}
          <MagnifyingGlassIcon className='size-4 shrink-0 stroke-3' />
          {current
            ? <span className='flex items-center gap-1 min-w-0'>
                <span className='shrink-0 text-xs font-normal text-sky-600'>表示中</span>
                {/* 長い複合名（・入り）は CharacterNameLabel で「・の直後だけ」で折り返す */}
                <span className='min-w-0'>
                  <CharacterNameLabel name={current.name} />
                </span>
              </span>
            : <span>分析する人を選ぶ</span>
          }
          <ChevronDownIcon className='size-4 shrink-0 stroke-3' />
        </>
      }
      triggerClassName={pillTriggerClass}
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
