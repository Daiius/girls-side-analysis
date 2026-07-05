'use client'

import React from 'react';
import clsx from 'clsx';

import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogBackdrop,
} from '@headlessui/react';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';

import Button from '@/components/Button';
import { normalizeForSearch } from '@/lib/searchNormalization';
import { Character } from '@/types';

/**
 * シリーズ絞り込み + 横断検索のキャラ「ブラウズ面」共通シェル。
 *
 * ダイアログ/シート・検索・シリーズ絞り込みチップ・シリーズ見出し付きグリッド
 * という見せ方だけを持ち、「セルをタップした時に何をするか」は呼び出し側が
 * renderCell で決める。
 * - 投票: トグル選択（複数選択・閉じない）
 * - 分析: そのキャラページへ遷移（リンク）
 *
 * シリーズ絞り込みはチェックボックス的な複数選択トグルで、未選択なら全シリーズを
 * 表示する。一覧は常にシリーズ毎の見出し（チップと同じ淡色バッジ）で区切る。
 *
 * 配色はサイトのライトテーマに合わせる（body: bg-sky-100 / 既存ダイアログ: sky 系）。
 * チップ・セルのアクセントはシリーズ色のフラットな塗り（characterCellStyle と対応）。
 */
const CharacterPickerDialog: React.FC<{
  characters: Character[];
  /** ダイアログのタイトル。 */
  title: string;
  /** トリガーボタンの中身（アイコン・ラベル・カウント等は呼び出し側で構成）。 */
  trigger: React.ReactNode;
  /** トリガーボタンへの追加クラス（例: 現在キャラをセル風に装飾する）。 */
  triggerClassName?: string;
  /** 各セルの描画。button か a かは呼び出し側が決める。close でダイアログを閉じられる。 */
  renderCell: (character: Character, ctx: { close: () => void }) => React.ReactNode;
  /** フッタ左側の任意表示（例: 「選択中 N 人」）。 */
  footerLeft?: React.ReactNode;
  className?: string;
}> = ({
  characters,
  title,
  trigger,
  triggerClassName,
  renderCell,
  footerLeft,
  className,
}) => {

  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  // 絞り込み表示するシリーズ番号。空 = 絞り込みなし（全シリーズ表示）。
  const [selectedSeries, setSelectedSeries] = React.useState<number[]>([]);
  const close = () => setIsOpen(false);

  // characters は series asc, sort asc 済み（サーバ取得時点でソート）。
  // 出現するシリーズ番号を昇順ユニークで取り出してチップにする。
  const seriesList = React.useMemo(
    () => [...new Set(characters.map(c => c.series))].sort((a, b) => a - b),
    [characters],
  );

  const toggleSeries = (series: number) =>
    setSelectedSeries(prev =>
      prev.includes(series)
        ? prev.filter(s => s !== series)
        : [...prev, series]
    );

  // 表記ゆらぎ（ひらがな/カタカナ・全半角・空白）を吸収した部分一致。
  // 名前に加えて読み仮名（reading）にも当てるので「ひむろ」「カズマ」等で探せる。
  const normalized = normalizeForSearch(query);
  const searching = normalized.length > 0;

  // 一覧に並べるキャラ。
  // - 検索中: シリーズ絞り込みを無視して全シリーズ横断で当てる
  // - 未検索: 選択中シリーズのみ（未選択なら全シリーズ）
  const visibleCharacters = React.useMemo(
    () => {
      if (searching) {
        return characters.filter(c =>
          normalizeForSearch(c.name).includes(normalized)
          // characters API は1日キャッシュされるため、reading カラム追加直後は
          // 旧データ（reading なし）が流れてくる。その間も名前検索だけで動くように
          // undefined を許容する。
          || normalizeForSearch(c.reading ?? '').includes(normalized)
        );
      }
      return selectedSeries.length > 0
        ? characters.filter(c => selectedSeries.includes(c.series))
        : characters;
    },
    [characters, searching, normalized, selectedSeries],
  );

  // シリーズ見出し付きのグループ（空のシリーズは出さない）
  const groups = seriesList
    .map(series => ({
      series,
      members: visibleCharacters.filter(c => c.series === series),
    }))
    .filter(g => g.members.length > 0);

  return (
    <div className={clsx(className)}>
      <Button
        className={clsx(
          'flex flex-row gap-2 items-center justify-center w-full p-2',
          triggerClassName,
        )}
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

            {/*
              シリーズ絞り込みチップ。チェックボックス的な複数選択トグルで、
              キャラセル（角丸長方形）と見分けやすいようピル型 + 常時シリーズ色
              （未選択は淡く、選択中は濃く + チェックマーク）。
              検索中は全シリーズ横断で当てるため無効化して見せる。
            */}
            <div
              role='group'
              aria-label='シリーズで絞り込み'
              className={clsx(
                'flex flex-row gap-1.5 p-2 border-b border-sky-300',
                searching && 'opacity-40',
              )}
            >
              {seriesList.map(series => {
                const selected = selectedSeries.includes(series);
                return (
                  <button
                    key={series}
                    type='button'
                    aria-pressed={selected}
                    disabled={searching}
                    onClick={() => toggleSeries(series)}
                    className={clsx(
                      'flex-1 rounded-full py-1.5 text-sm border',
                      'flex flex-row items-center justify-center gap-1.5',
                      'transition-colors',
                      selected && 'font-bold text-white',
                      seriesChipClass(series, selected),
                    )}
                  >
                    {/*
                      チェックボックス。未選択でも空の枠を常に出して
                      「チェックできるもの」だと分かるようにする（レイアウトずれ防止も兼ねる）。
                      選択時は白地の箱にシリーズ色のチェックで視認性を上げる。
                    */}
                    <span
                      aria-hidden
                      className={clsx(
                        'flex items-center justify-center size-4 rounded-sm border',
                        selected
                          ? 'bg-white border-white'
                          : clsx('bg-white/60', seriesCheckboxBorderClass(series)),
                      )}
                    >
                      {selected &&
                        <CheckIcon className={clsx('size-3.5', seriesCheckColorClass(series))} />
                      }
                    </span>
                    GS{series}
                  </button>
                );
              })}
            </div>

            {/* 本体: シリーズ毎に見出し（チップと同じ淡色バッジ）で区切ったグリッド */}
            <div className='flex-1 overflow-auto'>
              {groups.length > 0
                ? groups.map(g =>
                    <section key={g.series}>
                      <h3 className='sticky top-0 z-10 bg-sky-100 px-2 pt-2 pb-1'>
                        <span className={clsx(
                          'inline-block rounded-full border px-2.5 py-0.5',
                          'text-xs font-bold',
                          seriesPaleClass(g.series),
                        )}>
                          GS{g.series}
                        </span>
                      </h3>
                      <CharacterGrid
                        characters={g.members}
                        renderCell={renderCell}
                        close={close}
                      />
                    </section>
                  )
                : <p className='p-4 text-center text-sm text-black/60'>
                    「{query.trim()}」に一致するキャラがいません
                  </p>
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
 * シリーズの淡色（未選択チップ・シリーズ見出しバッジ共通）。
 * シリーズ色は characterCellStyle と同系統。
 * GS2 の淡色はパネル背景（bg-sky-100）に溶けないよう sky-200/60 にしている。
 */
const seriesPaleClass = (series: number) => clsx(
  series === 1 && 'bg-green-100 text-green-900 border-green-400',
  series === 2 && 'bg-sky-200/60 text-sky-900 border-sky-400',
  series === 3 && 'bg-pink-100 text-pink-900 border-pink-400',
  series === 4 && 'bg-orange-100 text-orange-900 border-orange-400',
);

/** 未選択チップのチェックボックス枠色。淡い地の上でも枠として見える濃さにする。 */
const seriesCheckboxBorderClass = (series: number) => clsx(
  series === 1 && 'border-green-500',
  series === 2 && 'border-sky-500',
  series === 3 && 'border-pink-500',
  series === 4 && 'border-orange-500',
);

/** 選択時チェックマークの色（白地の箱の上に置くシリーズ色）。 */
const seriesCheckColorClass = (series: number) => clsx(
  series === 1 && 'text-green-600',
  series === 2 && 'text-sky-600',
  series === 3 && 'text-pink-600',
  series === 4 && 'text-orange-600',
);

/** 絞り込みチップの配色。未選択は淡いフラット、選択中は濃いフラット。 */
const seriesChipClass = (series: number, selected: boolean) =>
  selected
    ? clsx(
        series === 1 && 'bg-green-500 border-green-600',
        series === 2 && 'bg-sky-500 border-sky-600',
        series === 3 && 'bg-pink-500 border-pink-600',
        series === 4 && 'bg-orange-500 border-orange-600',
      )
    : clsx(
        seriesPaleClass(series),
        series === 1 && 'hover:bg-green-200',
        series === 2 && 'hover:bg-sky-200',
        series === 3 && 'hover:bg-pink-200',
        series === 4 && 'hover:bg-orange-200',
      );

export default CharacterPickerDialog;
