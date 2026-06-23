'use client'

import React from 'react';
import clsx from 'clsx';

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@headlessui/react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';

import Button from '@/components/Button';
import { Character } from '@/types';

/**
 * 案A: シリーズタブ + 横断検索のキャラ「ブラウズ面」共通シェル。
 *
 * ダイアログ/シート・検索・GS1〜4タブ・3列グリッドという見せ方だけを持ち、
 * 「セルをタップした時に何をするか」は呼び出し側が renderCell で決める。
 * - 投票: トグル選択（複数選択・閉じない）
 * - 分析: そのキャラページへ遷移（リンク）
 *
 * デザイン（ゲームUI 化・立ち絵カード等）は後工程。ここでは操作の骨組みのみ。
 */
const CharacterPickerDialog: React.FC<{
  characters: Character[];
  /** ダイアログのタイトル。 */
  title: string;
  /** トリガーボタンの中身（アイコン・ラベル・カウント等は呼び出し側で構成）。 */
  trigger: React.ReactNode;
  /** 各セルの描画。button か a かは呼び出し側が決める。close でダイアログを閉じられる。 */
  renderCell: (character: Character, ctx: { close: () => void }) => React.ReactNode;
  /** フッタ左側の任意表示（例: 「選択中 N 人」）。 */
  footerLeft?: React.ReactNode;
  className?: string;
}> = ({
  characters,
  title,
  trigger,
  renderCell,
  footerLeft,
  className,
}) => {

  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const close = () => setIsOpen(false);

  // characters は series asc, sort asc 済み（サーバ取得時点でソート）。
  // 出現するシリーズ番号を昇順ユニークで取り出してタブにする。
  const seriesList = React.useMemo(
    () => [...new Set(characters.map(c => c.series))].sort((a, b) => a - b),
    [characters],
  );

  const trimmed = query.trim();
  // 検索中は全シリーズ横断のフラット結果。空ならタブ表示。
  const searchResults = React.useMemo(
    () => trimmed
      ? characters.filter(c => c.name.includes(trimmed))
      : null,
    [characters, trimmed],
  );

  return (
    <div className={clsx(className)}>
      <Button
        className='flex flex-row gap-2 items-center justify-center w-full p-2'
        onClick={() => setIsOpen(true)}
      >
        {trigger}
      </Button>

      <Dialog open={isOpen} onClose={close} className='relative z-50'>
        <DialogBackdrop className='fixed inset-0 bg-black/50' />

        <div className='fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4'>
          <DialogPanel
            className={clsx(
              'flex flex-col w-full sm:max-w-md',
              'h-[90vh] sm:h-[80vh]',
              'bg-slate-900 text-slate-100',
              'rounded-t-2xl sm:rounded-2xl',
              'overflow-hidden',
            )}
          >
            {/* ヘッダ */}
            <div className='flex flex-row items-center justify-between p-3 border-b border-slate-700'>
              <DialogTitle className='font-bold'>{title}</DialogTitle>
              <Button className='border-none' onClick={close}>
                <XMarkIcon className='size-5' />
              </Button>
            </div>

            {/* 検索 */}
            <div className='p-3 border-b border-slate-700'>
              <div className='relative'>
                <MagnifyingGlassIcon
                  className='pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 opacity-60'
                  aria-hidden
                />
                <input
                  type='search'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder='名前で検索（全シリーズ横断）'
                  aria-label='キャラクター名で検索'
                  className={clsx(
                    'w-full rounded-lg bg-black/30 border border-slate-700',
                    'py-2 pl-8 pr-3 text-sm',
                    'focus:outline focus:outline-1 focus:outline-slate-400',
                  )}
                />
              </div>
            </div>

            {/* 本体: 検索中はフラット、未検索はタブ */}
            <div className='flex-1 overflow-auto'>
              {searchResults
                ? (
                  searchResults.length > 0
                    ? <CharacterGrid characters={searchResults} renderCell={renderCell} close={close} />
                    : <p className='p-4 text-center text-sm opacity-60'>
                        「{trimmed}」に一致するキャラがいません
                      </p>
                )
                : <TabGroup>
                    <TabList className='flex flex-row gap-1 p-2 sticky top-0 bg-slate-900 z-10'>
                      {seriesList.map(series =>
                        <Tab
                          key={series}
                          className={clsx(
                            'flex-1 rounded-md py-1.5 text-sm border border-slate-700',
                            'data-selected:font-bold',
                            seriesTabSelectedClass(series),
                          )}
                        >
                          GS{series}
                        </Tab>
                      )}
                    </TabList>
                    <TabPanels>
                      {seriesList.map(series =>
                        <TabPanel key={series}>
                          <CharacterGrid
                            characters={characters.filter(c => c.series === series)}
                            renderCell={renderCell}
                            close={close}
                          />
                        </TabPanel>
                      )}
                    </TabPanels>
                  </TabGroup>
              }
            </div>

            {/* フッタ */}
            <div className='flex flex-row items-center justify-between p-3 border-t border-slate-700'>
              <span className='text-sm'>{footerLeft}</span>
              <Button className='px-4 py-1.5' onClick={close}>閉じる</Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

/** シリーズ別キャラのグリッド。セルの中身は renderCell に委譲。 */
const CharacterGrid: React.FC<{
  characters: Character[];
  renderCell: (character: Character, ctx: { close: () => void }) => React.ReactNode;
  close: () => void;
}> = ({ characters, renderCell, close }) => (
  <ul className='grid grid-cols-3 gap-2 p-2'>
    {characters.map(c =>
      <li key={c.name}>{renderCell(c, { close })}</li>
    )}
  </ul>
);

/** 選択中タブのアクセント色。 */
const seriesTabSelectedClass = (series: number) => clsx(
  series === 1 && 'data-selected:bg-emerald-200 data-selected:text-black',
  series === 2 && 'data-selected:bg-sky-200 data-selected:text-black',
  series === 3 && 'data-selected:bg-pink-200 data-selected:text-black',
  series === 4 && 'data-selected:bg-orange-200 data-selected:text-black',
);

export default CharacterPickerDialog;
