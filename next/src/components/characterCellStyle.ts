import clsx from 'clsx';

/**
 * キャラ選択セルの共通スタイル。
 * 投票（トグルボタン）と分析（遷移リンク）でセルの「中身」は違うが、
 * 見た目（サイズ・シリーズ色）は揃えたいので、ここに集約する。
 */

/** セルの基本クラス（button / a 共通）。 */
export const characterCellBaseClass = clsx(
  'relative w-full min-h-11 rounded-lg border px-1 py-2',
  'flex items-center justify-center text-center',
);

/** 非アクティブセルの既定色。 */
export const characterCellIdleClass = 'border-slate-700 bg-black/20 hover:bg-white/5';

/** アクティブ（選択済み / 現在地）セルのシリーズ別アクセント色。 */
export const seriesActiveClass = (series: number) => clsx(
  'text-black',
  series === 1 && 'bg-emerald-200 border-emerald-500',
  series === 2 && 'bg-sky-200 border-sky-500',
  series === 3 && 'bg-pink-200 border-pink-500',
  series === 4 && 'bg-orange-200 border-orange-500',
);

/** 長い複合名（・入り）はフォントを一段小さく。 */
export const characterNameSizeClass = (name: string) =>
  name.includes('・') ? 'text-xs' : 'text-sm';
