import clsx from 'clsx';

/**
 * キャラ選択セルの共通スタイル。
 * 投票（トグルボタン）と分析（遷移リンク）でセルの「中身」は違うが、
 * 見た目（サイズ・シリーズ色）は揃えたいので、ここに集約する。
 *
 * シリーズ色は Header のハート（GS1=green / GS2=blue / GS3=pink / GS4=orange）に対応。
 * グラデーションは「ゲーム画面風の重要ボタン」である GSButton 専用の装飾なので
 * ここでは使わず、フラットな塗りで表現する。
 * - 非選択セル: 白ベース + シリーズ色の左アクセントバー
 *   （検索結果などシリーズ横断の一覧でも所属シリーズが色で分かる）
 * - 選択（選択済み / 現在地）セル: シリーズ色のフラットな塗り + 白文字
 */

/** セルの基本クラス（button / a 共通）。 */
export const characterCellBaseClass = clsx(
  'relative w-full min-h-11 rounded-lg border px-1 py-2',
  'flex items-center justify-center text-center',
  'transition-colors',
);

/** 非アクティブセル: 白ベース + シリーズ色の左アクセントバー。 */
export const characterCellIdleClass = (series: number) => clsx(
  'border-slate-800 bg-white/60 hover:bg-white',
  'border-l-4',
  series === 1 && 'border-l-green-400',
  series === 2 && 'border-l-sky-400',
  series === 3 && 'border-l-pink-400',
  series === 4 && 'border-l-orange-400',
);

/** アクティブ（選択済み / 現在地）セルのシリーズ別アクセント色。 */
export const seriesActiveClass = (series: number) => clsx(
  'text-white font-bold',
  series === 1 && 'bg-green-500 border-green-600',
  series === 2 && 'bg-sky-500 border-sky-600',
  series === 3 && 'bg-pink-500 border-pink-600',
  series === 4 && 'bg-orange-500 border-orange-600',
);

/** 長い複合名（・入り）はフォントを一段小さく。 */
export const characterNameSizeClass = (name: string) =>
  name.includes('・') ? 'text-xs' : 'text-sm';
