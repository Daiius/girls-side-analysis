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
import { normalizeForSearch } from '@/lib/searchNormalization';
import { Character } from '@/types';

/**
 * シリーズタブ + 横断検索のキャラ「ブラウズ面」共通シェル。
 *
 * ダイアログ/シート・検索・GS1〜4タブ・3列グリッドという見せ方だけを持ち、
 * 「セルをタップした時に何をするか」は呼び出し側が renderCell で決める。
 * - 投票: トグル選択（複数選択・閉じない）
 * - 分析: そのキャラページへ遷移（リンク）
 *
 * 配色はサイトのライトテーマに合わせる（body: bg-sky-100 / 既存ダイアログ: sky 系）。
 * タブ・セルのアクセントはシリーズ色のフラットな塗り（characterCellStyle と対応）。
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

  // 表記ゆらぎ（ひらがな/カタカナ・全半角・空白）を吸収した部分一致。
  // 名前に加えて読み仮名（reading）にも当てるので「ひむろ」「カズマ」等で探せる。
  const normalized = normalizeForSearch(query);
  const searchResults = React.useMemo(
    () => normalized
      ? characters.filter(c =>
          normalizeForSearch(c.name).includes(normalized)
          // characters API は1日キャッシュされるため、reading カラム追加直後は
          // 旧データ（reading なし）が流れてくる。その間も名前検索だけで動くように
          // undefined を許容する。
          || normalizeForSearch(c.reading ?? '').includes(normalized)
        )
      : null,
    [characters, normalized],
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
        <DialogBackdrop
          transition
          className={clsx(
            'fixed inset-0 bg-black/30',
            'duration-300 ease-out data-closed:opacity-0',
          )}
        />

        <div className='fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4'>
          <DialogPanel
            transition
            className={clsx(
              'flex flex-col w-full sm:max-w-md',
              'h-[90vh] sm:h-[80vh]',
              'bg-sky-100 text-black shadow-xl',
              'rounded-t-2xl sm:rounded-2xl',
              'overflow-hidden',
              // モバイルは下からスライドイン、sm 以上は既存ダイアログと同じスケールイン
              'duration-300 ease-out',
              'data-closed:opacity-0 data-closed:translate-y-full',
              'sm:data-closed:translate-y-0 sm:data-closed:scale-95',
            )}
          >
            {/* ヘッダ: 既存 DialogButton のパネル色（sky-300）に合わせたタイトルバー */}
            <div className='flex flex-row items-center justify-between py-2 px-3 bg-sky-300'>
              <DialogTitle className='font-bold'>{title}</DialogTitle>
              <Button className='border-none' onClick={close} aria-label='閉じる'>
                <XMarkIcon className='size-5' />
              </Button>
            </div>

            {/* 検索: 既存フォーム（Select 等）と同じ bg-black/5 の入力欄 */}
            <div className='p-3 border-b border-sky-300'>
              <div className='relative'>
                <MagnifyingGlassIcon
                  className='pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 size-4 fill-black/60'
                  aria-hidden
                />
                <input
                  type='search'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder='名前・よみがなで検索（全シリーズ横断）'
                  aria-label='キャラクター名・よみがなで検索'
                  className={clsx(
                    'w-full rounded-lg border-none bg-black/5',
                    'py-2 pl-8 pr-3 text-sm',
                    'placeholder:text-black/50',
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
                    : <p className='p-4 text-center text-sm text-black/60'>
                        「{query.trim()}」に一致するキャラがいません
                      </p>
                )
                : <TabGroup>
                    {/*
                      シリーズタブ。キャラセル（角丸長方形）と見分けやすいよう
                      ピル型 + 常時シリーズ色（未選択は淡く、選択中は濃く）にし、
                      下の border-b をグリッドとのセパレータにする。
                      グラデーションは GSButton（ゲーム画面風ボタン）専用なので使わない。
                    */}
                    <TabList className={clsx(
                      'flex flex-row gap-1.5 p-2 sticky top-0 z-10',
                      'bg-sky-100 border-b border-sky-300',
                    )}>
                      {seriesList.map(series =>
                        <Tab
                          key={series}
                          className={clsx(
                            'flex-1 rounded-full py-1.5 text-sm border',
                            'transition-colors',
                            'data-selected:font-bold data-selected:text-white',
                            seriesTabClass(series),
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
            <div className='flex flex-row items-center justify-between p-3 border-t border-sky-300 bg-sky-200'>
              <span className='text-sm'>{footerLeft}</span>
              <Button className='px-4 py-1.5 bg-white/60 hover:bg-white' onClick={close}>
                閉じる
              </Button>
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

/**
 * シリーズタブの配色。シリーズ色（characterCellStyle と同系統）を常時まとい、
 * 未選択は淡いフラット、選択中は濃いフラットで表現する。
 */
const seriesTabClass = (series: number) => clsx(
  series === 1 && clsx(
    'bg-green-100 text-green-900 border-green-400 hover:bg-green-200',
    'data-selected:bg-green-500 data-selected:border-green-600',
  ),
  series === 2 && clsx(
    'bg-sky-200/60 text-sky-900 border-sky-400 hover:bg-sky-200',
    'data-selected:bg-sky-500 data-selected:border-sky-600',
  ),
  series === 3 && clsx(
    'bg-pink-100 text-pink-900 border-pink-400 hover:bg-pink-200',
    'data-selected:bg-pink-500 data-selected:border-pink-600',
  ),
  series === 4 && clsx(
    'bg-orange-100 text-orange-900 border-orange-400 hover:bg-orange-200',
    'data-selected:bg-orange-500 data-selected:border-orange-600',
  ),
);

export default CharacterPickerDialog;
